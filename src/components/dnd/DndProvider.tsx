'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragCancelEvent,
  UniqueIdentifier,
  Announcements,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

export type DragItemType = 'todo' | 'category';

export interface DragItem {
  id: UniqueIdentifier;
  type: DragItemType;
  title: string;
  categoryId?: string | null;
}

interface DndContextValue {
  activeItem: DragItem | null;
  isDragging: boolean;
}

const DndStateContext = createContext<DndContextValue>({
  activeItem: null,
  isDragging: false,
});

export function useDndState() {
  return useContext(DndStateContext);
}

interface DndProviderProps {
  children: ReactNode;
  onTodoReorder?: (todoId: string, newIndex: number, newCategoryId?: string) => Promise<void>;
  onCategoryReorder?: (categoryId: string, newIndex: number) => Promise<void>;
}

export function DndProvider({
  children,
  onTodoReorder,
  onCategoryReorder,
}: DndProviderProps) {
  const [activeItem, setActiveItem] = useState<DragItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current as DragItem | undefined;

    if (data) {
      setActiveItem({
        id: active.id,
        type: data.type,
        title: data.title,
        categoryId: data.categoryId,
      });
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over || active.id === over.id) {
      return;
    }

    const activeData = active.data.current as DragItem | undefined;
    const overData = over.data.current as { sortable?: { index: number }; type?: DragItemType; categoryId?: string } | undefined;

    if (!activeData || !overData?.sortable) {
      return;
    }

    const newIndex = overData.sortable.index;

    if (activeData.type === 'todo' && onTodoReorder) {
      const newCategoryId = overData.categoryId !== activeData.categoryId
        ? overData.categoryId
        : undefined;
      await onTodoReorder(active.id as string, newIndex, newCategoryId);
    } else if (activeData.type === 'category' && onCategoryReorder) {
      await onCategoryReorder(active.id as string, newIndex);
    }
  }, [onTodoReorder, onCategoryReorder]);

  const handleDragCancel = useCallback(() => {
    setActiveItem(null);
  }, []);

  const announcements: Announcements = {
    onDragStart: ({ active }) => {
      const data = active.data.current as DragItem | undefined;
      return `Picked up ${data?.title || 'item'}`;
    },
    onDragOver: ({ over }) => {
      if (over) {
        const data = over.data.current as { title?: string } | undefined;
        return `Over ${data?.title || 'drop zone'}`;
      }
      return 'Not over a droppable area';
    },
    onDragEnd: ({ active, over }) => {
      const data = active.data.current as DragItem | undefined;
      if (over) {
        return `Dropped ${data?.title || 'item'}`;
      }
      return `${data?.title || 'Item'} was dropped in its original position`;
    },
    onDragCancel: () => 'Drag cancelled',
  };

  const contextValue: DndContextValue = {
    activeItem,
    isDragging: activeItem !== null,
  };

  return (
    <DndStateContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        accessibility={{ announcements }}
      >
        {children}
        <DragOverlay dropAnimation={null}>
          {activeItem && (
            <div className="rounded-lg border bg-card p-3 shadow-lg opacity-90">
              <span className="font-medium">{activeItem.title}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </DndStateContext.Provider>
  );
}
