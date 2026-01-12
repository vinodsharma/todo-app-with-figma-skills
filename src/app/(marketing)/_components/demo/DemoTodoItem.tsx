'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DemoTodo, DemoPriority } from './types';
import { format } from 'date-fns';

interface DemoTodoItemProps {
  todo: DemoTodo;
  onToggle: (id: string) => void;
}

const priorityConfig: Record<DemoPriority, { label: string; className: string }> = {
  LOW: {
    label: 'Low',
    className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  },
  MEDIUM: {
    label: 'Medium',
    className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  },
  HIGH: {
    label: 'High',
    className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  },
};

export function DemoTodoItem({ todo, onToggle }: DemoTodoItemProps) {
  const isOverdue = todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date();

  return (
    <div className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:bg-accent/50">
      <Checkbox
        checked={todo.completed}
        onCheckedChange={() => onToggle(todo.id)}
        className="mt-0.5"
        aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
      />

      <div className="flex-1 min-w-0 space-y-1.5">
        <h3
          className={cn(
            'font-medium leading-tight text-sm truncate',
            todo.completed && 'text-muted-foreground line-through'
          )}
        >
          {todo.title}
        </h3>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Priority Badge */}
          <Badge className={cn('text-[10px] px-1.5 py-0', priorityConfig[todo.priority].className)}>
            {priorityConfig[todo.priority].label}
          </Badge>

          {/* Category Badge */}
          {todo.category && (
            <Badge
              className="text-[10px] px-1.5 py-0 border-transparent"
              style={{
                backgroundColor: `${todo.category.color}20`,
                color: todo.category.color,
                borderColor: `${todo.category.color}40`,
              }}
            >
              <span
                className="mr-1 h-1.5 w-1.5 rounded-full inline-block"
                style={{ backgroundColor: todo.category.color }}
              />
              {todo.category.name}
            </Badge>
          )}

          {/* Due Date */}
          {todo.dueDate && (
            <div
              className={cn(
                'flex items-center gap-1 text-[10px] text-muted-foreground',
                isOverdue && 'font-medium text-red-600 dark:text-red-400'
              )}
            >
              <Calendar className="h-2.5 w-2.5" />
              <span>{format(new Date(todo.dueDate), 'MMM d')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
