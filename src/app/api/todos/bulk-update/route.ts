import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-logger';

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
type Priority = (typeof VALID_PRIORITIES)[number];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ids, categoryId, priority } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one todo ID is required' },
        { status: 400 }
      );
    }

    // Check if at least one update field is provided
    const hasCategoryUpdate = 'categoryId' in body;
    const hasPriorityUpdate = 'priority' in body;

    if (!hasCategoryUpdate && !hasPriorityUpdate) {
      return NextResponse.json(
        { error: 'At least one update field (categoryId or priority) is required' },
        { status: 400 }
      );
    }

    // Validate priority value if provided
    if (hasPriorityUpdate && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { error: 'Priority must be LOW, MEDIUM, or HIGH' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Find all todos that belong to the user
      const todos = await tx.todo.findMany({
        where: {
          id: { in: ids },
          userId: session.user.id,
        },
      });

      if (todos.length === 0) {
        return { updated: 0, todos: [] };
      }

      const validIds = todos.map((t) => t.id);

      // Build update data
      const updateData: { categoryId?: string | null; priority?: Priority } = {};
      if (hasCategoryUpdate) {
        updateData.categoryId = categoryId;
      }
      if (hasPriorityUpdate) {
        updateData.priority = priority as Priority;
      }

      // Update the todos
      await tx.todo.updateMany({
        where: {
          id: { in: validIds },
        },
        data: updateData,
      });

      // Log activity for each todo
      for (const todo of todos) {
        const beforeState: Record<string, unknown> = {};
        const afterState: Record<string, unknown> = {};

        if (hasCategoryUpdate) {
          beforeState.categoryId = todo.categoryId;
          afterState.categoryId = categoryId;
        }
        if (hasPriorityUpdate) {
          beforeState.priority = todo.priority;
          afterState.priority = priority;
        }

        await logActivity({
          entityType: 'TODO',
          entityId: todo.id,
          entityTitle: todo.title,
          action: 'UPDATE',
          beforeState,
          afterState,
          userId: session.user.id,
        });
      }

      // Fetch updated todos with category relation
      const updatedTodos = await tx.todo.findMany({
        where: { id: { in: validIds } },
        include: { category: true },
      });

      return { updated: todos.length, todos: updatedTodos };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in bulk update:', error);
    return NextResponse.json(
      { error: 'Failed to update todos' },
      { status: 500 }
    );
  }
}
