'use client';

import { useState, memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { IconLock, IconEye } from '@tabler/icons-react';
import { Participant } from '@/lib/graphql/types';
import { toast } from 'sonner';
import Link from 'next/link';
import { LikeButton } from '@/features/shared/components/ui/actions/like';

interface InvestorCardGraphQLProps {
  investor: Participant;
  onPreviewSignals?: (investor: Participant) => void;
  onToggleFollow?: (investorId: string, isSaved?: boolean) => Promise<void>;
  onOpenModal?: (slug: string) => void;
}

// GraphQL-compatible investor card component
export const InvestorCardGraphQL = memo(
  function InvestorCardGraphQL({
    investor,
    onPreviewSignals,
    onToggleFollow,
    onOpenModal
  }: InvestorCardGraphQLProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    // Обработчик подписки/отписки
    const handleFollowToggle = async () => {
      console.log('🔥 handleFollowToggle called:', { investorId: investor.id, isSaved: investor.isSaved });
      if (isProcessing || !onToggleFollow) return;

      setIsProcessing(true);
      try {
        await onToggleFollow(investor.id, investor.isSaved);
        console.log('🔥 handleFollowToggle completed successfully');
      } catch (error) {
        console.error('🔥 handleFollowToggle failed:', error);
        toast.error('Не удалось обновить статус подписки');
      } finally {
        setIsProcessing(false);
      }
    };

    // Обработчик предварительного просмотра сигналов
    const handlePreviewSignals = () => {
      if (onPreviewSignals) {
        onPreviewSignals(investor);
      } else {
        // Временное решение - показываем информацию о функции
        toast.info(
          `Preview signals for ${investor.name} - Feature coming soon!`
        );
      }
    };

    // Получаем инициалы для аватара
    const getInitials = () => {
      return investor.name.charAt(0).toUpperCase();
    };

    // Определяем вариант аватара
    const getAvatarVariant = () => {
      if (investor.isPrivate) return 'private';
      if (investor.isSaved) return 'followed';
      return 'default';
    };

    // Форматируем тип инвестора
    const formatInvestorType = (type: string) => {
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

    const handleCardClick = (e: React.MouseEvent) => {
      e.preventDefault();
      
      // Открываем в новой вкладке при Ctrl+клик или средней кнопкой мыши
      if (e.ctrlKey || e.metaKey || e.button === 1) {
        window.open(`/app/investors/${investor.slug}`, '_blank');
      } else if (onOpenModal) {
        onOpenModal(investor.slug);
      }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      // Обрабатываем среднюю кнопку мыши
      if (e.button === 1) {
        e.preventDefault();
        window.open(`/app/investors/${investor.slug}`, '_blank');
      }
    };

    return (
      <div
        onClick={handleCardClick}
        onMouseDown={handleMouseDown}
        className={`flex h-full flex-col rounded-lg p-3 transition-colors hover:bg-accent/50 cursor-pointer ${
          investor.isSaved
            ? 'bg-primary/4 border-border border'
            : 'bg-card border-border border'
        }`}
        title="Click to view details • Ctrl+Click to open in new tab • Middle click to open in new tab"
      >
        <div className='mb-3 flex items-start gap-3'>
          {/* Аватар */}
          <Avatar
            className='h-10 w-10 rounded-full'
            variant={getAvatarVariant()}
          >
            <AvatarImage src={investor.imageUrl} alt={investor.name} />
            <AvatarFallback
              className='bg-muted text-muted-foreground text-xs'
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          {/* Имя и тип */}
          <div className='flex flex-1 flex-col gap-1'>
            <div className='flex items-center gap-1'>
              <h3 className='text-sm font-semibold'>
                {investor.name}
                {investor.additionalName && (
                  <span className='text-muted-foreground ml-1'>
                    {investor.additionalName}
                  </span>
                )}
              </h3>
              {investor.isPrivate && (
                <IconLock className='h-3.5 w-3.5 text-lime-500' />
              )}
            </div>

            <div className='flex items-center gap-2'>
              <Badge
                variant='default'
                className='h-4 px-1.5 py-0 text-xs text-[10px] font-medium'
              >
                {formatInvestorType(investor.type)}
              </Badge>
              {investor.monthlySignalsCount && investor.monthlySignalsCount > 0 ? (
                <Badge
                  variant='outline'
                  className='h-4 w-fit rounded-md px-1.5 py-0 text-xs text-[10px] font-medium text-muted-foreground'
                >
                  {investor.monthlySignalsCount} sig/mo
                </Badge>
              ) : null}
            </div>
          </div>

            {/* Лайк кнопка */}
            {onToggleFollow && (
              <div onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}>
                <LikeButton
                  isLiked={investor.isSaved || false}
                  isLoading={false}
                  onClick={handleFollowToggle}
                  variant="preview"
                />
              </div>
            )}
        </div>

        {/* Описание */}
        {investor.about && (
          <p className='text-foreground mb-3 line-clamp-2 text-xs'>
            {investor.about}
          </p>
        )}

        {/* Кнопки действий */}
        {/* <div className='mt-auto flex flex-col gap-2'> */}
        {/* Кнопка Preview Signals */}
        {/* <Button
            variant='outline'
            size='sm'
            className='h-7 w-full text-xs'
            onClick={handlePreviewSignals}
          >
            <IconEye className='mr-1 h-3 w-3' />
            Preview Signals
          </Button> */}

        {/* Кнопка Follow/Unfollow */}
        {/* {onToggleFollow && (
            <Button
              variant={investor.isSaved ? 'outline' : 'default'}
              size='sm'
              className='h-7 w-full text-xs'
              onClick={handleFollowToggle}
              disabled={isProcessing}
            >
              {isProcessing
                ? investor.isSaved
                  ? 'Unfollowing...'
                  : 'Following...'
                : investor.isSaved
                  ? 'Unfollow'
                  : 'Follow'}
            </Button>
          )} */}
        {/* </div> */}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Кастомная функция сравнения для оптимизации
    return (
      prevProps.investor.id === nextProps.investor.id &&
      prevProps.investor.isSaved === nextProps.investor.isSaved &&
      prevProps.investor.name === nextProps.investor.name &&
      prevProps.investor.imageUrl === nextProps.investor.imageUrl &&
      prevProps.investor.isPrivate === nextProps.investor.isPrivate &&
      (prevProps.investor.monthlySignalsCount === nextProps.investor.monthlySignalsCount ||
       (prevProps.investor.monthlySignalsCount === undefined && nextProps.investor.monthlySignalsCount === undefined))
    );
  }
);
