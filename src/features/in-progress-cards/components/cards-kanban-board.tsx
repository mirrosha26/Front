'use client';

import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SignalCard } from '@/lib/graphql/types';
import { IconGripVertical } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

type CardStatus = 'planned' | 'in_progress' | 'done';

interface CardWithStatus extends SignalCard {
  status: CardStatus;
}

interface KanbanColumnProps {
  id: CardStatus;
  title: string;
  cards: CardWithStatus[];
  onCardClick?: (card: SignalCard) => void;
}

function KanbanColumn({ id, title, cards, onCardClick }: KanbanColumnProps) {
  const cardsIds = useMemo(() => cards.map((card) => card.id), [cards]);

  return (
    <Card className='flex h-[calc(100vh-250px)] w-[350px] shrink-0 flex-col'>
      <CardHeader className='border-b pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base font-semibold'>{title}</CardTitle>
          <Badge variant='secondary' className='ml-2'>
            {cards.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='flex-1 overflow-hidden p-3'>
        <ScrollArea className='h-full'>
          <SortableContext items={cardsIds} strategy={verticalListSortingStrategy}>
            <div className='space-y-2'>
              {cards.map((card) => (
                <KanbanCard key={card.id} card={card} onClick={onCardClick} />
              ))}
            </div>
          </SortableContext>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface KanbanCardProps {
  card: CardWithStatus;
  onClick?: (card: SignalCard) => void;
}

function KanbanCard({ card, onClick }: KanbanCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: card.id,
    data: {
      type: 'Card',
      card
    }
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform)
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isDragging && 'opacity-50'
      )}
      onClick={() => onClick?.(card)}
    >
      <CardContent className='p-4'>
        <div className='flex items-start gap-2'>
          <Button
            variant='ghost'
            size='icon'
            className='h-6 w-6 shrink-0 cursor-grab p-0'
            {...attributes}
            {...listeners}
          >
            <IconGripVertical className='h-4 w-4 text-muted-foreground' />
          </Button>
          <div className='flex-1 min-w-0'>
            <h4 className='font-medium text-sm line-clamp-2'>{card.name}</h4>
            {card.description && (
              <p className='text-muted-foreground mt-1 text-xs line-clamp-2'>
                {card.description}
              </p>
            )}
            {card.categories && card.categories.length > 0 && (
              <div className='mt-2 flex flex-wrap gap-1'>
                {card.categories.slice(0, 2).map((cat) => (
                  <Badge key={cat.id} variant='outline' className='text-xs'>
                    {cat.name}
                  </Badge>
                ))}
                {card.categories.length > 2 && (
                  <Badge variant='outline' className='text-xs'>
                    +{card.categories.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CardsKanbanBoardProps {
  cards: SignalCard[];
  onCardClick?: (card: SignalCard) => void;
  onStatusChange?: (cardId: string, newStatus: CardStatus) => void;
}

export function CardsKanbanBoard({
  cards,
  onCardClick,
  onStatusChange
}: CardsKanbanBoardProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6
      }
    })
  );

  // Распределяем карточки по статусам (пока фейковые данные)
  const cardsWithStatus = useMemo<CardWithStatus[]>(() => {
    return cards.map((card, index) => {
      // Распределяем карточки по колонкам для демонстрации
      let status: CardStatus = 'planned';
      if (index % 3 === 0) {
        status = 'planned';
      } else if (index % 3 === 1) {
        status = 'in_progress';
      } else {
        status = 'done';
      }
      return { ...card, status };
    });
  }, [cards]);

  const plannedCards = useMemo(
    () => cardsWithStatus.filter((card) => card.status === 'planned'),
    [cardsWithStatus]
  );
  const inProgressCards = useMemo(
    () => cardsWithStatus.filter((card) => card.status === 'in_progress'),
    [cardsWithStatus]
  );
  const doneCards = useMemo(
    () => cardsWithStatus.filter((card) => card.status === 'done'),
    [cardsWithStatus]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeCard = cardsWithStatus.find((card) => card.id === active.id);
    if (!activeCard) return;

    // Определяем новую колонку по over.id
    let newStatus: CardStatus = activeCard.status;
    if (over.id === 'planned' || plannedCards.some((c) => c.id === over.id)) {
      newStatus = 'planned';
    } else if (over.id === 'in_progress' || inProgressCards.some((c) => c.id === over.id)) {
      newStatus = 'in_progress';
    } else if (over.id === 'done' || doneCards.some((c) => c.id === over.id)) {
      newStatus = 'done';
    }

    if (newStatus !== activeCard.status) {
      onStatusChange?.(activeCard.id, newStatus);
    }
  };

  const activeCard = activeId
    ? cardsWithStatus.find((card) => card.id === activeId)
    : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className='flex gap-4 overflow-x-auto pb-4'>
        <KanbanColumn
          id='planned'
          title='Запланировано'
          cards={plannedCards}
          onCardClick={onCardClick}
        />
        <KanbanColumn
          id='in_progress'
          title='В работе'
          cards={inProgressCards}
          onCardClick={onCardClick}
        />
        <KanbanColumn
          id='done'
          title='Done'
          cards={doneCards}
          onCardClick={onCardClick}
        />
      </div>

      <DragOverlay>
        {activeCard ? (
          <Card className='w-[320px] opacity-90 shadow-lg'>
            <CardContent className='p-4'>
              <div className='flex items-start gap-2'>
                <IconGripVertical className='h-4 w-4 shrink-0 text-muted-foreground' />
                <div className='flex-1 min-w-0'>
                  <h4 className='font-medium text-sm line-clamp-2'>
                    {activeCard.name}
                  </h4>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

