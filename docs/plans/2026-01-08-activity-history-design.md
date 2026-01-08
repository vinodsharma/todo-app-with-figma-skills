# Activity History / Audit Log Design

> **Issue:** #21 - Activity history / Audit log

## Overview

Track and display history of all changes made to todos, categories, and user settings. Provides both a quick-access sidebar panel and a dedicated full-page view with filtering.

## Requirements

- Log all CRUD operations for todos, categories, and user settings
- Full before/after snapshots for maximum detail
- Quick view in collapsible sidebar
- Full page with filtering and infinite scroll
- Retain history forever

## Data Model

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

**Key decisions:**
- `entityType` allows tracking todos, categories, and settings in one table
- `beforeState`/`afterState` as JSON enables full snapshots with computed diffs
- `entityTitle` preserved so deleted entities remain readable
- Indexed by user+timestamp for efficient feed queries

## API Design

### Endpoints

```
GET /api/activity
  Query params:
  - limit (default: 20, max: 100)
  - cursor (for pagination, uses createdAt timestamp)
  - entityType (optional filter: "TODO", "CATEGORY", "USER_SETTINGS")
  - action (optional filter: "CREATE", "UPDATE", "DELETE", etc.)

  Returns: { activities: ActivityLog[], nextCursor?: string }

GET /api/activity/[entityType]/[entityId]
  Returns: Activity history for a specific entity
```

### Logging Helper

```typescript
// src/lib/activity-logger.ts
interface LogActivityParams {
  entityType: 'TODO' | 'CATEGORY' | 'USER_SETTINGS';
  entityId?: string;
  entityTitle: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'COMPLETE' | 'UNCOMPLETE';
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  userId: string;
}

export async function logActivity(params: LogActivityParams): Promise<void>
```

### Integration Points

Routes to update:
- `POST /api/todos` - log CREATE
- `PATCH /api/todos/[id]` - log UPDATE or COMPLETE/UNCOMPLETE
- `DELETE /api/todos/[id]` - log DELETE
- `POST /api/categories` - log CREATE
- `PATCH /api/categories/[id]` - log UPDATE
- `DELETE /api/categories/[id]` - log DELETE
- `PATCH /api/user/theme` - log UPDATE (USER_SETTINGS)

## UI Components

### ActivitySidebar

Collapsible right panel showing recent activity:
- Latest 10 activities in compact view
- Icon + description + relative timestamp
- "View all" link to full page
- Toggle button in header

### ActivityPage (/activity)

Full-page activity feed:
- Filter bar: entity type dropdown, action type dropdown
- Infinite scroll with cursor pagination
- Detailed view with expandable diffs
- Click to navigate to entity (if not deleted)

### ActivityItem

Shared component for both views:
- Icon based on action type
- Color-coded by entity type
- Relative timestamp with full date on hover
- Expandable diff for UPDATE actions

### ActivityDiff

Shows before/after changes:
- Computed from snapshots
- Format: "Priority: Low → High"
- Collapsed by default

## Implementation Phases

### Phase 1: Database & Core
- Add ActivityLog model to Prisma schema
- Run migration
- Create `logActivity()` helper
- Create `GET /api/activity` endpoint

### Phase 2: Integrate Logging
- Add to todos routes (CREATE, UPDATE, DELETE, COMPLETE)
- Add to categories routes
- Add to user settings route

### Phase 3: UI - Sidebar
- ActivitySidebar component
- ActivityItem component
- Header toggle button
- Layout integration

### Phase 4: UI - Full Page
- /activity page route
- Filter bar
- Infinite scroll
- ActivityDiff component

## Testing Strategy

- Unit tests for `logActivity()` helper
- API tests for activity endpoints with filters
- E2E tests for sidebar toggle and activity page navigation
