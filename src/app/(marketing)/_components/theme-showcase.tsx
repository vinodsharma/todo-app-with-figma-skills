import Image from 'next/image';
import { Check, Sun, Moon } from 'lucide-react';

const benefits = [
  'Follows system preference automatically',
  'Easy manual toggle anytime',
  'Preference saved to your account',
];

export function ThemeShowcase() {
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            Works the way you do
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Beautiful in any lighting condition
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 max-w-5xl mx-auto">
          {/* Light Mode */}
          <div className="group">
            <div className="screenshot-glow relative rounded-2xl border bg-card p-3 shadow-xl transition-all duration-300 group-hover:-translate-y-1">
              {/* Label */}
              <div className="absolute top-5 left-5 z-10 flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-sm font-medium border shadow-sm">
                <Sun className="h-4 w-4 text-amber-500" />
                Light Mode
              </div>
              <Image
                src="/images/screenshots/app-light.png"
                alt="Light Mode Interface"
                width={1200}
                height={750}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Dark Mode */}
          <div className="group">
            <div className="screenshot-glow relative rounded-2xl border bg-card p-3 shadow-xl transition-all duration-300 group-hover:-translate-y-1">
              {/* Label */}
              <div className="absolute top-5 left-5 z-10 flex items-center gap-2 bg-zinc-900/90 text-white backdrop-blur px-3 py-1.5 rounded-full text-sm font-medium border border-zinc-700 shadow-sm">
                <Moon className="h-4 w-4 text-blue-400" />
                Dark Mode
              </div>
              <Image
                src="/images/screenshots/app-dark.png"
                alt="Dark Mode Interface"
                width={1200}
                height={750}
                className="rounded-xl"
              />
            </div>
          </div>
        </div>

        <ul className="flex flex-wrap justify-center gap-x-8 gap-y-4 mt-12">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-3 w-3 text-primary" />
              </div>
              <span className="text-muted-foreground">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
