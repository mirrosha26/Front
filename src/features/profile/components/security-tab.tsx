'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChangePasswordForm } from './change-password-form';

export function SecurityTab() {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  return (
    <div>
      <h1 className='mb-6 text-xl font-bold'>Безопасность</h1>
      <Separator className='mb-6' />

      {/* Password Section */}
      <div className='mb-6'>
        <h2 className='mb-4 text-lg font-medium'>Пароль</h2>

        <div className='space-y-4'>
          <div className='flex items-center justify-between rounded-md border p-3 '>
            <div>
              <div className='font-medium'>Изменить пароль</div>
              <div className='text-muted-foreground text-sm'>
                Установите надежный пароль для защиты вашего аккаунта
              </div>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsPasswordDialogOpen(true)}
            >
              Изменить пароль
            </Button>
          </div>
        </div>
      </div>

      {/* Password Change Dialog */}
      <ChangePasswordForm
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      />
    </div>
  );
}
