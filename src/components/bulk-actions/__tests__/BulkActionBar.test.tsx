import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { BulkActionBar } from '../BulkActionBar';
import { Priority } from '@prisma/client';
import { Category } from '@/types';

const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Work',
    color: '#ef4444',
    userId: 'user-1',
    createdAt: new Date(),
    sortOrder: 0,
  },
  {
    id: 'cat-2',
    name: 'Personal',
    color: '#3b82f6',
    userId: 'user-1',
    createdAt: new Date(),
    sortOrder: 1,
  },
];

describe('BulkActionBar', () => {
  const mockOnComplete = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnMoveToCategory = vi.fn();
  const mockOnChangePriority = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display selected count', () => {
    render(
      <BulkActionBar
        selectedCount={3}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
        onMoveToCategory={mockOnMoveToCategory}
        onChangePriority={mockOnChangePriority}
        onClose={mockOnClose}
        categories={mockCategories}
      />
    );

    expect(screen.getByText('3 selected')).toBeInTheDocument();
  });

  it('should show singular text for 1 selected', () => {
    render(
      <BulkActionBar
        selectedCount={1}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
        onMoveToCategory={mockOnMoveToCategory}
        onChangePriority={mockOnChangePriority}
        onClose={mockOnClose}
        categories={mockCategories}
      />
    );

    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });

  it('should return null when selectedCount is 0', () => {
    render(
      <BulkActionBar
        selectedCount={0}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
        onMoveToCategory={mockOnMoveToCategory}
        onChangePriority={mockOnChangePriority}
        onClose={mockOnClose}
        categories={mockCategories}
      />
    );

    expect(screen.queryByTestId('bulk-action-bar')).not.toBeInTheDocument();
  });

  it('should call onComplete when complete button clicked', () => {
    render(
      <BulkActionBar
        selectedCount={2}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
        onMoveToCategory={mockOnMoveToCategory}
        onChangePriority={mockOnChangePriority}
        onClose={mockOnClose}
        categories={mockCategories}
      />
    );

    const completeButton = screen.getByRole('button', { name: /complete/i });
    fireEvent.click(completeButton);

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete button clicked', () => {
    render(
      <BulkActionBar
        selectedCount={2}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
        onMoveToCategory={mockOnMoveToCategory}
        onChangePriority={mockOnChangePriority}
        onClose={mockOnClose}
        categories={mockCategories}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close button clicked', () => {
    render(
      <BulkActionBar
        selectedCount={2}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
        onMoveToCategory={mockOnMoveToCategory}
        onChangePriority={mockOnChangePriority}
        onClose={mockOnClose}
        categories={mockCategories}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close|deselect/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should open Move to dropdown and show categories', async () => {
    const user = userEvent.setup();
    render(
      <BulkActionBar
        selectedCount={2}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
        onMoveToCategory={mockOnMoveToCategory}
        onChangePriority={mockOnChangePriority}
        onClose={mockOnClose}
        categories={mockCategories}
      />
    );

    const moveButton = screen.getByRole('button', { name: /move to/i });
    await user.click(moveButton);

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /work/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /personal/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /no category/i })).toBeInTheDocument();
    });
  });

  it('should call onMoveToCategory with category id when category selected', async () => {
    const user = userEvent.setup();
    render(
      <BulkActionBar
        selectedCount={2}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
        onMoveToCategory={mockOnMoveToCategory}
        onChangePriority={mockOnChangePriority}
        onClose={mockOnClose}
        categories={mockCategories}
      />
    );

    const moveButton = screen.getByRole('button', { name: /move to/i });
    await user.click(moveButton);

    const workItem = await screen.findByRole('menuitem', { name: /work/i });
    await user.click(workItem);

    expect(mockOnMoveToCategory).toHaveBeenCalledWith('cat-1');
  });

  it('should call onMoveToCategory with null when No Category selected', async () => {
    const user = userEvent.setup();
    render(
      <BulkActionBar
        selectedCount={2}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
        onMoveToCategory={mockOnMoveToCategory}
        onChangePriority={mockOnChangePriority}
        onClose={mockOnClose}
        categories={mockCategories}
      />
    );

    const moveButton = screen.getByRole('button', { name: /move to/i });
    await user.click(moveButton);

    const noCategoryItem = await screen.findByRole('menuitem', { name: /no category/i });
    await user.click(noCategoryItem);

    expect(mockOnMoveToCategory).toHaveBeenCalledWith(null);
  });

  it('should open Priority dropdown and show priority options', async () => {
    const user = userEvent.setup();
    render(
      <BulkActionBar
        selectedCount={2}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
        onMoveToCategory={mockOnMoveToCategory}
        onChangePriority={mockOnChangePriority}
        onClose={mockOnClose}
        categories={mockCategories}
      />
    );

    const priorityButton = screen.getByRole('button', { name: /priority/i });
    await user.click(priorityButton);

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /high/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /medium/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /low/i })).toBeInTheDocument();
    });
  });

  it('should call onChangePriority with priority when priority selected', async () => {
    const user = userEvent.setup();
    render(
      <BulkActionBar
        selectedCount={2}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
        onMoveToCategory={mockOnMoveToCategory}
        onChangePriority={mockOnChangePriority}
        onClose={mockOnClose}
        categories={mockCategories}
      />
    );

    const priorityButton = screen.getByRole('button', { name: /priority/i });
    await user.click(priorityButton);

    const highItem = await screen.findByRole('menuitem', { name: /high/i });
    await user.click(highItem);

    expect(mockOnChangePriority).toHaveBeenCalledWith(Priority.HIGH);
  });

  it('should have fixed bottom positioning', () => {
    render(
      <BulkActionBar
        selectedCount={2}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
        onMoveToCategory={mockOnMoveToCategory}
        onChangePriority={mockOnChangePriority}
        onClose={mockOnClose}
        categories={mockCategories}
      />
    );

    const bar = screen.getByTestId('bulk-action-bar');
    expect(bar).toHaveClass('fixed');
    expect(bar).toHaveClass('bottom-0');
  });

  it('should apply custom className', () => {
    render(
      <BulkActionBar
        selectedCount={2}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
        onMoveToCategory={mockOnMoveToCategory}
        onChangePriority={mockOnChangePriority}
        onClose={mockOnClose}
        categories={mockCategories}
        className="custom-class"
      />
    );

    const bar = screen.getByTestId('bulk-action-bar');
    expect(bar).toHaveClass('custom-class');
  });
});
