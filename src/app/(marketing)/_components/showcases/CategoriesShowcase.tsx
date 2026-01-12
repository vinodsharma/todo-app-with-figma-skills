import { List } from 'lucide-react';
import { Button } from '@/components/ui/button';

const categories = [
  { name: 'All Todos', count: 12, color: null, active: true },
  { name: 'Work', count: 5, color: '#3B82F6' },
  { name: 'Personal', count: 4, color: '#10B981' },
  { name: 'Health', count: 3, color: '#F59E0B' },
];

export function CategoriesShowcase() {
  return (
    <div className="p-4 space-y-2 bg-muted/30 rounded-lg h-full">
      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Categories
      </div>
      <div className="space-y-1">
        {categories.map((category) => (
          <Button
            key={category.name}
            variant={category.active ? 'secondary' : 'ghost'}
            size="sm"
            className="w-full justify-start gap-2 h-8 text-xs"
          >
            {category.color ? (
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: category.color }}
              />
            ) : (
              <List className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="truncate">{category.name}</span>
            <span className="ml-auto text-[10px] text-muted-foreground">
              {category.count}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
