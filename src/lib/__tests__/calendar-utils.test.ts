import { describe, it, expect } from 'vitest';
import { getMonthDates, getWeekDates, groupTodosByDate, formatDateKey } from '../calendar-utils';
import { Todo, Priority } from '@/types';

// Helper to create test todos
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

describe('calendar-utils', () => {
  describe('formatDateKey', () => {
    it('formats date correctly as YYYY-MM-DD', () => {
      const date = new Date(2026, 0, 15); // January 15, 2026
      expect(formatDateKey(date)).toBe('2026-01-15');
    });

    it('pads single digit month and day with zeros', () => {
      const date = new Date(2026, 0, 5); // January 5, 2026
      expect(formatDateKey(date)).toBe('2026-01-05');
    });

    it('formats December correctly', () => {
      const date = new Date(2026, 11, 25); // December 25, 2026
      expect(formatDateKey(date)).toBe('2026-12-25');
    });

    it('handles last day of month', () => {
      const date = new Date(2026, 1, 28); // February 28, 2026
      expect(formatDateKey(date)).toBe('2026-02-28');
    });
  });

  describe('getMonthDates', () => {
    it('returns exactly 42 dates (6 weeks)', () => {
      const date = new Date(2026, 0, 15); // January 2026
      const dates = getMonthDates(date);
      expect(dates).toHaveLength(42);
    });

    it('starts from Sunday of the week containing the 1st of the month', () => {
      // January 2026: 1st is Thursday, so start should be Sunday Dec 28, 2025
      const date = new Date(2026, 0, 15);
      const dates = getMonthDates(date);
      const firstDate = dates[0];
      expect(firstDate.getDay()).toBe(0); // Sunday
      expect(firstDate.getDate()).toBe(28);
      expect(firstDate.getMonth()).toBe(11); // December
      expect(firstDate.getFullYear()).toBe(2025);
    });

    it('includes all days of the month', () => {
      const date = new Date(2026, 0, 15); // January 2026
      const dates = getMonthDates(date);

      // Find all January dates
      const januaryDates = dates.filter(d => d.getMonth() === 0 && d.getFullYear() === 2026);

      // January has 31 days
      expect(januaryDates).toHaveLength(31);
    });

    it('ends on a Saturday (completing the 6 week grid)', () => {
      const date = new Date(2026, 0, 15); // January 2026
      const dates = getMonthDates(date);
      const lastDate = dates[41];
      expect(lastDate.getDay()).toBe(6); // Saturday
    });

    it('handles month starting on Sunday', () => {
      // March 2026 starts on Sunday
      const date = new Date(2026, 2, 15);
      const dates = getMonthDates(date);
      expect(dates[0].getMonth()).toBe(2); // March
      expect(dates[0].getDate()).toBe(1);
    });

    it('handles February in non-leap year', () => {
      // February 2027 (non-leap year)
      const date = new Date(2027, 1, 15);
      const dates = getMonthDates(date);
      expect(dates).toHaveLength(42);

      // February 2027 has 28 days
      const februaryDates = dates.filter(d => d.getMonth() === 1 && d.getFullYear() === 2027);
      expect(februaryDates).toHaveLength(28);
    });
  });

  describe('getWeekDates', () => {
    it('returns exactly 7 dates', () => {
      const date = new Date(2026, 0, 15); // Thursday
      const dates = getWeekDates(date);
      expect(dates).toHaveLength(7);
    });

    it('starts on Sunday', () => {
      const date = new Date(2026, 0, 15); // Thursday January 15, 2026
      const dates = getWeekDates(date);
      expect(dates[0].getDay()).toBe(0); // Sunday
      expect(dates[0].getDate()).toBe(11); // January 11, 2026
    });

    it('ends on Saturday', () => {
      const date = new Date(2026, 0, 15); // Thursday
      const dates = getWeekDates(date);
      expect(dates[6].getDay()).toBe(6); // Saturday
      expect(dates[6].getDate()).toBe(17); // January 17, 2026
    });

    it('handles week spanning two months', () => {
      // January 31, 2026 is Saturday, week starts Jan 25
      const date = new Date(2026, 0, 31);
      const dates = getWeekDates(date);

      // First day should be Sunday Jan 25
      expect(dates[0].getDate()).toBe(25);
      expect(dates[0].getMonth()).toBe(0); // January

      // Last day should be Saturday Jan 31
      expect(dates[6].getDate()).toBe(31);
      expect(dates[6].getMonth()).toBe(0); // January
    });

    it('handles Sunday input (returns same week)', () => {
      const date = new Date(2026, 0, 11); // Sunday
      const dates = getWeekDates(date);
      expect(dates[0].getDate()).toBe(11); // Should start with same Sunday
    });

    it('handles Saturday input', () => {
      const date = new Date(2026, 0, 17); // Saturday
      const dates = getWeekDates(date);
      expect(dates[0].getDate()).toBe(11); // Week starts Sunday Jan 11
      expect(dates[6].getDate()).toBe(17); // Week ends Saturday Jan 17
    });
  });

  describe('groupTodosByDate', () => {
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
        createTodo('3', '2026-01-16'),
        createTodo('4', null),
      ];

      const grouped = groupTodosByDate(todos);

      // Should only have 2 keys
      expect(grouped.size).toBe(2);
      expect(grouped.has('2026-01-15')).toBe(true);
      expect(grouped.has('2026-01-16')).toBe(true);
    });

    it('returns empty map when all todos have no due date', () => {
      const todos = [
        createTodo('1', null),
        createTodo('2', null),
      ];

      const grouped = groupTodosByDate(todos);

      expect(grouped.size).toBe(0);
    });

    it('returns empty map when todos array is empty', () => {
      const grouped = groupTodosByDate([]);

      expect(grouped.size).toBe(0);
    });

    it('preserves todo objects in the grouped result', () => {
      const todo1 = createTodo('1', '2026-01-15');
      const todos = [todo1];

      const grouped = groupTodosByDate(todos);
      const groupedTodos = grouped.get('2026-01-15');

      expect(groupedTodos?.[0]).toBe(todo1);
    });

    it('handles single todo per date', () => {
      const todos = [
        createTodo('1', '2026-01-15'),
        createTodo('2', '2026-01-16'),
        createTodo('3', '2026-01-17'),
      ];

      const grouped = groupTodosByDate(todos);

      expect(grouped.size).toBe(3);
      expect(grouped.get('2026-01-15')).toHaveLength(1);
      expect(grouped.get('2026-01-16')).toHaveLength(1);
      expect(grouped.get('2026-01-17')).toHaveLength(1);
    });
  });
});
