"use client"

import { useState } from "react"
import { List, Trash2 } from "lucide-react"
import { Category } from "@/types"
import { Button } from "@/components/ui/button"
import { AddCategoryDialog } from "@/components/add-category-dialog"
import { cn } from "@/lib/utils"

interface CategorySidebarProps {
  categories: Category[]
  selectedCategoryId: string | null
  onSelectCategory: (categoryId: string | null) => void
  onAddCategory: (name: string, color: string) => Promise<void>
  onDeleteCategory: (categoryId: string) => Promise<void>
}

export function CategorySidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onDeleteCategory,
}: CategorySidebarProps) {
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(
    null
  )
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(
    null
  )

  const handleDeleteCategory = async (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingCategoryId(categoryId)
    try {
      await onDeleteCategory(categoryId)
    } catch (error) {
      console.error("Failed to delete category:", error)
    } finally {
      setDeletingCategoryId(null)
    }
  }

  const totalTodos = categories.reduce(
    (sum, category) => sum + (category._count?.todos ?? 0),
    0
  )

  return (
    <div className="flex h-full flex-col gap-2 border-r bg-muted/30 p-4">
      <div className="mb-2">
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Categories
        </h2>
      </div>

      {/* All Todos Button */}
      <Button
        variant={selectedCategoryId === null ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start gap-2",
          selectedCategoryId === null && "bg-secondary"
        )}
        onClick={() => onSelectCategory(null)}
      >
        <List className="size-4" />
        <span className="flex-1 text-left">All Todos</span>
        <span className="text-xs text-muted-foreground">{totalTodos}</span>
      </Button>

      {/* Category List */}
      <div className="flex-1 space-y-1 overflow-y-auto">
        {categories.map((category) => (
          <div
            key={category.id}
            className="relative"
            onMouseEnter={() => setHoveredCategoryId(category.id)}
            onMouseLeave={() => setHoveredCategoryId(null)}
          >
            <Button
              variant={
                selectedCategoryId === category.id ? "secondary" : "ghost"
              }
              className={cn(
                "w-full justify-start gap-2 pr-8",
                selectedCategoryId === category.id && "bg-secondary"
              )}
              onClick={() => onSelectCategory(category.id)}
            >
              <div
                className="size-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="flex-1 truncate text-left">
                {category.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {category._count?.todos ?? 0}
              </span>
            </Button>

            {/* Delete Button */}
            {hoveredCategoryId === category.id && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
                onClick={(e) => handleDeleteCategory(category.id, e)}
                disabled={deletingCategoryId === category.id}
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Delete {category.name}</span>
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add Category Dialog */}
      <div className="mt-auto pt-2 border-t">
        <AddCategoryDialog onAdd={onAddCategory} />
      </div>
    </div>
  )
}
