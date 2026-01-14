'use client';

import { FounderContact } from '../types';
import { ContactCard } from './contact-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { IconAlertCircle } from '@tabler/icons-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AvatarSkeleton } from '@/features/shared/components/ui/avatar-skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';

interface ContactListProps {
  contacts: FounderContact[];
  isLoading: boolean;
  onCancel: (id: number) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  filter?: 'all' | 'pending' | 'processed';
}

// Скелетон для карточки контакта
const ContactCardSkeleton = ({
  isPending = false
}: {
  isPending?: boolean;
}) => {
  // Для ожидающих контактов показываем упрощенный скелетон
  if (isPending) {
    return (
      <div className='bg-card border-border relative mb-2 overflow-hidden rounded-lg border p-4'>
        <div className='flex w-full items-center'>
          <div className='mr-4'>
            <AvatarSkeleton count={1} size='md' />
          </div>
          <div className='flex-1'>
            <div className='flex items-center'>
              <Skeleton className='mb-2 h-5 w-32 opacity-50' />
              <Skeleton className='ml-2 h-5 w-16 opacity-50' />
            </div>
            <Skeleton className='h-4 w-48 opacity-50' />
          </div>
          <Skeleton className='h-9 w-24 opacity-50' />
        </div>
      </div>
    );
  }

  // Для обработанных контактов показываем скелетон с аккордеоном
  return (
    <div className='bg-card border-border relative mb-2 overflow-hidden rounded-lg border'>
      <Accordion type='single' collapsible>
        <AccordionItem value='skeleton' className='border-none'>
          <AccordionTrigger className='w-full p-4 hover:no-underline'>
            <div className='flex w-full items-center'>
              <div className='mr-4'>
                <AvatarSkeleton count={1} size='md' />
              </div>
              <div className='flex-1 text-left'>
                <div className='flex items-center'>
                  <Skeleton className='mb-2 h-5 w-32 opacity-50' />
                  <Skeleton className='ml-2 h-5 w-16 opacity-50' />
                </div>
                <Skeleton className='h-4 w-48 opacity-50' />
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className='p-4 pt-0'>
            <Skeleton className='mb-2 h-4 w-full opacity-50' />
            <Skeleton className='mb-2 h-4 w-full opacity-50' />
            <Skeleton className='mb-2 h-4 w-3/4 opacity-50' />
            <div className='mt-4 flex justify-end'>
              <Skeleton className='h-9 w-24 opacity-50' />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export const ContactList = ({
  contacts,
  isLoading,
  onCancel,
  onDelete,
  filter = 'all'
}: ContactListProps) => {
  // Фильтруем контакты в зависимости от выбранной вкладки
  const filteredContacts =
    filter === 'all'
      ? contacts
      : filter === 'pending'
        ? contacts.filter((contact) => !contact.is_processed)
        : contacts.filter((contact) => contact.is_processed);

  // Если нет контактов и не идет загрузка
  if (filteredContacts.length === 0 && !isLoading) {
    return (
      <div className='flex items-center justify-center py-10'>
        <div className='text-muted-foreground max-w-md text-center'>
          Контакты не найдены. Добавьте новый контакт, нажав кнопку "Добавить контакт".
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-1'>
      {isLoading ? (
        // Показываем скелетоны во время загрузки
        Array.from({ length: 3 }).map((_, index) => (
          <ContactCardSkeleton key={index} />
        ))
      ) : filteredContacts.length > 0 ? (
        filteredContacts.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            isPending={!contact.is_processed}
            onCancel={onCancel}
            onDelete={onDelete}
          />
        ))
      ) : (
        <Alert>
          <IconAlertCircle className='h-4 w-4' />
          <AlertTitle>Контакты не найдены</AlertTitle>
          <AlertDescription>
            В этой категории нет контактов.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
