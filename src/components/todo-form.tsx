'use client';

import { useState } from 'react';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Category, CreateTodoInput, Priority } from '@/types';
import { cn } from '@/lib/utils';
import { RecurrenceSelector } from './recurrence-selector';

interface TodoFormProps {
  categories: Category[];
  selectedCategoryId?: string;
  onSubmit: (todo: CreateTodoInput) => Promise<void>;
}

export function TodoForm({
  categories,
  selectedCategoryId,
  onSubmit,
}: TodoFormProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<string | undefined>(
    selectedCategoryId
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      await onSubmit({
        title: title.trim(),
        priority,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
        categoryId: categoryId || undefined,
        recurrenceRule: recurrenceRule || undefined,
      });

      // Clear form after successful submission
      setTitle('');
      setPriority(Priority.MEDIUM);
      setDueDate(undefined);
      setCategoryId(selectedCategoryId);
      setRecurrenceRule(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <Input
          type="text"
          placeholder="Add a new todo..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isLoading}
          required
          className="flex-1"
        />

        <div className="flex flex-wrap gap-2">
          <Select
            value={priority}
            onValueChange={(value) => setPriority(value as Priority)}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[100px] sm:w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Priority.LOW}>Low</SelectItem>
              <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
              <SelectItem value={Priority.HIGH}>High</SelectItem>
            </SelectContent>
          </Select>

          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                className={cn(
                  'min-w-[100px] sm:w-[140px] justify-start text-left font-normal',
                  !dueDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{dueDate ? format(dueDate, 'MMM dd, yyyy') : 'Due date'}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={(date) => {
                  setDueDate(date);
                  setIsCalendarOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {categories.length > 0 && (
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[100px] sm:w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="truncate">{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="w-[140px] sm:w-[160px]">
            <RecurrenceSelector
              value={recurrenceRule}
              onChange={setRecurrenceRule}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" disabled={isLoading || !title.trim()}>
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </div>
    </form>
  );
}
