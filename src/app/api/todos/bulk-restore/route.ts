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
      // Find todos to restore (only archived, top-level todos owned by user)
      const todos = await tx.todo.findMany({
        where: {
          id: { in: ids },
          userId: session.user.id,
          archivedAt: { not: null },
          parentId: null,
        },
      });

      if (todos.length === 0) {
        return { restored: 0, todos: [] };
      }

      const validIds = todos.map((t) => t.id);

      // Restore the todos
      await tx.todo.updateMany({
        where: { id: { in: validIds } },
        data: { archivedAt: null },
      });

      // Also restore all subtasks of these todos
      await tx.todo.updateMany({
        where: { parentId: { in: validIds } },
        data: { archivedAt: null },
      });

      // Log activity for each restored todo
      for (const todo of todos) {
        await logActivity({
          entityType: 'TODO',
          entityId: todo.id,
          entityTitle: todo.title,
          action: 'RESTORE',
          beforeState: { archivedAt: todo.archivedAt?.toISOString() },
          afterState: { archivedAt: null },
          userId: session.user.id,
        });
      }

      // Return updated todos
      const restoredTodos = await tx.todo.findMany({
        where: { id: { in: validIds } },
        include: { category: true },
      });

      return { restored: todos.length, todos: restoredTodos };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in bulk restore:', error);
    return NextResponse.json(
      { error: 'Failed to restore todos' },
      { status: 500 }
    );
  }
}
