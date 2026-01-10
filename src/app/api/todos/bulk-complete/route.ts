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
    const { ids, completed } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one todo ID is required' },
        { status: 400 }
      );
    }

    if (typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'Completed must be a boolean' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
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

      await tx.todo.updateMany({
        where: {
          id: { in: validIds },
        },
        data: { completed },
      });

      const action = completed ? 'COMPLETE' : 'UNCOMPLETE';
      for (const todo of todos) {
        await logActivity({
          entityType: 'TODO',
          entityId: todo.id,
          entityTitle: todo.title,
          action,
          beforeState: { completed: todo.completed },
          afterState: { completed },
          userId: session.user.id,
        });
      }

      const updatedTodos = await tx.todo.findMany({
        where: { id: { in: validIds } },
        include: { category: true },
      });

      return { updated: todos.length, todos: updatedTodos };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in bulk complete:', error);
    return NextResponse.json(
      { error: 'Failed to complete todos' },
      { status: 500 }
    );
  }
}
