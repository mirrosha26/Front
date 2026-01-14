'use client';

import { useState, memo, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  IconLock, 
  IconArrowLeft, 
  IconArrowUp,
  IconChevronRight,
  IconHome,
  IconHeart,
  IconHeartFilled
} from '@tabler/icons-react';
import { LikeButton } from '@/features/shared/components/ui/actions/like';
import { Participant, ParticipantWithChildren } from '@/lib/graphql/types';
import { toast } from 'sonner';
import Link from 'next/link';
import { useInvestorsGraphQL } from '@/features/investors/contexts/investors-graphql-context';
import { useRouter } from 'next/navigation';
import { SocialIcon } from '@/features/shared/components/ui/social-icon';
import { getSocialIconNameFromSource } from '@/features/shared/utils/formatting';
import { InvestorSignalsPage } from './investor-signals-page';



// Утилиты
const getInitials = (name: string) => name.charAt(0).toUpperCase();

const formatParticipantType = (type: string) => {
  switch (type.toLowerCase()) {
    case 'investor':
      return 'Investor';
    case 'angel':
      return 'Angel';
    case 'fund':
      return 'Fund';
    case 'accelerator':
      return 'Accelerator';
    case 'syndicate':
      return 'Syndicate';
    case 'platform':
      return 'Platform';
    case 'scout':
      return 'Scout';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

const getAvatarVariant = (participant: Participant) => {
  if (participant.isPrivate) return 'private';
  if (participant.isSaved) return 'followed';
  return 'default';
};

// Функция для обработки ссылок в описании
const processDescription = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};


// Хук для навигации назад
const useNavigation = () => {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    const currentPage = window.location.href;
    const storedPreviousPage = sessionStorage.getItem('currentPage');
    
    if (storedPreviousPage && storedPreviousPage !== currentPage) {
      sessionStorage.setItem('previousPage', storedPreviousPage);
    }
    
    sessionStorage.setItem('currentPage', currentPage);

    // Проверяем возможность навигации назад
    const checkNavigation = () => {
      const previousPage = sessionStorage.getItem('previousPage');
      const currentOrigin = window.location.origin;
      const hasPreviousPage = previousPage && previousPage.startsWith(currentOrigin);
      
      setCanGoBack(hasPreviousPage || window.history.length > 1);
    };

    checkNavigation();
    window.addEventListener('popstate', checkNavigation);
    
    return () => window.removeEventListener('popstate', checkNavigation);
  }, []);

  // Функция для очистки истории (оставлена для совместимости)
  const clearForwardHistory = () => {
    // Больше не нужно, но оставляем для совместимости с существующим кодом
  };

  const handleBackClick = () => {
    if (!canGoBack) return;
    
    const previousPage = sessionStorage.getItem('previousPage');
    const currentOrigin = window.location.origin;
    
    if (previousPage && previousPage.startsWith(currentOrigin)) {
      router.back();
    } else {
      router.push('/app/investors');
    }
  };

  return { handleBackClick, canGoBack, clearForwardHistory };
};

// Компонент для отображения источников
const SourcesDisplay = memo(({ sources }: { sources: Participant['sources'] }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <>
      {sources.map((source, index) => {
        const sourceUrl = source.profileLink;
        if (!sourceUrl) return null;

        return (
          <a
            key={index}
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border p-0 hover:bg-accent"
          >
            <SocialIcon
              name={getSocialIconNameFromSource(source)}
              className="h-4 w-4"
            />
          </a>
        );
      })}
    </>
  );
});



// Компонент для отображения родительского фонда
const ParentBadge = memo(({ parent }: { parent: Participant }) => (
  <Link href={`/app/investors/${parent.slug}`}>
    <Badge variant="outline" className="text-xs hover:bg-accent cursor-pointer py-1.5">
      {parent.imageUrl ? (
        <img
          src={parent.imageUrl}
          alt={parent.name}
          className="size-6 rounded-full mr-1"
        />
      ) : (
        <div className="size-6 rounded-full bg-muted flex items-center justify-center mr-1">
          <span className="text-xs font-medium">
            {getInitials(parent.name)}
          </span>
        </div>
      )}
      {parent.name}
    </Badge>
  </Link>
));

// Компонент хлебных крошек с кнопками навигации
const Breadcrumbs = memo(({ participant, onBackClick }: { 
  participant: ParticipantWithChildren;
  onBackClick?: () => void;
}) => {
  const router = useRouter();
  const { canGoBack, clearForwardHistory } = useNavigation();

  const handleNavigateToDb = () => {
    // Очищаем историю "вперед" при прямом переходе
    clearForwardHistory();
    
    // Всегда делаем прямой переход на Investors
    router.push('/app/investors');
  };

  const handleNavigateToParent = () => {
    if (participant.parent) {
      // Очищаем историю "вперед" при прямом переходе
      clearForwardHistory();
      router.push(`/app/investors/${participant.parent.slug}`);
    }
  };

  return (
    <div className="sticky top-0 z-20 pt-4 mb-0 bg-background/90 backdrop-blur-sm border-b pb-2">
      <div className="flex items-center justify-between">
        {/* Кнопки навигации в стиле браузера */}
        <div className="flex items-center gap-1 mr-3">
          {onBackClick && (
            <button 
              onClick={onBackClick}
              disabled={!canGoBack}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors group border ${
                canGoBack 
                  ? 'hover:bg-accent cursor-pointer border-border' 
                  : 'opacity-40 cursor-not-allowed border-border/50'
              }`}
              title={canGoBack ? "Назад" : "Нет предыдущей страницы"}
            >
              <IconArrowLeft className={`h-4 w-4 transition-colors ${
                canGoBack 
                  ? 'text-muted-foreground group-hover:text-foreground' 
                  : 'text-muted-foreground'
              }`} />
            </button>
          )}
        </div>
        
        {/* Хлебные крошки в стиле браузера */}
        <nav className="flex items-center space-x-1 text-sm flex-1">
          {/* Иконка дома для DB Investors */}
          <button
            onClick={handleNavigateToDb}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded px-1.5 py-0.5"
            title="БД Инвесторы"
          >
            <IconHome className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">DB Investors</span>
          </button>
          
          {participant.parent && (
            <>
              <IconChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <button
                onClick={handleNavigateToParent}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded px-1.5 py-0.5 max-w-[120px] sm:max-w-[150px]"
                title={participant.parent.name}
              >
                {participant.parent.imageUrl ? (
                  <img
                    src={participant.parent.imageUrl}
                    alt={participant.parent.name}
                    className="size-3.5 rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="size-3.5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium">
                      {getInitials(participant.parent.name)}
                    </span>
                  </div>
                )}
                <span className="truncate">{participant.parent.name}</span>
              </button>
            </>
          )}
          
          <IconChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-foreground font-medium flex items-center gap-1.5 rounded px-1.5 py-0.5 max-w-[120px] sm:max-w-[150px]">
            {participant.imageUrl ? (
              <img
                src={participant.imageUrl}
                alt={participant.name}
                className="size-3.5 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="size-3.5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium">
                  {getInitials(participant.name)}
                </span>
              </div>
            )}
            <span className="truncate">{participant.name}</span>
          </span>
        </nav>
      </div>
    </div>
  );
});

// Компонент для отображения дочернего участника
const ChildParticipantCard = memo(({ 
  participant, 
  onFollowToggle 
}: { 
  participant: Participant;
  onFollowToggle?: (participantId: string, currentIsSaved?: boolean) => Promise<void>;
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [localIsSaved, setLocalIsSaved] = useState(participant.isSaved || false);
  const router = useRouter();

  // Синхронизируем локальное состояние с props при изменении participant
  useEffect(() => {
    setLocalIsSaved(participant.isSaved || false);
  }, [participant.isSaved]);

  // Логируем изменения participant для отладки
  useEffect(() => {
    console.log('ChildParticipantCard: participant updated:', {
      id: participant.id,
      name: participant.name,
      isSaved: participant.isSaved,
      localIsSaved,
      timestamp: new Date().toISOString()
    });
  }, [participant.id, participant.isSaved, participant.name, localIsSaved]);

  // Используем переданный onFollowToggle или fallback на контекст
  let toggleFollow: ((participantId: string, currentIsSaved?: boolean) => Promise<void>) | undefined;
  
  if (onFollowToggle) {
    toggleFollow = onFollowToggle;
  } else {
    try {
      const context = useInvestorsGraphQL();
      toggleFollow = context.toggleFollow;
    } catch (error) {
      console.warn('InvestorsGraphQL context not available, toggleFollow will be disabled');
    }
  }

  const handleFollowToggle = async (participantId: string, currentIsSaved?: boolean) => {
    if (!toggleFollow) {
      console.warn('toggleFollow function is not available in ChildParticipantCard');
      return;
    }

    console.log('ChildParticipantCard: Toggling follow for participant:', participant.id, 'current status:', localIsSaved);

    // Оптимистично обновляем локальное состояние
    const newStatus = !localIsSaved;
    setLocalIsSaved(newStatus);

    // Сохраняем текущее состояние для возможного отката
    const currentState = localIsSaved;
    
    try {
      await toggleFollow(participantId, currentState);
      console.log('ChildParticipantCard: Toggle follow completed successfully');
    } catch (error) {
      console.error('ChildParticipantCard: Error toggling follow:', error);
      // Откатываем локальное состояние при ошибке
      setLocalIsSaved(currentState);
      // Не показываем toast, так как он уже показан в контексте
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Открываем в новой вкладке при Ctrl+клик или средней кнопкой мыши
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      window.open(`/app/investors/${participant.slug}`, '_blank');
    } else {
      router.push(`/app/investors/${participant.slug}`);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Обрабатываем среднюю кнопку мыши
    if (e.button === 1) {
      e.preventDefault();
      window.open(`/app/investors/${participant.slug}`, '_blank');
    }
  };

  const hasSources = participant.sources && participant.sources.length > 0;

  return (
    <div 
      onClick={handleCardClick} 
      onMouseDown={handleMouseDown}
      className="block"
      title="Нажмите, чтобы просмотреть детали • Ctrl+Клик для открытия в новой вкладке • Средняя кнопка мыши для открытия в новой вкладке"
    >
      <div
        className={`flex items-start space-x-3 p-3 rounded-lg transition-colors hover:bg-accent/50 cursor-pointer ${
          localIsSaved
            ? 'bg-primary/4 border-border border'
            : 'bg-card border-border border'
        }`}
      >
        <div className='h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border-2 border-border bg-muted'>
          {participant.imageUrl ? (
            <img
              src={participant.imageUrl}
              alt={participant.name}
              className='h-full w-full object-cover'
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center font-medium text-muted-foreground'>
              {getInitials(participant.name)}
            </div>
          )}
        </div>

        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <div className='flex items-center gap-1'>
              <h3 className='truncate text-sm font-medium flex items-center gap-1'>
                {participant.name}
                {participant.additionalName && (
                  <span className='text-muted-foreground ml-1'>
                    {participant.additionalName}
                  </span>
                )}
                {participant.isSaved && !participant.isPrivate && (
                  <IconHeartFilled className='h-3 w-3 text-red-500' />
                )}
              </h3>
              {participant.isPrivate && (
                <IconLock className='h-3.5 w-3.5 text-lime-500' />
              )}
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant='secondary' className='text-xs whitespace-nowrap'>
                {formatParticipantType(participant.type)}
              </Badge>
              {participant.monthlySignalsCount && participant.monthlySignalsCount > 0 ? (
                <Badge
                  variant='outline'
                  className='h-4 w-fit rounded-md px-1.5 py-0 text-xs text-[10px] font-medium text-muted-foreground'
                >
                  {participant.monthlySignalsCount} sig/mo
                </Badge>
              ) : null}
            </div>
          </div>
          
          {/* Социальные сети инлайн рядом с именем */}
          {hasSources && participant.sources && (
            <div className='flex items-center gap-1 mt-1'>
              {participant.sources.map((source, index) => {
                const sourceUrl = source.profileLink;
                if (!sourceUrl) return null;

                return (
                  <a
                    key={index}
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <SocialIcon
                      name={getSocialIconNameFromSource(source)}
                      className="h-3 w-3"
                    />
                  </a>
                );
              })}
            </div>
          )}
          
          {participant.about && (
            <p className='mt-1 line-clamp-2 text-xs text-muted-foreground'>
              {processDescription(participant.about)}
            </p>
          )}
        </div>

        <div className='flex items-start gap-2'>
          {toggleFollow && (
            <LikeButton
              isLiked={localIsSaved || false}
              isLoading={false}
              onClick={() => handleFollowToggle(participant.id, localIsSaved)}
              variant="preview"
            />
          )}
        </div>
      </div>
    </div>
  );
});

// Компонент для отображения изображения участника
const ParticipantImage = memo(({ 
  imageUrl, 
  name, 
  size = "h-16 w-16 sm:h-20 sm:w-20" 
}: { 
  imageUrl?: string; 
  name: string; 
  size?: string; 
}) => (
  <div className={`border-border bg-muted flex-shrink-0 overflow-hidden rounded-lg border-[0.5px] ${size}`}>
    {imageUrl ? (
      <img
        src={imageUrl}
        alt={name}
        className="h-full w-full object-cover"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <span className="text-lg font-semibold text-muted-foreground">
          {getInitials(name)}
        </span>
      </div>
    )}
  </div>
));

// Базовый компонент для детальной карточки
const BaseDetailCard = memo(({ 
  participant, 
  children, 
  backButtonText = "Back",
  showParentBadge = false,
  showBackButton = true,
  onFollowToggle,
  followLoading
}: { 
  participant: ParticipantWithChildren; 
  children: React.ReactNode;
  backButtonText?: string;
  showParentBadge?: boolean;
  showBackButton?: boolean;
  onFollowToggle?: (participantId: string, currentIsSaved?: boolean) => Promise<void>;
  followLoading?: string | null;
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [localIsSaved, setLocalIsSaved] = useState(participant.isSaved || false);
  const { handleBackClick } = useNavigation();

  // Синхронизируем локальное состояние с props при изменении participant
  useEffect(() => {
    setLocalIsSaved(participant.isSaved || false);
  }, [participant.isSaved]);

  // Отслеживание прокрутки страницы
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollToTop(scrollTop > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Функция прокрутки наверх
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Используем переданный onFollowToggle или fallback на контекст
  let toggleFollow: ((participantId: string, currentIsSaved?: boolean) => Promise<void>) | undefined;
  
  if (onFollowToggle) {
    toggleFollow = onFollowToggle;
  } else {
    try {
      const context = useInvestorsGraphQL();
      toggleFollow = context.toggleFollow;
    } catch (error) {
      console.warn('InvestorsGraphQL context not available, toggleFollow will be disabled');
    }
  }

  const handleFollowToggle = async (participantId: string, currentIsSaved?: boolean) => {
    console.log('🔍 BaseDetailCard handleFollowToggle called:', { participantId, currentIsSaved, toggleFollow: !!toggleFollow });
    
    if (!toggleFollow) {
      console.warn('toggleFollow function is not available');
      return;
    }

    // Оптимистично обновляем локальное состояние
    const newStatus = !localIsSaved;
    setLocalIsSaved(newStatus);

    // Сохраняем текущее состояние для возможного отката
    const currentState = localIsSaved;
    
    try {
      await toggleFollow(participantId, currentState);
      console.log('✅ BaseDetailCard toggleFollow completed successfully');
    } catch (error) {
      console.error('BaseDetailCard: Error toggling follow:', error);
      // Откатываем локальное состояние при ошибке
      setLocalIsSaved(currentState);
      // Не показываем toast, так как он уже показан в контексте
    }
  };

  // Debug: log participant data
  console.log('BaseDetailCard: participant data:', { 
    id: participant.id, 
    isSaved: participant.isSaved,
    localIsSaved,
    name: participant.name,
    timestamp: new Date().toISOString()
  });

  // Debug: log when component re-renders
  useEffect(() => {
    console.log('BaseDetailCard: Component re-rendered with participant:', {
      id: participant.id,
      isSaved: participant.isSaved,
      localIsSaved,
      name: participant.name,
      followLoading
    });
  }, [participant.id, participant.isSaved, localIsSaved, participant.name, followLoading]);

  const hasSources = participant.sources && participant.sources.length > 0;

  return (
    <div className="space-y-4 h-full flex flex-col">
      {showBackButton && <Breadcrumbs participant={participant} onBackClick={handleBackClick} />}

      <Card className="gap-0 overflow-hidden border-0 shadow-none px-3 bg-background flex-1 flex flex-col min-h-0">
        <CardHeader className="px-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
            <div className="flex gap-3 sm:contents">
              <ParticipantImage imageUrl={participant.imageUrl} name={participant.name} />

              <div className="flex flex-1 flex-col gap-2 sm:contents">
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-2">
                      <CardTitle className="text-xl sm:text-2xl">{participant.name}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        {showParentBadge && participant.parent && (
                          <ParentBadge parent={participant.parent} />
                        )}
                        <Badge variant="secondary" className="text-xs py-1.5">
                          {participant.type}
                        </Badge>
                        {participant.isPrivate && (
                          <Badge variant="outline" className="text-xs py-1.5">
                            Приватный
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasSources && <SourcesDisplay sources={participant.sources} />}
                      {toggleFollow && (
                        <LikeButton 
                          isLiked={localIsSaved} 
                          isLoading={followLoading === participant.id} 
                          onClick={() => handleFollowToggle(participant.id, localIsSaved)} 
                          variant="details"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {participant.about && (
            <div className="mt-4 mb-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {processDescription(participant.about)}
              </p>
            </div>
          )}
        </CardHeader>

        <CardContent className="px-0 flex-1 flex flex-col min-h-0">
          {children}
        </CardContent>
      </Card>

      {/* Кнопка Scroll to top */}
      {showScrollToTop && (
        <Button
          onClick={scrollToTop}
          size='icon'
          variant='default'
          className='bg-primary hover:bg-primary/90 fixed right-6 bottom-6 z-50 h-12 w-12 rounded-full shadow-lg hover:scale-110'
          aria-label='Прокрутить наверх'
        >
          <IconArrowUp className='text-primary-foreground h-5 w-5' />
        </Button>
      )}
    </div>
  );
});

// Основной компонент для детальной карточки инвестора
export const InvestorDetailCard = memo(({ 
  investor, 
  onFollowToggle 
}: { 
  investor: ParticipantWithChildren;
  onFollowToggle?: (participantId: string, currentIsSaved?: boolean) => Promise<void>;
}) => {
  return (
    <BaseDetailCard participant={investor} showParentBadge={true} onFollowToggle={onFollowToggle}>
      {investor.children && investor.children.length > 0 ? (
        <Tabs defaultValue="signals" className="w-full h-full flex flex-col">
          <div className="sticky top-12 z-10 bg-background/90 backdrop-blur-sm border-b pb-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signals">Сигналы</TabsTrigger>
              <TabsTrigger value="team">Команда</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="signals" className="flex-1 min-h-0 h-full overflow-y-auto">
            <InvestorSignalsPage participantId={investor.id} />
          </TabsContent>

          <TabsContent value="team">
            <div className="pt-2 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {investor.children.map((child) => (
                <ChildParticipantCard key={child.id} participant={child} onFollowToggle={onFollowToggle} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="h-full flex flex-col overflow-y-auto">
          <InvestorSignalsPage participantId={investor.id} />
        </div>
      )}
    </BaseDetailCard>
  );
});

// Компонент для модального режима (без кнопки "Назад")
export const InvestorDetailCardModal = memo(({ 
  investor, 
  onFollowToggle,
  followLoading
}: { 
  investor: ParticipantWithChildren;
  onFollowToggle?: (participantId: string, currentIsSaved?: boolean) => Promise<void>;
  followLoading?: string | null;
}) => {
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Отслеживание прокрутки для модального окна
  useEffect(() => {
    const handleScroll = () => {
      // Ищем контейнер с прокруткой в модальном окне
      const modalContent = document.querySelector('[data-radix-dialog-content]') as HTMLElement;
      if (modalContent) {
        const scrollTop = modalContent.scrollTop;
        setShowScrollToTop(scrollTop > 200);
      } else {
        // Fallback для обычной прокрутки страницы
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        setShowScrollToTop(scrollTop > 200);
      }
    };

    // Добавляем слушатель на модальное окно
    const modalContent = document.querySelector('[data-radix-dialog-content]') as HTMLElement;
    if (modalContent) {
      modalContent.addEventListener('scroll', handleScroll);
      return () => modalContent.removeEventListener('scroll', handleScroll);
    } else {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Функция прокрутки наверх
  const scrollToTop = () => {
    const modalContent = document.querySelector('[data-radix-dialog-content]') as HTMLElement;
    if (modalContent) {
      modalContent.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <BaseDetailCard participant={investor} showParentBadge={true} showBackButton={false} onFollowToggle={onFollowToggle} followLoading={followLoading}>
      {investor.children && investor.children.length > 0 ? (
        <Tabs defaultValue="signals" className="w-full h-full flex flex-col">
          <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm pb-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signals">Сигналы</TabsTrigger>
              <TabsTrigger value="team">Команда</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="signals" className="flex-1 min-h-0 h-full overflow-y-auto">
            <InvestorSignalsPage participantId={investor.id} />
          </TabsContent>

          <TabsContent value="team" className="flex-1 min-h-0 h-full overflow-y-auto">
            <div className="pt-2 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {investor.children.map((child) => (
                <ChildParticipantCard key={child.id} participant={child} onFollowToggle={onFollowToggle} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="h-full flex flex-col overflow-y-auto">
          <InvestorSignalsPage participantId={investor.id} />
        </div>
      )}

      {/* Кнопка Scroll to top для модального окна */}
      {showScrollToTop && (
        <Button
          onClick={scrollToTop}
          size='icon'
          variant='default'
          className='bg-primary hover:bg-primary/90 fixed right-6 bottom-6 z-50 h-12 w-12 rounded-full shadow-lg hover:scale-110'
          aria-label='Прокрутить наверх'
        >
          <IconArrowUp className='text-primary-foreground h-5 w-5' />
        </Button>
      )}
    </BaseDetailCard>
  );
});

// Основной компонент для детальной карточки фонда
export const FundDetailCard = memo(({ fund }: { fund: ParticipantWithChildren }) => {
  return (
    <BaseDetailCard participant={fund} backButtonText="Вернуться к базе инвесторов">
      {fund.children && fund.children.length > 0 ? (
        <Tabs defaultValue="signals" className="w-full h-full flex flex-col">
          <div className="sticky top-12 z-10 bg-background/90 backdrop-blur-sm border-b pb-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signals">Сигналы</TabsTrigger>
              <TabsTrigger value="team">Команда</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="signals" className="flex-1 min-h-0 h-full overflow-y-auto">
            <InvestorSignalsPage participantId={fund.id} />
          </TabsContent>

          <TabsContent value="team">
            <div className="pt-2 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {fund.children.map((child) => (
                <ChildParticipantCard key={child.id} participant={child} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="h-full flex flex-col overflow-y-auto">
          <InvestorSignalsPage participantId={fund.id} />
        </div>
      )}
    </BaseDetailCard>
  );
});

// Компонент для модального режима (без кнопки "Назад")
export const FundDetailCardModal = memo(({ 
  fund, 
  onFollowToggle,
  followLoading
}: { 
  fund: ParticipantWithChildren;
  onFollowToggle?: (participantId: string, currentIsSaved?: boolean) => Promise<void>;
  followLoading?: string | null;
}) => {
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Отслеживание прокрутки для модального окна
  useEffect(() => {
    const handleScroll = () => {
      // Ищем контейнер с прокруткой в модальном окне
      const modalContent = document.querySelector('[data-radix-dialog-content]') as HTMLElement;
      if (modalContent) {
        const scrollTop = modalContent.scrollTop;
        setShowScrollToTop(scrollTop > 200);
      } else {
        // Fallback для обычной прокрутки страницы
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        setShowScrollToTop(scrollTop > 200);
      }
    };

    // Добавляем слушатель на модальное окно
    const modalContent = document.querySelector('[data-radix-dialog-content]') as HTMLElement;
    if (modalContent) {
      modalContent.addEventListener('scroll', handleScroll);
      return () => modalContent.removeEventListener('scroll', handleScroll);
    } else {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Функция прокрутки наверх
  const scrollToTop = () => {
    const modalContent = document.querySelector('[data-radix-dialog-content]') as HTMLElement;
    if (modalContent) {
      modalContent.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <BaseDetailCard participant={fund} showBackButton={false} onFollowToggle={onFollowToggle} followLoading={followLoading}>
      {fund.children && fund.children.length > 0 ? (
        <Tabs defaultValue="signals" className="w-full h-full flex flex-col">
          <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm pb-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signals">Сигналы</TabsTrigger>
              <TabsTrigger value="team">Команда</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="signals" className="flex-1 min-h-0 h-full overflow-y-auto">
            <InvestorSignalsPage participantId={fund.id} />
          </TabsContent>

          <TabsContent value="team" className="flex-1 min-h-0 h-full overflow-y-auto">
            <div className="pt-2 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {fund.children.map((child) => (
                <ChildParticipantCard key={child.id} participant={child} onFollowToggle={onFollowToggle} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="h-full flex flex-col overflow-y-auto">
          <InvestorSignalsPage participantId={fund.id} />
        </div>
      )}

      {/* Кнопка Scroll to top для модального окна */}
      {showScrollToTop && (
        <Button
          onClick={scrollToTop}
          size='icon'
          variant='default'
          className='bg-primary hover:bg-primary/90 fixed right-6 bottom-6 z-50 h-12 w-12 rounded-full shadow-lg hover:scale-110'
          aria-label='Прокрутить наверх'
        >
          <IconArrowUp className='text-primary-foreground h-5 w-5' />
        </Button>
      )}
    </BaseDetailCard>
  );
}); 