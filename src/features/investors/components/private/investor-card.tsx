'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { IconLock } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { PrivateInvestor } from '../../types';
import { usePrivateInvestors } from '../../contexts/private-investors-context';

interface InvestorCardProps {
  investor: PrivateInvestor;
}

export const InvestorCard = ({ investor }: InvestorCardProps) => {
  const { followPrivateInvestor, unfollowPrivateInvestor } =
    usePrivateInvestors();
  const [isProcessing, setIsProcessing] = useState(false);

  // Get initials for avatar
  const getInitials = () => {
    return investor.name.charAt(0).toUpperCase();
  };

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      let success;
      if (investor.is_subscribed) {
        success = await unfollowPrivateInvestor(investor.id);
      } else {
        success = await followPrivateInvestor(investor.id);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className={cn(
        'bg-card border-border relative mb-2 overflow-hidden rounded-lg border p-4',
        investor.is_subscribed && 'bg-primary/4'
      )}
    >
      <div className='flex w-full items-center'>
        <div className='flex flex-1 items-center'>
          <Avatar className='mr-4 h-10 w-10 flex-shrink-0' variant='private'>
            <AvatarImage src={investor.image} alt={investor.name} />
            <AvatarFallback className='text-muted-foreground text-lg'>
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1'>
            <div className='flex items-center'>
              <p className='text-lg font-bold'>{investor.name}</p>
              {investor.is_private && (
                <IconLock className='ml-1 h-3.5 w-3.5 text-lime-500' />
              )}
              <Badge variant='default' className='mr-4 ml-2 flex items-center'>
                {investor.type}
              </Badge>
            </div>
            <p className='text-sm text-gray-500'>
              Number of cards: {investor.num_cards}
            </p>
          </div>
        </div>

        <Button
          variant={investor.is_subscribed ? 'outline' : 'default'}
          onClick={handleFollowToggle}
          disabled={isProcessing}
        >
          {isProcessing
            ? investor.is_subscribed
              ? 'Unfollowing...'
              : 'Following...'
            : investor.is_subscribed
              ? 'Unfollow'
              : 'Follow'}
        </Button>
      </div>
    </div>
  );
};
