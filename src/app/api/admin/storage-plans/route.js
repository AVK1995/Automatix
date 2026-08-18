import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const plans = await prisma.storagePlan.findMany({ orderBy: { priceRs: 'asc' } });
    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    const plan = await prisma.storagePlan.create({
      data: {
        name: data.name,
        priceRs: data.priceRs,
        maxVideos: data.maxVideos,
        maxVideoMB: data.maxVideoMB,
        maxImages: data.maxImages,
        maxImageMB: data.maxImageMB,
        maxStorageMB: data.maxStorageMB
      }
    });
    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    const plan = await prisma.storagePlan.update({
      where: { id: data.id },
      data: {
        name: data.name,
        priceRs: data.priceRs,
        maxVideos: data.maxVideos,
        maxVideoMB: data.maxVideoMB,
        maxImages: data.maxImages,
        maxImageMB: data.maxImageMB,
        maxStorageMB: data.maxStorageMB
      }
    });
    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    await prisma.storagePlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
