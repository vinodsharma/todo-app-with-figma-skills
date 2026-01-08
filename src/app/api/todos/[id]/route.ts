import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Priority } from '@prisma/client';
import { getNextOccurrence } from '@/lib/recurrence';
import { logActivity } from '@/lib/activity-logger';

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

    // Capture before state for activity log
    const beforeState = {
      id: existingTodo.id,
      title: existingTodo.title,
      description: existingTodo.description,
      completed: existingTodo.completed,
      priority: existingTodo.priority,
      dueDate: existingTodo.dueDate?.toISOString() || null,
      categoryId: existingTodo.categoryId,
    };

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

      // If completing a recurring todo, create the next occurrence
      if (completed === true && existingTodo.recurrenceRule) {
        const nextDate = getNextOccurrence(
          existingTodo.recurrenceRule,
          existingTodo.dueDate || new Date(),
          existingTodo.recurrenceEnd
        );

        if (nextDate) {
          // Create new todo with same properties and next due date
          await prisma.todo.create({
            data: {
              title: existingTodo.title,
              description: existingTodo.description,
              priority: existingTodo.priority,
              categoryId: existingTodo.categoryId,
              userId: existingTodo.userId,
              dueDate: nextDate,
              recurrenceRule: existingTodo.recurrenceRule,
              recurrenceEnd: existingTodo.recurrenceEnd,
              completed: false,
            },
          });
        }
      }
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

    if (body.recurrenceRule !== undefined) {
      updateData.recurrenceRule = body.recurrenceRule;
    }

    if (body.recurrenceEnd !== undefined) {
      updateData.recurrenceEnd = body.recurrenceEnd ? new Date(body.recurrenceEnd) : null;
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

    // Determine action type
    let action: 'UPDATE' | 'COMPLETE' | 'UNCOMPLETE' = 'UPDATE';
    if (completed !== undefined) {
      action = completed ? 'COMPLETE' : 'UNCOMPLETE';
    }

    // Log activity
    await logActivity({
      entityType: 'TODO',
      entityId: updatedTodo.id,
      entityTitle: updatedTodo.title,
      action,
      beforeState,
      afterState: {
        id: updatedTodo.id,
        title: updatedTodo.title,
        description: updatedTodo.description,
        completed: updatedTodo.completed,
        priority: updatedTodo.priority,
        dueDate: updatedTodo.dueDate?.toISOString() || null,
        categoryId: updatedTodo.categoryId,
      },
      userId: session.user.id,
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

    // Log activity before deletion
    await logActivity({
      entityType: 'TODO',
      entityId: existingTodo.id,
      entityTitle: existingTodo.title,
      action: 'DELETE',
      beforeState: {
        id: existingTodo.id,
        title: existingTodo.title,
        description: existingTodo.description,
        completed: existingTodo.completed,
        priority: existingTodo.priority,
        dueDate: existingTodo.dueDate?.toISOString() || null,
        categoryId: existingTodo.categoryId,
      },
      userId: session.user.id,
    });

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
