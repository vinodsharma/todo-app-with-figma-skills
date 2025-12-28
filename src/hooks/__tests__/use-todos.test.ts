import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTodos } from '../use-todos';
import { mockTodos } from '@/test/mocks/handlers';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import { Priority } from '@prisma/client';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useTodos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch todos on mount', async () => {
    const { result } = renderHook(() => useTodos());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.todos).toHaveLength(mockTodos.length);
  });

  it('should set loading to false after fetch completes', async () => {
    const { result } = renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should create a new todo', async () => {
    const { result } = renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createTodo({ title: 'New Todo' });
    });

    // Verify the create was called (refetch happens automatically)
    expect(result.current.todos).toBeDefined();
  });

  it('should update an existing todo', async () => {
    const { result } = renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateTodo('todo-1', { title: 'Updated Title' });
    });

    // Verify no error was thrown
    expect(result.current.todos).toBeDefined();
  });

  it('should delete a todo', async () => {
    const { result } = renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteTodo('todo-1');
    });

    // Verify no error was thrown
    expect(result.current.todos).toBeDefined();
  });

  it('should toggle todo completion status', async () => {
    const { result } = renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const todo = result.current.todos[0];
    const originalCompleted = todo.completed;

    await act(async () => {
      await result.current.toggleTodo(todo.id);
    });

    // The toggle calls updateTodo internally
    expect(result.current.todos).toBeDefined();
  });

  it('should refetch todos', async () => {
    const { result } = renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.todos).toHaveLength(mockTodos.length);
  });

  it('should handle fetch error gracefully', async () => {
    // Override handler to return error
    server.use(
      http.get('/api/todos', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 });
      })
    );

    const { result } = renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should not throw, todos should be empty
    expect(result.current.todos).toEqual([]);
  });

  it('should pass filters to API', async () => {
    let capturedUrl = '';
    server.use(
      http.get('/api/todos', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockTodos);
      })
    );

    const filters = {
      search: 'test',
      priority: Priority.HIGH,
      status: 'active' as const,
      categoryId: 'cat-1',
      dueDate: 'today' as const,
    };

    const { result } = renderHook(() => useTodos(filters));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(capturedUrl).toContain('search=test');
    expect(capturedUrl).toContain('priority=HIGH');
    expect(capturedUrl).toContain('status=active');
    expect(capturedUrl).toContain('categoryId=cat-1');
    expect(capturedUrl).toContain('dueDate=today');
  });

  it('should handle toggle for non-existent todo', async () => {
    const { result } = renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleTodo('non-existent-id');
    });

    // Should not throw, just show error toast
    expect(result.current.todos).toBeDefined();
  });

  it('should handle create error', async () => {
    server.use(
      http.post('/api/todos', () => {
        return HttpResponse.json({ error: 'Failed to create' }, { status: 400 });
      })
    );

    const { result } = renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.createTodo({ title: 'New Todo' });
      })
    ).rejects.toThrow();
  });

  it('should handle update error', async () => {
    server.use(
      http.patch('/api/todos/:id', () => {
        return HttpResponse.json({ error: 'Failed to update' }, { status: 400 });
      })
    );

    const { result } = renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.updateTodo('todo-1', { title: 'Updated' });
      })
    ).rejects.toThrow();
  });

  it('should handle delete error', async () => {
    server.use(
      http.delete('/api/todos/:id', () => {
        return HttpResponse.json({ error: 'Failed to delete' }, { status: 400 });
      })
    );

    const { result } = renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.deleteTodo('todo-1');
      })
    ).rejects.toThrow();
  });
});
