'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { IconAlertCircle } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function OverviewError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Логируем ошибку для отладки
    console.error('Ошибка в overview:', error);
  }, [error]);

  return (
    <div className='flex flex-col gap-4 p-6'>
      <Alert variant='destructive'>
        <IconAlertCircle className='h-4 w-4' />
        <AlertTitle>Ошибка загрузки</AlertTitle>
        <AlertDescription>
          Не удалось загрузить данные: {error.message}
        </AlertDescription>
      </Alert>
      <Button onClick={reset} variant='outline' className='w-fit'>
        Попробовать снова
      </Button>
    </div>
  );
}
