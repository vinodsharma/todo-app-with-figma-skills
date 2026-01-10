# Archive Todos Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement soft delete (archive) functionality allowing users to archive, restore, and permanently delete todos.

**Architecture:** Add `archivedAt` timestamp field to Todo model. Active todos have `archivedAt: null`, archived todos have a timestamp. All existing queries filter out archived items by default. New "Archived" section in sidebar shows archived items with restore/delete actions.

**Tech Stack:** Next.js 14, Prisma ORM, PostgreSQL, React, Tailwind CSS, shadcn/ui

---

### Task 1: Add archivedAt field to Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add archivedAt field to Todo model**

In `prisma/schema.prisma`, find the Todo model and add the archivedAt field after `updatedAt`:

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
  archivedAt  DateTime? // null = active, timestamp = archived
  sortOrder   Int       @default(0)

  // ... rest of model
}
```

**Step 2: Generate and run migration**

```bash
npx prisma migrate dev --name add-archived-at-to-todo
```

Expected: Migration creates `archivedAt` column, Prisma Client regenerated.

**Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add archivedAt field to Todo model"
```

---

### Task 2: Add ARCHIVE and RESTORE action types to activity logger

**Files:**
- Modify: `src/lib/activity-logger.ts`

**Step 1: Update ActionType**

```typescript
export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'COMPLETE' | 'UNCOMPLETE' | 'ARCHIVE' | 'RESTORE';
```

**Step 2: Commit**

```bash
git add src/lib/activity-logger.ts
git commit -m "feat: add ARCHIVE and RESTORE action types"
```

---

### Task 3: Update GET /api/todos to filter archived todos

**Files:**
- Modify: `src/app/api/todos/route.ts`

**Step 1: Add archived query parameter handling**

In the GET function, after parsing other query params (around line 31), add:

```typescript
const archived = searchParams.get('archived');
```

**Step 2: Add archived filter to where clause**

Update the where clause type definition to include archivedAt:

```typescript
const where: {
  userId: string;
  parentId?: string | null;
  categoryId?: string;
  completed?: boolean;
  priority?: Priority;
  title?: { contains: string; mode: 'insensitive' };
  archivedAt?: null | { not: null };
  AND?: Array<Record<string, unknown>>;
} = {
  userId: session.user.id,
  parentId: null,
};
```

**Step 3: Apply archived filter**

After the where clause initialization, add:

```typescript
// Archive filter - by default show only non-archived todos
if (archived === 'true') {
  where.archivedAt = { not: null };
} else {
  where.archivedAt = null;
}
```

**Step 4: Run existing tests**

```bash
npm test -- --testPathPattern="todos"
```

Expected: All existing tests pass (they should still work with archived=false default).

**Step 5: Commit**

```bash
git add src/app/api/todos/route.ts
git commit -m "feat: filter archived todos in GET /api/todos"
```

---

### Task 4: Update PATCH /api/todos/[id] to support archiving

**Files:**
- Modify: `src/app/api/todos/[id]/route.ts`

**Step 1: Read the current file**

Read `src/app/api/todos/[id]/route.ts` to understand the current PATCH implementation.

**Step 2: Add archivedAt to updateData handling**

In the PATCH function, add support for archivedAt in the request body and update logic:

```typescript
const { title, description, priority, dueDate, categoryId, completed, recurrenceRule, recurrenceEnd, archivedAt } = body;
```

**Step 3: Handle archive/restore with subtasks**

When archiving or restoring, also update all subtasks. Add this logic before the main update:

```typescript
// Handle archive/restore - also affects subtasks
if (archivedAt !== undefined) {
  // Archive or restore all subtasks along with parent
  await prisma.todo.updateMany({
    where: {
      parentId: id,
      userId: session.user.id,
    },
    data: { archivedAt: archivedAt ? new Date(archivedAt) : null },
  });
}
```

**Step 4: Add archivedAt to the update data**

```typescript
if (archivedAt !== undefined) {
  updateData.archivedAt = archivedAt ? new Date(archivedAt) : null;
}
```

**Step 5: Log ARCHIVE/RESTORE activity**

After the update, check if this was an archive/restore action and log accordingly:

```typescript
// Log archive/restore activity
if (archivedAt !== undefined) {
  const action = archivedAt ? 'ARCHIVE' : 'RESTORE';
  await logActivity({
    entityType: 'TODO',
    entityId: todo.id,
    entityTitle: todo.title,
    action,
    beforeState: { archivedAt: existingTodo.archivedAt?.toISOString() || null },
    afterState: { archivedAt: todo.archivedAt?.toISOString() || null },
    userId: session.user.id,
  });
}
```

**Step 6: Commit**

```bash
git add src/app/api/todos/[id]/route.ts
git commit -m "feat: support archive/restore in PATCH /api/todos/[id]"
```

---

### Task 5: Create POST /api/todos/bulk-archive endpoint

**Files:**
- Create: `src/app/api/todos/bulk-archive/route.ts`

**Step 1: Create the bulk-archive route**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/app/api/todos/bulk-archive/route.ts
git commit -m "feat: add POST /api/todos/bulk-archive endpoint"
```

---

### Task 6: Create POST /api/todos/bulk-restore endpoint

**Files:**
- Create: `src/app/api/todos/bulk-restore/route.ts`

**Step 1: Create the bulk-restore route**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/app/api/todos/bulk-restore/route.ts
git commit -m "feat: add POST /api/todos/bulk-restore endpoint"
```

---

### Task 7: Update use-todos hook with archive methods

**Files:**
- Modify: `src/hooks/use-todos.ts`

**Step 1: Add archived filter support**

Update the fetchTodos function to include archived param:

```typescript
if (filters?.archived !== undefined) {
  params.set('archived', String(filters.archived));
}
```

**Step 2: Add archive/restore methods to the hook**

Add these new methods alongside existing bulk methods:

```typescript
const archiveTodo = useCallback(async (id: string) => {
  try {
    const response = await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archivedAt: new Date().toISOString() }),
    });
    if (!response.ok) throw new Error('Failed to archive todo');

    // Remove from local state
    setTodos(prev => prev.filter(t => t.id !== id));
    toast.success('Todo archived');
  } catch (error) {
    toast.error('Failed to archive todo');
    throw error;
  }
}, []);

const restoreTodo = useCallback(async (id: string) => {
  try {
    const response = await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archivedAt: null }),
    });
    if (!response.ok) throw new Error('Failed to restore todo');

    // Remove from local state (it will appear in active list on refetch)
    setTodos(prev => prev.filter(t => t.id !== id));
    toast.success('Todo restored');
  } catch (error) {
    toast.error('Failed to restore todo');
    throw error;
  }
}, []);

const bulkArchive = useCallback(async (ids: string[]): Promise<{ archived: number }> => {
  try {
    const response = await fetch('/api/todos/bulk-archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) throw new Error('Failed to archive todos');

    const result = await response.json();
    setTodos(prev => prev.filter(t => !ids.includes(t.id)));
    toast.success(`${result.archived} todo(s) archived`);
    return result;
  } catch (error) {
    toast.error('Failed to archive todos');
    throw error;
  }
}, []);

const bulkRestore = useCallback(async (ids: string[]): Promise<{ restored: number }> => {
  try {
    const response = await fetch('/api/todos/bulk-restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) throw new Error('Failed to restore todos');

    const result = await response.json();
    setTodos(prev => prev.filter(t => !ids.includes(t.id)));
    toast.success(`${result.restored} todo(s) restored`);
    return result;
  } catch (error) {
    toast.error('Failed to restore todos');
    throw error;
  }
}, []);
```

**Step 3: Update return interface and statement**

Add to UseTodosReturn interface:

```typescript
archiveTodo: (id: string) => Promise<void>;
restoreTodo: (id: string) => Promise<void>;
bulkArchive: (ids: string[]) => Promise<{ archived: number }>;
bulkRestore: (ids: string[]) => Promise<{ restored: number }>;
```

Add to return statement:

```typescript
return {
  // ... existing
  archiveTodo,
  restoreTodo,
  bulkArchive,
  bulkRestore,
};
```

**Step 4: Update TodoQueryParams type**

In `src/types/index.ts`, add archived to TodoQueryParams:

```typescript
export interface TodoQueryParams {
  search?: string;
  categoryId?: string;
  status?: 'active' | 'completed';
  priority?: Priority;
  dueDate?: 'overdue' | 'today' | 'week' | 'upcoming';
  sortBy?: 'priority' | 'dueDate' | 'createdAt' | 'title';
  sortDirection?: 'asc' | 'desc';
  archived?: boolean;
}
```

**Step 5: Commit**

```bash
git add src/hooks/use-todos.ts src/types/index.ts
git commit -m "feat: add archive/restore methods to use-todos hook"
```

---

### Task 8: Add Archive section to CategorySidebar

**Files:**
- Modify: `src/components/category-sidebar.tsx`

**Step 1: Add props for archived count and selection**

Update the interface:

```typescript
interface CategorySidebarProps {
  categories: Category[]
  selectedCategoryId: string | null
  isArchiveView: boolean
  archivedCount: number
  onSelectCategory: (categoryId: string | null) => void
  onSelectArchive: () => void
  onAddCategory: (name: string, color: string) => Promise<void>
  onDeleteCategory: (categoryId: string) => Promise<void>
}
```

**Step 2: Add Archive button**

Add after the category list, before Add Category:

```tsx
import { Archive } from "lucide-react"

// ... in the component, after the category list div:

{/* Archive Section */}
<div className="mt-auto pt-2 border-t">
  <Button
    variant={isArchiveView ? "secondary" : "ghost"}
    className={cn(
      "w-full justify-start gap-2",
      isArchiveView && "bg-secondary"
    )}
    onClick={onSelectArchive}
  >
    <Archive className="size-4" />
    <span className="flex-1 text-left">Archived</span>
    <span className="text-xs text-muted-foreground">{archivedCount}</span>
  </Button>
</div>

{/* Add Category Dialog */}
<div className="pt-2">
  <AddCategoryDialog onAdd={onAddCategory} />
</div>
```

**Step 3: Update the All Todos button to not be selected when in archive view**

```tsx
<Button
  variant={selectedCategoryId === null && !isArchiveView ? "secondary" : "ghost"}
  className={cn(
    "w-full justify-start gap-2",
    selectedCategoryId === null && !isArchiveView && "bg-secondary"
  )}
  onClick={() => onSelectCategory(null)}
>
```

**Step 4: Commit**

```bash
git add src/components/category-sidebar.tsx
git commit -m "feat: add Archive section to CategorySidebar"
```

---

### Task 9: Update TodoItem with archive/restore actions

**Files:**
- Modify: `src/components/todo-item.tsx`

**Step 1: Add new props**

```typescript
interface TodoItemProps {
  todo: Todo;
  isArchived?: boolean;
  onToggle: (id: string) => Promise<void>;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => Promise<void>;
  onArchive?: (id: string) => Promise<void>;
  onRestore?: (id: string) => Promise<void>;
  onAddSubtask?: (parentId: string, title: string) => Promise<void>;
  onSkipRecurrence?: (id: string) => Promise<void>;
  onStopRecurrence?: (id: string) => Promise<void>;
  isSelected?: boolean;
}
```

**Step 2: Import Archive and RotateCcw icons**

```typescript
import { Calendar, Pencil, Trash2, ChevronDown, ChevronUp, ChevronRight, FileText, Repeat, MoreHorizontal, SkipForward, Ban, Archive, RotateCcw } from "lucide-react";
```

**Step 3: Update dropdown menu**

Replace the delete menu item with conditional archive/restore/delete:

```tsx
<DropdownMenuContent align="end">
  {!isArchived && (
    <DropdownMenuItem onClick={() => onEdit(todo)}>
      <Pencil className="mr-2 h-4 w-4" />
      Edit
    </DropdownMenuItem>
  )}
  {!isArchived && todo.recurrenceRule && onSkipRecurrence && (
    <DropdownMenuItem onClick={() => onSkipRecurrence(todo.id)}>
      <SkipForward className="mr-2 h-4 w-4" />
      Skip this occurrence
    </DropdownMenuItem>
  )}
  {!isArchived && todo.recurrenceRule && onStopRecurrence && (
    <DropdownMenuItem onClick={() => onStopRecurrence(todo.id)}>
      <Ban className="mr-2 h-4 w-4" />
      Stop repeating
    </DropdownMenuItem>
  )}
  {!isArchived && onArchive && (
    <DropdownMenuItem onClick={() => onArchive(todo.id)}>
      <Archive className="mr-2 h-4 w-4" />
      Archive
    </DropdownMenuItem>
  )}
  {isArchived && onRestore && (
    <DropdownMenuItem onClick={() => onRestore(todo.id)}>
      <RotateCcw className="mr-2 h-4 w-4" />
      Restore
    </DropdownMenuItem>
  )}
  <DropdownMenuItem
    onClick={() => onDelete(todo.id)}
    className="text-destructive focus:text-destructive"
  >
    <Trash2 className="mr-2 h-4 w-4" />
    {isArchived ? 'Delete Permanently' : 'Delete'}
  </DropdownMenuItem>
</DropdownMenuContent>
```

**Step 4: Commit**

```bash
git add src/components/todo-item.tsx
git commit -m "feat: add archive/restore actions to TodoItem"
```

---

### Task 10: Update TodoList to pass archive props

**Files:**
- Modify: `src/components/todo-list.tsx`

**Step 1: Add archive props to interface**

```typescript
interface TodoListProps {
  todos: Todo[];
  categories: Category[];
  isLoading: boolean;
  hasActiveFilters: boolean;
  selectedIndex: number;
  isSelectionMode: boolean;
  selectedIds: Set<string>;
  isArchived?: boolean;
  onSelectionChange: (id: string, e: React.MouseEvent) => void;
  onToggle: (id: string) => Promise<void>;
  onEdit: (id: string, input: UpdateTodoInput) => Promise<void>;
  onEditClick: (todo: Todo) => void;
  onDelete: (id: string) => Promise<void>;
  onArchive?: (id: string) => Promise<void>;
  onRestore?: (id: string) => Promise<void>;
  onAddSubtask: (parentId: string, title: string) => Promise<void>;
  onSkipRecurrence?: (id: string) => Promise<void>;
  onStopRecurrence?: (id: string) => Promise<void>;
}
```

**Step 2: Pass props to TodoItem**

In the component, pass the new props:

```tsx
<TodoItem
  todo={todo}
  isArchived={isArchived}
  onToggle={onToggle}
  onEdit={onEditClick}
  onDelete={onDelete}
  onArchive={onArchive}
  onRestore={onRestore}
  onAddSubtask={!isArchived ? onAddSubtask : undefined}
  onSkipRecurrence={!isArchived ? onSkipRecurrence : undefined}
  onStopRecurrence={!isArchived ? onStopRecurrence : undefined}
  isSelected={isSelectionMode && selectedIds.has(todo.id)}
/>
```

**Step 3: Update empty state message for archive view**

```tsx
{isArchived ? (
  <p className="text-muted-foreground">No archived todos</p>
) : hasActiveFilters ? (
  <p className="text-muted-foreground">No todos match your filters</p>
) : (
  <p className="text-muted-foreground">No todos yet. Add one above!</p>
)}
```

**Step 4: Commit**

```bash
git add src/components/todo-list.tsx
git commit -m "feat: add archive props to TodoList"
```

---

### Task 11: Add Archive button to BulkActionBar

**Files:**
- Modify: `src/components/bulk-actions/BulkActionBar.tsx`

**Step 1: Add archive props**

```typescript
interface BulkActionBarProps {
  selectedCount: number;
  isArchiveView?: boolean;
  onComplete: () => void;
  onDelete: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onMoveToCategory: (categoryId: string | null) => void;
  onChangePriority: (priority: Priority) => void;
  onClose: () => void;
  categories: Category[];
}
```

**Step 2: Import Archive and RotateCcw icons**

```typescript
import { CheckCircle, Trash2, X, FolderInput, Flag, Archive, RotateCcw } from 'lucide-react';
```

**Step 3: Add Archive/Restore buttons**

After the Complete button, add:

```tsx
{!isArchiveView && onArchive && (
  <Button
    variant="outline"
    size="sm"
    onClick={onArchive}
    className="gap-2"
  >
    <Archive className="h-4 w-4" />
    Archive
  </Button>
)}

{isArchiveView && onRestore && (
  <Button
    variant="outline"
    size="sm"
    onClick={onRestore}
    className="gap-2"
  >
    <RotateCcw className="h-4 w-4" />
    Restore
  </Button>
)}
```

**Step 4: Hide Complete button in archive view**

```tsx
{!isArchiveView && (
  <Button
    variant="outline"
    size="sm"
    onClick={onComplete}
    className="gap-2"
  >
    <CheckCircle className="h-4 w-4" />
    Complete
  </Button>
)}
```

**Step 5: Commit**

```bash
git add src/components/bulk-actions/BulkActionBar.tsx
git commit -m "feat: add Archive/Restore buttons to BulkActionBar"
```

---

### Task 12: Update main page to support archive view

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Add archive view state**

```typescript
const [isArchiveView, setIsArchiveView] = useState(false);
```

**Step 2: Update queryParams to include archived filter**

```typescript
const queryParams = useMemo((): TodoQueryParams => {
  const params: TodoQueryParams = {};

  // If archive view, only fetch archived todos
  if (isArchiveView) {
    params.archived = true;
    return params; // Skip other filters for archive view
  }

  // ... rest of existing filter logic

  return params;
}, [debouncedSearch, selectedCategoryId, filters.priority, filters.status, filters.dueDate, sortOption, isArchiveView]);
```

**Step 3: Add archived count state and fetch**

```typescript
const [archivedCount, setArchivedCount] = useState(0);

// Fetch archived count
useEffect(() => {
  const fetchArchivedCount = async () => {
    try {
      const response = await fetch('/api/todos?archived=true');
      if (response.ok) {
        const data = await response.json();
        setArchivedCount(data.length);
      }
    } catch (error) {
      console.error('Failed to fetch archived count:', error);
    }
  };
  fetchArchivedCount();
}, [todos]); // Refetch when todos change
```

**Step 4: Add archive handlers**

```typescript
const handleArchiveTodo = async (id: string) => {
  await archiveTodo(id);
  await refetchCategories();
};

const handleRestoreTodo = async (id: string) => {
  await restoreTodo(id);
  await refetchCategories();
};

const handleBulkArchive = useCallback(async () => {
  const ids = Array.from(selection.selectedIds);
  await bulkArchive(ids);
  selection.deselectAll();
  await refetchCategories();
}, [selection, bulkArchive, refetchCategories]);

const handleBulkRestore = useCallback(async () => {
  const ids = Array.from(selection.selectedIds);
  await bulkRestore(ids);
  selection.deselectAll();
  await refetchCategories();
}, [selection, bulkRestore, refetchCategories]);
```

**Step 5: Handle archive selection**

```typescript
const handleSelectArchive = () => {
  setIsArchiveView(true);
  setSelectedCategoryId(null);
  setFilters(defaultFilters);
};

const handleSelectCategory = (categoryId: string | null) => {
  setIsArchiveView(false);
  setSelectedCategoryId(categoryId);
};
```

**Step 6: Update CategorySidebar props**

```tsx
<CategorySidebar
  categories={categories}
  selectedCategoryId={selectedCategoryId}
  isArchiveView={isArchiveView}
  archivedCount={archivedCount}
  onSelectCategory={handleSelectCategory}
  onSelectArchive={handleSelectArchive}
  onAddCategory={handleAddCategory}
  onDeleteCategory={deleteCategory}
/>
```

**Step 7: Conditionally hide TodoForm in archive view**

```tsx
{!isArchiveView && (
  <TodoForm
    categories={categories}
    selectedCategoryId={selectedCategoryId || undefined}
    onSubmit={handleCreateTodo}
  />
)}
```

**Step 8: Update TodoList props**

```tsx
<TodoList
  todos={todos}
  categories={categories}
  isLoading={isLoading}
  hasActiveFilters={hasActiveFilters}
  selectedIndex={selectedIndex}
  isSelectionMode={selection.isSelectionMode}
  selectedIds={selection.selectedIds}
  isArchived={isArchiveView}
  onSelectionChange={handleSelectionChange}
  onToggle={handleToggleTodo}
  onEdit={handleEditTodo}
  onEditClick={handleEditClick}
  onDelete={handleDeleteTodo}
  onArchive={!isArchiveView ? handleArchiveTodo : undefined}
  onRestore={isArchiveView ? handleRestoreTodo : undefined}
  onAddSubtask={handleAddSubtask}
  onSkipRecurrence={handleSkipRecurrence}
  onStopRecurrence={handleStopRecurrence}
/>
```

**Step 9: Update BulkActionBar props**

```tsx
<BulkActionBar
  selectedCount={selection.selectedCount}
  isArchiveView={isArchiveView}
  onComplete={handleBulkComplete}
  onDelete={() => setShowDeleteConfirm(true)}
  onArchive={!isArchiveView ? handleBulkArchive : undefined}
  onRestore={isArchiveView ? handleBulkRestore : undefined}
  onMoveToCategory={handleBulkMoveToCategory}
  onChangePriority={handleBulkChangePriority}
  onClose={selection.exitSelectionMode}
  categories={categories}
/>
```

**Step 10: Update use-todos destructuring**

```typescript
const {
  todos, isLoading, createTodo, updateTodo, toggleTodo, deleteTodo,
  skipRecurrence, stopRecurrence, reorderTodo,
  bulkComplete, bulkDelete, bulkUpdate,
  archiveTodo, restoreTodo, bulkArchive, bulkRestore,
  refetch: fetchTodos
} = useTodos({
  filters: queryParams,
  enabled: sortLoaded,
});
```

**Step 11: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: integrate archive view in main page"
```

---

### Task 13: Add E2E tests for archive functionality

**Files:**
- Create: `e2e/archive.spec.ts`

**Step 1: Create archive E2E tests**

```typescript
import { test, expect, uniqueTitle } from './fixtures';

test.describe('Archive Todos', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /all todos/i })).toBeVisible({ timeout: 15000 });
  });

  test('should archive a todo from dropdown menu', async ({ page }) => {
    const title = uniqueTitle('Archive Test');

    // Create a todo
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.locator('h3', { hasText: title })).toBeVisible({ timeout: 5000 });

    // Open dropdown and click Archive
    const todoCard = page.locator('h3', { hasText: title }).locator('xpath=ancestor::div[contains(@class, \"rounded-lg\")]').first();
    await todoCard.hover();
    await todoCard.getByRole('button', { name: /actions for/i }).click();
    await page.getByRole('menuitem', { name: /archive/i }).click();

    // Todo should disappear from main list
    await expect(page.locator('h3', { hasText: title })).not.toBeVisible({ timeout: 5000 });

    // Click on Archived section
    await page.getByRole('button', { name: /archived/i }).click();

    // Todo should appear in archived list
    await expect(page.locator('h3', { hasText: title })).toBeVisible({ timeout: 5000 });
  });

  test('should restore a todo from archive', async ({ page }) => {
    const title = uniqueTitle('Restore Test');

    // Create and archive a todo
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.locator('h3', { hasText: title })).toBeVisible({ timeout: 5000 });

    const todoCard = page.locator('h3', { hasText: title }).locator('xpath=ancestor::div[contains(@class, \"rounded-lg\")]').first();
    await todoCard.hover();
    await todoCard.getByRole('button', { name: /actions for/i }).click();
    await page.getByRole('menuitem', { name: /archive/i }).click();
    await expect(page.locator('h3', { hasText: title })).not.toBeVisible({ timeout: 5000 });

    // Go to archive view
    await page.getByRole('button', { name: /archived/i }).click();
    await expect(page.locator('h3', { hasText: title })).toBeVisible({ timeout: 5000 });

    // Restore the todo
    const archivedCard = page.locator('h3', { hasText: title }).locator('xpath=ancestor::div[contains(@class, \"rounded-lg\")]').first();
    await archivedCard.hover();
    await archivedCard.getByRole('button', { name: /actions for/i }).click();
    await page.getByRole('menuitem', { name: /restore/i }).click();

    // Todo should disappear from archive
    await expect(page.locator('h3', { hasText: title })).not.toBeVisible({ timeout: 5000 });

    // Go back to All Todos
    await page.getByRole('button', { name: /all todos/i }).click();

    // Todo should be back in main list
    await expect(page.locator('h3', { hasText: title })).toBeVisible({ timeout: 5000 });
  });

  test('should permanently delete from archive', async ({ page }) => {
    const title = uniqueTitle('Perm Delete');

    // Create and archive a todo
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.locator('h3', { hasText: title })).toBeVisible({ timeout: 5000 });

    const todoCard = page.locator('h3', { hasText: title }).locator('xpath=ancestor::div[contains(@class, \"rounded-lg\")]').first();
    await todoCard.hover();
    await todoCard.getByRole('button', { name: /actions for/i }).click();
    await page.getByRole('menuitem', { name: /archive/i }).click();

    // Go to archive view
    await page.getByRole('button', { name: /archived/i }).click();
    await expect(page.locator('h3', { hasText: title })).toBeVisible({ timeout: 5000 });

    // Permanently delete
    const archivedCard = page.locator('h3', { hasText: title }).locator('xpath=ancestor::div[contains(@class, \"rounded-lg\")]').first();
    await archivedCard.hover();
    await archivedCard.getByRole('button', { name: /actions for/i }).click();
    await page.getByRole('menuitem', { name: /delete permanently/i }).click();

    // Todo should be gone
    await expect(page.locator('h3', { hasText: title })).not.toBeVisible({ timeout: 5000 });

    // Verify it's not in All Todos either
    await page.getByRole('button', { name: /all todos/i }).click();
    await expect(page.locator('h3', { hasText: title })).not.toBeVisible();
  });

  test('should bulk archive selected todos', async ({ page }) => {
    const title1 = uniqueTitle('Bulk Archive 1');
    const title2 = uniqueTitle('Bulk Archive 2');

    // Create two todos
    await page.getByPlaceholder('Add a new todo...').fill(title1);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.locator('h3', { hasText: title1 })).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder('Add a new todo...').fill(title2);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.locator('h3', { hasText: title2 })).toBeVisible({ timeout: 5000 });

    // Enter selection mode
    await page.getByRole('button', { name: 'Select', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Done', exact: true })).toBeVisible();

    // Select both todos
    const checkbox1 = page.getByRole('checkbox', { name: `Mark "${title1}" as complete` })
      .locator('xpath=ancestor::div[contains(@class, \"flex-1\")]')
      .locator('xpath=parent::div')
      .getByRole('checkbox').first();
    await checkbox1.click();

    const checkbox2 = page.getByRole('checkbox', { name: `Mark "${title2}" as complete` })
      .locator('xpath=ancestor::div[contains(@class, \"flex-1\")]')
      .locator('xpath=parent::div')
      .getByRole('checkbox').first();
    await checkbox2.click();

    // Click Archive in bulk action bar
    await page.getByTestId('bulk-action-bar').getByRole('button', { name: /archive/i }).click();

    // Both todos should disappear
    await expect(page.locator('h3', { hasText: title1 })).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('h3', { hasText: title2 })).not.toBeVisible({ timeout: 5000 });

    // Verify they're in archive
    await page.getByRole('button', { name: /archived/i }).click();
    await expect(page.locator('h3', { hasText: title1 })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h3', { hasText: title2 })).toBeVisible({ timeout: 5000 });
  });

  test('should show archived count in sidebar', async ({ page }) => {
    const title = uniqueTitle('Count Test');

    // Check initial archived count (should show 0 or number)
    const archivedButton = page.getByRole('button', { name: /archived/i });
    await expect(archivedButton).toBeVisible();

    // Create and archive a todo
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.locator('h3', { hasText: title })).toBeVisible({ timeout: 5000 });

    const todoCard = page.locator('h3', { hasText: title }).locator('xpath=ancestor::div[contains(@class, \"rounded-lg\")]').first();
    await todoCard.hover();
    await todoCard.getByRole('button', { name: /actions for/i }).click();
    await page.getByRole('menuitem', { name: /archive/i }).click();

    // Archived count should increase
    await expect(archivedButton).toContainText(/\d+/);
  });
});
```

**Step 2: Run E2E tests**

```bash
npm run test:e2e -- archive.spec.ts
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add e2e/archive.spec.ts
git commit -m "test: add E2E tests for archive functionality"
```

---

### Task 14: Update SortableTodoList and SortableTodoItem for archive view

**Files:**
- Modify: `src/components/dnd/SortableTodoList.tsx`
- Modify: `src/components/dnd/SortableTodoItem.tsx`

**Step 1: Update SortableTodoList props**

Add archive-related props and pass them through:

```typescript
interface SortableTodoListProps {
  // ... existing props
  isArchived?: boolean;
  onArchive?: (id: string) => Promise<void>;
  onRestore?: (id: string) => Promise<void>;
}
```

**Step 2: Update SortableTodoItem props**

Add archive-related props and pass to TodoItem:

```typescript
interface SortableTodoItemProps {
  // ... existing props
  isArchived?: boolean;
  onArchive?: (id: string) => Promise<void>;
  onRestore?: (id: string) => Promise<void>;
}
```

**Step 3: Disable drag-drop in archive view**

In SortableTodoItem, disable dragging when in archive view:

```typescript
const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
} = useSortable({
  id: todo.id,
  disabled: isArchived, // Disable drag in archive view
});
```

**Step 4: Commit**

```bash
git add src/components/dnd/SortableTodoList.tsx src/components/dnd/SortableTodoItem.tsx
git commit -m "feat: support archive view in sortable components"
```

---

### Task 15: Final integration test and cleanup

**Step 1: Run all tests**

```bash
npm test
npm run test:e2e
```

Expected: All tests pass.

**Step 2: Run the app and manually verify**

```bash
npm run dev
```

Verify:
- Archive button appears in sidebar
- Can archive a todo from dropdown
- Can see archived todos in archive view
- Can restore from archive
- Can permanently delete from archive
- Bulk archive works
- Archived count updates correctly

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete archive todos implementation (Issue #22)"
```
