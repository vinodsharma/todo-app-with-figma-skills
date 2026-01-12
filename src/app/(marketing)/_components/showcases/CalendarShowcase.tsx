'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Use a fixed month for consistent SSR/client rendering (January 2026)
const DISPLAY_MONTH = 'January 2026';
const TODAY = 13; // Fixed "today" for demo
const DAYS_IN_MONTH = 31;
const FIRST_DAY_OF_WEEK = 3; // January 2026 starts on Wednesday (0=Sun, 3=Wed)

// Generate calendar days
const days = Array.from({ length: 42 }, (_, i) => {
  const day = i - FIRST_DAY_OF_WEEK + 1;
  if (day < 1 || day > DAYS_IN_MONTH) return null;
  return day;
});

// Days with tasks (relative to fixed "today")
const daysWithTasks = [TODAY, TODAY + 1, TODAY + 2, TODAY + 3, TODAY + 5].filter(d => d <= DAYS_IN_MONTH);

// Sample tasks for selected day
const selectedDayTasks = [
  { title: 'Review quarterly report', priority: 'high' },
  { title: 'Team standup', priority: 'medium' },
];

const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function CalendarShowcase() {
  return (
    <div className="p-3 h-full flex flex-col">
      {/* Month header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">{DISPLAY_MONTH}</span>
        <div className="flex gap-1">
          <button className="p-1 rounded hover:bg-muted" aria-label="Previous month">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button className="p-1 rounded hover:bg-muted" aria-label="Next month">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day) => (
          <div key={day} className="text-[10px] text-center text-muted-foreground font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {days.map((day, i) => (
          <div
            key={i}
            className={cn(
              'relative flex items-center justify-center text-[11px] rounded aspect-square',
              day === null && 'invisible',
              day === TODAY && 'bg-primary text-primary-foreground font-medium',
              day !== TODAY && daysWithTasks.includes(day ?? 0) && 'font-medium',
              day !== TODAY && day !== null && 'hover:bg-muted'
            )}
          >
            {day}
            {/* Task indicator dot */}
            {day !== null && daysWithTasks.includes(day) && day !== TODAY && (
              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
            )}
          </div>
        ))}
      </div>

      {/* Tasks for today */}
      <div className="mt-3 pt-3 border-t space-y-1">
        <div className="text-[10px] font-medium text-muted-foreground">Today&apos;s Tasks</div>
        {selectedDayTasks.map((task, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                task.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'
              )}
            />
            <span className="truncate">{task.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
