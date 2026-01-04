import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Priority } from '@prisma/client';

// Priority values for sorting (HIGH > MEDIUM > LOW)
const PRIORITY_ORDER: Record<Priority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

// Valid sort fields and directions
type SortField = 'priority' | 'dueDate' | 'createdAt' | 'title';
type SortDirection = 'asc' | 'desc';

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
    const sortBy = searchParams.get('sortBy') as SortField | null;
    const sortDirection = (searchParams.get('sortDirection') || 'desc') as SortDirection;

    // Build where clause
    const where: {
      userId: string;
      parentId?: string | null;
      categoryId?: string;
      completed?: boolean;
      priority?: Priority;
      title?: { contains: string; mode: 'insensitive' };
      AND?: Array<Record<string, unknown>>;
    } = {
      userId: session.user.id,
      parentId: null,  // Only fetch top-level todos
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

    // Build orderBy clause based on sortBy param
    // Always keep completed items last, then apply user's sort preference
    type OrderByClause = { [key: string]: 'asc' | 'desc' };
    const orderBy: OrderByClause[] = [{ completed: 'asc' }];

    // Add secondary sort based on sortBy param (priority and title are handled separately in JS)
    if (sortBy && sortBy !== 'priority' && sortBy !== 'title') {
      orderBy.push({ [sortBy]: sortDirection });
    } else if (!sortBy) {
      // Default to createdAt desc
      orderBy.push({ createdAt: 'desc' });
    }

    let todos = await prisma.todo.findMany({
      where,
      include: {
        category: true,
        subtasks: {
          orderBy: { createdAt: 'asc' },
          include: { category: true },
        },
        _count: {
          select: { subtasks: true },
        },
      },
      orderBy,
    });

    // Handle priority sorting in JavaScript (Prisma doesn't support custom enum ordering)
    if (sortBy === 'priority') {
      todos = todos.sort((a, b) => {
        // Keep completed items at the end
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        // Sort by priority
        const aVal = PRIORITY_ORDER[a.priority];
        const bVal = PRIORITY_ORDER[b.priority];
        return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
      });
    }

    // Handle title sorting in JavaScript for case-insensitive comparison
    if (sortBy === 'title') {
      todos = todos.sort((a, b) => {
        // Keep completed items at the end
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        // Case-insensitive alphabetical sort
        const comparison = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

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
    const { title, description, priority, dueDate, categoryId, parentId, recurrenceRule, recurrenceEnd } = body;

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

    if (recurrenceRule) {
      todoData.recurrenceRule = recurrenceRule;
    }

    if (recurrenceEnd) {
      todoData.recurrenceEnd = new Date(recurrenceEnd);
    }

    // Handle parentId for subtasks
    if (parentId) {
      const parent = await prisma.todo.findUnique({
        where: { id: parentId },
      });

      // Validate parent exists and belongs to user
      if (!parent || parent.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Parent todo not found' },
          { status: 404 }
        );
      }

      // Validate parent is not itself a subtask (single-level nesting only)
      if (parent.parentId !== null) {
        return NextResponse.json(
          { error: 'Cannot create subtask of a subtask (single-level nesting only)' },
          { status: 400 }
        );
      }

      todoData.parentId = parentId;
      // Inherit category from parent
      todoData.categoryId = parent.categoryId;
    } else if (categoryId) {
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
