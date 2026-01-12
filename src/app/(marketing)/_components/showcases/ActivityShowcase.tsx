import { CheckCircle2, PlusCircle, Pencil, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

const activities = [
  {
    id: '1',
    action: 'completed',
    title: 'Morning workout',
    time: '2 min ago',
    icon: CheckCircle2,
    iconClass: 'text-green-500',
  },
  {
    id: '2',
    action: 'created',
    title: 'Review quarterly report',
    time: '15 min ago',
    icon: PlusCircle,
    iconClass: 'text-blue-500',
  },
  {
    id: '3',
    action: 'updated',
    title: 'Prepare presentation',
    time: '1 hour ago',
    icon: Pencil,
    iconClass: 'text-yellow-500',
  },
  {
    id: '4',
    action: 'archived',
    title: 'Old project files',
    time: '3 hours ago',
    icon: Archive,
    iconClass: 'text-muted-foreground',
  },
];

export function ActivityShowcase() {
  return (
    <div className="p-3 space-y-1 h-full">
      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Activity
      </div>
      <div className="space-y-2">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-2 text-xs">
            <activity.icon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', activity.iconClass)} />
            <div className="flex-1 min-w-0">
              <span className="text-muted-foreground capitalize">{activity.action}</span>{' '}
              <span className="font-medium truncate">{activity.title}</span>
              <div className="text-[10px] text-muted-foreground">{activity.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
