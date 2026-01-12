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
