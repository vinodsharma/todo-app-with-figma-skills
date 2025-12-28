import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSortPreference } from '../use-sort-preference';
import { DEFAULT_SORT, SortOption } from '@/types';

describe('useSortPreference', () => {
  const STORAGE_KEY = 'todo-sort-preference';
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    mockLocalStorage = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key: string) => mockLocalStorage[key] || null
    );
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
      (key: string, value: string) => {
        mockLocalStorage[key] = value;
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return default sort option initially', () => {
    const { result } = renderHook(() => useSortPreference());

    expect(result.current.sortOption).toEqual(DEFAULT_SORT);
  });

  it('should set isLoaded to true after mount', () => {
    const { result } = renderHook(() => useSortPreference());

    expect(result.current.isLoaded).toBe(true);
  });

  it('should load sort preference from localStorage', () => {
    const storedOption: SortOption = { field: 'title', direction: 'asc' };
    mockLocalStorage[STORAGE_KEY] = JSON.stringify(storedOption);

    const { result } = renderHook(() => useSortPreference());

    expect(result.current.sortOption).toEqual(storedOption);
  });

  it('should save sort preference to localStorage when updated', () => {
    const { result } = renderHook(() => useSortPreference());

    const newOption: SortOption = { field: 'priority', direction: 'desc' };
    act(() => {
      result.current.setSortOption(newOption);
    });

    expect(result.current.sortOption).toEqual(newOption);
    expect(mockLocalStorage[STORAGE_KEY]).toBe(JSON.stringify(newOption));
  });

  it('should ignore invalid stored data and use default', () => {
    mockLocalStorage[STORAGE_KEY] = 'invalid json';

    const { result } = renderHook(() => useSortPreference());

    expect(result.current.sortOption).toEqual(DEFAULT_SORT);
  });

  it('should ignore stored data with missing fields', () => {
    mockLocalStorage[STORAGE_KEY] = JSON.stringify({ field: 'title' }); // missing direction

    const { result } = renderHook(() => useSortPreference());

    expect(result.current.sortOption).toEqual(DEFAULT_SORT);
  });

  it('should handle localStorage errors gracefully on read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => useSortPreference());

    expect(result.current.sortOption).toEqual(DEFAULT_SORT);
    expect(result.current.isLoaded).toBe(true);
  });

  it('should handle localStorage errors gracefully on write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => useSortPreference());

    const newOption: SortOption = { field: 'dueDate', direction: 'asc' };

    // Should not throw
    act(() => {
      result.current.setSortOption(newOption);
    });

    // State should still update even if localStorage fails
    expect(result.current.sortOption).toEqual(newOption);
  });

  it('should support all sort field options', () => {
    const { result } = renderHook(() => useSortPreference());

    const fields: SortOption['field'][] = ['priority', 'dueDate', 'createdAt', 'title'];

    for (const field of fields) {
      act(() => {
        result.current.setSortOption({ field, direction: 'asc' });
      });
      expect(result.current.sortOption.field).toBe(field);
    }
  });

  it('should support both sort directions', () => {
    const { result } = renderHook(() => useSortPreference());

    act(() => {
      result.current.setSortOption({ field: 'title', direction: 'asc' });
    });
    expect(result.current.sortOption.direction).toBe('asc');

    act(() => {
      result.current.setSortOption({ field: 'title', direction: 'desc' });
    });
    expect(result.current.sortOption.direction).toBe('desc');
  });
});
