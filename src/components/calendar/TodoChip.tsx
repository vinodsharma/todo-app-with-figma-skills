'use client';

import { cn } from '@/lib/utils';
import { Todo, Priority } from '@/types';

interface TodoChipProps {
  todo: Todo;
  onClick?: () => void;
  className?: string;
}

const priorityColors: Record<Priority, string> = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-green-500',
};

export function TodoChip({ todo, onClick, className }: TodoChipProps) {
  const categoryColor = todo.category?.color || '#6b7280';

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 w-full px-1.5 py-0.5 rounded text-xs text-left truncate transition-colors',
        'hover:opacity-80 focus:outline-none focus:ring-1 focus:ring-primary',
        todo.completed && 'opacity-50 line-through',
        className
      )}
      style={{
        backgroundColor: `${categoryColor}15`,
        color: categoryColor,
      }}
      title={todo.title}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', priorityColors[todo.priority])} />
      <span className="truncate">{todo.title}</span>
    </button>
  );
}
