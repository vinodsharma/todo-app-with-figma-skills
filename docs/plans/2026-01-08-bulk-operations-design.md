# Bulk Operations Design

## Overview

Allow users to select and perform actions on multiple todos at once. This feature adds a selection mode with checkbox controls, a floating action bar, and support for keyboard shortcuts and range selection.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Selection mode entry | Toggle mode (Select button) | Clean separation between normal and selection modes |
| Action bar location | Floating bottom bar | Always visible, doesn't shift content |
| Bulk actions | All four (Complete, Delete, Move, Priority) | Full feature set as requested |
| Undo support | Toast with undo button (5s) | Quick, non-blocking, reversible |
| Range selection | Visual range only | Simple, predictable behavior |

---

## Section 1: Selection Mode UI

### Entry/Exit
- **Select button** in toolbar header enters selection mode
- **Done button** (replaces Select) exits selection mode
- **Escape key** exits selection mode
- Completing last bulk action auto-exits if no items remain selected

### Visual Changes in Selection Mode
- Circular checkbox appears before each todo item (left of drag handle)
- Drag handle hidden (no reordering during selection)
- Selected items show filled checkbox + subtle highlight
- "Select All" / "Deselect All" link in header

### Checkbox Design
- Circular shape (differentiates from todo completion checkbox)
- Unchecked: border-muted-foreground
- Checked: bg-primary with checkmark icon
- Matches shadcn/ui aesthetic

---

## Section 2: Floating Bottom Bar

### Appearance
- Fixed position at bottom of viewport
- Slides up with animation when items selected
- Full width with max-width constraint (matches content area)
- Background: bg-background/95 backdrop-blur with border-t

### Layout
```
[Selected count] [Complete] [Delete] [Move to...] [Priority...] [X Close]
```

### Behavior
- Shows when >= 1 item selected
- Hides when 0 items selected (slides down)
- Count updates in real-time: "3 selected"
- Close (X) button deselects all (doesn't exit selection mode)

### Action Buttons
- **Complete**: Toggle icon (check), immediate action
- **Delete**: Trash icon, shows confirmation dialog
- **Move to...**: Folder icon, opens category dropdown
- **Priority...**: Flag icon, opens priority dropdown

### Confirmation Dialogs
Only Delete action shows confirmation:
```
Delete 5 todos?
This action cannot be undone.
[Cancel] [Delete]
```

Other actions execute immediately (reversible via undo).

---

## Section 3: Keyboard & Range Selection

### Click Behaviors
- **Normal click on checkbox**: Toggle single item
- **Shift+click**: Select range from anchor to clicked item
- **Ctrl/Cmd+click**: Toggle without changing anchor

### Range Selection Logic
```typescript
// Track anchor (first selected item)
const [anchorId, setAnchorId] = useState<string | null>(null);

// On normal click: set as new anchor
// On shift+click: select all visible items between anchor and target
// On ctrl/cmd+click: toggle item, keep anchor
```

### Range Selection Scope
- Only selects visible (rendered) items between anchor and target
- Follows visual order in the list
- Works across categories if items visible in flat view

### Keyboard Shortcuts (Selection Mode)
- **Escape**: Exit selection mode
- **Ctrl/Cmd+A**: Select all visible todos
- **Delete/Backspace**: Delete selected (with confirmation)

---

## Section 4: Undo System & API

### Undo Toast
- Appears after bulk action completes
- Shows action description: "5 todos completed"
- **Undo button** reverts the action
- Auto-dismisses after 5 seconds
- Only one undo toast at a time (new action replaces previous)

### Undo Implementation
```typescript
interface UndoState {
  action: 'complete' | 'uncomplete' | 'delete' | 'move' | 'priority';
  todoIds: string[];
  previousState: Record<string, Partial<Todo>>; // For restoration
}
```

### API Endpoints

**POST /api/todos/bulk-complete**
```typescript
// Request
{ ids: string[], completed: boolean }

// Response
{ updated: number, todos: Todo[] }
```

**POST /api/todos/bulk-delete**
```typescript
// Request
{ ids: string[] }

// Response
{ deleted: number }
// Note: Undo stores full todo data before deletion
```

**POST /api/todos/bulk-update**
```typescript
// Request
{ ids: string[], categoryId?: string | null, priority?: Priority }

// Response
{ updated: number, todos: Todo[] }
```

### Transaction Safety
All bulk operations use Prisma transactions:
```typescript
await prisma.$transaction(async (tx) => {
  // Validate all todos belong to user
  // Perform bulk update
  // Log activity for each
});
```

---

## Section 5: Component Architecture

### New Components
```
src/components/bulk-actions/
  ├── BulkActionBar.tsx      # Floating bottom bar with actions
  ├── SelectionCheckbox.tsx  # Circular selection checkbox
  ├── CategoryPicker.tsx     # Dropdown for move to category
  └── PriorityPicker.tsx     # Dropdown for change priority
```

### New Hook
```typescript
// src/hooks/use-selection.ts
interface UseSelectionReturn {
  isSelectionMode: boolean;
  selectedIds: Set<string>;
  selectedCount: number;
  anchorId: string | null;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  toggleSelection: (id: string, isShiftKey?: boolean, isCtrlKey?: boolean) => void;
  selectAll: (ids: string[]) => void;
  deselectAll: () => void;
}
```

### State Flow
```
TodoList (useSelection hook)
  ├── Header (Select/Done button, Select All link)
  ├── SortableTodoItem[] (receives selection state)
  │     └── SelectionCheckbox (onClick → toggleSelection)
  └── BulkActionBar (receives selectedIds, actions)
        ├── CategoryPicker
        └── PriorityPicker
```

### Modified Components
- **TodoList**: Add useSelection hook, pass state down
- **SortableTodoItem**: Accept selection props, show checkbox
- **TodoItem**: Handle selection click events

---

## Acceptance Criteria Mapping

| Requirement | Implementation |
|-------------|----------------|
| Selection checkboxes | SelectionCheckbox component, circular design |
| Bulk action toolbar | BulkActionBar, floating bottom position |
| Confirmation dialogs | AlertDialog for Delete action only |
| Selected count | Real-time count in BulkActionBar |
| Shift+click range | anchorId tracking in useSelection |
| Undo support | Toast with 5s timeout, UndoState tracking |
