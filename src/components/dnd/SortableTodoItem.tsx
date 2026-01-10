'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Todo } from '@/types';
import { TodoItem } from '@/components/todo-item';
import { DragHandle } from './DragHandle';
import { SelectionCheckbox } from '@/components/bulk-actions';
import { cn } from '@/lib/utils';

interface SortableTodoItemProps {
  todo: Todo;
  isArchived?: boolean;
  onToggle: (id: string) => Promise<void>;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => Promise<void>;
  onArchive?: (id: string) => Promise<void>;
  onRestore?: (id: string) => Promise<void>;
  onAddSubtask?: (parentId: string, title: string) => Promise<void>;
  onSkipRecurrence?: (id: string) => Promise<void>;
  onStopRecurrence?: (id: string) => Promise<void>;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  isItemSelected?: boolean;
  onSelectionChange?: (e: React.MouseEvent) => void;
}

export function SortableTodoItem({
  todo,
  isArchived = false,
  onToggle,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
  onAddSubtask,
  onSkipRecurrence,
  onStopRecurrence,
  isSelected,
  isSelectionMode,
  isItemSelected,
  onSelectionChange,
}: SortableTodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: todo.id,
    data: {
      type: 'todo' as const,
      title: todo.title,
      categoryId: todo.categoryId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-start gap-2',
        isDragging && 'opacity-50'
      )}
    >
      {isSelectionMode ? (
        <div className="mt-4">
          <SelectionCheckbox
            checked={isItemSelected ?? false}
            onChange={onSelectionChange ?? (() => {})}
          />
        </div>
      ) : (
        <DragHandle
          listeners={listeners}
          attributes={attributes}
          isDragging={isDragging}
          className="mt-4"
        />
      )}
      <div className="flex-1">
        <TodoItem
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
          isSelected={isSelected || isItemSelected}
        />
      </div>
    </div>
  );
}
