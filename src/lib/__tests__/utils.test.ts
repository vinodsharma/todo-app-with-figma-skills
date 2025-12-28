import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn utility', () => {
  it('should merge simple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'active')).toBe('base active');
    expect(cn('base', false && 'active')).toBe('base');
  });

  it('should handle undefined and null values', () => {
    expect(cn('foo', undefined, 'bar', null)).toBe('foo bar');
  });

  it('should merge Tailwind classes correctly', () => {
    // tailwind-merge should override conflicting classes
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle object syntax', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500');
    expect(cn({ active: true, disabled: false })).toBe('active');
  });

  it('should handle array syntax', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
    expect(cn(['foo'], ['bar'])).toBe('foo bar');
  });

  it('should handle mixed inputs', () => {
    const result = cn(
      'base',
      true && 'active',
      false && 'inactive',
      { hover: true },
      ['array-class']
    );
    expect(result).toContain('base');
    expect(result).toContain('active');
    expect(result).not.toContain('inactive');
    expect(result).toContain('hover');
    expect(result).toContain('array-class');
  });

  it('should return empty string for no valid inputs', () => {
    expect(cn()).toBe('');
    expect(cn(undefined)).toBe('');
    expect(cn(null, undefined, false)).toBe('');
  });

  it('should handle complex Tailwind merging', () => {
    // bg-* should be merged
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');

    // Different property types should not merge
    expect(cn('bg-red-500', 'text-blue-500')).toBe('bg-red-500 text-blue-500');

    // Responsive variants
    expect(cn('sm:px-2', 'sm:px-4')).toBe('sm:px-4');

    // States
    expect(cn('hover:bg-red-500', 'hover:bg-blue-500')).toBe('hover:bg-blue-500');
  });

  it('should preserve non-conflicting classes', () => {
    const result = cn('flex', 'items-center', 'justify-between', 'p-4', 'bg-white');
    expect(result).toBe('flex items-center justify-between p-4 bg-white');
  });
});
