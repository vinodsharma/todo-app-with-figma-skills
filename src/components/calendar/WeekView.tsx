'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Todo } from '@/types';
import { DayCell } from './DayCell';
import { QuickAddPopover } from './QuickAddPopover';
import { TodoDetailPopover } from './TodoDetailPopover';
import {
  getWeekDates,
  groupTodosByDate,
  formatDateKey,
} from '@/lib/calendar-utils';

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
  // State for tracking selected date (for quick add popover)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // State for tracking selected todo (for detail popover)
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  // Memoize the 7 dates for the week
  const dates = useMemo(() => getWeekDates(currentDate), [currentDate]);

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
      {/* Weekday headers with day name and date number */}
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

      {/* TodoDetailPopover for selected todo */}
      {selectedTodo && (
        <TodoDetailPopover
          todo={selectedTodo}
          onToggle={onTodoToggle}
          onReschedule={onTodoReschedule}
          onEditClick={onTodoEditClick}
          open={selectedTodo !== null}
          onOpenChange={handleTodoDetailOpenChange}
          trigger={<span />}
        />
      )}
    </div>
  );
}
