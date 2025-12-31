'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Todo } from '@/types';

interface UseKeyboardShortcutsOptions {
  todos: Todo[];
  onToggle: (id: string) => Promise<void>;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => Promise<void>;
  enabled?: boolean;
}

interface UseKeyboardShortcutsReturn {
  selectedIndex: number | null;
  setSelectedIndex: (index: number | null) => void;
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    el.getAttribute('contenteditable') === 'true'
  );
}

export function useKeyboardShortcuts({
  todos,
  onToggle,
  onEdit,
  onDelete,
  enabled = true,
}: UseKeyboardShortcutsOptions): UseKeyboardShortcutsReturn {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Use refs to avoid stale closures in event handler
  const todosRef = useRef(todos);
  const selectedIndexRef = useRef(selectedIndex);

  useEffect(() => {
    todosRef.current = todos;
  }, [todos]);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  // Reset selection when todos change
  useEffect(() => {
    setSelectedIndex(null);
  }, [todos.length]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const key = event.key;
    const currentTodos = todosRef.current;
    const currentIndex = selectedIndexRef.current;

    // Escape clears selection (don't preventDefault - let dialogs handle their own close)
    if (key === 'Escape') {
      setSelectedIndex(null);
      // Don't call setIsHelpOpen(false) - let the dialog's onOpenChange handle closing
      return;
    }

    // Skip other shortcuts if typing in input
    if (isInputFocused()) return;

    switch (key) {
      case 'n': {
        event.preventDefault();
        const input = document.querySelector<HTMLInputElement>('input[placeholder="Add a new todo..."]');
        input?.focus();
        break;
      }
      case '/': {
        event.preventDefault();
        const search = document.querySelector<HTMLInputElement>('input[placeholder="Search todos..."]');
        search?.focus();
        break;
      }
      case 'j':
      case 'ArrowDown': {
        event.preventDefault();
        if (currentTodos.length === 0) return;
        const nextIndex = currentIndex === null ? 0 : Math.min(currentIndex + 1, currentTodos.length - 1);
        setSelectedIndex(nextIndex);
        break;
      }
      case 'k':
      case 'ArrowUp': {
        event.preventDefault();
        if (currentTodos.length === 0) return;
        const prevIndex = currentIndex === null ? currentTodos.length - 1 : Math.max(currentIndex - 1, 0);
        setSelectedIndex(prevIndex);
        break;
      }
      case 'Enter': {
        if (currentIndex !== null && currentTodos[currentIndex]) {
          event.preventDefault();
          onToggle(currentTodos[currentIndex].id);
        }
        break;
      }
      case 'e': {
        if (currentIndex !== null && currentTodos[currentIndex]) {
          event.preventDefault();
          onEdit(currentTodos[currentIndex]);
        }
        break;
      }
      case 'd':
      case 'Delete': {
        if (currentIndex !== null && currentTodos[currentIndex]) {
          event.preventDefault();
          onDelete(currentTodos[currentIndex].id);
          setSelectedIndex(null);
        }
        break;
      }
      case '?': {
        event.preventDefault();
        setIsHelpOpen(prev => !prev);
        break;
      }
    }
  }, [enabled, onToggle, onEdit, onDelete]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    selectedIndex,
    setSelectedIndex,
    isHelpOpen,
    setIsHelpOpen,
  };
}
