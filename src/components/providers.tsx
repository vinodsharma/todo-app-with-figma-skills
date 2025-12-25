'use client';

import { Toaster } from '@/components/ui/sonner';

// Note: SessionProvider will be added when NextAuth is installed in Milestone 2
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
