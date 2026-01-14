import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { SocialIcon } from '../ui/social-icon';

interface Participant {
  id: string;
  name: string;
  slug: string;
  type: string;
  about?: string;
  imageUrl?: string;
  isSaved?: boolean;
  isPrivate?: boolean;
}

interface Signal {
  id: string;
  date: string;
  description?: string;
  signalType?: {
    id: string;
    name: string;
    slug: string;
  };
  participant?: Participant; // Individual investor
  associatedParticipant?: Participant; // Fund/Investment firm
  linkedinData?: {
    id: string;
    name: string;
    classification?: string;
    path?: string;
    reasoning?: string;
    tags?: string[];
    summary?: string;
    linkedinProfileUrl?: string;
    linkedinProfileImageUrl?: string | null;
    education?: string[];
    experience?: string[];
    notableAchievements?: string;
    curated?: boolean;
    createdAt?: string;
  };
  // NEW: Add founder information fields
  sourceSignalCard?: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string;
  };
  founder?: {
    name: string;
    slug: string;
    imageUrl: string;
  };
}

interface FundInvestorAvatarsProps {
  signals: Signal[];
  maxVisible?: number;
  className?: string;
  remainingParticipantsCount?: number;
}

// Helper function to determine if a participant type is a fund/syndicate
const isFundOrSyndicate = (type: string): boolean => {
  const fundTypes = ['fund', 'syndicate', 'accelerator', 'platform'];
  return fundTypes.includes(type.toLowerCase());
};

// Helper function to determine if a participant type is an individual investor
const isIndividualInvestor = (type: string): boolean => {
  const individualTypes = [
    'investor',
    'angel',
    'scout',
    'founder',
    'person',
    'entrepreneur'
  ];
  return individualTypes.includes(type.toLowerCase());
};

// Helper function to parse text and make URLs clickable
const renderTextWithLinks = (text: string): React.ReactNode => {
  if (!text) return text;

  // Regex to match URLs (http, https, www)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      // Ensure URL has proper protocol
      const href = part.startsWith('http') ? part : `https://${part}`;

      // Extract domain for display
      const getDomainWithPath = (url: string) => {
        try {
          const urlObj = new URL(href);
          const hostname = urlObj.hostname.replace('www.', '');
          const pathname = urlObj.pathname === '/' ? '' : urlObj.pathname;
          return hostname + pathname;
        } catch (error) {
          return part;
        }
      };

      return (
        <a
          key={index}
          href={href}
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

// Helper function to check if a participant type should show simplified tooltip
const shouldShowSimplifiedTooltip = (type: string): boolean => {
  const simplifiedTypes = [
    'investor',
    'angel',
    'scout',
    'research',
    'engineer',
    'influencer',
    'unknown',
    'founder',
    'marketing',
    'writing',
    'chief_of_staff',
    'talent_partner',
    'legal',
    'operations',
    'socials',
    'business_development',
    'security',
    'finance',
    'due_diligence',
    'data_science',
    'product',
    'protocol',
    'defi',
    'growth',
    'design',
    'eir',
    'data',
    'strategy',
    'raising_capital',
    'board',
    'analyst',
    'content',
    'investor_relations',
    'advisor',
    'ceo',
    'portfolio',
    'asset_management',
    'events',
    'communications',
    'trading',
    'market_maker',
    'GA',
    'other'
  ];

  return simplifiedTypes.includes(type?.toLowerCase());
};

export const FundInvestorAvatars: React.FC<FundInvestorAvatarsProps> = ({
  signals,
  maxVisible = 5,
  className,
  remainingParticipantsCount = 0
}) => {
  // Filter signals based on the rule: if both LinkedIn and normal signals exist, show only normal signals
  const filteredSignals = React.useMemo(() => {
    const hasLinkedInSignals = signals.some(
      (signal) => signal.signalType?.slug === 'linkedin' && signal.linkedinData
    );
    const hasNormalSignals = signals.some(
      (signal) => signal.signalType?.slug !== 'linkedin' || !signal.linkedinData
    );
    const hasFounderSignals = signals.some(
      (signal) => signal.signalType?.slug === 'founder' && signal.founder
    );

    // If both LinkedIn and normal signals exist, filter out LinkedIn signals
    // But always keep founder signals
    if (hasLinkedInSignals && hasNormalSignals) {
      return signals.filter((signal) => {
        // Always keep founder signals
        if (signal.signalType?.slug === 'founder') return true;
        // Keep non-LinkedIn signals or LinkedIn signals without data
        return signal.signalType?.slug !== 'linkedin' || !signal.linkedinData;
      });
    }

    // Otherwise, return all signals
    return signals;
  }, [signals]);

  // Sort signals by date in descending order (newest first)
  const sortedSignals = [...filteredSignals].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA; // Descending order (newest first)
  });

  // Group signals by fund (associatedParticipant) and collect individual investors
  const fundGroups = sortedSignals.reduce(
    (acc, signal) => {
      // Handle LinkedIn signals specially
      if (signal.signalType?.slug === 'linkedin' && signal.linkedinData) {
        const linkedinKey = `linkedin-${signal.linkedinData.id}`;
        if (!acc[linkedinKey]) {
          acc[linkedinKey] = {
            fund: null, // LinkedIn signals don't have traditional participants
            investors: [],
            latestDate: signal.date,
            isLinkedIn: true,
            linkedinData: signal.linkedinData
          };
        } else {
          // Update latest date if this signal is newer
          const currentLatest = new Date(acc[linkedinKey].latestDate).getTime();
          const signalDate = new Date(signal.date).getTime();
          if (signalDate > currentLatest) {
            acc[linkedinKey].latestDate = signal.date;
          }
        }
        return acc;
      }

      // Prefer associatedParticipant as fund, but fall back to participant if no associatedParticipant
      const fund = signal.associatedParticipant || signal.participant;
      const investor = signal.associatedParticipant ? signal.participant : null;

      // Handle founder signals specially
      if (signal.signalType?.slug === 'founder' && signal.founder) {
        const founderKey = `founder-${signal.founder.slug}`;
        if (!acc[founderKey]) {
          acc[founderKey] = {
            fund: null, // Founder signals don't have traditional participants
            investors: [],
            latestDate: signal.date,
            isFounder: true,
            founder: signal.founder,
            sourceSignalCard: signal.sourceSignalCard
          };
        } else {
          // Update latest date if this signal is newer
          const currentLatest = new Date(acc[founderKey].latestDate).getTime();
          const signalDate = new Date(signal.date).getTime();
          if (signalDate > currentLatest) {
            acc[founderKey].latestDate = signal.date;
          }
        }
        return acc;
      }

      // Skip if no fund
      if (!fund) return acc;

      // If the fund and investor are the same (signal produced by the fund itself), treat as founder/individual
      const isSelfProduced =
        signal.associatedParticipant &&
        signal.participant &&
        signal.associatedParticipant.id === signal.participant.id;

      const fundKey = fund.id + (isSelfProduced ? '_self' : '');
      if (!acc[fundKey]) {
        acc[fundKey] = {
          fund,
          investors: [],
          latestDate: signal.date // Track the latest date for this fund group
        };
      } else {
        // Update latest date if this signal is newer
        const currentLatest = new Date(acc[fundKey].latestDate).getTime();
        const signalDate = new Date(signal.date).getTime();
        if (signalDate > currentLatest) {
          acc[fundKey].latestDate = signal.date;
        }
      }

      // Only add investor if not self-produced
      if (
        investor &&
        !isSelfProduced &&
        !acc[fundKey].investors.some((inv) => inv.id === investor.id)
      ) {
        acc[fundKey].investors.push(investor);
      }

      return acc;
    },
    {} as Record<
      string,
      {
        fund: Participant | null;
        investors: Participant[];
        latestDate: string;
        isLinkedIn?: boolean;
        linkedinData?: {
          id: string;
          name: string;
          classification?: string;
          path?: string;
          reasoning?: string;
          tags?: string[];
          summary?: string;
          linkedinProfileUrl?: string;
          linkedinProfileImageUrl?: string | null;
          education?: string[];
          experience?: string[];
          notableAchievements?: string;
          curated?: boolean;
          createdAt?: string;
        };
        isFounder?: boolean;
        founder?: {
          name: string;
          slug: string;
          imageUrl: string;
        };
        sourceSignalCard?: {
          id: string;
          name: string;
          slug: string;
          imageUrl: string;
        };
      }
    >
  );

  // Sort fund groups by their latest signal date (newest first) and take only maxVisible
  const fundGroupsArray = Object.values(fundGroups)
    .sort((a, b) => {
      const dateA = new Date(a.latestDate).getTime();
      const dateB = new Date(b.latestDate).getTime();
      return dateB - dateA; // Descending order (newest first)
    })
    .slice(0, maxVisible);

  if (fundGroupsArray.length === 0) return null;

  return (
    <div className={cn('flex max-w-full items-center justify-end', className)}>
      <div className='flex max-w-full -space-x-5 pt-1 pb-1 pl-1'>
        {fundGroupsArray.map(
          (
            {
              fund,
              investors,
              isLinkedIn,
              linkedinData,
              isFounder,
              founder,
              sourceSignalCard
            },
            index
          ) => {
            // Handle LinkedIn signals
            if (isLinkedIn && linkedinData) {
              return (
                <TooltipProvider
                  delayDuration={0}
                  key={`linkedin-${linkedinData.id}-${index}`}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className='group relative flex-shrink-0 p-1 hover:z-10 hover:-translate-y-1'>
                        <Avatar
                          className='h-10 w-10 bg-blue-100 hover:shadow-md dark:bg-blue-900/20'
                          variant='default'
                        >
                          <AvatarFallback className='bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'>
                            <SocialIcon name='linkedin' className='h-6 w-6' />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      variant='theme'
                      side='bottom'
                      className='w-max max-w-[250px]'
                    >
                      <div className='space-y-1'>
                        <div className='font-medium'>
                          Linkedin research signal
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }

            // Handle Founder signals
            if (isFounder && founder) {
              return (
                <TooltipProvider
                  delayDuration={0}
                  key={`founder-${founder.slug}-${index}`}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className='group relative flex-shrink-0 p-1 hover:z-10 hover:-translate-y-1'>
                        <Avatar
                          className='h-10 w-10 hover:shadow-md'
                          variant='default'
                        >
                          <AvatarImage
                            src={founder.imageUrl}
                            alt={founder.name}
                          />
                          <AvatarFallback className='bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'>
                            {founder.name?.[0] || 'F'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      variant='theme'
                      side='bottom'
                      className='w-max max-w-[250px]'
                    >
                      <div className='space-y-1'>
                        <div className='font-medium'>{founder.name}</div>
                        <div className='text-muted-foreground text-xs'>
                          Founder
                        </div>
                        {sourceSignalCard && (
                          <div className='text-muted-foreground text-xs'>
                            Company: {sourceSignalCard.name}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }

            // Handle regular participants
            if (!fund) return null;

            const primaryInvestor = investors[0]; // Use first investor for tooltip info
            const additionalInvestorsCount = investors.length - 1;

            // Determine if this is a fund/syndicate or individual investor
            const isFund = isFundOrSyndicate(fund.type);
            const isIndividual = isIndividualInvestor(fund.type);

            // Detect if this group is a self-produced signal (fund == participant)
            const isSelfProduced = investors.length === 0 && isFund;

            // Check if this is the last item and there's no counter
            const isLastItem = index === fundGroupsArray.length - 1;
            const hasCounter =
              Object.keys(fundGroups).length > maxVisible ||
              remainingParticipantsCount > 0;
            const isLastWithoutCounter = isLastItem && !hasCounter;

            return (
              <TooltipProvider
                delayDuration={0}
                key={fund.id + (isSelfProduced ? '_self' : '') + '_' + index}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`group relative flex-shrink-0 hover:z-10 hover:-translate-y-1 ${
                        isLastWithoutCounter ? 'pt-1 pb-1 pl-1' : 'p-1'
                      }`}
                    >
                      {/* Main fund avatar */}
                      <Avatar
                        className='h-10 w-10 hover:shadow-md'
                        variant={
                          fund.isPrivate
                            ? 'private'
                            : fund.isSaved
                              ? 'followed'
                              : 'default'
                        }
                      >
                        <AvatarImage src={fund.imageUrl} alt={fund.name} />
                        <AvatarFallback className='bg-muted text-muted-foreground text-sm font-medium'>
                          {fund.name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>

                      {/* Additional investors indicator - only show if this is a fund, not self-produced, and has more investors */}
                      {isFund &&
                        !isSelfProduced &&
                        additionalInvestorsCount > 0 && (
                          <div className='bg-primary text-primary-foreground border-primary absolute -top-0.5 -right-0.5 z-20 flex h-4 w-4 items-center justify-center rounded-full border-2 text-[8px] font-bold'>
                            +{additionalInvestorsCount}
                          </div>
                        )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    variant='theme'
                    side='bottom'
                    className='w-max max-w-[250px]'
                  >
                    <div className='space-y-1'>
                      {/* Check if this participant should show simplified tooltip */}
                      {shouldShowSimplifiedTooltip(fund.type) ? (
                        <>
                          {/* Simplified tooltip: only name and description */}
                          <div className='font-medium'>{fund.name}</div>
                          {fund.about && (
                            <div className='text-muted-foreground text-xs break-words'>
                              {renderTextWithLinks(fund.about)}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Full tooltip: original complex display */}
                          {/* Fund name header - always show fund name */}
                          <div className='font-medium'>{fund.name}</div>

                          {/* Show description based on type */}
                          {isFund && fund.about && (
                            <div className='text-muted-foreground text-xs break-words'>
                              {renderTextWithLinks(fund.about)}
                            </div>
                          )}

                          {/* For funds/syndicates: show individual investor info with their picture */}
                          {/* Only show if the investor is different from the fund to avoid duplication */}
                          {isFund &&
                            primaryInvestor &&
                            primaryInvestor.id !== fund.id && (
                              <div className='border-muted mt-1 border-t pt-1 text-xs'>
                                <div className='flex items-center gap-2'>
                                  <Avatar className='h-5 w-5 flex-shrink-0'>
                                    <AvatarImage
                                      src={primaryInvestor.imageUrl}
                                      alt={primaryInvestor.name}
                                    />
                                    <AvatarFallback className='text-[10px]'>
                                      {primaryInvestor.name?.[0] || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className='font-medium'>
                                    {primaryInvestor.name}
                                  </span>
                                </div>
                                {primaryInvestor.about && (
                                  <div className='text-muted-foreground mt-0.5 break-words'>
                                    {renderTextWithLinks(primaryInvestor.about)}
                                  </div>
                                )}
                              </div>
                            )}

                          {/* For individual investors: show only their description if no fund description */}
                          {isIndividual && fund.about && (
                            <div className='text-muted-foreground text-xs break-words'>
                              {renderTextWithLinks(fund.about)}
                            </div>
                          )}

                          {additionalInvestorsCount > 0 && (
                            <div className='text-muted-foreground text-xs'>
                              +{additionalInvestorsCount} more investor
                              {additionalInvestorsCount > 1 ? 's' : ''}{' '}
                              interested
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }
        )}

        {/* Show remaining participants count if we have more than can be displayed */}
        {(Object.keys(fundGroups).length > maxVisible ||
          remainingParticipantsCount > 0) && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className='pt-1 pb-1 pl-1'>
                  <Avatar className='h-10 w-10' variant='more'>
                    <AvatarFallback className='text-xs'>
                      +
                      {Math.max(
                        Object.keys(fundGroups).length - maxVisible,
                        0
                      ) + remainingParticipantsCount}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent
                variant='theme'
                side='bottom'
                className='w-max max-w-[250px]'
              >
                {Math.max(Object.keys(fundGroups).length - maxVisible, 0) +
                  remainingParticipantsCount}{' '}
                more participants interested
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};
