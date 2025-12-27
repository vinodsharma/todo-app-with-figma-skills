# Search & Filter Todos - Design Document

**Issue:** #11
**Date:** 2025-12-27
**Status:** Approved

## Overview

Add search and filter capabilities to the todo list, allowing users to quickly find todos by title and filter by priority, completion status, and due date.

## Requirements

- **Search:** Title-only text search (case-insensitive)
- **Filters:**
  - Priority: High, Medium, Low, All
  - Status: Active, Completed, All
  - Due Date: Overdue, Today, This Week, Upcoming, All
- **Architecture:** Server-side filtering for scalability
- **UI:** Filter bar with dropdowns above the todo list

## API Design

### Endpoint: `GET /api/todos`

**Query Parameters:**

| Parameter | Type | Values | Default |
|-----------|------|--------|---------|
| `search` | string | Any text | - |
| `priority` | enum | `HIGH`, `MEDIUM`, `LOW` | - |
| `status` | enum | `active`, `completed` | - |
| `dueDate` | enum | `overdue`, `today`, `week`, `upcoming` | - |
| `categoryId` | string | UUID | - |

**Due Date Filter Logic:**
- `overdue` - dueDate < today AND not completed
- `today` - dueDate = today
- `week` - dueDate within next 7 days
- `upcoming` - dueDate > today (any future date)

**Filter Combination:** All filters use AND logic

## Component Architecture

### New Components

1. **`SearchFilterBar`** - Search input + filter dropdowns

### Modified Files

1. `src/types/index.ts` - Add `TodoFilters` type
2. `src/hooks/use-todos.ts` - Accept filter params, build query string
3. `src/app/api/todos/route.ts` - Parse query params, filter in Prisma
4. `src/app/page.tsx` - Manage filter state, integrate with category selection
5. `src/components/search-filter-bar.tsx` - New component

### State Management

```typescript
interface TodoFilters {
  search: string;
  priority: Priority | null;
  status: 'active' | 'completed' | null;
  dueDate: 'overdue' | 'today' | 'week' | 'upcoming' | null;
  categoryId: string | null;
}
```

Filter state lives in `page.tsx`. Search input is debounced (300ms).

### Data Flow

```
SearchFilterBar → setFilters → useTodos(filters) → API → TodoList
       ↑                                                      ↓
CategorySidebar (updates categoryId) ←────────────────────────┘
```

## UI Design

### Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [🔍 Search todos...                    ] [Priority▼] [Status▼] [Due▼]   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Components Used
- Search: `Input` with `Search` icon (lucide-react)
- Dropdowns: `Select` (shadcn/ui)
- Container: Flex row, gap-3, responsive

### Responsive Behavior
- Desktop: Single row
- Mobile (<640px): Search full width, filters in row below

### Empty State
- Message: "No todos match your filters"
- Action: "Clear filters" button

## Implementation Plan

1. Add `TodoFilters` type to types/index.ts
2. Update API route to handle query parameters
3. Update `useTodos` hook to accept and pass filters
4. Create `SearchFilterBar` component
5. Update `page.tsx` to manage filter state
6. Update empty state in `TodoList`
7. Write tests
