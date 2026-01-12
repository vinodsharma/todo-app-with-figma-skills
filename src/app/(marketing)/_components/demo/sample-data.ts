import { DemoCategory, DemoTodo } from './types';

export const DEMO_CATEGORIES: DemoCategory[] = [
  { id: 'work', name: 'Work', color: '#3B82F6' },
  { id: 'personal', name: 'Personal', color: '#10B981' },
  { id: 'health', name: 'Health', color: '#F59E0B' },
];

// Use fixed dates for consistent SSR/client rendering (January 2026)
// These are relative to a fixed "today" of January 13, 2026
const FIXED_DATES = {
  tomorrow: '2026-01-14T09:00:00.000Z',
  in2Days: '2026-01-15T09:00:00.000Z',
  in3Days: '2026-01-16T09:00:00.000Z',
};

export const DEMO_TODOS: DemoTodo[] = [
  {
    id: '1',
    title: 'Review quarterly report',
    completed: false,
    priority: 'HIGH',
    dueDate: FIXED_DATES.tomorrow,
    category: DEMO_CATEGORIES[0], // Work
  },
  {
    id: '2',
    title: 'Call mom for her birthday',
    completed: false,
    priority: 'MEDIUM',
    dueDate: FIXED_DATES.in2Days,
    category: DEMO_CATEGORIES[1], // Personal
  },
  {
    id: '3',
    title: 'Morning workout routine',
    completed: true,
    priority: 'LOW',
    dueDate: null,
    category: DEMO_CATEGORIES[2], // Health
  },
  {
    id: '4',
    title: 'Prepare presentation slides',
    completed: false,
    priority: 'HIGH',
    dueDate: FIXED_DATES.in3Days,
    category: DEMO_CATEGORIES[0], // Work
  },
  {
    id: '5',
    title: 'Buy groceries',
    completed: false,
    priority: 'LOW',
    dueDate: null,
    category: DEMO_CATEGORIES[1], // Personal
  },
];
