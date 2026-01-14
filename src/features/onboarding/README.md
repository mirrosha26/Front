# Onboarding System

Система онбординга для платформы VECK. Позволяет создавать пошаговые модалки для ознакомления пользователей с функциональностью.

## Тестовый режим

Для тестирования включен режим, который не сохраняет состояние в localStorage. В этом режиме:
- Онбординг показывается всегда при перезагрузке страницы
- "Пропустить" и "Завершить" не сохраняются в localStorage
- Можно тестировать циклы онбординга бесконечно

Чтобы отключить тестовый режим (для продакшена):
```typescript
// В src/features/onboarding/contexts/onboarding-context.tsx
const TEST_MODE = false; // Измените на false
```

### Утилиты для тестирования

```typescript
import { resetOnboarding, startOnboardingManually } from '@/features/onboarding';

// В консоли браузера:
resetOnboarding(); // Сбросить онбординг
startOnboardingManually(); // Перезагрузить страницу и показать онбординг
```

## Структура

```
src/features/onboarding/
├── components/
│   ├── welcome-step.tsx      # Первая приветственная модалка
│   └── onboarding-manager.tsx # Менеджер управления шагами
├── contexts/
│   └── onboarding-context.tsx # Контекст для управления состоянием
└── index.ts                   # Экспорты
```

## Как работает

1. **OnboardingProvider** - провайдер, который управляет состоянием онбординга
2. **OnboardingManager** - компонент, который отображает текущий шаг
3. При первой загрузке приложения модалка появляется автоматически
4. Состояние онбординга сохраняется в localStorage

## Добавление новых шагов

Чтобы добавить новый шаг онбординга:

1. Добавьте определение шага в `onboarding-context.tsx`:

```tsx
const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to VECK!',
    description: '...',
    position: 'center'
  },
  // Новый шаг
  {
    id: 'features',
    title: 'Explore Features',
    description: 'Discover all features',
    targetElement: '#some-element', // CSS селектор элемента
    position: 'bottom'
  }
];
```

2. Создайте компонент шага в `components/`:

```tsx
export function FeaturesStep({ isOpen, onNext, onSkip }) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent>
        {/* Ваш контент */}
        <Button onClick={onNext}>Next</Button>
      </DialogContent>
    </Dialog>
  );
}
```

3. Добавьте рендеринг в `onboarding-manager.tsx`:

```tsx
switch (currentStepData.id) {
  case 'welcome':
    return <WelcomeStep ... />;
  case 'features':
    return <FeaturesStep ... />;
  default:
    return null;
}
```

## API

### OnboardingContext

- `currentStep` - текущий индекс шага
- `steps` - массив всех шагов
- `isOnboardingActive` - активен ли онбординг
- `startOnboarding()` - начать онбординг
- `nextStep()` - следующий шаг
- `previousStep()` - предыдущий шаг
- `skipOnboarding()` - пропустить онбординг
- `completeOnboarding()` - завершить онбординг
- `goToStep(index)` - перейти к конкретному шагу

### Использование хука

```tsx
import { useOnboarding } from '@/features/onboarding';

function MyComponent() {
  const { startOnboarding, isOnboardingActive } = useOnboarding();
  
  return (
    <button onClick={startOnboarding}>
      Show Tour
    </button>
  );
}
```

## Локальное хранилище

Система использует localStorage:
- `has_seen_welcome` - пользователь видел приветствие
- `onboarding_completed` - онбординг завершен

Для сброса онбординга:

```javascript
localStorage.removeItem('onboarding_completed');
localStorage.removeItem('has_seen_welcome');
```

