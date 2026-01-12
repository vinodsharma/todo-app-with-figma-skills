import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Trash2, FolderInput } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { id: '1', title: 'Review quarterly report', priority: 'HIGH', selected: true },
  { id: '2', title: 'Prepare presentation', priority: 'MEDIUM', selected: true },
  { id: '3', title: 'Update documentation', priority: 'LOW', selected: false },
];

const priorityStyles: Record<string, string> = {
  HIGH: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  MEDIUM: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  LOW: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
};

export function BulkActionsShowcase() {
  const selectedCount = items.filter((i) => i.selected).length;

  return (
    <div className="p-3 space-y-2 h-full flex flex-col">
      {/* Todo items */}
      <div className="space-y-1.5 flex-1">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'flex items-center gap-2 rounded-md border p-2 text-xs',
              item.selected && 'ring-1 ring-primary bg-primary/5'
            )}
          >
            <Checkbox checked={item.selected} className="h-3.5 w-3.5" />
            <span className="flex-1 truncate">{item.title}</span>
            <Badge className={cn('text-[9px] px-1 py-0', priorityStyles[item.priority])}>
              {item.priority.charAt(0) + item.priority.slice(1).toLowerCase()}
            </Badge>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 p-2 rounded-lg bg-primary text-primary-foreground">
        <span className="text-[10px] font-medium">{selectedCount} selected</span>
        <div className="flex-1" />
        <Button size="sm" variant="secondary" className="h-6 px-2 text-[10px]">
          <CheckCircle className="h-3 w-3 mr-1" />
          Complete
        </Button>
        <Button size="sm" variant="secondary" className="h-6 px-2 text-[10px]">
          <FolderInput className="h-3 w-3 mr-1" />
          Move
        </Button>
        <Button size="sm" variant="secondary" className="h-6 px-2 text-[10px] text-red-600">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
