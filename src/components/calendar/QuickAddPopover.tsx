'use client';

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface QuickAddPopoverProps {
  date: Date;
  onAdd: (title: string, dueDate: string) => Promise<void>;
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function QuickAddPopover({
  date,
  onAdd,
  trigger,
  open,
  onOpenChange,
}: QuickAddPopoverProps) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when popover opens
  useEffect(() => {
    if (open && inputRef.current) {
      // Small delay to ensure popover is rendered
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Reset title when popover closes
  useEffect(() => {
    if (!open) {
      setTitle('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      await onAdd(title.trim(), formattedDate);
      setTitle('');
      onOpenChange?.(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onOpenChange?.(false);
    }
  };

  const formattedDateHeader = format(date, 'MMM d, yyyy');

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">
            Add todo for {formattedDateHeader}
          </h4>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Todo title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
            />
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!title.trim() || isSubmitting}
            >
              <Plus className="h-4 w-4" />
              {isSubmitting ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
