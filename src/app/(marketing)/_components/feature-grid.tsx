import {
  ListTodo,
  FolderKanban,
  Calendar,
  Search,
  Keyboard,
  Palette,
  Check
} from 'lucide-react';

const featureCategories = [
  {
    title: 'Task Management',
    icon: ListTodo,
    features: [
      'Create, edit, delete todos',
      'Subtasks support',
      'Three priority levels',
      'Rich descriptions',
      'Bulk operations',
    ],
  },
  {
    title: 'Organization',
    icon: FolderKanban,
    features: [
      'Color-coded categories',
      'Drag & drop reorder',
      'Archive & restore',
      'Smart filters',
      'Todo counts per category',
    ],
  },
  {
    title: 'Scheduling',
    icon: Calendar,
    features: [
      'Due dates with calendar picker',
      'Recurring tasks',
      'Calendar view (month/week)',
      'Overdue alerts',
      'Quick reschedule',
    ],
  },
  {
    title: 'Search & Filter',
    icon: Search,
    features: [
      'Full-text search',
      'Filter by priority',
      'Filter by status',
      'Filter by due date',
      'Multi-column sorting',
    ],
  },
  {
    title: 'Power User',
    icon: Keyboard,
    features: [
      'Keyboard shortcuts',
      'Quick actions on hover',
      'Range selection (Shift+click)',
      'Activity history log',
      'Undo support',
    ],
  },
  {
    title: 'Appearance',
    icon: Palette,
    features: [
      'Dark mode',
      'Light mode',
      'System theme detection',
      'Fully responsive',
      'Mobile-friendly',
    ],
  },
];

export function FeatureGrid() {
  return (
    <section className="bg-muted/30 py-24 md:py-32">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            Packed with features
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Everything you need to manage your tasks effectively
          </p>
        </div>

        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {featureCategories.map((category) => (
            <div
              key={category.title}
              className="group rounded-2xl border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-1"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <category.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{category.title}</h3>
              </div>
              <ul className="space-y-2.5">
                {category.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
