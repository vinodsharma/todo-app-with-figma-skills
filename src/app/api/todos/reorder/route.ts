import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { todoId, newSortOrder, newCategoryId } = body;

    if (!todoId) {
      return NextResponse.json(
        { error: 'todoId is required' },
        { status: 400 }
      );
    }

    if (typeof newSortOrder !== 'number') {
      return NextResponse.json(
        { error: 'newSortOrder must be a number' },
        { status: 400 }
      );
    }

    const todo = await prisma.todo.findUnique({
      where: { id: todoId },
    });

    if (!todo || todo.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    const targetCategoryId = newCategoryId !== undefined ? newCategoryId : todo.categoryId;
    const isMovingCategory = newCategoryId !== undefined && newCategoryId !== todo.categoryId;

    const result = await prisma.$transaction(async (tx) => {
      const updateData: { sortOrder: number; categoryId?: string | null } = {
        sortOrder: newSortOrder,
      };

      if (isMovingCategory) {
        updateData.categoryId = newCategoryId;
      }

      if (todo.sortOrder < newSortOrder) {
        await tx.todo.updateMany({
          where: {
            userId: session.user.id,
            categoryId: targetCategoryId,
            parentId: null,
            sortOrder: { gt: todo.sortOrder, lte: newSortOrder },
            id: { not: todoId },
          },
          data: { sortOrder: { decrement: 1 } },
        });
      } else if (todo.sortOrder > newSortOrder) {
        await tx.todo.updateMany({
          where: {
            userId: session.user.id,
            categoryId: targetCategoryId,
            parentId: null,
            sortOrder: { gte: newSortOrder, lt: todo.sortOrder },
            id: { not: todoId },
          },
          data: { sortOrder: { increment: 1 } },
        });
      }

      const updated = await tx.todo.update({
        where: { id: todoId },
        data: updateData,
        include: { category: true },
      });

      return updated;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error reordering todo:', error);
    return NextResponse.json(
      { error: 'Failed to reorder todo' },
      { status: 500 }
    );
  }
}
