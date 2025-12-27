# Sorting Options for Todos - Design Document

## Overview
Add sorting capability to the todo list, allowing users to order todos by various criteria while maintaining the Active/Completed grouping.

## Requirements (from Issue #12)
- Sort by Priority (High to Low, Low to High)
- Sort by Due Date (Earliest first, Latest first)
- Sort by Created Date (Newest first, Oldest first)
- Sort by Alphabetical (A-Z, Z-A)
- Persist user's sort preference
- Works alongside Active/Completed grouping
- Visual indicator of current sort order

## Design Decisions

### 1. UI Location
Add sort dropdown to the existing SearchFilterBar component, placed after the filter dropdowns.

### 2. Sorting Approach: Client-Side
- Sorting happens in the TodoList component using useMemo
- Simpler implementation, no API changes needed
- Fast for typical todo list sizes (< 1000 items)
- Works seamlessly with existing filters

### 3. Persistence: localStorage
- Store sort preference in localStorage
- No database schema changes
- Per-device preference (acceptable for this use case)
- Key: `todo-sort-preference`

### 4. Sort Within Groups
- Maintain Active/Completed grouping
- Apply sort order within each group separately
- Consistent with existing UX

## Sort Options

| Sort Field | Direction | Display Name |
|-----------|-----------|--------------|
| priority | desc | Priority: High → Low |
| priority | asc | Priority: Low → High |
| dueDate | asc | Due Date: Earliest |
| dueDate | desc | Due Date: Latest |
| createdAt | desc | Created: Newest |
| createdAt | asc | Created: Oldest |
| title | asc | Title: A → Z |
| title | desc | Title: Z → A |

## Types

```typescript
export type SortField = 'priority' | 'dueDate' | 'createdAt' | 'title';
export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  field: SortField;
  direction: SortDirection;
}
```

## Implementation Plan

1. Add sort types to `types/index.ts`
2. Create `useSortPreference` hook for localStorage persistence
3. Add sort dropdown to SearchFilterBar
4. Implement sorting logic in TodoList component
5. Update page.tsx to manage sort state

## Component Changes

### SearchFilterBar
- Add optional `sortOption` and `onSortChange` props
- Add ArrowUpDown icon for sort dropdown
- Visual indicator when non-default sort is active

### TodoList
- Accept sorted todos (sorting done in parent)
- No changes to internal grouping logic

### page.tsx
- Add sort state with useSortPreference hook
- Sort todos in useMemo before passing to TodoList
