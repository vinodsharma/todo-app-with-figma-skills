'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { Category, CreateCategoryInput } from '@/types';

interface UseCategoriesReturn {
  categories: Category[];
  isLoading: boolean;
  createCategory: (input: CreateCategoryInput) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/categories');

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(data);
    } catch (error) {
      toast.error('Failed to load categories');
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (input: CreateCategoryInput) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      await fetchCategories();
      toast.success('Category created successfully');
    } catch (error) {
      toast.error('Failed to create category');
      console.error('Error creating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      await fetchCategories();
      toast.success('Category deleted successfully');
    } catch (error) {
      toast.error('Failed to delete category');
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  return {
    categories,
    isLoading,
    createCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
