'use client';

import { SpotlightTour } from './spotlight-tour';

interface SavedFiltersStepProps {
  isActive: boolean;
  onNext: () => void;
  onSkip: () => void;
}

export function SavedFiltersStep({ isActive, onNext, onSkip }: SavedFiltersStepProps) {
  return (
    <SpotlightTour
      isActive={isActive}
      targetSelector="button:has-text('Сохраненные фильтры')"
      title="Сохранить фильтры"
      description="Вы можете сохранить свои фильтры для быстрого доступа позже."
      position="left"
      onComplete={onNext}
      onSkip={onNext}
      onClose={onSkip}
      waitForClick={false}
    />
  );
}


