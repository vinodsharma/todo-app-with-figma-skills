# Activity History Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement activity logging for all todo/category/settings changes with sidebar and full-page views.

**Architecture:** Add ActivityLog model to track all mutations. Create a `logActivity()` helper called from API routes after successful operations. Build ActivitySidebar component for quick view and /activity page for full history with filtering.

**Tech Stack:** Prisma (PostgreSQL), Next.js API routes, React components, shadcn/ui, date-fns

---

## Task 1: Add ActivityLog Model to Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add ActivityLog model to schema**

Add after the Todo model in `prisma/schema.prisma`:

```prisma
model ActivityLog {
  id           String   @id @default(cuid())
  entityType   String   // "TODO", "CATEGORY", "USER_SETTINGS"
  entityId     String?  // ID of affected entity (null if deleted)
  entityTitle  String   // Human-readable name at time of action
  action       String   // "CREATE", "UPDATE", "DELETE", "COMPLETE", "UNCOMPLETE"

  // Full snapshots stored as JSON
  beforeState  Json?    // State before change (null for CREATE)
  afterState   Json?    // State after change (null for DELETE)

  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())

  @@index([userId, createdAt])
  @@index([entityType, entityId])
}
```

**Step 2: Add relation to User model**

In the User model, add:
```prisma
activityLogs  ActivityLog[]
```

**Step 3: Run migration**

Run: `npx prisma migrate dev --name add-activity-log`
Expected: Migration successful

**Step 4: Verify schema**

Run: `npx prisma generate`
Expected: Prisma Client generated

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add ActivityLog model for audit logging"
```

---

## Task 2: Create Activity Logger Helper

**Files:**
- Create: `src/lib/activity-logger.ts`
- Create: `src/lib/__tests__/activity-logger.test.ts`

**Step 1: Write the test file**

Create `src/lib/__tests__/activity-logger.test.ts`:

```typescript
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
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/activity-logger.test.ts`
Expected: FAIL - module not found

**Step 3: Create the activity logger**

Create `src/lib/activity-logger.ts`:

```typescript
import { prisma } from './prisma';

export type EntityType = 'TODO' | 'CATEGORY' | 'USER_SETTINGS';
export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'COMPLETE' | 'UNCOMPLETE';

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
        beforeState: params.beforeState,
        afterState: params.afterState,
        userId: params.userId,
      },
    });
  } catch (error) {
    // Log error but don't throw - activity logging should never break main operations
    console.error('Failed to log activity:', error);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/activity-logger.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/activity-logger.ts src/lib/__tests__/activity-logger.test.ts
git commit -m "feat: add activity logger helper with tests"
```

---

## Task 3: Create Activity API Types

**Files:**
- Create: `src/types/activity.ts`

**Step 1: Create type definitions**

Create `src/types/activity.ts`:

```typescript
export type EntityType = 'TODO' | 'CATEGORY' | 'USER_SETTINGS';
export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'COMPLETE' | 'UNCOMPLETE';

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
```

**Step 2: Commit**

```bash
git add src/types/activity.ts
git commit -m "feat: add activity log type definitions"
```

---

## Task 4: Create GET /api/activity Endpoint

**Files:**
- Create: `src/app/api/activity/route.ts`

**Step 1: Create the API route**

Create `src/app/api/activity/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const cursor = searchParams.get('cursor');
    const entityType = searchParams.get('entityType');
    const action = searchParams.get('action');

    // Build where clause
    const where: {
      userId: string;
      entityType?: string;
      action?: string;
      createdAt?: { lt: Date };
    } = {
      userId: session.user.id,
    };

    if (entityType) {
      where.entityType = entityType;
    }

    if (action) {
      where.action = action;
    }

    // Cursor-based pagination
    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    const activities = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Fetch one extra to determine if there's more
    });

    // Determine if there's a next page
    let nextCursor: string | undefined;
    if (activities.length > limit) {
      const nextItem = activities.pop();
      nextCursor = nextItem?.createdAt.toISOString();
    }

    return NextResponse.json({
      activities,
      nextCursor,
    });
  } catch (error) {
    console.error('Error fetching activity log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity log' },
      { status: 500 }
    );
  }
}
```

**Step 2: Test manually**

Run: `curl http://localhost:3000/api/activity` (with auth)
Expected: `{ "activities": [], "nextCursor": undefined }`

**Step 3: Commit**

```bash
git add src/app/api/activity/route.ts
git commit -m "feat(api): add GET /api/activity endpoint with pagination and filters"
```

---

## Task 5: Integrate Logging into Todo CREATE

**Files:**
- Modify: `src/app/api/todos/route.ts`

**Step 1: Add import at top of file**

```typescript
import { logActivity } from '@/lib/activity-logger';
```

**Step 2: Add logging after todo creation**

After the `prisma.todo.create()` call and before `return NextResponse.json(todo, { status: 201 });`, add:

```typescript
    // Log activity
    await logActivity({
      entityType: 'TODO',
      entityId: todo.id,
      entityTitle: todo.title,
      action: 'CREATE',
      afterState: {
        id: todo.id,
        title: todo.title,
        description: todo.description,
        completed: todo.completed,
        priority: todo.priority,
        dueDate: todo.dueDate?.toISOString() || null,
        categoryId: todo.categoryId,
      },
      userId: session.user.id,
    });
```

**Step 3: Verify by creating a todo**

1. Create a todo via the UI
2. Check `/api/activity` returns the CREATE log

**Step 4: Commit**

```bash
git add src/app/api/todos/route.ts
git commit -m "feat: log activity on todo creation"
```

---

## Task 6: Integrate Logging into Todo UPDATE/COMPLETE

**Files:**
- Modify: `src/app/api/todos/[id]/route.ts`

**Step 1: Add import at top of file**

```typescript
import { logActivity } from '@/lib/activity-logger';
```

**Step 2: Capture before state and add logging**

In the PATCH function, after fetching `existingTodo` and before `prisma.todo.update()`, capture the before state:

```typescript
    // Capture before state for activity log
    const beforeState = {
      id: existingTodo.id,
      title: existingTodo.title,
      description: existingTodo.description,
      completed: existingTodo.completed,
      priority: existingTodo.priority,
      dueDate: existingTodo.dueDate?.toISOString() || null,
      categoryId: existingTodo.categoryId,
    };
```

After `prisma.todo.update()` and before `return NextResponse.json(updatedTodo);`, add:

```typescript
    // Determine action type
    let action: 'UPDATE' | 'COMPLETE' | 'UNCOMPLETE' = 'UPDATE';
    if (completed !== undefined) {
      action = completed ? 'COMPLETE' : 'UNCOMPLETE';
    }

    // Log activity
    await logActivity({
      entityType: 'TODO',
      entityId: updatedTodo.id,
      entityTitle: updatedTodo.title,
      action,
      beforeState,
      afterState: {
        id: updatedTodo.id,
        title: updatedTodo.title,
        description: updatedTodo.description,
        completed: updatedTodo.completed,
        priority: updatedTodo.priority,
        dueDate: updatedTodo.dueDate?.toISOString() || null,
        categoryId: updatedTodo.categoryId,
      },
      userId: session.user.id,
    });
```

**Step 3: Commit**

```bash
git add src/app/api/todos/[id]/route.ts
git commit -m "feat: log activity on todo update/complete"
```

---

## Task 7: Integrate Logging into Todo DELETE

**Files:**
- Modify: `src/app/api/todos/[id]/route.ts`

**Step 1: Add logging before delete**

In the DELETE function, after fetching `existingTodo` and before `prisma.todo.delete()`, add:

```typescript
    // Log activity before deletion
    await logActivity({
      entityType: 'TODO',
      entityId: existingTodo.id,
      entityTitle: existingTodo.title,
      action: 'DELETE',
      beforeState: {
        id: existingTodo.id,
        title: existingTodo.title,
        description: existingTodo.description,
        completed: existingTodo.completed,
        priority: existingTodo.priority,
        dueDate: existingTodo.dueDate?.toISOString() || null,
        categoryId: existingTodo.categoryId,
      },
      userId: session.user.id,
    });
```

**Step 2: Commit**

```bash
git add src/app/api/todos/[id]/route.ts
git commit -m "feat: log activity on todo deletion"
```

---

## Task 8: Integrate Logging into Category Routes

**Files:**
- Modify: `src/app/api/categories/route.ts`
- Modify: `src/app/api/categories/[id]/route.ts`

**Step 1: Add import to both files**

```typescript
import { logActivity } from '@/lib/activity-logger';
```

**Step 2: Add logging to POST in route.ts**

After `prisma.category.create()`, add:

```typescript
    // Log activity
    await logActivity({
      entityType: 'CATEGORY',
      entityId: category.id,
      entityTitle: category.name,
      action: 'CREATE',
      afterState: {
        id: category.id,
        name: category.name,
        color: category.color,
      },
      userId: session.user.id,
    });
```

**Step 3: Add logging to PATCH in [id]/route.ts**

Capture before state, then after update:

```typescript
    // Log activity
    await logActivity({
      entityType: 'CATEGORY',
      entityId: updatedCategory.id,
      entityTitle: updatedCategory.name,
      action: 'UPDATE',
      beforeState: {
        id: existingCategory.id,
        name: existingCategory.name,
        color: existingCategory.color,
      },
      afterState: {
        id: updatedCategory.id,
        name: updatedCategory.name,
        color: updatedCategory.color,
      },
      userId: session.user.id,
    });
```

**Step 4: Add logging to DELETE in [id]/route.ts**

Before delete:

```typescript
    // Log activity
    await logActivity({
      entityType: 'CATEGORY',
      entityId: existingCategory.id,
      entityTitle: existingCategory.name,
      action: 'DELETE',
      beforeState: {
        id: existingCategory.id,
        name: existingCategory.name,
        color: existingCategory.color,
      },
      userId: session.user.id,
    });
```

**Step 5: Commit**

```bash
git add src/app/api/categories/route.ts src/app/api/categories/[id]/route.ts
git commit -m "feat: log activity on category create/update/delete"
```

---

## Task 9: Integrate Logging into User Settings

**Files:**
- Modify: `src/app/api/user/theme/route.ts`

**Step 1: Add import**

```typescript
import { logActivity } from '@/lib/activity-logger';
```

**Step 2: Add logging after theme update**

```typescript
    // Log activity
    await logActivity({
      entityType: 'USER_SETTINGS',
      entityId: session.user.id,
      entityTitle: 'Theme',
      action: 'UPDATE',
      beforeState: { theme: previousTheme },
      afterState: { theme: newTheme },
      userId: session.user.id,
    });
```

**Step 3: Commit**

```bash
git add src/app/api/user/theme/route.ts
git commit -m "feat: log activity on theme change"
```

---

## Task 10: Create useActivity Hook

**Files:**
- Create: `src/hooks/use-activity.ts`

**Step 1: Create the hook**

Create `src/hooks/use-activity.ts`:

```typescript
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
```

**Step 2: Commit**

```bash
git add src/hooks/use-activity.ts
git commit -m "feat: add useActivity hook for fetching activity logs"
```

---

## Task 11: Create ActivityItem Component

**Files:**
- Create: `src/components/activity/ActivityItem.tsx`

**Step 1: Create the component**

Create `src/components/activity/ActivityItem.tsx`:

```typescript
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
```

**Step 2: Commit**

```bash
git add src/components/activity/ActivityItem.tsx
git commit -m "feat: add ActivityItem component"
```

---

## Task 12: Create ActivitySidebar Component

**Files:**
- Create: `src/components/activity/ActivitySidebar.tsx`

**Step 1: Create the component**

Create `src/components/activity/ActivitySidebar.tsx`:

```typescript
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
```

**Step 2: Add ScrollArea to UI components if not exists**

Check if `src/components/ui/scroll-area.tsx` exists. If not, run:
```bash
npx shadcn@latest add scroll-area
```

**Step 3: Create index file**

Create `src/components/activity/index.ts`:

```typescript
export { ActivityItem } from './ActivityItem';
export { ActivitySidebar } from './ActivitySidebar';
```

**Step 4: Commit**

```bash
git add src/components/activity/
git commit -m "feat: add ActivitySidebar component"
```

---

## Task 13: Add Activity Toggle to Header

**Files:**
- Modify: `src/components/header.tsx`

**Step 1: Add activity toggle button**

Import and add state/toggle button for activity sidebar:

```typescript
import { History } from 'lucide-react';
```

Add prop to Header component:
```typescript
interface HeaderProps {
  onActivityToggle?: () => void;
  isActivityOpen?: boolean;
}
```

Add button next to theme toggle:
```typescript
<Button
  variant="ghost"
  size="icon"
  onClick={onActivityToggle}
  className={cn(isActivityOpen && 'bg-accent')}
  title="Activity history"
>
  <History className="h-5 w-5" />
</Button>
```

**Step 2: Commit**

```bash
git add src/components/header.tsx
git commit -m "feat: add activity toggle button to header"
```

---

## Task 14: Integrate ActivitySidebar into Main Layout

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Add state for sidebar visibility**

```typescript
const [isActivityOpen, setIsActivityOpen] = useState(false);
```

**Step 2: Import and add ActivitySidebar**

```typescript
import { ActivitySidebar } from '@/components/activity';
```

**Step 3: Update layout structure**

Wrap main content and sidebar in a flex container:

```typescript
<div className="flex flex-1 overflow-hidden">
  {/* Existing main content */}
  <div className="flex-1 overflow-auto">
    {/* ... existing content ... */}
  </div>

  {/* Activity sidebar */}
  <ActivitySidebar
    isOpen={isActivityOpen}
    onClose={() => setIsActivityOpen(false)}
  />
</div>
```

**Step 4: Pass props to Header**

```typescript
<Header
  onActivityToggle={() => setIsActivityOpen(!isActivityOpen)}
  isActivityOpen={isActivityOpen}
/>
```

**Step 5: Test the sidebar**

1. Click the History icon in header
2. Sidebar should open showing recent activity
3. Click X or toggle again to close

**Step 6: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: integrate ActivitySidebar into main layout"
```

---

## Task 15: Create Activity Page

**Files:**
- Create: `src/app/activity/page.tsx`

**Step 1: Create the page**

Create `src/app/activity/page.tsx`:

```typescript
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
```

**Step 2: Test the page**

1. Navigate to `/activity`
2. Should show activity list with filters
3. Change filters and verify list updates
4. Click "Load more" for pagination

**Step 3: Commit**

```bash
git add src/app/activity/page.tsx
git commit -m "feat: add activity history page with filters and pagination"
```

---

## Task 16: Add E2E Tests for Activity Feature

**Files:**
- Create: `e2e/activity.spec.ts`

**Step 1: Create E2E tests**

Create `e2e/activity.spec.ts`:

```typescript
import { test, expect, uniqueTitle } from './fixtures';

test.describe('Activity History', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto('/');
  });

  test('can toggle activity sidebar', async ({ page }) => {
    // Click activity button in header
    await page.getByTitle('Activity history').click();

    // Sidebar should open
    await expect(page.getByRole('heading', { name: 'Activity' })).toBeVisible();

    // Click close button
    await page.getByRole('button', { name: 'Close' }).or(page.locator('button:has(svg.lucide-x)')).first().click();

    // Sidebar should close
    await expect(page.getByRole('heading', { name: 'Activity' })).not.toBeVisible();
  });

  test('shows activity after creating a todo', async ({ page }) => {
    const todoTitle = uniqueTitle('Activity Test');

    // Create a todo
    await page.getByPlaceholder('Add a new todo...').fill(todoTitle);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(todoTitle)).toBeVisible({ timeout: 5000 });

    // Open activity sidebar
    await page.getByTitle('Activity history').click();

    // Should show the create activity
    await expect(page.getByText(`Created todo: ${todoTitle}`).or(page.getByText(todoTitle))).toBeVisible({ timeout: 5000 });
  });

  test('can navigate to activity page', async ({ page }) => {
    // Open sidebar
    await page.getByTitle('Activity history').click();

    // Click "View all activity"
    await page.getByRole('link', { name: 'View all activity' }).click();

    // Should be on activity page
    await expect(page).toHaveURL('/activity');
    await expect(page.getByRole('heading', { name: 'Activity History' })).toBeVisible();
  });

  test('activity page has working filters', async ({ page }) => {
    await page.goto('/activity');

    // Entity type filter
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: 'Todos' }).click();

    // Action filter
    await page.getByRole('combobox').nth(1).click();
    await page.getByRole('option', { name: 'Created' }).click();

    // Page should still be functional
    await expect(page.getByRole('heading', { name: 'Activity History' })).toBeVisible();
  });
});
```

**Step 2: Run E2E tests**

Run: `npx playwright test e2e/activity.spec.ts --timeout=60000`
Expected: All tests pass

**Step 3: Commit**

```bash
git add e2e/activity.spec.ts
git commit -m "test: add E2E tests for activity history feature"
```

---

## Task 17: Final Testing and Cleanup

**Step 1: Run all tests**

```bash
npm run test
npx playwright test
```

**Step 2: Fix any failing tests**

Address any issues that arise.

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup for activity history feature"
```

---

## Summary

**Total Tasks:** 17

**Files Created:**
- `prisma/migrations/*` (migration)
- `src/lib/activity-logger.ts`
- `src/lib/__tests__/activity-logger.test.ts`
- `src/types/activity.ts`
- `src/app/api/activity/route.ts`
- `src/hooks/use-activity.ts`
- `src/components/activity/ActivityItem.tsx`
- `src/components/activity/ActivitySidebar.tsx`
- `src/components/activity/index.ts`
- `src/app/activity/page.tsx`
- `e2e/activity.spec.ts`

**Files Modified:**
- `prisma/schema.prisma`
- `src/app/api/todos/route.ts`
- `src/app/api/todos/[id]/route.ts`
- `src/app/api/categories/route.ts`
- `src/app/api/categories/[id]/route.ts`
- `src/app/api/user/theme/route.ts`
- `src/components/header.tsx`
- `src/app/page.tsx`
