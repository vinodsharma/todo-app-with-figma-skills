'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { Todo, CreateTodoInput, UpdateTodoInput, TodoQueryParams } from '@/types';

interface UseTodosOptions {
  filters?: TodoQueryParams;
  enabled?: boolean; // Whether to fetch (default: true)
}

interface UseTodosReturn {
  todos: Todo[];
  isLoading: boolean;
  createTodo: (input: CreateTodoInput) => Promise<void>;
  updateTodo: (id: string, input: UpdateTodoInput) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

function isOptionsObject(arg: TodoQueryParams | UseTodosOptions | undefined): arg is UseTodosOptions {
  return arg !== undefined && 'enabled' in arg;
}

export function useTodos(filtersOrOptions?: TodoQueryParams | UseTodosOptions): UseTodosReturn {
  // Support both old signature (filters) and new signature (options object)
  let filters: TodoQueryParams | undefined;
  let enabled = true;

  if (isOptionsObject(filtersOrOptions)) {
    filters = filtersOrOptions.filters;
    enabled = filtersOrOptions.enabled ?? true;
  } else {
    filters = filtersOrOptions;
  }
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTodos = useCallback(async () => {
    try {
      setIsLoading(true);

      // Build query string from filters
      const params = new URLSearchParams();
      if (filters?.search) {
        params.set('search', filters.search);
      }
      if (filters?.categoryId) {
        params.set('categoryId', filters.categoryId);
      }
      if (filters?.status) {
        params.set('status', filters.status);
      }
      if (filters?.priority) {
        params.set('priority', filters.priority);
      }
      if (filters?.dueDate) {
        params.set('dueDate', filters.dueDate);
      }
      if (filters?.sortBy) {
        params.set('sortBy', filters.sortBy);
      }
      if (filters?.sortDirection) {
        params.set('sortDirection', filters.sortDirection);
      }

      const queryString = params.toString();
      const url = queryString ? `/api/todos?${queryString}` : '/api/todos';
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch todos');
      }

      const data = await response.json();
      setTodos(data);
    } catch (error) {
      toast.error('Failed to load todos');
      console.error('Error fetching todos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters?.search, filters?.categoryId, filters?.status, filters?.priority, filters?.dueDate, filters?.sortBy, filters?.sortDirection]);

  useEffect(() => {
    if (enabled) {
      fetchTodos();
    }
  }, [fetchTodos, enabled]);

  const createTodo = async (input: CreateTodoInput) => {
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error('Failed to create todo');
      }

      await fetchTodos();
      toast.success('Todo created successfully');
    } catch (error) {
      toast.error('Failed to create todo');
      console.error('Error creating todo:', error);
      throw error;
    }
  };

  const updateTodo = async (id: string, input: UpdateTodoInput) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error('Failed to update todo');
      }

      await fetchTodos();
      toast.success('Todo updated successfully');
    } catch (error) {
      toast.error('Failed to update todo');
      console.error('Error updating todo:', error);
      throw error;
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete todo');
      }

      await fetchTodos();
      toast.success('Todo deleted successfully');
    } catch (error) {
      toast.error('Failed to delete todo');
      console.error('Error deleting todo:', error);
      throw error;
    }
  };

  const toggleTodo = async (id: string) => {
    // First, try to find in top-level todos
    let todo = todos.find((t) => t.id === id);

    // If not found, search in subtasks
    if (!todo) {
      for (const parentTodo of todos) {
        if (parentTodo.subtasks) {
          const subtask = parentTodo.subtasks.find((s) => s.id === id);
          if (subtask) {
            todo = subtask;
            break;
          }
        }
      }
    }

    if (!todo) {
      toast.error('Todo not found');
      return;
    }

    await updateTodo(id, { completed: !todo.completed });
  };

  return {
    todos,
    isLoading,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    refetch: fetchTodos,
  };
}
