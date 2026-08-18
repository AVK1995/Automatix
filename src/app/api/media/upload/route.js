import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { put, del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const formData = await req.formData();
    const file = formData.get('file');
    const nodeId = formData.get('nodeId');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Determine type
    const isVideo = file.type.startsWith('video/');
    const type = isVideo ? 'VIDEO' : 'IMAGE';
    
    const sizeMB = file.size / (1024 * 1024);

    // Fetch user limits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { maxImages: true, maxImageMB: true, maxVideos: true, maxVideoMB: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check size limit
    if (type === 'VIDEO' && sizeMB > user.maxVideoMB) {
      return NextResponse.json({ error: `Video exceeds maximum size of ${user.maxVideoMB}MB` }, { status: 400 });
    }
    if (type === 'IMAGE' && sizeMB > user.maxImageMB) {
      return NextResponse.json({ error: `Image exceeds maximum size of ${user.maxImageMB}MB` }, { status: 400 });
    }

    // Auto-replace logic: If a nodeId is provided, check if media already exists for this node
    if (nodeId) {
      const existingMedia = await prisma.media.findFirst({
        where: { userId, nodeId }
      });
      
      if (existingMedia) {
        // Delete from Vercel Blob
        try {
          await del(existingMedia.url);
        } catch (e) {
          console.error("Failed to delete old blob:", e);
        }
        // Delete from DB
        await prisma.media.delete({ where: { id: existingMedia.id } });
      }
    }

    // Check count limit
    const currentCount = await prisma.media.count({
      where: { userId, type }
    });

    if (type === 'VIDEO' && currentCount >= user.maxVideos) {
      return NextResponse.json({ error: `Video limit reached (${user.maxVideos}/${user.maxVideos}). Please upgrade your storage.` }, { status: 403 });
    }
    if (type === 'IMAGE' && currentCount >= user.maxImages) {
      return NextResponse.json({ error: `Image limit reached (${user.maxImages}/${user.maxImages}). Please upgrade your storage.` }, { status: 403 });
    }

    // Upload to Vercel Blob
    const filename = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const blob = await put(filename, file, { access: 'public' });

    // Save to DB
    const media = await prisma.media.create({
      data: {
        url: blob.url,
        userId,
        nodeId,
        sizeMB,
        type
      }
    });

    return NextResponse.json({ success: true, url: blob.url, media });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
