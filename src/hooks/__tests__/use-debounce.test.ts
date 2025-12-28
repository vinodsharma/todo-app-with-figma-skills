import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebounce } from '../use-debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated' });

    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast forward time
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Now value should be updated
    expect(result.current).toBe('updated');
  });

  it('should reset timer when value changes before delay completes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    // First update
    rerender({ value: 'first' });
    await act(async () => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe('initial');

    // Second update before delay completes
    rerender({ value: 'second' });
    await act(async () => {
      vi.advanceTimersByTime(150);
    });
    // Still initial because timer was reset
    expect(result.current).toBe('initial');

    // Complete the delay from second update
    await act(async () => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe('second');
  });

  it('should use default delay of 300ms', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    await act(async () => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe('initial');

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('should work with different delay values', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current).toBe('initial');

    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('updated');
  });

  it('should work with different types', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 42 } }
    );

    expect(result.current).toBe(42);

    rerender({ value: 100 });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe(100);
  });
});
