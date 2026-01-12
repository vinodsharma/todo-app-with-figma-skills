'use client';

import { useState, useEffect, useCallback } from 'react';
import { DemoTodo, DemoPriority } from './types';
import { DEMO_TODOS, DEMO_CATEGORIES } from './sample-data';

const STORAGE_KEY = 'landing-demo-todos';

export function useDemoTodos() {
  // Initialize with sample data (for SSR)
  const [todos, setTodos] = useState<DemoTodo[]>(DEMO_TODOS);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate the stored data has the expected shape
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTodos(parsed);
        }
      }
    } catch {
      // If parsing fails, keep the default sample data
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage after hydration
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
      } catch {
        // Ignore storage errors
      }
    }
  }, [todos, isHydrated]);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }, []);

  const addTodo = useCallback((title: string) => {
    if (!title.trim()) return;

    const newTodo: DemoTodo = {
      id: Date.now().toString(),
      title: title.trim(),
      completed: false,
      priority: 'MEDIUM' as DemoPriority,
      dueDate: null,
      category: DEMO_CATEGORIES[0], // Default to Work category
    };

    setTodos((prev) => [newTodo, ...prev]);
  }, []);

  const resetTodos = useCallback(() => {
    setTodos(DEMO_TODOS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Separate active and completed todos
  const activeTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  return {
    todos,
    activeTodos,
    completedTodos,
    toggleTodo,
    addTodo,
    resetTodos,
    isHydrated,
  };
}
