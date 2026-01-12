# Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a modern, professional landing page that showcases app features and converts visitors to sign-ups.

**Architecture:** Create a `(marketing)` route group for the public landing page, move the current app to `(dashboard)` route group, and update middleware to allow public access to `/`. The landing page uses existing shadcn/ui components with new section-specific components.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS, shadcn/ui, Lucide icons

---

## Task 1: Setup Route Groups and Move Dashboard

**Files:**
- Create: `src/app/(dashboard)/page.tsx`
- Create: `src/app/(dashboard)/layout.tsx`
- Move: `src/app/page.tsx` → `src/app/(dashboard)/page.tsx`
- Modify: `src/middleware.ts`

**Step 1: Create dashboard layout**

Create `src/app/(dashboard)/layout.tsx`:

```tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

**Step 2: Move current page.tsx to dashboard**

```bash
mv src/app/page.tsx src/app/\(dashboard\)/page.tsx
```

**Step 3: Update middleware to allow public landing page**

Modify `src/middleware.ts`:

```typescript
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  // Only protect /dashboard and /activity routes
  matcher: ['/dashboard/:path*', '/activity/:path*'],
}
```

**Step 4: Verify app still works**

Run: `docker compose exec app npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add -A && git commit -m "refactor: move app to (dashboard) route group"
```

---

## Task 2: Create Marketing Layout and Empty Landing Page

**Files:**
- Create: `src/app/(marketing)/layout.tsx`
- Create: `src/app/(marketing)/page.tsx`

**Step 1: Create marketing layout**

Create `src/app/(marketing)/layout.tsx`:

```tsx
import { ThemeProvider } from '@/components/theme-provider';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
```

**Step 2: Create basic landing page**

Create `src/app/(marketing)/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  // Redirect authenticated users to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    <main>
      <h1>Landing Page</h1>
    </main>
  );
}
```

**Step 3: Test landing page loads**

Run: `docker compose exec app npm run build && docker compose restart app`

Visit: `http://localhost:3000` (logged out)
Expected: Shows "Landing Page"

Visit: `http://localhost:3000` (logged in)
Expected: Redirects to `/dashboard`

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add marketing layout and basic landing page"
```

---

## Task 3: Copy and Optimize Screenshot Assets

**Files:**
- Create: `public/images/screenshots/` directory
- Copy: Screenshots from `.playwright-mcp/`

**Step 1: Create images directory**

```bash
mkdir -p public/images/screenshots
```

**Step 2: Copy and rename screenshots**

```bash
cp .playwright-mcp/03-main-view-light.png public/images/screenshots/app-light.png
cp .playwright-mcp/06-main-view-dark.png public/images/screenshots/app-dark.png
cp .playwright-mcp/04-calendar-view-light.png public/images/screenshots/calendar.png
cp .playwright-mcp/07-activity-sidebar-dark.png public/images/screenshots/activity.png
cp .playwright-mcp/08-bulk-actions-dark.png public/images/screenshots/bulk-actions.png
```

**Step 3: Commit**

```bash
git add public/images/ && git commit -m "assets: add landing page screenshots"
```

---

## Task 4: Install Accordion Component

**Files:**
- Create: `src/components/ui/accordion.tsx`

**Step 1: Install accordion from shadcn/ui**

```bash
docker compose exec app npx shadcn@latest add accordion
```

**Step 2: Verify installation**

Check file exists: `src/components/ui/accordion.tsx`

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add shadcn accordion component"
```

---

## Task 5: Create Navbar Component

**Files:**
- Create: `src/app/(marketing)/_components/navbar.tsx`

**Step 1: Create navbar component**

Create `src/app/(marketing)/_components/navbar.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-semibold">
            Todo App
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#faq"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add landing page navbar component"
```

---

## Task 6: Create Hero Section Component

**Files:**
- Create: `src/app/(marketing)/_components/hero.tsx`

**Step 1: Create hero component**

Create `src/app/(marketing)/_components/hero.tsx`:

```tsx
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="container py-24 md:py-32">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            The todo app that gets out of your way
          </h1>
          <p className="text-xl text-muted-foreground max-w-[600px]">
            Organize tasks with categories, priorities, due dates, and recurring
            schedules. Simple yet powerful.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started Free
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="relative rounded-xl border bg-muted/50 p-2 shadow-2xl">
            <Image
              src="/images/screenshots/app-dark.png"
              alt="Todo App Screenshot"
              width={1200}
              height={800}
              className="rounded-lg"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add landing page hero section"
```

---

## Task 7: Create Features Section Component

**Files:**
- Create: `src/app/(marketing)/_components/features.tsx`

**Step 1: Create features component**

Create `src/app/(marketing)/_components/features.tsx`:

```tsx
import Image from 'next/image';
import {
  FolderKanban,
  Calendar,
  Repeat,
  CheckSquare,
  History,
  Moon
} from 'lucide-react';

const features = [
  {
    title: 'Categories & Organization',
    description: 'Color-coded categories to keep your tasks organized. Drag and drop to reorder.',
    icon: FolderKanban,
    image: '/images/screenshots/app-dark.png',
  },
  {
    title: 'Calendar View',
    description: 'Visualize your schedule with month and week views. Click any date to add tasks.',
    icon: Calendar,
    image: '/images/screenshots/calendar.png',
  },
  {
    title: 'Recurring Tasks',
    description: 'Set daily, weekly, or monthly schedules. Skip or stop anytime.',
    icon: Repeat,
    image: '/images/screenshots/app-dark.png',
  },
  {
    title: 'Bulk Actions',
    description: 'Select multiple todos and complete, archive, or delete in one click.',
    icon: CheckSquare,
    image: '/images/screenshots/bulk-actions.png',
  },
  {
    title: 'Activity History',
    description: 'Full audit trail of all your changes. Never lose track of what happened.',
    icon: History,
    image: '/images/screenshots/activity.png',
  },
  {
    title: 'Dark Mode',
    description: 'Seamless theme switching with system detection. Easy on the eyes.',
    icon: Moon,
    image: '/images/screenshots/app-light.png',
  },
];

export function Features() {
  return (
    <section id="features" className="container py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          Everything you need to stay organized
        </h2>
        <p className="text-muted-foreground text-lg max-w-[600px] mx-auto">
          Powerful features that help you manage tasks without getting in your way.
        </p>
      </div>
      <div className="space-y-24">
        {features.map((feature, index) => (
          <div
            key={feature.title}
            className={`grid gap-8 lg:grid-cols-2 lg:gap-16 items-center ${
              index % 2 === 1 ? 'lg:flex-row-reverse' : ''
            }`}
          >
            <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold">{feature.title}</h3>
              </div>
              <p className="text-muted-foreground text-lg">
                {feature.description}
              </p>
            </div>
            <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
              <div className="relative rounded-xl border bg-muted/30 p-2 shadow-lg">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  width={800}
                  height={500}
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add landing page features section"
```

---

## Task 8: Create How It Works Section

**Files:**
- Create: `src/app/(marketing)/_components/how-it-works.tsx`

**Step 1: Create how-it-works component**

Create `src/app/(marketing)/_components/how-it-works.tsx`:

```tsx
import Link from 'next/link';
import { UserPlus, PenLine, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  {
    step: 1,
    title: 'Sign Up',
    description: 'Create your free account in seconds with email or Google',
    icon: UserPlus,
  },
  {
    step: 2,
    title: 'Create',
    description: 'Add todos with priorities, due dates, categories, and recurrence',
    icon: PenLine,
  },
  {
    step: 3,
    title: 'Get Done',
    description: 'Check off tasks, track progress, and stay organized',
    icon: CheckCircle,
  },
];

export function HowItWorks() {
  return (
    <section className="bg-muted/30 py-24">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg">
            Get started in three simple steps
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.step} className="relative text-center">
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-border" />
              )}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-background border-2 border-primary">
                    <step.icon className="h-10 w-10 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link href="/register">
            <Button size="lg">Get Started Free</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add landing page how-it-works section"
```

---

## Task 9: Create Feature Grid Section

**Files:**
- Create: `src/app/(marketing)/_components/feature-grid.tsx`

**Step 1: Create feature-grid component**

Create `src/app/(marketing)/_components/feature-grid.tsx`:

```tsx
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
    <section className="container py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          Everything You Need
        </h2>
        <p className="text-muted-foreground text-lg max-w-[600px] mx-auto">
          Powerful features to manage your tasks effectively
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {featureCategories.map((category) => (
          <div
            key={category.title}
            className="rounded-xl border bg-card p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <category.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{category.title}</h3>
            </div>
            <ul className="space-y-2">
              {category.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add landing page feature grid section"
```

---

## Task 10: Create Theme Showcase Section

**Files:**
- Create: `src/app/(marketing)/_components/theme-showcase.tsx`

**Step 1: Create theme-showcase component**

Create `src/app/(marketing)/_components/theme-showcase.tsx`:

```tsx
import Image from 'next/image';
import { Check } from 'lucide-react';

const benefits = [
  'Follows system preference automatically',
  'Easy manual toggle anytime',
  'Preference saved to your account',
];

export function ThemeShowcase() {
  return (
    <section className="bg-muted/30 py-24">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Works the Way You Do
          </h2>
          <p className="text-muted-foreground text-lg">
            Seamless dark and light modes for any environment
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
          <div className="relative rounded-xl border bg-background p-2 shadow-lg">
            <div className="absolute top-4 left-4 bg-background/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium border">
              Light Mode
            </div>
            <Image
              src="/images/screenshots/app-light.png"
              alt="Light Mode"
              width={800}
              height={500}
              className="rounded-lg"
            />
          </div>
          <div className="relative rounded-xl border bg-background p-2 shadow-lg">
            <div className="absolute top-4 left-4 bg-background/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium border">
              Dark Mode
            </div>
            <Image
              src="/images/screenshots/app-dark.png"
              alt="Dark Mode"
              width={800}
              height={500}
              className="rounded-lg"
            />
          </div>
        </div>
        <ul className="flex flex-wrap justify-center gap-x-8 gap-y-4 mt-12">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add landing page theme showcase section"
```

---

## Task 11: Create Testimonials Section

**Files:**
- Create: `src/app/(marketing)/_components/testimonials.tsx`

**Step 1: Create testimonials component**

Create `src/app/(marketing)/_components/testimonials.tsx`:

```tsx
import { Star } from 'lucide-react';
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

function StarRating() {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="container py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          Loved by Productive People
        </h2>
        <p className="text-muted-foreground text-lg">
          See what our users have to say
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.name}
            className="rounded-xl border bg-card p-6 flex flex-col"
          >
            <StarRating />
            <blockquote className="mt-4 flex-1">
              <p className="text-lg leading-relaxed">"{testimonial.quote}"</p>
            </blockquote>
            <div className="flex items-center gap-3 mt-6 pt-6 border-t">
              <Avatar>
                <AvatarFallback>{testimonial.initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{testimonial.name}</div>
                <div className="text-sm text-muted-foreground">
                  {testimonial.role}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add landing page testimonials section"
```

---

## Task 12: Create FAQ Section

**Files:**
- Create: `src/app/(marketing)/_components/faq.tsx`

**Step 1: Create faq component**

Create `src/app/(marketing)/_components/faq.tsx`:

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Is it free to use?',
    answer:
      'Yes! Todo App is completely free to use with all features included. We plan to introduce optional paid plans in the future for advanced features like team collaboration.',
  },
  {
    question: 'How is my data protected?',
    answer:
      'Your data is securely stored in a PostgreSQL database with encryption. We use industry-standard authentication with NextAuth.js. Your todos are private and only accessible to you.',
  },
  {
    question: 'Is there a mobile app?',
    answer:
      'Todo App is fully responsive and works great on mobile browsers. Native iOS and Android apps are on our roadmap for future development.',
  },
  {
    question: 'Can I import from other todo apps?',
    answer:
      'Import functionality is coming soon. We\'re planning to support imports from popular apps like Todoist, Things, and CSV files.',
  },
  {
    question: 'Will there be paid plans?',
    answer:
      'We\'re exploring premium features like team collaboration, integrations, and advanced analytics. Sign up to be notified when pricing is available.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="container py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground text-lg">
          Everything you need to know about Todo App
        </p>
      </div>
      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add landing page FAQ section"
```

---

## Task 13: Create CTA Footer Section

**Files:**
- Create: `src/app/(marketing)/_components/cta-footer.tsx`

**Step 1: Create cta-footer component**

Create `src/app/(marketing)/_components/cta-footer.tsx`:

```tsx
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
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add landing page CTA footer section"
```

---

## Task 14: Create Footer Component

**Files:**
- Create: `src/app/(marketing)/_components/footer.tsx`

**Step 1: Create footer component**

Create `src/app/(marketing)/_components/footer.tsx`:

```tsx
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

const productLinks = [
  { label: 'Features', href: '#features' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Sign In', href: '/login' },
  { label: 'Register', href: '/register' },
];

const comingSoonLinks = [
  { label: 'Pricing', href: '#' },
  { label: 'Integrations', href: '#' },
  { label: 'Mobile Apps', href: '#' },
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="text-xl font-semibold mb-4">Todo App</div>
            <p className="text-muted-foreground text-sm max-w-[300px]">
              The simple todo app that gets out of your way. Organize tasks,
              stay productive.
            </p>
          </div>
          <div>
            <div className="font-medium mb-4">Product</div>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-medium mb-4">Coming Soon</div>
            <ul className="space-y-2">
              {comingSoonLinks.map((link) => (
                <li key={link.label}>
                  <span className="text-sm text-muted-foreground/50 cursor-not-allowed">
                    {link.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 mt-8 border-t">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Todo App. All rights reserved.
          </p>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add landing page footer component"
```

---

## Task 15: Assemble Landing Page

**Files:**
- Modify: `src/app/(marketing)/page.tsx`

**Step 1: Import and assemble all sections**

Update `src/app/(marketing)/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Navbar } from './_components/navbar';
import { Hero } from './_components/hero';
import { Features } from './_components/features';
import { HowItWorks } from './_components/how-it-works';
import { FeatureGrid } from './_components/feature-grid';
import { ThemeShowcase } from './_components/theme-showcase';
import { Testimonials } from './_components/testimonials';
import { FAQ } from './_components/faq';
import { CTAFooter } from './_components/cta-footer';
import { Footer } from './_components/footer';

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <FeatureGrid />
        <ThemeShowcase />
        <Testimonials />
        <FAQ />
        <CTAFooter />
      </main>
      <Footer />
    </>
  );
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: assemble complete landing page"
```

---

## Task 16: Add Container Utility Class

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Add container styles**

Add to `src/app/globals.css` after the existing styles:

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}

@layer components {
  .container {
    @apply mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl;
  }
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add container utility class"
```

---

## Task 17: Update Dashboard Links

**Files:**
- Modify: `src/components/header.tsx`

**Step 1: Update header logo to link to dashboard**

In `src/components/header.tsx`, update the h1 to be a link:

```tsx
import Link from 'next/link';

// In the component, change:
<h1 className="text-xl font-semibold">Todo App</h1>

// To:
<Link href="/dashboard" className="text-xl font-semibold">
  Todo App
</Link>
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: update header logo to link to dashboard"
```

---

## Task 18: Build and Test

**Step 1: Build the application**

```bash
docker compose exec app npm run build
```

Expected: Build succeeds without errors

**Step 2: Restart and test**

```bash
docker compose restart app
```

**Step 3: Manual testing checklist**

- [ ] Visit `http://localhost:3000` logged out → see landing page
- [ ] Click "Get Started" → goes to `/register`
- [ ] Click "Sign In" → goes to `/login`
- [ ] Click "Features" → scrolls to features section
- [ ] Click "FAQ" → scrolls to FAQ section
- [ ] Toggle theme → dark/light mode works
- [ ] Login → redirected to `/dashboard`
- [ ] Visit `http://localhost:3000` logged in → redirected to `/dashboard`
- [ ] All screenshots display correctly
- [ ] Mobile responsive (resize browser)

**Step 4: Commit any fixes if needed**

```bash
git add -A && git commit -m "fix: address landing page issues"
```

---

## Task 19: Add E2E Tests for Landing Page

**Files:**
- Create: `e2e/landing.spec.ts`

**Step 1: Create landing page E2E tests**

Create `e2e/landing.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('should display landing page for unauthenticated users', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /the todo app that gets out of your way/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /get started free/i }).first()).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    // Features link
    await page.getByRole('link', { name: 'Features' }).click();
    await expect(page.locator('#features')).toBeInViewport();

    // FAQ link
    await page.getByRole('link', { name: 'FAQ' }).click();
    await expect(page.locator('#faq')).toBeInViewport();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.getByRole('link', { name: /get started/i }).first().click();
    await expect(page).toHaveURL('/register');
  });

  test('should navigate to login page', async ({ page }) => {
    await page.getByRole('link', { name: /sign in/i }).first().click();
    await expect(page).toHaveURL('/login');
  });

  test('should toggle theme', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /toggle theme/i }).first();
    await themeToggle.click();
    // Verify theme menu appears
    await expect(page.getByRole('menuitem', { name: /dark/i })).toBeVisible();
  });

  test('should expand FAQ accordion', async ({ page }) => {
    await page.getByRole('link', { name: 'FAQ' }).click();

    const firstQuestion = page.getByRole('button', { name: /is it free to use/i });
    await firstQuestion.click();

    await expect(page.getByText(/completely free/i)).toBeVisible();
  });
});
```

**Step 2: Run the tests**

```bash
docker compose exec app npx playwright test e2e/landing.spec.ts
```

Expected: All tests pass

**Step 3: Commit**

```bash
git add -A && git commit -m "test: add E2E tests for landing page"
```

---

## Task 20: Final Cleanup and Verification

**Step 1: Run full test suite**

```bash
docker compose exec app npm run test
docker compose exec app npx playwright test
```

Expected: All tests pass

**Step 2: Run build**

```bash
docker compose exec app npm run build
```

Expected: Build succeeds

**Step 3: Final commit**

```bash
git add -A && git commit -m "chore: final landing page cleanup"
```

---

## Summary

The implementation creates:

1. **Route structure:**
   - `(marketing)` group for public landing page
   - `(dashboard)` group for authenticated app
   - Updated middleware for proper auth routing

2. **10 landing page components:**
   - Navbar, Hero, Features, HowItWorks, FeatureGrid
   - ThemeShowcase, Testimonials, FAQ, CTAFooter, Footer

3. **Assets:**
   - Optimized screenshots in `public/images/screenshots/`

4. **Tests:**
   - E2E tests for landing page functionality

Total: **20 tasks** with frequent commits throughout.
