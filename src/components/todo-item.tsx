"use client";

import { format } from "date-fns";
import { Calendar, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Todo, Priority } from "@/types";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  LOW: {
    label: "Low",
    className:
      "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  },
  MEDIUM: {
    label: "Medium",
    className:
      "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  },
  HIGH: {
    label: "High",
    className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  },
};

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const isOverdue =
    todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date();

  return (
    <div className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50">
      <Checkbox
        checked={todo.completed}
        onCheckedChange={() => onToggle(todo.id)}
        className="mt-0.5"
        aria-label={`Mark "${todo.title}" as ${todo.completed ? "incomplete" : "complete"}`}
      />

      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              "font-medium leading-tight",
              todo.completed && "text-muted-foreground line-through",
            )}
          >
            {todo.title}
          </h3>

          <button
            onClick={() => onDelete(todo.id)}
            className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
            aria-label={`Delete "${todo.title}"`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Priority Badge */}
          <Badge className={priorityConfig[todo.priority].className}>
            {priorityConfig[todo.priority].label}
          </Badge>

          {/* Category Badge */}
          {todo.category && (
            <Badge
              className="border-transparent"
              style={{
                backgroundColor: `${todo.category.color}20`,
                color: todo.category.color,
                borderColor: `${todo.category.color}40`,
              }}
            >
              <span
                className="mr-1.5 h-2 w-2 rounded-full"
                style={{ backgroundColor: todo.category.color }}
              />
              {todo.category.name}
            </Badge>
          )}

          {/* Due Date */}
          {todo.dueDate && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs text-muted-foreground",
                isOverdue && "font-medium text-red-600 dark:text-red-400",
              )}
            >
              <Calendar className="h-3 w-3" />
              <span>
                {format(new Date(todo.dueDate), "MMM d, yyyy")}
                {isOverdue && " (Overdue)"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
