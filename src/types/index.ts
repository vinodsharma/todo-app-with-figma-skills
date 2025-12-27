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
  _count?: {
    todos: number;
  };
}

// Todo interface
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  dueDate: string | null;
  categoryId: string | null;
  category: Category | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Input types for creating todos
export interface CreateTodoInput {
  title: string;
  priority?: Priority;
  dueDate?: string;
  categoryId?: string;
}

// Input types for updating todos
export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
  priority?: Priority;
  dueDate?: string;
  categoryId?: string;
}

// Input types for creating categories
export interface CreateCategoryInput {
  name: string;
  color?: string;
}

// Filter types for todo queries
export type StatusFilter = 'all' | 'active' | 'completed';
export type DueDateFilter = 'all' | 'overdue' | 'today' | 'week' | 'upcoming';

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
}
