import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    todo: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

vi.mock('@/lib/activity-logger', () => ({
  logActivity: vi.fn(),
}));

import { POST } from '../bulk-restore/route';

describe('POST /api/todos/bulk-restore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new Request('http://localhost/api/todos/bulk-restore', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1'] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should return 400 if no ids provided', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const request = new Request('http://localhost/api/todos/bulk-restore', {
      method: 'POST',
      body: JSON.stringify({ ids: [] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return 400 if ids is not an array', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const request = new Request('http://localhost/api/todos/bulk-restore', {
      method: 'POST',
      body: JSON.stringify({ ids: 'not-an-array' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should restore todos and return count', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const archivedDate = new Date();
    const mockTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', archivedAt: archivedDate, parentId: null, category: null },
      { id: 'todo-2', title: 'Todo 2', userId: 'user-1', archivedAt: archivedDate, parentId: null, category: null },
    ];

    const restoredTodos = mockTodos.map(t => ({ ...t, archivedAt: null }));

    vi.mocked(prisma.todo.findMany)
      .mockResolvedValueOnce(mockTodos as any)
      .mockResolvedValueOnce(restoredTodos as any);
    vi.mocked(prisma.todo.updateMany).mockResolvedValue({ count: 2 });

    const request = new Request('http://localhost/api/todos/bulk-restore', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1', 'todo-2'] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.restored).toBe(2);
    expect(data.todos).toHaveLength(2);
  });

  it('should restore subtasks along with parent', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const archivedDate = new Date();
    const mockTodos = [
      { id: 'todo-1', title: 'Parent Todo', userId: 'user-1', archivedAt: archivedDate, parentId: null, category: null },
    ];

    const restoredTodos = [
      { id: 'todo-1', title: 'Parent Todo', userId: 'user-1', archivedAt: null, parentId: null, category: null },
    ];

    vi.mocked(prisma.todo.findMany)
      .mockResolvedValueOnce(mockTodos as any)
      .mockResolvedValueOnce(restoredTodos as any);
    vi.mocked(prisma.todo.updateMany).mockResolvedValue({ count: 1 });

    const request = new Request('http://localhost/api/todos/bulk-restore', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1'] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.restored).toBe(1);

    // Verify updateMany was called twice - once for parent, once for subtasks
    expect(prisma.todo.updateMany).toHaveBeenCalledTimes(2);

    // First call restores the parent todos
    expect(prisma.todo.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: { in: ['todo-1'] } },
      data: { archivedAt: null },
    });

    // Second call restores subtasks
    expect(prisma.todo.updateMany).toHaveBeenNthCalledWith(2, {
      where: { parentId: { in: ['todo-1'] } },
      data: { archivedAt: null },
    });
  });

  it('should only restore todos belonging to user', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const archivedDate = new Date();
    // Only one todo belongs to user-1
    const mockTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', archivedAt: archivedDate, parentId: null, category: null },
    ];

    const restoredTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', archivedAt: null, parentId: null, category: null },
    ];

    vi.mocked(prisma.todo.findMany)
      .mockResolvedValueOnce(mockTodos as any)
      .mockResolvedValueOnce(restoredTodos as any);
    vi.mocked(prisma.todo.updateMany).mockResolvedValue({ count: 1 });

    const request = new Request('http://localhost/api/todos/bulk-restore', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1', 'todo-2'] }), // Requesting two, but only one belongs to user
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.restored).toBe(1);
    expect(data.todos).toHaveLength(1);
  });

  it('should return 0 restored if no valid todos found', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    vi.mocked(prisma.todo.findMany).mockResolvedValue([]);

    const request = new Request('http://localhost/api/todos/bulk-restore', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1'] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.restored).toBe(0);
    expect(data.todos).toHaveLength(0);
  });

  it('should only restore archived todos', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    // Mock returns empty because query filters for archivedAt: { not: null }
    vi.mocked(prisma.todo.findMany).mockResolvedValue([]);

    const request = new Request('http://localhost/api/todos/bulk-restore', {
      method: 'POST',
      body: JSON.stringify({ ids: ['non-archived-todo'] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.restored).toBe(0);

    // Verify the query checked for archived todos
    expect(prisma.todo.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['non-archived-todo'] },
        userId: 'user-1',
        archivedAt: { not: null },
        parentId: null,
      },
    });
  });
});
