# Recurring Todos Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add recurring todos that automatically regenerate on completion with support for daily, weekly, monthly, and custom recurrence patterns.

**Architecture:** Store recurrence rules in iCal RRULE format. When a recurring todo is completed, parse the RRULE to calculate the next occurrence date and create a new todo. Display recurrence with a repeat icon badge.

**Tech Stack:** Prisma (schema), rrule.js (date calculation), React components (UI), Next.js API routes

---

## Task 1: Install rrule dependency

**Files:**
- Modify: `package.json`

**Step 1: Install rrule package**

Run:
```bash
npm install rrule
```

**Step 2: Verify installation**

Run:
```bash
npm ls rrule
```
Expected: Shows rrule version installed

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add rrule dependency for recurring todos"
```

---

## Task 2: Database schema migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/YYYYMMDD_add_recurrence/migration.sql`

**Step 1: Add recurrence fields to Todo model**

In `prisma/schema.prisma`, add to the Todo model after `updatedAt`:

```prisma
  // Recurrence fields
  recurrenceRule  String?    // iCal RRULE format, e.g. "FREQ=WEEKLY;BYDAY=MO,WE,FR"
  recurrenceEnd   DateTime?  // Optional end date for recurrence
```

**Step 2: Create and run migration**

Run:
```bash
npx prisma migrate dev --name add_recurrence
```
Expected: Migration created and applied successfully

**Step 3: Verify schema**

Run:
```bash
npx prisma studio
```
Expected: Todo table shows recurrenceRule and recurrenceEnd columns

**Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: add recurrence fields to Todo schema"
```

---

## Task 3: Update TypeScript types

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add recurrence fields to Todo interface**

After `_count` in the Todo interface, the fields are already ordered. Add before the closing brace:

```typescript
  // Recurrence fields
  recurrenceRule: string | null;
  recurrenceEnd: string | null;
```

**Step 2: Add recurrence fields to CreateTodoInput**

After `parentId`, add:

```typescript
  recurrenceRule?: string;
  recurrenceEnd?: string;
```

**Step 3: Add recurrence fields to UpdateTodoInput**

After `categoryId`, add:

```typescript
  recurrenceRule?: string | null;
  recurrenceEnd?: string | null;
```

**Step 4: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```
Expected: No errors

**Step 5: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add recurrence fields to TypeScript types"
```

---

## Task 4: Create recurrence helper library

**Files:**
- Create: `src/lib/recurrence.ts`
- Create: `src/lib/__tests__/recurrence.test.ts`

**Step 1: Write failing tests**

Create `src/lib/__tests__/recurrence.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  getNextOccurrence,
  parseRecurrenceRule,
  formatRecurrenceRule,
  createRecurrenceRule,
  getRecurrenceDescription,
} from '../recurrence';

describe('recurrence helpers', () => {
  describe('getNextOccurrence', () => {
    it('returns next day for daily recurrence', () => {
      const rule = 'FREQ=DAILY';
      const fromDate = new Date('2026-01-15T10:00:00Z');
      const next = getNextOccurrence(rule, fromDate);
      expect(next?.toISOString().split('T')[0]).toBe('2026-01-16');
    });

    it('returns next week for weekly recurrence', () => {
      const rule = 'FREQ=WEEKLY';
      const fromDate = new Date('2026-01-15T10:00:00Z'); // Thursday
      const next = getNextOccurrence(rule, fromDate);
      expect(next?.toISOString().split('T')[0]).toBe('2026-01-22');
    });

    it('returns correct day for weekly with BYDAY', () => {
      const rule = 'FREQ=WEEKLY;BYDAY=MO,WE,FR';
      const fromDate = new Date('2026-01-15T10:00:00Z'); // Thursday
      const next = getNextOccurrence(rule, fromDate);
      expect(next?.toISOString().split('T')[0]).toBe('2026-01-16'); // Friday
    });

    it('returns next month for monthly recurrence', () => {
      const rule = 'FREQ=MONTHLY;BYMONTHDAY=15';
      const fromDate = new Date('2026-01-15T10:00:00Z');
      const next = getNextOccurrence(rule, fromDate);
      expect(next?.toISOString().split('T')[0]).toBe('2026-02-15');
    });

    it('returns null when past recurrence end date', () => {
      const rule = 'FREQ=DAILY';
      const fromDate = new Date('2026-01-15T10:00:00Z');
      const endDate = new Date('2026-01-15T10:00:00Z');
      const next = getNextOccurrence(rule, fromDate, endDate);
      expect(next).toBeNull();
    });

    it('handles interval correctly', () => {
      const rule = 'FREQ=WEEKLY;INTERVAL=2';
      const fromDate = new Date('2026-01-15T10:00:00Z');
      const next = getNextOccurrence(rule, fromDate);
      expect(next?.toISOString().split('T')[0]).toBe('2026-01-29');
    });
  });

  describe('createRecurrenceRule', () => {
    it('creates daily rule', () => {
      const rule = createRecurrenceRule({ frequency: 'daily' });
      expect(rule).toBe('FREQ=DAILY');
    });

    it('creates weekly rule with days', () => {
      const rule = createRecurrenceRule({
        frequency: 'weekly',
        weekdays: [1, 3, 5], // Mon, Wed, Fri
      });
      expect(rule).toBe('FREQ=WEEKLY;BYDAY=MO,WE,FR');
    });

    it('creates monthly rule with day of month', () => {
      const rule = createRecurrenceRule({
        frequency: 'monthly',
        dayOfMonth: 15,
      });
      expect(rule).toBe('FREQ=MONTHLY;BYMONTHDAY=15');
    });

    it('creates rule with interval', () => {
      const rule = createRecurrenceRule({
        frequency: 'weekly',
        interval: 2,
      });
      expect(rule).toBe('FREQ=WEEKLY;INTERVAL=2');
    });
  });

  describe('getRecurrenceDescription', () => {
    it('describes daily recurrence', () => {
      expect(getRecurrenceDescription('FREQ=DAILY')).toBe('Daily');
    });

    it('describes weekly recurrence', () => {
      expect(getRecurrenceDescription('FREQ=WEEKLY')).toBe('Weekly');
    });

    it('describes weekly with days', () => {
      expect(getRecurrenceDescription('FREQ=WEEKLY;BYDAY=MO,WE,FR')).toBe('Weekly on Mon, Wed, Fri');
    });

    it('describes monthly recurrence', () => {
      expect(getRecurrenceDescription('FREQ=MONTHLY;BYMONTHDAY=15')).toBe('Monthly on day 15');
    });

    it('describes interval', () => {
      expect(getRecurrenceDescription('FREQ=WEEKLY;INTERVAL=2')).toBe('Every 2 weeks');
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run:
```bash
npm test -- src/lib/__tests__/recurrence.test.ts
```
Expected: Tests fail (module not found)

**Step 3: Implement recurrence helpers**

Create `src/lib/recurrence.ts`:

```typescript
import { RRule, Weekday } from 'rrule';

const WEEKDAY_MAP: Record<number, Weekday> = {
  0: RRule.SU,
  1: RRule.MO,
  2: RRule.TU,
  3: RRule.WE,
  4: RRule.TH,
  5: RRule.FR,
  6: RRule.SA,
};

const WEEKDAY_NAMES: Record<string, string> = {
  MO: 'Mon',
  TU: 'Tue',
  WE: 'Wed',
  TH: 'Thu',
  FR: 'Fri',
  SA: 'Sat',
  SU: 'Sun',
};

/**
 * Get the next occurrence date after the given date
 */
export function getNextOccurrence(
  rule: string,
  afterDate: Date,
  endDate?: Date | null
): Date | null {
  try {
    const rrule = RRule.fromString(rule);

    // Get next occurrence after the given date
    const next = rrule.after(afterDate, false);

    if (!next) return null;

    // Check if past end date
    if (endDate && next > endDate) {
      return null;
    }

    return next;
  } catch (error) {
    console.error('Error parsing recurrence rule:', error);
    return null;
  }
}

/**
 * Parse RRULE string into components
 */
export function parseRecurrenceRule(rule: string): {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  weekdays?: number[];
  dayOfMonth?: number;
} | null {
  try {
    const rrule = RRule.fromString(rule);
    const options = rrule.origOptions;

    let frequency: 'daily' | 'weekly' | 'monthly';
    switch (options.freq) {
      case RRule.DAILY:
        frequency = 'daily';
        break;
      case RRule.WEEKLY:
        frequency = 'weekly';
        break;
      case RRule.MONTHLY:
        frequency = 'monthly';
        break;
      default:
        return null;
    }

    const result: ReturnType<typeof parseRecurrenceRule> = {
      frequency,
      interval: options.interval || 1,
    };

    if (options.byweekday) {
      const weekdays = Array.isArray(options.byweekday)
        ? options.byweekday
        : [options.byweekday];
      result.weekdays = weekdays.map((wd) => {
        if (typeof wd === 'number') return wd;
        return wd.weekday;
      });
    }

    if (options.bymonthday) {
      const days = Array.isArray(options.bymonthday)
        ? options.bymonthday
        : [options.bymonthday];
      result.dayOfMonth = days[0];
    }

    return result;
  } catch (error) {
    console.error('Error parsing recurrence rule:', error);
    return null;
  }
}

/**
 * Create RRULE string from components
 */
export function createRecurrenceRule(options: {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval?: number;
  weekdays?: number[];
  dayOfMonth?: number;
}): string {
  const parts: string[] = [];

  // Frequency
  switch (options.frequency) {
    case 'daily':
      parts.push('FREQ=DAILY');
      break;
    case 'weekly':
      parts.push('FREQ=WEEKLY');
      break;
    case 'monthly':
      parts.push('FREQ=MONTHLY');
      break;
  }

  // Interval
  if (options.interval && options.interval > 1) {
    parts.push(`INTERVAL=${options.interval}`);
  }

  // Weekdays (for weekly)
  if (options.weekdays && options.weekdays.length > 0) {
    const dayNames = options.weekdays.map((d) => {
      const weekday = WEEKDAY_MAP[d];
      return weekday.toString();
    });
    parts.push(`BYDAY=${dayNames.join(',')}`);
  }

  // Day of month (for monthly)
  if (options.dayOfMonth !== undefined) {
    parts.push(`BYMONTHDAY=${options.dayOfMonth}`);
  }

  return parts.join(';');
}

/**
 * Format RRULE into human-readable string
 */
export function formatRecurrenceRule(rule: string): string {
  return getRecurrenceDescription(rule);
}

/**
 * Get human-readable description of recurrence rule
 */
export function getRecurrenceDescription(rule: string): string {
  const parsed = parseRecurrenceRule(rule);
  if (!parsed) return 'Custom';

  const { frequency, interval, weekdays, dayOfMonth } = parsed;

  // Handle interval
  if (interval > 1) {
    switch (frequency) {
      case 'daily':
        return `Every ${interval} days`;
      case 'weekly':
        return `Every ${interval} weeks`;
      case 'monthly':
        return `Every ${interval} months`;
    }
  }

  // Handle specific patterns
  switch (frequency) {
    case 'daily':
      return 'Daily';
    case 'weekly':
      if (weekdays && weekdays.length > 0) {
        const dayNames = weekdays
          .sort((a, b) => a - b)
          .map((d) => {
            const wd = WEEKDAY_MAP[d];
            return WEEKDAY_NAMES[wd.toString()];
          });
        return `Weekly on ${dayNames.join(', ')}`;
      }
      return 'Weekly';
    case 'monthly':
      if (dayOfMonth !== undefined) {
        if (dayOfMonth === -1) {
          return 'Monthly on last day';
        }
        return `Monthly on day ${dayOfMonth}`;
      }
      return 'Monthly';
    default:
      return 'Custom';
  }
}

/**
 * Preset recurrence rules
 */
export const RECURRENCE_PRESETS = {
  none: null,
  daily: 'FREQ=DAILY',
  weekly: 'FREQ=WEEKLY',
  monthly: 'FREQ=MONTHLY',
} as const;

export type RecurrencePreset = keyof typeof RECURRENCE_PRESETS;
```

**Step 4: Run tests to verify they pass**

Run:
```bash
npm test -- src/lib/__tests__/recurrence.test.ts
```
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/lib/recurrence.ts src/lib/__tests__/recurrence.test.ts
git commit -m "feat: add recurrence helper library with RRULE support"
```

---

## Task 5: Update API to handle recurrence on completion

**Files:**
- Modify: `src/app/api/todos/[id]/route.ts`

**Step 1: Import recurrence helper**

At the top of the file, add:

```typescript
import { getNextOccurrence } from '@/lib/recurrence';
```

**Step 2: Update PATCH handler to create next occurrence**

In the PATCH function, after setting `updateData.completed = completed;` (around line 68), add the logic to create next occurrence:

```typescript
      // If completing a recurring todo, create the next occurrence
      if (completed === true && existingTodo.recurrenceRule) {
        const nextDate = getNextOccurrence(
          existingTodo.recurrenceRule,
          existingTodo.dueDate || new Date(),
          existingTodo.recurrenceEnd
        );

        if (nextDate) {
          // Create new todo with same properties and next due date
          await prisma.todo.create({
            data: {
              title: existingTodo.title,
              description: existingTodo.description,
              priority: existingTodo.priority,
              categoryId: existingTodo.categoryId,
              userId: existingTodo.userId,
              dueDate: nextDate,
              recurrenceRule: existingTodo.recurrenceRule,
              recurrenceEnd: existingTodo.recurrenceEnd,
              completed: false,
            },
          });
        }
      }
```

**Step 3: Add recurrence fields to update handler**

After the categoryId handling (around line 95), add:

```typescript
    if (body.recurrenceRule !== undefined) {
      updateData.recurrenceRule = body.recurrenceRule;
    }

    if (body.recurrenceEnd !== undefined) {
      updateData.recurrenceEnd = body.recurrenceEnd ? new Date(body.recurrenceEnd) : null;
    }
```

**Step 4: Verify build compiles**

Run:
```bash
npm run build
```
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/app/api/todos/[id]/route.ts
git commit -m "feat: create next occurrence when completing recurring todo"
```

---

## Task 6: Update POST API to accept recurrence fields

**Files:**
- Modify: `src/app/api/todos/route.ts`

**Step 1: Add recurrence fields to POST handler**

In the POST function, extract recurrence fields from body (around line 188):

```typescript
    const { title, description, priority, dueDate, categoryId, parentId, recurrenceRule, recurrenceEnd } = body;
```

**Step 2: Add recurrence to todoData**

After the dueDate handling (around line 229), add:

```typescript
    if (recurrenceRule) {
      todoData.recurrenceRule = recurrenceRule;
    }

    if (recurrenceEnd) {
      todoData.recurrenceEnd = new Date(recurrenceEnd);
    }
```

**Step 3: Verify build compiles**

Run:
```bash
npm run build
```
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/app/api/todos/route.ts
git commit -m "feat: support recurrence fields in todo creation"
```

---

## Task 7: Create RecurrenceSelector component

**Files:**
- Create: `src/components/recurrence-selector.tsx`

**Step 1: Create the component**

Create `src/components/recurrence-selector.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Repeat } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { createRecurrenceRule, getRecurrenceDescription, parseRecurrenceRule } from '@/lib/recurrence';

interface RecurrenceSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

type PresetValue = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

export function RecurrenceSelector({ value, onChange, disabled }: RecurrenceSelectorProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customFrequency, setCustomFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [customInterval, setCustomInterval] = useState(1);
  const [customWeekdays, setCustomWeekdays] = useState<number[]>([1]); // Monday default
  const [customDayOfMonth, setCustomDayOfMonth] = useState(1);

  // Determine current preset from value
  const getPresetFromValue = (): PresetValue => {
    if (!value) return 'none';
    if (value === 'FREQ=DAILY') return 'daily';
    if (value === 'FREQ=WEEKLY') return 'weekly';
    if (value === 'FREQ=MONTHLY') return 'monthly';
    return 'custom';
  };

  const handlePresetChange = (preset: PresetValue) => {
    switch (preset) {
      case 'none':
        onChange(null);
        break;
      case 'daily':
        onChange('FREQ=DAILY');
        break;
      case 'weekly':
        onChange('FREQ=WEEKLY');
        break;
      case 'monthly':
        onChange('FREQ=MONTHLY');
        break;
      case 'custom':
        // Initialize custom dialog with current value if exists
        if (value) {
          const parsed = parseRecurrenceRule(value);
          if (parsed) {
            setCustomFrequency(parsed.frequency);
            setCustomInterval(parsed.interval);
            if (parsed.weekdays) setCustomWeekdays(parsed.weekdays);
            if (parsed.dayOfMonth) setCustomDayOfMonth(parsed.dayOfMonth);
          }
        }
        setIsCustomOpen(true);
        break;
    }
  };

  const handleCustomSave = () => {
    const rule = createRecurrenceRule({
      frequency: customFrequency,
      interval: customInterval > 1 ? customInterval : undefined,
      weekdays: customFrequency === 'weekly' ? customWeekdays : undefined,
      dayOfMonth: customFrequency === 'monthly' ? customDayOfMonth : undefined,
    });
    onChange(rule);
    setIsCustomOpen(false);
  };

  const toggleWeekday = (day: number) => {
    setCustomWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const currentPreset = getPresetFromValue();
  const displayValue = value ? getRecurrenceDescription(value) : 'Does not repeat';

  return (
    <>
      <Select
        value={currentPreset}
        onValueChange={(v) => handlePresetChange(v as PresetValue)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-muted-foreground" />
            <SelectValue>{displayValue}</SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Does not repeat</SelectItem>
          <SelectItem value="daily">Daily</SelectItem>
          <SelectItem value="weekly">Weekly</SelectItem>
          <SelectItem value="monthly">Monthly</SelectItem>
          <SelectItem value="custom">Custom...</SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Custom Recurrence</DialogTitle>
            <DialogDescription>
              Set up a custom repeating schedule.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Frequency */}
            <div className="grid gap-2">
              <Label>Repeat</Label>
              <Select
                value={customFrequency}
                onValueChange={(v) => setCustomFrequency(v as 'daily' | 'weekly' | 'monthly')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Interval */}
            <div className="grid gap-2">
              <Label>Every</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={customInterval}
                  onChange={(e) => setCustomInterval(parseInt(e.target.value) || 1)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">
                  {customFrequency === 'daily' && (customInterval === 1 ? 'day' : 'days')}
                  {customFrequency === 'weekly' && (customInterval === 1 ? 'week' : 'weeks')}
                  {customFrequency === 'monthly' && (customInterval === 1 ? 'month' : 'months')}
                </span>
              </div>
            </div>

            {/* Weekdays (for weekly) */}
            {customFrequency === 'weekly' && (
              <div className="grid gap-2">
                <Label>On days</Label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => (
                    <label
                      key={day.value}
                      className="flex items-center gap-1.5 cursor-pointer"
                    >
                      <Checkbox
                        checked={customWeekdays.includes(day.value)}
                        onCheckedChange={() => toggleWeekday(day.value)}
                      />
                      <span className="text-sm">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Day of month (for monthly) */}
            {customFrequency === 'monthly' && (
              <div className="grid gap-2">
                <Label>On day</Label>
                <Select
                  value={customDayOfMonth.toString()}
                  onValueChange={(v) => setCustomDayOfMonth(parseInt(v))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                    <SelectItem value="-1">Last day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCustomSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Step 2: Verify component compiles**

Run:
```bash
npx tsc --noEmit
```
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/recurrence-selector.tsx
git commit -m "feat: add RecurrenceSelector component with preset and custom options"
```

---

## Task 8: Add recurrence to EditTodoDialog

**Files:**
- Modify: `src/components/edit-todo-dialog.tsx`

**Step 1: Import RecurrenceSelector**

Add import at top:

```typescript
import { RecurrenceSelector } from './recurrence-selector';
```

**Step 2: Add recurrence state**

After `const [isCalendarOpen, setIsCalendarOpen] = useState(false);`, add:

```typescript
  const [recurrenceRule, setRecurrenceRule] = useState<string | null>(
    todo.recurrenceRule || null
  );
```

**Step 3: Update useEffect to reset recurrence**

In the useEffect, add after `setCategoryId`:

```typescript
      setRecurrenceRule(todo.recurrenceRule || null);
```

**Step 4: Update handleSubmit to include recurrence**

In handleSubmit, update the onSave call to include recurrenceRule:

```typescript
      await onSave(todo.id, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
        categoryId: categoryId === NO_CATEGORY ? undefined : categoryId,
        recurrenceRule: recurrenceRule,
      });
```

**Step 5: Add RecurrenceSelector to form**

After the Due Date section (after the closing `</div>` around line 235), add:

```typescript
            {/* Recurrence */}
            <div className="grid gap-2">
              <Label>Repeat</Label>
              <RecurrenceSelector
                value={recurrenceRule}
                onChange={setRecurrenceRule}
                disabled={isLoading}
              />
            </div>
```

**Step 6: Verify build compiles**

Run:
```bash
npm run build
```
Expected: Build succeeds

**Step 7: Commit**

```bash
git add src/components/edit-todo-dialog.tsx
git commit -m "feat: add recurrence selector to edit todo dialog"
```

---

## Task 9: Add recurrence to TodoForm (create)

**Files:**
- Modify: `src/components/todo-form.tsx`

**Step 1: Read current file structure**

Review `src/components/todo-form.tsx` to understand current implementation.

**Step 2: Import RecurrenceSelector**

Add import:

```typescript
import { RecurrenceSelector } from './recurrence-selector';
```

**Step 3: Add recurrence state**

Add state for recurrence:

```typescript
  const [recurrenceRule, setRecurrenceRule] = useState<string | null>(null);
```

**Step 4: Update handleSubmit**

Include recurrenceRule in the createTodo call:

```typescript
    await createTodo({
      title,
      priority,
      dueDate: dueDate?.toISOString(),
      categoryId: categoryId || undefined,
      recurrenceRule: recurrenceRule || undefined,
    });
```

**Step 5: Reset recurrence after submit**

After resetting other fields:

```typescript
    setRecurrenceRule(null);
```

**Step 6: Add RecurrenceSelector to expanded form**

Add the selector in the expanded options section.

**Step 7: Verify build compiles**

Run:
```bash
npm run build
```
Expected: Build succeeds

**Step 8: Commit**

```bash
git add src/components/todo-form.tsx
git commit -m "feat: add recurrence selector to todo create form"
```

---

## Task 10: Add recurrence icon to TodoItem

**Files:**
- Modify: `src/components/todo-item.tsx`

**Step 1: Import Repeat icon**

Update lucide-react import to include `Repeat`:

```typescript
import { Calendar, Pencil, Trash2, ChevronDown, ChevronUp, ChevronRight, FileText, Repeat } from 'lucide-react';
```

**Step 2: Import recurrence helper**

Add import:

```typescript
import { getRecurrenceDescription } from '@/lib/recurrence';
```

**Step 3: Add recurrence indicator**

After the due date section and before the description indicator, add:

```typescript
          {/* Recurrence indicator */}
          {todo.recurrenceRule && (
            <div
              className="flex items-center gap-1 text-xs text-muted-foreground"
              title={getRecurrenceDescription(todo.recurrenceRule)}
            >
              <Repeat className="h-3 w-3" />
              <span className="sr-only">{getRecurrenceDescription(todo.recurrenceRule)}</span>
            </div>
          )}
```

**Step 4: Verify build compiles**

Run:
```bash
npm run build
```
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/components/todo-item.tsx
git commit -m "feat: show recurrence icon on recurring todos"
```

---

## Task 11: Add Skip and Stop Repeating actions

**Files:**
- Modify: `src/components/todo-item.tsx`
- Modify: `src/hooks/use-todos.ts`

**Step 1: Add skipRecurrence and stopRecurrence to useTodos hook**

In `src/hooks/use-todos.ts`, add new functions:

```typescript
  const skipRecurrence = async (id: string) => {
    // Complete without creating next occurrence by first removing recurrence, then completing
    try {
      // Temporarily remove recurrence rule
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true, recurrenceRule: null }),
      });
      if (!response.ok) throw new Error('Failed to skip');
      await fetchTodos();
      toast.success('Occurrence skipped');
    } catch (error) {
      toast.error('Failed to skip occurrence');
      throw error;
    }
  };

  const stopRecurrence = async (id: string) => {
    try {
      await updateTodo(id, { recurrenceRule: null, recurrenceEnd: null });
      toast.success('Recurrence stopped');
    } catch (error) {
      toast.error('Failed to stop recurrence');
      throw error;
    }
  };
```

**Step 2: Update return type and return statement**

Add to interface and return:

```typescript
  skipRecurrence: (id: string) => Promise<void>;
  stopRecurrence: (id: string) => Promise<void>;
```

**Step 3: Update TodoItem props**

Add optional skip and stop props to TodoItemProps:

```typescript
  onSkipRecurrence?: (id: string) => Promise<void>;
  onStopRecurrence?: (id: string) => Promise<void>;
```

**Step 4: Add Skip and Stop buttons to TodoItem**

Import additional icons and add buttons for recurring todos in the action area.

**Step 5: Pass handlers from TodoList**

Update TodoList to pass the new handlers to TodoItem.

**Step 6: Verify build compiles**

Run:
```bash
npm run build
```
Expected: Build succeeds

**Step 7: Commit**

```bash
git add src/components/todo-item.tsx src/hooks/use-todos.ts src/components/todo-list.tsx
git commit -m "feat: add skip and stop recurrence actions"
```

---

## Task 12: Write E2E tests

**Files:**
- Create: `e2e/recurring-todos.spec.ts`

**Step 1: Create E2E test file**

Create `e2e/recurring-todos.spec.ts`:

```typescript
import { test, expect, uniqueTitle } from './fixtures';

test.describe('Recurring Todos', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto('/');
  });

  test('can create a daily recurring todo', async ({ page }) => {
    const title = uniqueTitle('Daily Task');

    // Open form and fill title
    await page.getByPlaceholder('Add a new todo...').fill(title);

    // Expand options
    await page.getByRole('button', { name: 'Options' }).click();

    // Select daily recurrence
    await page.getByRole('combobox', { name: /repeat/i }).click();
    await page.getByRole('option', { name: 'Daily' }).click();

    // Submit
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    // Verify todo created with recurrence icon
    await expect(page.getByText(title)).toBeVisible();
    const todoItem = page.locator('[data-testid="todo-item"]', { hasText: title });
    await expect(todoItem.locator('svg.lucide-repeat')).toBeVisible();
  });

  test('completing recurring todo creates next occurrence', async ({ page }) => {
    const title = uniqueTitle('Recurring Complete');

    // Create recurring todo with due date
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: 'Options' }).click();

    // Set due date to today
    await page.getByRole('button', { name: /due date/i }).click();
    await page.getByRole('button', { name: new Date().getDate().toString() }).click();

    // Set daily recurrence
    await page.getByRole('combobox', { name: /repeat/i }).click();
    await page.getByRole('option', { name: 'Daily' }).click();

    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(title)).toBeVisible();

    // Complete the todo
    const todoCheckbox = page.locator(`[aria-label*="Mark \\"${title}\\""]`);
    await todoCheckbox.click();

    // Wait for API and verify two todos with same title exist
    await page.waitForTimeout(1000);
    const todos = page.locator('h3', { hasText: title });
    await expect(todos).toHaveCount(2);
  });

  test('can set custom weekly recurrence', async ({ page }) => {
    const title = uniqueTitle('Weekly Custom');

    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: 'Options' }).click();

    // Open custom recurrence
    await page.getByRole('combobox', { name: /repeat/i }).click();
    await page.getByRole('option', { name: 'Custom...' }).click();

    // Set weekly on Mon, Wed, Fri
    await page.getByRole('combobox', { name: /repeat/i }).first().click();
    await page.getByRole('option', { name: 'Weekly' }).click();

    await page.getByLabel('Mon').click();
    await page.getByLabel('Wed').click();
    await page.getByLabel('Fri').click();

    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    // Verify recurrence description on hover
    await expect(page.getByText(title)).toBeVisible();
  });

  test('can stop recurrence on a todo', async ({ page }) => {
    const title = uniqueTitle('Stop Recurring');

    // Create recurring todo
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: 'Options' }).click();
    await page.getByRole('combobox', { name: /repeat/i }).click();
    await page.getByRole('option', { name: 'Daily' }).click();
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    await expect(page.getByText(title)).toBeVisible();

    // Find todo and click stop recurrence
    const todoCard = page.locator('[data-testid="todo-item"]', { hasText: title });
    await todoCard.hover();
    await todoCard.getByRole('button', { name: /stop/i }).click();

    // Verify recurrence icon is gone
    await expect(todoCard.locator('svg.lucide-repeat')).not.toBeVisible();
  });
});
```

**Step 2: Run E2E tests**

Run:
```bash
npx playwright test e2e/recurring-todos.spec.ts
```
Expected: Tests pass (may need adjustment based on actual UI)

**Step 3: Commit**

```bash
git add e2e/recurring-todos.spec.ts
git commit -m "test: add E2E tests for recurring todos"
```

---

## Task 13: Final integration testing

**Step 1: Run all tests**

Run:
```bash
npm test
npm run build
npx playwright test
```
Expected: All tests pass

**Step 2: Manual testing checklist**

- [ ] Create daily recurring todo - verify icon shows
- [ ] Complete recurring todo - verify new one appears with next date
- [ ] Edit todo to add recurrence - verify icon appears
- [ ] Edit todo to remove recurrence - verify icon disappears
- [ ] Custom recurrence (weekly Mon/Wed/Fri) - verify correct dates
- [ ] Stop recurrence - verify no new todo on completion
- [ ] Monthly recurrence on 31st - verify handles short months

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete recurring todos implementation (Issue #16)"
```
