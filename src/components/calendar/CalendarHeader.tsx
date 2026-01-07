'use client';

import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarViewType } from '@/hooks/use-view-preference';
import { cn } from '@/lib/utils';

interface CalendarHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  calendarView: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
}

export function CalendarHeader({
  currentDate,
  onDateChange,
  calendarView,
  onViewChange,
}: CalendarHeaderProps) {
  const handlePrevious = () => {
    if (calendarView === 'month') {
      onDateChange(subMonths(currentDate, 1));
    } else {
      onDateChange(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (calendarView === 'month') {
      onDateChange(addMonths(currentDate, 1));
    } else {
      onDateChange(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const getDateDisplay = () => {
    if (calendarView === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      return `Week of ${format(weekStart, 'MMM d, yyyy')}`;
    }
  };

  return (
    <div className="flex items-center justify-between py-4">
      {/* Left side - Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
        >
          Today
        </Button>
        <h2 className="ml-4 text-lg font-semibold">{getDateDisplay()}</h2>
      </div>

      {/* Right side - View toggle */}
      <div className="flex items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewChange('month')}
          className={cn(
            'rounded-r-none border-r-0',
            calendarView === 'month' && 'bg-accent'
          )}
        >
          Month
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewChange('week')}
          className={cn(
            'rounded-l-none',
            calendarView === 'week' && 'bg-accent'
          )}
        >
          Week
        </Button>
      </div>
    </div>
  );
}
