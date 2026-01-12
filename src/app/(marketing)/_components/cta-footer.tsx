import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CTAFooter() {
  return (
    <section className="bg-primary py-24">
      <div className="container text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-primary-foreground">
          Ready to Get Organized?
        </h2>
        <p className="text-primary-foreground/80 text-lg mb-8 max-w-[600px] mx-auto">
          Start managing your tasks today. It's free.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              Get Started Free
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
