'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { IconX } from '@tabler/icons-react';

interface NotesCardsFiltersProps {
  onApply: (filters: Record<string, any>) => void;
  onClose: () => void;
  currentFilters: Record<string, any>;
}

export function NotesCardsFilters({
  onApply,
  onClose,
  currentFilters
}: NotesCardsFiltersProps) {
  const [filters, setFilters] = useState({
    min_sig: currentFilters.min_sig || 1,
    max_sig: currentFilters.max_sig || '',
    unique: currentFilters.unique === 'true',
    last_week: currentFilters.last_week === 'true',
    start_date: currentFilters.start_date || '',
    end_date: currentFilters.end_date || ''
  });

  // Filter change handler
  const handleFilterChange = (name: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    // Convert boolean values to strings for URL
    const formattedFilters = {
      ...filters,
      unique: filters.unique ? 'true' : undefined,
      last_week: filters.last_week ? 'true' : undefined
    };

    onApply(formattedFilters);
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      min_sig: 1,
      max_sig: '',
      unique: false,
      last_week: false,
      start_date: '',
      end_date: ''
    });
  };

  return (
    <div className='bg-background rounded-lg border p-4'>
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='font-medium'>Фильтры</h3>
        <Button variant='ghost' size='sm' onClick={onClose}>
          <IconX className='h-4 w-4' />
        </Button>
      </div>

      <div className='space-y-4'>
        {/* Number of signals */}
        <div className='space-y-2'>
          <Label>Number of signals</Label>
          <div className='flex gap-2'>
            <Input
              type='number'
              min='1'
              placeholder='From'
              value={filters.min_sig}
              onChange={(e) => handleFilterChange('min_sig', e.target.value)}
              className='w-1/2'
            />
            <Input
              type='number'
              min={filters.min_sig || 1}
              placeholder='To'
              value={filters.max_sig}
              onChange={(e) => handleFilterChange('max_sig', e.target.value)}
              className='w-1/2'
            />
          </div>
        </div>

        {/* Notes creation period */}
        <div className='space-y-2'>
          <Label>Notes creation period (DD.MM.YYYY)</Label>
          <div className='flex gap-2'>
            <Input
              type='text'
              placeholder='From (DD.MM.YYYY)'
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className='w-1/2'
            />
            <Input
              type='text'
              placeholder='To (DD.MM.YYYY)'
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className='w-1/2'
            />
          </div>
        </div>

        {/* Additional filters */}
        <div className='space-y-2'>
          <Label>Additional</Label>
          <div className='space-y-2'>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='unique'
                checked={filters.unique}
                onCheckedChange={(checked) =>
                  handleFilterChange('unique', checked)
                }
              />
              <label htmlFor='unique' className='text-sm'>
                Unique signals only
              </label>
            </div>

            <div className='flex items-center space-x-2'>
              <Checkbox
                id='last_week'
                checked={filters.last_week}
                onCheckedChange={(checked) =>
                  handleFilterChange('last_week', checked)
                }
              />
              <label htmlFor='last_week' className='text-sm'>
                Notes from last week
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className='mt-4 flex justify-end gap-2'>
        <Button variant='outline' size='sm' onClick={handleResetFilters}>
          Reset
        </Button>
        <Button size='sm' onClick={handleApplyFilters}>
          Apply
        </Button>
      </div>
    </div>
  );
}
