'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Header } from '@/components/header';
import { CategorySidebar } from '@/components/category-sidebar';
import { ActivitySidebar } from '@/components/activity';
import { TodoForm } from '@/components/todo-form';
import { TodoList } from '@/components/todo-list';
import { SearchFilterBar, SearchBarFilters, defaultFilters } from '@/components/search-filter-bar';
import { EditTodoDialog } from '@/components/edit-todo-dialog';
import { KeyboardShortcutsDialog } from '@/components/keyboard-shortcuts-dialog';
import { DndProvider } from '@/components/dnd';
import { CalendarView } from '@/components/calendar';
import { BulkActionBar, DeleteConfirmDialog } from '@/components/bulk-actions';
import { useTodos } from '@/hooks/use-todos';
import { useCategories } from '@/hooks/use-categories';
import { useDebounce } from '@/hooks/use-debounce';
import { useSortPreference } from '@/hooks/use-sort-preference';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useViewPreference } from '@/hooks/use-view-preference';
import { useSelection } from '@/hooks/use-selection';
import { Priority, Todo, TodoQueryParams } from '@/types';

export default function Home() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchBarFilters>(defaultFilters);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { sortOption, setSortOption, isLoaded: sortLoaded } = useSortPreference();
  const { viewMode, setViewMode, calendarView, setCalendarView } = useViewPreference();
  const selection = useSelection();

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

    // Add sort params - backend handles sorting now
    params.sortBy = sortOption.field;
    params.sortDirection = sortOption.direction;

    return params;
  }, [debouncedSearch, selectedCategoryId, filters.priority, filters.status, filters.dueDate, sortOption]);

  const { categories, createCategory: createCategoryHook, deleteCategory, reorderCategory, refetch: refetchCategories } = useCategories();
  // Wait for sort preference to load before fetching todos to avoid race condition
  const { todos, isLoading, createTodo, updateTodo, toggleTodo, deleteTodo, skipRecurrence, stopRecurrence, reorderTodo, bulkComplete, bulkDelete, bulkUpdate, refetch: fetchTodos } = useTodos({
    filters: queryParams,
    enabled: sortLoaded,
  });

  // Memoized list of all todo IDs for selection
  const allTodoIds = useMemo(() => todos.map(t => t.id), [todos]);

  // Check if any filters are active (for showing appropriate empty state)
  const hasActiveFilters = !!(
    debouncedSearch ||
    selectedCategoryId ||
    filters.priority !== 'all' ||
    filters.status !== 'all' ||
    filters.dueDate !== 'all'
  );

  // Flat todo list for keyboard navigation (active first, then completed)
  const allTodos = useMemo(() => {
    const active = todos.filter(t => !t.completed);
    const completed = todos.filter(t => t.completed);
    return [...active, ...completed];
  }, [todos]);

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

  const handleSkipRecurrence = async (id: string) => {
    await skipRecurrence(id);
    await refetchCategories();
  };

  const handleStopRecurrence = async (id: string) => {
    await stopRecurrence(id);
  };

  const handleQuickAdd = async (title: string, dueDate: string) => {
    await createTodo({ title, dueDate });
    await refetchCategories();
  };

  const handleAddSubtask = async (parentId: string, title: string) => {
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, parentId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create subtask');
      }

      // Refresh todos to get updated subtasks
      await fetchTodos();
    } catch (error) {
      console.error('Error creating subtask:', error);
    }
  };

  // Handle edit click from both TodoList and keyboard shortcuts
  const handleEditClick = (todo: Todo) => {
    setEditingTodo(todo);
  };

  // Keyboard shortcuts (must be after handlers are defined)
  const { selectedIndex, isHelpOpen, setIsHelpOpen } = useKeyboardShortcuts({
    todos: allTodos,
    onToggle: handleToggleTodo,
    onEdit: handleEditClick,
    onDelete: handleDeleteTodo,
  });

  // Handle category selection - also clear filters when switching categories for cleaner UX
  const handleSelectCategory = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  };

  const handleReorderTodo = async (todoId: string, newIndex: number, newCategoryId?: string) => {
    await reorderTodo(todoId, newIndex, newCategoryId);
    if (newCategoryId) {
      await refetchCategories();
    }
  };

  const handleReorderCategory = async (categoryId: string, newIndex: number) => {
    await reorderCategory(categoryId, newIndex);
  };

  // Selection handlers for bulk operations
  const handleSelectionChange = useCallback((id: string, e: React.MouseEvent) => {
    if (e.shiftKey) {
      selection.selectRange(id, allTodoIds);
    } else {
      selection.toggleSelection(id, e.shiftKey, e.ctrlKey || e.metaKey);
    }
  }, [selection, allTodoIds]);

  const handleBulkComplete = useCallback(async () => {
    const ids = Array.from(selection.selectedIds);
    await bulkComplete(ids, true);
    selection.deselectAll();
    await refetchCategories();
  }, [selection, bulkComplete, refetchCategories]);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selection.selectedIds);
    await bulkDelete(ids);
    selection.deselectAll();
    setShowDeleteConfirm(false);
    await refetchCategories();
  }, [selection, bulkDelete, refetchCategories]);

  const handleBulkMoveToCategory = useCallback(async (categoryId: string | null) => {
    const ids = Array.from(selection.selectedIds);
    await bulkUpdate(ids, { categoryId });
    selection.deselectAll();
    await refetchCategories();
  }, [selection, bulkUpdate, refetchCategories]);

  const handleBulkChangePriority = useCallback(async (priority: Priority) => {
    const ids = Array.from(selection.selectedIds);
    await bulkUpdate(ids, { priority });
    selection.deselectAll();
  }, [selection, bulkUpdate]);

  // Escape key handler to exit selection mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selection.isSelectionMode) {
        selection.exitSelectionMode();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selection]);

  return (
    <DndProvider
      onTodoReorder={handleReorderTodo}
      onCategoryReorder={handleReorderCategory}
    >
      <div className="min-h-screen flex flex-col">
        <Header
          onActivityToggle={() => setIsActivityOpen(!isActivityOpen)}
          isActivityOpen={isActivityOpen}
        />
        <div className="flex flex-1 overflow-hidden">
          <CategorySidebar
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={handleSelectCategory}
            onAddCategory={handleAddCategory}
            onDeleteCategory={deleteCategory}
          />
          <main className="flex-1 p-6 space-y-4 overflow-auto">
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
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              isSelectionMode={selection.isSelectionMode}
              onSelectionModeChange={(mode) => mode ? selection.enterSelectionMode() : selection.exitSelectionMode()}
              selectedCount={selection.selectedCount}
              onSelectAll={() => selection.selectAll(allTodoIds)}
              onDeselectAll={selection.deselectAll}
            />
            {viewMode === 'list' ? (
              <TodoList
                todos={todos}
                categories={categories}
                isLoading={isLoading}
                hasActiveFilters={hasActiveFilters}
                selectedIndex={selectedIndex}
                isSelectionMode={selection.isSelectionMode}
                selectedIds={selection.selectedIds}
                onSelectionChange={handleSelectionChange}
                onToggle={handleToggleTodo}
                onEdit={handleEditTodo}
                onEditClick={handleEditClick}
                onDelete={handleDeleteTodo}
                onAddSubtask={handleAddSubtask}
                onSkipRecurrence={handleSkipRecurrence}
                onStopRecurrence={handleStopRecurrence}
              />
            ) : (
              <CalendarView
                todos={todos}
                calendarView={calendarView}
                onCalendarViewChange={setCalendarView}
                onTodoToggle={handleToggleTodo}
                onTodoEdit={handleEditTodo}
                onTodoEditClick={handleEditClick}
                onQuickAdd={handleQuickAdd}
              />
            )}
          </main>
          <ActivitySidebar
            isOpen={isActivityOpen}
            onClose={() => setIsActivityOpen(false)}
          />
        </div>

        {/* Edit Dialog (triggered by keyboard shortcut 'e') */}
        {editingTodo && (
          <EditTodoDialog
            todo={editingTodo}
            categories={categories}
            open={!!editingTodo}
            onOpenChange={(open) => !open && setEditingTodo(null)}
            onSave={handleEditTodo}
          />
        )}

        {/* Keyboard Shortcuts Help Dialog (triggered by '?') */}
        <KeyboardShortcutsDialog open={isHelpOpen} onOpenChange={setIsHelpOpen} />

        {/* Bulk Action Bar (visible in selection mode) */}
        {selection.isSelectionMode && (
          <BulkActionBar
            selectedCount={selection.selectedCount}
            onComplete={handleBulkComplete}
            onDelete={() => setShowDeleteConfirm(true)}
            onMoveToCategory={handleBulkMoveToCategory}
            onChangePriority={handleBulkChangePriority}
            onClose={selection.exitSelectionMode}
            categories={categories}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          count={selection.selectedCount}
          onConfirm={handleBulkDelete}
        />
      </div>
    </DndProvider>
  );
}
