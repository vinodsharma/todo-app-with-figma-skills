import Link from 'next/link';
import { UserPlus, PenLine, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  {
    step: 1,
    title: 'Sign Up',
    description: 'Create your free account in seconds',
    icon: UserPlus,
  },
  {
    step: 2,
    title: 'Create Tasks',
    description: 'Add todos with priorities and due dates',
    icon: PenLine,
  },
  {
    step: 3,
    title: 'Get Done',
    description: 'Check off tasks and stay organized',
    icon: CheckCircle,
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            Get started in minutes
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Three simple steps to better productivity
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.step} className="relative text-center group">
                <div className="flex flex-col items-center gap-4">
                  {/* Icon container */}
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/5 border-2 border-primary/20 transition-all duration-300 group-hover:bg-primary/10 group-hover:border-primary/30 group-hover:scale-105">
                      <step.icon className="h-8 w-8 text-primary" />
                    </div>
                    {/* Step number */}
                    <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg">
                      {step.step}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm max-w-[200px] mx-auto">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <Link href="/register">
            <Button size="lg" className="h-12 px-8 gap-2">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
