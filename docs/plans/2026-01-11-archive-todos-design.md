# Archive Todos (Soft Delete) - Design Document

## Overview

Implement soft delete functionality allowing users to archive todos instead of permanently deleting them, with the ability to restore or permanently delete from the archive.

## Data Model

Add `archivedAt` timestamp field to Todo model:

```prisma
model Todo {
  // ... existing fields
  archivedAt  DateTime?  // null = active, timestamp = archived
}
```

- `null` = active todo
- timestamp = archived (records when archived)

## UI Design

### Sidebar
```
Categories
─────────────
[All Todos]        (12)
─────────────
[Work]             (5)
[Personal]         (7)
─────────────
[+ Add Category]
─────────────
[Archive]          (3)   ← New section at bottom
```

### Archive View
- Shows only archived todos (read-only, no drag-drop reordering)
- Each item has "Restore" and "Delete Permanently" actions
- No todo creation form displayed
- Header indicates "Archived Todos"

### Todo Actions Menu
**Active todos:**
- Archive (replaces Delete as primary action)
- Delete Permanently (with confirmation)

**Archived todos:**
- Restore
- Delete Permanently

### Bulk Operations
- Add "Archive" button to BulkActionBar
- Archive view has bulk "Restore" and "Delete Permanently"

## API Design

### Modified Endpoints

`GET /api/todos`
- Add `archived` query parameter
- `archived=false` (default): Return only active todos
- `archived=true`: Return only archived todos

`PATCH /api/todos/[id]`
- Support `archivedAt` field for single archive/restore

### New Endpoints

`POST /api/todos/bulk-archive`
```json
{ "ids": ["id1", "id2"] }
```

`POST /api/todos/bulk-restore`
```json
{ "ids": ["id1", "id2"] }
```

### Behavior Rules

**Subtasks:**
- Archiving parent archives all subtasks
- Restoring parent restores all subtasks
- Individual subtasks cannot be archived separately

**Delete:**
- Existing DELETE endpoint = permanent delete
- Frontend controls when to offer archive vs delete

## Activity Logging

New actions to log:
- `ARCHIVE` - When todo is archived
- `RESTORE` - When todo is restored from archive

## Scope

### Included (MVP)
- `archivedAt` field on Todo model
- Archive/Restore single todo
- Bulk archive/restore
- "Archived" view in sidebar with count
- Permanent delete with confirmation
- Subtasks follow parent archive state
- Archive option in BulkActionBar
- Activity logging for archive/restore

### Deferred
- Auto-archive completed todos (user setting)
- Auto-delete archived todos after X days
- Archive search/filter within archive view

## Testing

- E2E tests: archive flow, restore flow, bulk operations
- Unit tests: API endpoints, edge cases
