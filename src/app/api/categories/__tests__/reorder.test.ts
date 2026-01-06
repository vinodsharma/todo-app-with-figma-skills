import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    category: {
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

describe('PATCH /api/categories/reorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new Request('http://localhost/api/categories/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ categoryId: '1', newSortOrder: 0 }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(401);
  });

  it('updates category sortOrder successfully', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user1' },
      expires: '',
    });
    vi.mocked(prisma.category.findUnique).mockResolvedValue({
      id: 'cat1',
      userId: 'user1',
      sortOrder: 2,
    } as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (cb) => {
      return cb({
        category: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          update: vi.fn().mockResolvedValue({ id: 'cat1', sortOrder: 0, _count: { todos: 0 } }),
        },
      });
    });

    const request = new Request('http://localhost/api/categories/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ categoryId: 'cat1', newSortOrder: 0 }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(200);
  });
});
