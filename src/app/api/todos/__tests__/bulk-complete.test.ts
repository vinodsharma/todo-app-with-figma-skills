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

import { POST } from '../bulk-complete/route';

describe('POST /api/todos/bulk-complete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new Request('http://localhost/api/todos/bulk-complete', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1'], completed: true }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should complete multiple todos', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const mockTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', completed: false },
      { id: 'todo-2', title: 'Todo 2', userId: 'user-1', completed: false },
    ];

    vi.mocked(prisma.todo.findMany).mockResolvedValue(mockTodos as any);
    vi.mocked(prisma.todo.updateMany).mockResolvedValue({ count: 2 });

    const request = new Request('http://localhost/api/todos/bulk-complete', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1', 'todo-2'], completed: true }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.updated).toBe(2);
  });

  it('should return 400 if no ids provided', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const request = new Request('http://localhost/api/todos/bulk-complete', {
      method: 'POST',
      body: JSON.stringify({ ids: [], completed: true }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should only update todos belonging to user', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const mockTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', completed: false },
    ];

    vi.mocked(prisma.todo.findMany).mockResolvedValue(mockTodos as any);
    vi.mocked(prisma.todo.updateMany).mockResolvedValue({ count: 1 });

    const request = new Request('http://localhost/api/todos/bulk-complete', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1', 'todo-2'], completed: true }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.updated).toBe(1);
  });
});
