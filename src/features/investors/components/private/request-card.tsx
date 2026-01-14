'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  IconTrash,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandProducthunt,
  IconChevronDown
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { PrivateInvestorRequest } from '../../types';

interface RequestCardProps {
  request: PrivateInvestorRequest;
  isProcessing: boolean;
  onDelete: (id: number) => Promise<boolean>;
}

export const RequestCard = ({
  request,
  isProcessing,
  onDelete
}: RequestCardProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSocialLinks, setShowSocialLinks] = useState(false);

  const handleDeleteClick = () => setShowDeleteConfirm(true);
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    const success = await onDelete(request.id);
    if (!success) {
      setShowDeleteConfirm(false);
    }
    setIsDeleting(false);
  };
  const handleDeleteDeny = () => setShowDeleteConfirm(false);

  // Get initials for avatar
  const getInitials = () => {
    return request.name.charAt(0).toUpperCase();
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Check if has social links
  const hasSocialLinks =
    request.twitter_headline ||
    request.linkedin_headline ||
    request.product_hunt_headline;

  return (
    <div className='bg-card border-border relative mb-2 overflow-hidden rounded-lg border'>
      <div className='flex w-full items-center p-4'>
        <div className='flex flex-1 items-center'>
          <Avatar className='mr-4 h-10 w-10 flex-shrink-0' variant='default'>
            <AvatarFallback className='bg-muted text-muted-foreground text-lg'>
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1'>
            <div className='flex items-center'>
              <p className='text-lg font-bold'>{request.name}</p>
              <Badge
                variant={isProcessing ? 'secondary' : 'default'}
                className='mr-4 ml-2'
              >
                {isProcessing ? 'Processing' : 'Pending'}
              </Badge>
            </div>
            <div className='text-muted-foreground flex flex-wrap gap-2 text-xs'>
              {request.created_at && (
                <p>Created: {formatDate(request.created_at)}</p>
              )}
            </div>
          </div>

          <div className='flex items-center gap-2'>
            {hasSocialLinks && (
              <Button
                variant='outline'
                onClick={() => setShowSocialLinks(!showSocialLinks)}
              >
                <div className='flex items-center'>
                  Social Links
                  <IconChevronDown
                    className={`ml-2 h-4 w-4 transition-transform ${showSocialLinks ? 'rotate-180' : ''}`}
                  />
                </div>
              </Button>
            )}

            {!isProcessing && (
              <>
                {showDeleteConfirm ? (
                  <div className='flex items-center gap-2'>
                    <p className='text-muted-foreground text-sm'>
                      Are you sure?
                    </p>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={handleDeleteConfirm}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Yes, delete'}
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleDeleteDeny}
                      disabled={isDeleting}
                    >
                      No
                    </Button>
                  </div>
                ) : (
                  <Button variant='outline' onClick={handleDeleteClick}>
                    <IconTrash className='mr-2 h-4 w-4' />
                    Delete
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {hasSocialLinks && showSocialLinks && (
        <div className='border-border border-t px-4 pt-0 pb-4'>
          <div className='space-y-3 pt-3'>
            {request.twitter_headline && (
              <div className='flex items-center gap-2'>
                <IconBrandX className='text-foreground h-4 w-4' />
                <p className='text-sm'>X: {request.twitter_headline}</p>
              </div>
            )}
            {request.linkedin_headline && (
              <div className='flex items-center gap-2'>
                <IconBrandLinkedin className='text-foreground h-4 w-4' />
                <p className='text-sm'>LinkedIn: {request.linkedin_headline}</p>
              </div>
            )}
            {request.product_hunt_headline && (
              <div className='flex items-center gap-2'>
                <IconBrandProducthunt className='text-foreground h-4 w-4' />
                <p className='text-sm'>
                  Product Hunt: {request.product_hunt_headline}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
