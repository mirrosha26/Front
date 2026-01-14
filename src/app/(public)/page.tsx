'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';
import { useTheme } from 'next-themes';
import { NetworkBackground } from '@/components/ui/network-background';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [nodeCount, setNodeCount] = useState(80);

  // Устанавливаем флаг mounted после монтирования компонента
  useEffect(() => {
    setMounted(true);
  }, []);

  // Определяем isDark только после монтирования компонента
  const isDark = mounted ? resolvedTheme === 'dark' : false;

  // Определяем обратные цвета темы для выделения
  const inverseTextClass = isDark ? 'text-black' : 'text-white';
  const inverseBgClass = isDark
    ? 'bg-white hover:bg-white/90'
    : 'bg-black hover:bg-black/90';
  const inverseBorderClass = isDark ? 'border-white' : 'border-black';

  // Скрываем кнопки с инверсными цветами до монтирования
  const buttonVisibilityClass = mounted ? 'opacity-100' : 'opacity-0';

  // Адаптивное количество узлов в зависимости от размера экрана
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        // мобильные устройства
        setNodeCount(50);
      } else if (width < 1024) {
        // планшеты
        setNodeCount(100);
      } else {
        // десктопы
        setNodeCount(160);
      }
    };

    // Инициализация при загрузке
    handleResize();

    // Обновление при изменении размера окна
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Если компонент не монтирован, отображаем скелетон или упрощенную версию
  if (!mounted) {
    return (
      <div className='relative flex min-h-screen flex-col'>
        <div className='relative z-10 border-b'>
          <div className='container mx-auto flex h-16 items-center justify-between px-4'>
            {/* Скелетон для шапки */}
          </div>
        </div>
        <main className='relative z-10 flex flex-1 items-center justify-center'>
          <section className='container mx-auto px-4 text-center'>
            <div className='mx-auto max-w-3xl'>
              <div className='bg-muted/50 mx-auto h-12 w-full max-w-xl rounded'></div>
              <div className='bg-muted/30 mx-auto mt-6 h-6 w-full max-w-md rounded'></div>
              <div className='mt-10 flex justify-center gap-4'>
                <div className='bg-muted/30 h-10 w-32 rounded'></div>
                <div className='bg-muted/30 h-10 w-32 rounded'></div>
              </div>
            </div>
          </section>
        </main>
        <footer className='relative z-10 border-t py-6'>
          {/* Скелетон для футера */}
        </footer>
      </div>
    );
  }

  return (
    <div className='relative flex min-h-screen flex-col'>
      <NetworkBackground nodeCount={nodeCount} />
      <header className='relative z-10 border-b'>
        <div className='container mx-auto flex h-16 items-center justify-between px-4'>
          <div className='flex items-center gap-0'>
            <img
              src='/logo/compact/logo.png'
              alt='Logo'
              width={32}
              height={32}
              className='max-w-[32px] max-h-[32px] object-contain'
            />
          </div>
          <div className='flex items-center gap-4'>
            <ModeToggle />
            <Link href='/auth/sign-in'>
              <Button variant='ghost'>Вход</Button>
            </Link>
            <Link href='/auth/sign-up' className='hidden sm:block'>
              <Button
                className={`${inverseBgClass} ${inverseTextClass} ${buttonVisibilityClass} transition-opacity duration-200`}
                onClick={() => window.open('https://calendly.com/is-theveck/30min', '_blank')}
              >
                Записаться на демо
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className='bg-background/50 relative z-10 flex flex-1 items-center justify-center'>
        <section className='container mx-auto px-4 text-center'>
          <div className='mx-auto max-w-3xl'>
            <h1 className='text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl'>
              Расширяем возможности венчурных инвесторов
              <br />
              с помощью аналитики данных
            </h1>
            <p className='mt-6 text-xl text-zinc-600 dark:text-zinc-400'>
              Мы собираем тысячи точек данных, фильтруем их с помощью искусственного интеллекта и проверяем вручную, чтобы вы могли сортировать только качественные сигналы.
            </p>
            <p className='mt-4 text-sm text-zinc-500 dark:text-zinc-500'>
              Это студенческий образовательный проект студентов{' '}
              <Link
                href='https://fa.ru'
                target='_blank'
                rel='noopener noreferrer'
                className='hover:text-primary text-primary underline underline-offset-4'
              >
                Финансового университета
              </Link>
              {' '}(демо-версия)
            </p>
            <div className='mt-10 flex flex-col justify-center gap-4 sm:flex-row'>
              <Button
                size='lg'
                className={`gap-2 ${inverseBgClass} ${inverseTextClass} w-full sm:w-auto`}
                onClick={() => window.open('https://calendly.com/is-theveck/30min', '_blank')}
              >
                Записаться на демо
                <Icons.arrowRight className='h-4 w-4' />
              </Button>
              <Link href='/auth/sign-in'>
                <Button
                  size='lg'
                  variant='ghost'
                  className={`w-full border-2 sm:w-auto ${inverseBorderClass}`}
                >
                  Вход
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className='bg-muted/30 relative z-10 border-t py-6'>
        <div className='container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-sm text-zinc-600 dark:text-zinc-400 sm:flex-row'>
          <div className='flex flex-col items-center gap-2 text-center sm:items-start sm:text-left'>
            <p>© 2025 VECK. Все права защищены.</p>
            <p className='text-xs'>
              Студенческий образовательный проект{' '}
              <Link
                href='https://fa.ru'
                target='_blank'
                rel='noopener noreferrer'
                className='hover:text-primary text-primary underline underline-offset-4'
              >
                Финансового университета
              </Link>
              {' '}(демо-версия)
            </p>
          </div>
          <div className='flex gap-4'>
            <Link
              href='https://theveck.com/privacy-policy'
              className={`hover:${isDark ? 'text-white' : 'text-black'} transition-colors`}
            >
              Конфиденциальность
            </Link>
            <Link
              href='https://theveck.com/terms'
              className={`hover:${isDark ? 'text-white' : 'text-black'} transition-colors`}
            >
              Условия
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
