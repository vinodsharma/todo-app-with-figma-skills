import { Priority } from "@prisma/client";

// Re-export Priority enum from Prisma
export { Priority };

// Category interface
export interface Category {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: Date;
  sortOrder: number;
  _count?: {
    todos: number;
  };
}

// Todo interface
export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: Priority;
  dueDate: string | null;
  categoryId: string | null;
  category: Category | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  sortOrder: number;
  // Subtasks support
  parentId: string | null;
  subtasks?: Todo[];
  _count?: {
    subtasks: number;
  };
  // Recurrence fields
  recurrenceRule: string | null;
  recurrenceEnd: string | null;
}

// Input types for creating todos
export interface CreateTodoInput {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
  categoryId?: string;
  parentId?: string;
  recurrenceRule?: string;
  recurrenceEnd?: string;
}

// Input types for updating todos
export interface UpdateTodoInput {
  title?: string;
  description?: string | null;
  completed?: boolean;
  priority?: Priority;
  dueDate?: string;
  categoryId?: string;
  recurrenceRule?: string | null;
  recurrenceEnd?: string | null;
}

// Input types for creating categories
export interface CreateCategoryInput {
  name: string;
  color?: string;
}

// Filter types for todo queries
export type StatusFilter = 'all' | 'active' | 'completed';
export type DueDateFilter = 'all' | 'overdue' | 'today' | 'week' | 'upcoming';

// Sort types for todo list
export type SortField = 'priority' | 'dueDate' | 'createdAt' | 'title';
export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  field: SortField;
  direction: SortDirection;
}

// Default sort option
export const DEFAULT_SORT: SortOption = {
  field: 'createdAt',
  direction: 'desc',
};

export interface TodoFilters {
  search: string;
  priority: Priority | 'all';
  status: StatusFilter;
  dueDate: DueDateFilter;
  categoryId: string | null;
}

// API query parameters for todos
export interface TodoQueryParams {
  search?: string;
  priority?: Priority;
  status?: 'active' | 'completed';
  dueDate?: 'overdue' | 'today' | 'week' | 'upcoming';
  categoryId?: string;
  sortBy?: SortField;
  sortDirection?: SortDirection;
}

// Input types for reordering
export interface ReorderTodoInput {
  todoId: string;
  newSortOrder: number;
  newCategoryId?: string;  // For cross-category moves
}

export interface ReorderCategoryInput {
  categoryId: string;
  newSortOrder: number;
}
