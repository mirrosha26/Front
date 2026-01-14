import React, { useRef, useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { AvatarSkeleton } from '../../ui/avatar-skeleton';
import {
  IconCalendar,
  IconActivity,
  IconLoader2,
  IconLink
} from '@tabler/icons-react';
import { CardDetails, CardPreview } from '../../../types/cards';
import {
  getRelativeDate,
  getSocialIconName,
  getSocialIconNameFromSource
} from '../../../utils/formatting';
import { SocialIcon } from '../../ui/social-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import Link from 'next/link';

interface CardInteractionsTabProps {
  detailedCard: CardDetails | null;
  card?: CardPreview;
  isAuthenticated?: boolean;
  isLoading?: boolean;
  onOpenInvestorModal?: (
    participantId: string,
    participantSlug: string
  ) => void;
  isPublicPage?: boolean;
}

// Utility to linkify URLs in text
function linkifyText(text: string) {
  if (!text) return text;
  // Regex to match URLs (http, https, www)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      const href = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a
          key={i}
          href={href}
          target='_blank'
          rel='noopener noreferrer'
          className='text-primary hover:text-primary/80 underline'
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

// Component to conditionally show tooltip only when text is truncated
const TruncatedText: React.FC<{
  children: React.ReactNode;
  className?: string;
  maxLines?: number;
}> = ({ children, className, maxLines = 2 }) => {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const element = textRef.current;
    if (element) {
      // Check if the element is truncated by comparing scrollHeight with clientHeight
      const lineHeight = parseInt(window.getComputedStyle(element).lineHeight);
      const maxHeight = lineHeight * maxLines;
      setIsTruncated(element.scrollHeight > maxHeight);
    }
  }, [children, maxLines]);

  const content = (
    <p ref={textRef} className={className}>
      {children}
    </p>
  );

  if (!isTruncated) {
    return content;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {React.cloneElement(content, {
            className: `${className} cursor-help`
          })}
        </TooltipTrigger>
        <TooltipContent
          variant='theme'
          side='bottom'
          align='start'
          className='w-max max-w-xs'
        >
          <div className='break-words whitespace-pre-wrap'>{children}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const CardInteractionsTab: React.FC<CardInteractionsTabProps> = ({
  detailedCard,
  card,
  isAuthenticated = true,
  isLoading = false,
  onOpenInvestorModal,
  isPublicPage = false
}) => {
  // Function to open investor modal - only for non-public pages
  const handleInvestorClick = (
    participantId: string,
    participantSlug: string
  ) => {
    if (onOpenInvestorModal && !isPublicPage) {
      onOpenInvestorModal(participantId, participantSlug);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className='space-y-3 pb-4'>
        {/* Loading skeleton for discovery information */}
        <div className='rounded-md border border-zinc-200 p-3 dark:border-zinc-700'>
          <div className='mb-2 h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700'></div>
          <div className='space-y-2'>
            <div className='flex items-center'>
              <div className='mr-2 h-4 w-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700'></div>
              <div className='h-3 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700'></div>
            </div>
            <div className='flex items-center'>
              <div className='mr-2 h-4 w-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700'></div>
              <div className='h-3 w-36 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700'></div>
            </div>
          </div>
        </div>

        {/* Loading skeleton for interactions */}
        <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className='flex flex-col rounded-md border border-zinc-200 p-3 dark:border-zinc-700'
            >
              <div className='flex items-start gap-3'>
                <AvatarSkeleton count={1} size='md' />
                <div className='min-w-0 flex-1 space-y-2'>
                  <div className='h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700'></div>
                  <div className='h-3 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-700'></div>
                  <div className='h-3 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700'></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show interactions data once loaded
  // Regular interactions view
  return (
    <div className='space-y-3 pb-4'>
      {/* Discovery and latest signal information - Always show */}
      <div className='rounded-md border border-zinc-200 p-3 dark:border-zinc-700'>
        <h6 className='mb-2 text-xs font-medium'>Информация о находке</h6>
        <div className='space-y-2'>
          {!detailedCard || isLoading ? (
            <>
              <div className='flex items-center text-xs text-zinc-600 dark:text-zinc-400'>
                <IconCalendar className='mr-2 h-4 w-4' />
                <Skeleton className='h-3 w-32' />
              </div>
              <div className='flex items-center text-xs text-zinc-600 dark:text-zinc-400'>
                <IconActivity className='mr-2 h-4 w-4' />
                <Skeleton className='h-3 w-28' />
              </div>
            </>
          ) : (
            <>
              {detailedCard?.discovered_at && (
                <div className='flex items-center text-xs text-zinc-600 dark:text-zinc-400'>
                  <IconCalendar className='mr-2 h-4 w-4' />
                  <span>
                    First discovered:{' '}
                    {getRelativeDate(detailedCard.discovered_at)}
                  </span>
                </div>
              )}
              {detailedCard?.latest_signal_date && (
                <div className='flex items-center text-xs text-zinc-600 dark:text-zinc-400'>
                  <IconActivity className='mr-2 h-4 w-4' />
                  <span>
                    Latest signal:{' '}
                    {getRelativeDate(detailedCard.latest_signal_date)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Show interactions from detailedCard or fallback to card signals */}
      {renderInteractions()}
    </div>
  );

  function renderInteractions() {
    // First try to get signals from detailedCard
    const signals = detailedCard?.signals || [];

    // If no detailed signals, try to get them from the card preview
    const fallbackSignals = card?.signals || [];

    // Combine or use the best available data
    const allSignals = signals.length > 0 ? signals : fallbackSignals;

    // Filter out founder signals - they should only appear in the Founders tab
    const interactionsToShow = allSignals.filter(
      (signal: any) =>
        signal.signalType?.slug !== 'founder' && signal.type !== 'founder'
    );

    if (interactionsToShow.length > 0) {
      return (
        <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
          {interactionsToShow.map((signal: any, index: number) => (
            <div
              key={index}
              className={`flex flex-col rounded-md border border-zinc-200 p-3 dark:border-zinc-700 ${
                isPublicPage
                  ? ''
                  : 'hover:border-zinc-300 dark:hover:border-zinc-600'
              }`}
            >
              <div className='flex items-start gap-3'>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`rounded-full transition-all duration-200 ${
                          isPublicPage
                            ? ''
                            : 'hover:ring-primary/20 cursor-pointer hover:scale-105 hover:ring-2'
                        }`}
                        onClick={() => {
                          if (!isPublicPage) {
                            const participantId =
                              signal.associated_id ||
                              signal.associatedParticipant?.id ||
                              signal.participant?.id;
                            const participantSlug =
                              signal.associated_slug ||
                              signal.associatedParticipant?.slug ||
                              signal.participant?.slug;

                            if (participantId && participantSlug) {
                              handleInvestorClick(
                                participantId,
                                participantSlug
                              );
                            }
                          }
                        }}
                      >
                        <Avatar
                          className='h-10 w-10 flex-shrink-0'
                          variant={
                            signal.associated_is_private ||
                            signal.participant?.isPrivate
                              ? 'private'
                              : signal.associated_saved ||
                                  signal.participant?.isSaved
                                ? 'followed'
                                : 'default'
                          }
                        >
                          {signal.associated_image ||
                          signal.participant?.imageUrl ? (
                            <AvatarImage
                              src={
                                signal.associated_image ||
                                signal.participant?.imageUrl ||
                                ''
                              }
                              alt={
                                signal.associated_name ||
                                signal.participant?.name ||
                                ''
                              }
                            />
                          ) : (
                            <AvatarFallback className='bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
                              {(signal.associated_name ||
                                signal.participant?.name)?.[0] || '?'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </div>
                    </TooltipTrigger>
                    {!isPublicPage && (
                      <TooltipContent
                        variant='theme'
                        side='bottom'
                        className='w-max max-w-[200px]'
                      >
                        <div className='text-center'>
                          <div className='font-medium'>
                            Click to view investor details
                          </div>
                          <div className='text-muted-foreground text-xs'>
                            Opens investor modal
                          </div>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center gap-1'>
                    {/* Main participant/associated participant name with X icon and link */}
                    {(() => {
                      const slug =
                        signal.associated_slug ||
                        signal.associatedParticipant?.slug ||
                        signal.participant?.slug;
                      const name =
                        signal.associated_name ||
                        signal.associatedParticipant?.name ||
                        signal.participant?.name ||
                        'Unknown';
                      const participantId =
                        signal.associated_id ||
                        signal.associatedParticipant?.id ||
                        signal.participant?.id;
                      return (
                        <>
                          <span
                            className={`truncate text-xs font-medium transition-colors ${
                              isPublicPage
                                ? 'cursor-default'
                                : 'hover:text-primary cursor-pointer hover:underline'
                            }`}
                            onClick={() => {
                              if (
                                !isPublicPage &&
                                participantId &&
                                slug &&
                                onOpenInvestorModal
                              ) {
                                handleInvestorClick(participantId, slug);
                              }
                            }}
                            title={
                              isPublicPage
                                ? 'Имя инвестора'
                                : 'Нажмите, чтобы просмотреть детали инвестора'
                            }
                          >
                            {name}
                          </span>
                          {slug ? (
                            <a
                              href={`https://x.com/${slug}`}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='inline-flex items-center'
                              tabIndex={0}
                              aria-label={`View ${name} on X`}
                            >
                              <SocialIcon
                                name='twitter'
                                className='h-3 w-3 text-zinc-500 dark:text-zinc-300'
                              />
                            </a>
                          ) : (
                            <SocialIcon
                              name='twitter'
                              className='h-3 w-3 text-zinc-500 opacity-50 dark:text-zinc-300'
                            />
                          )}
                        </>
                      );
                    })()}
                    {/* Sources rendering - handles both new GraphQL format and legacy format */}
                    {signal.sources?.map((source: any, idx: number) => {
                      // Get the URL from either new or old format
                      const sourceUrl =
                        source.profile_link ||
                        source.profileLink ||
                        source.link;
                      const sourceType =
                        source.source_type || source.sourceType || source.type;

                      // Skip Twitter/X sources to avoid duplication with the main X link above
                      const isTwitterSource =
                        sourceUrl?.includes('x.com') ||
                        sourceUrl?.includes('twitter.com') ||
                        sourceType === 'twitter' ||
                        sourceType === 'twitter_x';
                      if (isTwitterSource) return null;

                      // Skip if no URL available
                      if (!sourceUrl) return null;

                      return (
                        <a
                          key={idx}
                          href={sourceUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300'
                        >
                          <SocialIcon
                            name={getSocialIconNameFromSource(source)}
                            className='h-3 w-3 text-zinc-600 dark:text-zinc-400'
                          />
                        </a>
                      );
                    })}
                  </div>

                  {/* About text for signals */}
                  {(signal.associated_about || signal.participant?.about) && (
                    <TruncatedText
                      className='mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400'
                      maxLines={2}
                    >
                      {linkifyText(
                        signal.associated_about ||
                          signal.participant?.about ||
                          ''
                      )}
                    </TruncatedText>
                  )}

                  {(signal.associated_signal_created_at || signal.date) && (
                    <div className='mt-1 flex items-center'>
                      <IconCalendar className='mr-1 h-3 w-3 text-zinc-400' />
                      <span className='text-[10px] text-zinc-500 dark:text-zinc-400'>
                        {getRelativeDate(
                          signal.associated_signal_created_at || signal.date
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Nested investors */}
              {signal.more && signal.more.length > 0 && (
                <div className='mt-3 border-l border-zinc-200 pl-3 dark:border-zinc-700'>
                  <h6 className='mb-2 text-xs font-medium'>
                    Связанные инвесторы:
                  </h6>
                  <div className='space-y-2'>
                    {signal.more.map((investor: any, idx: number) => (
                      <div key={idx} className='flex items-start gap-2'>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`rounded-full transition-all duration-200 ${
                                  isPublicPage
                                    ? ''
                                    : 'hover:ring-primary/20 cursor-pointer hover:scale-105 hover:ring-2'
                                }`}
                                onClick={() => {
                                  if (!isPublicPage) {
                                    const participantId =
                                      investor.participant_id;
                                    const participantSlug =
                                      investor.participant_slug;
                                    if (participantId && participantSlug) {
                                      handleInvestorClick(
                                        participantId,
                                        participantSlug
                                      );
                                    }
                                  }
                                }}
                              >
                                <Avatar
                                  className='h-8 w-8 flex-shrink-0'
                                  variant={
                                    investor.participant_is_private
                                      ? 'private'
                                      : investor.participant_saved
                                        ? 'followed'
                                        : 'default'
                                  }
                                >
                                  {investor.participant_image ? (
                                    <AvatarImage
                                      src={investor.participant_image}
                                      alt={investor.participant_name}
                                    />
                                  ) : (
                                    <AvatarFallback className='bg-zinc-100 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
                                      {investor.participant_name?.[0] || '?'}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                              </div>
                            </TooltipTrigger>
                            {!isPublicPage && (
                              <TooltipContent
                                variant='theme'
                                side='bottom'
                                className='w-max max-w-[200px]'
                              >
                                <div className='text-center'>
                                  <div className='font-medium'>
                                    Click to view investor details
                                  </div>
                                  <div className='text-muted-foreground text-xs'>
                                    Opens investor modal
                                  </div>
                                </div>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                        <div className='min-w-0 flex-1'>
                          <div className='flex flex-wrap items-center gap-1'>
                            {/* Nested investor name with X icon and link */}
                            <span
                              className={`truncate text-xs font-medium transition-colors ${
                                isPublicPage
                                  ? 'cursor-default'
                                  : 'hover:text-primary cursor-pointer hover:underline'
                              }`}
                              onClick={() => {
                                if (
                                  investor.participant_id &&
                                  investor.participant_slug &&
                                  onOpenInvestorModal &&
                                  !isPublicPage
                                ) {
                                  handleInvestorClick(
                                    investor.participant_id,
                                    investor.participant_slug
                                  );
                                }
                              }}
                              title={
                                isPublicPage
                                  ? 'Investor name'
                                  : 'Click to view investor details'
                              }
                            >
                              {investor.participant_name}
                            </span>
                            {investor.participant_slug ? (
                              <a
                                href={`https://x.com/${investor.participant_slug}`}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='inline-flex items-center'
                                tabIndex={0}
                                aria-label={`View ${investor.participant_name} on X`}
                              >
                                <SocialIcon
                                  name='twitter'
                                  className='h-3 w-3 text-zinc-500 dark:text-zinc-300'
                                />
                              </a>
                            ) : (
                              <SocialIcon
                                name='twitter'
                                className='h-3 w-3 text-zinc-500 opacity-50 dark:text-zinc-300'
                              />
                            )}
                            {/* Sources rendering - handles both new GraphQL format and legacy format */}
                            {investor.sources?.map(
                              (source: any, sourceIdx: number) => {
                                // Get the URL from either new or old format
                                const sourceUrl =
                                  source.profile_link ||
                                  source.profileLink ||
                                  source.link;
                                const sourceType =
                                  source.source_type ||
                                  source.sourceType ||
                                  source.type;

                                // Skip Twitter/X sources to avoid duplication with the main X link above
                                const isTwitterSource =
                                  sourceUrl?.includes('x.com') ||
                                  sourceUrl?.includes('twitter.com') ||
                                  sourceType === 'twitter' ||
                                  sourceType === 'twitter_x';
                                if (isTwitterSource) return null;

                                // Skip if no URL available
                                if (!sourceUrl) return null;

                                return (
                                  <a
                                    key={sourceIdx}
                                    href={sourceUrl}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300'
                                  >
                                    <SocialIcon
                                      name={getSocialIconNameFromSource(source)}
                                      className='h-3 w-3 text-zinc-600 dark:text-zinc-600'
                                    />
                                  </a>
                                );
                              }
                            )}
                          </div>

                          {investor.participant_about && (
                            <TruncatedText
                              className='line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400'
                              maxLines={2}
                            >
                              {linkifyText(investor.participant_about)}
                            </TruncatedText>
                          )}

                          {investor.participant_created_at && (
                            <div className='mt-1 flex items-center'>
                              <IconCalendar className='mr-1 h-3 w-3 text-zinc-400' />
                              <span className='text-[10px] text-zinc-500 dark:text-zinc-400'>
                                {getRelativeDate(
                                  investor.participant_created_at
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* More on VECK block as last card for unauthenticated users */}
          {!isAuthenticated && (
            <div
              className={`group relative flex flex-col items-center justify-center overflow-hidden rounded-md border border-zinc-200 p-3 text-center transition-all dark:border-zinc-700 ${
                isPublicPage
                  ? ''
                  : 'hover:border-zinc-300 dark:hover:border-zinc-600'
              }`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br from-blue-100/60 via-purple-100/50 to-rose-100/60 transition-transform duration-200 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-rose-900/20 ${
                  isPublicPage ? '' : 'group-hover:scale-105'
                }`}
              ></div>
              <div className='relative z-10'>
                <h4 className='bg-gradient-to-r from-zinc-900 to-zinc-700 bg-clip-text text-sm font-medium text-transparent dark:from-zinc-100 dark:to-zinc-300'>
                  Подробнее на VECK
                </h4>
                <p className='mt-2 text-xs text-zinc-700 dark:text-zinc-300'>
                  Get access to full information about the project, investors
                  and signals on the platform
                </p>
                <Link href='/auth/sign-in'>
                  <Button
                    variant='outline'
                    size='sm'
                    className={`mt-3 border-zinc-200 bg-white text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 ${
                      isPublicPage
                        ? ''
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-700'
                    }`}
                  >
                    Sign in to Platform
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Show empty state only when we're not loading and have no data
    return (
      <div className='rounded-md bg-zinc-100 p-8 text-center dark:bg-zinc-800'>
        <IconActivity className='mx-auto mb-3 h-12 w-12 text-zinc-400' />
        <h3 className='mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300'>
          Взаимодействия не найдены
        </h3>
        <p className='text-xs text-zinc-500'>
          This project doesn't have any recorded interactions with investors
          yet.
        </p>
      </div>
    );
  }
};
