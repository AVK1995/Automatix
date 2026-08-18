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
        const { nodeId, fileType, sizeMB } = payload;
        const type = fileType?.startsWith('video/') ? 'VIDEO' : 'IMAGE';

        // Check user limits
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { maxImages: true, maxImageMB: true, maxVideos: true, maxVideoMB: true }
        });

        if (!user) throw new Error('User not found');

        if (type === 'VIDEO' && sizeMB > user.maxVideoMB) {
          throw new Error(`Video exceeds maximum size of ${user.maxVideoMB}MB`);
        }
        if (type === 'IMAGE' && sizeMB > user.maxImageMB) {
          throw new Error(`Image exceeds maximum size of ${user.maxImageMB}MB`);
        }

        const currentCount = await prisma.media.count({
          where: { userId, type }
        });

        if (type === 'VIDEO' && currentCount >= user.maxVideos) {
          throw new Error(`QUOTA_EXCEEDED:Video limit reached. Please upgrade your storage.`);
        }
        if (type === 'IMAGE' && currentCount >= user.maxImages) {
          throw new Error(`QUOTA_EXCEEDED:Image limit reached. Please upgrade your storage.`);
        }

        const filename = `${userId}/${Date.now()}-${pathname}`;

        // Return token parameters
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm'],
          tokenPayload: JSON.stringify({ userId, nodeId, type, sizeMB }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const { userId, nodeId, type, sizeMB } = JSON.parse(tokenPayload);

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
