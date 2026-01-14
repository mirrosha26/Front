'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { IconSearch, IconX, IconLoader2 } from '@tabler/icons-react';

interface SearchInputProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  initialValue?: string;
  placeholder?: string;
  onValueChange?: (value: string) => void;
  isLoading?: boolean;
}

export function SearchInput({
  onSearch,
  onClear,
  initialValue = '',
  placeholder = 'Поиск...',
  onValueChange
}: SearchInputProps) {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchQuery(initialValue);
    setHasChanged(false);
  }, [initialValue]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onValueChange?.(newValue);

    if (newValue === '') {
      onSearch('');
      setHasChanged(false);
    } else if (newValue !== initialValue) {
      setHasChanged(true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery.trim().replace(/\s+/g, ' '));
  };

  const handleClear = () => {
    setSearchQuery('');
    setHasChanged(false);
    onSearch('');
    onClear();
    searchInputRef.current?.focus();
  };

  return (
    <form
      onSubmit={handleSearchSubmit}
      className='relative'
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Search icon on the left */}
      <div
        className='absolute top-1/2 left-3 -translate-y-1/2 cursor-pointer'
        onClick={() => {
          if (searchQuery.trim()) {
            onSearch(searchQuery.trim().replace(/\s+/g, ' '));
          } else {
            searchInputRef.current?.focus();
          }
        }}
      >
        <IconSearch className='text-muted-foreground hover:text-foreground h-4 w-4 transition-colors' />
      </div>

      <Input
        ref={searchInputRef}
        type='search'
        placeholder={placeholder}
        value={searchQuery}
        onChange={handleSearchChange}
        onFocus={() => setSearchFocused(true)}
        onBlur={() => {
          setTimeout(() => setSearchFocused(false), 100);
        }}
        className='pr-10 pl-10 [&::-webkit-search-cancel-button]:hidden'
      />

      {(searchQuery || hasChanged) && (
        <div className='absolute top-1/2 right-3 -translate-y-1/2'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-6 w-6 p-0 hover:bg-transparent focus:bg-transparent'
            onClick={handleClear}
          >
            <IconX className='text-muted-foreground hover:text-foreground h-3.5 w-3.5' />
          </Button>
        </div>
      )}
    </form>
  );
}
