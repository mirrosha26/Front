# Полный список GraphQL запросов и мутаций, используемых на фронтенде

## Содержание

- [GraphQL Endpoint](#graphql-endpoint)
- [Аутентификация](#аутентификация)
- [Типы пагинации](#типы-пагинации)
- [GraphQL типы данных](#graphql-типы-данных)
- [QUERIES (Запросы)](#queries-запросы)
- [MUTATIONS (Мутации)](#mutations-мутации)
- [Обработка ошибок](#обработка-ошибок)
- [Кеширование](#кеширование)
- [Статистика](#статистика)

---

## GraphQL Endpoint

Все запросы отправляются через:
- **Frontend**: `POST /api/graphql` (Next.js API route)
- **Backend**: `POST /graphql/` (Django GraphQL endpoint)

**Базовый URL**: Определяется через переменную окружения `NEXT_PUBLIC_API_BASE_URL` (например: `https://api.example.com:8000`)

---

## Аутентификация

Все запросы (кроме публичных) требуют аутентификации:
- **Метод**: Bearer Token в заголовке `Authorization`
- **Формат**: `Authorization: Bearer {accessToken}`
- **Источник токена**: HTTP-only cookie `accessToken`
- **Обновление токена**: Через REST API endpoint `/f-api/auth/refresh/`

---

## Типы пагинации

В API используются два типа пагинации:

### 1. Cursor-based pagination (для `participants`)
Используется для запросов участников с поддержкой бесконечной прокрутки:
- `first: Int` - количество элементов для загрузки
- `after: String` - курсор для следующей страницы
- Возвращает: `edges`, `pageInfo`, `totalCount`

### 2. Page-based pagination (для `signalCards`, `savedFilters`, `groupAssignments`)
Используется для запросов карточек и фильтров:
- `page: Int` - номер страницы (начинается с 1)
- `pageSize: Int` - количество элементов на странице
- Возвращает: `nodes`, `totalCount`, `hasNextPage`, `currentPage`, `totalPages`

---

## GraphQL типы данных

### Входные типы (Input Types)

#### `PaginationInput`
```graphql
input PaginationInput {
  page: Int
  pageSize: Int
}
```

#### `SignalCardFilters`
```graphql
input SignalCardFilters {
  categories: [ID!]
  participants: [ID!]
  participantFilterMode: String  # "include" | "exclude"
  participantFilterIds: [ID!]
  participantFilterTypes: [String!]
  stages: [String!]
  roundStatuses: [String!]
  search: String
  featured: Boolean
  isOpen: Boolean
  new: Boolean
  trending: Boolean
  hideLiked: Boolean
  startDate: String  # ISO 8601 format
  endDate: String    # ISO 8601 format
  minSignals: Int
  maxSignals: Int
}
```

#### `SavedFilterInput`
```graphql
input SavedFilterInput {
  name: String!
  description: String
  participantFilterMode: String
  participantFilterIds: [ID!]
  participantFilterTypes: [String!]
  categories: [ID!]
  participants: [ID!]
  stages: [String!]
  roundStatuses: [String!]
  search: String
  featured: Boolean
  isOpen: Boolean
  new: Boolean
  trending: Boolean
  hideLiked: Boolean
  startDate: String
  endDate: String
  minSignals: Int
  maxSignals: Int
}
```

#### `AssignmentStatus`
```graphql
enum AssignmentStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  ARCHIVED
}
```

#### `AssignmentFilterType`
```graphql
enum AssignmentFilterType {
  ALL
  ASSIGNED_TO_ME
  ASSIGNED_BY_ME
}
```

---

## QUERIES (Запросы)

### 1. **feedGetOptimizedComprehensiveUserFeed** (USER_FEED_QUERY)

**Назначение**: Получение оптимизированного персонального фида пользователя с карточками сигналов

**Файл**: `src/lib/graphql/queries.ts:4`

**Использование**: 
- `src/hooks/use-graphql-feed.ts:26`
- `src/hooks/use-graphql-filters.ts:273`

**Параметры**:
- `$pagination: PaginationInput` (опционально) - пагинация (page, pageSize)
- `$filters: SignalCardFilters` (опционально) - фильтры для карточек

**Query**:
```graphql
query feedGetOptimizedComprehensiveUserFeed(
  $pagination: PaginationInput
  $filters: SignalCardFilters
) {
  userFeed(
    pagination: $pagination
    filters: $filters
    includeSignals: true
    absoluteImageUrl: true
  ) {
    nodes {
      id
      slug
      name
      description
      imageUrl
      createdAt
      latestSignalDate
      stage
      roundStatus
      lastRound
      trending
      categories { id name slug }
      signals {
        id
        date
        description
        signalType { id name slug }
        participant { id name slug type about imageUrl isSaved }
        associatedParticipant { id name slug type about imageUrl isSaved }
      }
      remainingParticipantsCount
      url
      socialLinks { name url }
      userData {
        isFavorited
        isDeleted
        isAssignedToGroup
        userNote { noteText }
      }
    }
    totalCount
    hasNextPage
    currentPage
    totalPages
  }
}
```

**Пример запроса**:
```json
{
  "pagination": {
    "page": 1,
    "pageSize": 20
  },
  "filters": {
    "categories": ["1", "2"],
    "stages": ["seed"],
    "featured": true
  }
}
```

**Возвращаемые поля**:
- `nodes` - массив карточек сигналов
- `totalCount` - общее количество карточек
- `hasNextPage` - есть ли следующая страница
- `currentPage` - текущая страница
- `totalPages` - общее количество страниц

---

### 2. **BasicFilters** (BASIC_FILTERS_QUERY)

**Назначение**: Получение базовых фильтров (категории, стадии, статусы раундов)

**Файл**: `src/lib/graphql/queries.ts:94`

**Использование**: 
- `src/hooks/use-graphql-filters.ts:255`
- `src/features/all-signals/components/all-signals-graphql-page.tsx:223`

**Параметры**: Нет

**Query**:
```graphql
query BasicFilters {
  categories {
    id
    name
    slug
  }
  stages {
    name
    slug
  }
  roundStatuses {
    name
    slug
  }
}
```

**Возвращаемые данные**:
- `categories` - массив категорий с id, name, slug
- `stages` - массив стадий развития компании
- `roundStatuses` - массив статусов раундов инвестирования

---

### 3. **GetAngels** (ANGELS_QUERY)

**Назначение**: Получение списка ангел-инвесторов с курсорной пагинацией

**Файл**: `src/lib/graphql/queries.ts:117`

**Использование**: 
- `src/hooks/use-graphql-feed.ts:107`
- `src/features/shared/components/filters/entity-specific-filters.tsx:225`

**Параметры**:
- `$first: Int` (опционально) - количество элементов (по умолчанию 20)
- `$after: String` (опционально) - курсор для следующей страницы
- `$search: String` (опционально) - поисковый запрос

**Query**:
```graphql
query GetAngels($first: Int, $after: String, $search: String) {
  participants(
    first: $first
    after: $after
    search: $search
    types: ["angel"]
  ) {
    edges {
      node {
        id
        name
        slug
        type
        additionalName
        about
        imageUrl
        isSaved
        monthlySignalsCount
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

**Тип пагинации**: Cursor-based

---

### 4. **GetVCsAndInvestors** (VCS_INVESTORS_QUERY)

**Назначение**: Получение списка VC фондов и инвесторов различных типов

**Файл**: `src/lib/graphql/queries.ts:154`

**Использование**: 
- `src/hooks/use-graphql-feed.ts:247`
- `src/features/shared/components/filters/entity-specific-filters.tsx:237`

**Параметры**:
- `$first: Int` (опционально)
- `$after: String` (опционально)
- `$search: String` (опционально)

**Query**:
```graphql
query GetVCsAndInvestors($first: Int, $after: String, $search: String) {
  participants(
    first: $first
    after: $after
    search: $search
    types: [
      "investor", "scout", "research", "engineer", "influencer",
      "unknown", "founder", "marketing", "writing", "legal",
      "operations", "socials", "business_development", "security",
      "finance", "due_diligence", "product", "protocol", "defi",
      "growth", "design", "data", "strategy", "board", "analyst",
      "content", "advisor", "ceo", "portfolio", "events",
      "communications", "trading", "GA", "other"
    ]
  ) {
    edges {
      node {
        id
        name
        slug
        type
        additionalName
        about
        imageUrl
        isSaved
        monthlySignalsCount
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

**Тип пагинации**: Cursor-based

---

### 5. **GetSyndicates** (SYNDICATES_QUERY)

**Назначение**: Получение списка синдикатов, фондов, платформ и сообществ

**Файл**: `src/lib/graphql/queries.ts:226`

**Использование**: 
- `src/hooks/use-graphql-feed.ts:309`
- `src/features/shared/components/filters/entity-specific-filters.tsx:249`

**Параметры**:
- `$first: Int` (опционально)
- `$after: String` (опционально)
- `$search: String` (опционально)

**Query**:
```graphql
query GetSyndicates($first: Int, $after: String, $search: String) {
  participants(
    first: $first
    after: $after
    search: $search
    types: ["accelerator", "fund", "platform", "syndicate", "community", "company"]
  ) {
    edges {
      node {
        id
        name
        slug
        type
        additionalName
        about
        imageUrl
        isSaved
        monthlySignalsCount
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

**Тип пагинации**: Cursor-based

---

### 6. **GetFounders** (FOUNDERS_QUERY)

**Назначение**: Получение списка основателей и предпринимателей

**Файл**: `src/lib/graphql/queries.ts:263`

**Использование**: 
- `src/hooks/use-graphql-feed.ts:371`
- `src/features/shared/components/filters/entity-specific-filters.tsx:261`

**Параметры**:
- `$first: Int` (опционально)
- `$after: String` (опционально)
- `$search: String` (опционально)

**Query**:
```graphql
query GetFounders($first: Int, $after: String, $search: String) {
  participants(
    first: $first
    after: $after
    search: $search
    types: ["founder", "person", "entrepreneur"]
  ) {
    edges {
      node {
        id
        name
        slug
        type
        additionalName
        about
        imageUrl
        isSaved
        monthlySignalsCount
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

**Тип пагинации**: Cursor-based

---

### 7. **GetFavoritesParticipants** (GET_FAVORITES_QUERY)

**Назначение**: Получение списка избранных участников

**Файл**: `src/lib/graphql/queries.ts:301`

**Использование**: 
- `src/hooks/use-graphql-feed.ts:433`
- `src/features/shared/components/filters/entity-specific-filters.tsx:273`

**Параметры**:
- `$first: Int` (опционально)
- `$after: String` (опционально)
- `$search: String` (опционально)

**Query**:
```graphql
query GetFavoritesParticipants($first: Int, $after: String, $search: String) {
  participants(
    first: $first
    after: $after
    search: $search
    isSaved: true
  ) {
    edges {
      node {
        id
        name
        slug
        type
        additionalName
        about
        imageUrl
        isSaved
        monthlySignalsCount
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

**Тип пагинации**: Cursor-based

---

### 8. **GetAllParticipants** (ALL_PARTICIPANTS_QUERY)

**Назначение**: Получение всех участников без фильтрации по типу

**Файл**: `src/lib/graphql/queries.ts:339`

**Использование**: 
- `src/hooks/use-graphql-feed.ts:178`

**Параметры**:
- `$first: Int` (опционально)
- `$after: String` (опционально)
- `$search: String` (опционально)

**Query**:
```graphql
query GetAllParticipants($first: Int, $after: String, $search: String) {
  participants(
    first: $first
    after: $after
    search: $search
  ) {
    edges {
      node {
        id
        name
        slug
        type
        additionalName
        about
        imageUrl
        isSaved
        monthlySignalsCount
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

**Тип пагинации**: Cursor-based

---

### 9. **GetFilteredParticipants** (FILTERED_PARTICIPANTS_QUERY)

**Назначение**: Получение участников с расширенными фильтрами

**Файл**: `src/lib/graphql/queries.ts:378`

**Использование**: 
- `src/features/investors/contexts/investors-graphql-context.tsx:195`

**Параметры**:
- `$first: Int` (опционально)
- `$after: String` (опционально)
- `$search: String` (опционально)
- `$types: [String!]` (опционально) - массив типов участников
- `$isSaved: Boolean` (опционально) - только избранные
- `$fundsOnly: Boolean` (опционально) - только фонды
- `$sortByActivity: Boolean` (опционально) - сортировка по активности

**Query**:
```graphql
query GetFilteredParticipants(
  $first: Int
  $after: String
  $search: String
  $types: [String!]
  $isSaved: Boolean
  $fundsOnly: Boolean
  $sortByActivity: Boolean
) {
  participants(
    first: $first
    after: $after
    search: $search
    types: $types
    isSaved: $isSaved
    fundsOnly: $fundsOnly
    sortByActivity: $sortByActivity
  ) {
    edges {
      node {
        id
        name
        slug
        type
        additionalName
        about
        imageUrl
        isSaved
        monthlySignalsCount
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

**Тип пагинации**: Cursor-based

---

### 10. **GetSavedFilters** (SAVED_FILTERS_QUERY)

**Назначение**: Получение списка сохраненных фильтров пользователя

**Файл**: `src/lib/graphql/queries.ts:427`

**Использование**: 
- `src/hooks/use-saved-filters.ts:72`

**Параметры**:
- `$pagination: PaginationInput` (опционально) - пагинация
- `$includeRecentCounts: Boolean` (опционально) - включить количество недавних сигналов

**Query**:
```graphql
query GetSavedFilters(
  $pagination: PaginationInput
  $includeRecentCounts: Boolean
) {
  savedFilters(
    pagination: $pagination
    includeRecentCounts: $includeRecentCounts
  ) {
    nodes {
      id
      name
      description
      isDefault
      filterSummary
      hasActiveFilters
      participantFilterMode
      participantFilterIds
      participantFilterTypes
      categories { id name slug }
      participants { id name slug imageUrl }
      stages
      roundStatuses
      search
      featured
      isOpen
      new
      trending
      hideLiked
      startDate
      endDate
      minSignals
      maxSignals
      recentSignalsCount  # если includeRecentCounts: true
    }
    totalCount
    hasNextPage
    hasPreviousPage
    currentPage
    totalPages
  }
}
```

**Тип пагинации**: Page-based

---

### 11. **GetDefaultSavedFilter** (DEFAULT_SAVED_FILTER_QUERY)

**Назначение**: Получение фильтра по умолчанию пользователя

**Файл**: `src/lib/graphql/queries.ts:494`

**Использование**: 
- `src/hooks/use-saved-filters.ts:89`

**Параметры**: Нет

**Query**:
```graphql
query GetDefaultSavedFilter {
  defaultSavedFilter {
    id
    name
    description
    filterSummary
    participantFilterMode
    participantFilterIds
    participantFilterTypes
    categories {
      id
      name
      slug
    }
    participants {
      id
      name
      slug
      imageUrl
    }
    stages
    roundStatuses
    search
    featured
    isOpen
    new
    trending
    hideLiked
    startDate
    endDate
    minSignals
    maxSignals
  }
}
```

**Возвращает**: `null` если фильтр по умолчанию не установлен

---

### 12. **GetSavedFiltersSummary** (SAVED_FILTERS_SUMMARY_QUERY)

**Назначение**: Получение краткой сводки по сохраненным фильтрам

**Файл**: `src/lib/graphql/queries.ts:531`

**Использование**: 
- `src/hooks/use-saved-filters.ts:98`

**Параметры**: Нет

**Query**:
```graphql
query GetSavedFiltersSummary {
  savedFiltersSummary {
    savedFilters {
      id
      name
      description
      isDefault
      filterSummary
      hasActiveFilters
    }
    totalCount
    defaultFilter {
      id
      name
      description
    }
  }
}
```

---

### 13. **GetFolderCardsWithPagination** (GET_FOLDER_CARDS_QUERY)

**Назначение**: Получение карточек из конкретной папки с пагинацией

**Файл**: `src/lib/graphql/queries.ts:754`

**Использование**: 
- `src/features/saved-cards/contexts/saved-cards-graphql-context.tsx:103`
- `src/features/deleted-cards/contexts/deleted-cards-graphql-context.tsx:89`

**Параметры**:
- `$folderKey: String!` - ключ папки (например, "favorites", "deleted", или ID папки)
- `$page: Int!` - номер страницы (начинается с 1)
- `$pageSize: Int!` - размер страницы
- `$filters: SignalCardFilters` (опционально) - дополнительные фильтры

**Query**:
```graphql
query GetFolderCardsWithPagination(
  $folderKey: String!
  $page: Int!
  $pageSize: Int!
  $filters: SignalCardFilters
) {
  signalCards(
    folderKey: $folderKey
    includeSignals: true
    pagination: { page: $page, pageSize: $pageSize }
    filters: $filters
  ) {
    nodes {
      id
      slug
      name
      description
      imageUrl
      createdAt
      latestSignalDate
      stage
      roundStatus
      lastRound
      trending
      categories { id name slug }
      signals {
        id
        date
        description
        signalType { id name slug }
        participant { id name slug type about imageUrl isSaved }
        associatedParticipant { id name slug type about imageUrl isSaved }
      }
      remainingParticipantsCount
      url
      socialLinks { name url }
      userData {
        isFavorited
        isDeleted
        isAssignedToGroup
        userNote { noteText }
      }
    }
    totalCount
    hasNextPage
    hasPreviousPage
    currentPage
    totalPages
  }
}
```

**Тип пагинации**: Page-based

**Доступные folderKey**:
- `"favorites"` - избранные карточки
- `"deleted"` - удаленные карточки
- `{folderId}` - ID пользовательской папки

---

### 14. **GetCardsWithNotes** (GET_CARDS_WITH_NOTES_QUERY)

**Назначение**: Получение карточек, к которым добавлены заметки

**Файл**: `src/lib/graphql/queries.ts:838`

**Использование**: 
- `src/features/notes-cards/contexts/notes-cards-graphql-context.tsx:94`

**Параметры**:
- `$page: Int!` - номер страницы
- `$pageSize: Int!` - размер страницы
- `$filters: SignalCardFilters` (опционально) - дополнительные фильтры

**Query**:
```graphql
query GetCardsWithNotes(
  $page: Int!
  $pageSize: Int!
  $filters: SignalCardFilters
) {
  signalCards(
    cardType: NOTES
    pagination: { page: $page, pageSize: $pageSize }
    includeSignals: true
    filters: $filters
  ) {
    nodes {
      id
      slug
      name
      description
      imageUrl
      createdAt
      latestSignalDate
      stage
      roundStatus
      lastRound
      trending
      categories { id name slug }
      signals {
        id
        date
        description
        signalType { id name slug }
        participant { id name slug type about imageUrl isSaved }
        associatedParticipant { id name slug type about imageUrl isSaved }
      }
      remainingParticipantsCount
      url
      socialLinks { name url }
      userData {
        isFavorited
        isDeleted
        isAssignedToGroup
        userNote {
          id
          noteText
          createdAt
          updatedAt
        }
      }
    }
    totalCount
    hasNextPage
    hasPreviousPage
    currentPage
    totalPages
  }
}
```

**Тип пагинации**: Page-based

---

### 15. **GetParticipantSignals** (GET_PARTICIPANT_SIGNALS_QUERY)

**Назначение**: Получение сигналов конкретного участника

**Файл**: `src/lib/graphql/queries.ts:924`

**Использование**: 
- `src/features/investors/contexts/investor-signals-graphql-context.tsx:96`

**Параметры**:
- `$page: Int!` - номер страницы
- `$pageSize: Int!` - размер страницы
- `$filters: SignalCardFilters` (опционально) - фильтры должны включать `participants: [participantId]`

**Query**:
```graphql
query GetParticipantSignals(
  $page: Int!
  $pageSize: Int!
  $filters: SignalCardFilters
) {
  signalCards(
    pagination: { page: $page, pageSize: $pageSize }
    includeSignals: true
    filters: $filters
  ) {
    nodes {
      id
      slug
      name
      description
      imageUrl
      createdAt
      latestSignalDate
      stage
      roundStatus
      lastRound
      trending
      categories { id name slug }
      signals {
        id
        date
        description
        signalType { id name slug }
        participant { id name slug type about imageUrl isSaved }
        associatedParticipant { id name slug type about imageUrl isSaved }
      }
      remainingParticipantsCount
      url
      socialLinks { name url }
      userData {
        isFavorited
        isDeleted
        isAssignedToGroup
        userNote { noteText }
      }
    }
    totalCount
    hasNextPage
    hasPreviousPage
    currentPage
    totalPages
  }
}
```

**Тип пагинации**: Page-based

**Важно**: Фильтр `participants` должен быть установлен в `$filters` для получения сигналов конкретного участника.

---

### 16. **GetGroupAssignments** (GET_GROUP_ASSIGNMENTS_QUERY)

**Назначение**: Получение назначений карточек группам пользователя

**Файл**: `src/lib/graphql/queries.ts:1009`

**Использование**: 
- `src/features/in-progress-cards/contexts/group-assignments-context.tsx:94`
- `src/features/shared/components/cards/card-details-sections/assignments.tsx:415,555,635`

**Параметры**:
- `$pagination: PaginationInput` (опционально) - пагинация
- `$statuses: [AssignmentStatus!]` (опционально) - фильтр по статусам (PENDING, IN_PROGRESS, COMPLETED, ARCHIVED)
- `$filterType: AssignmentFilterType` (опционально) - тип фильтра (ALL, ASSIGNED_TO_ME, ASSIGNED_BY_ME)
- `$includeSignals: Boolean` (опционально) - включить сигналы в карточки
- `$includeAssignedMembers: Boolean` (опционально) - включить информацию о назначенных участниках

**Query**:
```graphql
query GetGroupAssignments(
  $pagination: PaginationInput
  $statuses: [AssignmentStatus!]
  $filterType: AssignmentFilterType
  $includeSignals: Boolean
  $includeAssignedMembers: Boolean
) {
  groupAssignments(
    pagination: $pagination
    statuses: $statuses
    filterType: $filterType
    includeSignals: $includeSignals
    includeAssignedMembers: $includeAssignedMembers
  ) {
    nodes {
      id
      status
      createdAt
      updatedAt
      group {
        id
        name
        slug
        logoUrl
        createdAt
        updatedAt
      }
      signalCard {
        id
        name
        slug
        description
        imageUrl
        createdAt
        latestSignalDate
        stage
        roundStatus
        lastRound
        trending
        categories { id name slug }
        signals { ... }  # если includeSignals: true
        remainingParticipantsCount
        url
        socialLinks { name url }
        userData {
          isFavorited
          isDeleted
          isAssignedToGroup
          userNote { id noteText createdAt updatedAt }
        }
      }
      assignedUsersCount
      totalGroupMembersCount
      assignedMembers {  # если includeAssignedMembers: true
        user {
          id
          username
          firstName
          lastName
          avatar
        }
        assignedBy {
          id
          username
          firstName
          lastName
          avatar
        }
        assignedAt
      }
    }
    totalCount
    hasNextPage
    hasPreviousPage
    currentPage
    totalPages
  }
}
```

**Тип пагинации**: Page-based

---

### 17. **GetSignalCardDetail** (inline query, не экспортирован)

**Назначение**: Получение детальной информации о конкретной карточке сигнала

**Файл**: `src/features/shared/contexts/card-operations-context.tsx:1052`

**Использование**: 
- `src/features/shared/contexts/card-operations-context.tsx:1041`
- `src/features/shared/components/cards/card-details-drawer.tsx:443`

**Особенность**: Используется напрямую через `fetch`, без Apollo Client

**Параметры**:
- `$id: ID!` - ID карточки

**Query**:
```graphql
query GetSignalCardDetail($id: ID!) {
  signalCard(id: $id, includeSignals: true, absoluteImageUrl: true) {
    id
    slug
    uuid
    name
    description
    url
    imageUrl
    createdAt
    updatedAt
    lastRound
    stage
    roundStatus
    isOpen
    referenceUrl
    featured
    latestSignalDate
    discoveredAt
    categories {
      id
      name
      slug
    }
    teamMembers {
      id
      name
      role
      imageUrl
    }
    signals {
      id
      date
      description
      signalType {
        id
        name
        slug
      }
      participant {
        id
        name
        slug
        type
        about
        imageUrl
        isSaved
      }
      associatedParticipant {
        id
        name
        slug
        type
        about
        imageUrl
        isSaved
      }
    }
    remainingParticipantsCount
    socialLinks {
      name
      url
    }
    userData {
      isFavorited
      isDeleted
      folders {
        id
        name
        isDefault
        hasCard
      }
      userNote {
        id
        noteText
        createdAt
        updatedAt
      }
    }
    hasTicket
  }
}
```

---

## MUTATIONS (Мутации)

### 1. **CreateSavedFilter** (CREATE_SAVED_FILTER_MUTATION)

**Назначение**: Создание нового сохраненного фильтра

**Файл**: `src/lib/graphql/queries.ts:553`

**Использование**: 
- `src/hooks/use-saved-filters.ts:106`

**Параметры**:
- `$filterInput: SavedFilterInput!` - данные фильтра

**Mutation**:
```graphql
mutation CreateSavedFilter($filterInput: SavedFilterInput!) {
  createSavedFilter(filterInput: $filterInput) {
    success
    message
    errorCode
    savedFilter {
      id
      name
      description
      isDefault
      filterSummary
      hasActiveFilters
      participantFilterMode
      participantFilterIds
      participantFilterTypes
      categories { id name slug }
      participants { id name slug imageUrl }
      stages
      roundStatuses
      search
      featured
      isOpen
      new
      trending
      hideLiked
      startDate
      endDate
      minSignals
      maxSignals
    }
  }
}
```

**Пример запроса**:
```json
{
  "filterInput": {
    "name": "My Custom Filter",
    "description": "Filter for seed stage companies",
    "stages": ["seed"],
    "featured": true
  }
}
```

**Возвращаемые поля**:
- `success: Boolean` - успешность операции
- `message: String` - сообщение о результате
- `errorCode: String` (опционально) - код ошибки
- `savedFilter: SavedFilter` - созданный фильтр

---

### 2. **UpdateSavedFilter** (UPDATE_SAVED_FILTER_MUTATION)

**Назначение**: Обновление существующего сохраненного фильтра

**Файл**: `src/lib/graphql/queries.ts:598`

**Использование**: 
- `src/hooks/use-saved-filters.ts:111`

**Параметры**:
- `$filterId: ID!` - ID фильтра для обновления
- `$filterInput: SavedFilterInput!` - новые данные фильтра

**Mutation**:
```graphql
mutation UpdateSavedFilter($filterId: ID!, $filterInput: SavedFilterInput!) {
  updateSavedFilter(filterId: $filterId, filterInput: $filterInput) {
    success
    message
    errorCode
    savedFilter {
      id
      name
      description
      isDefault
      filterSummary
      hasActiveFilters
      participantFilterMode
      participantFilterIds
      participantFilterTypes
      categories { id name slug }
      participants { id name slug imageUrl }
      stages
      roundStatuses
      search
      featured
      isOpen
      new
      trending
      hideLiked
      startDate
      endDate
      minSignals
      maxSignals
    }
  }
}
```

---

### 3. **DeleteSavedFilter** (DELETE_SAVED_FILTER_MUTATION)

**Назначение**: Удаление сохраненного фильтра

**Файл**: `src/lib/graphql/queries.ts:643`

**Использование**: 
- `src/hooks/use-saved-filters.ts:116`

**Параметры**:
- `$filterId: ID!` - ID фильтра для удаления

**Mutation**:
```graphql
mutation DeleteSavedFilter($filterId: ID!) {
  deleteSavedFilter(filterId: $filterId) {
    success
    message
    errorCode
  }
}
```

**Возвращаемые поля**:
- `success: Boolean`
- `message: String`
- `errorCode: String` (опционально)

---

### 4. **ApplySavedFilter** (APPLY_SAVED_FILTER_MUTATION)

**Назначение**: Применение сохраненного фильтра (загрузка его настроек в активные фильтры)

**Файл**: `src/lib/graphql/queries.ts:654`

**Использование**: 
- `src/hooks/use-saved-filters.ts:121`

**Параметры**:
- `$filterId: ID!` - ID фильтра для применения

**Mutation**:
```graphql
mutation ApplySavedFilter($filterId: ID!) {
  applySavedFilter(filterId: $filterId) {
    success
    message
    errorCode
    savedFilter {
      id
      name
      description
      isDefault
      filterSummary
      participantFilterMode
      participantFilterIds
      participantFilterTypes
      categories { id name slug }
      participants { id name slug imageUrl }
      stages
      roundStatuses
      search
      featured
      isOpen
      new
      trending
      hideLiked
      startDate
      endDate
      minSignals
      maxSignals
    }
  }
}
```

**Примечание**: Эта мутация применяет настройки фильтра, но не изменяет сам сохраненный фильтр.

---

### 5. **SaveCurrentFilterAs** (SAVE_CURRENT_FILTER_AS_MUTATION)

**Назначение**: Сохранение текущих активных фильтров как нового сохраненного фильтра

**Файл**: `src/lib/graphql/queries.ts:698`

**Использование**: 
- `src/hooks/use-saved-filters.ts:126`

**Параметры**:
- `$filterInput: SavedFilterInput!` - данные для нового фильтра (минимум `name`)

**Mutation**:
```graphql
mutation SaveCurrentFilterAs($filterInput: SavedFilterInput!) {
  saveCurrentFilterAs(filterInput: $filterInput) {
    success
    message
    errorCode
    savedFilter {
      id
      name
      description
      isDefault
      filterSummary
      hasActiveFilters
      participantFilterMode
      participantFilterIds
      participantFilterTypes
      categories { id name slug }
      participants { id name slug imageUrl }
      stages
      roundStatuses
      search
      featured
      isOpen
      new
      trending
      hideLiked
      startDate
      endDate
      minSignals
      maxSignals
    }
  }
}
```

---

### 6. **SetDefaultSavedFilter** (SET_DEFAULT_SAVED_FILTER_MUTATION)

**Назначение**: Установка сохраненного фильтра как фильтра по умолчанию

**Файл**: `src/lib/graphql/queries.ts:743`

**Использование**: 
- `src/hooks/use-saved-filters.ts:131`

**Параметры**:
- `$filterId: ID!` - ID фильтра для установки по умолчанию

**Mutation**:
```graphql
mutation SetDefaultSavedFilter($filterId: ID!) {
  setDefaultSavedFilter(filterId: $filterId) {
    success
    message
    errorCode
  }
}
```

**Примечание**: Только один фильтр может быть установлен как фильтр по умолчанию. При установке нового, предыдущий автоматически снимается с этого статуса.

---

### 7. **ToggleParticipantFollow** (TOGGLE_PARTICIPANT_FOLLOW_MUTATION)

**Назначение**: Переключение статуса подписки на участника (добавление/удаление из избранного)

**Файл**: `src/lib/graphql/queries.ts:1133`

**Использование**: 
- `src/features/investors/contexts/investors-graphql-context.tsx:114`

**Параметры**:
- `$participantId: ID!` - ID участника
- `$isSaved: Boolean!` - новый статус (true - добавить в избранное, false - убрать)

**Mutation**:
```graphql
mutation ToggleParticipantFollow($participantId: ID!, $isSaved: Boolean!) {
  toggleParticipantFollow(participantId: $participantId, isSaved: $isSaved) {
    success
    message
    isSaved
    participantId
  }
}
```

**Пример запроса**:
```json
{
  "participantId": "123",
  "isSaved": true
}
```

**Возвращаемые поля**:
- `success: Boolean` - успешность операции
- `message: String` - сообщение о результате
- `isSaved: Boolean` - текущий статус после операции
- `participantId: ID` - ID участника

---

## Обработка ошибок

Все мутации возвращают стандартный формат ответа с полями:
- `success: Boolean` - индикатор успешности операции
- `message: String` - текстовое сообщение о результате
- `errorCode: String` (опционально) - код ошибки для программной обработки

### Типичные коды ошибок:
- `PERMISSION_DENIED` - недостаточно прав доступа
- `NOT_FOUND` - ресурс не найден
- `VALIDATION_ERROR` - ошибка валидации входных данных
- `DUPLICATE_NAME` - имя уже используется (для фильтров)

### Пример обработки ошибки:
```typescript
const { data } = await mutate({
  variables: { filterId: "123" }
});

if (!data.deleteSavedFilter.success) {
  console.error(data.deleteSavedFilter.errorCode);
  console.error(data.deleteSavedFilter.message);
}
```

---

## Кеширование

### Apollo Client Cache

Большинство запросов используют Apollo Client для кеширования:
- **Кеш запросов**: Автоматическое кеширование результатов запросов
- **Обновление кеша**: При мутациях кеш автоматически обновляется через `refetchQueries` или `update` функции
- **Политика кеширования**: По умолчанию используется `cache-first`

### Исключения

Один запрос **не использует** Apollo Client:
- `GetSignalCardDetail` - выполняется напрямую через `fetch` для избежания проблем с кешированием детальной информации

### Очистка кеша

В коде упоминается очистка кеша для:
- `regionalLocations` - упоминается в `use-categories-cache.ts:86`, но сам запрос не используется напрямую на фронтенде

---

## Статистика

**Всего GraphQL операций: 24**
- **Queries: 17**
- **Mutations: 7**

### Распределение по типам пагинации:
- **Cursor-based**: 7 запросов (все запросы `participants`)
- **Page-based**: 10 запросов (запросы `signalCards`, `savedFilters`, `groupAssignments`)

### Используемые GraphQL типы/поля на бэкенде:

#### Queries:
1. `userFeed` - основной фид пользователя
2. `categories`, `stages`, `roundStatuses` - базовые фильтры
3. `participants` - участники (с различными фильтрами)
4. `savedFilters` - сохраненные фильтры
5. `defaultSavedFilter` - фильтр по умолчанию
6. `savedFiltersSummary` - сводка по сохраненным фильтрам
7. `signalCards` - карточки сигналов (с различными параметрами)
8. `signalCard` - детальная информация о карточке
9. `groupAssignments` - назначения карточек группам

#### Mutations:
1. `createSavedFilter` - создание сохраненного фильтра
2. `updateSavedFilter` - обновление сохраненного фильтра
3. `deleteSavedFilter` - удаление сохраненного фильтра
4. `applySavedFilter` - применение сохраненного фильтра
5. `saveCurrentFilterAs` - сохранение текущего фильтра
6. `setDefaultSavedFilter` - установка фильтра по умолчанию
7. `toggleParticipantFollow` - переключение подписки на участника

---

## Примечания

### Архитектура запросов

- Все запросы проходят через Next.js API route `/api/graphql/route.ts`, который проксирует их на Django backend `/graphql/`
- Аутентификация происходит через Bearer токен из cookie `accessToken`
- Большинство запросов используют Apollo Client для кеширования и управления состоянием
- Один запрос (`GetSignalCardDetail`) используется напрямую через `fetch` без Apollo Client

### Неиспользуемые на фронте (но упоминаются в коде):

- `regionalLocations` - упоминается в `use-categories-cache.ts:86` для очистки кеша, но сам запрос не используется напрямую

### Рекомендации по использованию:

1. **Для запросов участников**: Используйте cursor-based пагинацию для бесконечной прокрутки
2. **Для запросов карточек**: Используйте page-based пагинацию для навигации по страницам
3. **Для детальной информации**: Используйте `GetSignalCardDetail` для получения полной информации о карточке
4. **Для фильтров**: Сохраняйте часто используемые фильтры через мутации сохраненных фильтров

---

## Быстрая справка

### Получить фид пользователя
```graphql
query { userFeed(pagination: {page: 1, pageSize: 20}) { nodes { id name } } }
```

### Получить базовые фильтры
```graphql
query { categories { id name } stages { name } roundStatuses { name } }
```

### Получить участников
```graphql
query { participants(first: 20, types: ["angel"]) { edges { node { id name } } } }
```

### Создать сохраненный фильтр
```graphql
mutation { createSavedFilter(filterInput: {name: "My Filter"}) { success savedFilter { id } } }
```

### Переключить подписку на участника
```graphql
mutation { toggleParticipantFollow(participantId: "123", isSaved: true) { success isSaved } }
```