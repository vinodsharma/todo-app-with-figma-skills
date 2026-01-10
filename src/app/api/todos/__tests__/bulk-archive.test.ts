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

import { POST } from '../bulk-archive/route';

describe('POST /api/todos/bulk-archive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new Request('http://localhost/api/todos/bulk-archive', {
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

    const request = new Request('http://localhost/api/todos/bulk-archive', {
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

    const request = new Request('http://localhost/api/todos/bulk-archive', {
      method: 'POST',
      body: JSON.stringify({ ids: 'not-an-array' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should archive todos and return count', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const mockTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', archivedAt: null, parentId: null, category: null },
      { id: 'todo-2', title: 'Todo 2', userId: 'user-1', archivedAt: null, parentId: null, category: null },
    ];

    const archivedTodos = mockTodos.map(t => ({ ...t, archivedAt: new Date() }));

    vi.mocked(prisma.todo.findMany)
      .mockResolvedValueOnce(mockTodos as any)
      .mockResolvedValueOnce(archivedTodos as any);
    vi.mocked(prisma.todo.updateMany).mockResolvedValue({ count: 2 });

    const request = new Request('http://localhost/api/todos/bulk-archive', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1', 'todo-2'] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.archived).toBe(2);
    expect(data.todos).toHaveLength(2);
  });

  it('should archive subtasks along with parent', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const mockTodos = [
      { id: 'todo-1', title: 'Parent Todo', userId: 'user-1', archivedAt: null, parentId: null, category: null },
    ];

    const archivedTodos = [
      { id: 'todo-1', title: 'Parent Todo', userId: 'user-1', archivedAt: new Date(), parentId: null, category: null },
    ];

    vi.mocked(prisma.todo.findMany)
      .mockResolvedValueOnce(mockTodos as any)
      .mockResolvedValueOnce(archivedTodos as any);
    vi.mocked(prisma.todo.updateMany).mockResolvedValue({ count: 1 });

    const request = new Request('http://localhost/api/todos/bulk-archive', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1'] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.archived).toBe(1);

    // Verify updateMany was called twice - once for parent, once for subtasks
    expect(prisma.todo.updateMany).toHaveBeenCalledTimes(2);

    // First call archives the parent todos
    expect(prisma.todo.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: { in: ['todo-1'] } },
      data: { archivedAt: expect.any(Date) },
    });

    // Second call archives subtasks
    expect(prisma.todo.updateMany).toHaveBeenNthCalledWith(2, {
      where: { parentId: { in: ['todo-1'] } },
      data: { archivedAt: expect.any(Date) },
    });
  });

  it('should only archive todos belonging to user', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    // Only one todo belongs to user-1
    const mockTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', archivedAt: null, parentId: null, category: null },
    ];

    const archivedTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', archivedAt: new Date(), parentId: null, category: null },
    ];

    vi.mocked(prisma.todo.findMany)
      .mockResolvedValueOnce(mockTodos as any)
      .mockResolvedValueOnce(archivedTodos as any);
    vi.mocked(prisma.todo.updateMany).mockResolvedValue({ count: 1 });

    const request = new Request('http://localhost/api/todos/bulk-archive', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1', 'todo-2'] }), // Requesting two, but only one belongs to user
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.archived).toBe(1);
    expect(data.todos).toHaveLength(1);
  });

  it('should return 0 archived if no valid todos found', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    vi.mocked(prisma.todo.findMany).mockResolvedValue([]);

    const request = new Request('http://localhost/api/todos/bulk-archive', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1'] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.archived).toBe(0);
    expect(data.todos).toHaveLength(0);
  });
});
