'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { IconX, IconTrash } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { FounderContact } from '../types';
import { formatDate } from '../utils/format-date';

interface ContactCardProps {
  contact: FounderContact;
  isPending: boolean;
  onCancel: (id: number) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}

export const ContactCard = ({
  contact,
  isPending,
  onCancel,
  onDelete
}: ContactCardProps) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCancelClick = () => setShowCancelConfirm(true);
  const handleCancelConfirm = async () => {
    setIsProcessing(true);
    const success = await onCancel(contact.id);
    if (!success) {
      setShowCancelConfirm(false);
    }
    setIsProcessing(false);
  };
  const handleCancelDeny = () => setShowCancelConfirm(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e?.stopPropagation?.();
    setShowDeleteConfirm(true);
  };
  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e?.stopPropagation?.();
    setIsProcessing(true);
    const success = await onDelete(contact.id);
    if (!success) {
      setShowDeleteConfirm(false);
    }
    setIsProcessing(false);
  };
  const handleDeleteDeny = () => setShowDeleteConfirm(false);

  return (
    <div
      className={cn(
        'bg-card border-border relative mb-2 overflow-hidden rounded-lg border',
        !isPending && 'hover:border-muted-foreground/30'
      )}
    >
      {isPending ? (
        <div className='flex w-full items-center p-4'>
          <div className='flex flex-1 items-center'>
            <Avatar className='mr-4 h-10 w-10 flex-shrink-0' variant='default'>
              <AvatarImage
                src={contact.image || undefined}
                alt={contact.name}
              />
              <AvatarFallback className='bg-muted text-muted-foreground text-lg'>
                {contact.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className='flex-1'>
              <div className='flex items-center'>
                <p className='text-lg font-bold'>{contact.name}</p>
                <Badge
                  variant='secondary'
                  className='mr-4 ml-2 flex items-center'
                >
                  В ожидании
                </Badge>
              </div>
              <p className='text-sm text-gray-500'>
                Запрос создан {formatDate(contact.created_at)}
              </p>
            </div>

            {showCancelConfirm ? (
              <div className='flex items-center gap-2'>
                  <p className='text-muted-foreground text-sm'>Вы уверены?</p>
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={handleCancelConfirm}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Отмена...' : 'Да, отменить'}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleCancelDeny}
                  disabled={isProcessing}
                >
                  Нет
                </Button>
              </div>
            ) : (
              <Button variant='outline' onClick={handleCancelClick}>
                <IconX className='mr-2 h-4 w-4' />
                Отмена
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Accordion type='single' collapsible>
          <AccordionItem
            value={`request-${contact.id}`}
            className='border-none'
          >
            <AccordionTrigger className='w-full p-4 hover:no-underline'>
              <div className='flex w-full items-center'>
                <Avatar className='mr-4 h-10 w-10 flex-shrink-0' variant='default'>
                  <AvatarImage
                    src={contact.image || undefined}
                    alt={contact.name}
                  />
                  <AvatarFallback className='bg-muted text-muted-foreground text-lg'>
                    {contact.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className='flex-1 text-left'>
                  <div className='flex items-center'>
                    <p className='mb-0 text-lg font-bold'>{contact.name}</p>
                    <Badge className='mr-4 ml-2'>Обработано</Badge>
                  </div>
                  <p className='text-sm text-gray-500'>
                    Запрос создан {formatDate(contact.created_at)}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className='p-4 pt-0'>
              {contact.response_text ? (
                <>
                  <p className='mb-1 font-bold'>Полный ответ:</p>
                  <p className='text-sm'>{contact.response_text}</p>
                </>
              ) : (
                <p className='text-sm italic'>Ответ недоступен.</p>
              )}
              <div className='mt-4 flex justify-end'>
                {showDeleteConfirm ? (
                  <div className='flex items-center gap-2'>
                    <p className='text-sm text-white'>Вы уверены?</p>
                    <Button
                      variant='destructive'
                      onClick={handleDeleteConfirm}
                      disabled={isProcessing}
                      className='text-sm text-white'
                    >
                      {isProcessing ? 'Удаление...' : 'Да, удалить'}
                    </Button>
                    <Button
                      variant='outline'
                      onClick={handleDeleteDeny}
                      disabled={isProcessing}
                      className='text-sm'
                    >
                      Нет
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant='default'
                    onClick={handleDeleteClick}
                    className='text-primary-foreground text-sm'
                  >
                    <IconTrash className='h-4 w-4' />
                    Удалить
                  </Button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
};
