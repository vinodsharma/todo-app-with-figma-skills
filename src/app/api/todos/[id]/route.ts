import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Priority } from '@prisma/client';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: todoId } = await params;

    // Verify todo exists and belongs to current user
    const existingTodo = await prisma.todo.findFirst({
      where: {
        id: todoId,
        userId: session.user.id,
      },
    });

    if (!existingTodo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description, completed, priority, dueDate, categoryId } = body;

    // Build update data object
    const updateData: any = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return NextResponse.json(
          { error: 'Title cannot be empty' },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      // Validate description length (max 1000 chars)
      if (description !== null && typeof description === 'string' && description.length > 1000) {
        return NextResponse.json(
          { error: 'Description cannot exceed 1000 characters' },
          { status: 400 }
        );
      }
      updateData.description = description ? description.trim() : null;
    }

    if (completed !== undefined) {
      if (typeof completed !== 'boolean') {
        return NextResponse.json(
          { error: 'Completed must be a boolean' },
          { status: 400 }
        );
      }
      updateData.completed = completed;
    }

    if (priority !== undefined) {
      if (!['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
        return NextResponse.json(
          { error: 'Invalid priority value' },
          { status: 400 }
        );
      }
      updateData.priority = priority as Priority;
    }

    if (dueDate !== undefined) {
      if (dueDate === null) {
        updateData.dueDate = null;
      } else {
        updateData.dueDate = new Date(dueDate);
      }
    }

    if (categoryId !== undefined) {
      if (categoryId === null) {
        updateData.categoryId = null;
      } else {
        updateData.categoryId = categoryId;
      }
    }

    // Update the todo
    const updatedTodo = await prisma.todo.update({
      where: {
        id: todoId,
      },
      data: updateData,
      include: {
        category: true,
      },
    });

    return NextResponse.json(updatedTodo);
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json(
      { error: 'Failed to update todo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: todoId } = await params;

    // Verify todo exists and belongs to current user
    const existingTodo = await prisma.todo.findFirst({
      where: {
        id: todoId,
        userId: session.user.id,
      },
    });

    if (!existingTodo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    // Delete the todo
    await prisma.todo.delete({
      where: {
        id: todoId,
      },
    });

    return NextResponse.json(
      { success: true, message: 'Todo deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json(
      { error: 'Failed to delete todo' },
      { status: 500 }
    );
  }
}
