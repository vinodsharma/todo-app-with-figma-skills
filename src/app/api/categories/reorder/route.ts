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
    const { categoryId, newSortOrder } = body;

    if (!categoryId) {
      return NextResponse.json(
        { error: 'categoryId is required' },
        { status: 400 }
      );
    }

    if (typeof newSortOrder !== 'number') {
      return NextResponse.json(
        { error: 'newSortOrder must be a number' },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category || category.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      if (category.sortOrder < newSortOrder) {
        await tx.category.updateMany({
          where: {
            userId: session.user.id,
            sortOrder: { gt: category.sortOrder, lte: newSortOrder },
            id: { not: categoryId },
          },
          data: { sortOrder: { decrement: 1 } },
        });
      } else if (category.sortOrder > newSortOrder) {
        await tx.category.updateMany({
          where: {
            userId: session.user.id,
            sortOrder: { gte: newSortOrder, lt: category.sortOrder },
            id: { not: categoryId },
          },
          data: { sortOrder: { increment: 1 } },
        });
      }

      const updated = await tx.category.update({
        where: { id: categoryId },
        data: { sortOrder: newSortOrder },
        include: { _count: { select: { todos: true } } },
      });

      return updated;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error reordering category:', error);
    return NextResponse.json(
      { error: 'Failed to reorder category' },
      { status: 500 }
    );
  }
}
