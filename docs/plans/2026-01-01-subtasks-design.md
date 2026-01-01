# Subtasks / Nested Todos Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create implementation plan from this design.

**Goal:** Allow todos to have single-level subtasks for breaking down complex tasks.

**Issue:** #15

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Nesting depth | Single level only | Covers 90% of use cases, keeps UI simple |
| Auto-complete parent | Never | User stays in control, predictable behavior |
| Add subtask UI | Inline button | Discoverable, fast, minimal friction |
| Default state | Collapsed | Keeps list scannable, progress indicator shows status |
| Expand state storage | Local component state | Collapsed default is sensible reset, avoids over-engineering |

---

## Data Model

### Schema Change

```prisma
model Todo {
  // ... existing fields
  parentId  String?
  parent    Todo?   @relation("Subtasks", fields: [parentId], references: [id], onDelete: Cascade)
  subtasks  Todo[]  @relation("Subtasks")
}
```

### Constraints

- `parentId` is nullable (top-level todos have no parent)
- Subtasks cannot have subtasks (enforced in API: reject if parent already has a parentId)
- Cascade delete: deleting parent removes all subtasks
- Subtasks inherit `categoryId` from parent on creation

### Type Changes

```typescript
interface Todo {
  // ... existing fields
  parentId: string | null;
  subtasks?: Todo[];  // Only included when fetching parent todos
  _count?: {
    subtasks: number;
  };
}
```

---

## UI Components

### TodoItem Changes

- Add expand/collapse chevron icon (only visible if todo has subtasks)
- Show progress indicator: "2/4" badge next to title when collapsed
- When expanded, render subtasks indented below with lighter styling
- "Add subtask" button appears at bottom of expanded subtask list

### Visual Hierarchy

```
┌─────────────────────────────────────────────────┐
│ ▶ ☐ Buy groceries                    [2/4] ... │  ← Parent (collapsed)
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ▼ ☐ Buy groceries                    [2/4] ... │  ← Parent (expanded)
├─────────────────────────────────────────────────┤
│   ☑ Milk                                        │  ← Subtask (indented)
│   ☑ Eggs                                        │
│   ☐ Bread                                       │
│   ☐ Cheese                                      │
│   + Add subtask                                 │  ← Inline add button
└─────────────────────────────────────────────────┘
```

### Subtask Styling

- Indented with left padding/margin
- Slightly smaller text or muted colors
- Simple: checkbox + title + delete button only
- No priority/due date selectors (inherits context from parent)

### Interactions

- Click chevron or parent row to expand/collapse
- Click "+ Add subtask" to show inline input field
- Press Enter to save subtask, Escape to cancel

---

## API Changes

### GET /api/todos (list todos)

```typescript
// Only fetch top-level todos
where: { userId, parentId: null }

// Include subtasks and count
include: {
  category: true,
  subtasks: {
    orderBy: { createdAt: 'asc' },
    include: { category: true }
  },
  _count: { select: { subtasks: true } }
}
```

### POST /api/todos (create todo)

```typescript
// Accept parentId in body
const { title, parentId, ...rest } = body;

// If parentId provided, validate:
if (parentId) {
  const parent = await prisma.todo.findUnique({ where: { id: parentId } });

  // Parent must exist, belong to user, and not be a subtask itself
  if (!parent || parent.userId !== userId || parent.parentId !== null) {
    return error(400, "Invalid parent");
  }

  // Inherit category from parent
  categoryId = parent.categoryId;
}
```

### PATCH /api/todos/:id (update todo)

- No changes needed - subtasks update same as regular todos
- Prevent changing `parentId` after creation (keeps it simple)

### DELETE /api/todos/:id

- No changes needed - Prisma cascade handles subtask deletion

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Create subtask when parent filtered out | Still works (API doesn't care about filters) |
| Complete parent | Doesn't affect subtasks (independent states) |
| Delete parent with subtasks | Cascade deletes all subtasks |
| Search/filter | Applies to parent todos only; subtasks visible when parent matches |
| Sorting | Applies to parents; subtasks always sorted by createdAt asc |

---

## Testing

### E2E Tests

1. Create a todo, add subtask, verify progress shows "0/1"
2. Complete subtask, verify progress updates to "1/1"
3. Expand/collapse parent, verify subtask visibility toggles
4. Delete parent with subtasks, verify all removed
5. Try adding subtask to a subtask via API, verify rejected

### Unit Tests

1. API rejects subtask of subtask (nesting limit)
2. API rejects parentId for non-existent or other user's todo
3. Subtask inherits categoryId from parent
4. Progress count calculation correct

---

## Out of Scope

- Keyboard navigation into subtasks (future enhancement)
- Drag-drop reordering of subtasks
- Due dates on individual subtasks
- Converting subtask to top-level todo
