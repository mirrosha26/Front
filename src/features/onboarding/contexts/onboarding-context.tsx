'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  targetElement?: string; // CSS selector для элемента, к которому нужно привязаться
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
};

interface OnboardingContextType {
  currentStep: number;
  steps: OnboardingStep[];
  isOnboardingActive: boolean;
  showCelebration: boolean;
  startOnboarding: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  goToStep: (stepIndex: number) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

// Тестовый режим - не сохраняем состояние в localStorage
// Для отключения в продакшене измените на false
const TEST_MODE = false;

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const pathname = usePathname();

  // Backend sync helpers
  const getOnboardingStatus = async () => {
    try {
      const res = await fetch('/api/user/onboarding/', {
        method: 'GET',
        credentials: 'include'
      });
      if (!res.ok) {
        console.warn('[Onboarding] API returned non-OK status:', res.status, res.statusText);
        // If 401/403, user is not authenticated - return null to use fallback
        if (res.status === 401 || res.status === 403) {
          return null;
        }
        // For other errors, try to parse response anyway
        try {
          const errorData = await res.json();
          console.warn('[Onboarding] Error response:', errorData);
        } catch {
          // Ignore parse errors
        }
        return null;
      }
      const data = await res.json();
      console.log('[Onboarding] Fetched status from API:', data);
      return data as {
        status: 'DISABLED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
        last_step_key: string | null;
        completed_at: string | null;
        updated_at: string;
      };
    } catch (e) {
      console.error('[Onboarding] Failed to fetch onboarding status', e);
      return null;
    }
  };

  const postOnboardingUpdate = async (payload: {
    status?: 'DISABLED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
    last_step_key?: string;
  }) => {
    try {
      await fetch('/api/user/onboarding/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error('Failed to update onboarding status', e);
    }
  };

  // Определяем шаги онбординга
  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: '',
      description:
        'Давайте пройдем краткий тур по приложению, чтобы помочь вам начать работу.',
      position: 'center'
    },
    {
      id: 'filters',
      title: 'Фильтры',
      description:
        'Используйте фильтры для сортировки сигналов по отраслям, стадиям, инвесторам и другим параметрам. Нажмите кнопку.',
      targetElement: 'button',
      position: 'top'
    },
    {
      id: 'saved-filters',
      title: 'Сохранить фильтры',
      description:
        'Вы можете сохранить свои фильтры для быстрого доступа позже.',
      targetElement: 'button',
      position: 'left'
    },
    {
      id: 'settings',
      title: 'Настройки',
      description:
        'Сортировка проектов по дате сигнала или количеству сигналов.',
      targetElement: 'button',
      position: 'left'
    },
    {
      id: 'newly-added',
      title: 'Недавно добавленные',
      description:
        'Используйте этот переключатель, чтобы просматривать только новые сигналы, добавленные за последнюю неделю.',
      targetElement: 'button',
      position: 'left'
    },
    {
      id: 'investors',
      title: 'Пользовательские списки инвесторов',
      description:
        'Настройте свои пользовательские списки инвесторов. Добавьте конкретных инвесторов в свой список для удобного использования в фильтрах или персонализации уведомлений по электронной почте.',
      targetElement: 'nav',
      position: 'left'
    },
    {
      id: 'settings-modal',
      title: 'Настройте свой профиль',
      description:
        'Чтобы получать наиболее релевантный контент, настройте параметры своего профиля.',
      position: 'center'
    }
  ];

  useEffect(() => {
    // Разрешаем онбординг на всех страницах приложения
    const isAllowedPath = pathname.startsWith('/app');
    console.log('[Onboarding] Path check:', { pathname, isAllowedPath });
    if (!isAllowedPath) {
      console.log('[Onboarding] Path not allowed, skipping initialization');
      return;
    }

    // Проверяем, завершил ли пользователь онбординг
    if (typeof window !== 'undefined') {
      if (TEST_MODE) {
        // В тестовом режиме всегда показываем онбординг
        console.log('[Onboarding] TEST_MODE active, showing onboarding');
        setIsOnboardingActive(true);
        return;
      }
      
      // First, try backend status - API is source of truth
      (async () => {
        console.log('[Onboarding] Fetching status from API...');
        const backend = await getOnboardingStatus();
        console.log('[Onboarding] API response:', backend);
        
        // If API returned data, use it (even if null status - means fresh account)
        if (backend !== null) {
          // Clear localStorage to avoid conflicts with previous user data
          if (typeof window !== 'undefined') {
            localStorage.removeItem('onboarding_completed');
            localStorage.removeItem('onboarding_current_step');
            localStorage.removeItem('has_seen_welcome');
          }

          // Map backend status to UI
          if (backend.status === 'DISABLED' || backend.status === 'COMPLETED' || backend.status === 'SKIPPED') {
            setHasCompletedOnboarding(true);
            setIsOnboardingActive(false);
            // Sync to localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem('onboarding_completed', 'true');
            }
            return;
          }

          if (backend.status === 'IN_PROGRESS') {
            // Restore step by key from API
            const stepKey = backend.last_step_key;
            console.log('[Onboarding] IN_PROGRESS, last_step_key:', stepKey);
            let restoredStep = 0;
            if (stepKey) {
              const idx = steps.findIndex((s) => s.id === stepKey);
              console.log('[Onboarding] Found step index for key:', stepKey, '->', idx);
              if (idx >= 0) {
                restoredStep = idx;
                setCurrentStep(idx);
                console.log('[Onboarding] Restored to step:', idx, steps[idx]?.id);
                // Sync to localStorage for instant resume on page reload
                if (typeof window !== 'undefined') {
                  localStorage.setItem('onboarding_current_step', String(idx));
                  localStorage.setItem('has_seen_welcome', 'true');
                }
              } else {
                // Step key not found in steps, start from beginning
                console.warn('[Onboarding] Step key not found in steps, starting from 0');
                setCurrentStep(0);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('onboarding_current_step', '0');
                  localStorage.setItem('has_seen_welcome', 'true');
                }
              }
            } else {
              // No step key, start from beginning
              console.log('[Onboarding] No step key, starting from 0');
              setCurrentStep(0);
              if (typeof window !== 'undefined') {
                localStorage.setItem('onboarding_current_step', '0');
                localStorage.setItem('has_seen_welcome', 'true');
              }
            }
            setIsOnboardingActive(true);
            console.log('[Onboarding] Activated onboarding, setting step to:', restoredStep);
            return;
          }

          // If backend returned null status or other status, treat as new account
          setIsOnboardingActive(true);
          setCurrentStep(0);
          return;
        }

        // API failed or returned null - fallback to localStorage (network issue scenario)
        const completed = localStorage.getItem('onboarding_completed');
        if (completed === 'true') {
          setHasCompletedOnboarding(true);
        } else {
          const hasSeenWelcome = localStorage.getItem('has_seen_welcome');
          if (!hasSeenWelcome) {
            setIsOnboardingActive(true);
          } else {
            const savedStep = localStorage.getItem('onboarding_current_step');
            if (savedStep !== null) {
              const stepIndex = parseInt(savedStep, 10);
              if (stepIndex >= 0 && stepIndex < steps.length) {
                setCurrentStep(stepIndex);
                setIsOnboardingActive(true);
              }
            }
          }
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const startOnboarding = () => {
    setIsOnboardingActive(true);
    setCurrentStep(0);
    if (!TEST_MODE) {
      postOnboardingUpdate({ status: 'IN_PROGRESS', last_step_key: steps[0].id });
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      // Сохраняем текущий шаг и отмечаем, что пользователь видел welcome
      if (typeof window !== 'undefined' && !TEST_MODE) {
        localStorage.setItem('onboarding_current_step', newStep.toString());
        localStorage.setItem('has_seen_welcome', 'true');
        postOnboardingUpdate({ status: 'IN_PROGRESS', last_step_key: steps[newStep].id });
      }
    } else {
      completeOnboarding();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = () => {
    if (typeof window !== 'undefined' && !TEST_MODE) {
      localStorage.setItem('has_seen_welcome', 'true');
      localStorage.removeItem('onboarding_current_step');
      postOnboardingUpdate({ status: 'SKIPPED' });
    }
    setIsOnboardingActive(false);
  };

  const completeOnboarding = () => {
    if (typeof window !== 'undefined' && !TEST_MODE) {
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.setItem('has_seen_welcome', 'true');
      localStorage.removeItem('onboarding_current_step');
      postOnboardingUpdate({ status: 'COMPLETED' });
    }
    setIsOnboardingActive(false);
    setHasCompletedOnboarding(true);
    // Показываем салют на короткое время
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 5000);
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        steps,
        isOnboardingActive,
        showCelebration,
        startOnboarding,
        nextStep,
        previousStep,
        skipOnboarding,
        completeOnboarding,
        goToStep
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

