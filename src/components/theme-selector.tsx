'use client';

import { useThemeConfig } from '@/components/active-theme';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useEffect, useState } from 'react';

const DEFAULT_THEMES = [
  {
    name: 'Default',
    value: 'default'
  },
  {
    name: 'Blue',
    value: 'blue'
  },
  {
    name: 'Green',
    value: 'green'
  },
  {
    name: 'Amber',
    value: 'amber'
  }
];

const SCALED_THEMES = [
  {
    name: 'Default',
    value: 'default-scaled'
  },
  {
    name: 'Blue',
    value: 'blue-scaled'
  }
];

const MONO_THEMES = [
  {
    name: 'Mono',
    value: 'mono-scaled'
  }
];

export function ThemeSelector({ className }: { className?: string }) {
  const { activeTheme, setActiveTheme } = useThemeConfig();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className='bg-muted/30 h-10 w-[180px] animate-pulse rounded'></div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className='flex items-center gap-2'>
        <Select value={activeTheme} onValueChange={setActiveTheme}>
          <SelectTrigger id='theme-selector' className='w-[210px] '>
            <span className='text-zinc-600 dark:text-zinc-400 mr-1'>Select a theme:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='min-w-[210px]'>
            <SelectGroup>
              <SelectLabel>Default</SelectLabel>
              {DEFAULT_THEMES.map((theme) => (
                <SelectItem key={theme.value} value={theme.value}>
                  {theme.name}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Scaled</SelectLabel>
              {SCALED_THEMES.map((theme) => (
                <SelectItem key={theme.value} value={theme.value}>
                  {theme.name}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Monospaced</SelectLabel>
              {MONO_THEMES.map((theme) => (
                <SelectItem key={theme.name} value={theme.value}>
                  {theme.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
