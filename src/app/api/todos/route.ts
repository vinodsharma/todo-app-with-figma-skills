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
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const dueDate = searchParams.get('dueDate');

    // Build where clause
    const where: {
      userId: string;
      categoryId?: string;
      completed?: boolean;
      priority?: Priority;
      title?: { contains: string; mode: 'insensitive' };
      AND?: Array<Record<string, unknown>>;
    } = {
      userId: session.user.id,
    };

    // Search filter - case-insensitive title search
    if (search && search.trim()) {
      where.title = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    // Category filter
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Status filter (active/completed)
    if (status === 'active') {
      where.completed = false;
    } else if (status === 'completed') {
      where.completed = true;
    }

    // Priority filter
    if (priority && ['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
      where.priority = priority as Priority;
    }

    // Due date filter
    if (dueDate) {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(startOfToday);
      endOfToday.setDate(endOfToday.getDate() + 1);

      const endOfWeek = new Date(startOfToday);
      endOfWeek.setDate(endOfWeek.getDate() + 7);

      switch (dueDate) {
        case 'overdue':
          // Overdue: dueDate < today AND not completed
          where.AND = [
            { dueDate: { lt: startOfToday } },
            { dueDate: { not: null } },
            { completed: false },
          ];
          break;
        case 'today':
          // Today: dueDate is today
          where.AND = [
            { dueDate: { gte: startOfToday } },
            { dueDate: { lt: endOfToday } },
          ];
          break;
        case 'week':
          // This week: dueDate within next 7 days
          where.AND = [
            { dueDate: { gte: startOfToday } },
            { dueDate: { lt: endOfWeek } },
          ];
          break;
        case 'upcoming':
          // Upcoming: dueDate > today
          where.AND = [
            { dueDate: { gte: endOfToday } },
          ];
          break;
      }
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
    const { title, description, priority, dueDate, categoryId } = body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Validate description length if provided (max 1000 chars)
    if (description && typeof description === 'string' && description.length > 1000) {
      return NextResponse.json(
        { error: 'Description cannot exceed 1000 characters' },
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

    if (description !== undefined) {
      todoData.description = description ? description.trim() : null;
    }

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
