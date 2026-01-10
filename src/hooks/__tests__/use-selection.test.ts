// src/hooks/__tests__/use-selection.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useSelection } from '../use-selection';

describe('useSelection', () => {
  it('should start with selection mode disabled', () => {
    const { result } = renderHook(() => useSelection());

    expect(result.current.isSelectionMode).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.selectedCount).toBe(0);
  });

  it('should enter selection mode', () => {
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.enterSelectionMode();
    });

    expect(result.current.isSelectionMode).toBe(true);
  });

  it('should exit selection mode and clear selection', () => {
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.enterSelectionMode();
      result.current.toggleSelection('todo-1');
      result.current.exitSelectionMode();
    });

    expect(result.current.isSelectionMode).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('should toggle single item selection', () => {
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.enterSelectionMode();
      result.current.toggleSelection('todo-1');
    });

    expect(result.current.selectedIds.has('todo-1')).toBe(true);
    expect(result.current.selectedCount).toBe(1);

    act(() => {
      result.current.toggleSelection('todo-1');
    });

    expect(result.current.selectedIds.has('todo-1')).toBe(false);
    expect(result.current.selectedCount).toBe(0);
  });

  it('should set anchor on normal click', () => {
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.enterSelectionMode();
      result.current.toggleSelection('todo-1');
    });

    expect(result.current.anchorId).toBe('todo-1');
  });

  it('should not change anchor on ctrl+click', () => {
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.enterSelectionMode();
      result.current.toggleSelection('todo-1');
      result.current.toggleSelection('todo-2', false, true); // ctrl+click
    });

    expect(result.current.anchorId).toBe('todo-1');
    expect(result.current.selectedIds.has('todo-2')).toBe(true);
  });

  it('should select all items', () => {
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.enterSelectionMode();
      result.current.selectAll(['todo-1', 'todo-2', 'todo-3']);
    });

    expect(result.current.selectedCount).toBe(3);
  });

  it('should deselect all items', () => {
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.enterSelectionMode();
      result.current.selectAll(['todo-1', 'todo-2']);
      result.current.deselectAll();
    });

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isSelectionMode).toBe(true); // stays in selection mode
  });

  it('should select range on shift+click', () => {
    const allIds = ['todo-1', 'todo-2', 'todo-3', 'todo-4', 'todo-5'];
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.enterSelectionMode();
      result.current.toggleSelection('todo-2'); // anchor
    });

    act(() => {
      result.current.selectRange('todo-4', allIds); // shift+click
    });

    expect(result.current.selectedIds.has('todo-2')).toBe(true);
    expect(result.current.selectedIds.has('todo-3')).toBe(true);
    expect(result.current.selectedIds.has('todo-4')).toBe(true);
    expect(result.current.selectedIds.has('todo-1')).toBe(false);
    expect(result.current.selectedIds.has('todo-5')).toBe(false);
  });
});
