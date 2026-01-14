import React from 'react';
import { Badge } from '@/components/ui/badge';
import { IconCoin, IconCalendar, IconUsers } from '@tabler/icons-react';
import { CardDetails } from '../../../types/cards';
import { getRelativeDate } from '../../../utils/formatting';
import { Skeleton } from '@/components/ui/skeleton';

interface CardFundingTabProps {
  detailedCard: CardDetails | null;
  isLoading?: boolean;
}

export const CardFundingTab: React.FC<CardFundingTabProps> = ({
  detailedCard,
  isLoading = false
}) => {
  // Check for funding data availability
  const hasFundingData =
    detailedCard?.funding &&
    ((detailedCard.funding.rounds && detailedCard.funding.rounds.length > 0) ||
      detailedCard.funding.total_raised ||
      detailedCard.funding.latest_round);

  return (
    <div className='space-y-3 pb-4'>
      {/* Funding section - Always show */}
      <div className='rounded-md border border-zinc-200 p-3 dark:border-zinc-700'>
        <h6 className='mb-2 text-xs font-medium'>Финансирование</h6>
        {!detailedCard || isLoading ? (
          <>
            {/* General funding information skeleton */}
            <div className='space-y-2 mb-4'>
              <div className='flex items-center text-xs text-zinc-500'>
                <IconCoin className='mr-2 h-4 w-4' />
                <Skeleton className='h-3 w-32' />
              </div>
              <div className='flex items-center text-xs text-zinc-500'>
                <IconCalendar className='mr-2 h-4 w-4' />
                <Skeleton className='h-3 w-28' />
              </div>
            </div>

            {/* Funding rounds skeleton */}
            <div className='space-y-3'>
              <h6 className='text-xs font-medium'>Раунды финансирования</h6>
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className='rounded-md border border-zinc-200 p-3 dark:border-zinc-700'
                >
                  <div className='flex flex-wrap items-center gap-2 mb-2'>
                    <Skeleton className='h-5 w-16' />
                    <Skeleton className='h-3 w-20' />
                    <Skeleton className='h-3 w-16' />
                  </div>
                  <Skeleton className='h-3 w-full mb-2' />
                  <div>
                    <h6 className='text-xs font-medium mb-1'>Инвесторы</h6>
                    <div className='flex flex-wrap gap-1'>
                      <Skeleton className='h-5 w-16' />
                      <Skeleton className='h-5 w-20' />
                      <Skeleton className='h-5 w-18' />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : hasFundingData ? (
          <>
            {/* General funding information */}
            {(detailedCard?.funding?.total_raised ||
              detailedCard?.funding?.latest_round) && (
              <div className='space-y-2 mb-4'>
                {detailedCard?.funding?.total_raised && (
                  <div className='flex items-center text-xs text-zinc-500'>
                    <IconCoin className='mr-2 h-4 w-4' />
                    <span>
                      Total Raised: {detailedCard.funding.total_raised}
                    </span>
                  </div>
                )}
                {detailedCard?.funding?.latest_round && (
                  <div className='flex items-center text-xs text-zinc-500'>
                    <IconCalendar className='mr-2 h-4 w-4' />
                    <span>
                      Latest Round: {detailedCard.funding.latest_round}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Funding rounds */}
            {detailedCard?.funding?.rounds && detailedCard.funding.rounds.length > 0 && (
              <div className='space-y-3'>
                <h6 className='text-xs font-medium'>Раунды финансирования</h6>
                {detailedCard.funding.rounds.map((round, index) => (
                  <div
                    key={index}
                    className='rounded-md border border-zinc-200 p-3 dark:border-zinc-700'
                  >
                    <div className='flex flex-wrap items-center gap-2 mb-2'>
                      <Badge variant='outline' className='text-xs'>
                        {round.type}
                      </Badge>
                      {round.amount && (
                        <span className='text-xs font-medium'>{round.amount}</span>
                      )}
                      {round.date && (
                        <span className='text-xs text-zinc-500'>
                          {getRelativeDate(round.date)}
                        </span>
                      )}
                    </div>

                    {round.description && (
                      <p className='text-xs text-zinc-600 dark:text-zinc-400 mb-2'>
                        {round.description}
                      </p>
                    )}

                    {round.investors && round.investors.length > 0 && (
                      <div>
                        <h6 className='text-xs font-medium mb-1'>Инвесторы</h6>
                        <div className='flex flex-wrap gap-1'>
                          {round.investors.map((investor, idx) => (
                            <Badge
                              key={idx}
                              variant='secondary'
                              className='text-xs'
                            >
                              {investor.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : detailedCard ? (
          <div className='text-center'>
            <span className='text-xs text-zinc-500'>No funding data available</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};
