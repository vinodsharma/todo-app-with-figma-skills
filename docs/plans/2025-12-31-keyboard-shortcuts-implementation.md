# Keyboard Shortcuts Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add keyboard shortcuts for power users to navigate and manage todos efficiently.

**Architecture:** Create a `useKeyboardShortcuts` hook that attaches a document-level keydown listener. Selection state is managed locally and passed to TodoList/TodoItem. A help dialog component shows available shortcuts.

**Tech Stack:** React hooks, TypeScript, shadcn/ui Dialog, Tailwind CSS

---

## Task 1: Add isSelected prop to TodoItem

**Files:**
- Modify: `src/components/todo-item.tsx`

**Step 1: Update TodoItemProps interface**

Add `isSelected` optional prop to the interface:

```typescript
interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => Promise<void>;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => Promise<void>;
  isSelected?: boolean;
}
```

**Step 2: Update component signature and add ring highlight**

Update the function signature and the outer div className:

```typescript
export function TodoItem({ todo, onToggle, onEdit, onDelete, isSelected = false }: TodoItemProps) {
  // ... existing state

  return (
    <div className={cn(
      "group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:bg-accent/50",
      isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
    )}>
```

**Step 3: Verify visually (manual)**

Run: `pnpm dev`
Temporarily hardcode `isSelected={true}` on one TodoItem in TodoList to verify ring appears.

**Step 4: Commit**

```bash
git add src/components/todo-item.tsx
git commit -m "feat: add isSelected prop to TodoItem with ring highlight"
```

---

## Task 2: Update TodoList to pass selection index

**Files:**
- Modify: `src/components/todo-list.tsx`

**Step 1: Add selectedIndex and onSelect props**

```typescript
interface TodoListProps {
  todos: Todo[];
  categories: Category[];
  isLoading: boolean;
  hasActiveFilters?: boolean;
  selectedIndex?: number | null;
  onToggle: (id: string) => Promise<void>;
  onEdit: (id: string, input: UpdateTodoInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}
```

**Step 2: Create flat todos array and pass isSelected**

After the `useMemo` for activeTodos/completedTodos, create a combined array:

```typescript
const allTodos = useMemo(() => [...activeTodos, ...completedTodos], [activeTodos, completedTodos]);
```

**Step 3: Update rendering to use indices**

Replace the separate active/completed mapping with index-aware rendering:

```typescript
{/* Active Todos Section */}
{activeTodos.length > 0 && (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
      <Circle className="h-4 w-4" />
      <span>Active</span>
      <span className="text-muted-foreground">({activeTodos.length})</span>
    </div>
    <div className="space-y-2">
      {activeTodos.map((todo) => {
        const globalIndex = allTodos.findIndex(t => t.id === todo.id);
        return (
          <TodoItem
            key={todo.id}
            todo={todo}
            isSelected={selectedIndex === globalIndex}
            onToggle={onToggle}
            onEdit={handleEditClick}
            onDelete={onDelete}
          />
        );
      })}
    </div>
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
    <div className="space-y-2">
      {completedTodos.map((todo) => {
        const globalIndex = allTodos.findIndex(t => t.id === todo.id);
        return (
          <TodoItem
            key={todo.id}
            todo={todo}
            isSelected={selectedIndex === globalIndex}
            onToggle={onToggle}
            onEdit={handleEditClick}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  </div>
)}
```

**Step 4: Export allTodos for parent component**

Add a return type that exposes the flat list:

```typescript
// At the end, also return allTodos for keyboard navigation
return (
  <TodoListContext.Provider value={{ allTodos }}>
    {/* existing JSX */}
  </TodoListContext.Provider>
);
```

Actually, simpler approach - just accept selectedIndex prop and compute internally.

**Step 5: Commit**

```bash
git add src/components/todo-list.tsx
git commit -m "feat: add selectedIndex prop to TodoList"
```

---

## Task 3: Create KeyboardShortcutsDialog component

**Files:**
- Create: `src/components/keyboard-shortcuts-dialog.tsx`

**Step 1: Create the dialog component**

```typescript
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = {
  navigation: [
    { key: 'j / ↓', description: 'Next todo' },
    { key: 'k / ↑', description: 'Previous todo' },
    { key: 'n', description: 'New todo' },
    { key: '/', description: 'Search' },
  ],
  actions: [
    { key: 'Enter', description: 'Toggle complete' },
    { key: 'e', description: 'Edit todo' },
    { key: 'd', description: 'Delete todo' },
    { key: 'Escape', description: 'Clear selection' },
    { key: '?', description: 'Show this help' },
  ],
};

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">Navigation</h4>
            <div className="space-y-1">
              {shortcuts.navigation.map(({ key, description }) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span>{description}</span>
                  <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">Actions</h4>
            <div className="space-y-1">
              {shortcuts.actions.map(({ key, description }) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span>{description}</span>
                  <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/keyboard-shortcuts-dialog.tsx
git commit -m "feat: add KeyboardShortcutsDialog component"
```

---

## Task 4: Create useKeyboardShortcuts hook

**Files:**
- Create: `src/hooks/use-keyboard-shortcuts.ts`

**Step 1: Create the hook with all shortcut logic**

```typescript
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Todo } from '@/types';

interface UseKeyboardShortcutsOptions {
  todos: Todo[];
  onToggle: (id: string) => Promise<void>;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => Promise<void>;
  enabled?: boolean;
}

interface UseKeyboardShortcutsReturn {
  selectedIndex: number | null;
  setSelectedIndex: (index: number | null) => void;
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    el.getAttribute('contenteditable') === 'true'
  );
}

export function useKeyboardShortcuts({
  todos,
  onToggle,
  onEdit,
  onDelete,
  enabled = true,
}: UseKeyboardShortcutsOptions): UseKeyboardShortcutsReturn {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Use refs to avoid stale closures in event handler
  const todosRef = useRef(todos);
  const selectedIndexRef = useRef(selectedIndex);

  useEffect(() => {
    todosRef.current = todos;
  }, [todos]);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  // Reset selection when todos change
  useEffect(() => {
    setSelectedIndex(null);
  }, [todos.length]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const key = event.key;
    const currentTodos = todosRef.current;
    const currentIndex = selectedIndexRef.current;

    // Escape always works (closes dialogs, clears selection)
    if (key === 'Escape') {
      event.preventDefault();
      setSelectedIndex(null);
      setIsHelpOpen(false);
      return;
    }

    // Skip other shortcuts if typing in input
    if (isInputFocused()) return;

    switch (key) {
      case 'n': {
        event.preventDefault();
        const input = document.querySelector<HTMLInputElement>('input[placeholder="Add a new todo..."]');
        input?.focus();
        break;
      }
      case '/': {
        event.preventDefault();
        const search = document.querySelector<HTMLInputElement>('input[placeholder="Search todos..."]');
        search?.focus();
        break;
      }
      case 'j':
      case 'ArrowDown': {
        event.preventDefault();
        if (currentTodos.length === 0) return;
        const nextIndex = currentIndex === null ? 0 : Math.min(currentIndex + 1, currentTodos.length - 1);
        setSelectedIndex(nextIndex);
        break;
      }
      case 'k':
      case 'ArrowUp': {
        event.preventDefault();
        if (currentTodos.length === 0) return;
        const prevIndex = currentIndex === null ? currentTodos.length - 1 : Math.max(currentIndex - 1, 0);
        setSelectedIndex(prevIndex);
        break;
      }
      case 'Enter': {
        if (currentIndex !== null && currentTodos[currentIndex]) {
          event.preventDefault();
          onToggle(currentTodos[currentIndex].id);
        }
        break;
      }
      case 'e': {
        if (currentIndex !== null && currentTodos[currentIndex]) {
          event.preventDefault();
          onEdit(currentTodos[currentIndex]);
        }
        break;
      }
      case 'd':
      case 'Delete': {
        if (currentIndex !== null && currentTodos[currentIndex]) {
          event.preventDefault();
          onDelete(currentTodos[currentIndex].id);
          setSelectedIndex(null);
        }
        break;
      }
      case '?': {
        event.preventDefault();
        setIsHelpOpen(prev => !prev);
        break;
      }
    }
  }, [enabled, onToggle, onEdit, onDelete]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    selectedIndex,
    setSelectedIndex,
    isHelpOpen,
    setIsHelpOpen,
  };
}
```

**Step 2: Commit**

```bash
git add src/hooks/use-keyboard-shortcuts.ts
git commit -m "feat: add useKeyboardShortcuts hook"
```

---

## Task 5: Integrate keyboard shortcuts in main page

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Import the hook and dialog**

```typescript
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { KeyboardShortcutsDialog } from '@/components/keyboard-shortcuts-dialog';
```

**Step 2: Compute flat todos array for hook**

Add after the existing useMemo calls:

```typescript
// Flat todo list for keyboard navigation (active first, then completed)
const allTodos = useMemo(() => {
  const active = todos.filter(t => !t.completed);
  const completed = todos.filter(t => t.completed);
  return [...active, ...completed];
}, [todos]);
```

**Step 3: Use the hook**

Add after the allTodos memo:

```typescript
// Keyboard shortcuts
const handleEditTodoFromKeyboard = (todo: Todo) => {
  // This will be handled by TodoList's edit dialog
  // We need to expose the edit function differently
};

const { selectedIndex, isHelpOpen, setIsHelpOpen } = useKeyboardShortcuts({
  todos: allTodos,
  onToggle: handleToggleTodo,
  onEdit: handleEditTodoFromKeyboard,
  onDelete: handleDeleteTodo,
});
```

**Step 4: Pass selectedIndex to TodoList**

```typescript
<TodoList
  todos={todos}
  categories={categories}
  isLoading={isLoading}
  hasActiveFilters={hasActiveFilters}
  selectedIndex={selectedIndex}
  onToggle={handleToggleTodo}
  onEdit={handleEditTodo}
  onDelete={handleDeleteTodo}
/>
```

**Step 5: Add the help dialog**

Before the closing `</div>` of the page:

```typescript
<KeyboardShortcutsDialog open={isHelpOpen} onOpenChange={setIsHelpOpen} />
```

**Step 6: Handle edit from keyboard**

Need to lift edit state to page level. Update TodoList to accept onEditClick:

In page.tsx, add state and handler:

```typescript
const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

const handleEditClick = (todo: Todo) => {
  setEditingTodo(todo);
};
```

Update useKeyboardShortcuts call:

```typescript
const { selectedIndex, isHelpOpen, setIsHelpOpen } = useKeyboardShortcuts({
  todos: allTodos,
  onToggle: handleToggleTodo,
  onEdit: handleEditClick,
  onDelete: handleDeleteTodo,
});
```

Move EditTodoDialog from TodoList to page.tsx:

```typescript
{editingTodo && (
  <EditTodoDialog
    todo={editingTodo}
    categories={categories}
    open={!!editingTodo}
    onOpenChange={(open) => !open && setEditingTodo(null)}
    onSave={handleEditTodo}
  />
)}
```

Update TodoList to receive onEditClick prop instead of managing dialog internally.

**Step 7: Commit**

```bash
git add src/app/page.tsx src/components/todo-list.tsx
git commit -m "feat: integrate keyboard shortcuts in main page"
```

---

## Task 6: Update TodoList to use external edit handler

**Files:**
- Modify: `src/components/todo-list.tsx`

**Step 1: Update props to receive onEditClick**

```typescript
interface TodoListProps {
  todos: Todo[];
  categories: Category[];
  isLoading: boolean;
  hasActiveFilters?: boolean;
  selectedIndex?: number | null;
  onToggle: (id: string) => Promise<void>;
  onEditClick: (todo: Todo) => void;
  onEdit: (id: string, input: UpdateTodoInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}
```

**Step 2: Remove internal editingTodo state and dialog**

Remove:
- `const [editingTodo, setEditingTodo] = useState<Todo | null>(null);`
- `const handleEditClick` function
- `const handleEditSave` function
- The `EditTodoDialog` JSX at the bottom

**Step 3: Use onEditClick prop**

Pass `onEditClick` to each TodoItem instead of `handleEditClick`:

```typescript
<TodoItem
  key={todo.id}
  todo={todo}
  isSelected={selectedIndex === globalIndex}
  onToggle={onToggle}
  onEdit={onEditClick}
  onDelete={onDelete}
/>
```

**Step 4: Commit**

```bash
git add src/components/todo-list.tsx
git commit -m "refactor: move edit dialog state to page level"
```

---

## Task 7: Add E2E tests for keyboard shortcuts

**Files:**
- Create: `e2e/keyboard-shortcuts.spec.ts`

**Step 1: Create test file with basic tests**

```typescript
import { test, expect, uniqueTitle } from './fixtures';

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto('/');
  });

  test('n key focuses new todo input', async ({ page }) => {
    // Click somewhere neutral first to ensure not in input
    await page.locator('main').click();
    await page.keyboard.press('n');

    const todoInput = page.getByPlaceholder('Add a new todo...');
    await expect(todoInput).toBeFocused();
  });

  test('/ key focuses search input', async ({ page }) => {
    await page.locator('main').click();
    await page.keyboard.press('/');

    const searchInput = page.getByPlaceholder('Search todos...');
    await expect(searchInput).toBeFocused();
  });

  test('? key opens help dialog', async ({ page }) => {
    await page.locator('main').click();
    await page.keyboard.press('?');

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Keyboard Shortcuts')).toBeVisible();
  });

  test('Escape closes help dialog', async ({ page }) => {
    await page.locator('main').click();
    await page.keyboard.press('?');
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('j/k navigates todos with visual selection', async ({ page }) => {
    // Create two todos
    const todo1 = uniqueTitle('First Todo');
    const todo2 = uniqueTitle('Second Todo');

    const todoInput = page.getByPlaceholder('Add a new todo...');
    await todoInput.fill(todo1);
    await todoInput.press('Enter');
    await expect(page.getByText(todo1)).toBeVisible({ timeout: 5000 });

    await todoInput.fill(todo2);
    await todoInput.press('Enter');
    await expect(page.getByText(todo2)).toBeVisible({ timeout: 5000 });

    // Navigate with j
    await page.locator('main').click();
    await page.keyboard.press('j');

    // First todo should have ring highlight
    const firstTodoCard = page.locator('.rounded-lg.border').filter({ hasText: todo2 });
    await expect(firstTodoCard).toHaveClass(/ring-2/);

    // Press j again to go to second todo
    await page.keyboard.press('j');
    const secondTodoCard = page.locator('.rounded-lg.border').filter({ hasText: todo1 });
    await expect(secondTodoCard).toHaveClass(/ring-2/);
  });

  test('Enter toggles selected todo', async ({ page }) => {
    const todoTitle = uniqueTitle('Toggle Me');

    const todoInput = page.getByPlaceholder('Add a new todo...');
    await todoInput.fill(todoTitle);
    await todoInput.press('Enter');
    await expect(page.getByText(todoTitle)).toBeVisible({ timeout: 5000 });

    // Select and toggle
    await page.locator('main').click();
    await page.keyboard.press('j');
    await page.keyboard.press('Enter');

    // Verify checkbox is now checked
    const todoCard = page.locator('.rounded-lg.border').filter({ hasText: todoTitle });
    const checkbox = todoCard.getByRole('checkbox');
    await expect(checkbox).toBeChecked();
  });

  test('d deletes selected todo', async ({ page }) => {
    const todoTitle = uniqueTitle('Delete Me');

    const todoInput = page.getByPlaceholder('Add a new todo...');
    await todoInput.fill(todoTitle);
    await todoInput.press('Enter');
    await expect(page.getByText(todoTitle)).toBeVisible({ timeout: 5000 });

    // Select and delete
    await page.locator('main').click();
    await page.keyboard.press('j');
    await page.keyboard.press('d');

    // Todo should be gone
    await expect(page.getByText(todoTitle)).not.toBeVisible();
  });

  test('shortcuts do not trigger when typing in input', async ({ page }) => {
    const todoInput = page.getByPlaceholder('Add a new todo...');
    await todoInput.click();
    await todoInput.fill('test?');

    // Help dialog should NOT open
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Input should have the ? character
    await expect(todoInput).toHaveValue('test?');
  });

  test('Escape clears selection', async ({ page }) => {
    const todoTitle = uniqueTitle('Clear Selection');

    const todoInput = page.getByPlaceholder('Add a new todo...');
    await todoInput.fill(todoTitle);
    await todoInput.press('Enter');
    await expect(page.getByText(todoTitle)).toBeVisible({ timeout: 5000 });

    // Select
    await page.locator('main').click();
    await page.keyboard.press('j');

    const todoCard = page.locator('.rounded-lg.border').filter({ hasText: todoTitle });
    await expect(todoCard).toHaveClass(/ring-2/);

    // Clear with Escape
    await page.keyboard.press('Escape');
    await expect(todoCard).not.toHaveClass(/ring-2/);
  });
});
```

**Step 2: Run tests**

Run: `pnpm exec playwright test keyboard-shortcuts.spec.ts --reporter=line`

**Step 3: Commit**

```bash
git add e2e/keyboard-shortcuts.spec.ts
git commit -m "test: add E2E tests for keyboard shortcuts"
```

---

## Task 8: Final integration and cleanup

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Ensure all imports are correct**

Verify these imports at top of page.tsx:

```typescript
import { useState, useMemo } from 'react';
import { Header } from '@/components/header';
import { CategorySidebar } from '@/components/category-sidebar';
import { TodoForm } from '@/components/todo-form';
import { TodoList } from '@/components/todo-list';
import { SearchFilterBar, SearchBarFilters, defaultFilters } from '@/components/search-filter-bar';
import { EditTodoDialog } from '@/components/edit-todo-dialog';
import { KeyboardShortcutsDialog } from '@/components/keyboard-shortcuts-dialog';
import { useTodos } from '@/hooks/use-todos';
import { useCategories } from '@/hooks/use-categories';
import { useDebounce } from '@/hooks/use-debounce';
import { useSortPreference } from '@/hooks/use-sort-preference';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { Priority, TodoQueryParams, Todo } from '@/types';
```

**Step 2: Reset selection when filters change**

In useKeyboardShortcuts hook, also reset on filter changes. Pass a dependency to the hook:

Actually, since todos array changes when filters change, the existing reset logic handles this.

**Step 3: Run full E2E test suite**

Run: `pnpm exec playwright test --reporter=line`

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete keyboard shortcuts implementation (#14)"
```

**Step 5: Push and verify CI**

```bash
git push origin feature/keyboard-shortcuts
```

---

## Summary

Total tasks: 8
Estimated time: 2-3 hours

Files created:
- `src/hooks/use-keyboard-shortcuts.ts`
- `src/components/keyboard-shortcuts-dialog.tsx`
- `e2e/keyboard-shortcuts.spec.ts`

Files modified:
- `src/components/todo-item.tsx`
- `src/components/todo-list.tsx`
- `src/app/page.tsx`
