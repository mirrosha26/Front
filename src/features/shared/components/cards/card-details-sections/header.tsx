import React from 'react';
import { Badge } from '@/components/ui/badge';
import { LinksInline } from '@/features/shared/components/ui/actions/links-inline';
import { DeleteButton } from '@/features/shared/components/ui/actions/delete';
import { RestoreButton } from '@/features/shared/components/ui/actions/restore';
import { LikeButton } from '@/features/shared/components/ui/actions/like';
import { ShareButton } from '@/features/shared/components/ui/actions/share';
import { getRoundStatusIcon } from '@/features/shared/components/ui/round-icons';
import { getStageIcon } from '@/features/shared/components/ui/stage-icons';
import { Button } from '@/components/ui/button';
import { IconUsers, IconMapPin, IconClock } from '@tabler/icons-react';
import { getRelativeDate } from '@/features/shared/utils/formatting';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { RequestContactButton } from '@/features/shared/components/ui/actions/request-contact';
import { SmoothImage } from '../../ui/smooth-image';

interface CardDetailsHeaderProps {
  cardImage?: string;
  cardTitle: string;
  cardDescription: string;
  cardStage?: string;
  cardRoundStatus?: string;
  cardRoundStatusKey?: string;
  cardLastRound?: string;
  cardLocation?: string;
  cardCategories?: any[];
  mainUrl?: string;
  socialLinks?: any[];
  variant?: 'default' | 'deleted';
  isLiked: boolean;
  isLoading: boolean;
  onToggleLike: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onShare?: () => void;
  hideDeleteButton?: boolean;
  hasTicket?: boolean;
  onContactRequest?: () => void;
}

export const CardDetailsHeader: React.FC<CardDetailsHeaderProps> = ({
  cardImage,
  cardTitle,
  cardDescription,
  cardStage,
  cardRoundStatus,
  cardRoundStatusKey = 'unknown',
  cardLastRound,
  cardLocation,
  cardCategories,
  mainUrl,
  socialLinks,
  variant = 'default',
  isLiked,
  isLoading,
  onToggleLike,
  onDelete,
  onRestore,
  onShare,
  hideDeleteButton = false,
  hasTicket = false,
  onContactRequest
}) => {
  // Функция для преобразования текста со ссылками
  const renderTextWithLinks = (text: string) => {
    if (!text) return text;

    // Регулярное выражение для поиска URL
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        // Извлекаем домен и путь из URL
        const getDomainWithPath = (url: string) => {
          try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.replace('www.', '');
            const pathname = urlObj.pathname === '/' ? '' : urlObj.pathname;
            return hostname + pathname;
          } catch (error) {
            // Если URL некорректный, возвращаем исходную строку
            console.error('Error parsing URL in renderTextWithLinks:', error);
            return url;
          }
        };

        return (
          <a
            key={index}
            href={part}
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary hover:text-primary/80 underline'
            onClick={(e) => e.stopPropagation()}
          >
            {getDomainWithPath(part)}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className='flex flex-col gap-3 lg:grid lg:grid-cols-12 lg:gap-3 select-text'>
      <div className='flex items-start space-x-3 lg:col-span-8'>
        <div className='h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border-2 border-border bg-muted lg:h-16 lg:w-16'>
          {cardImage ? (
            <SmoothImage
              src={cardImage}
              alt={cardTitle}
              className='h-full w-full object-cover'
              containerClassName='h-full w-full'
              fallback={
                <div className='flex h-full w-full items-center justify-center'>
                <span className='text-lg font-medium text-zinc-500'>
                  {cardTitle.charAt(0)}
                </span>
                </div>
              }
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center'>
            <span className='text-lg font-medium text-zinc-500'>
              {cardTitle.charAt(0)}
            </span>
            </div>
          )}
        </div>
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h2 className='text-sm font-medium'>{cardTitle}</h2>
            {cardStage && cardStage !== 'Unknown' && (
              <Badge variant='secondary' className='text-xs select-none'>
                {cardStage}
              </Badge>
            )}
            {cardRoundStatus && cardRoundStatus !== 'Unknown' && (
              <Badge
                variant='secondary'
                className='flex items-center gap-1 text-xs select-none'
              >
                {getRoundStatusIcon(cardRoundStatusKey || 'unknown')}
                {cardRoundStatus}
              </Badge>
            )}
            {/* Categories inline with badges */}
            {cardCategories && cardCategories.length > 0 && (
              <>
                {cardCategories.map((category, index) => (
                  <Badge
                    key={`category-${category.id || category.slug || index}-${category.name}`}
                    variant='outline'
                    className='border-zinc-300 text-xs text-zinc-600 dark:border-zinc-600 dark:text-zinc-300'
                  >
                    {category.name}
                  </Badge>
                ))}
              </>
            )}
          </div>

          <p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
            {renderTextWithLinks(cardDescription)}
          </p>

          <div className='mt-2 flex flex-wrap gap-3'>
            {cardLocation && cardLocation.toLowerCase() !== 'unknown' && (
              <div className='flex items-center gap-1'>
                <IconMapPin className='h-3 w-3 text-zinc-500 dark:text-zinc-400' />
                <span className='text-xs text-zinc-500 dark:text-zinc-400'>
                  {cardLocation}
                </span>
              </div>
            )}

            {cardLastRound && (
              <div className='flex items-center gap-1'>
                <IconClock className='h-3 w-3 text-zinc-500 dark:text-zinc-400' />
                <span className='text-xs text-zinc-500 dark:text-zinc-400'>
                  Last round:{' '}
                  {getRelativeDate(new Date(cardLastRound).toString())}
                </span>
              </div>
            )}
          </div>

          <LinksInline
            mainUrl={mainUrl}
            socialLinks={socialLinks}
            className='mt-2'
          />

          {/* Actions for mobile - hidden on large screens */}
          <div className='flex gap-1.5 mt-3 lg:hidden'>
            {/* Contact request button */}
            {onContactRequest && (
              <RequestContactButton
                onClick={onContactRequest}
                hasTicket={hasTicket}
                isLoading={isLoading}
                variant='details'
              />
            )}

            {/* Share button */}
            {onShare && <ShareButton onClick={onShare} variant='details' />}

            {/* Restore button (only for deleted cards) */}
            {variant === 'deleted' && (
              <RestoreButton
                onClick={onRestore}
                isLoading={isLoading}
                variant='details'
              />
            )}

            {/* Delete button (only for non-deleted cards and if hideDeleteButton is not specified) */}
            {variant !== 'deleted' && !hideDeleteButton && (
              <DeleteButton
                onClick={onDelete}
                isLoading={isLoading}
                variant='details'
              />
            )}

            {/* Like button (only for non-deleted cards) */}
            {variant !== 'deleted' && (
              <LikeButton
                onClick={onToggleLike}
                isLiked={isLiked}
                isLoading={isLoading}
                variant='details'
              />
            )}
          </div>
        </div>
      </div>

      {/* Categories section - removed, now inline with badges */}
      {/* Action buttons group - hidden on mobile, visible on large screens */}
      <div className='hidden lg:flex items-start justify-end w-full lg:col-span-4'>
        <div className='flex gap-1.5'>
          {/* Contact request button */}
          {onContactRequest && (
            <RequestContactButton
              onClick={onContactRequest}
              hasTicket={hasTicket}
              isLoading={isLoading}
              variant='details'
            />
          )}

          {/* Share button */}
          {onShare && <ShareButton onClick={onShare} variant='details' />}

          {/* Restore button (only for deleted cards) */}
          {variant === 'deleted' && (
            <RestoreButton
              onClick={onRestore}
              isLoading={isLoading}
              variant='details'
            />
          )}

          {/* Delete button (only for non-deleted cards and if hideDeleteButton is not specified) */}
          {variant !== 'deleted' && !hideDeleteButton && (
            <DeleteButton
              onClick={onDelete}
              isLoading={isLoading}
              variant='details'
            />
          )}

          {/* Like button (only for non-deleted cards) */}
          {variant !== 'deleted' && (
            <LikeButton
              onClick={onToggleLike}
              isLiked={isLiked}
              isLoading={isLoading}
              variant='details'
            />
          )}
        </div>
      </div>
    </div>
  );
};
