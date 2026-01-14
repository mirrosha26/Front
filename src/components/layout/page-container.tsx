import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PageContainer({
  children,
  scrollable = true
}: {
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  return (
    <>
      {scrollable ? (
        <ScrollArea className='h-[calc(100dvh-52px)]'>
          <div className='flex flex-1 px-1 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 lg:px-6'>
            {children}
          </div>
        </ScrollArea>
      ) : (
        <div className='flex flex-1 px-1 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 lg:px-6'>
          {children}
        </div>
      )}
    </>
  );
}
