import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { TodoItem } from '../todo-item';
import { Priority } from '@prisma/client';

const mockTodo = {
  id: 'todo-1',
  title: 'Test Todo',
  description: 'This is a test description',
  completed: false,
  priority: Priority.HIGH,
  dueDate: '2024-12-31T00:00:00.000Z',
  categoryId: 'cat-1',
  category: {
    id: 'cat-1',
    name: 'Work',
    color: '#ef4444',
    userId: 'user-1',
    createdAt: new Date(),
  },
  userId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  parentId: null,
  recurrenceRule: null,
  recurrenceEnd: null,
};

describe('TodoItem', () => {
  const mockOnToggle = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render todo title', () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Test Todo')).toBeInTheDocument();
  });

  it('should render priority badge', () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('should render category badge', () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('should render due date', () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/Dec 31, 2024/)).toBeInTheDocument();
  });

  it('should render notes button when description exists', () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('should not render notes button when description is empty', () => {
    const todoWithoutDesc = { ...mockTodo, description: null };
    render(
      <TodoItem
        todo={todoWithoutDesc}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByText('Notes')).not.toBeInTheDocument();
  });

  it('should expand notes when notes button is clicked', () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const notesButton = screen.getByLabelText('Expand notes');
    fireEvent.click(notesButton);

    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  it('should collapse notes when notes button is clicked again', () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const notesButton = screen.getByLabelText('Expand notes');
    fireEvent.click(notesButton);

    expect(screen.getByText('This is a test description')).toBeInTheDocument();

    const collapseButton = screen.getByLabelText('Collapse notes');
    fireEvent.click(collapseButton);

    expect(screen.queryByText('This is a test description')).not.toBeInTheDocument();
  });

  it('should call onToggle when checkbox is clicked', () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockOnToggle).toHaveBeenCalledWith('todo-1');
  });

  it('should call onEdit when edit menu item is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Open dropdown menu using userEvent for better Radix UI support
    const menuButton = screen.getByLabelText('Actions for "Test Todo"');
    await user.click(menuButton);

    // Click Edit menu item
    const editItem = await screen.findByRole('menuitem', { name: /edit/i });
    await user.click(editItem);

    expect(mockOnEdit).toHaveBeenCalledWith(mockTodo);
  });

  it('should call onDelete when delete menu item is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Open dropdown menu using userEvent for better Radix UI support
    const menuButton = screen.getByLabelText('Actions for "Test Todo"');
    await user.click(menuButton);

    // Click Delete menu item
    const deleteItem = await screen.findByRole('menuitem', { name: /delete/i });
    await user.click(deleteItem);

    expect(mockOnDelete).toHaveBeenCalledWith('todo-1');
  });

  it('should show strikethrough for completed todos', () => {
    const completedTodo = { ...mockTodo, completed: true };
    render(
      <TodoItem
        todo={completedTodo}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const title = screen.getByText('Test Todo');
    expect(title).toHaveClass('line-through');
  });

  it('should show overdue indicator for past due dates', () => {
    const overdueTodo = {
      ...mockTodo,
      dueDate: '2020-01-01T00:00:00.000Z', // Past date
    };
    render(
      <TodoItem
        todo={overdueTodo}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/Overdue/)).toBeInTheDocument();
  });

  it('should not show overdue for completed todos with past due dates', () => {
    const completedOverdueTodo = {
      ...mockTodo,
      completed: true,
      dueDate: '2020-01-01T00:00:00.000Z',
    };
    render(
      <TodoItem
        todo={completedOverdueTodo}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByText(/Overdue/)).not.toBeInTheDocument();
  });

  it('should not render category badge when no category', () => {
    const todoWithoutCategory = { ...mockTodo, category: null, categoryId: null };
    render(
      <TodoItem
        todo={todoWithoutCategory}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByText('Work')).not.toBeInTheDocument();
  });

  it('should not render due date when not set', () => {
    const todoWithoutDueDate = { ...mockTodo, dueDate: null };
    render(
      <TodoItem
        todo={todoWithoutDueDate}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByText(/Dec 31, 2024/)).not.toBeInTheDocument();
  });

  it('should render different priority badges correctly', () => {
    const priorities = [
      { priority: Priority.LOW, label: 'Low' },
      { priority: Priority.MEDIUM, label: 'Medium' },
      { priority: Priority.HIGH, label: 'High' },
    ];

    for (const { priority, label } of priorities) {
      const { unmount } = render(
        <TodoItem
          todo={{ ...mockTodo, priority }}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });
});
