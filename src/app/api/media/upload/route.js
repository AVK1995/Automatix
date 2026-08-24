import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { handleUpload } from '@vercel/blob/client';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const body = await request.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await auth();
        if (!session?.user?.id) {
          throw new Error('Unauthorized');
        }
        
        const userId = session.user.id;
        const payload = JSON.parse(clientPayload || '{}');
        const { nodeId, fileType, sizeMB, originalName } = payload;
        
        const isDoc = fileType?.includes('pdf') || fileType?.includes('csv') || fileType?.includes('sheet') || fileType?.includes('excel') || fileType?.includes('word') || fileType?.includes('presentation') || fileType?.includes('text/plain') || originalName?.match(/\.(pdf|csv|xlsx|xls|docx|doc|pptx|ppt|txt)$/i);
        const isVideo = !isDoc && (fileType?.startsWith('video/') || originalName?.match(/\.(mp4|mov|webm)$/i));
        const type = isDoc ? 'DOCUMENT' : isVideo ? 'VIDEO' : 'IMAGE';

        // Check user limits
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { maxImages: true, maxImageMB: true, maxVideos: true, maxVideoMB: true, maxDocs: true, maxDocMB: true, maxStorageMB: true }
        });

        if (!user) throw new Error('User not found');

        // 1. Individual Size Check
        if (type === 'VIDEO' && sizeMB > user.maxVideoMB) {
          throw new Error(`QUOTA_EXCEEDED:Video exceeds maximum size of ${user.maxVideoMB}MB`);
        }
        if (type === 'IMAGE' && sizeMB > user.maxImageMB) {
          throw new Error(`QUOTA_EXCEEDED:Image exceeds maximum size of ${user.maxImageMB}MB`);
        }
        if (type === 'DOCUMENT' && sizeMB > (user.maxDocMB || 10)) {
          throw new Error(`QUOTA_EXCEEDED:Document exceeds maximum size of ${user.maxDocMB || 10}MB`);
        }

        // Fetch current media usage
        const userMedia = await prisma.media.findMany({
          where: { userId },
          select: { sizeMB: true, type: true }
        });

        const currentVideoCount = userMedia.filter(m => m.type === 'VIDEO').length;
        const currentImageCount = userMedia.filter(m => m.type === 'IMAGE').length;
        const currentDocCount = userMedia.filter(m => m.type === 'DOCUMENT').length;
        const totalStorageUsedMB = userMedia.reduce((sum, media) => sum + media.sizeMB, 0);

        // 2. Count Check
        if (type === 'VIDEO' && currentVideoCount >= user.maxVideos) {
          throw new Error(`QUOTA_EXCEEDED:Video limit reached (${currentVideoCount}/${user.maxVideos}).`);
        }
        if (type === 'IMAGE' && currentImageCount >= user.maxImages) {
          throw new Error(`QUOTA_EXCEEDED:Image limit reached (${currentImageCount}/${user.maxImages}).`);
        }
        if (type === 'DOCUMENT' && currentDocCount >= (user.maxDocs || 10)) {
          throw new Error(`QUOTA_EXCEEDED:Document limit reached (${currentDocCount}/${user.maxDocs || 10}).`);
        }

        // 3. Total Storage Check
        if (totalStorageUsedMB + sizeMB > user.maxStorageMB) {
          throw new Error(`QUOTA_EXCEEDED:Total storage limit reached. You have ${(user.maxStorageMB - totalStorageUsedMB).toFixed(1)}MB remaining.`);
        }

        // 4. Global Platform Safety Guard (Keep overall Vercel Blob usage below 950MB)
        const allMedia = await prisma.media.findMany({ select: { sizeMB: true } });
        const totalPlatformStorageMB = allMedia.reduce((sum, m) => sum + (m.sizeMB || 0), 0);
        if (totalPlatformStorageMB + sizeMB > 950) {
          throw new Error('QUOTA_EXCEEDED:Platform storage is temporarily full. Please contact support.');
        }

        // Sanitize filename
        const safeName = (originalName || pathname).replace(/[^a-zA-Z0-9.]/g, '_');
        const filename = `${userId}/${Date.now()}-${safeName}`;

        // Return token parameters
        return {
          allowedContentTypes: [
            'image/jpeg', 'image/png', 'image/webp', 'image/gif', 
            'video/mp4', 'video/quicktime', 'video/webm',
            'application/pdf', 'text/csv', 'text/plain',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          ],
          tokenPayload: JSON.stringify({ userId, nodeId, type, sizeMB, originalName }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const { userId, nodeId, type, sizeMB, originalName } = JSON.parse(tokenPayload);

        try {
          if (nodeId) {
            const existingMedia = await prisma.media.findFirst({
              where: { userId, nodeId }
            });
            if (existingMedia) {
              try { await del(existingMedia.url); } catch(e) { console.error('Delete old blob failed', e); }
              await prisma.media.delete({ where: { id: existingMedia.id } });
            }
          }

          await prisma.media.create({
            data: {
              url: blob.url,
              fileName: originalName || null,
              userId,
              nodeId,
              sizeMB,
              type
            }
          });
        } catch (error) {
          throw new Error('Could not update database');
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
