'use client';

import { Circle, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemoTodos } from './use-demo-todos';
import { DemoTodoItem } from './DemoTodoItem';
import { DemoTodoInput } from './DemoTodoInput';

export function InteractiveDemo() {
  const { activeTodos, completedTodos, toggleTodo, addTodo, resetTodos, isHydrated } = useDemoTodos();

  return (
    <div className="p-4 space-y-4 min-h-[400px] max-h-[500px] overflow-y-auto">
      {/* Add todo input */}
      <DemoTodoInput onAdd={addTodo} />

      {/* Active todos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
            <Circle className="h-3.5 w-3.5" />
            <span>Active</span>
            <span className="text-muted-foreground">({activeTodos.length})</span>
          </div>
          {/* Reset button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={resetTodos}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            title="Reset to sample data"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
        <div className="space-y-2">
          {activeTodos.map((todo) => (
            <DemoTodoItem key={todo.id} todo={todo} onToggle={toggleTodo} />
          ))}
          {activeTodos.length === 0 && isHydrated && (
            <p className="text-sm text-muted-foreground text-center py-4">
              All done! Add a new task above.
            </p>
          )}
        </div>
      </div>

      {/* Completed todos */}
      {completedTodos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Completed</span>
            <span>({completedTodos.length})</span>
          </div>
          <div className="space-y-2 opacity-60">
            {completedTodos.map((todo) => (
              <DemoTodoItem key={todo.id} todo={todo} onToggle={toggleTodo} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
