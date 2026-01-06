'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2 } from 'lucide-react';
import { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { DragHandle } from './DragHandle';
import { cn } from '@/lib/utils';

interface SortableCategoryProps {
  category: Category;
  isSelected: boolean;
  isHovered: boolean;
  isDeleting: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function SortableCategory({
  category,
  isSelected,
  isHovered,
  isDeleting,
  onSelect,
  onDelete,
  onMouseEnter,
  onMouseLeave,
}: SortableCategoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category.id,
    data: {
      type: 'category' as const,
      title: category.name,
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
        'relative flex items-center gap-1',
        isDragging && 'opacity-50'
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <DragHandle
        listeners={listeners}
        attributes={attributes}
        isDragging={isDragging}
        className="shrink-0"
      />
      <Button
        variant={isSelected ? 'secondary' : 'ghost'}
        className={cn(
          'flex-1 justify-start gap-2 pr-8',
          isSelected && 'bg-secondary'
        )}
        onClick={onSelect}
      >
        <div
          className="size-3 rounded-full shrink-0"
          style={{ backgroundColor: category.color }}
        />
        <span className="flex-1 truncate text-left">
          {category.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {category._count?.todos ?? 0}
        </span>
      </Button>

      {isHovered && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          disabled={isDeleting}
        >
          <Trash2 className="size-4" />
          <span className="sr-only">Delete {category.name}</span>
        </Button>
      )}
    </div>
  );
}
