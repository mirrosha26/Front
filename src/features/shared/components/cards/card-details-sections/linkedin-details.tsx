import React from 'react';
import { Badge } from '@/components/ui/badge';
import { IconLink, IconCalendar } from '@tabler/icons-react';
import { CardDetails, CardPreview } from '../../../types/cards';
import { getRelativeDate } from '../../../utils/formatting';
import { SocialIcon } from '../../ui/social-icon';
import { parseExperienceString } from '../../../utils/experience-duration';

import { ExperienceSummary } from './experience-summary';

interface LinkedInDetailsTabProps {
  detailedCard: CardDetails | null;
  cardPreview?: CardPreview;
  isLoading?: boolean;
}

export const LinkedInDetailsTab: React.FC<LinkedInDetailsTabProps> = ({
  detailedCard,
  cardPreview,
  isLoading = false
}) => {
  // Helper function to format date range display
  const formatDateRange = (startDate: string, endDate: string) => {
    const currentDate = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const isPresent = endDate === currentDate;
    return `${startDate} to ${isPresent ? 'present' : endDate}`;
  };

  // Helper function to validate if a string is a valid URL
  const isValidUrl = (urlString: string): boolean => {
    if (!urlString || typeof urlString !== 'string') {
      return false;
    }

    try {
      const url = new URL(urlString);
      // Check if it's a valid protocol (http or https)
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };
  // Get LinkedIn signals - prefer detailed card, but use preview if available
  let linkedInSignals: any[] = [];

  // Try to get from detailed card first (more complete data)
  if (detailedCard?.linkedInSignals) {
    linkedInSignals = detailedCard.linkedInSignals;
  }

  // If no detailed card signals or no LinkedIn signals found, try card preview
  if (linkedInSignals.length === 0 && cardPreview?.signals) {
    linkedInSignals = cardPreview.signals.filter(
      (signal) => signal.signalType?.slug === 'linkedin' && signal.linkedinData
    );
  }

  if (isLoading && linkedInSignals.length === 0) {
    return (
      <div className='space-y-6 pb-6'>
        {/* Loading skeleton */}
        <div className='animate-pulse space-y-4'>
          <div className='h-32 rounded-lg bg-zinc-200 dark:bg-zinc-700'></div>
          <div className='space-y-2'>
            <div className='h-4 w-1/4 rounded bg-zinc-200 dark:bg-zinc-700'></div>
            <div className='h-20 rounded bg-zinc-200 dark:bg-zinc-700'></div>
          </div>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='h-24 rounded bg-zinc-200 dark:bg-zinc-700'></div>
            <div className='h-24 rounded bg-zinc-200 dark:bg-zinc-700'></div>
          </div>
        </div>
      </div>
    );
  }

  if (linkedInSignals.length === 0) {
    return (
      <div className='flex h-48 items-center justify-center text-zinc-500'>
        No LinkedIn data available
      </div>
    );
  }

  return (
    <div className='space-y-8 pb-6'>
      {linkedInSignals.map((signal: any, index: number) => {
        const linkedinData = signal.linkedinData;
        if (!linkedinData) return null;

        return (
          <div key={index} className='space-y-6'>
            {/* Main Content Grid */}
            <div className='grid gap-6 lg:grid-cols-3'>
              {/* Left Column - Summary & Analysis */}
              <div className='space-y-6 lg:col-span-2'>
                {/* New Company Section */}
                {linkedinData.newCompany && (
                  <section className='space-y-4'>
                    <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
                      Новая компания
                    </h2>
                    <div className='rounded-lg border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-900/20'>
                      <div className='flex items-start gap-4'>
                        {linkedinData.newCompanyLogo && (
                          <div className='flex-shrink-0'>
                            <img
                              src={linkedinData.newCompanyLogo}
                              alt={`${linkedinData.newCompany} logo`}
                              className='h-12 w-12 rounded-lg object-cover'
                            />
                          </div>
                        )}
                        <div className='flex-1'>
                          <h3 className='text-lg font-semibold text-emerald-900 dark:text-emerald-100'>
                            {linkedinData.newCompany}
                          </h3>
                          {linkedinData.newCompanyDescription && (
                            <p className='mt-2 text-sm leading-relaxed text-emerald-800 dark:text-emerald-200'>
                              {linkedinData.newCompanyDescription}
                            </p>
                          )}
                          <div className='mt-3 flex flex-wrap gap-3'>
                            {linkedinData.newCompanyLinkedinUrl &&
                              isValidUrl(
                                linkedinData.newCompanyLinkedinUrl
                              ) && (
                                <a
                                  href={linkedinData.newCompanyLinkedinUrl}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-200'
                                >
                                  <SocialIcon
                                    name='linkedin'
                                    className='mr-1 h-4 w-4'
                                  />
                                  Visit LinkedIn
                                  <svg
                                    className='ml-1 h-4 w-4'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                  >
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                                    />
                                  </svg>
                                </a>
                              )}
                            {linkedinData.newCompanyWebsite &&
                              isValidUrl(linkedinData.newCompanyWebsite) && (
                                <a
                                  href={linkedinData.newCompanyWebsite}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='inline-flex items-center text-sm font-medium text-emerald-700 hover:text-emerald-600 dark:text-emerald-300 dark:hover:text-emerald-200'
                                >
                                  Visit Website
                                  <svg
                                    className='ml-1 h-4 w-4'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                  >
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                                    />
                                  </svg>
                                </a>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Summary */}
                {linkedinData.summary && (
                  <section className='space-y-4'>
                    <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
                      Профессиональное резюме
                    </h2>
                    <div className='rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800'>
                      <p className='text-base leading-relaxed text-zinc-700 dark:text-zinc-300'>
                        {linkedinData.summary}
                      </p>
                    </div>
                  </section>
                )}

                {/* Experience Summary */}
                {linkedinData.experience &&
                  linkedinData.experience.length > 0 && (
                    <ExperienceSummary experiences={linkedinData.experience} />
                  )}

                {/* Analysis */}
                {/* TEMPORARILY COMMENTED OUT - Analysis section
                {linkedinData.reasoning && (
                  <section className='space-y-4'>
                    <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
                      Analysis
                    </h2>
                    <div className='rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20'>
                      <p className='text-base leading-relaxed text-amber-800 dark:text-amber-200'>
                        {linkedinData.reasoning}
                      </p>
                    </div>
                  </section>
                )}
                */}
              </div>

              {/* Right Column - Quick Info */}
              <div className='space-y-6'>
                {/* LinkedIn Profile Tags */}
                {linkedinData.tags && linkedinData.tags.length > 0 && (
                  <section className='space-y-3'>
                    <h3 className='text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400'>
                      Теги LinkedIn
                    </h3>
                    <div className='flex flex-wrap gap-2'>
                      {linkedinData.tags.map(
                        (tag: string, tagIndex: number) => (
                          <Badge
                            key={tagIndex}
                            variant='secondary'
                            className='border-purple-200 bg-purple-50 px-3 py-1.5 text-sm text-purple-700 dark:border-purple-800 dark:bg-purple-950/20 dark:text-purple-300'
                          >
                            {tag.replace('_', ' ')}
                          </Badge>
                        )
                      )}
                    </div>
                  </section>
                )}

                {/* Education */}
                {linkedinData.education &&
                  linkedinData.education.length > 0 && (
                    <section className='space-y-3'>
                      <h3 className='text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400'>
                        Образование
                      </h3>
                      <div className='space-y-2'>
                        {linkedinData.education
                          .slice(0, 5)
                          .map((edu: string, eduIndex: number) => (
                            <div
                              key={eduIndex}
                              className='rounded-md border border-zinc-200 bg-white p-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                            >
                              {edu}
                            </div>
                          ))}
                        {linkedinData.education.length > 5 && (
                          <Badge variant='outline' className='text-xs'>
                            +{linkedinData.education.length - 5} еще
                          </Badge>
                        )}
                      </div>
                    </section>
                  )}

                {/* Notable Achievements */}
                {linkedinData.notableAchievements && (
                  <section className='space-y-3'>
                    <h3 className='text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400'>
                      Значительные достижения
                    </h3>
                    <div className='rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20'>
                      <p className='text-sm leading-relaxed text-emerald-800 dark:text-emerald-200'>
                        {linkedinData.notableAchievements}
                      </p>
                    </div>
                  </section>
                )}

                {/* Metadata */}
                <section className='space-y-3 border-t border-zinc-200 pt-6 dark:border-zinc-700'>
                  <h3 className='text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400'>
                    Информация о находке
                  </h3>
                  <div className='space-y-2 text-sm text-zinc-600 dark:text-zinc-400'>
                    <div className='flex items-center gap-2'>
                      <IconLink className='h-4 w-4' />
                      <span>Signal coming from Linkedin Research</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <IconCalendar className='h-4 w-4' />
                      <span>Created at: {getRelativeDate(signal.date)}</span>
                    </div>
                    {linkedinData.createdAt && (
                      <div className='flex items-center gap-2'>
                        <IconCalendar className='h-4 w-4' />
                        <span>
                          Disovered: {getRelativeDate(linkedinData.createdAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
