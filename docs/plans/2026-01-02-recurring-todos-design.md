# Recurring Todos Design (Issue #16)

## Overview

Add support for recurring todos that automatically regenerate on a schedule when completed.

## Design Decisions

| Decision | Choice |
|----------|--------|
| When to create next occurrence | On completion |
| Recurrence rule storage | iCal RRULE format |
| Completed todo handling | Mark complete, create fresh next occurrence |
| Recurrence UI | Dropdown with presets + custom modal |
| Recurrence indicator | Small icon badge (↻) |
| Skip/end actions | Actions in todo menu |
| Timezone handling | Store UTC, display local |

## Data Model

```prisma
model Todo {
  // ... existing fields

  recurrenceRule  String?    // iCal RRULE format, e.g. "FREQ=WEEKLY;BYDAY=MO,WE,FR"
  recurrenceEnd   DateTime?  // Optional end date for recurrence
}
```

**Key points:**
- `recurrenceRule` stores the iCal RRULE string (null = non-recurring)
- `recurrenceEnd` is optional - recurrence continues indefinitely unless set
- Each occurrence is independent (no linking between occurrences)
- Library: `rrule` npm package for parsing and date calculation

## RRULE Examples

| Pattern | RRULE |
|---------|-------|
| Daily | `FREQ=DAILY` |
| Every weekday | `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR` |
| Weekly on Mon/Wed/Fri | `FREQ=WEEKLY;BYDAY=MO,WE,FR` |
| Monthly on 15th | `FREQ=MONTHLY;BYMONTHDAY=15` |
| Monthly last day | `FREQ=MONTHLY;BYMONTHDAY=-1` |
| Every 2 weeks | `FREQ=WEEKLY;INTERVAL=2` |

## UI Components

### Recurrence Selector (create/edit modal)

Dropdown options:
- "Does not repeat"
- "Daily"
- "Weekly"
- "Monthly"
- "Custom..."

**Custom modal fields:**
- Frequency: Daily / Weekly / Monthly
- Interval: "Every [N] days/weeks/months"
- Weekly: Checkboxes for days (Mon-Sun)
- Monthly: Day of month (1-31 or "Last day")
- End: "Never" / "On date" (date picker)

### Todo Item Changes

- Repeat icon (↻) next to due date for recurring todos
- Hover tooltip: "Repeats daily/weekly/monthly"
- Menu actions: "Skip" and "Stop repeating"

## API Logic

### On Completion (toggle endpoint)

```typescript
// When completing a recurring todo:
1. Mark current todo as completed
2. If recurrenceRule exists:
   a. Parse RRULE with rrule.js
   b. Calculate next occurrence date after current dueDate
   c. If next date is before recurrenceEnd (or no end):
      - Create new todo with same: title, description, priority, category, recurrenceRule, recurrenceEnd
      - Set dueDate to calculated next date
      - Subtasks: NOT copied (each occurrence starts fresh)
```

### Skip Action

- Mark `completed = true`
- Do NOT create next occurrence
- Keep `recurrenceRule` intact (can un-complete if mistake)

### Stop Repeating Action

- Set `recurrenceRule = null`
- Set `recurrenceEnd = null`
- Todo becomes regular one-time todo

## Testing Strategy

### Unit Tests

- Complete recurring todo → creates next occurrence with correct date
- Complete recurring todo past end date → no new occurrence
- Skip recurring todo → completes without creating next
- Stop repeating → removes recurrence rule
- RRULE parsing for each pattern (daily, weekly, monthly, custom)

### E2E Tests

- Create todo with "Daily" recurrence → verify icon appears
- Complete recurring todo → verify new todo with next date
- Custom recurrence modal → set weekly Mon/Wed/Fri → verify
- Skip occurrence → no new todo created
- Stop repeating → icon disappears

### Edge Cases

- Monthly on 31st → handles months with fewer days
- Recurrence end date reached → stops creating
- Timezone: create at 11pm → correct next day

## Files to Modify

- `prisma/schema.prisma` - Add recurrence fields
- `src/types/index.ts` - Update Todo type
- `src/app/api/todos/route.ts` - Handle recurrence on completion
- `src/app/api/todos/[id]/route.ts` - Skip/stop actions
- `src/components/todo-modal.tsx` - Add recurrence selector
- `src/components/recurrence-selector.tsx` - New component
- `src/components/custom-recurrence-modal.tsx` - New component
- `src/components/todo-item.tsx` - Show recurrence icon
- `src/lib/recurrence.ts` - RRULE helper functions
- `e2e/recurring-todos.spec.ts` - E2E tests
