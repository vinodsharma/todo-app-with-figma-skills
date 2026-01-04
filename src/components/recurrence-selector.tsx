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
