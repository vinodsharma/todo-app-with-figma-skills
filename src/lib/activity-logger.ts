import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

export type EntityType = 'TODO' | 'CATEGORY' | 'USER_SETTINGS';
export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'COMPLETE' | 'UNCOMPLETE' | 'ARCHIVE' | 'RESTORE';

export interface LogActivityParams {
  entityType: EntityType;
  entityId?: string;
  entityTitle: string;
  action: ActionType;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  userId: string;
}

/**
 * Log an activity to the audit log.
 * Fails silently to avoid breaking the main operation.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        entityTitle: params.entityTitle,
        action: params.action,
        beforeState: params.beforeState as Prisma.InputJsonValue | undefined,
        afterState: params.afterState as Prisma.InputJsonValue | undefined,
        userId: params.userId,
      },
    });
  } catch (error) {
    // Log error but don't throw - activity logging should never break main operations
    console.error('Failed to log activity:', error);
  }
}
