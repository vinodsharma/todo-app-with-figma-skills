import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCategories } from '../use-categories';
import { mockCategories } from '@/test/mocks/handlers';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch categories on mount', async () => {
    const { result } = renderHook(() => useCategories());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).toHaveLength(mockCategories.length);
  });

  it('should set loading to false after fetch completes', async () => {
    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should return categories with correct structure', async () => {
    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const category = result.current.categories[0];
    expect(category).toHaveProperty('id');
    expect(category).toHaveProperty('name');
    expect(category).toHaveProperty('color');
    expect(category).toHaveProperty('_count');
  });

  it('should create a new category', async () => {
    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createCategory({ name: 'New Category', color: '#ff0000' });
    });

    // Verify no error was thrown
    expect(result.current.categories).toBeDefined();
  });

  it('should create a category with default color', async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/categories', async ({ request }) => {
        capturedBody = await request.json() as Record<string, unknown>;
        return HttpResponse.json({
          id: 'new-cat',
          name: capturedBody.name,
          color: capturedBody.color || '#6b7280',
          userId: 'user-1',
          createdAt: new Date(),
          _count: { todos: 0 },
        }, { status: 201 });
      })
    );

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createCategory({ name: 'No Color Category' });
    });

    expect(capturedBody).toBeDefined();
    expect(capturedBody!.name).toBe('No Color Category');
  });

  it('should delete a category', async () => {
    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteCategory('cat-1');
    });

    // Verify no error was thrown
    expect(result.current.categories).toBeDefined();
  });

  it('should refetch categories', async () => {
    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.categories).toHaveLength(mockCategories.length);
  });

  it('should handle fetch error gracefully', async () => {
    server.use(
      http.get('/api/categories', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 });
      })
    );

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should not throw, categories should be empty
    expect(result.current.categories).toEqual([]);
  });

  it('should handle create error', async () => {
    server.use(
      http.post('/api/categories', () => {
        return HttpResponse.json({ error: 'Duplicate name' }, { status: 400 });
      })
    );

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.createCategory({ name: 'Duplicate' });
      })
    ).rejects.toThrow();
  });

  it('should handle delete error', async () => {
    server.use(
      http.delete('/api/categories/:id', () => {
        return HttpResponse.json({ error: 'Not found' }, { status: 404 });
      })
    );

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.deleteCategory('non-existent');
      })
    ).rejects.toThrow();
  });

  it('should include todo counts in categories', async () => {
    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const category = result.current.categories.find(c => c.id === 'cat-1');
    expect(category?._count?.todos).toBeDefined();
    expect(typeof category?._count?.todos).toBe('number');
  });
});
