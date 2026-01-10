'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { Todo, CreateTodoInput, UpdateTodoInput, TodoQueryParams, Priority } from '@/types';

interface UseTodosOptions {
  filters?: TodoQueryParams;
  enabled?: boolean; // Whether to fetch (default: true)
}

interface BulkCompleteResult {
  updated: number;
}

interface BulkDeleteResult {
  deleted: number;
  deletedTodos: Todo[];
}

interface BulkUpdateResult {
  updated: number;
}

interface BulkUpdateData {
  categoryId?: string | null;
  priority?: Priority;
}

interface BulkArchiveResult {
  archived: number;
}

interface BulkRestoreResult {
  restored: number;
}

interface UseTodosReturn {
  todos: Todo[];
  isLoading: boolean;
  createTodo: (input: CreateTodoInput) => Promise<void>;
  updateTodo: (id: string, input: UpdateTodoInput) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  skipRecurrence: (id: string) => Promise<void>;
  stopRecurrence: (id: string) => Promise<void>;
  reorderTodo: (todoId: string, newSortOrder: number, newCategoryId?: string) => Promise<void>;
  bulkComplete: (ids: string[], completed: boolean) => Promise<BulkCompleteResult>;
  bulkDelete: (ids: string[]) => Promise<BulkDeleteResult>;
  bulkUpdate: (ids: string[], data: BulkUpdateData) => Promise<BulkUpdateResult>;
  archiveTodo: (id: string) => Promise<void>;
  restoreTodo: (id: string) => Promise<void>;
  bulkArchive: (ids: string[]) => Promise<BulkArchiveResult>;
  bulkRestore: (ids: string[]) => Promise<BulkRestoreResult>;
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
      if (filters?.archived !== undefined) {
        params.set('archived', String(filters.archived));
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
  }, [filters?.search, filters?.categoryId, filters?.status, filters?.priority, filters?.dueDate, filters?.sortBy, filters?.sortDirection, filters?.archived]);

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

  const skipRecurrence = async (id: string) => {
    // Complete without creating next occurrence by first removing recurrence, then completing
    try {
      // Temporarily remove recurrence rule
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true, recurrenceRule: null }),
      });
      if (!response.ok) throw new Error('Failed to skip');
      await fetchTodos();
      toast.success('Occurrence skipped');
    } catch (error) {
      toast.error('Failed to skip occurrence');
      throw error;
    }
  };

  const stopRecurrence = async (id: string) => {
    try {
      await updateTodo(id, { recurrenceRule: null, recurrenceEnd: null });
      toast.success('Recurrence stopped');
    } catch (error) {
      toast.error('Failed to stop recurrence');
      throw error;
    }
  };

  const reorderTodo = async (todoId: string, newSortOrder: number, newCategoryId?: string) => {
    const originalTodos = [...todos];

    try {
      const todoIndex = todos.findIndex(t => t.id === todoId);
      if (todoIndex === -1) return;

      const updatedTodos = [...todos];
      const [movedTodo] = updatedTodos.splice(todoIndex, 1);

      if (newCategoryId !== undefined) {
        movedTodo.categoryId = newCategoryId;
      }

      updatedTodos.splice(newSortOrder, 0, movedTodo);
      setTodos(updatedTodos);

      const response = await fetch('/api/todos/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todoId, newSortOrder, newCategoryId }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder todo');
      }

      await fetchTodos();
    } catch (error) {
      setTodos(originalTodos);
      toast.error('Failed to reorder todo');
      console.error('Error reordering todo:', error);
    }
  };

  const bulkComplete = async (ids: string[], completed: boolean): Promise<BulkCompleteResult> => {
    try {
      const response = await fetch('/api/todos/bulk-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, completed }),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk complete todos');
      }

      const data = await response.json();
      await fetchTodos();
      toast.success(`${data.updated} todo(s) ${completed ? 'completed' : 'uncompleted'}`);
      return data;
    } catch (error) {
      toast.error('Failed to bulk complete todos');
      console.error('Error bulk completing todos:', error);
      throw error;
    }
  };

  const bulkDelete = async (ids: string[]): Promise<BulkDeleteResult> => {
    try {
      const response = await fetch('/api/todos/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk delete todos');
      }

      const data = await response.json();
      await fetchTodos();
      toast.success(`${data.deleted} todo(s) deleted`);
      return data;
    } catch (error) {
      toast.error('Failed to bulk delete todos');
      console.error('Error bulk deleting todos:', error);
      throw error;
    }
  };

  const bulkUpdate = async (ids: string[], data: BulkUpdateData): Promise<BulkUpdateResult> => {
    try {
      const response = await fetch('/api/todos/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, ...data }),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk update todos');
      }

      const result = await response.json();
      await fetchTodos();

      // Determine appropriate toast message
      if (data.priority !== undefined) {
        toast.success(`${result.updated} todo(s) priority updated`);
      } else if (data.categoryId !== undefined) {
        toast.success(`${result.updated} todo(s) moved`);
      } else {
        toast.success(`${result.updated} todo(s) updated`);
      }

      return result;
    } catch (error) {
      toast.error('Failed to bulk update todos');
      console.error('Error bulk updating todos:', error);
      throw error;
    }
  };

  const archiveTodo = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivedAt: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error('Failed to archive todo');
      setTodos(prev => prev.filter(t => t.id !== id));
      toast.success('Todo archived');
    } catch (error) {
      toast.error('Failed to archive todo');
      throw error;
    }
  }, []);

  const restoreTodo = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivedAt: null }),
      });
      if (!response.ok) throw new Error('Failed to restore todo');
      setTodos(prev => prev.filter(t => t.id !== id));
      toast.success('Todo restored');
    } catch (error) {
      toast.error('Failed to restore todo');
      throw error;
    }
  }, []);

  const bulkArchive = useCallback(async (ids: string[]): Promise<BulkArchiveResult> => {
    try {
      const response = await fetch('/api/todos/bulk-archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error('Failed to archive todos');
      const result = await response.json();
      setTodos(prev => prev.filter(t => !ids.includes(t.id)));
      toast.success(`${result.archived} todo(s) archived`);
      return result;
    } catch (error) {
      toast.error('Failed to archive todos');
      throw error;
    }
  }, []);

  const bulkRestore = useCallback(async (ids: string[]): Promise<BulkRestoreResult> => {
    try {
      const response = await fetch('/api/todos/bulk-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error('Failed to restore todos');
      const result = await response.json();
      setTodos(prev => prev.filter(t => !ids.includes(t.id)));
      toast.success(`${result.restored} todo(s) restored`);
      return result;
    } catch (error) {
      toast.error('Failed to restore todos');
      throw error;
    }
  }, []);

  return {
    todos,
    isLoading,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    skipRecurrence,
    stopRecurrence,
    reorderTodo,
    bulkComplete,
    bulkDelete,
    bulkUpdate,
    archiveTodo,
    restoreTodo,
    bulkArchive,
    bulkRestore,
    refetch: fetchTodos,
  };
}
