'use client';

import { useState, useEffect, useCallback } from 'react';

export type ViewMode = 'list' | 'calendar';
export type CalendarViewType = 'month' | 'week';

interface ViewPreference {
  viewMode: ViewMode;
  calendarView: CalendarViewType;
}

const STORAGE_KEY = 'todo-view-preference';
const DEFAULT_VIEW_MODE: ViewMode = 'list';
const DEFAULT_CALENDAR_VIEW: CalendarViewType = 'month';

export function useViewPreference() {
  const [viewMode, setViewModeState] = useState<ViewMode>(DEFAULT_VIEW_MODE);
  const [calendarView, setCalendarViewState] = useState<CalendarViewType>(DEFAULT_CALENDAR_VIEW);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ViewPreference;
        // Validate the stored options
        if (parsed.viewMode === 'list' || parsed.viewMode === 'calendar') {
          setViewModeState(parsed.viewMode);
        }
        if (parsed.calendarView === 'month' || parsed.calendarView === 'week') {
          setCalendarViewState(parsed.calendarView);
        }
      }
    } catch {
      // Ignore invalid stored data
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage helper
  const saveToStorage = useCallback((viewMode: ViewMode, calendarView: CalendarViewType) => {
    try {
      const preference: ViewPreference = { viewMode, calendarView };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Update view mode and persist
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    setCalendarViewState((currentCalendarView) => {
      saveToStorage(mode, currentCalendarView);
      return currentCalendarView;
    });
  }, [saveToStorage]);

  // Update calendar view and persist
  const setCalendarView = useCallback((view: CalendarViewType) => {
    setCalendarViewState(view);
    setViewModeState((currentViewMode) => {
      saveToStorage(currentViewMode, view);
      return currentViewMode;
    });
  }, [saveToStorage]);

  return {
    viewMode,
    calendarView,
    setViewMode,
    setCalendarView,
    isLoaded,
  };
}
