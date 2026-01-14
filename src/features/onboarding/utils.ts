/**
 * Утилиты для управления онбордингом
 */

/**
 * Сброс онбординга - удаляет данные из localStorage
 * Полезно для тестирования
 */
export function resetOnboarding() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('onboarding_completed');
    localStorage.removeItem('has_seen_welcome');
    console.log('Onboarding reset. Reload the page to see onboarding again.');
  }
}

/**
 * Проверка, был ли завершен онбординг
 */
export function isOnboardingCompleted(): boolean {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('onboarding_completed') === 'true';
  }
  return false;
}

/**
 * Запуск онбординга вручную
 */
export function startOnboardingManually() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('onboarding_completed');
    localStorage.removeItem('has_seen_welcome');
    window.location.reload();
  }
}


