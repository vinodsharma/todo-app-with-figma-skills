'use client';

import { useState, useMemo } from 'react';
import { Todo } from '@/types';
import { DayCell } from './DayCell';
import { QuickAddPopover } from './QuickAddPopover';
import {
  getMonthDates,
  groupTodosByDate,
  formatDateKey,
} from '@/lib/calendar-utils';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface MonthViewProps {
  currentDate: Date;
  todos: Todo[];
  onTodoToggle: (id: string) => Promise<void>;
  onTodoReschedule: (id: string, newDate: string) => Promise<void>;
  onTodoEditClick: (todo: Todo) => void;
  onQuickAdd: (title: string, dueDate: string) => Promise<void>;
}

export function MonthView({
  currentDate,
  todos,
  onTodoToggle,
  onTodoReschedule,
  onTodoEditClick,
  onQuickAdd,
}: MonthViewProps) {
  // State for tracking selected date (for quick add popover)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // State for tracking selected todo (for detail popover)
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  // Memoize the 42 dates for the month grid
  const dates = useMemo(() => getMonthDates(currentDate), [currentDate]);

  // Memoize the grouped todos by date
  const todosByDate = useMemo(() => groupTodosByDate(todos), [todos]);

  // Handle date click - opens quick add popover
  const handleDateClick = (date: Date) => {
    // Clear selected todo when opening quick add
    setSelectedTodo(null);
    setSelectedDate(date);
  };

  // Handle todo click - opens detail popover
  const handleTodoClick = (todo: Todo) => {
    // Clear selected date when opening todo detail
    setSelectedDate(null);
    setSelectedTodo(todo);
  };

  // Handle quick add popover open change
  const handleQuickAddOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedDate(null);
    }
  };

  // Handle todo detail popover open change
  const handleTodoDetailOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedTodo(null);
    }
  };

  return (
    <div className="border-l border-t border-border rounded-lg overflow-hidden">
      {/* Weekday header row */}
      <div className="grid grid-cols-7 bg-muted/50">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="border-r border-b border-border px-2 py-1.5 text-xs font-medium text-muted-foreground text-center"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {dates.map((date) => {
          const dateKey = formatDateKey(date);
          const dateTodos = todosByDate.get(dateKey) || [];
          const isQuickAddOpen = selectedDate !== null && formatDateKey(selectedDate) === dateKey;

          return (
            <QuickAddPopover
              key={dateKey}
              date={date}
              onAdd={onQuickAdd}
              open={isQuickAddOpen}
              onOpenChange={handleQuickAddOpenChange}
              trigger={
                <div>
                  <DayCell
                    date={date}
                    currentMonth={currentDate}
                    todos={dateTodos}
                    selectedTodoId={selectedTodo?.id}
                    onDateClick={handleDateClick}
                    onTodoClick={handleTodoClick}
                    onTodoOpenChange={handleTodoDetailOpenChange}
                    onTodoToggle={onTodoToggle}
                    onTodoReschedule={onTodoReschedule}
                    onTodoEditClick={onTodoEditClick}
                  />
                </div>
              }
            />
          );
        })}
      </div>
    </div>
  );
}
