import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { IconCalendar, IconMail } from '@tabler/icons-react';
import { SocialIcon } from '../../ui/social-icon';
import { CardDetails } from '../../../types/cards';
import { getSocialIconName } from '../../../utils/formatting';
import { Skeleton } from '@/components/ui/skeleton';
import { AvatarSkeleton } from '../../ui/avatar-skeleton';
import { cn } from '@/lib/utils';

interface CardTeamTabProps {
  detailedCard: CardDetails | null;
  isLoading?: boolean;
}

export const CardTeamTab: React.FC<CardTeamTabProps> = ({
  detailedCard,
  isLoading = false
}) => {
  return (
    <div className='space-y-3 pb-4'>
      {/* Team section - Always show */}
      <div className='rounded-md border border-zinc-200 p-3 dark:border-zinc-700'>
        <h6 className='mb-2 text-xs font-medium'>Team</h6>
        {!detailedCard || isLoading ? (
          <div className='space-y-3'>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className='flex items-start gap-3'>
                <AvatarSkeleton count={1} size='md' />
                <div className='min-w-0 flex-1'>
                  <div className='mb-1 flex flex-wrap items-center gap-1'>
                    <Skeleton className='h-3 w-24' />
                    <Skeleton className='h-4 w-16' />
                  </div>
                  <Skeleton className='mb-2 h-3 w-full' />
                  <div className='flex flex-wrap gap-2'>
                    <Skeleton className='h-3 w-20' />
                    <Skeleton className='h-3 w-16' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : detailedCard.people && detailedCard.people.length > 0 ? (
          <div className='space-y-3'>
            {detailedCard.people.map((person, index) => (
              <div key={index} className='flex items-start gap-3'>
                <Avatar
                  className='h-10 w-10 flex-shrink-0'
                  variant={
                    person.is_private
                      ? 'private'
                      : person.is_saved
                        ? 'followed'
                        : 'default'
                  }
                >
                  {person.image_url && (
                    <AvatarImage src={person.image_url} alt={person.name} />
                  )}
                  {person.image && (
                    <AvatarImage src={person.image} alt={person.name} />
                  )}
                  <AvatarFallback>{person.name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center gap-1'>
                    <h5 className='truncate text-xs font-medium'>
                      {person.name}
                    </h5>
                    <Badge variant='outline' className='h-4 px-1 text-[10px]'>
                      {person.type}
                    </Badge>
                  </div>

                  {person.bio && (
                    <p className='mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400'>
                      {person.bio}
                    </p>
                  )}

                  <div className='mt-2 flex flex-wrap gap-2'>
                    {person.email && (
                      <a
                        href={`mailto:${person.email}`}
                        className='flex items-center text-[10px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300'
                      >
                        <SocialIcon name='email' className='mr-1 h-3 w-3' />
                        <span className='truncate'>{person.email}</span>
                      </a>
                    )}

                    {person.twitter_url && (
                      <a
                        href={person.twitter_url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex items-center text-[10px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300'
                      >
                        <SocialIcon name='twitter' className='mr-1 h-3 w-3' />
                        <span>Twitter</span>
                      </a>
                    )}

                    {person.linkedin_url && (
                      <a
                        href={person.linkedin_url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex items-center text-[10px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300'
                      >
                        <SocialIcon name='linkedin' className='mr-1 h-3 w-3' />
                        <span>LinkedIn</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : detailedCard ? (
          <div className='text-center'>
            <span className='text-xs text-zinc-500'>
              No team data available
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
};
