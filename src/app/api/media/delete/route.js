import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { mediaId } = body;

    if (!mediaId) {
      return NextResponse.json({ error: 'No mediaId provided' }, { status: 400 });
    }

    const existingMedia = await prisma.media.findUnique({
      where: { id: mediaId }
    });

    if (!existingMedia || existingMedia.userId !== userId) {
      return NextResponse.json({ error: 'Media not found or unauthorized' }, { status: 404 });
    }

    if (existingMedia.nodeId && existingMedia.nodeId.startsWith('wf_trigger_')) {
      return NextResponse.json({ 
        error: 'This file is locked by an active workflow trigger. It will automatically update when new files are uploaded, or can be freed by deleting the workflow.' 
      }, { status: 400 });
    }

    // Delete from Vercel Blob
    try {
      await del(existingMedia.url);
    } catch (e) {
      console.error("Failed to delete blob:", e);
    }

    // Delete from DB
    await prisma.media.delete({ where: { id: mediaId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
