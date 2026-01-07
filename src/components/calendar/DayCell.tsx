'use client';

import { isToday, isSameMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { Todo } from '@/types';
import { TodoChip } from './TodoChip';
import { TodoDetailPopover } from './TodoDetailPopover';

interface DayCellProps {
  date: Date;
  currentMonth: Date;
  todos: Todo[];
  selectedTodoId?: string | null;
  onTodoClick?: (todo: Todo) => void;
  onTodoOpenChange?: (open: boolean) => void;
  onTodoToggle?: (id: string) => Promise<void>;
  onTodoReschedule?: (id: string, newDate: string) => Promise<void>;
  onTodoEditClick?: (todo: Todo) => void;
  onDateClick?: (date: Date) => void;
  maxVisible?: number;
  isWeekView?: boolean;
}

export function DayCell({
  date,
  currentMonth,
  todos,
  selectedTodoId,
  onTodoClick,
  onTodoOpenChange,
  onTodoToggle,
  onTodoReschedule,
  onTodoEditClick,
  onDateClick,
  maxVisible = 3,
  isWeekView = false,
}: DayCellProps) {
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isTodayDate = isToday(date);
  const dayNumber = date.getDate();

  // In week view, show all todos (scrollable); in month view, limit to maxVisible
  const visibleTodos = isWeekView ? todos : todos.slice(0, maxVisible);
  const hiddenCount = isWeekView ? 0 : Math.max(0, todos.length - maxVisible);

  const handleDateClick = () => {
    onDateClick?.(date);
  };

  const handleTodoClick = (todo: Todo) => {
    onTodoClick?.(todo);
  };

  return (
    <div
      className={cn(
        'border-r border-b border-border p-1',
        isWeekView ? 'min-h-[200px]' : 'min-h-[80px]',
        !isCurrentMonth && 'bg-muted/30'
      )}
    >
      {/* Date button */}
      <button
        onClick={handleDateClick}
        className={cn(
          'w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center mb-1',
          'hover:bg-muted focus:outline-none focus:ring-1 focus:ring-primary transition-colors',
          isTodayDate && 'bg-primary text-primary-foreground hover:bg-primary/90',
          !isCurrentMonth && !isTodayDate && 'text-muted-foreground'
        )}
      >
        {dayNumber}
      </button>

      {/* Todos container */}
      <div
        className={cn(
          'flex flex-col gap-0.5',
          isWeekView && 'overflow-y-auto max-h-[calc(200px-32px)]'
        )}
      >
        {visibleTodos.map((todo) => {
          const isSelected = selectedTodoId === todo.id;

          // Wrap selected todo with popover for anchored positioning
          if (isSelected && onTodoToggle && onTodoReschedule && onTodoEditClick) {
            return (
              <TodoDetailPopover
                key={todo.id}
                todo={todo}
                onToggle={onTodoToggle}
                onReschedule={onTodoReschedule}
                onEditClick={onTodoEditClick}
                open={true}
                onOpenChange={onTodoOpenChange}
                trigger={
                  <div>
                    <TodoChip
                      todo={todo}
                      onClick={() => handleTodoClick(todo)}
                    />
                  </div>
                }
              />
            );
          }

          return (
            <TodoChip
              key={todo.id}
              todo={todo}
              onClick={() => handleTodoClick(todo)}
            />
          );
        })}

        {/* +N more link */}
        {hiddenCount > 0 && (
          <button
            onClick={handleDateClick}
            className="text-xs text-muted-foreground hover:text-foreground text-left px-1.5 py-0.5 transition-colors"
          >
            +{hiddenCount} more
          </button>
        )}
      </div>
    </div>
  );
}
