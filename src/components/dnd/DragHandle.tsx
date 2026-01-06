'use client';

import { DraggableAttributes } from '@dnd-kit/core';
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DragHandleProps {
  listeners?: SyntheticListenerMap;
  attributes?: DraggableAttributes;
  className?: string;
  isDragging?: boolean;
}

export function DragHandle({
  listeners,
  attributes,
  className,
  isDragging,
}: DragHandleProps) {
  return (
    <button
      type="button"
      className={cn(
        'touch-none cursor-grab p-1 text-muted-foreground hover:text-foreground transition-colors rounded',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isDragging && 'cursor-grabbing',
        className
      )}
      aria-label="Drag to reorder"
      {...listeners}
      {...attributes}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
}
