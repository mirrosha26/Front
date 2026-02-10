# Backend API Routes

Базовый URL: определяется через переменную окружения `NEXT_PUBLIC_API_BASE_URL` (например: `https://api.example.com:8000`)

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
- **POST** `/f-api/user/profile/avatar/` - Обновление аватара пользователя
  - Тело запроса: `{ "avatar": "base64_encoded_image_data" }`
  - Возвращает обновленный профиль пользователя
- **POST** `/f-api/user/password/change/` - Изменение пароля
- **GET** `/f-api/user/settings/` - Получение настроек пользователя
- **POST** `/f-api/user/onboarding/` - Завершение онбординга
- **GET** `/f-api/user/digest-settings/` - Получение настроек дайджеста
  - При отсутствии настроек (404) возвращаются дефолтные значения
- **POST** `/f-api/user/digest-settings/` - Обновление настроек дайджеста
- **GET** `/f-api/user/digest-settings/saved-filters/` - Получение сохраненных фильтров для дайджеста
  - Параметры: `page` (опционально) - номер страницы для пагинации
- **POST** `/f-api/user/digest-settings/saved-filters/` - Создание сохраненного фильтра для дайджеста
- **DELETE** `/f-api/user/digest-settings/saved-filters/{id}/` - Удаление сохраненного фильтра
- **GET** `/f-api/user/digest-settings/saved-participants/` - Получение сохраненных участников для дайджеста
  - Параметры: `page` (опционально) - номер страницы для пагинации
- **POST** `/f-api/user/digest-settings/saved-participants/` - Создание сохраненного участника для дайджеста
- **DELETE** `/f-api/user/digest-settings/saved-participants/{id}/` - Удаление сохраненного участника
- **GET** `/f-api/user/digest-settings/folders/` - Получение папок для дайджеста
  - Параметры: `page` (опционально) - номер страницы для пагинации
- **POST** `/f-api/user/digest-settings/folders/` - Создание папки для дайджеста
- **DELETE** `/f-api/user/digest-settings/folders/{id}/` - Удаление папки для дайджеста
- **POST** `/f-api/user/group/update/` - Обновление группы пользователя
- **GET** `/f-api/user/feed-settings/` - Получение настроек фида
- **POST** `/f-api/user/feed-settings/` - Обновление настроек фида

## Cards (`/f-api/cards`)

- **GET** `/f-api/cards/` - Получение списка карточек (с параметрами фильтрации)
  - Параметры запроса: различные параметры фильтрации (категории, стадии, участники и т.д.)
- **POST** `/f-api/cards/` - Сохранение карточки (добавление в избранное)
- **DELETE** `/f-api/cards/` - Удаление карточки из избранного
- **GET** `/f-api/cards/{id}/` - Получение конкретной карточки
- **POST** `/f-api/cards/{id}/favorite/` - Добавление/удаление из избранного
  - Тело запроса: `{ "is_favorited": true/false }` (опционально)
- **DELETE** `/f-api/cards/{id}/delete/` - Удаление карточки
- **GET** `/f-api/cards/{id}/note/` - Получение заметки к карточке
- **POST** `/f-api/cards/{id}/note/` - Создание/обновление заметки к карточке
  - Тело запроса: `{ "note": "текст заметки" }`
- **DELETE** `/f-api/cards/{id}/note/` - Удаление заметки к карточке
- **GET** `/f-api/cards/{id}/folders/` - Получение папок карточки
- **POST** `/f-api/cards/{id}/folders/` - Добавление карточки в папку
  - Тело запроса: `{ "folder_id": number }`
- **DELETE** `/f-api/cards/{id}/folders/` - Удаление карточки из папки
  - Тело запроса: `{ "folder_id": number }`
- **GET** `/f-api/cards/{id}/group-members/` - Получение участников группы для карточки
- **POST** `/f-api/cards/{id}/group-members/` - Назначение участника на карточку
- **DELETE** `/f-api/cards/{id}/group-members/` - Удаление назначения участника
- **PATCH** `/f-api/cards/{id}/group-members/` - Обновление назначения участника
- **GET** `/f-api/cards/{id}/intro-signature/` - Получение подписи для интро ссылки
- **POST** `/f-api/cards/intro/approve/` - Одобрение интро (публичный эндпоинт, не требует авторизации)
  - Тело запроса: `{ "signature": "string" }`
- **GET** `/f-api/cards/all-by-uuid/{uuid}/` - Получение всех карточек по UUID (есть в config, но может быть не используется)
- **GET** `/f-api/cards/favorites/export/` - Экспорт избранных карточек в CSV
  - Возвращает CSV файл с именем `favorites-export-{date}.csv`
  - Используется через Next.js API route `/api/cards/favorites/export/`

## Folders (`/f-api/folders`)

- **GET** `/f-api/folders/` - Получение списка папок
- **POST** `/f-api/folders/` - Создание новой папки
  - Тело запроса: `{ "name": "название папки", ... }`
- **GET** `/f-api/folders/{id}/` - Получение конкретной папки
- **PUT** `/f-api/folders/{id}/` - Обновление папки
  - Тело запроса: `{ "name": "новое название", ... }`
- **DELETE** `/f-api/folders/{id}/` - Удаление папки
- **GET** `/f-api/folders/{id}/cards/` - Получение карточек в папке
  - Параметры запроса: параметры фильтрации и пагинации (передаются из исходного запроса)
- **GET** `/f-api/folders/{id}/export/` - Экспорт папки (с параметром `name`)
  - Параметры: `name` - имя файла для экспорта
- **GET** `/f-api/folders/export/` - Экспорт папки (с параметром `folder`)
  - Параметры: `folder` - ключ папки (например, "favorites"), `name` (опционально) - имя файла
  - Возвращает CSV файл

## Feeds (`/f-api/feeds`)

- **GET** `/f-api/feeds/all-signals/` - Получение всех сигналов
  - Параметры запроса: параметры фильтрации и пагинации (query string)
- **GET** `/f-api/feeds/personal/` - Получение персональных фидов
  - Параметры запроса: параметры фильтрации и пагинации (query string)

## Filters (`/f-api/filters`)

- **GET** `/f-api/filters/all-signals/` - Получение фильтров для всех сигналов
  - Возвращает сохраненные фильтры пользователя
- **POST** `/f-api/filters/all-signals/` - Сохранение фильтра для всех сигналов
  - Тело запроса: объект с параметрами фильтра
- **GET** `/f-api/filters/personal/` - Получение фильтров для персональных фидов
  - Возвращает сохраненные фильтры пользователя
- **POST** `/f-api/filters/personal/` - Сохранение фильтра для персональных фидов
  - Тело запроса: объект с параметрами фильтра

## Investors (`/f-api/investors`)

- **GET** `/f-api/investors/` - Получение списка инвесторов
  - Параметры: `saved` (опционально) - фильтр по сохраненным инвесторам (true/false)
- **POST** `/f-api/investors/` - Создание/обновление инвестора
- **GET** `/f-api/investors/private/` - Получение приватных инвесторов
- **POST** `/f-api/investors/private/` - Создание/обновление приватного инвестора
- **DELETE** `/f-api/investors/private/` - Удаление приватного инвестора
- **POST** `/f-api/investors/private/csv/` - Загрузка CSV файла с приватными инвесторами
  - Content-Type: `multipart/form-data`
  - Тело запроса: FormData с полем `file` (CSV файл)
  - Валидация: файл должен иметь расширение `.csv`
- **POST** `/f-api/investors/toggle-follow/` - Переключение подписки на инвестора/участника
  - Тело запроса: `{ "participantId": "string", "currentIsSaved": boolean }`
  - Используется для добавления/удаления участника из избранного

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

### Авторизация
- Все запросы (кроме публичных эндпоинтов) требуют авторизации через Bearer token в заголовке `Authorization`
- Токен передается в формате: `Authorization: Bearer {accessToken}`
- Токен хранится в httpOnly cookie `accessToken`
- Для обновления токена используется `/f-api/auth/refresh/`
- При истечении токена (401) необходимо обновить токен через refresh endpoint

### Форматы данных
- Все эндпоинты возвращают JSON, кроме экспорта (CSV) и медиа файлов
- CSV экспорт возвращает файл с соответствующими заголовками `Content-Type: text/csv` и `Content-Disposition: attachment`
- Загрузка файлов (например, CSV) использует `multipart/form-data`

### Next.js API Routes
- Все запросы к бэкенду проходят через Next.js API routes (`/api/*`)
- Next.js routes проксируют запросы на Django backend (`/f-api/*`)
- GraphQL запросы проходят через `/api/graphql` → `/graphql/` на бэкенде

### GraphQL
- GraphQL endpoint (`/graphql/`) используется для сложных запросов и мутаций
- Подробная документация по GraphQL запросам находится в `GRAPHQL_QUERIES.md`

### Пагинация
- Многие эндпоинты поддерживают пагинацию через параметры запроса (`page`, `pageSize`)
- Некоторые эндпоинты используют cursor-based пагинацию (GraphQL)

### Коды ошибок
- `401` - Неавторизованный доступ (отсутствует или истек токен)
- `404` - Ресурс не найден
- `400` - Неверный запрос (валидация данных)
- `500` - Внутренняя ошибка сервера

