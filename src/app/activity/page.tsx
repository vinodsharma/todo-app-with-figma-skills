'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useActivity } from '@/hooks/use-activity';
import { ActivityItem } from '@/components/activity';
import { EntityType, ActionType } from '@/types/activity';

export default function ActivityPage() {
  const [entityType, setEntityType] = useState<EntityType | 'ALL'>('ALL');
  const [action, setAction] = useState<ActionType | 'ALL'>('ALL');

  const { activities, isLoading, error, hasMore, loadMore } = useActivity({
    limit: 20,
    entityType: entityType === 'ALL' ? undefined : entityType,
    action: action === 'ALL' ? undefined : action,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <History className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Activity History</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="container mx-auto px-4 py-4 border-b border-border">
        <div className="flex gap-4">
          <Select value={entityType} onValueChange={(v) => setEntityType(v as EntityType | 'ALL')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Entity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              <SelectItem value="TODO">Todos</SelectItem>
              <SelectItem value="CATEGORY">Categories</SelectItem>
              <SelectItem value="USER_SETTINGS">Settings</SelectItem>
            </SelectContent>
          </Select>

          <Select value={action} onValueChange={(v) => setAction(v as ActionType | 'ALL')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All actions</SelectItem>
              <SelectItem value="CREATE">Created</SelectItem>
              <SelectItem value="UPDATE">Updated</SelectItem>
              <SelectItem value="DELETE">Deleted</SelectItem>
              <SelectItem value="COMPLETE">Completed</SelectItem>
              <SelectItem value="UNCOMPLETE">Uncompleted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Activity list */}
      <div className="container mx-auto px-4 py-6">
        {isLoading && activities.length === 0 && (
          <p className="text-muted-foreground">Loading...</p>
        )}

        {error && (
          <p className="text-destructive">{error}</p>
        )}

        {!isLoading && activities.length === 0 && (
          <p className="text-muted-foreground">No activity found</p>
        )}

        <div className="space-y-2 max-w-2xl">
          {activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>

        {hasMore && (
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Load more'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
