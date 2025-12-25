import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Priority } from '@prisma/client';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const completed = searchParams.get('completed');
    const priority = searchParams.get('priority');

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (completed !== null && completed !== undefined) {
      where.completed = completed === 'true';
    }

    if (priority && ['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
      where.priority = priority as Priority;
    }

    const todos = await prisma.todo.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [
        { completed: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
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
    const { title, priority, dueDate, categoryId } = body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (priority && !['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority value' },
        { status: 400 }
      );
    }

    // Build todo data
    const todoData: any = {
      title: title.trim(),
      userId: session.user.id,
    };

    if (priority) {
      todoData.priority = priority as Priority;
    }

    if (dueDate) {
      todoData.dueDate = new Date(dueDate);
    }

    if (categoryId) {
      todoData.categoryId = categoryId;
    }

    const todo = await prisma.todo.create({
      data: todoData,
      include: {
        category: true,
      },
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    );
  }
}
