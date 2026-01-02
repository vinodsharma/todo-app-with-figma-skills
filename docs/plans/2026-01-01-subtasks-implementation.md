# Subtasks Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add single-level subtasks to todos with progress indicators, collapsible UI, and inline add functionality.

**Architecture:** Self-referential `parentId` on Todo model. API filters to top-level todos and includes subtasks array. UI shows expand/collapse with progress badge. Subtasks have simplified display (checkbox + title + delete only).

**Tech Stack:** Prisma (schema migration), Next.js API routes, React components with local state for expand/collapse.

---

## Task 1: Database Schema Migration

**Files:**
- Modify: `prisma/schema.prisma:86-102`
- Create: `prisma/migrations/[timestamp]_add_subtasks/migration.sql` (auto-generated)

**Step 1: Update Prisma schema**

Add self-referential relation to Todo model in `prisma/schema.prisma`:

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

  // Subtasks relation (single-level nesting only)
  parentId    String?
  parent      Todo?     @relation("Subtasks", fields: [parentId], references: [id], onDelete: Cascade)
  subtasks    Todo[]    @relation("Subtasks")

  @@index([userId])
  @@index([categoryId])
  @@index([parentId])
}
```

**Step 2: Generate and apply migration**

Run:
```bash
docker compose exec app npx prisma migrate dev --name add_subtasks
```

Expected: Migration created and applied successfully.

**Step 3: Verify migration**

Run:
```bash
docker compose exec app npx prisma studio
```

Expected: Todo model shows `parentId` field in Prisma Studio.

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add parentId field to Todo model for subtasks"
```

---

## Task 2: Update TypeScript Types

**Files:**
- Modify: `src/types/index.ts:19-31`

**Step 1: Update Todo interface**

In `src/types/index.ts`, update the Todo interface:

```typescript
// Todo interface
export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: Priority;
  dueDate: string | null;
  categoryId: string | null;
  category: Category | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  // Subtasks support
  parentId: string | null;
  subtasks?: Todo[];
  _count?: {
    subtasks: number;
  };
}
```

**Step 2: Update CreateTodoInput**

Add `parentId` to CreateTodoInput:

```typescript
// Input types for creating todos
export interface CreateTodoInput {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
  categoryId?: string;
  parentId?: string;
}
```

**Step 3: Verify TypeScript compiles**

Run:
```bash
docker compose exec app npx tsc --noEmit
```

Expected: No errors.

**Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add subtask fields to Todo TypeScript types"
```

---

## Task 3: Update GET /api/todos to Include Subtasks

**Files:**
- Modify: `src/app/api/todos/route.ts:126-132`

**Step 1: Add parentId filter to where clause**

In `src/app/api/todos/route.ts`, update the where clause to only fetch top-level todos:

```typescript
// Build where clause
const where: {
  userId: string;
  parentId?: string | null;  // Add this
  categoryId?: string;
  completed?: boolean;
  priority?: Priority;
  title?: { contains: string; mode: 'insensitive' };
  AND?: Array<Record<string, unknown>>;
} = {
  userId: session.user.id,
  parentId: null,  // Only fetch top-level todos
};
```

**Step 2: Update include to fetch subtasks**

Update the prisma.todo.findMany call:

```typescript
let todos = await prisma.todo.findMany({
  where,
  include: {
    category: true,
    subtasks: {
      orderBy: { createdAt: 'asc' },
      include: { category: true },
    },
    _count: {
      select: { subtasks: true },
    },
  },
  orderBy,
});
```

**Step 3: Test the API**

Run:
```bash
docker compose up -d
curl -s http://localhost:3000/api/todos -H "Cookie: ..." | jq '.[] | {id, title, subtasks, _count}'
```

Expected: Todos returned with empty `subtasks` array and `_count.subtasks: 0`.

**Step 4: Commit**

```bash
git add src/app/api/todos/route.ts
git commit -m "feat: filter top-level todos and include subtasks in GET /api/todos"
```

---

## Task 4: Update POST /api/todos to Support parentId

**Files:**
- Modify: `src/app/api/todos/route.ts:171-242`

**Step 1: Extract parentId from body**

Update the POST handler to accept and validate `parentId`:

```typescript
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, priority, dueDate, categoryId, parentId } = body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Validate description length if provided (max 1000 chars)
    if (description && typeof description === 'string' && description.length > 1000) {
      return NextResponse.json(
        { error: 'Description cannot exceed 1000 characters' },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (priority && !['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority value' },
        { status: 400 }
      );
    }

    // Build todo data
    const todoData: any = {
      title: title.trim(),
      userId: session.user.id,
    };

    if (description !== undefined) {
      todoData.description = description ? description.trim() : null;
    }

    if (priority) {
      todoData.priority = priority as Priority;
    }

    if (dueDate) {
      todoData.dueDate = new Date(dueDate);
    }

    // Handle parentId for subtasks
    if (parentId) {
      const parent = await prisma.todo.findUnique({
        where: { id: parentId },
      });

      // Validate parent exists, belongs to user, and is not itself a subtask
      if (!parent || parent.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Parent todo not found' },
          { status: 404 }
        );
      }

      if (parent.parentId !== null) {
        return NextResponse.json(
          { error: 'Cannot create subtask of a subtask (single-level nesting only)' },
          { status: 400 }
        );
      }

      todoData.parentId = parentId;
      // Inherit category from parent
      todoData.categoryId = parent.categoryId;
    } else if (categoryId) {
      todoData.categoryId = categoryId;
    }

    const todo = await prisma.todo.create({
      data: todoData,
      include: {
        category: true,
      },
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/todos/route.ts
git commit -m "feat: support parentId in POST /api/todos for creating subtasks"
```

---

## Task 5: Create SubtaskItem Component

**Files:**
- Create: `src/components/subtask-item.tsx`

**Step 1: Create the component**

Create `src/components/subtask-item.tsx`:

```typescript
'use client';

import { Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Todo } from '@/types';

interface SubtaskItemProps {
  subtask: Todo;
  onToggle: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function SubtaskItem({ subtask, onToggle, onDelete }: SubtaskItemProps) {
  return (
    <div className="group flex items-center gap-3 rounded-md border border-border/50 bg-muted/30 px-3 py-2 transition-all hover:bg-muted/50">
      <Checkbox
        checked={subtask.completed}
        onCheckedChange={() => onToggle(subtask.id)}
        className="h-4 w-4"
        aria-label={`Mark "${subtask.title}" as ${subtask.completed ? 'incomplete' : 'complete'}`}
      />

      <span
        className={cn(
          'flex-1 text-sm',
          subtask.completed && 'text-muted-foreground line-through'
        )}
      >
        {subtask.title}
      </span>

      <button
        onClick={() => onDelete(subtask.id)}
        className="rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
        aria-label={`Delete "${subtask.title}"`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
```

**Step 2: Verify component compiles**

Run:
```bash
docker compose exec app npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/components/subtask-item.tsx
git commit -m "feat: create SubtaskItem component for displaying subtasks"
```

---

## Task 6: Create AddSubtaskInput Component

**Files:**
- Create: `src/components/add-subtask-input.tsx`

**Step 1: Create the component**

Create `src/components/add-subtask-input.tsx`:

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AddSubtaskInputProps {
  onAdd: (title: string) => Promise<void>;
  isAdding?: boolean;
}

export function AddSubtaskInput({ onAdd, isAdding = false }: AddSubtaskInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAdd(title.trim());
      setTitle('');
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setTitle('');
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        <Plus className="h-3.5 w-3.5" />
        Add subtask
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Subtask title..."
        disabled={isSubmitting}
        className="h-8 text-sm flex-1"
      />
      <Button
        type="submit"
        size="sm"
        disabled={!title.trim() || isSubmitting}
        className="h-8"
      >
        Add
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setTitle('');
          setIsOpen(false);
        }}
        className="h-8"
      >
        Cancel
      </Button>
    </form>
  );
}
```

**Step 2: Verify component compiles**

Run:
```bash
docker compose exec app npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/components/add-subtask-input.tsx
git commit -m "feat: create AddSubtaskInput component for inline subtask creation"
```

---

## Task 7: Update TodoItem to Show Subtasks

**Files:**
- Modify: `src/components/todo-item.tsx`

**Step 1: Add imports and props**

Update `src/components/todo-item.tsx` imports and props:

```typescript
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Pencil, Trash2, ChevronDown, ChevronUp, ChevronRight, FileText } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Todo, Priority } from '@/types';
import { SubtaskItem } from './subtask-item';
import { AddSubtaskInput } from './add-subtask-input';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => Promise<void>;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => Promise<void>;
  onAddSubtask?: (parentId: string, title: string) => Promise<void>;
  isSelected?: boolean;
}
```

**Step 2: Add subtask state and handlers**

Update the component to add expand state and subtask count:

```typescript
export function TodoItem({
  todo,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  isSelected = false
}: TodoItemProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(false);

  const isOverdue = todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date();
  const hasDescription = todo.description && todo.description.trim().length > 0;

  const subtasks = todo.subtasks || [];
  const subtaskCount = todo._count?.subtasks || subtasks.length;
  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const hasSubtasks = subtaskCount > 0;

  const handleAddSubtask = async (title: string) => {
    if (onAddSubtask) {
      await onAddSubtask(todo.id, title);
    }
  };
```

**Step 3: Add subtask progress badge and expand chevron**

In the JSX, add the expand chevron before the checkbox and progress badge in the metadata row:

```typescript
  return (
    <div className={cn(
      "group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:bg-accent/50",
      isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
    )}>
      {/* Expand/collapse chevron for subtasks */}
      <button
        onClick={() => setIsSubtasksExpanded(!isSubtasksExpanded)}
        className={cn(
          "mt-0.5 p-0.5 rounded hover:bg-accent transition-colors",
          !hasSubtasks && "invisible"
        )}
        aria-label={isSubtasksExpanded ? "Collapse subtasks" : "Expand subtasks"}
      >
        {isSubtasksExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <Checkbox
        checked={todo.completed}
        onCheckedChange={() => onToggle(todo.id)}
        className="mt-0.5"
        aria-label={`Mark "${todo.title}" as ${todo.completed ? "incomplete" : "complete"}`}
      />

      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                "font-medium leading-tight",
                todo.completed && "text-muted-foreground line-through",
              )}
            >
              {todo.title}
            </h3>

            {/* Subtask progress badge */}
            {hasSubtasks && (
              <Badge variant="secondary" className="text-xs font-normal">
                {completedSubtasks}/{subtaskCount}
              </Badge>
            )}
          </div>

          <div className="flex shrink-0 gap-1">
            <button
              onClick={() => onEdit(todo)}
              className="rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
              aria-label={`Edit "${todo.title}"`}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(todo.id)}
              className="rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
              aria-label={`Delete "${todo.title}"`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Rest of the metadata badges... */}
```

**Step 4: Add subtasks section at the end**

After the description content section, add the subtasks section:

```typescript
        {/* Description content */}
        {hasDescription && isDescriptionExpanded && (
          <div className="mt-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground whitespace-pre-wrap">
            {todo.description}
          </div>
        )}

        {/* Subtasks section */}
        {isSubtasksExpanded && (
          <div className="mt-3 space-y-2 pl-1">
            {subtasks.map((subtask) => (
              <SubtaskItem
                key={subtask.id}
                subtask={subtask}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))}
            {onAddSubtask && (
              <AddSubtaskInput onAdd={handleAddSubtask} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 5: Update the description expand state variable name**

Rename `isExpanded` to `isDescriptionExpanded` and update all references in the component.

**Step 6: Verify component compiles**

Run:
```bash
docker compose exec app npx tsc --noEmit
```

Expected: No errors.

**Step 7: Commit**

```bash
git add src/components/todo-item.tsx
git commit -m "feat: add subtask display with expand/collapse and progress badge to TodoItem"
```

---

## Task 8: Update TodoList to Pass Subtask Handler

**Files:**
- Modify: `src/components/todo-list.tsx`

**Step 1: Add onAddSubtask prop**

Update `src/components/todo-list.tsx` to accept and pass through the subtask handler:

```typescript
interface TodoListProps {
  todos: Todo[];
  allTodos?: Todo[];
  selectedIndex?: number | null;
  onToggle: (id: string) => Promise<void>;
  onEditClick: (todo: Todo) => void;
  onDelete: (id: string) => Promise<void>;
  onAddSubtask?: (parentId: string, title: string) => Promise<void>;
}

export function TodoList({
  todos,
  allTodos,
  selectedIndex = null,
  onToggle,
  onEditClick,
  onDelete,
  onAddSubtask,
}: TodoListProps) {
```

**Step 2: Pass onAddSubtask to TodoItem**

In the TodoItem render, add the prop:

```typescript
<TodoItem
  key={todo.id}
  todo={todo}
  onToggle={onToggle}
  onEdit={onEditClick}
  onDelete={onDelete}
  onAddSubtask={onAddSubtask}
  isSelected={selectedIndex !== null && todoIndexMap.get(todo.id) === selectedIndex}
/>
```

**Step 3: Commit**

```bash
git add src/components/todo-list.tsx
git commit -m "feat: pass onAddSubtask handler through TodoList to TodoItem"
```

---

## Task 9: Update Main Page to Handle Subtasks

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Add handleAddSubtask function**

In `src/app/page.tsx`, add the subtask handler after the other handlers:

```typescript
const handleAddSubtask = async (parentId: string, title: string) => {
  try {
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, parentId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create subtask');
    }

    // Refresh todos to get updated subtasks
    await fetchTodos();
  } catch (error) {
    console.error('Error creating subtask:', error);
  }
};
```

**Step 2: Pass handler to TodoList**

Update the TodoList component call to include onAddSubtask:

```typescript
<TodoList
  todos={filteredTodos}
  allTodos={allTodos}
  selectedIndex={selectedIndex}
  onToggle={handleToggleTodo}
  onEditClick={setEditingTodo}
  onDelete={handleDeleteTodo}
  onAddSubtask={handleAddSubtask}
/>
```

**Step 3: Verify app runs**

Run:
```bash
docker compose up -d
```

Open http://localhost:3000 and verify:
- Todos load without errors
- No visual changes yet (no subtasks exist)

**Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add handleAddSubtask to main page and pass to TodoList"
```

---

## Task 10: E2E Tests for Subtasks

**Files:**
- Create: `e2e/subtasks.spec.ts`

**Step 1: Create E2E test file**

Create `e2e/subtasks.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Subtasks', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.E2E_USER_EMAIL || 'e2e-test@example.com');
    await page.fill('input[type="password"]', process.env.E2E_USER_PASSWORD || 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('can create a subtask', async ({ page }) => {
    // Create a parent todo first
    await page.fill('input[placeholder="Add a new todo..."]', 'Parent task');
    await page.click('button:has-text("Add")');

    // Wait for todo to appear
    await expect(page.locator('text=Parent task')).toBeVisible();

    // Expand subtasks (click chevron)
    await page.click('[aria-label="Expand subtasks"]');

    // Click add subtask
    await page.click('text=Add subtask');

    // Fill in subtask title
    await page.fill('input[placeholder="Subtask title..."]', 'Child task');
    await page.click('button:has-text("Add")');

    // Verify subtask appears
    await expect(page.locator('text=Child task')).toBeVisible();

    // Verify progress badge shows 0/1
    await expect(page.locator('text=0/1')).toBeVisible();
  });

  test('can complete a subtask and see progress update', async ({ page }) => {
    // Assuming a todo with subtask exists from previous test or setup
    // Find a parent with subtasks and expand it
    const expandButton = page.locator('[aria-label="Expand subtasks"]').first();
    if (await expandButton.isVisible()) {
      await expandButton.click();
    }

    // Find and complete a subtask
    const subtaskCheckbox = page.locator('.bg-muted\\/30 [role="checkbox"]').first();
    if (await subtaskCheckbox.isVisible()) {
      await subtaskCheckbox.click();

      // Progress should update (look for x/y pattern)
      await expect(page.locator('text=/\\d+\\/\\d+/')).toBeVisible();
    }
  });

  test('can collapse and expand subtasks', async ({ page }) => {
    // Find a parent with subtasks
    const expandButton = page.locator('[aria-label="Expand subtasks"]').first();

    if (await expandButton.isVisible()) {
      // Expand
      await expandButton.click();
      await expect(page.locator('text=Add subtask')).toBeVisible();

      // Collapse
      await page.click('[aria-label="Collapse subtasks"]');
      await expect(page.locator('text=Add subtask')).not.toBeVisible();
    }
  });

  test('deleting parent deletes subtasks', async ({ page }) => {
    // Create parent
    await page.fill('input[placeholder="Add a new todo..."]', 'Parent to delete');
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=Parent to delete')).toBeVisible();

    // Add subtask
    await page.click('[aria-label="Expand subtasks"]');
    await page.click('text=Add subtask');
    await page.fill('input[placeholder="Subtask title..."]', 'Child to delete');
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=Child to delete')).toBeVisible();

    // Delete parent
    await page.click('[aria-label="Delete \\"Parent to delete\\""]');

    // Both should be gone
    await expect(page.locator('text=Parent to delete')).not.toBeVisible();
    await expect(page.locator('text=Child to delete')).not.toBeVisible();
  });

  test('API rejects subtask of subtask', async ({ request }) => {
    // This is an API-level test
    // First create a parent todo, then a subtask, then try to create a sub-subtask

    // Note: This test requires auth cookies, may need adjustment based on test setup
  });
});
```

**Step 2: Run E2E tests**

Run:
```bash
docker compose exec app npx playwright test e2e/subtasks.spec.ts --workers=1
```

Expected: Tests should pass (or identify bugs to fix).

**Step 3: Commit**

```bash
git add e2e/subtasks.spec.ts
git commit -m "test: add E2E tests for subtasks functionality"
```

---

## Task 11: Final Testing and Cleanup

**Step 1: Run all tests**

```bash
docker compose exec app npx playwright test --workers=1
```

Expected: All tests pass.

**Step 2: Run TypeScript check**

```bash
docker compose exec app npx tsc --noEmit
```

Expected: No errors.

**Step 3: Test manually in browser**

1. Create a new todo
2. Click the expand chevron (should appear even without subtasks for adding)
3. Click "Add subtask"
4. Type a subtask title, press Enter
5. Verify subtask appears indented
6. Verify progress badge shows "0/1"
7. Complete the subtask
8. Verify progress updates to "1/1"
9. Collapse and expand the subtasks
10. Delete the parent, verify subtask is also deleted

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during final testing"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Database schema migration | `prisma/schema.prisma` |
| 2 | TypeScript types update | `src/types/index.ts` |
| 3 | GET API includes subtasks | `src/app/api/todos/route.ts` |
| 4 | POST API supports parentId | `src/app/api/todos/route.ts` |
| 5 | SubtaskItem component | `src/components/subtask-item.tsx` |
| 6 | AddSubtaskInput component | `src/components/add-subtask-input.tsx` |
| 7 | TodoItem shows subtasks | `src/components/todo-item.tsx` |
| 8 | TodoList passes handler | `src/components/todo-list.tsx` |
| 9 | Main page integration | `src/app/page.tsx` |
| 10 | E2E tests | `e2e/subtasks.spec.ts` |
| 11 | Final testing | - |
