interface BrowserChromeProps {
  children: React.ReactNode;
  url?: string;
}

export function BrowserChrome({ children, url = 'todoapp.com' }: BrowserChromeProps) {
  return (
    <div className="screenshot-glow mx-auto max-w-5xl">
      <div className="relative rounded-2xl border bg-background/50 p-2 shadow-2xl backdrop-blur">
        {/* Browser chrome header */}
        <div className="mb-2 flex items-center gap-2 px-3 py-1">
          {/* Traffic lights */}
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/70" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
            <div className="h-3 w-3 rounded-full bg-green-500/70" />
          </div>
          {/* URL bar */}
          <div className="flex-1 rounded-md bg-muted/50 py-1 px-3 text-xs text-muted-foreground text-center">
            {url}
          </div>
        </div>
        {/* Content */}
        <div className="rounded-xl bg-card overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
