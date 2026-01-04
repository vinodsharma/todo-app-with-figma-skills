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
