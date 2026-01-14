'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';

interface NewProjectsSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function NewProjectsSwitch({
  checked,
  onChange,
  className = ''
}: NewProjectsSwitchProps) {
  return (
    <Button
      variant={checked ? 'default' : 'outline'}
      size='default'
      onClick={() => onChange(!checked)}
      className={`cursor-pointer pr-4 pl-3 whitespace-nowrap ${className}`}
    >
      <div className='flex items-center gap-2 text-sm'>
        <TrendingUp className='h-4 w-4' />
        <span>Недавно добавленные</span>
      </div>
    </Button>
  );
}
