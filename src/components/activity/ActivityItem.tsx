'use client';

import { formatDistanceToNow } from 'date-fns';
import { Plus, Pencil, Trash2, Check, X, Settings, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActivityLog, ActionType, EntityType } from '@/types/activity';

const actionIcons: Record<ActionType, React.ReactNode> = {
  CREATE: <Plus className="h-4 w-4" />,
  UPDATE: <Pencil className="h-4 w-4" />,
  DELETE: <Trash2 className="h-4 w-4" />,
  COMPLETE: <Check className="h-4 w-4" />,
  UNCOMPLETE: <X className="h-4 w-4" />,
};

const actionColors: Record<ActionType, string> = {
  CREATE: 'text-green-600 bg-green-100 dark:bg-green-900/30',
  UPDATE: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  DELETE: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  COMPLETE: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
  UNCOMPLETE: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
};

const entityIcons: Record<EntityType, React.ReactNode> = {
  TODO: <Check className="h-3 w-3" />,
  CATEGORY: <FolderOpen className="h-3 w-3" />,
  USER_SETTINGS: <Settings className="h-3 w-3" />,
};

const actionLabels: Record<ActionType, string> = {
  CREATE: 'Created',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  COMPLETE: 'Completed',
  UNCOMPLETE: 'Uncompleted',
};

interface ActivityItemProps {
  activity: ActivityLog;
  compact?: boolean;
}

export function ActivityItem({ activity, compact = false }: ActivityItemProps) {
  const timeAgo = formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true });

  return (
    <div className={cn('flex items-start gap-3', compact ? 'py-2' : 'py-3')}>
      {/* Action icon */}
      <div
        className={cn(
          'flex-shrink-0 rounded-full p-1.5',
          actionColors[activity.action as ActionType]
        )}
      >
        {actionIcons[activity.action as ActionType]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', compact && 'truncate')}>
          <span className="font-medium">{actionLabels[activity.action as ActionType]}</span>
          {' '}
          <span className="text-muted-foreground">{activity.entityType.toLowerCase()}</span>
          {': '}
          <span className="font-medium">{activity.entityTitle}</span>
        </p>
        <p className="text-xs text-muted-foreground" title={new Date(activity.createdAt).toLocaleString()}>
          {timeAgo}
        </p>
      </div>
    </div>
  );
}
