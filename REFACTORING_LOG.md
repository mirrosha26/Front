# Лог рефакторинга для дипломного проекта

## Цель
Упрощение и урезание кода полноценного приложения под небольшой дипломный проект.

## Стратегия
1. Ориентация на промты от бэкенда о доступных полях/эндпоинтах
2. Упрощение полученных данных
3. Удаление ненужных частей интерфейса
4. Пошаговый рефакторинг по запросам

## Текущая структура проекта

### Основные фичи (features):
- `all-signals` - Все сигналы
- `deleted-cards` - Удаленные карточки
- `folders` - Папки
- `founder-contacts` - Контакты основателей
- `in-progress-cards` - Карточки в работе
- `investors` - Инвесторы
- `kanban` - Канбан доска
- `notes-cards` - Карточки с заметками
- `onboarding` - Онбординг
- `overview` - Обзор/дашборд
- `personal-signals` - Персональные сигналы
- `products` - Продукты
- `profile` - Профиль пользователя
- `public-project` - Публичные проекты
- `saved-cards` - Сохраненные карточки
- `shared` - Общие компоненты

### Основные страницы:
- `/app/feeds/all-signals` - Feed всех сигналов
- `/app/leads/saved` - Сохраненные лиды
- `/app/leads/hidden` - Скрытые лиды
- `/app/leads/notes` - Лиды с заметками
- `/app/leads/crm` - CRM
- `/app/investors` - Инвесторы
- `/app/founder-contacts` - Контакты основателей
- `/app/overview` - Обзор
- `/app/profile` - Профиль

## История изменений

### 2024-12-XX - Удаление полей из GraphQL схемы
- **Изменение**: Удалены поля из GraphQL схемы после рефакторинга бэкенда
- **Удаленные поля**:
  - **SignalCard**: `initialSignalType`, `location`, `people`, `openToIntro`
  - **Category**: `description`
  - **Signal**: `linkedinData`, `sourceSignalCard`, `founder`
  - **Participant**: `isPrivate`
- **Действия**:
  - [x] Удалены поля из GraphQL запросов (`src/lib/graphql/queries.ts`)
  - [x] Обновлены TypeScript типы (`src/lib/graphql/types.ts`, `src/features/shared/types/cards.ts`)
  - [x] Обновлены контексты (`src/features/shared/contexts/card-operations-context.tsx`)
  - [x] Обновлены основные компоненты (`all-signals-graphql-page.tsx`, `card-preview.tsx`)
  - [ ] Требуется дополнительная проверка компонентов, использующих удаленные поля
- **Файлы, требующие дополнительной проверки**:
  - `src/features/shared/components/cards/card-details-drawer.tsx` - использование `linkedinData`, `people`, `location`
  - `src/features/shared/components/cards/card-details-sections/` - компоненты для LinkedIn и founder
  - `src/features/shared/components/filters/` - фильтры по `isPrivate` и `location`
  - `src/features/investors/` - использование `isPrivate`
  - `src/features/public-project/` - использование `linkedinData`, `people`, `location`
  - Другие компоненты, найденные через grep

---

## Заметки
- Все изменения будут документироваться здесь
- При ошибках "полей нет" - упрощаем фронтенд под урезанную версию
- Удаляем не только данные, но и части UI, которые больше не нужны

