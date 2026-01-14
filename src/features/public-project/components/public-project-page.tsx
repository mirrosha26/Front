'use client';

import { useAuth } from '@/contexts/auth-context';
import { usePublicProject } from '../contexts/public-project-context';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';
import Link from 'next/link';

import { useTheme } from 'next-themes';
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { IconLoader2, IconCheck } from '@tabler/icons-react';
import {
  IconUser,
  IconUserCheck,
  IconHome,
  IconShield,
  IconClock,
  IconMapPin,
  IconWorld,
  IconExternalLink,
  IconHeart,
  IconHeartFilled,
  IconNote,
  IconUsers,
  IconLink
} from '@tabler/icons-react';
import { getRoundStatusIcon } from '@/features/shared/components/ui/round-icons';

import { LikeButton } from '@/features/shared/components/ui/actions/like';
import { SocialLinksIcons } from '@/features/shared/components/ui/actions/social-links-icons';
import { LinksList } from '@/features/shared/components/ui/actions/links-list';
import { CardTeamTab } from '@/features/shared/components/cards/card-details-sections/team';
import { CardFundingTab } from '@/features/shared/components/cards/card-details-sections/funding';
import { CardInteractionsTab } from '@/features/shared/components/cards/card-details-sections/interactions';

import { LinkedInSignalPublic } from '@/features/shared/components/cards/card-details-sections/linkedin-signal-public';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PublicProjectPageProps {
  identifier?: string;
}

export function PublicProjectPage({ identifier }: PublicProjectPageProps) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const {
    previewData,
    detailData,
    isLoadingPreview,
    isLoadingDetail,
    error,
    fetchCardPreview,
    fetchCardDetail,
    clearCard,
    toggleLike,
    isTogglingLike
  } = usePublicProject();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLikedLocal, setIsLikedLocal] = useState(false);
  const searchParams = useSearchParams();
  const signedToken = searchParams.get('sig');
  const [isApprovingIntro, setIsApprovingIntro] = useState(false);
  const [introApproved, setIntroApproved] = useState(false);
  
  // Check if card is already open to intro - can be determined from preview or detail data
  const isAlreadyOpenToIntro = useMemo(() => {
    // open_to_intro is now available in both preview and detail data
    return (detailData as any)?.open_to_intro || (previewData as any)?.open_to_intro || false;
  }, [detailData, previewData]);

  // Set intro approved state on mount if card is already open to intro and has sig parameter
  // Can use previewData immediately (available on mount) or wait for detailData
  useEffect(() => {
    if (signedToken && isAlreadyOpenToIntro) {
      setIntroApproved(true);
    }
  }, [signedToken, isAlreadyOpenToIntro]);

  // Helper function to check if card has LinkedIn data
  const hasLinkedInData = useMemo(() => {
    // linkedinData field no longer available
    return false;
  }, [detailData]);

  // Helper function to extract LinkedIn signals from card
  const getLinkedInSignals = useMemo(() => {
    if (!detailData?.signals) return [];

    const signals = detailData.signals.filter((signal: any) => {
      // Check if it's a LinkedIn signal - try multiple conditions
      const isLinkedInSignal =
        signal.signalType?.slug === 'linkedin' ||
        signal.signalType?.name === 'LinkedIn';

      // linkedinData field no longer available
      return false;
    });

    // Transform signals to match LinkedInSignalPublic interface
    // linkedinData field no longer available - return empty array
    const transformedSignals: any[] = [];

    return transformedSignals;
  }, [detailData]);

  // Use preview for header only (server-side data)
  const headerData = previewData;
  // Don't use preview as fallback for tabs (client-side data)
  const tabsData = detailData;

  // Обработка данных участников
  const participants = useMemo(() => {
    if (!tabsData?.participants_list) return [];

    return tabsData.participants_list.map((p: any) => ({
      name: p.name,
      image: p.image,
      is_private: p.is_private,
      is_saved: p.is_saved
    }));
  }, [tabsData?.participants_list]);

  const hasMoreParticipants = tabsData?.participants_has_more || false;
  const moreParticipantsCount = tabsData?.participants_more_count || 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Загружаем детали только после того как определились с авторизацией
  useEffect(() => {
    if (identifier && mounted && !isAuthLoading) {
      fetchCardDetail(identifier, isAuthenticated);
    }
  }, [identifier, mounted, isAuthenticated, isAuthLoading, fetchCardDetail]);

  // Обновляем состояние лайка только для приватных данных
  useEffect(() => {
    if (isAuthenticated && detailData) {
      setIsLikedLocal(detailData.is_liked);
    }
  }, [detailData, isAuthenticated]);

  // Проверяем, можно ли показывать кнопку лайка
  const canShowLikeButton =
    isAuthenticated && previewData?.id && !isLoadingDetail;
  const isLiked = detailData?.is_liked ?? false;

  // Определяем, готовы ли мы к рендерингу
  // Для шапки используем previewData (серверные данные)
  // Для лайка и деталей ждем загрузки detailData
  const isHeaderReady = mounted && !isLoadingPreview;
  const isDetailsReady =
    mounted &&
    !isAuthLoading &&
    !isLoadingDetail &&
    (!isAuthenticated || (isAuthenticated && detailData));

  if (!isHeaderReady) {
    return (
      <div className='relative flex min-h-screen flex-col'>
        <div className='relative z-10 border-b'>
          <div className='container mx-auto flex h-16 items-center justify-between px-4'>
            <div className='bg-muted/50 h-8 w-20 rounded'></div>
            <div className='flex items-center gap-4'>
              <div className='bg-muted/50 h-8 w-8 rounded'></div>
              <div className='bg-muted/50 h-8 w-16 rounded'></div>
            </div>
          </div>
        </div>
        <main className='relative z-10 flex flex-1 items-center justify-center'>
          <div className='bg-muted/50 h-64 w-full max-w-md rounded-lg'></div>
        </main>
      </div>
    );
  }

  // Функция для преобразования текста со ссылками
  const renderTextWithLinks = (text: string) => {
    if (!text) return text;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        const getDomainWithPath = (url: string) => {
          try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.replace('www.', '');
            const pathname = urlObj.pathname === '/' ? '' : urlObj.pathname;
            return hostname + pathname;
          } catch {
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

  // Обработчик лайка
  const handleToggleLike = async () => {
    if (!previewData?.id || isTogglingLike || !isAuthenticated) {
      return;
    }

    try {
      const success = await toggleLike(previewData.id, isLikedLocal);

      if (!success) {
        toast.error('Не удалось обновить статус лайка');
        return;
      }

      toast.success(isLikedLocal ? 'Проект убран из избранного!' : 'Проект добавлен в избранное!');
    } catch (error) {
      console.error('[PublicProjectPage] toggleLike error:', error);
      toast.error('Не удалось обновить статус лайка');
    }
  };

  // Обработчик подтверждения intro
  const handleApproveIntro = async () => {
    if (!signedToken || isApprovingIntro || introApproved) {
      return;
    }

    setIsApprovingIntro(true);
    try {
      const response = await fetch('/api/cards/intro/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: signedToken })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to approve intro';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = `${response.status} ${response.statusText}`;
        }
        console.error('[Approve Intro] API error:', {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage
        });
        toast.error(errorMessage);
        return;
      }

      const data = await response.json();
      console.log('[Approve Intro] Response data:', data);
      
      if (data.success) {
        setIntroApproved(true);
        toast.success(data.message || 'Запрос на интро успешно одобрен!');
      } else {
        toast.error(data.message || 'Не удалось одобрить интро');
      }
    } catch (error) {
      console.error('[Approve Intro] Error:', error);
      toast.error('Не удалось одобрить интро');
    } finally {
      setIsApprovingIntro(false);
    }
  };

  // Simple fallback LinkedIn display component
  const SimpleLinkedInDisplay = ({
    signals,
    mainUrl,
    socialLinks
  }: {
    signals: any[];
    mainUrl?: string;
    socialLinks?: Array<{ name: string; url: string }>;
  }) => {
    if (!signals || signals.length === 0) {
      return (
        <div className='text-muted-foreground text-center'>
          No LinkedIn data available
        </div>
      );
    }

    return (
      <div className='space-y-6'>
        {signals.map((signal, index) => {
          const linkedinData = signal.linkedinData;

          if (!linkedinData) {
            return null;
          }

          return (
            <div key={index} className='space-y-4'>
              {/* Basic Info */}
              <div className='rounded-lg border p-4'>
                <div className='mb-2 flex items-start justify-between'>
                  <h4 className='text-foreground text-lg font-medium'>
                    {signal.name}
                  </h4>

                  {/* Social Links - Same as normal signal cards */}
                  <div className='flex items-center gap-1'>
                    <LinksList
                      mainUrl={mainUrl}
                      socialLinks={socialLinks}
                      variant='details'
                    />
                  </div>
                </div>

                {/* Summary */}
                {linkedinData.summary && (
                  <div className='mb-4'>
                    <h5 className='text-foreground mb-1 text-sm font-medium'>
                      Резюме
                    </h5>
                    <p className='text-muted-foreground text-sm'>
                      {linkedinData.summary}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {linkedinData.tags && linkedinData.tags.length > 0 && (
                  <div className='mb-4'>
                    <h5 className='text-foreground mb-1 text-sm font-medium'>
                      Предыстория
                    </h5>
                    <div className='flex flex-wrap gap-1'>
                      {linkedinData.tags.map(
                        (tag: string, tagIndex: number) => (
                          <Badge
                            key={tagIndex}
                            variant='outline'
                            className='text-xs'
                          >
                            {tag}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {linkedinData.experience &&
                  linkedinData.experience.length > 0 && (
                    <div className='mb-4'>
                      <h5 className='text-foreground mb-1 text-sm font-medium'>
                        Опыт
                      </h5>
                      <div className='space-y-2'>
                        {linkedinData.experience
                          .slice(0, 3)
                          .map((exp: string, expIndex: number) => (
                            <div
                              key={expIndex}
                              className='bg-muted text-muted-foreground rounded p-2 text-sm'
                            >
                              {exp}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                {/* Notable Achievements */}
                {linkedinData.notableAchievements && (
                  <div className='mb-4'>
                    <h5 className='text-foreground mb-1 text-sm font-medium'>
                      Значительные достижения
                    </h5>
                    <p className='text-muted-foreground rounded border border-green-200 bg-green-50 p-2 text-sm dark:border-green-800 dark:bg-green-950'>
                      {linkedinData.notableAchievements}
                    </p>
                  </div>
                )}

                {/* View on Veck Badge - Matching normal public signal cards */}
                <div className='group relative flex flex-col items-center justify-center overflow-hidden rounded-md border border-zinc-200 p-3 text-center transition-all dark:border-zinc-700'>
                  <div className='absolute inset-0 bg-gradient-to-br from-blue-100/60 via-purple-100/50 to-rose-100/60 transition-transform duration-200 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-rose-900/20'></div>
                  <div className='relative z-10'>
                    <h4 className='bg-gradient-to-r from-zinc-900 to-zinc-700 bg-clip-text text-sm font-medium text-transparent dark:from-zinc-100 dark:to-zinc-300'>
                      More on VECK
                    </h4>
                    <p className='mt-2 text-xs text-zinc-700 dark:text-zinc-300'>
                      Get access to full information about the project,
                      investors and signals on the platform
                    </p>
                    <Link href='/auth/sign-in'>
                      <Button
                        variant='outline'
                        size='sm'
                        className='mt-3 border-zinc-200 bg-white text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200'
                      >
                        Sign in to Platform
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className='relative flex min-h-screen flex-col'>
      {/* Header - Sticky */}
      <header className='bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur'>
        <div className='container mx-auto flex h-16 items-center justify-between px-4'>
          <div className='flex items-center gap-0'>
            <Link href='/'>
              <img
                src='/logo/compact/logo.png'
                alt='Logo'
                width={32}
                height={32}
                className='max-w-[32px] max-h-[32px] object-contain'
              />
            </Link>
          </div>
          <div className='flex items-center gap-4'>
            <ModeToggle />
            {isAuthenticated ? (
              <Link href='/app'>
                <Button variant='default' className='gap-2'>
                  <Icons.arrowRight className='h-4 w-4 rotate-180' />
                  Вернуться к ленте
                </Button>
              </Link>
            ) : (
              <>
                <Link href='/auth/sign-in'>
                  <Button variant='ghost'>Вход</Button>
                </Link>
                <Button
                  onClick={() =>
                    window.open(
                      'https://calendly.com/is-theveck/30min',
                      '_blank'
                    )
                  }
                >
                  Записаться на демо
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='bg-secondary/50 relative z-10 flex flex-1 justify-center pt-8 pb-12'>
        <div className='container mx-auto max-w-4xl px-4'>
          {/* Approve Intro Button or Success Message - show if sig parameter exists */}
          {signedToken && (
            <>
              {/* If card is already open to intro, show success message */}
              {isAlreadyOpenToIntro ? (
                <div className='mb-6'>
                  <div className='bg-primary/10 border-primary/20 text-primary flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm'>
                    <IconCheck className='h-4 w-4' />
                    <span>Intro request approved successfully!</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Show button if not approved yet */}
                  {!introApproved && (
                    <div className='mb-6'>
                      <Button
                        onClick={handleApproveIntro}
                        disabled={isApprovingIntro}
                        variant='default'
                        size='lg'
                        className='w-full gap-2'
                      >
                        {isApprovingIntro ? (
                          <>
                            <IconLoader2 className='h-4 w-4 animate-spin' />
                            Approving intro...
                          </>
                        ) : (
                          <>
                            <IconCheck className='h-4 w-4' />
                            Approve intro
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  {/* Show success message after approval */}
                  {introApproved && (
                    <div className='mb-6'>
                      <div className='bg-primary/10 border-primary/20 text-primary flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm'>
                        <IconCheck className='h-4 w-4' />
                        <span>Intro request approved successfully!</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
          <Card className='gap-0 overflow-hidden border-[0.5px] shadow-none'>
            {isLoadingPreview ? (
              <CardHeader className='text-center'>
                <div className='mb-4 flex justify-center'>
                  <div className='bg-muted flex h-16 w-16 items-center justify-center rounded-full'>
                    <Icons.spinner className='h-8 w-8 animate-spin' />
                  </div>
                </div>
                <CardTitle>Loading project...</CardTitle>
              </CardHeader>
            ) : headerData && !error ? (
              <>
                {/* Header Section with Card Style */}
                <CardHeader className='bg-muted/20 px-6'>
                  <div className='flex flex-col gap-4 sm:flex-row sm:gap-5'>
                    {/* Mobile: Top row with image and title */}
                    <div className='flex gap-3 sm:contents'>
                      {/* Project Image */}
                      <div className='border-border bg-muted h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-[0.5px] sm:h-20 sm:w-20'>
                        {headerData.image ? (
                          <img
                            src={headerData.image}
                            alt={headerData.name}
                            className='h-full w-full object-cover'
                          />
                        ) : (
                          <div className='text-muted-foreground flex h-full w-full items-center justify-center text-sm font-medium sm:text-base'>
                            {headerData.name?.[0] || '?'}
                          </div>
                        )}
                      </div>

                      {/* Mobile: Title and badges in same row as image */}
                      <div className='min-w-0 flex-1 sm:hidden'>
                        <div className='mb-1 flex flex-wrap items-center gap-1.5'>
                          <h1 className='text-lg font-semibold'>
                            {headerData.name}
                          </h1>
                          {headerData.stage_info &&
                            headerData.stage_info.name !== 'Unknown' && (
                              <Badge variant='secondary' className='text-xs'>
                                {headerData.stage_info.name}
                              </Badge>
                            )}
                          {headerData.round_status_info &&
                            headerData.round_status_info.name !== 'Unknown' && (
                              <Badge
                                variant='secondary'
                                className='flex items-center gap-1 text-xs'
                              >
                                {getRoundStatusIcon(
                                  headerData.round_status_info.key || 'unknown'
                                )}
                                {headerData.round_status_info.name}
                              </Badge>
                            )}
                        </div>
                        <p className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
                          {headerData.description
                            ? renderTextWithLinks(headerData.description)
                            : 'Описание недоступно'}
                        </p>
                      </div>
                    </div>

                    {/* Desktop Project Info / Mobile: Full width content */}
                    <div className='min-w-0 flex-1'>
                      {/* Desktop title and badges */}
                      <div className='mb-2 hidden flex-wrap items-center gap-2 sm:flex'>
                        <h1 className='text-xl font-semibold'>
                          {headerData.name}
                        </h1>
                        {headerData.stage_info &&
                          headerData.stage_info.name !== 'Unknown' && (
                            <Badge variant='secondary' className='text-sm'>
                              {headerData.stage_info.name}
                            </Badge>
                          )}
                        {headerData.round_status_info &&
                          headerData.round_status_info.name !== 'Unknown' && (
                            <Badge
                              variant='secondary'
                              className='flex items-center gap-1 text-sm'
                            >
                              {getRoundStatusIcon(
                                headerData.round_status_info.key || 'unknown'
                              )}
                              {headerData.round_status_info.name}
                            </Badge>
                          )}
                      </div>

                      <p className='mb-3 hidden text-sm text-zinc-600 sm:block dark:text-zinc-400'>
                        {headerData.description
                          ? renderTextWithLinks(headerData.description)
                          : 'Описание недоступно'}
                      </p>

                      {/* Categories */}
                      {headerData.categories_list &&
                        headerData.categories_list.length > 0 && (
                          <div className='mb-3'>
                            <div className='flex flex-wrap gap-1.5 sm:gap-2'>
                              {headerData.categories_list.map(
                                (category: any) => (
                                  <Badge
                                    key={category.id}
                                    variant='outline'
                                    className='border-zinc-300 text-xs text-zinc-600 dark:border-zinc-600 dark:text-zinc-300'
                                  >
                                    {category.name}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Meta Information */}
                      <div className='flex flex-wrap gap-4 text-xs text-zinc-600 dark:text-zinc-400'>
                        {headerData.location &&
                          headerData.location !== 'unknown' && (
                            <div className='flex items-center gap-1'>
                              <IconMapPin className='h-3.5 w-3.5' />
                              <span>{headerData.location}</span>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Action Buttons - Mobile: Full width row, Desktop: Column */}
                    <div className='flex w-full items-center gap-3 sm:w-auto sm:flex-col sm:items-end'>
                      <div className='order-2 flex items-center gap-1 sm:order-1'>
                        <SocialLinksIcons
                          mainUrl={headerData.url}
                          socialLinks={headerData.social_links}
                        />
                        {canShowLikeButton && (
                          <LikeButton
                            onClick={handleToggleLike}
                            isLiked={isLiked}
                            isLoading={isTogglingLike}
                            variant='details'
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Tabs Section - Show tabs even during loading, but with loading state inside */}
                {(() => {
                  // Calculate available tabs based on preview data for structure
                  const hasTeam =
                    (detailData?.people && detailData.people.length > 0) ||
                    (previewData?.people && previewData.people.length > 0);
                  const hasFunding =
                    (detailData?.funding &&
                      ((detailData.funding.rounds?.length || 0) > 0 ||
                        detailData.funding.total_raised)) ||
                    (previewData?.funding &&
                      ((previewData.funding.rounds?.length || 0) > 0 ||
                        previewData.funding.total_raised));
                  const availableTabsCount =
                    1 + (hasTeam ? 1 : 0) + (hasFunding ? 1 : 0); // Always have investors tab

                  // Show separator only when tabs are hidden
                  if (availableTabsCount < 2) {
                    return (
                      <>
                        <CardContent className='px-6 pt-2 pb-6'>
                          <div className='space-y-4'>
                            {hasLinkedInData ? (
                              <SimpleLinkedInDisplay
                                signals={getLinkedInSignals}
                                mainUrl={detailData?.url}
                                socialLinks={detailData?.social_links}
                              />
                            ) : (
                              <>
                                {/* Fallback: Show LinkedIn data even if detection fails */}
                                {detailData?.signals?.some(
                                  (s: any) => s.linkedinData
                                ) && (
                                  <SimpleLinkedInDisplay
                                    signals={detailData.signals.filter(
                                      (s: any) => s.linkedinData
                                    )}
                                    mainUrl={detailData?.url}
                                    socialLinks={detailData?.social_links}
                                  />
                                )}
                                {!detailData?.signals?.some(
                                  (s: any) => s.linkedinData
                                ) && (
                                  <CardInteractionsTab
                                    detailedCard={detailData as any}
                                    isAuthenticated={isAuthenticated}
                                    isLoading={isLoadingDetail}
                                    isPublicPage={true}
                                  />
                                )}
                              </>
                            )}
                          </div>
                        </CardContent>
                      </>
                    );
                  }

                  // Show tabs without separator
                  return (
                    <CardContent className='px-6 pt-2 pb-6'>
                      <Tabs defaultValue='investors' className='w-full'>
                        <TabsList
                          className={`grid w-full ${
                            hasTeam && hasFunding
                              ? 'grid-cols-3'
                              : 'grid-cols-2'
                          }`}
                        >
                          <TabsTrigger
                            value='investors'
                            className='cursor-pointer text-xs'
                          >
                            Инвесторы
                          </TabsTrigger>
                          {hasTeam && (
                            <TabsTrigger
                              value='team'
                              className='cursor-pointer text-xs'
                            >
                              Команда
                            </TabsTrigger>
                          )}
                          {hasFunding && (
                            <TabsTrigger
                              value='funding'
                              className='cursor-pointer text-xs'
                            >
                              Финансирование
                            </TabsTrigger>
                          )}
                        </TabsList>

                        <div className='mt-2'>
                          {/* Вкладка Инвесторы */}
                          <TabsContent value='investors' className='space-y-4'>
                            {hasLinkedInData ? (
                              <SimpleLinkedInDisplay
                                signals={getLinkedInSignals}
                                mainUrl={detailData?.url}
                                socialLinks={detailData?.social_links}
                              />
                            ) : (
                              <>
                                {/* Fallback: Show LinkedIn data even if detection fails */}
                                {detailData?.signals?.some(
                                  (s: any) => s.linkedinData
                                ) && (
                                  <SimpleLinkedInDisplay
                                    signals={detailData.signals.filter(
                                      (s: any) => s.linkedinData
                                    )}
                                    mainUrl={detailData?.url}
                                    socialLinks={detailData?.social_links}
                                  />
                                )}
                                {!detailData?.signals?.some(
                                  (s: any) => s.linkedinData
                                ) && (
                                  <CardInteractionsTab
                                    detailedCard={detailData as any}
                                    isAuthenticated={isAuthenticated}
                                    isLoading={isLoadingDetail}
                                    isPublicPage={true}
                                  />
                                )}
                              </>
                            )}
                          </TabsContent>

                          {/* Team Tab */}
                          {hasTeam && (
                            <TabsContent value='team' className='space-y-4'>
                              <CardTeamTab
                                detailedCard={detailData as any}
                                isLoading={isLoadingDetail}
                              />
                            </TabsContent>
                          )}

                          {/* Funding Tab */}
                          {hasFunding && (
                            <TabsContent value='funding' className='space-y-4'>
                              <CardFundingTab
                                detailedCard={detailData as any}
                                isLoading={isLoadingDetail}
                              />
                            </TabsContent>
                          )}
                        </div>
                      </Tabs>
                    </CardContent>
                  );
                })()}
              </>
            ) : (
              <div className='flex flex-col items-center justify-center px-6 py-16 text-center'>
                <span className='from-foreground bg-linear-to-b to-transparent bg-clip-text text-[8rem] leading-none font-extrabold text-transparent'>
                  404
                </span>
                <h2 className='font-heading my-2 text-2xl font-bold'>
                  {error || 'Project Not Found'}
                </h2>
                <p className='text-muted-foreground mb-8'>
                  {error
                    ? 'Please try again or contact support if the problem persists'
                    : identifier
                      ? 'Card not found or access denied'
                      : 'No project identifier provided'}
                </p>
                <div className='flex justify-center gap-2'>
                  <Button
                    onClick={() => window.history.back()}
                    variant='default'
                    size='lg'
                  >
                    Назад
                  </Button>
                  <Button
                    onClick={() => (window.location.href = '/')}
                    variant='ghost'
                    size='lg'
                  >
                    Вернуться на главную
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className='bg-muted/30 relative z-10 border-t py-6'>
        <div className='container mx-auto flex items-center justify-between px-4 text-sm text-zinc-600 dark:text-zinc-400'>
          <p>© 2025 VECK. Все права защищены.</p>
          <div className='flex gap-4'>
            <Link
              href='https://theveck.com/privacy-policy'
              className={`hover:${resolvedTheme === 'dark' ? 'text-white' : 'text-black'} transition-colors`}
            >
              Privacy
            </Link>
            <Link
              href='https://theveck.com/terms'
              className={`hover:${resolvedTheme === 'dark' ? 'text-white' : 'text-black'} transition-colors`}
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
