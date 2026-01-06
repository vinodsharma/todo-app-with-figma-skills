'use client';

import { useMemo } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Todo } from '@/types';
import { SortableTodoItem } from './SortableTodoItem';

interface SortableTodoListProps {
  todos: Todo[];
  onToggle: (id: string) => Promise<void>;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => Promise<void>;
  onAddSubtask?: (parentId: string, title: string) => Promise<void>;
  onSkipRecurrence?: (id: string) => Promise<void>;
  onStopRecurrence?: (id: string) => Promise<void>;
  selectedIndex?: number | null;
  todoIndexMap: Map<string, number>;
}

export function SortableTodoList({
  todos,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onSkipRecurrence,
  onStopRecurrence,
  selectedIndex,
  todoIndexMap,
}: SortableTodoListProps) {
  const todoIds = useMemo(() => todos.map((todo) => todo.id), [todos]);

  return (
    <SortableContext items={todoIds} strategy={verticalListSortingStrategy}>
      <div className="space-y-2">
        {todos.map((todo) => (
          <SortableTodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddSubtask={onAddSubtask}
            onSkipRecurrence={onSkipRecurrence}
            onStopRecurrence={onStopRecurrence}
            isSelected={selectedIndex === todoIndexMap.get(todo.id)}
          />
        ))}
      </div>
    </SortableContext>
  );
}
