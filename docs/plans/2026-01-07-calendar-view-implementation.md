# Calendar View Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a calendar view to visualize todos by due date with month/week views, quick-add, and click-to-reschedule.

**Architecture:** Custom calendar grid built with Tailwind CSS, integrated alongside existing TodoList with a view toggle in the filter bar. Reuses existing useTodos hook - no new API endpoints.

**Tech Stack:** React, Tailwind CSS, date-fns, shadcn/ui (Popover, Button, Badge)

---

## Task 1: Create Calendar Helper Functions

**Files:**
- Create: `src/lib/calendar-utils.ts`
- Create: `src/lib/__tests__/calendar-utils.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/__tests__/calendar-utils.test.ts
import { describe, it, expect } from 'vitest';
import {
  getMonthDates,
  getWeekDates,
  groupTodosByDate,
  formatDateKey,
} from '../calendar-utils';
import { Todo, Priority } from '@/types';

describe('formatDateKey', () => {
  it('formats date as YYYY-MM-DD string', () => {
    const date = new Date(2026, 0, 15); // Jan 15, 2026
    expect(formatDateKey(date)).toBe('2026-01-15');
  });
});

describe('getMonthDates', () => {
  it('returns 42 dates for a full 6-week grid', () => {
    const date = new Date(2026, 0, 15); // January 2026
    const dates = getMonthDates(date);
    expect(dates).toHaveLength(42);
  });

  it('starts from Sunday of the week containing the 1st', () => {
    const date = new Date(2026, 0, 15); // January 2026 starts on Thursday
    const dates = getMonthDates(date);
    // Jan 1, 2026 is Thursday, so grid starts Sunday Dec 28, 2025
    expect(dates[0].getDate()).toBe(28);
    expect(dates[0].getMonth()).toBe(11); // December
  });

  it('includes days from previous and next months', () => {
    const date = new Date(2026, 0, 15);
    const dates = getMonthDates(date);
    // Should have some December 2025 dates at start
    expect(dates[0].getMonth()).toBe(11);
    // Should have some February 2026 dates at end
    expect(dates[41].getMonth()).toBe(1);
  });
});

describe('getWeekDates', () => {
  it('returns 7 dates', () => {
    const date = new Date(2026, 0, 15); // Thursday
    const dates = getWeekDates(date);
    expect(dates).toHaveLength(7);
  });

  it('starts from Sunday of the given week', () => {
    const date = new Date(2026, 0, 15); // Thursday Jan 15
    const dates = getWeekDates(date);
    expect(dates[0].getDay()).toBe(0); // Sunday
    expect(dates[0].getDate()).toBe(11); // Jan 11
  });

  it('ends on Saturday', () => {
    const date = new Date(2026, 0, 15);
    const dates = getWeekDates(date);
    expect(dates[6].getDay()).toBe(6); // Saturday
    expect(dates[6].getDate()).toBe(17); // Jan 17
  });
});

describe('groupTodosByDate', () => {
  const createTodo = (id: string, dueDate: string | null): Todo => ({
    id,
    title: `Todo ${id}`,
    description: null,
    completed: false,
    priority: Priority.MEDIUM,
    dueDate,
    categoryId: null,
    category: null,
    userId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
    sortOrder: 0,
    parentId: null,
    recurrenceRule: null,
    recurrenceEnd: null,
  });

  it('groups todos by their due date', () => {
    const todos = [
      createTodo('1', '2026-01-15'),
      createTodo('2', '2026-01-15'),
      createTodo('3', '2026-01-16'),
    ];
    const grouped = groupTodosByDate(todos);
    expect(grouped.get('2026-01-15')).toHaveLength(2);
    expect(grouped.get('2026-01-16')).toHaveLength(1);
  });

  it('excludes todos without due dates', () => {
    const todos = [
      createTodo('1', '2026-01-15'),
      createTodo('2', null),
    ];
    const grouped = groupTodosByDate(todos);
    expect(grouped.size).toBe(1);
    expect(grouped.has('2026-01-15')).toBe(true);
  });

  it('returns empty map for empty array', () => {
    const grouped = groupTodosByDate([]);
    expect(grouped.size).toBe(0);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/__tests__/calendar-utils.test.ts`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
// src/lib/calendar-utils.ts
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
} from 'date-fns';
import { Todo } from '@/types';

/**
 * Format a date as YYYY-MM-DD for use as a map key
 */
export function formatDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Get all dates to display in a month view (6 weeks = 42 days)
 * Includes padding days from previous/next months
 */
export function getMonthDates(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const dates = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Always return 42 days (6 weeks) for consistent grid
  while (dates.length < 42) {
    const lastDate = dates[dates.length - 1];
    dates.push(new Date(lastDate.getTime() + 24 * 60 * 60 * 1000));
  }

  return dates;
}

/**
 * Get all dates for a week view (7 days starting from Sunday)
 */
export function getWeekDates(date: Date): Date[] {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
  return eachDayOfInterval({ start: weekStart, end: weekEnd });
}

/**
 * Group todos by their due date
 * Returns a Map with date keys (YYYY-MM-DD) and arrays of todos
 */
export function groupTodosByDate(todos: Todo[]): Map<string, Todo[]> {
  const grouped = new Map<string, Todo[]>();

  for (const todo of todos) {
    if (!todo.dueDate) continue;

    const dateKey = todo.dueDate.split('T')[0]; // Handle ISO strings
    const existing = grouped.get(dateKey) || [];
    existing.push(todo);
    grouped.set(dateKey, existing);
  }

  return grouped;
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/__tests__/calendar-utils.test.ts`
Expected: PASS (all 9 tests)

**Step 5: Commit**

```bash
git add src/lib/calendar-utils.ts src/lib/__tests__/calendar-utils.test.ts
git commit -m "feat(calendar): add calendar helper functions with tests"
```

---

## Task 2: Create View Preference Hook

**Files:**
- Create: `src/hooks/use-view-preference.ts`

**Step 1: Create the hook**

```typescript
// src/hooks/use-view-preference.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

export type ViewMode = 'list' | 'calendar';
export type CalendarViewType = 'month' | 'week';

interface ViewPreference {
  viewMode: ViewMode;
  calendarView: CalendarViewType;
}

const STORAGE_KEY = 'todo-view-preference';

const DEFAULT_PREFERENCE: ViewPreference = {
  viewMode: 'list',
  calendarView: 'month',
};

export function useViewPreference() {
  const [preference, setPreference] = useState<ViewPreference>(DEFAULT_PREFERENCE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ViewPreference;
        if (parsed.viewMode && parsed.calendarView) {
          setPreference(parsed);
        }
      }
    } catch {
      // Ignore invalid stored data
    }
    setIsLoaded(true);
  }, []);

  const updatePreference = useCallback((updates: Partial<ViewPreference>) => {
    setPreference((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const setViewMode = useCallback((viewMode: ViewMode) => {
    updatePreference({ viewMode });
  }, [updatePreference]);

  const setCalendarView = useCallback((calendarView: CalendarViewType) => {
    updatePreference({ calendarView });
  }, [updatePreference]);

  return {
    viewMode: preference.viewMode,
    calendarView: preference.calendarView,
    setViewMode,
    setCalendarView,
    isLoaded,
  };
}
```

**Step 2: Commit**

```bash
git add src/hooks/use-view-preference.ts
git commit -m "feat(calendar): add view preference hook with localStorage"
```

---

## Task 3: Create TodoChip Component

**Files:**
- Create: `src/components/calendar/TodoChip.tsx`

**Step 1: Create the component**

```typescript
// src/components/calendar/TodoChip.tsx
'use client';

import { cn } from '@/lib/utils';
import { Todo, Priority } from '@/types';

interface TodoChipProps {
  todo: Todo;
  onClick?: () => void;
  className?: string;
}

const priorityColors: Record<Priority, string> = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-green-500',
};

export function TodoChip({ todo, onClick, className }: TodoChipProps) {
  const categoryColor = todo.category?.color || '#6b7280';

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 w-full px-1.5 py-0.5 rounded text-xs text-left truncate transition-colors',
        'hover:opacity-80 focus:outline-none focus:ring-1 focus:ring-primary',
        todo.completed && 'opacity-50 line-through',
        className
      )}
      style={{
        backgroundColor: `${categoryColor}15`,
        color: categoryColor,
      }}
      title={todo.title}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full shrink-0',
          priorityColors[todo.priority]
        )}
      />
      <span className="truncate">{todo.title}</span>
    </button>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/calendar/TodoChip.tsx
git commit -m "feat(calendar): add TodoChip component"
```

---

## Task 4: Create DayCell Component

**Files:**
- Create: `src/components/calendar/DayCell.tsx`

**Step 1: Create the component**

```typescript
// src/components/calendar/DayCell.tsx
'use client';

import { cn } from '@/lib/utils';
import { Todo } from '@/types';
import { TodoChip } from './TodoChip';
import { isToday, isSameMonth } from 'date-fns';

interface DayCellProps {
  date: Date;
  currentMonth: Date;
  todos: Todo[];
  onTodoClick?: (todo: Todo) => void;
  onDateClick?: (date: Date) => void;
  maxVisible?: number;
  isWeekView?: boolean;
}

export function DayCell({
  date,
  currentMonth,
  todos,
  onTodoClick,
  onDateClick,
  maxVisible = 3,
  isWeekView = false,
}: DayCellProps) {
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isTodayDate = isToday(date);
  const visibleTodos = isWeekView ? todos : todos.slice(0, maxVisible);
  const hiddenCount = todos.length - visibleTodos.length;

  return (
    <div
      className={cn(
        'border-r border-b border-border p-1 min-h-[80px] flex flex-col',
        isWeekView && 'min-h-[200px]',
        !isCurrentMonth && 'bg-muted/30'
      )}
    >
      {/* Date header */}
      <button
        onClick={() => onDateClick?.(date)}
        className={cn(
          'w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center mb-1 transition-colors',
          'hover:bg-accent',
          isTodayDate && 'bg-primary text-primary-foreground hover:bg-primary/90',
          !isCurrentMonth && 'text-muted-foreground'
        )}
      >
        {date.getDate()}
      </button>

      {/* Todo chips */}
      <div className={cn(
        'flex-1 space-y-0.5 overflow-hidden',
        isWeekView && 'overflow-y-auto'
      )}>
        {visibleTodos.map((todo) => (
          <TodoChip
            key={todo.id}
            todo={todo}
            onClick={() => onTodoClick?.(todo)}
          />
        ))}

        {hiddenCount > 0 && (
          <button
            onClick={() => onDateClick?.(date)}
            className="text-xs text-muted-foreground hover:text-foreground px-1.5"
          >
            +{hiddenCount} more
          </button>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/calendar/DayCell.tsx
git commit -m "feat(calendar): add DayCell component"
```

---

## Task 5: Create CalendarHeader Component

**Files:**
- Create: `src/components/calendar/CalendarHeader.tsx`

**Step 1: Create the component**

```typescript
// src/components/calendar/CalendarHeader.tsx
'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { CalendarViewType } from '@/hooks/use-view-preference';
import { cn } from '@/lib/utils';

interface CalendarHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  calendarView: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
}

export function CalendarHeader({
  currentDate,
  onDateChange,
  calendarView,
  onViewChange,
}: CalendarHeaderProps) {
  const handlePrevious = () => {
    if (calendarView === 'month') {
      onDateChange(subMonths(currentDate, 1));
    } else {
      onDateChange(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (calendarView === 'month') {
      onDateChange(addMonths(currentDate, 1));
    } else {
      onDateChange(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const displayFormat = calendarView === 'month' ? 'MMMM yyyy' : "'Week of' MMM d, yyyy";

  return (
    <div className="flex items-center justify-between mb-4">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handlePrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleToday}>
          Today
        </Button>
        <h2 className="text-lg font-semibold ml-2">
          {format(currentDate, displayFormat)}
        </h2>
      </div>

      {/* View toggle */}
      <div className="flex items-center rounded-md border border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewChange('month')}
          className={cn(
            'rounded-r-none',
            calendarView === 'month' && 'bg-accent'
          )}
        >
          Month
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewChange('week')}
          className={cn(
            'rounded-l-none border-l',
            calendarView === 'week' && 'bg-accent'
          )}
        >
          Week
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/calendar/CalendarHeader.tsx
git commit -m "feat(calendar): add CalendarHeader component"
```

---

## Task 6: Create QuickAddPopover Component

**Files:**
- Create: `src/components/calendar/QuickAddPopover.tsx`

**Step 1: Create the component**

```typescript
// src/components/calendar/QuickAddPopover.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface QuickAddPopoverProps {
  date: Date;
  onAdd: (title: string, dueDate: string) => Promise<void>;
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function QuickAddPopover({
  date,
  onAdd,
  trigger,
  open,
  onOpenChange,
}: QuickAddPopoverProps) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // Focus input when popover opens
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      // Reset when closing
      setTitle('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const dueDate = format(date, 'yyyy-MM-dd');
      await onAdd(title.trim(), dueDate);
      setTitle('');
      onOpenChange?.(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">
            Add todo for {format(date, 'MMM d, yyyy')}
          </div>
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            disabled={isSubmitting}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={!title.trim() || isSubmitting}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/calendar/QuickAddPopover.tsx
git commit -m "feat(calendar): add QuickAddPopover component"
```

---

## Task 7: Create TodoDetailPopover Component

**Files:**
- Create: `src/components/calendar/TodoDetailPopover.tsx`

**Step 1: Create the component**

```typescript
// src/components/calendar/TodoDetailPopover.tsx
'use client';

import { format } from 'date-fns';
import { Calendar, Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Todo, Priority } from '@/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface TodoDetailPopoverProps {
  todo: Todo;
  onToggle: (id: string) => Promise<void>;
  onReschedule: (id: string, newDate: string) => Promise<void>;
  onEditClick: (todo: Todo) => void;
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  HIGH: { label: 'High', className: 'bg-red-500/10 text-red-700 dark:text-red-400' },
  MEDIUM: { label: 'Medium', className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },
  LOW: { label: 'Low', className: 'bg-green-500/10 text-green-700 dark:text-green-400' },
};

export function TodoDetailPopover({
  todo,
  onToggle,
  onReschedule,
  onEditClick,
  trigger,
  open,
  onOpenChange,
}: TodoDetailPopoverProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      await onToggle(todo.id);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return;
    setIsUpdating(true);
    try {
      await onReschedule(todo.id, format(date, 'yyyy-MM-dd'));
      setShowDatePicker(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEdit = () => {
    onOpenChange?.(false);
    onEditClick(todo);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {showDatePicker ? (
          <div className="p-2">
            <CalendarPicker
              mode="single"
              selected={todo.dueDate ? new Date(todo.dueDate) : undefined}
              onSelect={handleDateSelect}
              disabled={isUpdating}
            />
            <div className="flex justify-end p-2 border-t">
              <Button variant="ghost" size="sm" onClick={() => setShowDatePicker(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {/* Title with checkbox */}
            <div className="flex items-start gap-2">
              <Checkbox
                checked={todo.completed}
                onCheckedChange={handleToggle}
                disabled={isUpdating}
                className="mt-0.5"
              />
              <span className={cn(
                'flex-1 font-medium',
                todo.completed && 'line-through text-muted-foreground'
              )}>
                {todo.title}
              </span>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className={priorityConfig[todo.priority].className}>
                {priorityConfig[todo.priority].label}
              </Badge>
              {todo.category && (
                <Badge
                  style={{
                    backgroundColor: `${todo.category.color}20`,
                    color: todo.category.color,
                  }}
                >
                  {todo.category.name}
                </Badge>
              )}
            </div>

            {/* Due date */}
            {todo.dueDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(todo.dueDate), 'MMM d, yyyy')}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowDatePicker(true)}
                disabled={isUpdating}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Reschedule
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleEdit}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/calendar/TodoDetailPopover.tsx
git commit -m "feat(calendar): add TodoDetailPopover component"
```

---

## Task 8: Create MonthView Component

**Files:**
- Create: `src/components/calendar/MonthView.tsx`

**Step 1: Create the component**

```typescript
// src/components/calendar/MonthView.tsx
'use client';

import { useMemo, useState } from 'react';
import { Todo } from '@/types';
import { DayCell } from './DayCell';
import { QuickAddPopover } from './QuickAddPopover';
import { TodoDetailPopover } from './TodoDetailPopover';
import { getMonthDates, groupTodosByDate, formatDateKey } from '@/lib/calendar-utils';

interface MonthViewProps {
  currentDate: Date;
  todos: Todo[];
  onTodoToggle: (id: string) => Promise<void>;
  onTodoReschedule: (id: string, newDate: string) => Promise<void>;
  onTodoEditClick: (todo: Todo) => void;
  onQuickAdd: (title: string, dueDate: string) => Promise<void>;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MonthView({
  currentDate,
  todos,
  onTodoToggle,
  onTodoReschedule,
  onTodoEditClick,
  onQuickAdd,
}: MonthViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  const dates = useMemo(() => getMonthDates(currentDate), [currentDate]);
  const todosByDate = useMemo(() => groupTodosByDate(todos), [todos]);

  const handleDateClick = (date: Date) => {
    setSelectedTodo(null);
    setSelectedDate(date);
  };

  const handleTodoClick = (todo: Todo) => {
    setSelectedDate(null);
    setSelectedTodo(todo);
  };

  return (
    <div className="border-l border-t border-border rounded-lg overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 bg-muted/50">
        {WEEKDAY_LABELS.map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-center text-sm font-medium text-muted-foreground border-r border-b border-border"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {dates.map((date) => {
          const dateKey = formatDateKey(date);
          const dayTodos = todosByDate.get(dateKey) || [];
          const isSelected = selectedDate && formatDateKey(selectedDate) === dateKey;

          return (
            <QuickAddPopover
              key={dateKey}
              date={date}
              onAdd={onQuickAdd}
              open={isSelected}
              onOpenChange={(open) => !open && setSelectedDate(null)}
              trigger={
                <div>
                  <DayCell
                    date={date}
                    currentMonth={currentDate}
                    todos={dayTodos}
                    onDateClick={handleDateClick}
                    onTodoClick={handleTodoClick}
                  />
                </div>
              }
            />
          );
        })}
      </div>

      {/* Todo detail popover */}
      {selectedTodo && (
        <TodoDetailPopover
          todo={selectedTodo}
          onToggle={onTodoToggle}
          onReschedule={onTodoReschedule}
          onEditClick={onTodoEditClick}
          open={!!selectedTodo}
          onOpenChange={(open) => !open && setSelectedTodo(null)}
          trigger={<span />}
        />
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/calendar/MonthView.tsx
git commit -m "feat(calendar): add MonthView component"
```

---

## Task 9: Create WeekView Component

**Files:**
- Create: `src/components/calendar/WeekView.tsx`

**Step 1: Create the component**

```typescript
// src/components/calendar/WeekView.tsx
'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Todo } from '@/types';
import { DayCell } from './DayCell';
import { QuickAddPopover } from './QuickAddPopover';
import { TodoDetailPopover } from './TodoDetailPopover';
import { getWeekDates, groupTodosByDate, formatDateKey } from '@/lib/calendar-utils';

interface WeekViewProps {
  currentDate: Date;
  todos: Todo[];
  onTodoToggle: (id: string) => Promise<void>;
  onTodoReschedule: (id: string, newDate: string) => Promise<void>;
  onTodoEditClick: (todo: Todo) => void;
  onQuickAdd: (title: string, dueDate: string) => Promise<void>;
}

export function WeekView({
  currentDate,
  todos,
  onTodoToggle,
  onTodoReschedule,
  onTodoEditClick,
  onQuickAdd,
}: WeekViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  const dates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const todosByDate = useMemo(() => groupTodosByDate(todos), [todos]);

  const handleDateClick = (date: Date) => {
    setSelectedTodo(null);
    setSelectedDate(date);
  };

  const handleTodoClick = (todo: Todo) => {
    setSelectedDate(null);
    setSelectedTodo(todo);
  };

  return (
    <div className="border-l border-t border-border rounded-lg overflow-hidden">
      {/* Weekday headers with full date */}
      <div className="grid grid-cols-7 bg-muted/50">
        {dates.map((date) => (
          <div
            key={formatDateKey(date)}
            className="px-2 py-2 text-center border-r border-b border-border"
          >
            <div className="text-sm font-medium text-muted-foreground">
              {format(date, 'EEE')}
            </div>
            <div className="text-lg font-semibold">
              {format(date, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {dates.map((date) => {
          const dateKey = formatDateKey(date);
          const dayTodos = todosByDate.get(dateKey) || [];
          const isSelected = selectedDate && formatDateKey(selectedDate) === dateKey;

          return (
            <QuickAddPopover
              key={dateKey}
              date={date}
              onAdd={onQuickAdd}
              open={isSelected}
              onOpenChange={(open) => !open && setSelectedDate(null)}
              trigger={
                <div>
                  <DayCell
                    date={date}
                    currentMonth={currentDate}
                    todos={dayTodos}
                    onDateClick={handleDateClick}
                    onTodoClick={handleTodoClick}
                    isWeekView
                  />
                </div>
              }
            />
          );
        })}
      </div>

      {/* Todo detail popover */}
      {selectedTodo && (
        <TodoDetailPopover
          todo={selectedTodo}
          onToggle={onTodoToggle}
          onReschedule={onTodoReschedule}
          onEditClick={onTodoEditClick}
          open={!!selectedTodo}
          onOpenChange={(open) => !open && setSelectedTodo(null)}
          trigger={<span />}
        />
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/calendar/WeekView.tsx
git commit -m "feat(calendar): add WeekView component"
```

---

## Task 10: Create CalendarView Component

**Files:**
- Create: `src/components/calendar/CalendarView.tsx`
- Create: `src/components/calendar/index.ts`

**Step 1: Create the main component**

```typescript
// src/components/calendar/CalendarView.tsx
'use client';

import { useState } from 'react';
import { Todo } from '@/types';
import { CalendarViewType } from '@/hooks/use-view-preference';
import { CalendarHeader } from './CalendarHeader';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';

interface CalendarViewProps {
  todos: Todo[];
  calendarView: CalendarViewType;
  onCalendarViewChange: (view: CalendarViewType) => void;
  onTodoToggle: (id: string) => Promise<void>;
  onTodoEdit: (id: string, data: { dueDate?: string }) => Promise<void>;
  onTodoEditClick: (todo: Todo) => void;
  onQuickAdd: (title: string, dueDate: string) => Promise<void>;
}

export function CalendarView({
  todos,
  calendarView,
  onCalendarViewChange,
  onTodoToggle,
  onTodoEdit,
  onTodoEditClick,
  onQuickAdd,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleReschedule = async (id: string, newDate: string) => {
    await onTodoEdit(id, { dueDate: newDate });
  };

  const ViewComponent = calendarView === 'month' ? MonthView : WeekView;

  return (
    <div className="space-y-4">
      <CalendarHeader
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        calendarView={calendarView}
        onViewChange={onCalendarViewChange}
      />
      <ViewComponent
        currentDate={currentDate}
        todos={todos}
        onTodoToggle={onTodoToggle}
        onTodoReschedule={handleReschedule}
        onTodoEditClick={onTodoEditClick}
        onQuickAdd={onQuickAdd}
      />
    </div>
  );
}
```

**Step 2: Create barrel export**

```typescript
// src/components/calendar/index.ts
export { CalendarView } from './CalendarView';
export { CalendarHeader } from './CalendarHeader';
export { MonthView } from './MonthView';
export { WeekView } from './WeekView';
export { DayCell } from './DayCell';
export { TodoChip } from './TodoChip';
export { QuickAddPopover } from './QuickAddPopover';
export { TodoDetailPopover } from './TodoDetailPopover';
```

**Step 3: Commit**

```bash
git add src/components/calendar/CalendarView.tsx src/components/calendar/index.ts
git commit -m "feat(calendar): add CalendarView main component"
```

---

## Task 11: Add View Toggle to Filter Bar

**Files:**
- Modify: `src/components/search-filter-bar.tsx`

**Step 1: Update SearchFilterBar to include view toggle**

Add to imports:
```typescript
import { List, CalendarDays } from 'lucide-react';
import { ViewMode } from '@/hooks/use-view-preference';
```

Add to props interface:
```typescript
interface SearchFilterBarProps {
  // ... existing props
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}
```

Add view toggle before sort dropdown (around line 203):
```typescript
{/* View Toggle */}
{onViewModeChange && (
  <>
    <div className="hidden sm:block h-6 w-px bg-border" />
    <div className="flex items-center rounded-md border border-border">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onViewModeChange('list')}
        className={cn(
          'h-9 w-9 rounded-r-none',
          viewMode === 'list' && 'bg-accent'
        )}
        title="List view"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onViewModeChange('calendar')}
        className={cn(
          'h-9 w-9 rounded-l-none border-l',
          viewMode === 'calendar' && 'bg-accent'
        )}
        title="Calendar view"
      >
        <CalendarDays className="h-4 w-4" />
      </Button>
    </div>
  </>
)}
```

**Step 2: Commit**

```bash
git add src/components/search-filter-bar.tsx
git commit -m "feat(calendar): add view toggle to filter bar"
```

---

## Task 12: Integrate Calendar into Main Page

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Add imports and hook**

Add to imports:
```typescript
import { CalendarView } from '@/components/calendar';
import { useViewPreference } from '@/hooks/use-view-preference';
```

Add hook in component:
```typescript
const { viewMode, setViewMode, calendarView, setCalendarView } = useViewPreference();
```

**Step 2: Add quick-add handler**

```typescript
const handleQuickAdd = async (title: string, dueDate: string) => {
  await createTodo({ title, dueDate });
  await refetchCategories();
};
```

**Step 3: Update SearchFilterBar props**

```typescript
<SearchFilterBar
  filters={filters}
  onFiltersChange={setFilters}
  sortOption={sortOption}
  onSortChange={setSortOption}
  viewMode={viewMode}
  onViewModeChange={setViewMode}
/>
```

**Step 4: Conditionally render TodoList or CalendarView**

Replace the TodoList section with:
```typescript
{viewMode === 'list' ? (
  <TodoList
    todos={todos}
    categories={categories}
    isLoading={isLoading}
    hasActiveFilters={hasActiveFilters}
    selectedIndex={selectedIndex}
    onToggle={handleToggleTodo}
    onEdit={handleEditTodo}
    onEditClick={handleEditClick}
    onDelete={handleDeleteTodo}
    onAddSubtask={handleAddSubtask}
    onSkipRecurrence={handleSkipRecurrence}
    onStopRecurrence={handleStopRecurrence}
  />
) : (
  <CalendarView
    todos={todos}
    calendarView={calendarView}
    onCalendarViewChange={setCalendarView}
    onTodoToggle={handleToggleTodo}
    onTodoEdit={handleEditTodo}
    onTodoEditClick={handleEditClick}
    onQuickAdd={handleQuickAdd}
  />
)}
```

**Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(calendar): integrate CalendarView into main page"
```

---

## Task 13: Add Mobile Responsive Styles

**Files:**
- Modify: `src/components/calendar/DayCell.tsx`
- Modify: `src/components/calendar/MonthView.tsx`

**Step 1: Update DayCell for mobile**

Add mobile-specific rendering in DayCell:
```typescript
// In DayCell component, add a prop and conditional rendering
interface DayCellProps {
  // ... existing props
  isMobile?: boolean;
}

// Inside the component, for mobile view show count badge instead of chips
{isMobile ? (
  todos.length > 0 && (
    <div className="flex items-center justify-center">
      <span className="text-xs bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
        {todos.length}
      </span>
    </div>
  )
) : (
  // existing chip rendering
)}
```

**Step 2: Update MonthView to detect mobile**

```typescript
// Add to MonthView
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 640);
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```

Pass `isMobile` to DayCell.

**Step 3: Commit**

```bash
git add src/components/calendar/DayCell.tsx src/components/calendar/MonthView.tsx
git commit -m "feat(calendar): add mobile responsive styles"
```

---

## Task 14: Add E2E Tests

**Files:**
- Create: `e2e/calendar.spec.ts`

**Step 1: Create E2E test file**

```typescript
// e2e/calendar.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Calendar View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('can toggle between list and calendar views', async ({ page }) => {
    // Should start in list view
    await expect(page.getByRole('button', { name: 'List view' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Calendar view' })).toBeVisible();

    // Click calendar view
    await page.getByRole('button', { name: 'Calendar view' }).click();

    // Should show calendar header
    await expect(page.getByRole('button', { name: 'Today' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Month' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Week' })).toBeVisible();
  });

  test('can navigate between months', async ({ page }) => {
    await page.getByRole('button', { name: 'Calendar view' }).click();

    // Get current month text
    const currentMonth = await page.locator('h2').textContent();

    // Click next month
    await page.getByRole('button', { name: /next/i }).click();

    // Month should change
    const newMonth = await page.locator('h2').textContent();
    expect(newMonth).not.toBe(currentMonth);
  });

  test('can switch between month and week views', async ({ page }) => {
    await page.getByRole('button', { name: 'Calendar view' }).click();

    // Should be in month view by default
    await expect(page.getByRole('button', { name: 'Month' })).toHaveClass(/bg-accent/);

    // Switch to week view
    await page.getByRole('button', { name: 'Week' }).click();
    await expect(page.getByRole('button', { name: 'Week' })).toHaveClass(/bg-accent/);
  });

  test('can quick-add todo from calendar', async ({ page }) => {
    await page.getByRole('button', { name: 'Calendar view' }).click();

    // Click on a day cell (today)
    await page.getByRole('button', { name: 'Today' }).click();

    // Find and click a date number
    const todayDate = new Date().getDate().toString();
    await page.locator(`button:has-text("${todayDate}")`).first().click();

    // Quick add popover should appear
    await expect(page.getByPlaceholder('What needs to be done?')).toBeVisible();

    // Add a todo
    await page.getByPlaceholder('What needs to be done?').fill('Test calendar todo');
    await page.getByRole('button', { name: 'Add' }).click();

    // Todo should appear (as chip or after switching to list)
    await page.getByRole('button', { name: 'List view' }).click();
    await expect(page.getByText('Test calendar todo')).toBeVisible();
  });

  test('displays todos on their due dates', async ({ page }) => {
    // First create a todo with a due date
    await page.getByPlaceholder('Add a new todo...').fill('Todo with due date');
    await page.getByRole('button', { name: 'Due date' }).click();

    // Select today's date
    const today = new Date().getDate().toString();
    await page.getByRole('gridcell', { name: today }).click();

    await page.getByRole('button', { name: 'Add' }).click();

    // Switch to calendar view
    await page.getByRole('button', { name: 'Calendar view' }).click();

    // Todo should be visible on the calendar
    await expect(page.getByText('Todo with due date')).toBeVisible();
  });
});
```

**Step 2: Run E2E tests**

Run: `npx playwright test e2e/calendar.spec.ts`
Expected: All tests pass

**Step 3: Commit**

```bash
git add e2e/calendar.spec.ts
git commit -m "test(calendar): add E2E tests for calendar view"
```

---

## Task 15: Run Full Test Suite

**Step 1: Run all unit tests**

Run: `npm test`
Expected: All tests pass

**Step 2: Run all E2E tests**

Run: `npx playwright test`
Expected: All tests pass (or document any pre-existing failures)

**Step 3: Final commit and push**

```bash
git push origin feature/calendar-view
```

---

## Summary

| Task | Description | Estimated Steps |
|------|-------------|-----------------|
| 1 | Calendar helper functions with tests | 5 |
| 2 | View preference hook | 2 |
| 3 | TodoChip component | 2 |
| 4 | DayCell component | 2 |
| 5 | CalendarHeader component | 2 |
| 6 | QuickAddPopover component | 2 |
| 7 | TodoDetailPopover component | 2 |
| 8 | MonthView component | 2 |
| 9 | WeekView component | 2 |
| 10 | CalendarView main component | 3 |
| 11 | View toggle in filter bar | 2 |
| 12 | Main page integration | 5 |
| 13 | Mobile responsive styles | 3 |
| 14 | E2E tests | 3 |
| 15 | Full test suite | 3 |

**Total: 15 tasks, ~40 steps**
