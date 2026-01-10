export type EntityType = 'TODO' | 'CATEGORY' | 'USER_SETTINGS';
export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'COMPLETE' | 'UNCOMPLETE' | 'ARCHIVE' | 'RESTORE';

export interface ActivityLog {
  id: string;
  entityType: EntityType;
  entityId: string | null;
  entityTitle: string;
  action: ActionType;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  userId: string;
  createdAt: string;
}

export interface ActivityResponse {
  activities: ActivityLog[];
  nextCursor?: string;
}
