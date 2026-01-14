# GraphQL Implementation Documentation

## Overview

This project uses a hybrid GraphQL + REST API approach with Apollo Client for state management and caching. The GraphQL implementation provides optimized queries for complex data fetching while maintaining REST API compatibility for certain operations.

## Architecture

### API Proxy Pattern

```
Frontend (Apollo Client) → Next.js API Route → Django GraphQL Backend
```

The GraphQL requests flow through a Next.js API proxy at `/api/graphql/route.ts` which:

- Handles authentication (Bearer token + cookie forwarding)
- Provides error handling and proper HTTP status codes
- Forwards requests to the Django GraphQL backend

### Hybrid Approach

- **GraphQL**: Used for complex queries, infinite scroll, and read operations
- **REST API**: Used for mutations (create, update, delete) and legacy operations

## File Structure

```
src/lib/graphql/
├── README.md           # This documentation
├── queries.ts          # GraphQL queries and mutations
└── types.ts           # TypeScript type definitions

src/lib/
└── apollo-client.ts   # Apollo Client configuration

src/hooks/
├── use-graphql-feed.ts    # Feed-related GraphQL hooks
└── use-graphql-filters.ts # Filter-related GraphQL hooks

src/features/*/contexts/
└── *-graphql-context.tsx  # GraphQL-powered contexts
```

## Apollo Client Configuration

### Key Features

1. **Circuit Breaker Pattern**: Prevents infinite loops during backend outages
2. **Automatic Token Refresh**: Handles expired tokens seamlessly
3. **Smart Caching**: Optimized cache policies for different data types
4. **Error Recovery**: Retry logic with exponential backoff

### Cache Policies

```typescript
typePolicies: {
  Query: {
    fields: {
      userFeed: {
        keyArgs: ['filters', 'sortBy', 'sortOrder'],
        merge: (existing, incoming, { args }) => {
          // Infinite scroll merge logic
        }
      },
      signalCards: {
        keyArgs: ['filters', 'cardType', 'sortBy', 'folderKey'],
        merge: (existing, incoming, { args }) => {
          // Pagination merge logic
        }
      }
    }
  }
}
```

## Core Queries

### 1. User Feed Query

**Purpose**: Main feed with infinite scroll and filtering

```graphql
query GetOptimizedComprehensiveUserFeed($pagination: PaginationInput, $filters: SignalCardFilters)
```

**Features**:

- Infinite scroll pagination
- Complex filtering (categories, participants, locations, etc.)
- Signal deduplication
- User data (favorites, notes, folders)

### 2. Signal Cards Query

**Purpose**: Generic card fetching with folder support

```graphql
query GetSignalCardsWithFolders($folderKey: String, $pagination: PaginationInput, $filters: SignalCardFilters)
```

**Use Cases**:

- Folder-specific card lists
- All signals feed
- Saved cards view

### 3. Card Detail Query

**Purpose**: Detailed information for a specific card

```graphql
query GetSignalCardDetail($id: ID!)
```

**Features**:

- Complete signal history
- Team members and people
- Social links and categories
- User-specific data (notes, folders, tickets)

### 4. Filter Options Queries

```graphql
# Basic filter options
query GetBasicFilters

# Dynamic participant filtering
query GetAngels($first: Int, $search: String)
query GetVcsInvestors($first: Int, $search: String)
query GetSyndicates($first: Int, $search: String)

# Location filtering
query GetRegionalLocations($activeLocations: [String!])
```

## Types and Interfaces

### Core Types

```typescript
interface SignalCard {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  signals: Signal[];
  userData?: UserData;
  // ... other fields
}

interface Signal {
  id: string;
  date: string;
  description: string;
  participant?: Participant;
  associatedParticipant?: Participant;
}

interface SignalCardFilters {
  search?: string;
  categories?: string[];
  participants?: string[];
  stages?: string[];
  locations?: string[];
  // ... other filters
}
```

### Pagination

```typescript
interface PaginationInput {
  page?: number;
  pageSize?: number;
}

interface PaginatedResponse<T> {
  nodes: T[];
  totalCount: number;
  hasNextPage: boolean;
  currentPage: number;
  totalPages: number;
}
```

## Usage Patterns

### 1. Basic Query Hook

```typescript
import { useQuery } from '@apollo/client';
import { USER_FEED_QUERY } from '@/lib/graphql/queries';

function MyComponent() {
  const { data, loading, error, fetchMore } = useQuery(USER_FEED_QUERY, {
    variables: {
      pagination: { page: 1, pageSize: 30 },
      filters: { categories: ['fintech'] }
    }
  });

  const loadMore = () => {
    fetchMore({
      variables: {
        pagination: { page: data.userFeed.currentPage + 1, pageSize: 30 }
      }
    });
  };
}
```

### 2. Context Provider Pattern

```typescript
export function MyGraphQLProvider({ children }: { children: ReactNode }) {
  const { data, loading, error, fetchMore, refetch } = useQuery(
    USER_FEED_QUERY,
    {
      variables: {
        pagination: { page: 1, pageSize: 30 },
        filters: convertFiltersToGraphQL(filters)
      },
      fetchPolicy: 'cache-first',
      errorPolicy: 'all'
    }
  );

  const contextValue = {
    cards: data?.userFeed?.nodes || [],
    loading,
    error,
    loadMore: () => fetchMore({ variables: { ... } }),
    refetch
  };

  return (
    <MyContext.Provider value={contextValue}>
      {children}
    </MyContext.Provider>
  );
}
```

### 3. Infinite Scroll Implementation

```typescript
const useInfiniteScroll = (hasNextPage: boolean, loadMore: () => void) => {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '150px'
  });

  useEffect(() => {
    if (inView && hasNextPage && !loading) {
      loadMore();
    }
  }, [inView, hasNextPage, loading, loadMore]);

  return ref;
};
```

## Error Handling

### Network Errors

```typescript
// Circuit breaker prevents excessive retries
const circuitBreaker = new CircuitBreaker(5, 30000);

// Error link handles authentication and network issues
const errorLink = onError(
  ({ graphQLErrors, networkError, operation, forward }) => {
    if (networkError?.statusCode === 401) {
      // Trigger token refresh
      return fromPromise(refreshToken()).flatMap(() => forward(operation));
    }

    if (isCriticalNetworkFailure(networkError)) {
      circuitBreaker.onFailure();
    }
  }
);
```

### GraphQL Errors

```typescript
// GraphQL errors are handled per-query
const { data, error } = useQuery(MY_QUERY, {
  errorPolicy: 'all', // Continue with partial data
  onError: (error) => {
    if (
      error.graphQLErrors.some((e) => e.extensions?.code === 'UNAUTHENTICATED')
    ) {
      // Handle auth error
      router.push('/auth/sign-in');
    }
  }
});
```

## Performance Optimizations

### 1. Prefetching

```typescript
// Prefetch critical queries during app initialization
useEffect(() => {
  apolloClient.query({
    query: BASIC_FILTERS_QUERY,
    fetchPolicy: 'cache-first',
    errorPolicy: 'ignore'
  });
}, []);
```

### 2. Cache Management

```typescript
// Custom merge functions for infinite scroll
merge(existing, incoming, { args }) {
  if (!args?.pagination?.page || args.pagination.page === 1) {
    return incoming; // First page - replace
  }
  return {
    ...incoming,
    nodes: [...(existing?.nodes || []), ...incoming.nodes]
  };
}
```

### 3. Query Deduplication

Apollo Client automatically deduplicates identical queries within a short time window.

## Integration with REST API

### Mixed Operations

```typescript
const MyComponent = () => {
  // Use GraphQL for reads
  const { data: cards } = useQuery(USER_FEED_QUERY);

  // Use REST for mutations
  const { toggleFavorite, deleteCard } = useCardOperations();

  const handleToggleFavorite = async (cardId: number) => {
    const success = await toggleFavorite(cardId, false);
    if (success) {
      // GraphQL cache will be updated via refetch or optimistic updates
      refetch();
    }
  };
};
```

### Data Transformation

```typescript
// Transform GraphQL response to match REST API format
const transformGraphQLToCardDetails = (graphqlCard: DetailedSignalCard) => {
  return {
    ticket_status: graphqlCard.hasTicket,
    latest_signal_date: graphqlCard.latestSignalDate,
    people: graphqlCard.people.map(transformPerson),
    signals: transformSignals(graphqlCard.signals),
    user_data: {
      is_favorited: graphqlCard.userData?.isFavorited || false,
      folders: graphqlCard.userData?.folders?.map(transformFolder) || [],
      note_text: graphqlCard.userData?.userNote?.noteText || null
    }
  };
};
```

## Best Practices

### 1. Query Design

- **Use fragments** for reusable field sets
- **Request only needed fields** to minimize payload
- **Use proper cache keys** for effective caching
- **Implement pagination** for large datasets

### 2. Error Handling

- **Always use `errorPolicy: 'all'`** for partial data handling
- **Handle authentication errors** consistently
- **Provide user feedback** for network issues
- **Implement retry logic** with exponential backoff

### 3. State Management

- **Use Apollo cache** as the single source of truth
- **Avoid local state** for server data
- **Use optimistic updates** for better UX
- **Implement proper loading states**

### 4. Performance

- **Prefetch critical queries** on app start
- **Use proper `fetchPolicy`** values:
  - `cache-first`: Default for most queries
  - `cache-and-network`: For fresh data requirements
  - `network-only`: For real-time data
- **Implement query deduplication**
- **Monitor bundle size** with GraphQL operations

## Debugging

### Apollo Client DevTools

1. Install Apollo Client DevTools browser extension
2. View cache contents and query history
3. Monitor network requests and responses

### Console Logging

```typescript
// Enable detailed logging in development
if (process.env.NODE_ENV === 'development') {
  apolloClient.writeQuery({
    query: gql`
      query {
        __typename
      }
    `,
    data: { __typename: 'Query' }
  });
}
```

### Common Issues

1. **Cache not updating**: Check merge functions and cache keys
2. **Infinite loops**: Verify circuit breaker and dependency arrays
3. **Authentication errors**: Ensure token refresh logic is working
4. **Memory leaks**: Properly clean up subscriptions and timeouts

## Migration Guidelines

### From REST to GraphQL

1. **Identify the endpoint** to migrate
2. **Create GraphQL query** with equivalent data
3. **Update types** to match GraphQL schema
4. **Implement context provider** if needed
5. **Add error handling** and loading states
6. **Test thoroughly** with different scenarios
7. **Update documentation**

### Gradual Migration

- Keep REST endpoints for mutations initially
- Migrate read operations to GraphQL first
- Use hybrid approach during transition
- Maintain backward compatibility

## Contributing

### Adding New Queries

1. Define query in `queries.ts`
2. Add corresponding types in `types.ts`
3. Create custom hook if needed
4. Update context providers if applicable
5. Add error handling
6. Write tests
7. Update documentation

### Query Naming Convention

- Use descriptive names: `GetUserFeedWithFilters`
- Include operation type: `Query`, `Mutation`, `Subscription`
- Use consistent variable naming: `$filters`, `$pagination`

### Type Definitions

- Mirror GraphQL schema types exactly
- Use optional fields where appropriate
- Include JSDoc comments for complex types
- Export interfaces for external use
