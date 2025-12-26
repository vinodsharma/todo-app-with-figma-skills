'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/header';
import { CategorySidebar } from '@/components/category-sidebar';
import { TodoForm } from '@/components/todo-form';
import { TodoList } from '@/components/todo-list';
import { useTodos } from '@/hooks/use-todos';
import { useCategories } from '@/hooks/use-categories';

export default function Home() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const { categories, createCategory: createCategoryHook, deleteCategory, refetch: refetchCategories } = useCategories();

  // Wrapper to match component interface (name, color) to hook interface ({ name, color })
  const handleAddCategory = async (name: string, color: string) => {
    await createCategoryHook({ name, color });
  };
  const { todos, isLoading, createTodo, updateTodo, toggleTodo, deleteTodo } = useTodos();

  // Wrap todo operations to also refetch categories (to update counts)
  const handleCreateTodo = async (input: Parameters<typeof createTodo>[0]) => {
    await createTodo(input);
    await refetchCategories();
  };

  const handleToggleTodo = async (id: string) => {
    await toggleTodo(id);
  };

  const handleDeleteTodo = async (id: string) => {
    await deleteTodo(id);
    await refetchCategories();
  };

  const handleEditTodo = async (id: string, input: Parameters<typeof updateTodo>[1]) => {
    await updateTodo(id, input);
    await refetchCategories();
  };

  // Filter todos based on selected category
  const filteredTodos = useMemo(() => {
    if (selectedCategoryId === null) {
      return todos;
    }
    return todos.filter((todo) => todo.categoryId === selectedCategoryId);
  }, [todos, selectedCategoryId]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <CategorySidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          onAddCategory={handleAddCategory}
          onDeleteCategory={deleteCategory}
        />
        <main className="flex-1 p-6 space-y-6">
          <TodoForm
            categories={categories}
            selectedCategoryId={selectedCategoryId || undefined}
            onSubmit={handleCreateTodo}
          />
          <TodoList
            todos={filteredTodos}
            categories={categories}
            isLoading={isLoading}
            onToggle={handleToggleTodo}
            onEdit={handleEditTodo}
            onDelete={handleDeleteTodo}
          />
        </main>
      </div>
    </div>
  );
}
