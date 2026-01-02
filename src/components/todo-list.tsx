"use client";

import { useMemo, useState } from "react";
import { Todo, Category, UpdateTodoInput } from "@/types";
import { TodoItem } from "@/components/todo-item";
import { EditTodoDialog } from "@/components/edit-todo-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle, ListTodo, Search } from "lucide-react";

interface TodoListProps {
  todos: Todo[];
  categories: Category[];
  isLoading: boolean;
  hasActiveFilters?: boolean;
  selectedIndex?: number | null;
  onToggle: (id: string) => Promise<void>;
  onEdit: (id: string, input: UpdateTodoInput) => Promise<void>;
  onEditClick?: (todo: Todo) => void;
  onDelete: (id: string) => Promise<void>;
  onAddSubtask?: (parentId: string, title: string) => Promise<void>;
}

function TodoListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
        >
          <Skeleton className="h-5 w-5 shrink-0 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <ListTodo className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-medium">No todos yet</h3>
      <p className="text-sm text-muted-foreground">
        Create your first todo to get started
      </p>
    </div>
  );
}

function NoResultsState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-medium">No matching todos</h3>
      <p className="text-sm text-muted-foreground">
        Try adjusting your search or filters
      </p>
    </div>
  );
}

export function TodoList({
  todos,
  categories,
  isLoading,
  hasActiveFilters = false,
  selectedIndex,
  onToggle,
  onEdit,
  onEditClick,
  onDelete,
  onAddSubtask,
}: TodoListProps) {
  // Internal edit state (used when onEditClick is not provided)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const { activeTodos, completedTodos } = useMemo(() => {
    return {
      activeTodos: todos.filter((todo) => !todo.completed),
      completedTodos: todos.filter((todo) => todo.completed),
    };
  }, [todos]);

  const allTodos = useMemo(() => [...activeTodos, ...completedTodos], [activeTodos, completedTodos]);

  // Create a Map for O(1) index lookups (avoids O(n²) from findIndex in render loops)
  const todoIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    allTodos.forEach((todo, index) => {
      map.set(todo.id, index);
    });
    return map;
  }, [allTodos]);

  const handleEditClick = (todo: Todo) => {
    if (onEditClick) {
      onEditClick(todo);
    } else {
      setEditingTodo(todo);
    }
  };

  const handleEditSave = async (id: string, input: UpdateTodoInput) => {
    await onEdit(id, input);
    // Note: Don't call setEditingTodo(null) here - the dialog closes itself
    // via onOpenChange(false) in handleSubmit, which triggers the parent callback.
    // Calling it here causes a race condition with the Dialog's close animation.
  };

  if (isLoading) {
    return <TodoListSkeleton />;
  }

  if (todos.length === 0) {
    return hasActiveFilters ? <NoResultsState /> : <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Active Todos Section */}
      {activeTodos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Circle className="h-4 w-4" />
            <span>Active</span>
            <span className="text-muted-foreground">
              ({activeTodos.length})
            </span>
          </div>
          <div className="space-y-2">
            {activeTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                isSelected={selectedIndex === todoIndexMap.get(todo.id)}
                onToggle={onToggle}
                onEdit={handleEditClick}
                onDelete={onDelete}
                onAddSubtask={onAddSubtask}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Todos Section */}
      {completedTodos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            <span>Completed</span>
            <span>({completedTodos.length})</span>
          </div>
          <div className="space-y-2">
            {completedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                isSelected={selectedIndex === todoIndexMap.get(todo.id)}
                onToggle={onToggle}
                onEdit={handleEditClick}
                onDelete={onDelete}
                onAddSubtask={onAddSubtask}
              />
            ))}
          </div>
        </div>
      )}

      {/* Edit Todo Dialog (only rendered when parent doesn't handle editing) */}
      {!onEditClick && editingTodo && (
        <EditTodoDialog
          todo={editingTodo}
          categories={categories}
          open={!!editingTodo}
          onOpenChange={(open) => !open && setEditingTodo(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}
