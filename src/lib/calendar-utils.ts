import {
  format,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
} from 'date-fns';
import { Todo } from '@/types';

/**
 * Format a date as YYYY-MM-DD string for use as a map key
 */
export function formatDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Get 42 dates (6 weeks) for a month grid view, starting from Sunday
 * This includes days from previous and next months to fill the grid
 */
export function getMonthDates(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Start on Sunday
  const gridEnd = endOfWeek(addWeeks(gridStart, 5), { weekStartsOn: 0 }); // End after 6 weeks

  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

/**
 * Get 7 dates for a week view, starting from Sunday
 */
export function getWeekDates(date: Date): Date[] {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 }); // Start on Sunday
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 }); // End on Saturday

  return eachDayOfInterval({ start: weekStart, end: weekEnd });
}

/**
 * Group todos by their due date
 * Todos without due dates are excluded from the result
 */
export function groupTodosByDate(todos: Todo[]): Map<string, Todo[]> {
  const grouped = new Map<string, Todo[]>();

  for (const todo of todos) {
    if (todo.dueDate) {
      const dateKey = todo.dueDate; // Already in YYYY-MM-DD format
      const existing = grouped.get(dateKey) || [];
      existing.push(todo);
      grouped.set(dateKey, existing);
    }
  }

  return grouped;
}
