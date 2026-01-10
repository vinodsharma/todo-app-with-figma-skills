'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectionCheckboxProps {
  checked: boolean;
  onChange: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

export function SelectionCheckbox({ checked, onChange, className }: SelectionCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        checked
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-muted-foreground hover:border-primary',
        className
      )}
    >
      {checked && <Check className="h-3 w-3" />}
    </button>
  );
}
