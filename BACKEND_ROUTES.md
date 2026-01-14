# Backend API Routes

Базовый URL: `https://app.theveck.com:8000` (или из переменной окружения `NEXT_PUBLIC_API_BASE_URL`)

## GraphQL

- **POST** `/graphql/` - GraphQL endpoint для всех запросов и мутаций

## Authentication (`/f-api/auth`)
- **POST** `/f-api/auth/login/` - Вход в систему
- **POST** `/f-api/auth/register/` - Регистрация нового пользователя
- **POST** `/f-api/auth/logout/` - Выход из системы
- **POST** `/f-api/auth/refresh/` - Обновление access token
- **GET** `/f-api/auth/registration-meta/` - Метаданные для регистрации
- **POST** `/f-api/auth/verify/` - Верификация пользователя
- **GET** `/f-api/auth/client-tokens/` - Получение списка клиентских токенов
- **POST** `/f-api/auth/client-tokens/create/` - Создание клиентского токена
- **DELETE** `/f-api/auth/client-tokens/{id}/delete/` - Удаление клиентского токена
  - Используется в: таблице токенов на странице `/app/profile/client-tokens`
  - Параметр: `id` токена в URL
  - После удаления освобождается слот для создания нового токена

## User (`/f-api/user`)

- **GET** `/f-api/user/profile/` - Получение профиля пользователя
- **POST** `/f-api/user/profile/update/` - Обновление профиля пользователя
- **POST** `/f-api/user/password/change/` - Изменение пароля
- **GET** `/f-api/user/settings/` - Получение настроек пользователя
- **POST** `/f-api/user/onboarding/` - Завершение онбординга
- **GET** `/f-api/user/digest-settings/` - Получение настроек дайджеста
- **POST** `/f-api/user/digest-settings/` - Обновление настроек дайджеста
- **GET** `/f-api/user/digest-settings/saved-filters/` - Получение сохраненных фильтров для дайджеста
- **POST** `/f-api/user/digest-settings/saved-filters/` - Создание сохраненного фильтра для дайджеста
- **DELETE** `/f-api/user/digest-settings/saved-filters/{id}/` - Удаление сохраненного фильтра
- **GET** `/f-api/user/digest-settings/saved-participants/` - Получение сохраненных участников для дайджеста
- **POST** `/f-api/user/digest-settings/saved-participants/` - Создание сохраненного участника для дайджеста
- **DELETE** `/f-api/user/digest-settings/saved-participants/{id}/` - Удаление сохраненного участника
- **GET** `/f-api/user/digest-settings/folders/` - Получение папок для дайджеста
- **POST** `/f-api/user/digest-settings/folders/` - Создание папки для дайджеста
- **DELETE** `/f-api/user/digest-settings/folders/{id}/` - Удаление папки для дайджеста
- **POST** `/f-api/user/group/update/` - Обновление группы пользователя
- **GET** `/f-api/user/feed-settings/` - Получение настроек фида
- **POST** `/f-api/user/feed-settings/` - Обновление настроек фида

## Cards (`/f-api/cards`)

- **GET** `/f-api/cards/` - Получение списка карточек (с параметрами фильтрации)
- **POST** `/f-api/cards/` - Сохранение карточки (добавление в избранное)
- **DELETE** `/f-api/cards/` - Удаление карточки из избранного
- **GET** `/f-api/cards/{id}/` - Получение конкретной карточки
- **POST** `/f-api/cards/{id}/favorite/` - Добавление/удаление из избранного
- **DELETE** `/f-api/cards/{id}/delete/` - Удаление карточки
- **GET** `/f-api/cards/{id}/note/` - Получение заметки к карточке
- **POST** `/f-api/cards/{id}/note/` - Создание/обновление заметки к карточке
- **DELETE** `/f-api/cards/{id}/note/` - Удаление заметки к карточке
- **GET** `/f-api/cards/{id}/folders/` - Получение папок карточки
- **POST** `/f-api/cards/{id}/folders/` - Добавление карточки в папку
- **DELETE** `/f-api/cards/{id}/folders/` - Удаление карточки из папки
- **GET** `/f-api/cards/{id}/group-members/` - Получение участников группы для карточки
- **POST** `/f-api/cards/{id}/group-members/` - Назначение участника на карточку
- **DELETE** `/f-api/cards/{id}/group-members/` - Удаление назначения участника
- **PATCH** `/f-api/cards/{id}/group-members/` - Обновление назначения участника
- **GET** `/f-api/cards/{id}/intro-signature/` - Получение подписи для интро ссылки
- **POST** `/f-api/cards/intro/approve/` - Одобрение интро (публичный эндпоинт, не требует авторизации)
- **GET** `/f-api/cards/all-by-uuid/{uuid}/` - Получение всех карточек по UUID (есть в config, но может быть не используется)
- **GET** `/f-api/folders/export/?folder=favorites` - Экспорт избранных карточек (используется через `/api/cards/favorites/export/`)

## Folders (`/f-api/folders`)

- **GET** `/f-api/folders/` - Получение списка папок
- **POST** `/f-api/folders/` - Создание новой папки
- **GET** `/f-api/folders/{id}/` - Получение конкретной папки
- **PUT** `/f-api/folders/{id}/` - Обновление папки
- **DELETE** `/f-api/folders/{id}/` - Удаление папки
- **GET** `/f-api/folders/{id}/cards/` - Получение карточек в папке
- **GET** `/f-api/folders/{id}/export/` - Экспорт папки (с параметром `name`)
- **GET** `/f-api/folders/export/` - Экспорт папки (с параметром `folder`)

## Feeds (`/f-api/feeds`)

- **GET** `/f-api/feeds/all-signals/` - Получение всех сигналов
- **GET** `/f-api/feeds/personal/` - Получение персональных фидов

## Filters (`/f-api/filters`)

- **GET** `/f-api/filters/all-signals/` - Получение фильтров для всех сигналов
- **POST** `/f-api/filters/all-signals/` - Сохранение фильтра для всех сигналов
- **GET** `/f-api/filters/personal/` - Получение фильтров для персональных фидов
- **POST** `/f-api/filters/personal/` - Сохранение фильтра для персональных фидов

## Investors (`/f-api/investors`)

- **GET** `/f-api/investors/` - Получение списка инвесторов
- **POST** `/f-api/investors/` - Создание/обновление инвестора
- **GET** `/f-api/investors/private/` - Получение приватных инвесторов

## Tickets (`/f-api/tickets`)

- **GET** `/f-api/tickets/` - Получение списка тикетов
- **POST** `/f-api/tickets/` - Создание нового тикета
- **GET** `/f-api/tickets/{id}/` - Получение конкретного тикета
- **PUT** `/f-api/tickets/{id}/` - Обновление тикета
- **DELETE** `/f-api/tickets/{id}/` - Удаление тикета

## Public (`/f-api/public`)

- **GET** `/f-api/public/{identifier}/preview/` - Получение превью публичной карточки
- **GET** `/f-api/public/{identifier}/detail/` - Получение детальной информации о публичной карточке

## Media

- **GET** `/media/{path}` - Получение медиа файлов (изображения, документы и т.д.)

## Примечания

- Все запросы (кроме публичных эндпоинтов) требуют авторизации через Bearer token в заголовке `Authorization`
- Токен передается в формате: `Authorization: Bearer {accessToken}`
- Токен хранится в httpOnly cookie `accessToken`
- Для обновления токена используется `/f-api/auth/refresh/`
- GraphQL endpoint используется для сложных запросов и мутаций
- Все эндпоинты возвращают JSON, кроме экспорта (CSV) и медиа файлов

