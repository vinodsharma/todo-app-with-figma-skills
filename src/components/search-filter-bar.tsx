'use client';

import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Priority, StatusFilter, DueDateFilter } from '@/types';
import { cn } from '@/lib/utils';

// Local filter state for the search bar (without categoryId - that's managed by sidebar)
export interface SearchBarFilters {
  search: string;
  priority: Priority | 'all';
  status: StatusFilter;
  dueDate: DueDateFilter;
}

interface SearchFilterBarProps {
  filters: SearchBarFilters;
  onFiltersChange: (filters: SearchBarFilters) => void;
  className?: string;
}

const defaultFilters: SearchBarFilters = {
  search: '',
  priority: 'all',
  status: 'all',
  dueDate: 'all',
};

export function SearchFilterBar({
  filters,
  onFiltersChange,
  className,
}: SearchFilterBarProps) {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.priority !== 'all' ||
    filters.status !== 'all' ||
    filters.dueDate !== 'all';

  const activeFilterCount = [
    filters.search !== '',
    filters.priority !== 'all',
    filters.status !== 'all',
    filters.dueDate !== 'all',
  ].filter(Boolean).length;

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handlePriorityChange = (value: string) => {
    onFiltersChange({ ...filters, priority: value as Priority | 'all' });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value as StatusFilter });
  };

  const handleDueDateChange = (value: string) => {
    onFiltersChange({ ...filters, dueDate: value as DueDateFilter });
  };

  const handleClearFilters = () => {
    onFiltersChange(defaultFilters);
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card/50 p-3',
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search todos..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {filters.search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority Filter */}
          <Select value={filters.priority} onValueChange={handlePriorityChange}>
            <SelectTrigger
              className={cn(
                'w-[110px]',
                filters.priority !== 'all' && 'border-primary/50 bg-primary/5'
              )}
            >
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value={Priority.HIGH}>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  High
                </span>
              </SelectItem>
              <SelectItem value={Priority.MEDIUM}>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  Medium
                </span>
              </SelectItem>
              <SelectItem value={Priority.LOW}>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Low
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger
              className={cn(
                'w-[120px]',
                filters.status !== 'all' && 'border-primary/50 bg-primary/5'
              )}
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          {/* Due Date Filter */}
          <Select value={filters.dueDate} onValueChange={handleDueDateChange}>
            <SelectTrigger
              className={cn(
                'w-[130px]',
                filters.dueDate !== 'all' && 'border-primary/50 bg-primary/5'
              )}
            >
              <SelectValue placeholder="Due Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="overdue">
                <span className="text-destructive">Overdue</span>
              </SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Clear
              {activeFilterCount > 1 && (
                <span className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Active filters summary - shown on mobile when filters are collapsed */}
      {hasActiveFilters && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground sm:hidden">
          <Filter className="h-3 w-3" />
          <span>{activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active</span>
        </div>
      )}
    </div>
  );
}

export { defaultFilters };
