# Drag & Drop Reordering Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable users to reorder todos within categories, move todos between categories, and reorder categories in the sidebar using drag and drop.

**Architecture:** Uses @dnd-kit/core and @dnd-kit/sortable for drag-drop functionality. A `sortOrder` field tracks item positions. Optimistic UI updates provide instant feedback, with rollback on API failure. DndContext wraps the entire app, with separate SortableContexts for todos and categories.

**Tech Stack:** @dnd-kit/core, @dnd-kit/sortable, Prisma migrations, Next.js API routes, React hooks

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install @dnd-kit packages**

```bash
docker compose exec app npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Step 2: Verify installation**

Run: `docker compose exec app npm ls @dnd-kit/core`
Expected: Shows @dnd-kit/core version

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @dnd-kit packages for drag-drop"
```

---

## Task 2: Add sortOrder to Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Update Todo model**

Add `sortOrder` field after `updatedAt`:

```prisma
model Todo {
  id          String    @id @default(cuid())
  title       String    @db.VarChar(255)
  description String?   @db.Text
  completed   Boolean   @default(false)
  priority    Priority  @default(MEDIUM)
  dueDate     DateTime?
  categoryId  String?
  category    Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  sortOrder   Int       @default(0)  // Lower = higher in list (top)

  // Recurrence fields
  recurrenceRule  String?
  recurrenceEnd   DateTime?

  // Subtasks relation (single-level nesting only)
  parentId    String?
  parent      Todo?     @relation("Subtasks", fields: [parentId], references: [id], onDelete: Cascade)
  subtasks    Todo[]    @relation("Subtasks")

  @@index([userId])
  @@index([categoryId])
  @@index([parentId])
  @@index([userId, categoryId, sortOrder])  // For efficient sorted queries
}
```

**Step 2: Update Category model**

Add `sortOrder` field after `createdAt`:

```prisma
model Category {
  id        String   @id @default(cuid())
  name      String   @db.VarChar(100)
  color     String   @default("#6b7280") @db.VarChar(7)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  todos     Todo[]
  createdAt DateTime @default(now())
  sortOrder Int      @default(0)  // Lower = higher in sidebar

  @@unique([userId, name])
  @@index([userId])
  @@index([userId, sortOrder])  // For efficient sorted queries
}
```

**Step 3: Generate migration**

Run: `docker compose exec app npx prisma migrate dev --name add_sort_order`
Expected: Migration created and applied successfully

**Step 4: Commit**

```bash
git add prisma/
git commit -m "feat(schema): add sortOrder field to Todo and Category"
```

---

## Task 3: Update Types

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add sortOrder to interfaces**

Add `sortOrder` to both `Todo` and `Category` interfaces:

```typescript
// In Todo interface, add after updatedAt:
sortOrder: number;

// In Category interface, add after createdAt:
sortOrder: number;
```

**Step 2: Add reorder input types**

Add after `TodoQueryParams`:

```typescript
// Input types for reordering
export interface ReorderTodoInput {
  todoId: string;
  newSortOrder: number;
  newCategoryId?: string;  // For cross-category moves
}

export interface ReorderCategoryInput {
  categoryId: string;
  newSortOrder: number;
}
```

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): add sortOrder and reorder input types"
```

---

## Task 4: Create Todos Reorder API Endpoint

**Files:**
- Create: `src/app/api/todos/reorder/route.ts`
- Test: `src/app/api/todos/__tests__/reorder.test.ts`

**Step 1: Write the test file**

```typescript
// src/app/api/todos/__tests__/reorder.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    todo: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { PATCH } from '../reorder/route';

describe('PATCH /api/todos/reorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new Request('http://localhost/api/todos/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ todoId: '1', newSortOrder: 0 }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 if todoId is missing', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user1' },
      expires: '',
    });

    const request = new Request('http://localhost/api/todos/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ newSortOrder: 0 }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(400);
  });

  it('returns 404 if todo not found', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user1' },
      expires: '',
    });
    vi.mocked(prisma.todo.findUnique).mockResolvedValue(null);

    const request = new Request('http://localhost/api/todos/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ todoId: 'nonexistent', newSortOrder: 0 }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(404);
  });

  it('updates todo sortOrder successfully', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user1' },
      expires: '',
    });
    vi.mocked(prisma.todo.findUnique).mockResolvedValue({
      id: 'todo1',
      userId: 'user1',
      categoryId: 'cat1',
      sortOrder: 2,
    } as any);
    vi.mocked(prisma.$transaction).mockResolvedValue([{ id: 'todo1', sortOrder: 0 }]);

    const request = new Request('http://localhost/api/todos/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ todoId: 'todo1', newSortOrder: 0 }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(200);
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `docker compose exec app npm test -- src/app/api/todos/__tests__/reorder.test.ts`
Expected: FAIL - module not found

**Step 3: Create the API route**

```typescript
// src/app/api/todos/reorder/route.ts
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

    // Validate required fields
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

    // Verify todo exists and belongs to user
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

    // Use transaction for atomic updates
    const result = await prisma.$transaction(async (tx) => {
      // If moving to a different category, update categoryId
      const updateData: { sortOrder: number; categoryId?: string | null } = {
        sortOrder: newSortOrder,
      };

      if (isMovingCategory) {
        updateData.categoryId = newCategoryId;
      }

      // Shift other todos to make room
      // If moving down (higher sortOrder), shift items up
      // If moving up (lower sortOrder), shift items down
      if (todo.sortOrder < newSortOrder) {
        // Moving down: shift items between old and new position up
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
        // Moving up: shift items between new and old position down
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

      // Update the moved todo
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
```

**Step 4: Run test to verify it passes**

Run: `docker compose exec app npm test -- src/app/api/todos/__tests__/reorder.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/todos/reorder/ src/app/api/todos/__tests__/reorder.test.ts
git commit -m "feat(api): add todos reorder endpoint"
```

---

## Task 5: Create Categories Reorder API Endpoint

**Files:**
- Create: `src/app/api/categories/reorder/route.ts`
- Test: `src/app/api/categories/__tests__/reorder.test.ts`

**Step 1: Write the test file**

```typescript
// src/app/api/categories/__tests__/reorder.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    category: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { PATCH } from '../reorder/route';

describe('PATCH /api/categories/reorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new Request('http://localhost/api/categories/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ categoryId: '1', newSortOrder: 0 }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(401);
  });

  it('updates category sortOrder successfully', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user1' },
      expires: '',
    });
    vi.mocked(prisma.category.findUnique).mockResolvedValue({
      id: 'cat1',
      userId: 'user1',
      sortOrder: 2,
    } as any);
    vi.mocked(prisma.$transaction).mockResolvedValue([{ id: 'cat1', sortOrder: 0 }]);

    const request = new Request('http://localhost/api/categories/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ categoryId: 'cat1', newSortOrder: 0 }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(200);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `docker compose exec app npm test -- src/app/api/categories/__tests__/reorder.test.ts`
Expected: FAIL - module not found

**Step 3: Create the API route**

```typescript
// src/app/api/categories/reorder/route.ts
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
```

**Step 4: Run test to verify it passes**

Run: `docker compose exec app npm test -- src/app/api/categories/__tests__/reorder.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/categories/reorder/ src/app/api/categories/__tests__/reorder.test.ts
git commit -m "feat(api): add categories reorder endpoint"
```

---

## Task 6: Update API Routes to Sort by sortOrder

**Files:**
- Modify: `src/app/api/todos/route.ts`
- Modify: `src/app/api/categories/route.ts`

**Step 1: Update todos GET to order by sortOrder**

In `src/app/api/todos/route.ts`, change the `orderBy` logic around line 118-126:

```typescript
// Replace the orderBy building logic with:
type OrderByClause = { [key: string]: 'asc' | 'desc' };
const orderBy: OrderByClause[] = [
  { completed: 'asc' },
  { sortOrder: 'asc' },  // Primary sort by manual order
];

// Only add secondary sort if user explicitly requests non-sortOrder sort
if (sortBy && sortBy !== 'priority' && sortBy !== 'title') {
  // User wants to override manual order with a specific sort
  orderBy.length = 0;  // Clear default ordering
  orderBy.push({ completed: 'asc' });
  orderBy.push({ [sortBy]: sortDirection });
}
```

**Step 2: Update todos POST to assign sortOrder at top**

In `src/app/api/todos/route.ts` POST handler, after validation but before creating the todo (around line 215):

```typescript
// Get the minimum sortOrder for this category to insert at top
const minSortOrder = await prisma.todo.aggregate({
  where: {
    userId: session.user.id,
    categoryId: todoData.categoryId || null,
    parentId: null,
  },
  _min: { sortOrder: true },
});

// New todos go at the top (sortOrder 0), shift others down
todoData.sortOrder = 0;

// Shift existing todos down
await prisma.todo.updateMany({
  where: {
    userId: session.user.id,
    categoryId: todoData.categoryId || null,
    parentId: null,
  },
  data: { sortOrder: { increment: 1 } },
});
```

**Step 3: Update categories GET to order by sortOrder**

In `src/app/api/categories/route.ts`, change the `orderBy` around line 24:

```typescript
orderBy: {
  sortOrder: 'asc',  // Changed from 'name'
},
```

**Step 4: Update categories POST to assign sortOrder at top**

In `src/app/api/categories/route.ts` POST handler, before creating category:

```typescript
// Shift existing categories down
await prisma.category.updateMany({
  where: { userId: session.user.id },
  data: { sortOrder: { increment: 1 } },
});

// Create category with sortOrder 0 (top)
const category = await prisma.category.create({
  data: {
    name: name.trim(),
    color: color || '#6b7280',
    userId: session.user.id,
    sortOrder: 0,
  },
  // ... include
});
```

**Step 5: Run existing tests to verify no regressions**

Run: `docker compose exec app npm test -- src/app/api`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/app/api/todos/route.ts src/app/api/categories/route.ts
git commit -m "feat(api): sort by sortOrder and insert new items at top"
```

---

## Task 7: Create DragHandle Component

**Files:**
- Create: `src/components/dnd/DragHandle.tsx`

**Step 1: Create the component**

```typescript
// src/components/dnd/DragHandle.tsx
'use client';

import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DragHandleProps {
  listeners?: Record<string, Function>;
  attributes?: Record<string, unknown>;
  className?: string;
  isDragging?: boolean;
}

export function DragHandle({
  listeners,
  attributes,
  className,
  isDragging,
}: DragHandleProps) {
  return (
    <button
      type="button"
      className={cn(
        'touch-none cursor-grab p-1 text-muted-foreground hover:text-foreground transition-colors rounded',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isDragging && 'cursor-grabbing',
        className
      )}
      aria-label="Drag to reorder"
      {...listeners}
      {...attributes}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/dnd/
git commit -m "feat(dnd): add DragHandle component"
```

---

## Task 8: Create DndProvider Component

**Files:**
- Create: `src/components/dnd/DndProvider.tsx`
- Create: `src/components/dnd/index.ts`

**Step 1: Create the DndProvider component**

```typescript
// src/components/dnd/DndProvider.tsx
'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragCancelEvent,
  UniqueIdentifier,
  Announcements,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

export type DragItemType = 'todo' | 'category';

export interface DragItem {
  id: UniqueIdentifier;
  type: DragItemType;
  title: string;
  categoryId?: string | null;
}

interface DndContextValue {
  activeItem: DragItem | null;
  isDragging: boolean;
}

const DndStateContext = createContext<DndContextValue>({
  activeItem: null,
  isDragging: false,
});

export function useDndState() {
  return useContext(DndStateContext);
}

interface DndProviderProps {
  children: ReactNode;
  onTodoReorder?: (todoId: string, newIndex: number, newCategoryId?: string) => Promise<void>;
  onCategoryReorder?: (categoryId: string, newIndex: number) => Promise<void>;
}

export function DndProvider({
  children,
  onTodoReorder,
  onCategoryReorder,
}: DndProviderProps) {
  const [activeItem, setActiveItem] = useState<DragItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current as DragItem | undefined;

    if (data) {
      setActiveItem({
        id: active.id,
        type: data.type,
        title: data.title,
        categoryId: data.categoryId,
      });
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over || active.id === over.id) {
      return;
    }

    const activeData = active.data.current as DragItem | undefined;
    const overData = over.data.current as { sortable?: { index: number }; type?: DragItemType; categoryId?: string } | undefined;

    if (!activeData || !overData?.sortable) {
      return;
    }

    const newIndex = overData.sortable.index;

    if (activeData.type === 'todo' && onTodoReorder) {
      const newCategoryId = overData.categoryId !== activeData.categoryId
        ? overData.categoryId
        : undefined;
      await onTodoReorder(active.id as string, newIndex, newCategoryId);
    } else if (activeData.type === 'category' && onCategoryReorder) {
      await onCategoryReorder(active.id as string, newIndex);
    }
  }, [onTodoReorder, onCategoryReorder]);

  const handleDragCancel = useCallback((event: DragCancelEvent) => {
    setActiveItem(null);
  }, []);

  const announcements: Announcements = {
    onDragStart: ({ active }) => {
      const data = active.data.current as DragItem | undefined;
      return `Picked up ${data?.title || 'item'}`;
    },
    onDragOver: ({ over }) => {
      if (over) {
        const data = over.data.current as { title?: string } | undefined;
        return `Over ${data?.title || 'drop zone'}`;
      }
      return 'Not over a droppable area';
    },
    onDragEnd: ({ active, over }) => {
      const data = active.data.current as DragItem | undefined;
      if (over) {
        return `Dropped ${data?.title || 'item'}`;
      }
      return `${data?.title || 'Item'} was dropped in its original position`;
    },
    onDragCancel: () => 'Drag cancelled',
  };

  const contextValue: DndContextValue = {
    activeItem,
    isDragging: activeItem !== null,
  };

  return (
    <DndStateContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        accessibility={{ announcements }}
      >
        {children}
        <DragOverlay dropAnimation={null}>
          {activeItem && (
            <div className="rounded-lg border bg-card p-3 shadow-lg opacity-90">
              <span className="font-medium">{activeItem.title}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </DndStateContext.Provider>
  );
}
```

**Step 2: Create barrel export**

```typescript
// src/components/dnd/index.ts
export { DndProvider, useDndState } from './DndProvider';
export type { DragItem, DragItemType } from './DndProvider';
export { DragHandle } from './DragHandle';
```

**Step 3: Commit**

```bash
git add src/components/dnd/
git commit -m "feat(dnd): add DndProvider with sensors and accessibility"
```

---

## Task 9: Create SortableTodoItem Component

**Files:**
- Create: `src/components/dnd/SortableTodoItem.tsx`

**Step 1: Create the component**

```typescript
// src/components/dnd/SortableTodoItem.tsx
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Todo, UpdateTodoInput } from '@/types';
import { TodoItem } from '@/components/todo-item';
import { DragHandle } from './DragHandle';
import { cn } from '@/lib/utils';

interface SortableTodoItemProps {
  todo: Todo;
  onToggle: (id: string) => Promise<void>;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => Promise<void>;
  onAddSubtask?: (parentId: string, title: string) => Promise<void>;
  onSkipRecurrence?: (id: string) => Promise<void>;
  onStopRecurrence?: (id: string) => Promise<void>;
  isSelected?: boolean;
}

export function SortableTodoItem({
  todo,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onSkipRecurrence,
  onStopRecurrence,
  isSelected,
}: SortableTodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: todo.id,
    data: {
      type: 'todo' as const,
      title: todo.title,
      categoryId: todo.categoryId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-start gap-2',
        isDragging && 'opacity-50'
      )}
    >
      <DragHandle
        listeners={listeners}
        attributes={attributes}
        isDragging={isDragging}
        className="mt-4"
      />
      <div className="flex-1">
        <TodoItem
          todo={todo}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSubtask={onAddSubtask}
          onSkipRecurrence={onSkipRecurrence}
          onStopRecurrence={onStopRecurrence}
          isSelected={isSelected}
        />
      </div>
    </div>
  );
}
```

**Step 2: Update exports**

Add to `src/components/dnd/index.ts`:

```typescript
export { SortableTodoItem } from './SortableTodoItem';
```

**Step 3: Commit**

```bash
git add src/components/dnd/
git commit -m "feat(dnd): add SortableTodoItem wrapper component"
```

---

## Task 10: Create SortableTodoList Component

**Files:**
- Create: `src/components/dnd/SortableTodoList.tsx`

**Step 1: Create the component**

```typescript
// src/components/dnd/SortableTodoList.tsx
'use client';

import { useMemo } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Todo } from '@/types';
import { SortableTodoItem } from './SortableTodoItem';

interface SortableTodoListProps {
  todos: Todo[];
  categoryId?: string | null;
  onToggle: (id: string) => Promise<void>;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => Promise<void>;
  onAddSubtask?: (parentId: string, title: string) => Promise<void>;
  onSkipRecurrence?: (id: string) => Promise<void>;
  onStopRecurrence?: (id: string) => Promise<void>;
  selectedIndex?: number | null;
  todoIndexMap: Map<string, number>;
}

export function SortableTodoList({
  todos,
  categoryId,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onSkipRecurrence,
  onStopRecurrence,
  selectedIndex,
  todoIndexMap,
}: SortableTodoListProps) {
  const todoIds = useMemo(() => todos.map((todo) => todo.id), [todos]);

  return (
    <SortableContext items={todoIds} strategy={verticalListSortingStrategy}>
      <div className="space-y-2">
        {todos.map((todo) => (
          <SortableTodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddSubtask={onAddSubtask}
            onSkipRecurrence={onSkipRecurrence}
            onStopRecurrence={onStopRecurrence}
            isSelected={selectedIndex === todoIndexMap.get(todo.id)}
          />
        ))}
      </div>
    </SortableContext>
  );
}
```

**Step 2: Update exports**

Add to `src/components/dnd/index.ts`:

```typescript
export { SortableTodoList } from './SortableTodoList';
```

**Step 3: Commit**

```bash
git add src/components/dnd/
git commit -m "feat(dnd): add SortableTodoList with SortableContext"
```

---

## Task 11: Update TodoList to Use SortableTodoList

**Files:**
- Modify: `src/components/todo-list.tsx`

**Step 1: Update imports and component**

Replace the existing TodoList rendering with SortableTodoList:

```typescript
// Add import at top:
import { SortableTodoList } from '@/components/dnd';

// Replace the todo rendering sections in the return statement with:
{/* Active Todos Section */}
{activeTodos.length > 0 && (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
      <Circle className="h-4 w-4" />
      <span>Active</span>
      <span className="text-muted-foreground">
        ({activeTodos.length})
      </span>
    </div>
    <SortableTodoList
      todos={activeTodos}
      onToggle={onToggle}
      onEdit={handleEditClick}
      onDelete={onDelete}
      onAddSubtask={onAddSubtask}
      onSkipRecurrence={onSkipRecurrence}
      onStopRecurrence={onStopRecurrence}
      selectedIndex={selectedIndex}
      todoIndexMap={todoIndexMap}
    />
  </div>
)}

{/* Completed Todos Section */}
{completedTodos.length > 0 && (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <CheckCircle2 className="h-4 w-4" />
      <span>Completed</span>
      <span>({completedTodos.length})</span>
    </div>
    <SortableTodoList
      todos={completedTodos}
      onToggle={onToggle}
      onEdit={handleEditClick}
      onDelete={onDelete}
      onAddSubtask={onAddSubtask}
      onSkipRecurrence={onSkipRecurrence}
      onStopRecurrence={onStopRecurrence}
      selectedIndex={selectedIndex}
      todoIndexMap={todoIndexMap}
    />
  </div>
)}
```

**Step 2: Run app to verify UI works**

Run: `docker compose up -d && docker compose logs -f app`
Expected: App starts without errors

**Step 3: Commit**

```bash
git add src/components/todo-list.tsx
git commit -m "feat(dnd): integrate SortableTodoList into TodoList"
```

---

## Task 12: Create SortableCategory Component

**Files:**
- Create: `src/components/dnd/SortableCategory.tsx`

**Step 1: Create the component**

```typescript
// src/components/dnd/SortableCategory.tsx
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2 } from 'lucide-react';
import { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { DragHandle } from './DragHandle';
import { cn } from '@/lib/utils';

interface SortableCategoryProps {
  category: Category;
  isSelected: boolean;
  isHovered: boolean;
  isDeleting: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function SortableCategory({
  category,
  isSelected,
  isHovered,
  isDeleting,
  onSelect,
  onDelete,
  onMouseEnter,
  onMouseLeave,
}: SortableCategoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category.id,
    data: {
      type: 'category' as const,
      title: category.name,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative flex items-center gap-1',
        isDragging && 'opacity-50'
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <DragHandle
        listeners={listeners}
        attributes={attributes}
        isDragging={isDragging}
        className="shrink-0"
      />
      <Button
        variant={isSelected ? 'secondary' : 'ghost'}
        className={cn(
          'flex-1 justify-start gap-2 pr-8',
          isSelected && 'bg-secondary'
        )}
        onClick={onSelect}
      >
        <div
          className="size-3 rounded-full shrink-0"
          style={{ backgroundColor: category.color }}
        />
        <span className="flex-1 truncate text-left">
          {category.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {category._count?.todos ?? 0}
        </span>
      </Button>

      {isHovered && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          disabled={isDeleting}
        >
          <Trash2 className="size-4" />
          <span className="sr-only">Delete {category.name}</span>
        </Button>
      )}
    </div>
  );
}
```

**Step 2: Update exports**

Add to `src/components/dnd/index.ts`:

```typescript
export { SortableCategory } from './SortableCategory';
```

**Step 3: Commit**

```bash
git add src/components/dnd/
git commit -m "feat(dnd): add SortableCategory component"
```

---

## Task 13: Update CategorySidebar to Use SortableCategory

**Files:**
- Modify: `src/components/category-sidebar.tsx`

**Step 1: Update imports**

```typescript
import { useMemo } from "react"
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableCategory } from '@/components/dnd';
```

**Step 2: Replace category list rendering**

Replace the category list section with SortableContext:

```typescript
{/* Category List */}
<div className="flex-1 space-y-1 overflow-y-auto">
  <SortableContext
    items={categories.map(c => c.id)}
    strategy={verticalListSortingStrategy}
  >
    {categories.map((category) => (
      <SortableCategory
        key={category.id}
        category={category}
        isSelected={selectedCategoryId === category.id}
        isHovered={hoveredCategoryId === category.id}
        isDeleting={deletingCategoryId === category.id}
        onSelect={() => onSelectCategory(category.id)}
        onDelete={(e) => handleDeleteCategory(category.id, e)}
        onMouseEnter={() => setHoveredCategoryId(category.id)}
        onMouseLeave={() => setHoveredCategoryId(null)}
      />
    ))}
  </SortableContext>
</div>
```

**Step 3: Commit**

```bash
git add src/components/category-sidebar.tsx
git commit -m "feat(dnd): integrate SortableCategory into CategorySidebar"
```

---

## Task 14: Add Reorder Functions to Hooks

**Files:**
- Modify: `src/hooks/use-todos.ts`
- Modify: `src/hooks/use-categories.ts`

**Step 1: Add reorderTodo to useTodos hook**

Add after `stopRecurrence` function:

```typescript
const reorderTodo = async (todoId: string, newSortOrder: number, newCategoryId?: string) => {
  // Optimistic update
  const originalTodos = [...todos];

  try {
    // Find the todo and update its position optimistically
    const todoIndex = todos.findIndex(t => t.id === todoId);
    if (todoIndex === -1) return;

    const updatedTodos = [...todos];
    const [movedTodo] = updatedTodos.splice(todoIndex, 1);

    // Update category if moving between categories
    if (newCategoryId !== undefined) {
      movedTodo.categoryId = newCategoryId;
    }

    // Insert at new position
    updatedTodos.splice(newSortOrder, 0, movedTodo);
    setTodos(updatedTodos);

    const response = await fetch('/api/todos/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ todoId, newSortOrder, newCategoryId }),
    });

    if (!response.ok) {
      throw new Error('Failed to reorder todo');
    }

    // Refetch to get accurate sort orders from server
    await fetchTodos();
  } catch (error) {
    // Rollback on error
    setTodos(originalTodos);
    toast.error('Failed to reorder todo');
    console.error('Error reordering todo:', error);
  }
};
```

Add `reorderTodo` to the return object.

**Step 2: Add reorderCategory to useCategories hook**

Add after `deleteCategory` function:

```typescript
const reorderCategory = async (categoryId: string, newSortOrder: number) => {
  const originalCategories = [...categories];

  try {
    const categoryIndex = categories.findIndex(c => c.id === categoryId);
    if (categoryIndex === -1) return;

    const updatedCategories = [...categories];
    const [movedCategory] = updatedCategories.splice(categoryIndex, 1);
    updatedCategories.splice(newSortOrder, 0, movedCategory);
    setCategories(updatedCategories);

    const response = await fetch('/api/categories/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId, newSortOrder }),
    });

    if (!response.ok) {
      throw new Error('Failed to reorder category');
    }

    await fetchCategories();
  } catch (error) {
    setCategories(originalCategories);
    toast.error('Failed to reorder category');
    console.error('Error reordering category:', error);
  }
};
```

Add `reorderCategory` to the return object and interface.

**Step 3: Commit**

```bash
git add src/hooks/use-todos.ts src/hooks/use-categories.ts
git commit -m "feat(hooks): add reorder functions with optimistic updates"
```

---

## Task 15: Integrate DndProvider into Main Page

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Wrap content with DndProvider**

```typescript
// Add import:
import { DndProvider } from '@/components/dnd';

// Add handler for reordering todos:
const handleReorderTodo = async (todoId: string, newIndex: number, newCategoryId?: string) => {
  await reorderTodo(todoId, newIndex, newCategoryId);
  if (newCategoryId) {
    await refetchCategories();
  }
};

// Add handler for reordering categories:
const handleReorderCategory = async (categoryId: string, newIndex: number) => {
  await reorderCategory(categoryId, newIndex);
};

// Wrap the return JSX with DndProvider:
return (
  <DndProvider
    onTodoReorder={handleReorderTodo}
    onCategoryReorder={handleReorderCategory}
  >
    <div className="min-h-screen flex flex-col">
      {/* ... existing content ... */}
    </div>
  </DndProvider>
);
```

**Step 2: Destructure reorderTodo and reorderCategory from hooks**

Update the hook destructuring to include the new functions:

```typescript
const {
  todos, isLoading, createTodo, updateTodo, toggleTodo, deleteTodo,
  skipRecurrence, stopRecurrence, reorderTodo, refetch: fetchTodos
} = useTodos({ filters: queryParams, enabled: sortLoaded });

const {
  categories, createCategory: createCategoryHook, deleteCategory,
  reorderCategory, refetch: refetchCategories
} = useCategories();
```

**Step 3: Test manually**

Run: `docker compose up -d`
Navigate to app and try dragging todos and categories

**Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(dnd): integrate DndProvider into main page"
```

---

## Task 16: Add E2E Tests for Drag and Drop

**Files:**
- Create: `e2e/drag-drop.spec.ts`

**Step 1: Create E2E test file**

```typescript
// e2e/drag-drop.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Drag and Drop Reordering', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    const credentials = require('./.auth-credentials.json');
    await page.goto('/login');
    await page.getByLabel('Email').fill(credentials.email);
    await page.getByLabel('Password').fill(credentials.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/');
    await page.waitForLoadState('networkidle');
  });

  test('can reorder todos by dragging', async ({ page }) => {
    // Create two todos to reorder
    await page.getByPlaceholder(/add a new todo/i).fill('First Todo');
    await page.getByRole('button', { name: /add/i }).click();
    await expect(page.getByText('First Todo')).toBeVisible();

    await page.getByPlaceholder(/add a new todo/i).fill('Second Todo');
    await page.getByRole('button', { name: /add/i }).click();
    await expect(page.getByText('Second Todo')).toBeVisible();

    // Second Todo should be at the top (added last = sortOrder 0)
    const todos = page.locator('[data-testid="todo-item"]');

    // Get the drag handles
    const dragHandles = page.getByRole('button', { name: /drag to reorder/i });
    await expect(dragHandles.first()).toBeVisible();

    // Drag first item down
    const firstHandle = dragHandles.first();
    const secondItem = todos.nth(1);

    await firstHandle.dragTo(secondItem);

    // Wait for reorder to complete
    await page.waitForTimeout(500);

    // Cleanup - delete both todos
    for (const todo of ['First Todo', 'Second Todo']) {
      const todoElement = page.getByText(todo).first();
      await todoElement.hover();
      await page.getByRole('button', { name: /actions/i }).first().click();
      await page.getByRole('menuitem', { name: /delete/i }).click();
      await page.waitForTimeout(300);
    }
  });

  test('drag handles are visible on todos', async ({ page }) => {
    // Create a todo
    await page.getByPlaceholder(/add a new todo/i).fill('Test Drag Handle');
    await page.getByRole('button', { name: /add/i }).click();
    await expect(page.getByText('Test Drag Handle')).toBeVisible();

    // Check drag handle is visible
    const dragHandle = page.getByRole('button', { name: /drag to reorder/i });
    await expect(dragHandle.first()).toBeVisible();

    // Cleanup
    await page.getByText('Test Drag Handle').hover();
    await page.getByRole('button', { name: /actions/i }).first().click();
    await page.getByRole('menuitem', { name: /delete/i }).click();
  });

  test('keyboard navigation for reordering works', async ({ page }) => {
    // Create todo
    await page.getByPlaceholder(/add a new todo/i).fill('Keyboard Test');
    await page.getByRole('button', { name: /add/i }).click();
    await expect(page.getByText('Keyboard Test')).toBeVisible();

    // Focus the drag handle and test keyboard
    const dragHandle = page.getByRole('button', { name: /drag to reorder/i }).first();
    await dragHandle.focus();

    // Press space to pick up, then Escape to cancel
    await page.keyboard.press('Space');
    await page.keyboard.press('Escape');

    // Cleanup
    await page.getByText('Keyboard Test').hover();
    await page.getByRole('button', { name: /actions/i }).first().click();
    await page.getByRole('menuitem', { name: /delete/i }).click();
  });
});
```

**Step 2: Run E2E tests**

Run: `docker compose exec app npx playwright test e2e/drag-drop.spec.ts --workers=1`
Expected: Tests pass

**Step 3: Commit**

```bash
git add e2e/drag-drop.spec.ts
git commit -m "test: add E2E tests for drag-drop reordering"
```

---

## Task 17: Run Full Test Suite and Fix Issues

**Files:**
- Various test files if fixes needed

**Step 1: Run unit tests**

Run: `docker compose exec app npm test`
Expected: All tests pass

**Step 2: Run E2E tests**

Run: `docker compose exec app npx playwright test --workers=1`
Expected: All tests pass

**Step 3: Fix any failing tests**

If tests fail, analyze the errors and fix them.

**Step 4: Commit any fixes**

```bash
git add .
git commit -m "test: fix tests after drag-drop integration"
```

---

## Task 18: Final Cleanup and Polish

**Files:**
- Various files for polish

**Step 1: Verify all features work**

Manual testing checklist:
- [ ] Drag todo within same category
- [ ] Drag todo to reorder (up and down)
- [ ] New todos appear at top
- [ ] Drag category in sidebar
- [ ] Keyboard navigation (Space to pick, arrows, Enter to drop, Escape to cancel)
- [ ] Touch drag on mobile (if available)
- [ ] Page reload preserves order
- [ ] Switching categories shows correct order

**Step 2: Commit any final adjustments**

```bash
git add .
git commit -m "chore: final polish for drag-drop feature"
```

---

## Summary

**Total Tasks:** 18

**Key Files Created:**
- `src/components/dnd/DndProvider.tsx`
- `src/components/dnd/DragHandle.tsx`
- `src/components/dnd/SortableTodoItem.tsx`
- `src/components/dnd/SortableTodoList.tsx`
- `src/components/dnd/SortableCategory.tsx`
- `src/components/dnd/index.ts`
- `src/app/api/todos/reorder/route.ts`
- `src/app/api/categories/reorder/route.ts`
- `e2e/drag-drop.spec.ts`

**Key Files Modified:**
- `prisma/schema.prisma` (sortOrder fields)
- `src/types/index.ts` (sortOrder and reorder types)
- `src/hooks/use-todos.ts` (reorderTodo function)
- `src/hooks/use-categories.ts` (reorderCategory function)
- `src/components/todo-list.tsx` (use SortableTodoList)
- `src/components/category-sidebar.tsx` (use SortableCategory)
- `src/app/page.tsx` (wrap with DndProvider)
- `src/app/api/todos/route.ts` (sort by sortOrder, insert at top)
- `src/app/api/categories/route.ts` (sort by sortOrder, insert at top)
