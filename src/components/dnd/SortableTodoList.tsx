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
  isArchived?: boolean;
  onToggle: (id: string) => Promise<void>;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => Promise<void>;
  onArchive?: (id: string) => Promise<void>;
  onRestore?: (id: string) => Promise<void>;
  onAddSubtask?: (parentId: string, title: string) => Promise<void>;
  onSkipRecurrence?: (id: string) => Promise<void>;
  onStopRecurrence?: (id: string) => Promise<void>;
  selectedIndex?: number | null;
  todoIndexMap: Map<string, number>;
  isSelectionMode?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (id: string, e: React.MouseEvent) => void;
}

export function SortableTodoList({
  todos,
  isArchived = false,
  onToggle,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
  onAddSubtask,
  onSkipRecurrence,
  onStopRecurrence,
  selectedIndex,
  todoIndexMap,
  isSelectionMode = false,
  selectedIds = new Set(),
  onSelectionChange,
}: SortableTodoListProps) {
  const todoIds = useMemo(() => todos.map((todo) => todo.id), [todos]);

  return (
    <SortableContext items={todoIds} strategy={verticalListSortingStrategy}>
      <div className="space-y-2">
        {todos.map((todo) => (
          <SortableTodoItem
            key={todo.id}
            todo={todo}
            isArchived={isArchived}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onArchive={onArchive}
            onRestore={onRestore}
            onAddSubtask={onAddSubtask}
            onSkipRecurrence={onSkipRecurrence}
            onStopRecurrence={onStopRecurrence}
            isSelected={selectedIndex === todoIndexMap.get(todo.id)}
            isSelectionMode={isSelectionMode}
            isItemSelected={selectedIds?.has(todo.id)}
            onSelectionChange={(e) => onSelectionChange?.(todo.id, e)}
          />
        ))}
      </div>
    </SortableContext>
  );
}
