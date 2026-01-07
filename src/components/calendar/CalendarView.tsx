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
