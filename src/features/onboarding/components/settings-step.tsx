'use client';

import { SpotlightTour } from './spotlight-tour';

interface SettingsStepProps {
  isActive: boolean;
  onNext: () => void;
  onSkip: () => void;
}

export function SettingsStep({ isActive, onNext, onSkip }: SettingsStepProps) {
  return (
    <SpotlightTour
      isActive={isActive}
      targetSelector="button[data-slot='button']:has(.tabler-icon-settings)"
      title="Настройки"
      description="Сортировать проекты по дате сигнала или количеству сигналов."
      position="left"
      onComplete={onNext}
      onSkip={onNext}
      onClose={onSkip}
      waitForClick={false}
    />
  );
}

