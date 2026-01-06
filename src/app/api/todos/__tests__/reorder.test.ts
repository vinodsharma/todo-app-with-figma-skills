import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    todo: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { PATCH } from '../reorder/route';

describe('PATCH /api/todos/reorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new Request('http://localhost/api/todos/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ todoId: '1', newSortOrder: 0 }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 if todoId is missing', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user1' },
      expires: '',
    });

    const request = new Request('http://localhost/api/todos/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ newSortOrder: 0 }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(400);
  });

  it('returns 404 if todo not found', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user1' },
      expires: '',
    });
    vi.mocked(prisma.todo.findUnique).mockResolvedValue(null);

    const request = new Request('http://localhost/api/todos/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ todoId: 'nonexistent', newSortOrder: 0 }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(404);
  });

  it('updates todo sortOrder successfully', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user1' },
      expires: '',
    });
    vi.mocked(prisma.todo.findUnique).mockResolvedValue({
      id: 'todo1',
      userId: 'user1',
      categoryId: 'cat1',
      sortOrder: 2,
    } as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (cb) => {
      return cb({
        todo: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          update: vi.fn().mockResolvedValue({ id: 'todo1', sortOrder: 0, category: null }),
        },
      });
    });

    const request = new Request('http://localhost/api/todos/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ todoId: 'todo1', newSortOrder: 0 }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(200);
  });
});
