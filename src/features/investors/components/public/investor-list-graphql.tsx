'use client';

import { useState } from 'react';
import { Participant } from '@/lib/graphql/types';
import { InvestorCardGraphQL } from './investor-card-graphql';
import { InvestorDetailModal } from './investor-detail-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { AvatarSkeleton } from '@/features/shared/components/ui/avatar-skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { IconAlertCircle } from '@tabler/icons-react';
import { memo } from 'react';

interface InvestorListGraphQLProps {
  investors: Participant[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  onPreviewSignals?: (investor: Participant) => void;
  onToggleFollow?: (investorId: string) => Promise<void>;
}

const BATCH_SIZE = 20;

const InvestorCardSkeleton = memo(function InvestorCardSkeleton() {
  return (
    <div className='bg-card border-border flex h-full flex-col rounded-lg border p-3'>
      <div className='mb-3 flex items-start gap-3'>
        <AvatarSkeleton count={1} size='md' />
        <div className='flex flex-1 flex-col gap-1'>
          <Skeleton className='h-4 w-32 opacity-50' />
          <Skeleton className='h-3 w-16 opacity-50' />
        </div>
      </div>
      <Skeleton className='mb-3 h-4 w-full opacity-50' />
      <div className='mt-auto flex flex-col gap-2'>
        <Skeleton className='h-7 w-full opacity-50' />
        <Skeleton className='h-7 w-full opacity-50' />
      </div>
    </div>
  );
});

export function InvestorListGraphQL({
  investors,
  isLoading,
  isLoadingMore,
  onPreviewSignals,
  onToggleFollow
}: InvestorListGraphQLProps) {
  const [modalSlug, setModalSlug] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (slug: string) => {
    setModalSlug(slug);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalSlug(null);
  };

  if (investors.length === 0 && !isLoading && !isLoadingMore) {
    return (
      <Alert>
        <IconAlertCircle className='h-4 w-4' />
        <AlertTitle>No investors found</AlertTitle>
        <AlertDescription>
          There are no investors matching your current filters. Try changing your search parameters.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className='space-y-4 w-full'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 w-full'>
          {/* Показываем существующие данные */}
          {investors.length > 0 && investors.map((investor) => (
            <InvestorCardGraphQL
              key={investor.id}
              investor={investor}
              onPreviewSignals={onPreviewSignals}
              onToggleFollow={onToggleFollow}
              onOpenModal={handleOpenModal}
            />
          ))}
          
          {/* Показываем скелетон только при загрузке новых данных */}
          {isLoadingMore && Array.from({ length: 6 }).map((_, index) => (
            <InvestorCardSkeleton key={`skeleton-more-${index}`} />
          ))}
          
          {/* Показываем скелетон только при первоначальной загрузке */}
          {isLoading && investors.length === 0 && Array.from({ length: BATCH_SIZE }).map((_, index) => (
            <InvestorCardSkeleton key={`skeleton-initial-${index}`} />
          ))}
        </div>
      </div>

      {modalSlug && (
        <InvestorDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          slug={modalSlug}
        />
      )}
    </>
  );
}
