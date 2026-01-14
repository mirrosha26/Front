'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { IconRefresh } from '@tabler/icons-react';
import { PrivateInvestorsList } from './private-investors-list';
import { CreateRequestForm } from './create-request-form';
import { usePrivateInvestors } from '../../contexts/private-investors-context';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const PrivateInvestorsPage = () => {
  const {
    data,
    isLoading,
    fetchPrivateInvestors,
    deletePrivateInvestorRequest
  } = usePrivateInvestors();


  return (
    <div className='w-full px-4 py-2 sm:px-6'>
      <Tabs defaultValue='investors'>
        <div className='sticky top-0 bg-background z-10 pt-4 pb-4 w-full'>
          <div className='flex items-center justify-between mb-4 w-full'>
            <h2 className='text-2xl font-bold tracking-tight'>
              Personal Investors
            </h2>
            <div className='flex gap-2'>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => fetchPrivateInvestors()}
                disabled={isLoading}
              >
                <IconRefresh className='h-4 w-4' />
              </Button>
              <CreateRequestForm />
            </div>
          </div>

          <TabsList className='inline-flex h-8 gap-1'>
            <TabsTrigger
              value='investors'
              className='flex items-center gap-2 px-3 py-0.5 text-sm'
            >
              Added
              <span className='bg-muted inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium'>
                {isLoading ? '...' : data.investors_with_signals.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value='processing'
              className='flex items-center gap-2 px-3 py-0.5 text-sm'
            >
              Processing
              <span className='bg-muted inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium'>
                {isLoading ? '...' : data.processing_requests.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value='pending'
              className='flex items-center gap-2 px-3 py-0.5 text-sm'
            >
              Submitted
              <span className='bg-muted inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium'>
                {isLoading ? '...' : data.pending_requests.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <PrivateInvestorsList
          pendingRequests={data.pending_requests}
          processingRequests={data.processing_requests}
          investors={data.investors_with_signals}
          isLoading={isLoading}
          onDeleteRequest={deletePrivateInvestorRequest}
        />
      </Tabs>

    </div>
  );
};
