'use client';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { DynamicBackground } from '@/components/dynamic-background';

// Динамический импорт формы регистрации с отключенным SSR
const DynamicSignUpForm = dynamic(() => import('./sign-up-form'), {
  ssr: false,
  loading: () => (
    <div className='flex min-h-[400px] items-center justify-center'>
      <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2'></div>
    </div>
  )
});


// Создание отдельного клиентского компонента для левой панели
function LeftPanel({ backgroundColor = 'bg-primary' }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className='bg-muted relative hidden h-full flex-col overflow-hidden p-10 text-white lg:flex dark:border-r'>
      {/* Фоновое изображение с градиентом */}
      <div className={`absolute inset-0 ${backgroundColor}`}>
        {/* Радиальный градиент для светлого центра */}
        <div
          className='bg-radial-gradient absolute inset-0'
          style={{
            background:
              'radial-gradient(circle at 60% 50%, rgba(24, 24, 27, 0.05) 10%, rgba(24, 24, 27, 0.2) 40%, rgba(24, 24, 27, 0.5) 80%, rgba(24, 24, 27, 0.7) 100%)'
          }}
        />
        {/* Дополнительный градиент для затемнения слева */}
        <div className={`absolute inset-0 bg-gradient-to-r from-${backgroundColor.replace('bg-', '')}/70 via-${backgroundColor.replace('bg-', '')}/30 to-transparent`} />
        {/* Улучшенный градиент сверху и снизу */}
        <div className={`absolute inset-0 bg-gradient-to-b from-${backgroundColor.replace('bg-', '')}/70 via-transparent to-${backgroundColor.replace('bg-', '')}/70`} />
        {/* Динамический фон с SVG фигурами */}
        <DynamicBackground />
      </div>

      {/* Контент поверх фона */}
      <div className='relative z-20 flex items-center text-lg font-medium'>
        <Link href="/" className="flex items-center space-x-2">
          {mounted ? (
            <img
              src='/logo/compact/logo.png'
              alt='Logo'
              width={87}
              height={39}
              className='max-w-[87px] max-h-[39px] object-contain'
            />
          ) : (
            <div className='h-[39px] w-[87px] animate-pulse rounded bg-zinc-800/50'></div>
          )}
        </Link>
      </div>
      <div className='relative z-20 mt-auto'>
        <blockquote className='space-y-2'>
          <p className='text-lg text-primary-foreground'>
            Агрегируем значимые социальные сигналы из венчурной экосистемы по всему миру.
          </p>
        </blockquote>
      </div>
    </div>
  );
}

export default function SignUpViewPage({ backgroundColor = 'bg-primary' }) {
  // Использование состояния для управления клиентским рендерингом
  const [mounted, setMounted] = useState(false);

  // Установка флага mounted после монтирования компонента
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className='relative container grid h-[100vh] flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <Link
        href='/auth/sign-in'
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute top-4 right-4 md:top-8 md:right-8'
        )}
      >
        Вход
      </Link>

      <LeftPanel backgroundColor={backgroundColor} />

      <div className='lg:p-8 px-4'>
        <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]'>
          {/* Использование динамически импортированной формы */}
          <DynamicSignUpForm />

          {/* Отображение текста только на клиенте */}
          <div suppressHydrationWarning>
            {mounted ? (
              <p className='text-zinc-600 dark:text-zinc-400 px-8 text-center text-xs'>
                Проект студентов Финансового университета (демо-версия)
              </p>
            ) : (
              <div className='flex justify-center'>
                <div className='border-primary h-4 w-4 animate-spin rounded-full border-b-2'></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
