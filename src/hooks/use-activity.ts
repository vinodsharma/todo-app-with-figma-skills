'use client';

import { useState, useEffect, useCallback } from 'react';
import { ActivityLog, ActivityResponse, EntityType, ActionType } from '@/types/activity';

interface UseActivityOptions {
  limit?: number;
  entityType?: EntityType;
  action?: ActionType;
}

export function useActivity(options: UseActivityOptions = {}) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);

  const fetchActivities = useCallback(async (cursor?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.limit) params.set('limit', options.limit.toString());
      if (options.entityType) params.set('entityType', options.entityType);
      if (options.action) params.set('action', options.action);
      if (cursor) params.set('cursor', cursor);

      const response = await fetch(`/api/activity?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data: ActivityResponse = await response.json();

      if (cursor) {
        // Append for pagination
        setActivities((prev) => [...prev, ...data.activities]);
      } else {
        // Replace for initial load or refresh
        setActivities(data.activities);
      }

      setNextCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [options.limit, options.entityType, options.action]);

  const loadMore = useCallback(() => {
    if (nextCursor && !isLoading) {
      fetchActivities(nextCursor);
    }
  }, [nextCursor, isLoading, fetchActivities]);

  const refresh = useCallback(() => {
    setActivities([]);
    setNextCursor(undefined);
    setHasMore(true);
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
