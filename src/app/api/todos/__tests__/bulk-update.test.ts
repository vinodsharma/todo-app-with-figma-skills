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

import { POST } from '../bulk-update/route';

describe('POST /api/todos/bulk-update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new Request('http://localhost/api/todos/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1'], priority: 'HIGH' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should update priority for multiple todos', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const mockTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', priority: 'LOW', categoryId: null },
      { id: 'todo-2', title: 'Todo 2', userId: 'user-1', priority: 'MEDIUM', categoryId: null },
    ];

    const updatedTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', priority: 'HIGH', categoryId: null, category: null },
      { id: 'todo-2', title: 'Todo 2', userId: 'user-1', priority: 'HIGH', categoryId: null, category: null },
    ];

    vi.mocked(prisma.todo.findMany)
      .mockResolvedValueOnce(mockTodos as any)
      .mockResolvedValueOnce(updatedTodos as any);
    vi.mocked(prisma.todo.updateMany).mockResolvedValue({ count: 2 });

    const request = new Request('http://localhost/api/todos/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1', 'todo-2'], priority: 'HIGH' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.updated).toBe(2);
    expect(data.todos).toHaveLength(2);
  });

  it('should update category for multiple todos', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const mockTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', priority: 'LOW', categoryId: null },
      { id: 'todo-2', title: 'Todo 2', userId: 'user-1', priority: 'MEDIUM', categoryId: 'cat-1' },
    ];

    const updatedTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', priority: 'LOW', categoryId: 'cat-2', category: { id: 'cat-2', name: 'Work' } },
      { id: 'todo-2', title: 'Todo 2', userId: 'user-1', priority: 'MEDIUM', categoryId: 'cat-2', category: { id: 'cat-2', name: 'Work' } },
    ];

    vi.mocked(prisma.todo.findMany)
      .mockResolvedValueOnce(mockTodos as any)
      .mockResolvedValueOnce(updatedTodos as any);
    vi.mocked(prisma.todo.updateMany).mockResolvedValue({ count: 2 });

    const request = new Request('http://localhost/api/todos/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1', 'todo-2'], categoryId: 'cat-2' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.updated).toBe(2);
    expect(data.todos).toHaveLength(2);
    expect(data.todos[0].categoryId).toBe('cat-2');
  });

  it('should return 400 if no updates provided', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const request = new Request('http://localhost/api/todos/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1', 'todo-2'] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('At least one update field');
  });

  it('should return 400 for invalid priority', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const request = new Request('http://localhost/api/todos/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1'], priority: 'INVALID' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('Priority must be');
  });

  it('should return 400 if no ids provided', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const request = new Request('http://localhost/api/todos/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ ids: [], priority: 'HIGH' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should only update todos belonging to user', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const mockTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', priority: 'LOW', categoryId: null },
    ];

    const updatedTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', priority: 'HIGH', categoryId: null, category: null },
    ];

    vi.mocked(prisma.todo.findMany)
      .mockResolvedValueOnce(mockTodos as any)
      .mockResolvedValueOnce(updatedTodos as any);
    vi.mocked(prisma.todo.updateMany).mockResolvedValue({ count: 1 });

    const request = new Request('http://localhost/api/todos/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1', 'todo-2'], priority: 'HIGH' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.updated).toBe(1);
  });

  it('should update both priority and category together', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const mockTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', priority: 'LOW', categoryId: null },
    ];

    const updatedTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', priority: 'HIGH', categoryId: 'cat-1', category: { id: 'cat-1', name: 'Work' } },
    ];

    vi.mocked(prisma.todo.findMany)
      .mockResolvedValueOnce(mockTodos as any)
      .mockResolvedValueOnce(updatedTodos as any);
    vi.mocked(prisma.todo.updateMany).mockResolvedValue({ count: 1 });

    const request = new Request('http://localhost/api/todos/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1'], priority: 'HIGH', categoryId: 'cat-1' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.updated).toBe(1);
    expect(data.todos[0].priority).toBe('HIGH');
    expect(data.todos[0].categoryId).toBe('cat-1');
  });

  it('should allow setting categoryId to null', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const mockTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', priority: 'LOW', categoryId: 'cat-1' },
    ];

    const updatedTodos = [
      { id: 'todo-1', title: 'Todo 1', userId: 'user-1', priority: 'LOW', categoryId: null, category: null },
    ];

    vi.mocked(prisma.todo.findMany)
      .mockResolvedValueOnce(mockTodos as any)
      .mockResolvedValueOnce(updatedTodos as any);
    vi.mocked(prisma.todo.updateMany).mockResolvedValue({ count: 1 });

    const request = new Request('http://localhost/api/todos/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ ids: ['todo-1'], categoryId: null }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.updated).toBe(1);
    expect(data.todos[0].categoryId).toBeNull();
  });
});
