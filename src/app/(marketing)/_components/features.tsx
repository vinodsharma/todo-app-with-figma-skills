import {
  FolderKanban,
  Calendar,
  CheckSquare,
  History,
} from 'lucide-react';
import {
  CalendarShowcase,
  CategoriesShowcase,
  BulkActionsShowcase,
  ActivityShowcase,
} from './showcases';

export function Features() {
  return (
    <section id="features" className="py-24 md:py-32">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            Everything you need
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Powerful features that help you manage tasks without getting in your way.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
          {/* Calendar View - Large Card */}
          <div className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-1 md:col-span-2 md:row-span-2">
            {/* Icon and Title */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Calendar View</h3>
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-sm mb-4">
              Visualize your schedule with month and week views. Click any date to add tasks instantly.
            </p>

            {/* Interactive Showcase */}
            <div className="rounded-xl border bg-background/50 shadow-lg overflow-hidden">
              <CalendarShowcase />
            </div>
          </div>

          {/* Categories - Small Card */}
          <div className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-1">
            {/* Icon and Title */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <FolderKanban className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Categories</h3>
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-sm mb-4">
              Color-coded organization with drag and drop reordering.
            </p>

            {/* Interactive Showcase */}
            <div className="rounded-xl border bg-background/50 shadow-lg overflow-hidden">
              <CategoriesShowcase />
            </div>
          </div>

          {/* Bulk Actions - Small Card */}
          <div className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-1">
            {/* Icon and Title */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <CheckSquare className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Bulk Actions</h3>
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-sm mb-4">
              Select multiple todos and act on them in one click.
            </p>

            {/* Interactive Showcase */}
            <div className="rounded-xl border bg-background/50 shadow-lg overflow-hidden">
              <BulkActionsShowcase />
            </div>
          </div>

          {/* Activity History - Medium Card */}
          <div className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-1 md:col-span-2">
            {/* Icon and Title */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <History className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Activity History</h3>
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-sm mb-4">
              Full audit trail of every change you make.
            </p>

            {/* Interactive Showcase */}
            <div className="rounded-xl border bg-background/50 shadow-lg overflow-hidden">
              <ActivityShowcase />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
