import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const cursor = searchParams.get('cursor');
    const entityType = searchParams.get('entityType');
    const action = searchParams.get('action');

    // Build where clause
    const where: {
      userId: string;
      entityType?: string;
      action?: string;
      createdAt?: { lt: Date };
    } = {
      userId: session.user.id,
    };

    if (entityType) {
      where.entityType = entityType;
    }

    if (action) {
      where.action = action;
    }

    // Cursor-based pagination
    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    const activities = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Fetch one extra to determine if there's more
    });

    // Determine if there's a next page
    let nextCursor: string | undefined;
    if (activities.length > limit) {
      const nextItem = activities.pop();
      nextCursor = nextItem?.createdAt.toISOString();
    }

    return NextResponse.json({
      activities,
      nextCursor,
    });
  } catch (error) {
    console.error('Error fetching activity log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity log' },
      { status: 500 }
    );
  }
}
