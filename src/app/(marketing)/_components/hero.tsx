import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { BrowserChrome, InteractiveDemo } from './demo';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-grid opacity-40" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />

      <div className="container relative py-20 md:py-28 lg:py-36">
        {/* Centered text content */}
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border bg-background/80 backdrop-blur px-4 py-2 text-sm">
            <Sparkles className="h-4 w-4" />
            <span>Simple, powerful task management</span>
          </div>

          {/* Headline */}
          <h1 className="text-gradient text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            Get things done.
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl md:text-2xl leading-relaxed">
            The todo app that gets out of your way. Organize tasks with categories,
            priorities, due dates, and recurring schedules.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 text-base gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                See Features
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <p className="mt-8 text-sm text-muted-foreground">
            Free forever • No credit card required
          </p>
        </div>

        {/* Interactive Demo */}
        <div className="mt-16 md:mt-20">
          <BrowserChrome>
            <InteractiveDemo />
          </BrowserChrome>
        </div>
      </div>
    </section>
  );
}
