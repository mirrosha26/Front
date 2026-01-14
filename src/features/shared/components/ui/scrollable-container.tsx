'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { IconArrowUp } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface ScrollableContainerProps {
  children: React.ReactNode;
  className?: string;
  height?: string;
  showScrollToTop?: boolean;
}

export function ScrollableContainer({
  children,
  className,
  height = 'max-h-[600px]',
  showScrollToTop = true
}: ScrollableContainerProps) {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    setShowScrollButton(scrollTop > 200);
  };

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative h-full">
      <div
        ref={containerRef}
        className={cn(
          'scrollable-container overflow-y-auto pr-2 h-full',
          height === 'h-full' ? '' : height,
          className
        )}
        onScroll={handleScroll}
      >
        {children}
      </div>

      {showScrollToTop === true && showScrollButton && (
        <Button
          variant='default'
          size='icon'
          onClick={scrollToTop}
          className='absolute bottom-4 right-4 h-10 w-10 rounded-full shadow-lg z-50'
        >
          <IconArrowUp className='h-4 w-4' />
        </Button>
      )}
    </div>
  );
} 