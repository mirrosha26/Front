'use client';

import { Button } from '@/components/ui/button';
import { IconRefresh } from '@tabler/icons-react';
import { ContactList } from './contact-list';
import { TicketsProvider, useTickets } from '../contexts/tickets-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

// Обертка для использования контекста
const FounderContactsContent = () => {
  const { tickets, isLoading, fetchTickets, cancelTicket, deleteTicket } =
    useTickets();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'processed'>(
    'all'
  );

  // Подсчет количества контактов для каждой категории
  const pendingCount = tickets.filter((ticket) => !ticket.is_processed).length;
  const processedCount = tickets.filter((ticket) => ticket.is_processed).length;

  return (
    <div className='w-full px-4 py-2 sm:px-6'>
      <Tabs
        defaultValue='all'
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as 'all' | 'pending' | 'processed')
        }
      >
        {/* Заголовок и табы - делаем липкими */}
        <div className='bg-background/90 backdrop-blur-sm sticky top-0 z-20 pt-4 pb-3 mb-1 w-full border-b'>
          <div className='flex items-center justify-between mb-4 w-full'>
            <h2 className='text-2xl font-bold tracking-tight'>
              Контакты основателей
            </h2>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => fetchTickets()}
              disabled={isLoading}
            >
              <IconRefresh className='h-4 w-4' />
            </Button>
          </div>

          <TabsList className='inline-flex h-8 gap-1'>
            <TabsTrigger
              value='all'
              className='flex items-center gap-2 px-3 py-0.5 text-sm'
            >
              Все
              <span className='bg-muted inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium'>
                {isLoading ? '...' : tickets.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value='pending'
              className='flex items-center gap-2 px-3 py-0.5 text-sm'
            >
              В ожидании
              <span className='bg-muted inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium'>
                {isLoading ? '...' : pendingCount}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value='processed'
              className='flex items-center gap-2 px-3 py-0.5 text-sm'
            >
              Обработано
              <span className='bg-muted inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium'>
                {isLoading ? '...' : processedCount}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Контент табов */}
        <TabsContent value='all'>
          <ContactList
            contacts={tickets}
            isLoading={isLoading}
            onCancel={cancelTicket}
            onDelete={deleteTicket}
            filter='all'
          />
        </TabsContent>
        <TabsContent value='pending'>
          <ContactList
            contacts={tickets}
            isLoading={isLoading}
            onCancel={cancelTicket}
            onDelete={deleteTicket}
            filter='pending'
          />
        </TabsContent>
        <TabsContent value='processed'>
          <ContactList
            contacts={tickets}
            isLoading={isLoading}
            onCancel={cancelTicket}
            onDelete={deleteTicket}
            filter='processed'
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Main component with provider
export const FounderContactsPage = () => {
  return (
    <TicketsProvider>
      <FounderContactsContent />
    </TicketsProvider>
  );
};
