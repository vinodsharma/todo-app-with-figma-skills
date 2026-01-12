'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface DemoTodoInputProps {
  onAdd: (title: string) => void;
}

export function DemoTodoInput({ onAdd }: DemoTodoInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onAdd(value);
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a new task..."
        className="flex-1 h-9 text-sm bg-background"
      />
      <Button type="submit" size="sm" className="h-9 px-3">
        <Plus className="h-4 w-4 mr-1" />
        Add
      </Button>
    </form>
  );
}
