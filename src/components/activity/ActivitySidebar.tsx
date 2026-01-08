'use client';

import Link from 'next/link';
import { History, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useActivity } from '@/hooks/use-activity';
import { ActivityItem } from './ActivityItem';

interface ActivitySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ActivitySidebar({ isOpen, onClose }: ActivitySidebarProps) {
  const { activities, isLoading, error } = useActivity({ limit: 10 });

  if (!isOpen) return null;

  return (
    <div className="w-80 border-l border-border bg-background flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5" />
          <h2 className="font-semibold">Activity</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Activity list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          {isLoading && activities.length === 0 && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {!isLoading && activities.length === 0 && (
            <p className="text-sm text-muted-foreground">No activity yet</p>
          )}

          {activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} compact />
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Link href="/activity">
          <Button variant="outline" className="w-full">
            View all activity
          </Button>
        </Link>
      </div>
    </div>
  );
}
