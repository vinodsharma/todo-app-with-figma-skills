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
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

vi.mock('@/lib/activity-logger', () => ({
  logActivity: vi.fn(),
}));

import { POST } from '../bulk-delete/route';

describe('POST /api/todos/bulk-delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new Request('http://localhost/api/todos/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1'] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should delete multiple todos and return count', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const mockTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', completed: false, category: null },
      { id: 'todo-2', title: 'Todo 2', userId: 'user-1', completed: true, category: null },
    ];

    vi.mocked(prisma.todo.findMany).mockResolvedValue(mockTodos as any);
    vi.mocked(prisma.todo.deleteMany).mockResolvedValue({ count: 2 });

    const request = new Request('http://localhost/api/todos/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1', 'todo-2'] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.deleted).toBe(2);
  });

  it('should return deleted todos for undo support', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const mockTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', completed: false, category: null },
      { id: 'todo-2', title: 'Todo 2', userId: 'user-1', completed: true, category: null },
    ];

    vi.mocked(prisma.todo.findMany).mockResolvedValue(mockTodos as any);
    vi.mocked(prisma.todo.deleteMany).mockResolvedValue({ count: 2 });

    const request = new Request('http://localhost/api/todos/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1', 'todo-2'] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.deletedTodos).toBeDefined();
    expect(data.deletedTodos).toHaveLength(2);
    expect(data.deletedTodos[0].id).toBe('todo-1');
    expect(data.deletedTodos[1].id).toBe('todo-2');
  });

  it('should return 400 if no ids provided', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const request = new Request('http://localhost/api/todos/bulk-delete', {
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

    const request = new Request('http://localhost/api/todos/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids: 'not-an-array' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should only delete todos belonging to user', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const mockTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', completed: false, category: null },
    ];

    vi.mocked(prisma.todo.findMany).mockResolvedValue(mockTodos as any);
    vi.mocked(prisma.todo.deleteMany).mockResolvedValue({ count: 1 });

    const request = new Request('http://localhost/api/todos/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1', 'todo-2'] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.deleted).toBe(1);
    expect(data.deletedTodos).toHaveLength(1);
  });
});
