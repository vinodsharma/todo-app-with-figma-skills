import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useTodos } from '../use-todos';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import { Priority } from '@prisma/client';

/**
 * TDD Tests for Backend Sorting (Issue #30)
 *
 * These tests verify that:
 * 1. The useTodos hook passes sortBy and sortDirection params to the API
 * 2. The API returns todos in the correct order based on sort params
 *
 * Phase 1: These tests should FAIL initially (TDD red phase)
 * Phase 2: Implement backend sorting to make them pass (TDD green phase)
 */

// Mock todos with different priorities and dates for sorting tests
const sortingTestTodos = [
  {
    id: 'todo-low',
    title: 'Low Priority Task',
    description: null,
    completed: false,
    priority: Priority.LOW,
    dueDate: '2025-01-15T00:00:00.000Z',
    createdAt: '2025-01-01T10:00:00.000Z',
    updatedAt: '2025-01-01T10:00:00.000Z',
    userId: 'user-1',
    categoryId: null,
    category: null,
  },
  {
    id: 'todo-high',
    title: 'High Priority Task',
    description: null,
    completed: false,
    priority: Priority.HIGH,
    dueDate: '2025-01-10T00:00:00.000Z',
    createdAt: '2025-01-02T10:00:00.000Z',
    updatedAt: '2025-01-02T10:00:00.000Z',
    userId: 'user-1',
    categoryId: null,
    category: null,
  },
  {
    id: 'todo-medium',
    title: 'Medium Priority Task',
    description: null,
    completed: false,
    priority: Priority.MEDIUM,
    dueDate: '2025-01-20T00:00:00.000Z',
    createdAt: '2025-01-03T10:00:00.000Z',
    updatedAt: '2025-01-03T10:00:00.000Z',
    userId: 'user-1',
    categoryId: null,
    category: null,
  },
  {
    id: 'todo-completed',
    title: 'Completed Task',
    description: null,
    completed: true,
    priority: Priority.HIGH,
    dueDate: null,
    createdAt: '2025-01-04T10:00:00.000Z',
    updatedAt: '2025-01-04T10:00:00.000Z',
    userId: 'user-1',
    categoryId: null,
    category: null,
  },
];

describe('useTodos sorting', () => {
  beforeEach(() => {
    // Reset to default handler that returns unsorted todos
    server.use(
      http.get('/api/todos', () => {
        return HttpResponse.json(sortingTestTodos);
      })
    );
  });

  describe('sortBy and sortDirection params', () => {
    it('should pass sortBy and sortDirection params to API', async () => {
      let capturedUrl = '';
      server.use(
        http.get('/api/todos', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(sortingTestTodos);
        })
      );

      const { result } = renderHook(() =>
        useTodos({
          sortBy: 'priority',
          sortDirection: 'desc',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify sort params are passed to API
      expect(capturedUrl).toContain('sortBy=priority');
      expect(capturedUrl).toContain('sortDirection=desc');
    });

    it('should pass sortBy=createdAt and sortDirection=desc for newest first', async () => {
      let capturedUrl = '';
      server.use(
        http.get('/api/todos', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(sortingTestTodos);
        })
      );

      const { result } = renderHook(() =>
        useTodos({
          sortBy: 'createdAt',
          sortDirection: 'desc',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(capturedUrl).toContain('sortBy=createdAt');
      expect(capturedUrl).toContain('sortDirection=desc');
    });

    it('should pass sortBy=dueDate and sortDirection=asc for earliest first', async () => {
      let capturedUrl = '';
      server.use(
        http.get('/api/todos', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(sortingTestTodos);
        })
      );

      const { result } = renderHook(() =>
        useTodos({
          sortBy: 'dueDate',
          sortDirection: 'asc',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(capturedUrl).toContain('sortBy=dueDate');
      expect(capturedUrl).toContain('sortDirection=asc');
    });

    it('should pass sortBy=title and sortDirection=asc for A-Z', async () => {
      let capturedUrl = '';
      server.use(
        http.get('/api/todos', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(sortingTestTodos);
        })
      );

      const { result } = renderHook(() =>
        useTodos({
          sortBy: 'title',
          sortDirection: 'asc',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(capturedUrl).toContain('sortBy=title');
      expect(capturedUrl).toContain('sortDirection=asc');
    });
  });

  describe('API returns correctly sorted todos', () => {
    it('should return todos sorted by priority desc (HIGH first)', async () => {
      // This test expects the API to return todos sorted by priority
      // The mock should simulate backend sorting
      server.use(
        http.get('/api/todos', ({ request }) => {
          const url = new URL(request.url);
          const sortBy = url.searchParams.get('sortBy');
          const sortDirection = url.searchParams.get('sortDirection');

          if (sortBy === 'priority' && sortDirection === 'desc') {
            // Return sorted: HIGH, MEDIUM, LOW, then completed
            const sorted = [...sortingTestTodos].sort((a, b) => {
              // Completed always last
              if (a.completed !== b.completed) return a.completed ? 1 : -1;
              // Priority order: HIGH > MEDIUM > LOW
              const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
              return priorityOrder[b.priority] - priorityOrder[a.priority];
            });
            return HttpResponse.json(sorted);
          }
          return HttpResponse.json(sortingTestTodos);
        })
      );

      const { result } = renderHook(() =>
        useTodos({
          sortBy: 'priority',
          sortDirection: 'desc',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const todos = result.current.todos;
      const incompleteTodos = todos.filter(t => !t.completed);

      // Verify HIGH comes before MEDIUM comes before LOW
      expect(incompleteTodos[0].priority).toBe(Priority.HIGH);
      expect(incompleteTodos[1].priority).toBe(Priority.MEDIUM);
      expect(incompleteTodos[2].priority).toBe(Priority.LOW);

      // Completed should be last
      expect(todos[todos.length - 1].completed).toBe(true);
    });

    it('should return todos sorted by priority asc (LOW first)', async () => {
      server.use(
        http.get('/api/todos', ({ request }) => {
          const url = new URL(request.url);
          const sortBy = url.searchParams.get('sortBy');
          const sortDirection = url.searchParams.get('sortDirection');

          if (sortBy === 'priority' && sortDirection === 'asc') {
            const sorted = [...sortingTestTodos].sort((a, b) => {
              if (a.completed !== b.completed) return a.completed ? 1 : -1;
              const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
            return HttpResponse.json(sorted);
          }
          return HttpResponse.json(sortingTestTodos);
        })
      );

      const { result } = renderHook(() =>
        useTodos({
          sortBy: 'priority',
          sortDirection: 'asc',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const todos = result.current.todos;
      const incompleteTodos = todos.filter(t => !t.completed);

      // Verify LOW comes before MEDIUM comes before HIGH
      expect(incompleteTodos[0].priority).toBe(Priority.LOW);
      expect(incompleteTodos[1].priority).toBe(Priority.MEDIUM);
      expect(incompleteTodos[2].priority).toBe(Priority.HIGH);
    });

    it('should return todos sorted by dueDate asc (earliest first, nulls last)', async () => {
      server.use(
        http.get('/api/todos', ({ request }) => {
          const url = new URL(request.url);
          const sortBy = url.searchParams.get('sortBy');
          const sortDirection = url.searchParams.get('sortDirection');

          if (sortBy === 'dueDate' && sortDirection === 'asc') {
            const sorted = [...sortingTestTodos].sort((a, b) => {
              if (a.completed !== b.completed) return a.completed ? 1 : -1;
              // Nulls last
              if (!a.dueDate && !b.dueDate) return 0;
              if (!a.dueDate) return 1;
              if (!b.dueDate) return -1;
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            });
            return HttpResponse.json(sorted);
          }
          return HttpResponse.json(sortingTestTodos);
        })
      );

      const { result } = renderHook(() =>
        useTodos({
          sortBy: 'dueDate',
          sortDirection: 'asc',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const todos = result.current.todos;
      const incompleteTodos = todos.filter(t => !t.completed);

      // High priority task has earliest due date (Jan 10)
      expect(incompleteTodos[0].id).toBe('todo-high');
      // Low priority task has next due date (Jan 15)
      expect(incompleteTodos[1].id).toBe('todo-low');
      // Medium priority task has latest due date (Jan 20)
      expect(incompleteTodos[2].id).toBe('todo-medium');
    });

    it('should return todos sorted by createdAt desc (newest first)', async () => {
      server.use(
        http.get('/api/todos', ({ request }) => {
          const url = new URL(request.url);
          const sortBy = url.searchParams.get('sortBy');
          const sortDirection = url.searchParams.get('sortDirection');

          if (sortBy === 'createdAt' && sortDirection === 'desc') {
            const sorted = [...sortingTestTodos].sort((a, b) => {
              if (a.completed !== b.completed) return a.completed ? 1 : -1;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            return HttpResponse.json(sorted);
          }
          return HttpResponse.json(sortingTestTodos);
        })
      );

      const { result } = renderHook(() =>
        useTodos({
          sortBy: 'createdAt',
          sortDirection: 'desc',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const todos = result.current.todos;
      const incompleteTodos = todos.filter(t => !t.completed);

      // Medium was created last (Jan 3)
      expect(incompleteTodos[0].id).toBe('todo-medium');
      // High was created second (Jan 2)
      expect(incompleteTodos[1].id).toBe('todo-high');
      // Low was created first (Jan 1)
      expect(incompleteTodos[2].id).toBe('todo-low');
    });

    it('should return todos sorted by title asc (A-Z)', async () => {
      server.use(
        http.get('/api/todos', ({ request }) => {
          const url = new URL(request.url);
          const sortBy = url.searchParams.get('sortBy');
          const sortDirection = url.searchParams.get('sortDirection');

          if (sortBy === 'title' && sortDirection === 'asc') {
            const sorted = [...sortingTestTodos].sort((a, b) => {
              if (a.completed !== b.completed) return a.completed ? 1 : -1;
              return a.title.localeCompare(b.title);
            });
            return HttpResponse.json(sorted);
          }
          return HttpResponse.json(sortingTestTodos);
        })
      );

      const { result } = renderHook(() =>
        useTodos({
          sortBy: 'title',
          sortDirection: 'asc',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const todos = result.current.todos;
      const incompleteTodos = todos.filter(t => !t.completed);

      // Alphabetical: High, Low, Medium
      expect(incompleteTodos[0].title).toBe('High Priority Task');
      expect(incompleteTodos[1].title).toBe('Low Priority Task');
      expect(incompleteTodos[2].title).toBe('Medium Priority Task');
    });

    it('should always keep completed todos at the end regardless of sort', async () => {
      server.use(
        http.get('/api/todos', ({ request }) => {
          const url = new URL(request.url);
          const sortBy = url.searchParams.get('sortBy');
          const sortDirection = url.searchParams.get('sortDirection');

          // Completed todo has HIGH priority, but should still be last
          if (sortBy === 'priority' && sortDirection === 'desc') {
            const sorted = [...sortingTestTodos].sort((a, b) => {
              if (a.completed !== b.completed) return a.completed ? 1 : -1;
              const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
              return priorityOrder[b.priority] - priorityOrder[a.priority];
            });
            return HttpResponse.json(sorted);
          }
          return HttpResponse.json(sortingTestTodos);
        })
      );

      const { result } = renderHook(() =>
        useTodos({
          sortBy: 'priority',
          sortDirection: 'desc',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const todos = result.current.todos;

      // Completed todo (which has HIGH priority) should be last
      expect(todos[todos.length - 1].completed).toBe(true);
      expect(todos[todos.length - 1].id).toBe('todo-completed');
    });
  });
});
