'use client';

import { Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Todo } from '@/types';

interface SubtaskItemProps {
  subtask: Todo;
  onToggle: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function SubtaskItem({ subtask, onToggle, onDelete }: SubtaskItemProps) {
  return (
    <div className="group flex items-center gap-3 rounded-md border border-border/50 bg-muted/30 px-3 py-2 transition-all hover:bg-muted/50">
      <Checkbox
        checked={subtask.completed}
        onCheckedChange={() => onToggle(subtask.id)}
        className="h-4 w-4"
        aria-label={`Mark "${subtask.title}" as ${subtask.completed ? 'incomplete' : 'complete'}`}
      />

      <span
        className={cn(
          'flex-1 text-sm',
          subtask.completed && 'text-muted-foreground line-through'
        )}
      >
        {subtask.title}
      </span>

      <button
        onClick={() => onDelete(subtask.id)}
        className="rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
        aria-label={`Delete "${subtask.title}"`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
