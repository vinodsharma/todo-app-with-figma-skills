'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = {
  navigation: [
    { key: 'j / ↓', description: 'Next todo' },
    { key: 'k / ↑', description: 'Previous todo' },
    { key: 'n', description: 'New todo' },
    { key: '/', description: 'Search' },
  ],
  actions: [
    { key: 'Enter', description: 'Toggle complete' },
    { key: 'e', description: 'Edit todo' },
    { key: 'd', description: 'Delete todo' },
    { key: 'Escape', description: 'Clear selection' },
    { key: '?', description: 'Show this help' },
  ],
};

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">Navigation</h4>
            <div className="space-y-1">
              {shortcuts.navigation.map(({ key, description }) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span>{description}</span>
                  <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">Actions</h4>
            <div className="space-y-1">
              {shortcuts.actions.map(({ key, description }) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span>{description}</span>
                  <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
