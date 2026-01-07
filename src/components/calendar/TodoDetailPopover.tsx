'use client';

import * as React from 'react';
import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Todo, Priority } from '@/types';

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  HIGH: { label: 'High', className: 'bg-red-500/10 text-red-700 dark:text-red-400' },
  MEDIUM: { label: 'Medium', className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },
  LOW: { label: 'Low', className: 'bg-green-500/10 text-green-700 dark:text-green-400' },
};

interface TodoDetailPopoverProps {
  todo: Todo;
  onToggle: (id: string) => Promise<void>;
  onReschedule: (id: string, newDate: string) => Promise<void>;
  onEditClick: (todo: Todo) => void;
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TodoDetailPopover({
  todo,
  onToggle,
  onReschedule,
  onEditClick,
  trigger,
  open,
  onOpenChange,
}: TodoDetailPopoverProps) {
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    todo.dueDate ? new Date(todo.dueDate) : undefined
  );

  const handleToggle = async () => {
    await onToggle(todo.id);
  };

  const handleRescheduleClick = () => {
    setIsRescheduling(true);
  };

  const handleCancelReschedule = () => {
    setIsRescheduling(false);
    setSelectedDate(todo.dueDate ? new Date(todo.dueDate) : undefined);
  };

  const handleDateSelect = async (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const dateString = format(date, 'yyyy-MM-dd');
      await onReschedule(todo.id, dateString);
      setIsRescheduling(false);
    }
  };

  const handleEditClick = () => {
    onOpenChange?.(false);
    onEditClick(todo);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsRescheduling(false);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        {isRescheduling ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Reschedule</h4>
              <Button variant="ghost" size="sm" onClick={handleCancelReschedule}>
                Cancel
              </Button>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
            />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Title with checkbox */}
            <div className="flex items-start gap-3">
              <Checkbox
                checked={todo.completed}
                onCheckedChange={handleToggle}
                className="mt-0.5"
              />
              <span
                className={cn(
                  'text-sm font-medium leading-tight',
                  todo.completed && 'line-through text-muted-foreground'
                )}
              >
                {todo.title}
              </span>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={cn('border-0', priorityConfig[todo.priority].className)}
              >
                {priorityConfig[todo.priority].label}
              </Badge>
              {todo.category && (
                <Badge
                  variant="outline"
                  className="border-0"
                  style={{
                    backgroundColor: `${todo.category.color}20`,
                    color: todo.category.color,
                  }}
                >
                  {todo.category.name}
                </Badge>
              )}
            </div>

            {/* Due date display */}
            {todo.dueDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                <span>{format(new Date(todo.dueDate), 'MMM d, yyyy')}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRescheduleClick}
                className="flex-1"
              >
                <CalendarIcon className="h-4 w-4" />
                Reschedule
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditClick}
                className="flex-1"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
