'use client';

import { Investor } from '../../types';
import { InvestorCard } from './investor-card';
import { Skeleton } from '@/components/ui/skeleton';
import { AvatarSkeleton } from '@/features/shared/components/ui/avatar-skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { IconAlertCircle } from '@tabler/icons-react';
import { memo, useMemo, useState, useEffect } from 'react';

interface InvestorListProps {
  investors: Investor[];
  isLoading: boolean;
  onFollow?: (id: number) => Promise<boolean>;
  onUnfollow?: (id: number) => Promise<boolean>;
  filter?: 'all' | 'following' | 'available';
}

const BATCH_SIZE = 12; // Размер пакета для рендеринга

// Мемоизируем скелетон карточки
const InvestorCardSkeleton = memo(function InvestorCardSkeleton() {
  return (
    <div className='bg-card border-border flex h-full flex-col rounded-lg border p-3'>
      <div className='mb-3 flex items-start gap-3'>
        <AvatarSkeleton count={1} size='md' />
        <div className='flex flex-1 flex-col gap-1'>
          <div className='flex items-center gap-1'>
            <Skeleton className='h-4 w-32 opacity-50' />
          </div>
          <Skeleton className='h-3 w-16 opacity-50' />
        </div>
      </div>
      <Skeleton className='mb-3 h-4 w-full opacity-50' />
      <Skeleton className='mt-auto h-8 w-full opacity-50' />
    </div>
  );
});

// Мемоизируем пакет карточек
const InvestorBatch = memo(function InvestorBatch({ 
  investors 
}: { 
  investors: Investor[] 
}) {
  return (
    <>
      {investors.map((investor) => (
        <InvestorCard key={investor.id} investor={investor} />
      ))}
    </>
  );
});

export function InvestorList({
  investors,
  isLoading,
  onFollow,
  onUnfollow,
  filter = 'all'
}: InvestorListProps) {
  const [visibleBatches, setVisibleBatches] = useState(1);

  // Фильтруем инвесторов
  const filteredInvestors = useMemo(() => {
    return filter === 'all'
      ? investors
      : filter === 'following'
        ? investors.filter((investor) => investor.is_followed)
        : investors.filter((investor) => !investor.is_followed);
  }, [investors, filter]);

  // Разбиваем на пакеты
  const investorBatches = useMemo(() => {
    const batches = [];
    for (let i = 0; i < filteredInvestors.length; i += BATCH_SIZE) {
      batches.push(filteredInvestors.slice(i, i + BATCH_SIZE));
    }
    return batches;
  }, [filteredInvestors]);

  // Показываем инвесторов по пакетам
  const visibleInvestors = useMemo(() => {
    return investorBatches.slice(0, visibleBatches).flat();
  }, [investorBatches, visibleBatches]);

  // Автоматически загружаем следующий пакет при скролле
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000 // Загружаем за 1000px до конца
      ) {
        setVisibleBatches(prev => 
          Math.min(prev + 1, investorBatches.length)
        );
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [investorBatches.length]);

  // Сбрасываем видимые пакеты при изменении фильтра
  useEffect(() => {
    setVisibleBatches(1);
  }, [filter]);

  // Если нет инвесторов и не идет загрузка
  if (filteredInvestors.length === 0 && !isLoading) {
    return (
      <Alert>
        <IconAlertCircle className='h-4 w-4' />
        <AlertTitle>No investors found</AlertTitle>
        <AlertDescription>
          There are no investors in this category. Try changing your search
          parameters or filters.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {isLoading ? (
          // Показываем скелетоны во время загрузки на всю ширину сетки
          Array.from({ length: BATCH_SIZE }).map((_, index) => (
            <InvestorCardSkeleton key={`skeleton-${index}`} />
          ))
        ) : (
          // Рендерим видимые пакеты
          investorBatches.slice(0, visibleBatches).map((batch, batchIndex) => (
            <InvestorBatch 
              key={`batch-${batchIndex}`} 
              investors={batch} 
            />
          ))
        )}
      </div>

      {/* Показываем индикатор загрузки следующего пакета */}
      {!isLoading && visibleBatches < investorBatches.length && (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {Array.from({ length: Math.min(BATCH_SIZE, filteredInvestors.length - visibleInvestors.length) }).map((_, index) => (
            <InvestorCardSkeleton key={`loading-${index}`} />
          ))}
        </div>
      )}
    </div>
  );
}
