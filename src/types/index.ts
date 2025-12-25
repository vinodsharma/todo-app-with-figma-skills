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
