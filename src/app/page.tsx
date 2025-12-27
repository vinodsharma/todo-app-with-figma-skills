'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/header';
import { CategorySidebar } from '@/components/category-sidebar';
import { TodoForm } from '@/components/todo-form';
import { TodoList } from '@/components/todo-list';
import { SearchFilterBar, SearchBarFilters, defaultFilters } from '@/components/search-filter-bar';
import { useTodos } from '@/hooks/use-todos';
import { useCategories } from '@/hooks/use-categories';
import { useDebounce } from '@/hooks/use-debounce';
import { useSortPreference } from '@/hooks/use-sort-preference';
import { Priority, TodoQueryParams, SortOption, Todo } from '@/types';

// Priority values for sorting (HIGH > MEDIUM > LOW)
const PRIORITY_ORDER = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

// Sort comparator function
function compareTodos(a: Todo, b: Todo, sortOption: SortOption): number {
  const { field, direction } = sortOption;
  const multiplier = direction === 'asc' ? 1 : -1;

  switch (field) {
    case 'priority': {
      const aVal = PRIORITY_ORDER[a.priority];
      const bVal = PRIORITY_ORDER[b.priority];
      return (bVal - aVal) * multiplier; // Higher priority first for desc
    }
    case 'dueDate': {
      // Null dates go to the end
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * multiplier;
    }
    case 'createdAt': {
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * multiplier;
    }
    case 'title': {
      return a.title.localeCompare(b.title) * multiplier;
    }
    default:
      return 0;
  }
}

export default function Home() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchBarFilters>(defaultFilters);
  const { sortOption, setSortOption } = useSortPreference();

  // Debounce search to avoid too many API calls
  const debouncedSearch = useDebounce(filters.search, 300);

  // Build query params for API
  const queryParams = useMemo((): TodoQueryParams => {
    const params: TodoQueryParams = {};

    if (debouncedSearch) {
      params.search = debouncedSearch;
    }
    if (selectedCategoryId) {
      params.categoryId = selectedCategoryId;
    }
    if (filters.priority !== 'all') {
      params.priority = filters.priority as Priority;
    }
    if (filters.status !== 'all') {
      params.status = filters.status as 'active' | 'completed';
    }
    if (filters.dueDate !== 'all') {
      params.dueDate = filters.dueDate as 'overdue' | 'today' | 'week' | 'upcoming';
    }

    return params;
  }, [debouncedSearch, selectedCategoryId, filters.priority, filters.status, filters.dueDate]);

  const { categories, createCategory: createCategoryHook, deleteCategory, refetch: refetchCategories } = useCategories();
  const { todos, isLoading, createTodo, updateTodo, toggleTodo, deleteTodo } = useTodos(queryParams);

  // Sort todos based on user preference
  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) => compareTodos(a, b, sortOption));
  }, [todos, sortOption]);

  // Check if any filters are active (for showing appropriate empty state)
  const hasActiveFilters = !!(
    debouncedSearch ||
    selectedCategoryId ||
    filters.priority !== 'all' ||
    filters.status !== 'all' ||
    filters.dueDate !== 'all'
  );

  // Wrapper to match component interface (name, color) to hook interface ({ name, color })
  const handleAddCategory = async (name: string, color: string) => {
    await createCategoryHook({ name, color });
  };

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

  // Handle category selection - also clear filters when switching categories for cleaner UX
  const handleSelectCategory = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <CategorySidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={handleSelectCategory}
          onAddCategory={handleAddCategory}
          onDeleteCategory={deleteCategory}
        />
        <main className="flex-1 p-6 space-y-4">
          <TodoForm
            categories={categories}
            selectedCategoryId={selectedCategoryId || undefined}
            onSubmit={handleCreateTodo}
          />
          <SearchFilterBar
            filters={filters}
            onFiltersChange={setFilters}
            sortOption={sortOption}
            onSortChange={setSortOption}
          />
          <TodoList
            todos={sortedTodos}
            categories={categories}
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters}
            onToggle={handleToggleTodo}
            onEdit={handleEditTodo}
            onDelete={handleDeleteTodo}
          />
        </main>
      </div>
    </div>
  );
}
