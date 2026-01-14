import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  calculateTotalExperienceDuration,
  parseExperienceString,
  formatExperienceWithDuration
} from '../../../utils/experience-duration';
import { StructuredExperience } from '../../../types/cards';

interface ExperienceSummaryProps {
  experiences: string[] | StructuredExperience[];
  className?: string;
}

export const ExperienceSummary: React.FC<ExperienceSummaryProps> = ({
  experiences,
  className = ''
}) => {
  const experienceSummary = calculateTotalExperienceDuration(experiences);

  if (experiences.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
            Опыт
          </h2>
        </div>
        <div className='py-8 text-center text-zinc-500 dark:text-zinc-400'>
          Данные об опыте недоступны
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with total duration */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
            Опыт
          </h2>
          <Badge
            variant='secondary'
            className='bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
          >
            {experienceSummary.totalDuration} всего
          </Badge>
        </div>
        <div className='text-sm text-zinc-500 dark:text-zinc-400'>
          {experienceSummary.consolidatedCompanies.length} Компаний
        </div>
      </div>

      {/* Company View */}
      <div className='space-y-3'>
        <div className='grid gap-3'>
          {experienceSummary.consolidatedCompanies.map((company, index) => (
            <div
              key={index}
              className='dark:hover:bg-zinc-750 rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800'
            >
              <div className='space-y-3'>
                {/* Company Header */}
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0 flex-1'>
                    <h4 className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
                      {company.company}
                    </h4>
                    <p className='text-xs text-zinc-500 dark:text-zinc-500'>
                      {company.earliestStartDate === 'unknown'
                        ? 'Неизвестно'
                        : company.earliestStartDate}{' '}
                      по{' '}
                      {company.latestEndDate ===
                      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
                        ? 'настоящее время'
                        : company.latestEndDate}
                    </p>
                  </div>
                  <Badge
                    variant='outline'
                    className='shrink-0 bg-blue-50 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  >
                    {company.totalDuration}
                  </Badge>
                </div>

                {/* Enhanced experience details for single position */}
                {company.positions.length === 1 &&
                  company.positions[0].originalText && (
                    <div className='space-y-2 text-xs text-zinc-600 dark:text-zinc-400'>
                      {(() => {
                        const text = company.positions[0].originalText;
                        const parts = text.split(' | ');

                        if (parts.length > 1) {
                          const description = parts[1];

                          // Only show description if it exists and is not "N/A" or empty
                          if (
                            description &&
                            description.trim() !== '' &&
                            description.trim() !== 'N/A' &&
                            !description.trim().startsWith('Location: N/A') &&
                            !description
                              .trim()
                              .startsWith('Location: Not specified')
                          ) {
                            return (
                              <div className='space-y-2'>
                                <p className='leading-relaxed'>{description}</p>
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}
                    </div>
                  )}

                {/* Positions at this company */}
                {company.positions.length > 1 && (
                  <div className='space-y-3 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700'>
                    {company.positions.map((position, posIndex) => (
                      <div key={posIndex} className='space-y-2'>
                        <div className='flex items-start justify-between gap-3'>
                          <div className='min-w-0 flex-1'>
                            <p className='text-sm font-medium text-zinc-800 dark:text-zinc-200'>
                              {position.title}
                            </p>
                            <p className='text-xs text-zinc-500 dark:text-zinc-500'>
                              {position.startDate === 'unknown'
                                ? 'Неизвестно'
                                : position.startDate}{' '}
                              по{' '}
                              {position.endDate ===
                              `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
                                ? 'настоящее время'
                                : position.endDate}
                            </p>
                          </div>
                          <Badge variant='outline' className='shrink-0 text-xs'>
                            {position.duration}
                          </Badge>
                        </div>

                        {/* Enhanced experience details */}
                        {position.originalText && (
                          <div className='space-y-2 text-xs text-zinc-600 dark:text-zinc-400'>
                            {/* Extract and display description */}
                            {(() => {
                              const text = position.originalText;
                              const parts = text.split(' | ');

                              if (parts.length > 1) {
                                const description = parts[1];

                                // Only show description if it exists and is not "N/A" or empty
                                if (
                                  description &&
                                  description.trim() !== '' &&
                                  description.trim() !== 'N/A' &&
                                  !description
                                    .trim()
                                    .startsWith('Location: N/A') &&
                                  !description
                                    .trim()
                                    .startsWith('Location: Not specified')
                                ) {
                                  return (
                                    <div className='space-y-2'>
                                      <p className='leading-relaxed'>
                                        {description}
                                      </p>
                                    </div>
                                  );
                                }
                              }
                              return null;
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
