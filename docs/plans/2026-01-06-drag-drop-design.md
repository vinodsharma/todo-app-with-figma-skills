# Drag & Drop Reordering Design

**Issue:** #18
**Date:** 2026-01-06
**Branch:** feature/drag-drop-reordering

## Overview

Implement drag and drop functionality to reorder todos within categories, move todos between categories, and reorder categories in the sidebar. Uses @dnd-kit/core for the implementation.

## Scope

Full implementation including:
1. Reorder todos within a category
2. Move todos between categories via drag
3. Reorder categories in sidebar
4. Visual indicators and touch support

## Schema Changes

### Todo Model

```prisma
model Todo {
  // ... existing fields
  sortOrder   Int       @default(0)  // Lower = higher in list (top)
}
```

### Category Model

```prisma
model Category {
  // ... existing fields
  sortOrder   Int       @default(0)  // Lower = higher in sidebar
}
```

### Sort Order Behavior

- **New todos:** Added at top of list with `sortOrder = 0`
- **Existing todos:** Shifted down (increment sortOrder) when new todo added
- **Manual order:** Overrides all other sorting (priority, due date filters show items within their manual order)
- **Gaps allowed:** When reordering, use gaps (e.g., 10, 20, 30) to minimize database updates

### Migration

```sql
ALTER TABLE "Todo" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Category" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing data by creation date (newest first = lower sortOrder)
UPDATE "Todo" SET "sortOrder" = subquery.row_num FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "categoryId" ORDER BY "createdAt" DESC) as row_num
  FROM "Todo"
) AS subquery WHERE "Todo".id = subquery.id;
```

## Component Architecture

### New Components

```
components/
  dnd/
    DndProvider.tsx       # Wraps app with DndContext, sensors, collision detection
    SortableTodoList.tsx  # SortableContext wrapper for todo lists
    SortableTodoItem.tsx  # Wraps TodoItem with useSortable
    SortableCategory.tsx  # Makes sidebar categories draggable
    DragHandle.tsx        # Grip icon component with aria-label
    DragOverlay.tsx       # Custom overlay shown while dragging
```

### Component Hierarchy

```
DndProvider
├── Sidebar
│   └── SortableContext (categories)
│       └── SortableCategory[]
│           └── DragHandle
└── TodoList
    └── SortableContext (todos)
        └── SortableTodoItem[]
            ├── DragHandle
            └── TodoItem (existing)
```

### DndProvider Implementation

```tsx
// components/dnd/DndProvider.tsx
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { useSensor, useSensors, PointerSensor, KeyboardSensor, TouchSensor } from '@dnd-kit/core';

export function DndProvider({ children }: { children: React.ReactNode }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlay>{activeItem && <DragOverlayContent item={activeItem} />}</DragOverlay>
    </DndContext>
  );
}
```

## Data Flow & State Management

### useTodos Hook Extension

```typescript
// hooks/useTodos.ts (additions)
interface UseTodosReturn {
  // ... existing
  reorderTodo: (todoId: string, newIndex: number, newCategoryId?: string) => Promise<void>;
  isReordering: boolean;
}
```

### Optimistic Update Flow

```
User drags item
    ↓
onDragEnd fires
    ↓
Optimistic update (local state)
    ↓
API call (PATCH /api/todos/reorder)
    ↓
Success? → Done
Failure? → Rollback to previous state + show error toast
```

### API Endpoints

```typescript
// PATCH /api/todos/reorder
{
  todoId: string;
  newSortOrder: number;
  newCategoryId?: string;  // If moving between categories
}

// PATCH /api/categories/reorder
{
  categoryId: string;
  newSortOrder: number;
}
```

### Batch Updates

When reordering, update affected items in a single transaction:

```typescript
// Reorder todo from position 2 to position 0
await prisma.$transaction([
  prisma.todo.update({ where: { id: movedTodoId }, data: { sortOrder: 0 } }),
  prisma.todo.updateMany({
    where: { categoryId, sortOrder: { gte: 0, lt: 2 }, id: { not: movedTodoId } },
    data: { sortOrder: { increment: 1 } }
  })
]);
```

## Visual Feedback & Accessibility

### Drag Handle

- **Design:** Dedicated grip icon (6 dots) on left side of each item
- **Visibility:** Always visible (not hover-only) for discoverability
- **Cursor:** `cursor-grab` default, `cursor-grabbing` when active

```tsx
// components/dnd/DragHandle.tsx
export function DragHandle({ listeners, attributes }: DragHandleProps) {
  return (
    <button
      className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
      aria-label="Drag to reorder"
      {...listeners}
      {...attributes}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
}
```

### Drop Indicators

- **Horizontal line:** Shows insertion point between items
- **Category highlight:** Light background when dragging over category
- **Invalid drop:** Subtle shake animation or red tint

### Drag Overlay

- **Appearance:** Slightly elevated (shadow), reduced opacity (0.9)
- **Content:** Simplified version of item (title + priority indicator only)
- **Cursor follows:** Overlay follows cursor with smooth animation

### Keyboard Support

| Key | Action |
|-----|--------|
| Space/Enter | Pick up focused item |
| Arrow Up/Down | Move item in list |
| Arrow Left/Right | Move to adjacent category |
| Space/Enter | Drop item |
| Escape | Cancel drag |

### Screen Reader Announcements

```tsx
const announcements = {
  onDragStart: ({ active }) => `Picked up ${active.data.current.title}`,
  onDragOver: ({ over }) => over ? `Over ${over.data.current.title}` : 'Not over a droppable area',
  onDragEnd: ({ active, over }) => `Dropped ${active.data.current.title} ${over ? `after ${over.data.current.title}` : 'in original position'}`,
  onDragCancel: () => 'Drag cancelled',
};
```

## Testing Strategy

### Unit Tests

- `useSortable` hook behavior - drag state, transform calculations
- `reorderTodos` and `reorderCategories` API functions
- Sort order calculation logic (insertion between items)
- Optimistic update and rollback behavior

### Integration Tests

- DndContext event handlers (onDragStart, onDragEnd, onDragCancel)
- API endpoints for updating sort order (batch updates)
- Cross-category todo movement with category reassignment

### E2E Tests (Playwright)

- Drag todo within same category, verify order persists after reload
- Drag todo to different category, verify category assignment
- Drag category in sidebar, verify order persists
- Keyboard reordering (Space to pick up, arrows to move, Enter to drop)
- Touch drag simulation for mobile support

### Edge Cases

- Drag while data is loading (should be disabled)
- Concurrent edits (another user reorders while dragging)
- Drag to empty category
- Cancel drag mid-flight (Escape key)
- Network failure during reorder (rollback to original position)

## Implementation Order

1. Schema migration (add sortOrder fields)
2. API endpoints for reordering
3. DndProvider and core infrastructure
4. SortableTodoItem and todo reordering
5. Cross-category movement
6. SortableCategory for sidebar
7. Visual polish and accessibility
8. E2E tests
