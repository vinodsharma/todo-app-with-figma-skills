'use client';

import { Check, Trash2, FolderOpen, Flag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Category, Priority } from '@/types';

interface BulkActionBarProps {
  selectedCount: number;
  onComplete: () => void;
  onDelete: () => void;
  onMoveToCategory: (categoryId: string | null) => void;
  onChangePriority: (priority: Priority) => void;
  onClose: () => void;
  categories: Category[];
  className?: string;
}

export function BulkActionBar({
  selectedCount,
  onComplete,
  onDelete,
  onMoveToCategory,
  onChangePriority,
  onClose,
  categories,
  className,
}: BulkActionBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      data-testid="bulk-action-bar"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        'border-t shadow-lg',
        'animate-in slide-in-from-bottom duration-200',
        'px-4 py-3',
        className
      )}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
        <span className="text-sm font-medium text-muted-foreground">
          {selectedCount} selected
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onComplete}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Complete
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <FolderOpen className="h-4 w-4" />
                Move to...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onMoveToCategory(null)}>
                No Category
              </DropdownMenuItem>
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category.id}
                  onClick={() => onMoveToCategory(category.id)}
                >
                  <span
                    className="mr-2 h-3 w-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Flag className="h-4 w-4" />
                Priority...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onChangePriority(Priority.HIGH)}>
                <span className="mr-2 h-2 w-2 rounded-full bg-red-500" />
                High
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChangePriority(Priority.MEDIUM)}>
                <span className="mr-2 h-2 w-2 rounded-full bg-yellow-500" />
                Medium
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChangePriority(Priority.LOW)}>
                <span className="mr-2 h-2 w-2 rounded-full bg-green-500" />
                Low
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close"
            className="ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
