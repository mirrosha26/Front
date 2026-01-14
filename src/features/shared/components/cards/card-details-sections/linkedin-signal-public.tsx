import React from 'react';
import { Badge } from '@/components/ui/badge';
import { IconLink, IconCalendar, IconExternalLink } from '@tabler/icons-react';
import { getRelativeDate } from '../../../utils/formatting';
import { SocialIcon } from '../../ui/social-icon';
import { ExperienceSummary } from './experience-summary';

interface LinkedInSignalPublicProps {
  signals: Array<{
    linkedin_id: string;
    linkedin_name: string;
    linkedin_profile_url: string;
    linkedin_profile_image_url?: string;
    linkedin_classification?: string;
    linkedin_path?: string;
    linkedin_reasoning?: string;
    linkedin_tags?: string[];
    linkedin_signal_created_at?: string;
    sources?: Array<{
      type: string;
      slug: string;
      link: string;
    }>;
    linkedinData?: {
      name: string;
      linkedinProfileUrl: string;
      classification: string;
      tags: string[];
      summary: string;
      experience: string[];
      education: string[];
      notableAchievements: string;
      oneLiner?: string;
      location?: string;
      createdAt: string;
      updatedAt: string;
      signalType: string;
      newCompany?: string;
      newCompanyDescription?: string;
      newCompanyWebsite?: string;
      newCompanyLogo?: string;
      newCompanyLinkedinUrl?: string;
    };
  }>;
  isLoading?: boolean;
}

export const LinkedInSignalPublic: React.FC<LinkedInSignalPublicProps> = ({
  signals,
  isLoading = false
}) => {
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
  if (isLoading) {
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

  if (signals.length === 0) {
    return (
      <div className='flex h-48 items-center justify-center text-zinc-500'>
        No LinkedIn data available
      </div>
    );
  }

  return (
    <div className='space-y-8 pb-6'>
      {signals.map((signal, index) => {
        // Use the new linkedinData structure if available, otherwise fall back to old structure
        const linkedinData = signal.linkedinData || {
          name: signal.linkedin_name,
          linkedinProfileUrl: signal.linkedin_profile_url,
          classification: signal.linkedin_classification || '',
          tags: signal.linkedin_tags || [],
          summary: signal.linkedin_reasoning || '',
          experience: [],
          education: [],
          notableAchievements: '',
          createdAt: signal.linkedin_signal_created_at || '',
          updatedAt: signal.linkedin_signal_created_at || '',
          signalType: 'linkedin',
          newCompany: undefined,
          newCompanyDescription: undefined,
          newCompanyWebsite: undefined,
          newCompanyLogo: undefined,
          newCompanyLinkedinUrl: undefined
        };

        if (!linkedinData) {
          return null;
        }

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
                      New Company
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
              </div>

              {/* Right Column - Quick Info */}
              <div className='space-y-6'>
                {/* View on Veck Badge */}
                <section className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400'>
                      Значок Veck
                    </h3>
                  </div>
                  <div className='rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20'>
                    <div className='flex items-center gap-3'>
                      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30'>
                        <SocialIcon
                          name='linkedin'
                          className='h-5 w-5 text-blue-600 dark:text-blue-400'
                        />
                      </div>
                      <div className='flex-1'>
                        <div className='font-medium text-blue-900 dark:text-blue-100'>
                          Просмотр на Veck
                        </div>
                        <div className='text-sm text-blue-700 dark:text-blue-300'>
                          Доступ к полной аналитике LinkedIn
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

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
                    Discovery Information
                  </h3>
                  <div className='space-y-2 text-sm text-zinc-600 dark:text-zinc-400'>
                    <div className='flex items-center gap-2'>
                      <IconLink className='h-4 w-4' />
                      <span>Signal coming from Linkedin Research</span>
                    </div>
                    {linkedinData.createdAt && (
                      <div className='flex items-center gap-2'>
                        <IconCalendar className='h-4 w-4' />
                        <span>
                          Discovered: {getRelativeDate(linkedinData.createdAt)}
                        </span>
                      </div>
                    )}
                    {signal.sources && signal.sources.length > 0 && (
                      <div className='flex items-center gap-2'>
                        <IconExternalLink className='h-4 w-4' />
                        <span>
                          Source: {signal.sources[0]?.type || 'LinkedIn'}
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
