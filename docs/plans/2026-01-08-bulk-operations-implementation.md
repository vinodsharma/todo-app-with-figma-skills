# Bulk Operations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable users to select multiple todos and perform bulk actions (complete, delete, move to category, change priority) with undo support.

**Architecture:** Toggle-based selection mode managed by a `useSelection` hook. Selection state flows down through TodoList → SortableTodoList → SortableTodoItem → TodoItem. A floating BulkActionBar appears when items are selected. Bulk operations use dedicated API endpoints with Prisma transactions.

**Tech Stack:** React hooks, shadcn/ui components, Next.js API routes, Prisma transactions, sonner toast for undo

---

## Task 1: Create useSelection Hook

**Files:**
- Create: `src/hooks/use-selection.ts`
- Test: `src/hooks/__tests__/use-selection.test.ts`

**Step 1: Write the failing test**

```typescript
// src/hooks/__tests__/use-selection.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useSelection } from '../use-selection';

describe('useSelection', () => {
  it('should start with selection mode disabled', () => {
    const { result } = renderHook(() => useSelection());

    expect(result.current.isSelectionMode).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.selectedCount).toBe(0);
  });

  it('should enter selection mode', () => {
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.enterSelectionMode();
    });

    expect(result.current.isSelectionMode).toBe(true);
  });

  it('should exit selection mode and clear selection', () => {
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.enterSelectionMode();
      result.current.toggleSelection('todo-1');
      result.current.exitSelectionMode();
    });

    expect(result.current.isSelectionMode).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('should toggle single item selection', () => {
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.enterSelectionMode();
      result.current.toggleSelection('todo-1');
    });

    expect(result.current.selectedIds.has('todo-1')).toBe(true);
    expect(result.current.selectedCount).toBe(1);

    act(() => {
      result.current.toggleSelection('todo-1');
    });

    expect(result.current.selectedIds.has('todo-1')).toBe(false);
    expect(result.current.selectedCount).toBe(0);
  });

  it('should set anchor on normal click', () => {
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.enterSelectionMode();
      result.current.toggleSelection('todo-1');
    });

    expect(result.current.anchorId).toBe('todo-1');
  });

  it('should not change anchor on ctrl+click', () => {
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.enterSelectionMode();
      result.current.toggleSelection('todo-1');
      result.current.toggleSelection('todo-2', false, true); // ctrl+click
    });

    expect(result.current.anchorId).toBe('todo-1');
    expect(result.current.selectedIds.has('todo-2')).toBe(true);
  });

  it('should select all items', () => {
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.enterSelectionMode();
      result.current.selectAll(['todo-1', 'todo-2', 'todo-3']);
    });

    expect(result.current.selectedCount).toBe(3);
  });

  it('should deselect all items', () => {
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.enterSelectionMode();
      result.current.selectAll(['todo-1', 'todo-2']);
      result.current.deselectAll();
    });

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isSelectionMode).toBe(true); // stays in selection mode
  });

  it('should select range on shift+click', () => {
    const allIds = ['todo-1', 'todo-2', 'todo-3', 'todo-4', 'todo-5'];
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.enterSelectionMode();
      result.current.toggleSelection('todo-2'); // anchor
    });

    act(() => {
      result.current.selectRange('todo-4', allIds); // shift+click
    });

    expect(result.current.selectedIds.has('todo-2')).toBe(true);
    expect(result.current.selectedIds.has('todo-3')).toBe(true);
    expect(result.current.selectedIds.has('todo-4')).toBe(true);
    expect(result.current.selectedIds.has('todo-1')).toBe(false);
    expect(result.current.selectedIds.has('todo-5')).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/hooks/__tests__/use-selection.test.ts`
Expected: FAIL with "Cannot find module '../use-selection'"

**Step 3: Write minimal implementation**

```typescript
// src/hooks/use-selection.ts
'use client';

import { useState, useCallback, useMemo } from 'react';

interface UseSelectionReturn {
  isSelectionMode: boolean;
  selectedIds: Set<string>;
  selectedCount: number;
  anchorId: string | null;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  toggleSelection: (id: string, isShiftKey?: boolean, isCtrlKey?: boolean) => void;
  selectRange: (toId: string, allIds: string[]) => void;
  selectAll: (ids: string[]) => void;
  deselectAll: () => void;
}

export function useSelection(): UseSelectionReturn {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [anchorId, setAnchorId] = useState<string | null>(null);

  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);

  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    setAnchorId(null);
  }, []);

  const toggleSelection = useCallback((id: string, isShiftKey = false, isCtrlKey = false) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    // Set anchor on normal click, keep it on ctrl+click
    if (!isCtrlKey) {
      setAnchorId(id);
    }
  }, []);

  const selectRange = useCallback((toId: string, allIds: string[]) => {
    if (!anchorId) {
      // No anchor, just select the target
      setSelectedIds(new Set([toId]));
      setAnchorId(toId);
      return;
    }

    const anchorIndex = allIds.indexOf(anchorId);
    const toIndex = allIds.indexOf(toId);

    if (anchorIndex === -1 || toIndex === -1) return;

    const start = Math.min(anchorIndex, toIndex);
    const end = Math.max(anchorIndex, toIndex);

    const rangeIds = allIds.slice(start, end + 1);
    setSelectedIds(new Set(rangeIds));
  }, [anchorId]);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    isSelectionMode,
    selectedIds,
    selectedCount,
    anchorId,
    enterSelectionMode,
    exitSelectionMode,
    toggleSelection,
    selectRange,
    selectAll,
    deselectAll,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/hooks/__tests__/use-selection.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/use-selection.ts src/hooks/__tests__/use-selection.test.ts
git commit -m "feat: add useSelection hook for bulk operations"
```

---

## Task 2: Create SelectionCheckbox Component

**Files:**
- Create: `src/components/bulk-actions/SelectionCheckbox.tsx`
- Test: `src/components/bulk-actions/__tests__/SelectionCheckbox.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/bulk-actions/__tests__/SelectionCheckbox.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SelectionCheckbox } from '../SelectionCheckbox';

describe('SelectionCheckbox', () => {
  it('should render unchecked state', () => {
    render(<SelectionCheckbox checked={false} onChange={() => {}} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('should render checked state with checkmark', () => {
    render(<SelectionCheckbox checked={true} onChange={() => {}} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('should call onChange when clicked', () => {
    const onChange = vi.fn();
    render(<SelectionCheckbox checked={false} onChange={onChange} />);

    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('should pass event modifiers to onChange', () => {
    const onChange = vi.fn();
    render(<SelectionCheckbox checked={false} onChange={onChange} />);

    fireEvent.click(screen.getByRole('checkbox'), { shiftKey: true });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ shiftKey: true }));
  });

  it('should have circular shape styling', () => {
    render(<SelectionCheckbox checked={false} onChange={() => {}} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('rounded-full');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/bulk-actions/__tests__/SelectionCheckbox.test.tsx`
Expected: FAIL with "Cannot find module '../SelectionCheckbox'"

**Step 3: Write minimal implementation**

```typescript
// src/components/bulk-actions/SelectionCheckbox.tsx
'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectionCheckboxProps {
  checked: boolean;
  onChange: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

export function SelectionCheckbox({ checked, onChange, className }: SelectionCheckboxProps) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
        checked
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-muted-foreground hover:border-primary',
        className
      )}
    >
      {checked && <Check className="h-3 w-3" />}
    </button>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/bulk-actions/__tests__/SelectionCheckbox.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/bulk-actions/SelectionCheckbox.tsx src/components/bulk-actions/__tests__/SelectionCheckbox.test.tsx
git commit -m "feat: add SelectionCheckbox component with circular design"
```

---

## Task 3: Create Bulk API Endpoint - bulk-complete

**Files:**
- Create: `src/app/api/todos/bulk-complete/route.ts`
- Test: `src/app/api/todos/__tests__/bulk-complete.test.ts`

**Step 1: Write the failing test**

```typescript
// src/app/api/todos/__tests__/bulk-complete.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../bulk-complete/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    todo: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

vi.mock('@/lib/activity-logger', () => ({
  logActivity: vi.fn(),
}));

describe('POST /api/todos/bulk-complete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new Request('http://localhost/api/todos/bulk-complete', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1'], completed: true }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should complete multiple todos', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const mockTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', completed: false },
      { id: 'todo-2', title: 'Todo 2', userId: 'user-1', completed: false },
    ];

    vi.mocked(prisma.todo.findMany).mockResolvedValue(mockTodos as any);
    vi.mocked(prisma.todo.updateMany).mockResolvedValue({ count: 2 });

    const request = new Request('http://localhost/api/todos/bulk-complete', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1', 'todo-2'], completed: true }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.updated).toBe(2);
  });

  it('should return 400 if no ids provided', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const request = new Request('http://localhost/api/todos/bulk-complete', {
      method: 'POST',
      body: JSON.stringify({ ids: [], completed: true }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should only update todos belonging to user', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    // Only one todo belongs to user
    const mockTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', completed: false },
    ];

    vi.mocked(prisma.todo.findMany).mockResolvedValue(mockTodos as any);
    vi.mocked(prisma.todo.updateMany).mockResolvedValue({ count: 1 });

    const request = new Request('http://localhost/api/todos/bulk-complete', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1', 'todo-2'], completed: true }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.updated).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/app/api/todos/__tests__/bulk-complete.test.ts`
Expected: FAIL with "Cannot find module '../bulk-complete/route'"

**Step 3: Write minimal implementation**

```typescript
// src/app/api/todos/bulk-complete/route.ts
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
      // Find todos that belong to user
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

      // Update all valid todos
      await tx.todo.updateMany({
        where: {
          id: { in: validIds },
        },
        data: { completed },
      });

      // Log activity for each todo
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

      // Fetch updated todos
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
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/app/api/todos/__tests__/bulk-complete.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/todos/bulk-complete/route.ts src/app/api/todos/__tests__/bulk-complete.test.ts
git commit -m "feat: add bulk-complete API endpoint"
```

---

## Task 4: Create Bulk API Endpoint - bulk-delete

**Files:**
- Create: `src/app/api/todos/bulk-delete/route.ts`
- Test: `src/app/api/todos/__tests__/bulk-delete.test.ts`

**Step 1: Write the failing test**

```typescript
// src/app/api/todos/__tests__/bulk-delete.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../bulk-delete/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    todo: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

vi.mock('@/lib/activity-logger', () => ({
  logActivity: vi.fn(),
}));

describe('POST /api/todos/bulk-delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new Request('http://localhost/api/todos/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1'] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should delete multiple todos', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const mockTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1' },
      { id: 'todo-2', title: 'Todo 2', userId: 'user-1' },
    ];

    vi.mocked(prisma.todo.findMany).mockResolvedValue(mockTodos as any);
    vi.mocked(prisma.todo.deleteMany).mockResolvedValue({ count: 2 });

    const request = new Request('http://localhost/api/todos/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1', 'todo-2'] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.deleted).toBe(2);
  });

  it('should return deleted todos for undo support', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const mockTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', priority: 'MEDIUM' },
    ];

    vi.mocked(prisma.todo.findMany).mockResolvedValue(mockTodos as any);
    vi.mocked(prisma.todo.deleteMany).mockResolvedValue({ count: 1 });

    const request = new Request('http://localhost/api/todos/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1'] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.deletedTodos).toEqual(mockTodos);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/app/api/todos/__tests__/bulk-delete.test.ts`
Expected: FAIL with "Cannot find module '../bulk-delete/route'"

**Step 3: Write minimal implementation**

```typescript
// src/app/api/todos/bulk-delete/route.ts
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
      // Find todos that belong to user (for undo support and validation)
      const todos = await tx.todo.findMany({
        where: {
          id: { in: ids },
          userId: session.user.id,
        },
        include: { category: true },
      });

      if (todos.length === 0) {
        return { deleted: 0, deletedTodos: [] };
      }

      const validIds = todos.map((t) => t.id);

      // Log activity for each todo before deletion
      for (const todo of todos) {
        await logActivity({
          entityType: 'TODO',
          entityId: todo.id,
          entityTitle: todo.title,
          action: 'DELETE',
          beforeState: {
            id: todo.id,
            title: todo.title,
            description: todo.description,
            completed: todo.completed,
            priority: todo.priority,
            dueDate: todo.dueDate?.toISOString() || null,
            categoryId: todo.categoryId,
          },
          userId: session.user.id,
        });
      }

      // Delete all valid todos
      await tx.todo.deleteMany({
        where: {
          id: { in: validIds },
        },
      });

      return { deleted: todos.length, deletedTodos: todos };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in bulk delete:', error);
    return NextResponse.json(
      { error: 'Failed to delete todos' },
      { status: 500 }
    );
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/app/api/todos/__tests__/bulk-delete.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/todos/bulk-delete/route.ts src/app/api/todos/__tests__/bulk-delete.test.ts
git commit -m "feat: add bulk-delete API endpoint with undo support"
```

---

## Task 5: Create Bulk API Endpoint - bulk-update

**Files:**
- Create: `src/app/api/todos/bulk-update/route.ts`
- Test: `src/app/api/todos/__tests__/bulk-update.test.ts`

**Step 1: Write the failing test**

```typescript
// src/app/api/todos/__tests__/bulk-update.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../bulk-update/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    todo: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

vi.mock('@/lib/activity-logger', () => ({
  logActivity: vi.fn(),
}));

describe('POST /api/todos/bulk-update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new Request('http://localhost/api/todos/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1'], priority: 'HIGH' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should update priority for multiple todos', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const mockTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', priority: 'LOW' },
      { id: 'todo-2', title: 'Todo 2', userId: 'user-1', priority: 'MEDIUM' },
    ];

    vi.mocked(prisma.todo.findMany).mockResolvedValue(mockTodos as any);
    vi.mocked(prisma.todo.updateMany).mockResolvedValue({ count: 2 });

    const request = new Request('http://localhost/api/todos/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1', 'todo-2'], priority: 'HIGH' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.updated).toBe(2);
  });

  it('should update category for multiple todos', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const mockTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', categoryId: null },
    ];

    vi.mocked(prisma.todo.findMany).mockResolvedValue(mockTodos as any);
    vi.mocked(prisma.todo.updateMany).mockResolvedValue({ count: 1 });

    const request = new Request('http://localhost/api/todos/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1'], categoryId: 'cat-1' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.updated).toBe(1);
  });

  it('should return 400 if no updates provided', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const request = new Request('http://localhost/api/todos/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1'] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/app/api/todos/__tests__/bulk-update.test.ts`
Expected: FAIL with "Cannot find module '../bulk-update/route'"

**Step 3: Write minimal implementation**

```typescript
// src/app/api/todos/bulk-update/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Priority } from '@prisma/client';
import { logActivity } from '@/lib/activity-logger';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ids, categoryId, priority } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one todo ID is required' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: { categoryId?: string | null; priority?: Priority } = {};

    if (categoryId !== undefined) {
      updateData.categoryId = categoryId;
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

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'At least one field to update is required (categoryId or priority)' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Find todos that belong to user
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

      // Update all valid todos
      await tx.todo.updateMany({
        where: {
          id: { in: validIds },
        },
        data: updateData,
      });

      // Log activity for each todo
      for (const todo of todos) {
        await logActivity({
          entityType: 'TODO',
          entityId: todo.id,
          entityTitle: todo.title,
          action: 'UPDATE',
          beforeState: {
            categoryId: todo.categoryId,
            priority: todo.priority,
          },
          afterState: updateData,
          userId: session.user.id,
        });
      }

      // Fetch updated todos
      const updatedTodos = await tx.todo.findMany({
        where: { id: { in: validIds } },
        include: { category: true },
      });

      return { updated: todos.length, todos: updatedTodos };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in bulk update:', error);
    return NextResponse.json(
      { error: 'Failed to update todos' },
      { status: 500 }
    );
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/app/api/todos/__tests__/bulk-update.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/todos/bulk-update/route.ts src/app/api/todos/__tests__/bulk-update.test.ts
git commit -m "feat: add bulk-update API endpoint for category and priority"
```

---

## Task 6: Create BulkActionBar Component

**Files:**
- Create: `src/components/bulk-actions/BulkActionBar.tsx`
- Test: `src/components/bulk-actions/__tests__/BulkActionBar.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/bulk-actions/__tests__/BulkActionBar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BulkActionBar } from '../BulkActionBar';

const mockCategories = [
  { id: 'cat-1', name: 'Work', color: '#ff0000', userId: 'user-1', createdAt: new Date(), sortOrder: 0 },
  { id: 'cat-2', name: 'Personal', color: '#00ff00', userId: 'user-1', createdAt: new Date(), sortOrder: 1 },
];

describe('BulkActionBar', () => {
  const defaultProps = {
    selectedCount: 3,
    onComplete: vi.fn(),
    onDelete: vi.fn(),
    onMoveToCategory: vi.fn(),
    onChangePriority: vi.fn(),
    onClose: vi.fn(),
    categories: mockCategories,
  };

  it('should display selected count', () => {
    render(<BulkActionBar {...defaultProps} />);

    expect(screen.getByText('3 selected')).toBeInTheDocument();
  });

  it('should call onComplete when complete button clicked', () => {
    render(<BulkActionBar {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /complete/i }));
    expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete button clicked', () => {
    render(<BulkActionBar {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(defaultProps.onDelete).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close button clicked', () => {
    render(<BulkActionBar {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /close|deselect/i }));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should not render when selectedCount is 0', () => {
    const { container } = render(<BulkActionBar {...defaultProps} selectedCount={0} />);

    expect(container.firstChild).toBeNull();
  });

  it('should show singular text for 1 selected', () => {
    render(<BulkActionBar {...defaultProps} selectedCount={1} />);

    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/bulk-actions/__tests__/BulkActionBar.test.tsx`
Expected: FAIL with "Cannot find module '../BulkActionBar'"

**Step 3: Write minimal implementation**

```typescript
// src/components/bulk-actions/BulkActionBar.tsx
'use client';

import { Check, Trash2, FolderOpen, Flag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Category, Priority } from '@/types';
import { cn } from '@/lib/utils';

interface BulkActionBarProps {
  selectedCount: number;
  onComplete: () => void;
  onDelete: () => void;
  onMoveToCategory: (categoryId: string | null) => void;
  onChangePriority: (priority: Priority) => void;
  onClose: () => void;
  categories: Category[];
  className?: string;
}

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: 'HIGH', label: 'High', color: 'bg-red-500' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'LOW', label: 'Low', color: 'bg-green-500' },
];

export function BulkActionBar({
  selectedCount,
  onComplete,
  onDelete,
  onMoveToCategory,
  onChangePriority,
  onClose,
  categories,
  className,
}: BulkActionBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        'animate-in slide-in-from-bottom-full duration-200',
        className
      )}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-3">
        <span className="text-sm font-medium">
          {selectedCount} selected
        </span>

        <div className="flex items-center gap-2">
          {/* Complete Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onComplete}
            className="gap-1.5"
          >
            <Check className="h-4 w-4" />
            Complete
          </Button>

          {/* Delete Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>

          {/* Move to Category Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <FolderOpen className="h-4 w-4" />
                Move to...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onMoveToCategory(null)}>
                No Category
              </DropdownMenuItem>
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category.id}
                  onClick={() => onMoveToCategory(category.id)}
                >
                  <span
                    className="mr-2 h-3 w-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priority Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Flag className="h-4 w-4" />
                Priority...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {priorityOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onChangePriority(option.value)}
                >
                  <span className={cn('mr-2 h-2 w-2 rounded-full', option.color)} />
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Deselect all"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/bulk-actions/__tests__/BulkActionBar.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/bulk-actions/BulkActionBar.tsx src/components/bulk-actions/__tests__/BulkActionBar.test.tsx
git commit -m "feat: add BulkActionBar component with floating bottom bar"
```

---

## Task 7: Add Bulk Operations to useTodos Hook

**Files:**
- Modify: `src/hooks/use-todos.ts`
- Modify: `src/hooks/__tests__/use-todos.test.ts`

**Step 1: Write the failing test**

Add these tests to `src/hooks/__tests__/use-todos.test.ts`:

```typescript
// Add to existing describe block in use-todos.test.ts

it('should bulk complete todos', async () => {
  server.use(
    http.post('/api/todos/bulk-complete', () => {
      return HttpResponse.json({ updated: 2, todos: [] });
    })
  );

  const { result } = renderHook(() => useTodos());

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  await act(async () => {
    await result.current.bulkComplete(['todo-1', 'todo-2'], true);
  });

  expect(result.current.todos).toBeDefined();
});

it('should bulk delete todos', async () => {
  server.use(
    http.post('/api/todos/bulk-delete', () => {
      return HttpResponse.json({ deleted: 2, deletedTodos: [] });
    })
  );

  const { result } = renderHook(() => useTodos());

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  await act(async () => {
    await result.current.bulkDelete(['todo-1', 'todo-2']);
  });

  expect(result.current.todos).toBeDefined();
});

it('should bulk update todos', async () => {
  server.use(
    http.post('/api/todos/bulk-update', () => {
      return HttpResponse.json({ updated: 2, todos: [] });
    })
  );

  const { result } = renderHook(() => useTodos());

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  await act(async () => {
    await result.current.bulkUpdate(['todo-1', 'todo-2'], { priority: Priority.HIGH });
  });

  expect(result.current.todos).toBeDefined();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/hooks/__tests__/use-todos.test.ts`
Expected: FAIL with "Property 'bulkComplete' does not exist"

**Step 3: Add bulk operations to useTodos hook**

Add to `src/hooks/use-todos.ts` after the existing functions:

```typescript
// Add to UseTodosReturn interface:
bulkComplete: (ids: string[], completed: boolean) => Promise<{ updated: number }>;
bulkDelete: (ids: string[]) => Promise<{ deleted: number; deletedTodos: Todo[] }>;
bulkUpdate: (ids: string[], data: { categoryId?: string | null; priority?: Priority }) => Promise<{ updated: number }>;

// Add implementations before return statement:
const bulkComplete = async (ids: string[], completed: boolean) => {
  try {
    const response = await fetch('/api/todos/bulk-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, completed }),
    });

    if (!response.ok) {
      throw new Error('Failed to complete todos');
    }

    const data = await response.json();
    await fetchTodos();
    toast.success(`${data.updated} todo${data.updated !== 1 ? 's' : ''} ${completed ? 'completed' : 'uncompleted'}`);
    return data;
  } catch (error) {
    toast.error('Failed to complete todos');
    console.error('Error bulk completing:', error);
    throw error;
  }
};

const bulkDelete = async (ids: string[]) => {
  try {
    const response = await fetch('/api/todos/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete todos');
    }

    const data = await response.json();
    await fetchTodos();
    toast.success(`${data.deleted} todo${data.deleted !== 1 ? 's' : ''} deleted`);
    return data;
  } catch (error) {
    toast.error('Failed to delete todos');
    console.error('Error bulk deleting:', error);
    throw error;
  }
};

const bulkUpdate = async (ids: string[], updateData: { categoryId?: string | null; priority?: Priority }) => {
  try {
    const response = await fetch('/api/todos/bulk-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, ...updateData }),
    });

    if (!response.ok) {
      throw new Error('Failed to update todos');
    }

    const data = await response.json();
    await fetchTodos();

    if (updateData.priority) {
      toast.success(`${data.updated} todo${data.updated !== 1 ? 's' : ''} priority updated`);
    } else if (updateData.categoryId !== undefined) {
      toast.success(`${data.updated} todo${data.updated !== 1 ? 's' : ''} moved`);
    }
    return data;
  } catch (error) {
    toast.error('Failed to update todos');
    console.error('Error bulk updating:', error);
    throw error;
  }
};

// Add to return object:
return {
  // ...existing
  bulkComplete,
  bulkDelete,
  bulkUpdate,
};
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/hooks/__tests__/use-todos.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/use-todos.ts src/hooks/__tests__/use-todos.test.ts
git commit -m "feat: add bulk operations to useTodos hook"
```

---

## Task 8: Create index exports for bulk-actions

**Files:**
- Create: `src/components/bulk-actions/index.ts`

**Step 1: Create the export file**

```typescript
// src/components/bulk-actions/index.ts
export { SelectionCheckbox } from './SelectionCheckbox';
export { BulkActionBar } from './BulkActionBar';
```

**Step 2: Commit**

```bash
git add src/components/bulk-actions/index.ts
git commit -m "feat: add index exports for bulk-actions components"
```

---

## Task 9: Modify SortableTodoItem for Selection Mode

**Files:**
- Modify: `src/components/dnd/SortableTodoItem.tsx`

**Step 1: Update props interface and component**

Modify `src/components/dnd/SortableTodoItem.tsx`:

```typescript
// Update interface to add selection props
interface SortableTodoItemProps {
  todo: Todo;
  onToggle: (id: string) => Promise<void>;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => Promise<void>;
  onAddSubtask?: (parentId: string, title: string) => Promise<void>;
  onSkipRecurrence?: (id: string) => Promise<void>;
  onStopRecurrence?: (id: string) => Promise<void>;
  isSelected?: boolean;
  // New selection props
  isSelectionMode?: boolean;
  isItemSelected?: boolean;
  onSelectionChange?: (e: React.MouseEvent) => void;
}

// Update component to conditionally show drag handle or selection checkbox
export function SortableTodoItem({
  todo,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onSkipRecurrence,
  onStopRecurrence,
  isSelected,
  isSelectionMode = false,
  isItemSelected = false,
  onSelectionChange,
}: SortableTodoItemProps) {
  // ... existing useSortable code ...

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-start gap-2',
        isDragging && 'opacity-50'
      )}
    >
      {isSelectionMode ? (
        <div className="mt-4">
          <SelectionCheckbox
            checked={isItemSelected}
            onChange={onSelectionChange!}
          />
        </div>
      ) : (
        <DragHandle
          listeners={listeners}
          attributes={attributes}
          isDragging={isDragging}
          className="mt-4"
        />
      )}
      <div className="flex-1">
        <TodoItem
          todo={todo}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSubtask={onAddSubtask}
          onSkipRecurrence={onSkipRecurrence}
          onStopRecurrence={onStopRecurrence}
          isSelected={isSelected || isItemSelected}
        />
      </div>
    </div>
  );
}
```

Add import at top:
```typescript
import { SelectionCheckbox } from '@/components/bulk-actions';
```

**Step 2: Commit**

```bash
git add src/components/dnd/SortableTodoItem.tsx
git commit -m "feat: add selection mode support to SortableTodoItem"
```

---

## Task 10: Modify SortableTodoList for Selection Mode

**Files:**
- Modify: `src/components/dnd/SortableTodoList.tsx`

**Step 1: Update props and pass selection state down**

Modify `src/components/dnd/SortableTodoList.tsx`:

```typescript
interface SortableTodoListProps {
  todos: Todo[];
  onToggle: (id: string) => Promise<void>;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => Promise<void>;
  onAddSubtask?: (parentId: string, title: string) => Promise<void>;
  onSkipRecurrence?: (id: string) => Promise<void>;
  onStopRecurrence?: (id: string) => Promise<void>;
  selectedIndex?: number | null;
  todoIndexMap: Map<string, number>;
  // New selection props
  isSelectionMode?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (id: string, e: React.MouseEvent) => void;
}

export function SortableTodoList({
  todos,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onSkipRecurrence,
  onStopRecurrence,
  selectedIndex,
  todoIndexMap,
  isSelectionMode = false,
  selectedIds = new Set(),
  onSelectionChange,
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
            isSelectionMode={isSelectionMode}
            isItemSelected={selectedIds.has(todo.id)}
            onSelectionChange={(e) => onSelectionChange?.(todo.id, e)}
          />
        ))}
      </div>
    </SortableContext>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/dnd/SortableTodoList.tsx
git commit -m "feat: add selection mode support to SortableTodoList"
```

---

## Task 11: Modify TodoList for Selection Mode Integration

**Files:**
- Modify: `src/components/todo-list.tsx`

**Step 1: Add selection props to interface and pass to SortableTodoList**

Modify `src/components/todo-list.tsx`:

```typescript
interface TodoListProps {
  todos: Todo[];
  categories: Category[];
  isLoading: boolean;
  hasActiveFilters?: boolean;
  selectedIndex?: number | null;
  onToggle: (id: string) => Promise<void>;
  onEdit: (id: string, input: UpdateTodoInput) => Promise<void>;
  onEditClick?: (todo: Todo) => void;
  onDelete: (id: string) => Promise<void>;
  onAddSubtask?: (parentId: string, title: string) => Promise<void>;
  onSkipRecurrence?: (id: string) => Promise<void>;
  onStopRecurrence?: (id: string) => Promise<void>;
  // New selection props
  isSelectionMode?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (id: string, e: React.MouseEvent) => void;
}

export function TodoList({
  todos,
  categories,
  isLoading,
  hasActiveFilters = false,
  selectedIndex,
  onToggle,
  onEdit,
  onEditClick,
  onDelete,
  onAddSubtask,
  onSkipRecurrence,
  onStopRecurrence,
  isSelectionMode = false,
  selectedIds = new Set(),
  onSelectionChange,
}: TodoListProps) {
  // ... existing code ...

  // Update both SortableTodoList instances:
  return (
    <div className="space-y-6">
      {activeTodos.length > 0 && (
        <div className="space-y-3">
          {/* ... header ... */}
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
            isSelectionMode={isSelectionMode}
            selectedIds={selectedIds}
            onSelectionChange={onSelectionChange}
          />
        </div>
      )}

      {completedTodos.length > 0 && (
        <div className="space-y-3">
          {/* ... header ... */}
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
            isSelectionMode={isSelectionMode}
            selectedIds={selectedIds}
            onSelectionChange={onSelectionChange}
          />
        </div>
      )}
      {/* ... rest of component ... */}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/todo-list.tsx
git commit -m "feat: add selection mode props to TodoList component"
```

---

## Task 12: Add Select Button to SearchFilterBar

**Files:**
- Modify: `src/components/search-filter-bar.tsx`

**Step 1: Add selection mode toggle button**

Modify `src/components/search-filter-bar.tsx`:

```typescript
// Add to interface
interface SearchFilterBarProps {
  // ... existing props ...
  isSelectionMode?: boolean;
  onSelectionModeChange?: (mode: boolean) => void;
  selectedCount?: number;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
}

// Add to component props destructuring
export function SearchFilterBar({
  // ... existing ...
  isSelectionMode = false,
  onSelectionModeChange,
  selectedCount = 0,
  onSelectAll,
  onDeselectAll,
  className,
}: SearchFilterBarProps) {
  // Add this before the return, after existing handlers:
  const hasSelection = selectedCount > 0;

  // Add this section in the JSX before the Sort Dropdown:
  {/* Selection Mode Toggle */}
  {onSelectionModeChange && (
    <>
      <div className="hidden sm:block h-6 w-px bg-border" />
      {isSelectionMode ? (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => hasSelection ? onDeselectAll?.() : onSelectAll?.()}
            className="text-xs"
          >
            {hasSelection ? 'Deselect All' : 'Select All'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectionModeChange(false)}
          >
            Done
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelectionModeChange(true)}
        >
          Select
        </Button>
      )}
    </>
  )}
```

**Step 2: Commit**

```bash
git add src/components/search-filter-bar.tsx
git commit -m "feat: add Select/Done button to SearchFilterBar"
```

---

## Task 13: Create Delete Confirmation Dialog

**Files:**
- Create: `src/components/bulk-actions/DeleteConfirmDialog.tsx`

**Step 1: Create the dialog component**

```typescript
// src/components/bulk-actions/DeleteConfirmDialog.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  count,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {count} todo{count !== 1 ? 's' : ''}?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. The selected todos will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Add to index exports**

```typescript
// Update src/components/bulk-actions/index.ts
export { SelectionCheckbox } from './SelectionCheckbox';
export { BulkActionBar } from './BulkActionBar';
export { DeleteConfirmDialog } from './DeleteConfirmDialog';
```

**Step 3: Commit**

```bash
git add src/components/bulk-actions/DeleteConfirmDialog.tsx src/components/bulk-actions/index.ts
git commit -m "feat: add DeleteConfirmDialog component"
```

---

## Task 14: Integrate Bulk Operations in Main Page

**Files:**
- Modify: `src/app/(dashboard)/page.tsx`

**Step 1: Add bulk operations integration**

This is the main integration task. Add the useSelection hook, BulkActionBar, and wire everything together:

```typescript
// Add imports
import { useSelection } from '@/hooks/use-selection';
import { BulkActionBar, DeleteConfirmDialog } from '@/components/bulk-actions';

// Inside the component:
const selection = useSelection();
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

// Get all todo IDs for selectAll
const allTodoIds = useMemo(() => todos.map(t => t.id), [todos]);

// Selection handlers
const handleSelectionChange = (id: string, e: React.MouseEvent) => {
  if (e.shiftKey) {
    selection.selectRange(id, allTodoIds);
  } else {
    selection.toggleSelection(id, false, e.ctrlKey || e.metaKey);
  }
};

const handleBulkComplete = async () => {
  const ids = Array.from(selection.selectedIds);
  await bulkComplete(ids, true);
  selection.deselectAll();
};

const handleBulkDelete = async () => {
  const ids = Array.from(selection.selectedIds);
  await bulkDelete(ids);
  selection.deselectAll();
  setShowDeleteConfirm(false);
};

const handleBulkMoveToCategory = async (categoryId: string | null) => {
  const ids = Array.from(selection.selectedIds);
  await bulkUpdate(ids, { categoryId });
  selection.deselectAll();
};

const handleBulkChangePriority = async (priority: Priority) => {
  const ids = Array.from(selection.selectedIds);
  await bulkUpdate(ids, { priority });
  selection.deselectAll();
};

// Escape key handler
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && selection.isSelectionMode) {
      selection.exitSelectionMode();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selection.isSelectionMode, selection]);

// Pass to SearchFilterBar:
<SearchFilterBar
  // ... existing props ...
  isSelectionMode={selection.isSelectionMode}
  onSelectionModeChange={(mode) => mode ? selection.enterSelectionMode() : selection.exitSelectionMode()}
  selectedCount={selection.selectedCount}
  onSelectAll={() => selection.selectAll(allTodoIds)}
  onDeselectAll={selection.deselectAll}
/>

// Pass to TodoList:
<TodoList
  // ... existing props ...
  isSelectionMode={selection.isSelectionMode}
  selectedIds={selection.selectedIds}
  onSelectionChange={handleSelectionChange}
/>

// Add BulkActionBar and DeleteConfirmDialog at the bottom:
{selection.isSelectionMode && (
  <BulkActionBar
    selectedCount={selection.selectedCount}
    onComplete={handleBulkComplete}
    onDelete={() => setShowDeleteConfirm(true)}
    onMoveToCategory={handleBulkMoveToCategory}
    onChangePriority={handleBulkChangePriority}
    onClose={selection.deselectAll}
    categories={categories}
  />
)}

<DeleteConfirmDialog
  open={showDeleteConfirm}
  onOpenChange={setShowDeleteConfirm}
  count={selection.selectedCount}
  onConfirm={handleBulkDelete}
/>
```

**Step 2: Commit**

```bash
git add src/app/\\(dashboard\\)/page.tsx
git commit -m "feat: integrate bulk operations in main dashboard page"
```

---

## Task 15: Add E2E Tests for Bulk Operations

**Files:**
- Create: `e2e/bulk-operations.spec.ts`

**Step 1: Write E2E tests**

```typescript
// e2e/bulk-operations.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Bulk Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login and create test todos
    await page.goto('/');
    // ... login steps ...
  });

  test('should enter and exit selection mode', async ({ page }) => {
    await page.click('button:has-text("Select")');
    await expect(page.locator('button:has-text("Done")')).toBeVisible();

    await page.click('button:has-text("Done")');
    await expect(page.locator('button:has-text("Select")')).toBeVisible();
  });

  test('should show bulk action bar when items selected', async ({ page }) => {
    await page.click('button:has-text("Select")');

    // Click first selection checkbox
    await page.click('[role="checkbox"][aria-checked="false"]');

    await expect(page.locator('text=1 selected')).toBeVisible();
    await expect(page.locator('button:has-text("Complete")')).toBeVisible();
    await expect(page.locator('button:has-text("Delete")')).toBeVisible();
  });

  test('should bulk complete selected todos', async ({ page }) => {
    await page.click('button:has-text("Select")');

    // Select multiple todos
    await page.click('[role="checkbox"][aria-checked="false"]');
    await page.click('[role="checkbox"][aria-checked="false"]');

    await page.click('button:has-text("Complete")');

    // Verify success toast
    await expect(page.locator('text=2 todos completed')).toBeVisible();
  });

  test('should show confirmation before bulk delete', async ({ page }) => {
    await page.click('button:has-text("Select")');
    await page.click('[role="checkbox"][aria-checked="false"]');

    await page.click('button:has-text("Delete")');

    await expect(page.locator('text=Delete 1 todo?')).toBeVisible();
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
  });

  test('should exit selection mode with Escape key', async ({ page }) => {
    await page.click('button:has-text("Select")');
    await expect(page.locator('button:has-text("Done")')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('button:has-text("Select")')).toBeVisible();
  });
});
```

**Step 2: Commit**

```bash
git add e2e/bulk-operations.spec.ts
git commit -m "test: add E2E tests for bulk operations"
```

---

## Final Task: Run All Tests and Verify

**Step 1: Run unit tests**

```bash
npm test
```

**Step 2: Run E2E tests**

```bash
npm run test:e2e
```

**Step 3: Manual verification with Playwright MCP**

Use `browser_navigate` to open the app and manually verify:
1. Select button appears in filter bar
2. Clicking Select shows circular checkboxes
3. Selecting items shows bulk action bar
4. All bulk actions work correctly
5. Escape exits selection mode
6. Done button exits selection mode

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete bulk operations feature (Issue #20)"
```
