'use client';

import { useState, useCallback, useMemo } from 'react';

interface UseSelectionReturn {
  isSelectionMode: boolean;
  selectedIds: Set<string>;
  selectedCount: number;
  anchorId: string | null;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  toggleSelection: (id: string, isShiftKey?: boolean, isCtrlKey?: boolean) => void;
  selectRange: (toId: string, allIds: string[]) => void;
  selectAll: (ids: string[]) => void;
  deselectAll: () => void;
}

export function useSelection(): UseSelectionReturn {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [anchorId, setAnchorId] = useState<string | null>(null);

  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);

  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    setAnchorId(null);
  }, []);

  const toggleSelection = useCallback((id: string, isShiftKey = false, isCtrlKey = false) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    // Set anchor on normal click, keep it on ctrl+click
    if (!isCtrlKey) {
      setAnchorId(id);
    }
  }, []);

  const selectRange = useCallback((toId: string, allIds: string[]) => {
    if (!anchorId) {
      // No anchor, just select the target
      setSelectedIds(new Set([toId]));
      setAnchorId(toId);
      return;
    }

    const anchorIndex = allIds.indexOf(anchorId);
    const toIndex = allIds.indexOf(toId);

    if (anchorIndex === -1 || toIndex === -1) return;

    const start = Math.min(anchorIndex, toIndex);
    const end = Math.max(anchorIndex, toIndex);

    const rangeIds = allIds.slice(start, end + 1);
    setSelectedIds(new Set(rangeIds));
  }, [anchorId]);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    isSelectionMode,
    selectedIds,
    selectedCount,
    anchorId,
    enterSelectionMode,
    exitSelectionMode,
    toggleSelection,
    selectRange,
    selectAll,
    deselectAll,
  };
}
