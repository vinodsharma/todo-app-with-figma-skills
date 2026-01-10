import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-logger';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one todo ID is required' },
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
        include: { category: true },
      });

      if (todos.length === 0) {
        return { deleted: 0, deletedTodos: [] };
      }

      const validIds = todos.map((t) => t.id);

      // Log activity BEFORE deletion for each todo
      for (const todo of todos) {
        await logActivity({
          entityType: 'TODO',
          entityId: todo.id,
          entityTitle: todo.title,
          action: 'DELETE',
          beforeState: {
            id: todo.id,
            title: todo.title,
            completed: todo.completed,
            priority: todo.priority,
            dueDate: todo.dueDate,
            categoryId: todo.categoryId,
          },
          afterState: undefined,
          userId: session.user.id,
        });
      }

      // Delete the todos
      await tx.todo.deleteMany({
        where: {
          id: { in: validIds },
        },
      });

      return { deleted: todos.length, deletedTodos: todos };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in bulk delete:', error);
    return NextResponse.json(
      { error: 'Failed to delete todos' },
      { status: 500 }
    );
  }
}
