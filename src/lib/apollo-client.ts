import { ApolloClient, InMemoryCache, createHttpLink, from, fromPromise } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import { setContext } from '@apollo/client/link/context';

// Circuit breaker to prevent infinite loops during backend outages
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private failureThreshold = 5,
    private timeout = 30000, // 30 seconds
    private monitorTimeout = 60000 // 1 minute
  ) {}

  canExecute(): boolean {
    if (this.state === 'CLOSED') return true;
    
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }
    
    // HALF_OPEN state
    return true;
  }

  onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.warn(`🔴 Circuit breaker OPEN - Backend appears unavailable. Requests will be blocked for ${this.timeout}ms`);
      
      // Auto-recover after monitor timeout
      setTimeout(() => {
        if (this.state === 'OPEN') {
          this.state = 'HALF_OPEN';
          console.info('🟡 Circuit breaker HALF_OPEN - Testing backend availability');
        }
      }, this.monitorTimeout);
    }
  }

  getState(): string {
    return this.state;
  }
}

const circuitBreaker = new CircuitBreaker();

// Token refresh function (similar to auth-context)
const refreshToken = async (): Promise<boolean> => {
  try {
    console.log('🔄 Apollo: Attempting to refresh token');
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });

    if (response.ok) {
      console.log('✅ Apollo: Token refreshed successfully');
      return true;
    } else {
      console.log('❌ Apollo: Token refresh failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Apollo: Token refresh error:', error);
    return false;
  }
};

// HTTP link to the Next.js GraphQL proxy endpoint (handles auth server-side)
const httpLink = createHttpLink({
  uri: '/api/graphql',
  credentials: 'include', // Include cookies in requests
});

// Auth link that handles token refresh
const authLink = setContext(async (_, { headers }) => {
  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      // Credentials are handled by httpLink's credentials: 'include'
    }
  };
});

// Enhanced retry link with circuit breaker integration
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: 5000, // Reduced from Infinity
    jitter: true
  },
  attempts: {
    max: 2, // Reduced from 3 to prevent excessive retries
    retryIf: (error, operation) => {
      // Check circuit breaker first
      if (!circuitBreaker.canExecute()) {
        console.warn('🔴 Circuit breaker preventing retry attempt');
        return false;
      }

      // Only retry on network errors, not GraphQL errors
      if (error?.networkError) {
        const networkError = error.networkError;
        
        // Don't retry on authentication errors (401)
        if ('statusCode' in networkError && networkError.statusCode === 401) {
          return false;
        }
        
        // Don't retry on client errors (4xx except 401)
        if ('statusCode' in networkError && 
            networkError.statusCode >= 400 && 
            networkError.statusCode < 500 && 
            networkError.statusCode !== 401) {
          return false;
        }
        
        // For complete backend failures, be more restrictive
        if (networkError.message && (
            networkError.message.includes('Failed to fetch') ||
            networkError.message.includes('NetworkError') ||
            networkError.message.includes('fetch') ||
            networkError.message.includes('ERR_NETWORK') ||
            networkError.message.includes('ERR_INTERNET_DISCONNECTED')
          )) {
          // Only retry once for complete backend failures and track failure
          const retryCount = operation.getContext().retryCount || 0;
          if (retryCount >= 1) {
            circuitBreaker.onFailure();
            return false;
          }
          return true;
        }
        
        // Retry on server errors (5xx) and network timeouts with circuit breaker
        const retryCount = operation.getContext().retryCount || 0;
        if (retryCount >= 1) {
          circuitBreaker.onFailure();
        }
        return retryCount < 1;
      }
      
      // Don't retry GraphQL errors
      return false;
    }
  }
});

// Enhanced error link with token refresh and circuit breaker integration
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    // Check for authentication errors in GraphQL errors first
    const authError = graphQLErrors.find(error => 
      error.extensions?.code === 'UNAUTHENTICATED' || 
      error.message?.includes('Authentication required')
    );

    if (authError) {
      console.warn('🔒 Apollo: GraphQL authentication error detected');
      // Try to refresh token and retry
      return fromPromise(
        refreshToken().then(success => {
          if (success) {
            console.log('🔄 Apollo: Retrying request after token refresh');
            return true;
          } else {
            console.log('❌ Apollo: Token refresh failed, redirecting to login');
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/sign-in';
            }
            throw new Error('Token refresh failed');
          }
        })
      ).flatMap(() => forward(operation));
    }

    graphQLErrors.forEach((error) => {
      const { message, locations, path } = error;
      
      // Safely format error message with optional fields
      const locationStr = locations 
        ? JSON.stringify(locations, null, 2) 
        : 'N/A';
      const pathStr = path 
        ? (Array.isArray(path) ? path.join('.') : String(path))
        : 'N/A';
      
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locationStr}, Path: ${pathStr}`
      );
      
      // Log full error object for debugging backend issues
      if (error.extensions) {
        console.error('[GraphQL error extensions]:', error.extensions);
      }
      
      // Don't show error notifications for certain expected errors
      const isExpectedError = 
        message.includes('Authentication required') ||
        message.includes('UNAUTHENTICATED') ||
        message.includes('Permission denied') ||
        message.includes('logger'); // Backend logger errors are expected during development
        
      if (!isExpectedError) {
        console.warn('GraphQL error:', message);
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]:`, networkError);
    
    // Handle 401 authentication errors with token refresh
    if ('statusCode' in networkError && networkError.statusCode === 401) {
      console.warn('🔒 Apollo: Network 401 error, attempting token refresh');
      // Try to refresh token and retry
      return fromPromise(
        refreshToken().then(success => {
          if (success) {
            console.log('🔄 Apollo: Retrying request after token refresh');
            return true;
          } else {
            console.log('❌ Apollo: Token refresh failed, redirecting to login');
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/sign-in';
            }
            throw new Error('Token refresh failed');
          }
        })
      ).flatMap(() => forward(operation));
    }
    
    // Be more selective about when to trigger backend-offline events
    const isCriticalNetworkFailure = networkError.message && (
      networkError.message.includes('Failed to fetch') ||
      networkError.message.includes('NetworkError') ||
      networkError.message.includes('ERR_NETWORK') ||
      networkError.message.includes('ERR_INTERNET_DISCONNECTED')
    );
    
    // Only trigger backend-offline for critical failures and if circuit breaker is open
    if (isCriticalNetworkFailure && !circuitBreaker.canExecute()) {
      console.warn('🔴 Critical backend failure detected with circuit breaker open');
      circuitBreaker.onFailure();
      
      // Only dispatch offline event if we're really having persistent issues
      if (typeof window !== 'undefined') {
        // Add a small delay to prevent immediate offline detection
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('backend-offline', {
            detail: { message: 'Backend unavailable - persistent network issues detected' }
          }));
        }, 2000); // 2 second delay
      }
      return;
    }

    // For other network errors, just update circuit breaker but don't trigger offline
    if (isCriticalNetworkFailure) {
      circuitBreaker.onFailure();
      console.warn('🟡 Network error detected but not triggering offline state yet');
    } else {
      // For non-critical errors, consider it a success for circuit breaker
      console.log('🟢 Non-critical network error, treating as recoverable');
      circuitBreaker.onSuccess();
    }
  } else {
    // If no network error, consider it a success for circuit breaker
    circuitBreaker.onSuccess();
  }
});

// Create Apollo Client instance
export const apolloClient = new ApolloClient({
  link: from([errorLink, retryLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          userFeed: {
            keyArgs: ['filters', 'sortBy', 'sortOrder'],
            merge(existing, incoming, { args }) {
              if (!args?.pagination?.page || args.pagination.page === 1) {
                // First page - replace existing data
                return incoming;
              }
              // Subsequent pages - merge with existing
              return {
                ...incoming,
                nodes: existing ? [...existing.nodes, ...incoming.nodes] : incoming.nodes,
              };
            },
          },
          feedSignalCards: {
            keyArgs: ['filters', 'sortBy', 'sortOrder'],
            merge(existing, incoming, { args }) {
              if (!args?.pagination?.page || args.pagination.page === 1) {
                return incoming;
              }
              return {
                ...incoming,
                nodes: existing ? [...existing.nodes, ...incoming.nodes] : incoming.nodes,
              };
            },
          },
          signalCards: {
            keyArgs: ['filters', 'cardType', 'sortBy', 'sortOrder', 'includeSignals', 'absoluteImageUrl', 'folderKey'],
            merge(existing, incoming, { args }) {
              if (!args?.pagination?.page || args.pagination.page === 1) {
                return incoming;
              }
              
              return {
                ...incoming,
                nodes: existing ? [...existing.nodes, ...incoming.nodes] : incoming.nodes,
              };
            },
          },
          // Cursor-based pagination for participants (Relay specification)
          participants: {
            keyArgs: ['search', 'types', 'fundsOnly'],
            merge(existing, incoming, { args }) {
              const currentSearch = args?.search || '';
              const currentTypes = JSON.stringify(args?.types?.sort() || []);
              const currentFundsOnly = args?.fundsOnly || false;
              const currentAfter = args?.after;
              
              console.log('🔄 Apollo participants merge:', {
                currentSearch,
                currentTypes,
                currentFundsOnly,
                currentAfter,
                hasExisting: !!existing,
                existingEdgesCount: existing?.edges?.length || 0,
                incomingEdgesCount: incoming?.edges?.length || 0
              });
              
              // If no existing data, return incoming data
              if (!existing) {
                console.log('✅ No existing data - returning incoming');
                return {
                  ...incoming,
                  searchTerm: currentSearch,
                  types: currentTypes,
                  fundsOnly: currentFundsOnly,
                };
              }
              
              // Check if search/types/filters changed
              const searchChanged = currentSearch !== (existing.searchTerm || '');
              const typesChanged = currentTypes !== (existing.types || '[]');
              const fundsOnlyChanged = currentFundsOnly !== (existing.fundsOnly || false);
              
              if (searchChanged || typesChanged || fundsOnlyChanged) {
                console.log('✅ Query parameters changed - replacing data', {
                  searchChanged,
                  typesChanged,
                  fundsOnlyChanged
                });
                return {
                  ...incoming,
                  searchTerm: currentSearch,
                  types: currentTypes,
                  fundsOnly: currentFundsOnly,
                };
              }
              
              // If this is a pagination request (has 'after'), merge the edges
              if (currentAfter) {
                const existingEdges = existing.edges || [];
                const incomingEdges = incoming.edges || [];
                
                console.log('✅ Pagination request - merging edges', {
                  existingCount: existingEdges.length,
                  incomingCount: incomingEdges.length,
                  totalAfterMerge: existingEdges.length + incomingEdges.length
                });
                
                return {
                  ...incoming,
                  edges: [...existingEdges, ...incomingEdges],
                  searchTerm: currentSearch,
                  types: currentTypes,
                  fundsOnly: currentFundsOnly,
                };
              }
              
              // First page of same query - replace
              console.log('✅ First page of same query - replacing data');
              return {
                ...incoming,
                searchTerm: currentSearch,
                types: currentTypes,
                fundsOnly: currentFundsOnly,
              };
            },
          },
          locationsRelay: {
            keyArgs: ['search'],
            merge(existing, incoming, { args }) {
              const currentSearch = args?.search || '';
              const existingSearch = existing?.searchTerm || '';
              
              // Replace data if:
              // 1. No existing data
              // 2. Search term changed (new search)
              const isNewSearch = existing && currentSearch !== existingSearch;
              const shouldReplace = !existing || isNewSearch;
              
              if (shouldReplace) {
                return {
                  ...incoming,
                  searchTerm: currentSearch
                };
              }
              
              // Subsequent pages - append edges
              const existingEdges = existing.edges || [];
              const incomingEdges = incoming.edges || [];
              
              return {
                ...incoming,
                edges: [...existingEdges, ...incomingEdges],
                searchTerm: currentSearch
              };
            },
          },
          // Add new caching policies for efficient filter options
          availableCategories: {
            keyArgs: ['search'],
            merge(existing: any, incoming: any) {
              // Simple replacement for filter options since they're small datasets
              return incoming;
            },
          },
          availableParticipants: {
            keyArgs: ['search'], 
            merge(existing: any, incoming: any) {
              // Simple replacement for filter options since they're small datasets
              return incoming;
            },
          },
          availableStages: {
            merge(existing: any, incoming: any) {
              // Stages don't change often, so we can cache them indefinitely
              return incoming;
            },
          },
          availableLocations: {
            keyArgs: ['search'],
            merge(existing: any, incoming: any) {
              // Simple replacement for filter options since they're small datasets
              return incoming;
            },
          },
          // Cache policy for saved filters
          savedFilters: {
            keyArgs: ['pagination'],
            merge(existing, incoming, { args }) {
              // For saved filters, we want to replace data on refetch/new queries
              // since they're not infinite scroll but paginated replacement
              if (!args?.pagination?.page || args.pagination.page === 1) {
                // First page or no pagination - replace existing data
                return incoming;
              }
              
              // Subsequent pages - merge with existing
              return {
                ...incoming,
                nodes: existing ? [...existing.nodes, ...incoming.nodes] : incoming.nodes,
              };
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

 