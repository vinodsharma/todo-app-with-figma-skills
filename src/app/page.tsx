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

  const { categories, createCategory: createCategoryHook, deleteCategory } = useCategories();

  // Wrapper to match component interface (name, color) to hook interface ({ name, color })
  const handleAddCategory = async (name: string, color: string) => {
    await createCategoryHook({ name, color });
  };
  const { todos, isLoading, createTodo, toggleTodo, deleteTodo } = useTodos();

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
            onSubmit={createTodo}
          />
          <TodoList
            todos={filteredTodos}
            isLoading={isLoading}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
          />
        </main>
      </div>
    </div>
  );
}
