import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logActivity, EntityType, ActionType } from '../activity-logger';
import { prisma } from '../prisma';

vi.mock('../prisma', () => ({
  prisma: {
    activityLog: {
      create: vi.fn(),
    },
  },
}));

describe('logActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates activity log with all fields', async () => {
    const params = {
      entityType: 'TODO' as EntityType,
      entityId: 'todo-123',
      entityTitle: 'Buy groceries',
      action: 'CREATE' as ActionType,
      afterState: { title: 'Buy groceries', completed: false },
      userId: 'user-456',
    };

    await logActivity(params);

    expect(prisma.activityLog.create).toHaveBeenCalledWith({
      data: {
        entityType: 'TODO',
        entityId: 'todo-123',
        entityTitle: 'Buy groceries',
        action: 'CREATE',
        beforeState: undefined,
        afterState: { title: 'Buy groceries', completed: false },
        userId: 'user-456',
      },
    });
  });

  it('handles DELETE action with beforeState only', async () => {
    const params = {
      entityType: 'TODO' as EntityType,
      entityId: 'todo-123',
      entityTitle: 'Deleted task',
      action: 'DELETE' as ActionType,
      beforeState: { title: 'Deleted task', completed: false },
      userId: 'user-456',
    };

    await logActivity(params);

    expect(prisma.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'DELETE',
        beforeState: { title: 'Deleted task', completed: false },
        afterState: undefined,
      }),
    });
  });

  it('handles errors gracefully without throwing', async () => {
    vi.mocked(prisma.activityLog.create).mockRejectedValue(new Error('DB error'));

    // Should not throw
    await expect(
      logActivity({
        entityType: 'TODO',
        entityId: 'todo-123',
        entityTitle: 'Test',
        action: 'CREATE',
        userId: 'user-456',
      })
    ).resolves.toBeUndefined();
  });
});
