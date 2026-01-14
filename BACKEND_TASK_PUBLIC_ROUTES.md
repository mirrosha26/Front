# Задача для бэкенда: Проблема с публичными роутами получения карточек

## Проблема

Фронтенд получает ошибку 404 при попытке получить публичную карточку по идентификатору `samay_maini15`.

**URL запроса:** `http://localhost:3000/public/samay_maini15`

## Используемые роуты

Фронтенд делает запросы к следующим бэкенд роутам:

1. **GET** `/f-api/public/{identifier}/preview/`
   - Используется для получения превью карточки (для SEO и начальной загрузки)
   - Вызывается из серверного компонента Next.js
   - Идентификатор: `samay_maini15`

2. **GET** `/f-api/public/{identifier}/detail/`
   - Используется для получения детальной информации о карточке
   - Вызывается из клиентского компонента
   - Идентификатор: `samay_maini15`

## Ожидаемое поведение

Эндпоинты должны поддерживать получение карточки по:
- **UUID** карточки
- **Slug** карточки (например, `samay_maini15`)

## Текущее поведение

При запросе:
```
GET /f-api/public/samay_maini15/preview/
```

Бэкенд возвращает:
- **Status:** 404 Not Found
- **Response:** Карточка не найдена

**Важное наблюдение:**
В логах Django бэкенда отсутствуют записи о запросах к `/f-api/public/{identifier}/preview/` и `/f-api/public/{identifier}/detail/`. 
В логах видны только успешные запросы к другим эндпоинтам (например, `/f-api/user/profile/`, `/f-api/auth/verify/`).

Это может означать:
1. Роуты `/f-api/public/{identifier}/preview/` и `/f-api/public/{identifier}/detail/` не настроены в Django
2. Запросы не доходят до бэкенда (ошибка маршрутизации)
3. Запросы обрабатываются, но не логируются

## Запрос к бэкенду

**Метод:** GET  
**URL:** `${API_BASE_URL}/f-api/public/{identifier}/preview/`  
**Headers:**
```
Content-Type: application/json
```

**Параметры:**
- `identifier` - строка в URL (UUID или slug карточки)

**Примеры запросов:**
- `/f-api/public/samay_maini15/preview/` - по slug
- `/f-api/public/550e8400-e29b-41d4-a716-446655440000/preview/` - по UUID

## Ожидаемый формат ответа

### Успешный ответ (200 OK)
```json
{
  "success": true,
  "card": {
    "id": 123,
    "slug": "samay_maini15",
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Название карточки",
    "description": "Описание карточки",
    "image": "/media/path/to/image.jpg",
    "url": "https://example.com",
    "created_date": "2024-01-01T00:00:00Z",
    "latest_signal_date": "2024-01-15T00:00:00Z",
    "discovered_at": "2024-01-01T00:00:00Z",
    "location": "Location",
    "is_public": true,
    "stage_info": {
      "name": "Stage Name",
      "slug": "stage-slug"
    },
    "round_status_info": {
      "key": "round_key",
      "name": "Round Name"
    },
    "categories_list": [
      {
        "id": 1,
        "name": "Category",
        "slug": "category-slug"
      }
    ],
    "social_links": [
      {
        "name": "website",
        "url": "https://example.com"
      }
    ],
    "open_to_intro": false
  }
}
```

### Ответ при отсутствии карточки (404 Not Found)
```json
{
  "success": false,
  "error_code": "NOT_FOUND",
  "message": "Card not found for this identifier"
}
```

## Вопросы для проверки

1. **Поддерживает ли бэкенд поиск по slug?**
   - Если да, то почему не находит карточку с slug `samay_maini15`?
   - Если нет, то нужно добавить поддержку поиска по slug

2. **Существует ли карточка с slug `samay_maini15` в базе данных?**
   - Проверить в базе данных наличие карточки с таким slug

3. **Правильно ли настроены роуты в Django/бэкенде?**
   - Проверить маршрутизацию `/f-api/public/{identifier}/preview/`
   - Проверить маршрутизацию `/f-api/public/{identifier}/detail/`
   - **КРИТИЧНО:** В логах Django нет запросов к этим роутам, что может означать, что они не зарегистрированы в urls.py
   - Проверить, что роуты добавлены в Django URL routing

4. **Какой формат идентификатора ожидается?**
   - UUID в формате `550e8400-e29b-41d4-a716-446655440000`
   - Slug в формате `samay_maini15`
   - Оба формата должны поддерживаться

## Дополнительная информация

- Бэкенд URL по умолчанию: `${NEXT_PUBLIC_API_BASE_URL}/f-api/public` (по умолчанию `https://app.theveck.com:8000/f-api/public`)
- Публичные эндпоинты не требуют авторизации
- Идентификатор передается в URL path, не в query параметрах

## Логи бэкенда

В логах Django видны успешные запросы к другим эндпоинтам:
```
[11/Jan/2026 21:52:34] "GET /f-api/user/profile/ HTTP/1.1" 200 366
[11/Jan/2026 21:52:35] "POST /f-api/auth/verify/ HTTP/1.1" 200 2
```

Но запросы к `/f-api/public/{identifier}/preview/` отсутствуют в логах, что указывает на проблему с маршрутизацией или регистрацией этих роутов.

## Связанные файлы фронтенда

- `src/app/api/public/[identifier]/preview/route.ts` - Next.js API route для preview
- `src/app/api/public/[identifier]/detail/route.ts` - Next.js API route для detail
- `src/app/(public)/public/[identifier]/page.tsx` - Страница публичной карточки
- `src/config/config.ts` - Конфигурация API endpoints
