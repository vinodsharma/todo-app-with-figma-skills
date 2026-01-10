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

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // Find todos to archive (only non-archived, top-level todos owned by user)
      const todos = await tx.todo.findMany({
        where: {
          id: { in: ids },
          userId: session.user.id,
          archivedAt: null,
          parentId: null, // Only top-level todos
        },
      });

      if (todos.length === 0) {
        return { archived: 0, todos: [] };
      }

      const validIds = todos.map((t) => t.id);

      // Archive the todos
      await tx.todo.updateMany({
        where: { id: { in: validIds } },
        data: { archivedAt: now },
      });

      // Also archive all subtasks of these todos
      await tx.todo.updateMany({
        where: { parentId: { in: validIds } },
        data: { archivedAt: now },
      });

      // Log activity for each archived todo
      for (const todo of todos) {
        await logActivity({
          entityType: 'TODO',
          entityId: todo.id,
          entityTitle: todo.title,
          action: 'ARCHIVE',
          beforeState: { archivedAt: null },
          afterState: { archivedAt: now.toISOString() },
          userId: session.user.id,
        });
      }

      // Return updated todos
      const archivedTodos = await tx.todo.findMany({
        where: { id: { in: validIds } },
        include: { category: true },
      });

      return { archived: todos.length, todos: archivedTodos };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in bulk archive:', error);
    return NextResponse.json(
      { error: 'Failed to archive todos' },
      { status: 500 }
    );
  }
}
