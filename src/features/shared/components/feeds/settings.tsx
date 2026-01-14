'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as Slider from '@radix-ui/react-slider';
import {
  IconX,
  IconSettings,
  IconLoader2,
  IconInfoCircle,
  IconLock,
  IconRocket
} from '@tabler/icons-react';
import { BarChart } from 'lucide-react';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

interface FeedSettingsToggleProps {
  onSettingsClick: () => void;
  hasActiveFilters: boolean;
  className?: string;
}

export function FeedSettingsToggle({
  onSettingsClick,
  hasActiveFilters,
  className = ''
}: FeedSettingsToggleProps) {
  return (
    <Button
      variant='outline'
      size='icon'
      onClick={onSettingsClick}
      className={`relative ${className}`}
    >
      <IconSettings className='h-4 w-4' />
      {hasActiveFilters && (
        <span className='bg-primary absolute top-0 right-0 h-2 w-2 rounded-full'></span>
      )}
    </Button>
  );
}

interface FeedSettingsProps {
  onApply: (settings: any) => void;
  onReset: () => void;
  onClose?: () => void;
  initialSettings?: any;
  title?: string;
  isNewProjectsActive?: boolean;
}

export function FeedSettings({
  onApply,
  onReset,
  onClose,
  initialSettings = {},
  title = 'Feed Settings',
  isNewProjectsActive = false
}: FeedSettingsProps) {
  const [settings, setSettings] = useState({
    min_sig: initialSettings.min_sig || '1',
    max_sig: initialSettings.max_sig || '20',
    start_date: initialSettings.start_date
      ? parseDate(initialSettings.start_date)
      : undefined,
    end_date: initialSettings.end_date
      ? parseDate(initialSettings.end_date)
      : undefined,
    hide_liked:
      initialSettings.hide_liked !== undefined
        ? Boolean(
            initialSettings.hide_liked === 'true' ||
              initialSettings.hide_liked === true
          )
        : true, // Default to true when not explicitly set
    trending: Boolean(
      initialSettings.trending === 'true' || initialSettings.trending === true
    )
  });

  const [isResetting, setIsResetting] = useState(false);

  // Update settings when initialSettings change (e.g., when saved filter is applied)
  useEffect(() => {
    setSettings({
      min_sig: initialSettings.min_sig || '1',
      max_sig: initialSettings.max_sig || '20',
      start_date: initialSettings.start_date
        ? parseDate(initialSettings.start_date)
        : undefined,
      end_date: initialSettings.end_date
        ? parseDate(initialSettings.end_date)
        : undefined,
      hide_liked:
        initialSettings.hide_liked !== undefined
          ? Boolean(
              initialSettings.hide_liked === 'true' ||
                initialSettings.hide_liked === true
            )
          : true, // Default to true when not explicitly set
      trending: Boolean(
        initialSettings.trending === 'true' || initialSettings.trending === true
      )
    });
  }, [initialSettings]);

  // Сбрасываем даты при изменении isNewProjectsActive
  useEffect(() => {
    if (isNewProjectsActive) {
      setSettings((prev) => ({
        ...prev,
        start_date: undefined,
        end_date: undefined
      }));
    }
  }, [isNewProjectsActive]);

  const [monthsToShow, setMonthsToShow] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        // xl breakpoint
        setMonthsToShow(2);
      } else if (window.innerWidth >= 768) {
        // md breakpoint
        setMonthsToShow(2);
      } else {
        setMonthsToShow(1);
      }
    };

    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Функция для безопасного парсинга даты в европейском формате
  function parseDate(dateString: string | Date): Date | undefined {
    // Проверяем, является ли строка уже датой
    if (dateString instanceof Date) return dateString;

    try {
      // Если дата в формате dd.MM.yyyy (европейский формат)
      if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) {
        const [day, month, year] = dateString.split('.').map(Number);
        const date = new Date(year, month - 1, day);
        return isNaN(date.getTime()) ? undefined : date;
      }

      // Стандартный парсинг даты
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? undefined : date;
    } catch (e) {
      console.error('Error parsing date:', e);
      return undefined;
    }
  }

  // Обработчик изменения фильтров
  const handleFilterChange = (name: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Обработчик изменения ползунка
  const handleSliderChange = (values: number[]) => {
    setSettings((prev) => ({
      ...prev,
      min_sig: values[0].toString(),
      max_sig: values[1].toString()
    }));
  };

  // Применение фильтров
  const handleApply = () => {
    console.log('📅 handleApply called with settings:', settings);

    // Преобразуем булевы значения в строки для передачи в URL
    const formattedFilters = {
      ...settings,
      hide_liked: settings.hide_liked ? 'true' : undefined,
      trending: settings.trending ? 'true' : 'false',
      start_date:
        settings.start_date && !isNaN(settings.start_date.getTime())
          ? format(settings.start_date, 'dd.MM.yyyy')
          : undefined,
      end_date:
        settings.end_date && !isNaN(settings.end_date.getTime())
          ? format(settings.end_date, 'dd.MM.yyyy')
          : undefined
    };

    console.log('📅 formattedFilters being sent:', formattedFilters);

    try {
      console.log('📅 Calling onApply...');
      onApply(formattedFilters);
      console.log('📅 onApply called successfully');

      if (onClose) {
        console.log('📅 Closing settings...');
        onClose(); // Закрываем форму после применения настроек
      }
    } catch (error) {
      console.error('📅 Error in handleApply:', error);
    }
  };

  // Сброс фильтров
  const handleReset = async () => {
    setIsResetting(true);
    setSettings((prev) => ({
      ...prev,
      min_sig: '1',
      max_sig: '20',
      start_date: undefined,
      end_date: undefined,
      hide_liked: true, // Reset to default true value
      trending: false
    }));

    // Добавляем небольшую задержку, чтобы спиннер был виден
    await new Promise((resolve) => setTimeout(resolve, 300));

    onReset();
    setIsResetting(false);
  };

  // Стили для встроенного режима
  const containerClasses = 'bg-background w-full rounded-lg border p-4';
  const headerClasses = 'mb-4 flex items-center justify-between';
  const contentClasses = 'flex flex-col gap-4 lg:flex-row lg:items-center';
  const leftColumnClasses = 'w-full space-y-4 lg:w-1/2';
  const rightColumnClasses = 'w-full lg:w-1/2';
  const buttonContainerClasses = 'mt-4 flex justify-end gap-2';

  return (
    <div className={containerClasses}>
      <div className={headerClasses}>
        <h3 className='text-base font-medium'>{title}</h3>
        {onClose && (
          <Button variant='ghost' size='sm' onClick={onClose}>
            <IconX className='h-4 w-4' />
          </Button>
        )}
      </div>

      <ScrollArea
        className='h-[330px] max-h-[680px]'
        scrollbar={{
          size: 2.5,
          className: 'bg-transparent',
          thumbClassName:
            'bg-black/25 dark:bg-zinc-500/50 rounded-full hover:bg-black/35 dark:hover:bg-zinc-400/80'
        }}
      >
        <div className={contentClasses}>
          {/* Левая колонка с полями фильтров */}
          <div className={leftColumnClasses}>
            {/* Hide Liked Toggle */}
            <div className='mb-4 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Label
                  htmlFor='hide-liked'
                  className='flex items-center gap-1 text-sm text-zinc-700 dark:text-zinc-300'
                >
                  Hide Saved
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className='inline-flex h-4 w-4 items-center justify-center rounded-full'>
                          <IconInfoCircle className='h-3.5 w-3.5 flex-shrink-0 cursor-help text-zinc-700 dark:text-zinc-300' />
                        </div>
                      </TooltipTrigger>
                      <TooltipPrimitive.Portal>
                        <TooltipContent
                          side='bottom'
                          sideOffset={5}
                          className='max-w-[150px] px-3 py-2'
                        >
                          <p className='text-xs text-zinc-200 dark:text-zinc-700'>
                            Projects that you've liked or saved to your folders
                            will be hidden
                          </p>
                        </TooltipContent>
                      </TooltipPrimitive.Portal>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
              </div>
              <Switch
                id='hide-liked'
                checked={settings.hide_liked}
                onCheckedChange={(checked) =>
                  handleFilterChange('hide_liked', checked)
                }
                className='data-[state=checked]:bg-primary'
              />
            </div>

            {/* Trending Toggle */}
            <div className='mb-4 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Label
                  htmlFor='trending'
                  className='flex items-center gap-1 text-sm text-zinc-700 dark:text-zinc-300'
                >
                  Show Only Trending
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className='inline-flex h-4 w-4 items-center justify-center rounded-full'>
                          <IconInfoCircle className='h-3.5 w-3.5 flex-shrink-0 cursor-help text-zinc-700 dark:text-zinc-300' />
                        </div>
                      </TooltipTrigger>
                      <TooltipPrimitive.Portal>
                        <TooltipContent
                          side='bottom'
                          sideOffset={5}
                          className='max-w-[150px] px-3 py-2'
                        >
                          <p className='text-xs text-zinc-200 dark:text-zinc-700'>
                            Show only projects that got interest from at least 5
                            investors in the last 7 days.
                          </p>
                        </TooltipContent>
                      </TooltipPrimitive.Portal>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
              </div>
              <Switch
                id='trending'
                checked={settings.trending}
                onCheckedChange={(checked) =>
                  handleFilterChange('trending', checked)
                }
                className='data-[state=checked]:bg-primary'
              />
            </div>

            {/* Signal Range */}
            <div className='mb-4 flex items-center justify-between'>
              <Label className='flex items-center gap-1 text-sm text-zinc-700 dark:text-zinc-300'>
                Минимальное количество сигналов
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div className='inline-flex h-4 w-4 items-center justify-center rounded-full'>
                        <IconInfoCircle className='h-3.5 w-3.5 flex-shrink-0 cursor-help text-zinc-700 dark:text-zinc-300' />
                      </div>
                    </TooltipTrigger>
                    <TooltipPrimitive.Portal>
                      <TooltipContent
                        side='bottom'
                        sideOffset={5}
                        className='max-w-[150px] px-3 py-2'
                      >
                        <p className='text-xs text-zinc-200 dark:text-zinc-700'>
                          Фильтровать стартапы по количеству сигналов
                        </p>
                      </TooltipContent>
                    </TooltipPrimitive.Portal>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className='w-[60%]'>
                <Slider.Root
                  className='relative flex h-5 w-full cursor-pointer touch-none items-center select-none'
                  value={[
                    parseInt(settings.min_sig || '1'),
                    parseInt(settings.max_sig || '20')
                  ]}
                  min={1}
                  max={20}
                  step={1}
                  minStepsBetweenThumbs={1}
                  onValueChange={handleSliderChange}
                >
                  <Slider.Track className='bg-muted relative h-1.5 grow rounded-full'>
                    <Slider.Range className='bg-primary absolute h-full rounded-full' />
                  </Slider.Track>
                  <Slider.Thumb
                    className='border-primary bg-background block h-4 w-4 rounded-full border-2 hover:scale-110 focus:outline-none'
                    aria-label='Min value'
                  />
                  <Slider.Thumb
                    className='border-primary bg-background block h-4 w-4 rounded-full border-2 hover:scale-110 focus:outline-none'
                    aria-label='Max value'
                  />
                </Slider.Root>
                <div className='mt-1 flex justify-between'>
                  <span className='text-xs text-zinc-600 dark:text-zinc-400'>
                    {settings.min_sig || '1'}
                  </span>
                  <span className='text-xs text-zinc-600 dark:text-zinc-400'>
                    {settings.max_sig === '20' ? '∞' : settings.max_sig || '20'}
                  </span>
                </div>
              </div>
            </div>

            {/* Период получения проектов */}
            <div className='space-y-3'>
              <Label className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                Date When First Signal Was Received
              </Label>

              {/* Quick preset buttons - скрываем при New Startups */}
              {!isNewProjectsActive && (
                <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      const today = new Date();
                      const lastWeek = new Date(today);
                      lastWeek.setDate(today.getDate() - 7);
                      handleFilterChange('start_date', lastWeek);
                      handleFilterChange('end_date', today);
                    }}
                    className='h-8 text-xs font-medium'
                  >
                    Last 7 days
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      const today = new Date();
                      const lastMonth = new Date(today);
                      lastMonth.setDate(today.getDate() - 30);
                      handleFilterChange('start_date', lastMonth);
                      handleFilterChange('end_date', today);
                    }}
                    className='h-8 text-xs font-medium'
                  >
                    Last 30 days
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      const today = new Date();
                      const lastQuarter = new Date(today);
                      lastQuarter.setDate(today.getDate() - 90);
                      handleFilterChange('start_date', lastQuarter);
                      handleFilterChange('end_date', today);
                    }}
                    className='h-8 text-xs font-medium'
                  >
                    Last 3 months
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      handleFilterChange('start_date', undefined);
                      handleFilterChange('end_date', undefined);
                    }}
                    className='h-8 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400'
                  >
                    Clear dates
                  </Button>
                </div>
              )}

              {/* Current selection display - скрываем при New Startups */}
              {!isNewProjectsActive && (
                <div className='rounded border p-3 text-sm'>
                  <div className='flex items-center justify-between'>
                    <div className='min-w-0 flex-1'>
                      <div
                        className={`font-normal ${!(settings.start_date || settings.end_date) ? 'text-muted-foreground' : ''}`}
                      >
                        {settings.start_date || settings.end_date ? (
                          <>
                            {settings.start_date &&
                            !isNaN(settings.start_date.getTime())
                              ? format(settings.start_date, 'MMM dd, yyyy', {
                                  locale: enGB
                                })
                              : 'No start date'}
                            {' → '}
                            {settings.end_date &&
                            !isNaN(settings.end_date.getTime())
                              ? format(settings.end_date, 'MMM dd, yyyy', {
                                  locale: enGB
                                })
                              : 'No end date'}
                          </>
                        ) : (
                          'Select start date → Select end date'
                        )}
                      </div>
                    </div>
                    {(settings.start_date || settings.end_date) && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          handleFilterChange('start_date', undefined);
                          handleFilterChange('end_date', undefined);
                        }}
                        className='ml-2 h-6 w-6 flex-shrink-0 p-0'
                      >
                        <IconX className='h-3 w-3' />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Status message */}
              {isNewProjectsActive && (
                <div className='rounded-lg border-2 border-dashed border-zinc-200 p-3 text-center text-zinc-400 dark:border-zinc-700 dark:text-zinc-600'>
                  <div className='text-sm'>
                    📅 Фильтрация по дате отключена для режима "Недавно добавленные"
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Calendar section */}
          <div className={rightColumnClasses}>
            <div className='space-y-4'>
              <div
                className={`relative flex justify-center overflow-hidden rounded-lg border ${
                  isNewProjectsActive ? 'pointer-events-none' : ' '
                }`}
              >
                <Calendar
                  mode='range'
                  selected={{
                    from: settings.start_date,
                    to: settings.end_date
                  }}
                  onSelect={(range) => {
                    if (range && !isNewProjectsActive) {
                      console.log('📅 Calendar range selected:', range);
                      handleFilterChange('start_date', range.from);
                      handleFilterChange('end_date', range.to || range.from);
                    }
                  }}
                  numberOfMonths={monthsToShow}
                  defaultMonth={
                    new Date(
                      new Date().getFullYear(),
                      new Date().getMonth() - 1,
                      1
                    )
                  }
                  locale={enGB}
                  className={`p-3 ${isNewProjectsActive ? 'pointer-events-none opacity-100 blur-[2px]' : ''}`}
                  showOutsideDays={false}
                  disabled={isNewProjectsActive}
                />

                {isNewProjectsActive && (
                  <div className='absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-zinc-900/40'>
                    <div className='text-center text-sm'>
                      <IconLock className='text-primary mx-auto mb-2 h-6 w-6' />
                      <div className='font-medium'>
                        Фильтрация по дате недоступна
                      </div>
                      <div>Отключите "Недавно добавленные" для использования пользовательских дат</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className={buttonContainerClasses}>
        <Button
          variant='outline'
          size='sm'
          onClick={handleReset}
          disabled={isResetting}
        >
          {isResetting && <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />}
          Reset
        </Button>
        <Button
          size='sm'
          onClick={() => {
            console.log('📅 Apply button clicked!');
            handleApply();
          }}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}

// Компонент для встроенного отображения
export function FeedSettingsInline({
  onApply,
  onReset,
  onClose,
  initialSettings = {},
  title = 'Feed Settings',
  isNewProjectsActive = false
}: FeedSettingsProps) {
  return (
    <FeedSettings
      onApply={onApply}
      onReset={onReset}
      onClose={onClose}
      initialSettings={initialSettings}
      title={title}
      isNewProjectsActive={isNewProjectsActive}
    />
  );
}
