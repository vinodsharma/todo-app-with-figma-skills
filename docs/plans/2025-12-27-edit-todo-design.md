# Edit Todo Feature Design

## Overview
Add ability to edit existing todos via a dialog triggered by an edit button.

## Component Structure

**New component:** `EditTodoDialog`
- Dialog triggered by pencil icon button on `TodoItem`
- Form fields: Title, Priority, Category, Due Date
- Reuses existing UI components: Dialog, Input, Select, Button, DatePicker

**Changes to existing components:**
- `TodoItem` - Add edit button (pencil icon) next to delete, add `onEdit` prop
- `TodoList` - Pass `onEdit` handler, add `categories` prop
- `page.tsx` - Wire up `updateTodo` with category refetch

## Data Flow

1. User clicks edit button → `onEdit(todo)` called
2. `EditTodoDialog` opens pre-filled with todo values
3. User modifies fields and clicks Save
4. `onSave(todoId, updatedFields)` called
5. `updateTodo` + `refetchCategories` (if category changed)
6. Dialog closes, list refreshes

## Form Fields
- Title: Text input (required)
- Priority: Select (Low/Medium/High)
- Category: Select (optional, includes "No Category")
- Due Date: Date picker (optional, clearable)

## UI Behavior
- Edit button: Pencil icon, appears on hover like delete
- Save button: Disabled while submitting, shows "Saving..."
- Cancel: Closes without saving

## Files to Modify
1. `src/components/edit-todo-dialog.tsx` (new)
2. `src/components/todo-item.tsx`
3. `src/components/todo-list.tsx`
4. `src/app/page.tsx`
