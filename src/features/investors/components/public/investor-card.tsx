'use client';

import { useState, memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { IconLock } from '@tabler/icons-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Investor } from '../../types';
import { useInvestors } from '../../contexts/investors-context';
import { toast } from 'sonner';

interface InvestorCardProps {
  investor: Investor;
}

// Мемоизируем компонент карточки инвестора
export const InvestorCard = memo(function InvestorCard({ investor }: InvestorCardProps) {
  const { followInvestor, unfollowInvestor } = useInvestors();
  const [isProcessing, setIsProcessing] = useState(false);

  // Обработчик подписки/отписки
  const handleFollowToggle = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      let success;
      if (investor.is_followed) {
        success = await unfollowInvestor(investor.id);
      } else {
        success = await followInvestor(investor.id);
      }

      if (!success) {
        // Если операция не удалась, показываем соответствующее сообщение
        toast.error(
          investor.is_followed
            ? 'Не удалось удалить инвестора из избранного'
            : 'Не удалось добавить инвестора в избранное'
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Получаем инициалы для аватара
  const getInitials = () => {
    return investor.name.charAt(0).toUpperCase();
  };

  // Определяем вариант аватара
  const getAvatarVariant = () => {
    if (investor.is_private) return 'private';
    if (investor.is_followed) return 'followed';
    return 'default';
  };

  return (
    <div
      className={`flex h-full flex-col rounded-lg p-3 ${
        investor.is_followed
          ? 'bg-primary/4 border-border border'
          : 'bg-card border-border border'
      }`}
    >
      <div className='mb-3 flex items-start gap-3'>
        {/* Аватар */}
        <Avatar className='h-10 w-10 rounded-full' variant={getAvatarVariant()}>
          <AvatarImage src={investor.image} alt={investor.name} />
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
              {investor.additional_name && (
                <span className='text-muted-foreground ml-1'>
                  {investor.additional_name}
                </span>
              )}
            </h3>
            {investor.is_private && (
              <IconLock className='h-3.5 w-3.5 text-lime-500' />
            )}
          </div>

          <Badge
            variant='default'
            className='h-4 w-fit rounded-md px-1.5 py-0 text-xs text-[10px] font-medium'
          >
            {investor.type.charAt(0).toUpperCase() + investor.type.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Описание */}
      {investor.about && (
        <p className='text-foreground mb-3 line-clamp-2 text-xs'>
          {investor.about}
        </p>
      )}

      {/* Категории */}
      {investor.categories && investor.categories.length > 0 && (
        <div className='mb-3 flex flex-wrap gap-1'>
          {investor.categories.map((category) => (
            <Badge
              key={category.id}
              variant='outline'
              className='h-5 rounded-md px-2 py-0 text-xs font-medium'
            >
              {category.name}
            </Badge>
          ))}
        </div>
      )}

      <Button
        variant={investor.is_followed ? 'outline' : 'default'}
        className='mt-auto h-8 w-full text-xs'
        onClick={handleFollowToggle}
        disabled={isProcessing}
      >
        {isProcessing
          ? investor.is_followed
            ? 'Unfollowing...'
            : 'Following...'
          : investor.is_followed
            ? 'Unfollow'
            : 'Follow'}
      </Button>
    </div>
  );
}, (prevProps, nextProps) => {
  // Кастомная функция сравнения для оптимизации
  return (
    prevProps.investor.id === nextProps.investor.id &&
    prevProps.investor.is_followed === nextProps.investor.is_followed &&
    prevProps.investor.name === nextProps.investor.name &&
    prevProps.investor.image === nextProps.investor.image &&
    prevProps.investor.is_private === nextProps.investor.is_private
  );
});
