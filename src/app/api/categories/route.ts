import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-logger';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const categories = await prisma.category.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            todos: true,
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, color } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Check for duplicate category name for this user
    const existingCategory = await prisma.category.findUnique({
      where: {
        userId_name: {
          userId: session.user.id,
          name: name.trim(),
        },
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 400 }
      );
    }

    // Shift existing categories down
    await prisma.category.updateMany({
      where: { userId: session.user.id },
      data: { sortOrder: { increment: 1 } },
    });

    // Create category with default color if not provided
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        color: color || '#6b7280',
        userId: session.user.id,
        sortOrder: 0,
      },
      include: {
        _count: {
          select: {
            todos: true,
          },
        },
      },
    });

    // Log activity
    await logActivity({
      entityType: 'CATEGORY',
      entityId: category.id,
      entityTitle: category.name,
      action: 'CREATE',
      afterState: {
        id: category.id,
        name: category.name,
        color: category.color,
      },
      userId: session.user.id,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
