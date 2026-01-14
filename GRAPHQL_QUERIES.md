# Полный список GraphQL запросов и мутаций, используемых на фронтенде

## GraphQL Endpoint
Все запросы отправляются через: `POST /api/graphql` (Next.js прокси) → `POST /graphql/` (Django backend)

---

## QUERIES (Запросы)

### 1. **feedGetOptimizedComprehensiveUserFeed** (USER_FEED_QUERY)
**Файл**: `src/lib/graphql/queries.ts:4`
**Использование**: 
- `src/hooks/use-graphql-feed.ts:26`
- `src/hooks/use-graphql-filters.ts:273`

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
    nodes { ... }
    totalCount
    hasNextPage
    currentPage
    totalPages
  }
}
```

---

### 2. **BasicFilters** (BASIC_FILTERS_QUERY)
**Файл**: `src/lib/graphql/queries.ts:94`
**Использование**: 
- `src/hooks/use-graphql-filters.ts:255`
- `src/features/all-signals/components/all-signals-graphql-page.tsx:223`

**Query**:
```graphql
query BasicFilters {
  categories { id name slug }
  stages { name slug }
  roundStatuses { name slug }
}
```

---

### 3. **GetAngels** (ANGELS_QUERY)
**Файл**: `src/lib/graphql/queries.ts:117`
**Использование**: 
- `src/hooks/use-graphql-feed.ts:107`
- `src/features/shared/components/filters/entity-specific-filters.tsx:225`

**Query**:
```graphql
query GetAngels($first: Int, $after: String, $search: String) {
  participants(
    first: $first
    after: $after
    search: $search
    types: ["angel"]
  ) {
    edges { node { ... } cursor }
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    totalCount
  }
}
```

---

### 4. **GetVCsAndInvestors** (VCS_INVESTORS_QUERY)
**Файл**: `src/lib/graphql/queries.ts:154`
**Использование**: 
- `src/hooks/use-graphql-feed.ts:247`
- `src/features/shared/components/filters/entity-specific-filters.tsx:237`

**Query**:
```graphql
query GetVCsAndInvestors($first: Int, $after: String, $search: String) {
  participants(
    first: $first
    after: $after
    search: $search
    types: ["investor", "scout", "research", ... и т.д.]
  ) {
    edges { node { ... } cursor }
    pageInfo { ... }
    totalCount
  }
}
```

---

### 5. **GetSyndicates** (SYNDICATES_QUERY)
**Файл**: `src/lib/graphql/queries.ts:226`
**Использование**: 
- `src/hooks/use-graphql-feed.ts:309`
- `src/features/shared/components/filters/entity-specific-filters.tsx:249`

**Query**:
```graphql
query GetSyndicates($first: Int, $after: String, $search: String) {
  participants(
    first: $first
    after: $after
    search: $search
    types: ["accelerator", "fund", "platform", "syndicate", "community", "company"]
  ) {
    edges { node { ... } cursor }
    pageInfo { ... }
    totalCount
  }
}
```

---

### 6. **GetFounders** (FOUNDERS_QUERY)
**Файл**: `src/lib/graphql/queries.ts:263`
**Использование**: 
- `src/hooks/use-graphql-feed.ts:371`
- `src/features/shared/components/filters/entity-specific-filters.tsx:261`

**Query**:
```graphql
query GetFounders($first: Int, $after: String, $search: String) {
  participants(
    first: $first
    after: $after
    search: $search
    types: ["founder", "person", "entrepreneur"]
  ) {
    edges { node { ... } cursor }
    pageInfo { ... }
    totalCount
  }
}
```

---

### 7. **GetFavoritesParticipants** (GET_FAVORITES_QUERY)
**Файл**: `src/lib/graphql/queries.ts:301`
**Использование**: 
- `src/hooks/use-graphql-feed.ts:433`
- `src/features/shared/components/filters/entity-specific-filters.tsx:273`

**Query**:
```graphql
query GetFavoritesParticipants($first: Int, $after: String, $search: String) {
  participants(
    first: $first
    after: $after
    search: $search
    isSaved: true
  ) {
    edges { node { ... } cursor }
    pageInfo { ... }
    totalCount
  }
}
```

---

### 8. **GetAllParticipants** (ALL_PARTICIPANTS_QUERY)
**Файл**: `src/lib/graphql/queries.ts:339`
**Использование**: 
- `src/hooks/use-graphql-feed.ts:178`

**Query**:
```graphql
query GetAllParticipants($first: Int, $after: String, $search: String) {
  participants(
    first: $first
    after: $after
    search: $search
  ) {
    edges { node { ... } cursor }
    pageInfo { ... }
    totalCount
  }
}
```

---

### 9. **GetFilteredParticipants** (FILTERED_PARTICIPANTS_QUERY)
**Файл**: `src/lib/graphql/queries.ts:378`
**Использование**: 
- `src/features/investors/contexts/investors-graphql-context.tsx:195`

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
    edges { node { ... } cursor }
    pageInfo { ... }
    totalCount
  }
}
```

---

### 10. **GetSavedFilters** (SAVED_FILTERS_QUERY)
**Файл**: `src/lib/graphql/queries.ts:427`
**Использование**: 
- `src/hooks/use-saved-filters.ts:72`

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
    nodes { ... }
    totalCount
    hasNextPage
    hasPreviousPage
    currentPage
    totalPages
  }
}
```

---

### 11. **GetDefaultSavedFilter** (DEFAULT_SAVED_FILTER_QUERY)
**Файл**: `src/lib/graphql/queries.ts:494`
**Использование**: 
- `src/hooks/use-saved-filters.ts:89`

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
    categories { ... }
    participants { ... }
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

---

### 12. **GetSavedFiltersSummary** (SAVED_FILTERS_SUMMARY_QUERY)
**Файл**: `src/lib/graphql/queries.ts:531`
**Использование**: 
- `src/hooks/use-saved-filters.ts:98`

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
**Файл**: `src/lib/graphql/queries.ts:754`
**Использование**: 
- `src/features/saved-cards/contexts/saved-cards-graphql-context.tsx:103`
- `src/features/deleted-cards/contexts/deleted-cards-graphql-context.tsx:89`

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
    nodes { ... }
    totalCount
    hasNextPage
    hasPreviousPage
    currentPage
    totalPages
  }
}
```

---

### 14. **GetCardsWithNotes** (GET_CARDS_WITH_NOTES_QUERY)
**Файл**: `src/lib/graphql/queries.ts:838`
**Использование**: 
- `src/features/notes-cards/contexts/notes-cards-graphql-context.tsx:94`

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
    nodes { ... }
    totalCount
    hasNextPage
    hasPreviousPage
    currentPage
    totalPages
  }
}
```

---

### 15. **GetParticipantSignals** (GET_PARTICIPANT_SIGNALS_QUERY)
**Файл**: `src/lib/graphql/queries.ts:924`
**Использование**: 
- `src/features/investors/contexts/investor-signals-graphql-context.tsx:96`

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
    nodes { ... }
    totalCount
    hasNextPage
    hasPreviousPage
    currentPage
    totalPages
  }
}
```

---

### 16. **GetGroupAssignments** (GET_GROUP_ASSIGNMENTS_QUERY)
**Файл**: `src/lib/graphql/queries.ts:1009`
**Использование**: 
- `src/features/in-progress-cards/contexts/group-assignments-context.tsx:94`
- `src/features/shared/components/cards/card-details-sections/assignments.tsx:415,555,635`

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
    nodes { ... }
    totalCount
    hasNextPage
    hasPreviousPage
    currentPage
    totalPages
  }
}
```

---

### 17. **GetSignalCardDetail** (inline query, не экспортирован)
**Файл**: `src/features/shared/contexts/card-operations-context.tsx:1052`
**Использование**: 
- `src/features/shared/contexts/card-operations-context.tsx:1041`
- `src/features/shared/components/cards/card-details-drawer.tsx:443`

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
    categories { id name slug }
    teamMembers { ... }
    signals { ... }
    remainingParticipantsCount
    socialLinks { name url }
    userData {
      isFavorited
      isDeleted
      folders { id name isDefault hasCard }
      userNote { id noteText createdAt updatedAt }
    }
    hasTicket
  }
}
```

---

## MUTATIONS (Мутации)

### 1. **CreateSavedFilter** (CREATE_SAVED_FILTER_MUTATION)
**Файл**: `src/lib/graphql/queries.ts:553`
**Использование**: 
- `src/hooks/use-saved-filters.ts:106`

**Mutation**:
```graphql
mutation CreateSavedFilter($filterInput: SavedFilterInput!) {
  createSavedFilter(filterInput: $filterInput) {
    success
    message
    errorCode
    savedFilter { ... }
  }
}
```

---

### 2. **UpdateSavedFilter** (UPDATE_SAVED_FILTER_MUTATION)
**Файл**: `src/lib/graphql/queries.ts:598`
**Использование**: 
- `src/hooks/use-saved-filters.ts:111`

**Mutation**:
```graphql
mutation UpdateSavedFilter($filterId: ID!, $filterInput: SavedFilterInput!) {
  updateSavedFilter(filterId: $filterId, filterInput: $filterInput) {
    success
    message
    errorCode
    savedFilter { ... }
  }
}
```

---

### 3. **DeleteSavedFilter** (DELETE_SAVED_FILTER_MUTATION)
**Файл**: `src/lib/graphql/queries.ts:643`
**Использование**: 
- `src/hooks/use-saved-filters.ts:116`

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

---

### 4. **ApplySavedFilter** (APPLY_SAVED_FILTER_MUTATION)
**Файл**: `src/lib/graphql/queries.ts:654`
**Использование**: 
- `src/hooks/use-saved-filters.ts:121`

**Mutation**:
```graphql
mutation ApplySavedFilter($filterId: ID!) {
  applySavedFilter(filterId: $filterId) {
    success
    message
    errorCode
    savedFilter { ... }
  }
}
```

---

### 5. **SaveCurrentFilterAs** (SAVE_CURRENT_FILTER_AS_MUTATION)
**Файл**: `src/lib/graphql/queries.ts:698`
**Использование**: 
- `src/hooks/use-saved-filters.ts:126`

**Mutation**:
```graphql
mutation SaveCurrentFilterAs($filterInput: SavedFilterInput!) {
  saveCurrentFilterAs(filterInput: $filterInput) {
    success
    message
    errorCode
    savedFilter { ... }
  }
}
```

---

### 6. **SetDefaultSavedFilter** (SET_DEFAULT_SAVED_FILTER_MUTATION)
**Файл**: `src/lib/graphql/queries.ts:743`
**Использование**: 
- `src/hooks/use-saved-filters.ts:131`

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

---

### 7. **ToggleParticipantFollow** (TOGGLE_PARTICIPANT_FOLLOW_MUTATION)
**Файл**: `src/lib/graphql/queries.ts:1133`
**Использование**: 
- `src/features/investors/contexts/investors-graphql-context.tsx:114`

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

---

## Итого

**Всего GraphQL операций: 24**
- **Queries: 17**
- **Mutations: 7**

## Используемые GraphQL типы/поля на бэкенде

### Queries:
1. `userFeed` - основной фид пользователя
2. `categories`, `stages`, `roundStatuses` - базовые фильтры
3. `participants` - участники (с различными фильтрами)
4. `savedFilters` - сохраненные фильтры
5. `defaultSavedFilter` - фильтр по умолчанию
6. `savedFiltersSummary` - сводка по сохраненным фильтрам
7. `signalCards` - карточки сигналов (с различными параметрами)
8. `signalCard` - детальная информация о карточке
9. `groupAssignments` - назначения карточек группам

### Mutations:
1. `createSavedFilter` - создание сохраненного фильтра
2. `updateSavedFilter` - обновление сохраненного фильтра
3. `deleteSavedFilter` - удаление сохраненного фильтра
4. `applySavedFilter` - применение сохраненного фильтра
5. `saveCurrentFilterAs` - сохранение текущего фильтра
6. `setDefaultSavedFilter` - установка фильтра по умолчанию
7. `toggleParticipantFollow` - переключение подписки на участника

---

## Примечания

- Все запросы проходят через Next.js API route `/api/graphql/route.ts`, который проксирует их на Django backend `/graphql/`
- Аутентификация происходит через Bearer токен из cookie `accessToken`
- Большинство запросов используют Apollo Client для кеширования и управления состоянием
- Один запрос (`GetSignalCardDetail`) используется напрямую через `fetch` без Apollo Client

### Неиспользуемые на фронте (но упоминаются в коде):
- `regionalLocations` - упоминается в `use-categories-cache.ts:86` для очистки кеша, но сам запрос не используется напрямую

