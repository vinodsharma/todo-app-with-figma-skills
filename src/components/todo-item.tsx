"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar, Pencil, Trash2, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Todo, Priority } from "@/types";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => Promise<void>;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => Promise<void>;
  isSelected?: boolean;
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

export function TodoItem({ todo, onToggle, onEdit, onDelete, isSelected = false }: TodoItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isOverdue =
    todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date();
  const hasDescription = todo.description && todo.description.trim().length > 0;

  return (
    <div className={cn(
      "group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:bg-accent/50",
      isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
    )}>
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

          <div className="flex shrink-0 gap-1">
            <button
              onClick={() => onEdit(todo)}
              className="rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
              aria-label={`Edit "${todo.title}"`}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(todo.id)}
              className="rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
              aria-label={`Delete "${todo.title}"`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
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

          {/* Description indicator */}
          {hasDescription && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-label={isExpanded ? "Collapse notes" : "Expand notes"}
            >
              <FileText className="h-3 w-3" />
              <span>Notes</span>
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          )}
        </div>

        {/* Description content */}
        {hasDescription && isExpanded && (
          <div className="mt-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground whitespace-pre-wrap">
            {todo.description}
          </div>
        )}
      </div>
    </div>
  );
}
