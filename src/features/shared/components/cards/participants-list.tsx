import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Participant {
  name: string;
  image?: string;
  is_private?: boolean;
  is_saved?: boolean;
}

interface ParticipantsListProps {
  participants: Participant[];
  hasMore?: boolean;
  moreCount?: number;
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  hasMore = false,
  moreCount = 0
}) => {
  // Ограничиваем количество аватаров до 6
  const visibleParticipants = participants.slice(0, 6);
  const remainingCount = participants.length - 6;

  return (
    <div className='flex items-center justify-end'>
      <div className='flex -space-x-5'>
        {visibleParticipants.map((participant, index) => {
          const variant = participant.is_private
            ? 'private'
            : participant.is_saved
              ? 'followed'
              : 'default';
          const tooltipVariant = 'theme';

          // Check if this is the last item and there's no counter
          const isLastItem = index === visibleParticipants.length - 1;
          const hasCounter = hasMore && moreCount > 0;
          const isLastWithoutCounter = isLastItem && !hasCounter;

          return (
            <TooltipProvider delayDuration={0} key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar
                    key={index}
                    className={`h-9 w-9 hover:z-10 hover:-translate-y-1 hover:shadow-md ${
                      isLastWithoutCounter ? 'pr-0' : ''
                    }`}
                    variant={variant}
                  >
                    <AvatarImage
                      src={participant.image || ''}
                      alt={participant.name}
                    />
                    <AvatarFallback className='bg-muted text-muted-foreground text-sm'>
                      {participant.name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent variant={tooltipVariant} side='bottom' className='w-max max-w-[250px]'>
                  {participant.name}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}

        {hasMore && moreCount > 0 && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className='h-9 w-9' variant='more'>
                  <AvatarFallback className='text-xs'>
                    +{Math.max(moreCount, remainingCount)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent variant='theme' side='bottom' className='w-max max-w-[250px]'>
                {Math.max(moreCount, remainingCount)} more interested investors
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};
