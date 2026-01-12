import { Quote } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const testimonials = [
  {
    quote: "Finally, a todo app that doesn't try to do too much. Clean, fast, and just works.",
    name: 'Sarah M.',
    role: 'Designer',
    initials: 'SM',
  },
  {
    quote: 'The recurring tasks feature is a game changer. I never forget weekly reviews anymore.',
    name: 'James K.',
    role: 'Product Manager',
    initials: 'JK',
  },
  {
    quote: 'Dark mode and keyboard shortcuts make this my daily driver. So fast!',
    name: 'Alex R.',
    role: 'Developer',
    initials: 'AR',
  },
];

export function Testimonials() {
  return (
    <section className="bg-muted/30 py-24 md:py-32">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            Loved by productive people
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            See what our users have to say
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="group relative rounded-2xl border bg-card p-8 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-1"
            >
              {/* Quote icon */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-6 transition-colors group-hover:bg-primary/15">
                <Quote className="h-5 w-5 text-primary" />
              </div>

              {/* Quote text - larger */}
              <blockquote className="flex-1 mb-8">
                <p className="text-xl leading-relaxed font-medium">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4 pt-6 border-t">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {testimonial.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
