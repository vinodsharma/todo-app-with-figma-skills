'use client';

import { useState, useEffect, useCallback } from 'react';
import { SortOption, DEFAULT_SORT } from '@/types';

const STORAGE_KEY = 'todo-sort-preference';

export function useSortPreference() {
  const [sortOption, setSortOption] = useState<SortOption>(DEFAULT_SORT);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SortOption;
        // Validate the stored option
        if (parsed.field && parsed.direction) {
          setSortOption(parsed);
        }
      }
    } catch {
      // Ignore invalid stored data
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when sort option changes
  const updateSortOption = useCallback((option: SortOption) => {
    setSortOption(option);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(option));
    } catch {
      // Ignore storage errors
    }
  }, []);

  return {
    sortOption,
    setSortOption: updateSortOption,
    isLoaded,
  };
}
