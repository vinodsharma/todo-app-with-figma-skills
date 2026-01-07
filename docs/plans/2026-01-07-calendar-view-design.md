# Calendar View Design

**Issue:** #19
**Date:** 2026-01-07
**Branch:** feature/calendar-view

## Overview

Add a calendar view to visualize todos by due date. Users can toggle between list and calendar views, see todos color-coded by category, and quickly add or reschedule todos.

## Decisions

| Decision | Choice |
|----------|--------|
| Library | @shadcn/ui calendar + custom grid |
| Color coding | By category (priority as indicator) |
| View toggle | In filter bar |
| Views | Month and week |
| Reschedule | Click (not drag) |
| Empty date click | Quick-add todo |

## Component Architecture

```
components/
  calendar/
    CalendarView.tsx       # Main container, manages month/week state
    MonthView.tsx          # Month grid with day cells
    WeekView.tsx           # Week grid with day columns
    DayCell.tsx            # Single day cell with todo chips
    TodoChip.tsx           # Compact todo display (title + priority dot)
    QuickAddPopover.tsx    # Popover for adding todo on date click
    CalendarHeader.tsx     # Month/year navigation + view switcher
```

### Data Flow

```
page.tsx
├── useTodos() → todos[]
├── viewMode state ('list' | 'calendar')
├── TodoList (when viewMode === 'list')
└── CalendarView (when viewMode === 'calendar')
    ├── MonthView or WeekView
    └── DayCell[] → TodoChip[]
```

No new API endpoints needed - reuses existing todos query.

## Visual Design

### Month View Layout

- 7-column grid (Sun-Sat), 5-6 rows depending on month
- Day cells show date number in corner, todo chips stacked below
- Today's date highlighted with primary color ring
- Days outside current month shown faded (gray text)
- Max 3 todos visible per cell, "+N more" link if overflow

### Week View Layout

- 7-column grid, single row
- Taller cells (more vertical space per day)
- Shows all todos for each day (scrollable if many)

### TodoChip

```
┌─────────────────────────┐
│ ● Buy groceries         │  ← category color bg, priority dot on left
└─────────────────────────┘
```

- Background: category color at 10% opacity
- Left border or dot: priority color (red/yellow/green)
- Text: truncated title, single line
- Completed todos: strikethrough, muted colors

### CalendarHeader

```
┌─────────────────────────────────────────────┐
│  < January 2026 >          [Month] [Week]   │
└─────────────────────────────────────────────┘
```

- Left/right arrows for navigation
- Month/year display
- View toggle buttons (Month/Week) on right

## Interactions

### Click on TodoChip

- Opens popover with: title, due date picker, priority badge, category badge
- "Edit" button to open full EditTodoDialog
- "Complete" checkbox to toggle status
- Quick reschedule without leaving calendar

### Click on Empty DayCell

- Opens QuickAddPopover anchored to that cell
- Contains: title input (auto-focused), Add button
- Due date pre-filled to clicked date, priority=Medium, no category
- Enter submits, Escape closes
- After adding, popover closes and todo appears in cell

### Navigation

- Arrow buttons move month/week forward/backward
- "Today" button jumps to current date
- View toggle (Month/Week) persists to localStorage

### Mobile/Responsive

- Month view: smaller cells, show count badge instead of chips ("3 todos")
- Tap cell to expand and see todos for that day
- Week view: horizontally scrollable if needed

## State Management

### New State

```typescript
const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
const [calendarDate, setCalendarDate] = useState(new Date());
const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');
```

- Persist `viewMode` and `calendarView` to localStorage
- No new API endpoints needed

### Helper Functions

```typescript
// Group todos by date string for calendar rendering
function groupTodosByDate(todos: Todo[]): Map<string, Todo[]>

// Get array of dates for current month/week view
function getMonthDates(date: Date): Date[]
function getWeekDates(date: Date): Date[]
```

## Testing Strategy

### Unit Tests

- `groupTodosByDate` correctly buckets todos
- `getMonthDates` / `getWeekDates` return correct date arrays
- Edge cases: todos without due dates filtered out, month boundaries

### Integration Tests

- CalendarView renders correct number of days
- TodoChip displays with correct category color
- QuickAddPopover creates todo with correct date

### E2E Tests

- Toggle from list to calendar view
- Navigate between months
- Click date, add todo, verify it appears
- Click todo, change due date, verify it moves
- Switch between month and week views
