'use client';

import { useState, useEffect } from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Category, Todo, Priority, UpdateTodoInput } from '@/types';
import { cn } from '@/lib/utils';

interface EditTodoDialogProps {
  todo: Todo;
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, input: UpdateTodoInput) => Promise<void>;
}

const NO_CATEGORY = '__none__';

export function EditTodoDialog({
  todo,
  categories,
  open,
  onOpenChange,
  onSave,
}: EditTodoDialogProps) {
  const [title, setTitle] = useState(todo.title);
  const [priority, setPriority] = useState<Priority>(todo.priority);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    todo.dueDate ? new Date(todo.dueDate) : undefined
  );
  const [categoryId, setCategoryId] = useState<string>(
    todo.categoryId || NO_CATEGORY
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Reset form when todo changes or dialog opens
  useEffect(() => {
    if (open) {
      setTitle(todo.title);
      setPriority(todo.priority);
      setDueDate(todo.dueDate ? new Date(todo.dueDate) : undefined);
      setCategoryId(todo.categoryId || NO_CATEGORY);
    }
  }, [open, todo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      await onSave(todo.id, {
        title: title.trim(),
        priority,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
        categoryId: categoryId === NO_CATEGORY ? undefined : categoryId,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearDueDate = () => {
    setDueDate(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Todo</DialogTitle>
            <DialogDescription>
              Make changes to your todo item.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="todo-title">Title</Label>
              <Input
                id="todo-title"
                placeholder="Enter todo title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>

            {/* Priority */}
            <div className="grid gap-2">
              <Label htmlFor="todo-priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as Priority)}
                disabled={isLoading}
              >
                <SelectTrigger id="todo-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Priority.LOW}>Low</SelectItem>
                  <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={Priority.HIGH}>High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="grid gap-2">
              <Label htmlFor="todo-category">Category</Label>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                disabled={isLoading}
              >
                <SelectTrigger id="todo-category">
                  <SelectValue placeholder="No Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>No Category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="grid gap-2">
              <Label>Due Date</Label>
              <div className="flex gap-2">
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isLoading}
                      className={cn(
                        'flex-1 justify-start text-left font-normal',
                        !dueDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, 'MMM dd, yyyy') : 'No due date'}
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
                {dueDate && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={clearDueDate}
                    disabled={isLoading}
                    aria-label="Clear due date"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
