# Keyboard Shortcuts Design

**Issue:** #14
**Date:** 2025-12-31
**Status:** Approved

## Overview

Add keyboard shortcuts for power users to navigate and manage todos efficiently without using the mouse.

## Design Decisions

| Decision | Choice |
|----------|--------|
| Shortcut scope | Global (work anywhere except in input fields) |
| Selection indicator | Ring/outline highlight (`ring-2 ring-primary`) |
| Help dialog | Simple centered modal |
| Delete behavior | Immediate (no confirmation) |

## Shortcuts

### Navigation
| Key | Action |
|-----|--------|
| `n` | Focus new todo input |
| `/` | Focus search input |
| `j` or `↓` | Select next todo |
| `k` or `↑` | Select previous todo |

### Actions
| Key | Action |
|-----|--------|
| `Enter` | Toggle selected todo complete/incomplete |
| `e` | Open edit dialog for selected todo |
| `d` or `Delete` | Delete selected todo immediately |
| `Escape` | Close dialog OR clear selection |
| `?` | Show shortcuts help dialog |

## Architecture

### Components

1. **`useKeyboardShortcuts` hook**
   - Listens for keyboard events at document level
   - Manages selection state (`selectedIndex`)
   - Dispatches actions to parent handlers
   - Skips shortcuts when user is typing in input/textarea

2. **`KeyboardShortcutsProvider` context**
   - Shares selection state across components
   - Provides `selectedIndex` and `setSelectedIndex`

3. **`KeyboardShortcutsDialog` component**
   - Modal showing all available shortcuts
   - Grouped into Navigation and Actions sections
   - Uses `<kbd>` elements for key styling

4. **Updated `TodoItem` component**
   - Accepts `isSelected` prop
   - Shows ring highlight when selected

### Event Handling

```typescript
const isInputFocused = () => {
  const el = document.activeElement;
  const tag = el?.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' ||
         el?.getAttribute('contenteditable') === 'true';
};

// In keydown handler:
if (isInputFocused() && key !== 'Escape') return;
```

### Selection State Flow

- `j/k` navigation operates on combined list (active + completed todos)
- Selection index maps to visual order on screen
- Selection resets to `null` when:
  - Todo list changes (add/delete)
  - Filters or search applied
  - Category changed

### Visual Selection

```tsx
<TodoItem
  isSelected={index === selectedIndex}
  // When selected, adds: ring-2 ring-primary ring-offset-2
/>
```

## Edge Cases

- **Empty list:** Navigation and action shortcuts do nothing
- **Delete selected:** Reset selection to `null`
- **Filter applied:** Reset selection to avoid stale index
- **Rapid keypresses:** No debounce needed

## Testing

E2E tests to verify:
- `n` focuses new todo input
- `/` focuses search input
- `j/k` navigates with visual indicator
- `Enter` toggles selected todo
- `e` opens edit dialog
- `d` deletes without confirmation
- `Escape` clears selection
- `?` toggles help dialog
- Shortcuts disabled in input fields

## Files to Create/Modify

### New Files
- `src/hooks/use-keyboard-shortcuts.ts`
- `src/components/keyboard-shortcuts-dialog.tsx`
- `src/contexts/keyboard-shortcuts-context.tsx`
- `e2e/keyboard-shortcuts.spec.ts`

### Modified Files
- `src/components/todo-item.tsx` - Add `isSelected` prop
- `src/components/todo-list.tsx` - Pass selection state
- `src/app/(dashboard)/page.tsx` - Integrate hook
- `src/components/header.tsx` - Optional: Add `?` button
