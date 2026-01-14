'use client';

import { SpotlightTour } from './spotlight-tour';

interface FiltersStepProps {
  isActive: boolean;
  onNext: () => void;
  onSkip: () => void;
}

export function FiltersStep({ isActive, onNext, onSkip }: FiltersStepProps) {
  return (
    <SpotlightTour
      isActive={isActive}
      targetSelector="button[data-slot='sheet-trigger']"
      title="Фильтры"
      description="Используйте фильтры для сортировки сигналов по отраслям, стадиям, инвесторам и другим параметрам. Нажмите кнопку."
      position="left"
      onComplete={onNext}
      onSkip={onNext}
      onClose={onSkip}
      waitForClick={false}
    />
  );
}


