'use client';

import React, { Component, ReactNode } from 'react';
import { AllSignalsGraphQLPage } from '@/features/all-signals/components/all-signals-graphql-page';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<
  { children: ReactNode; onError?: (error: Error) => void },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error in AllSignalsGraphQLPage:', error, errorInfo);
    
    // Check if it's a GraphQL backend error (logger, etc.)
    const isBackendError = error.message?.includes('logger') || 
                          error.message?.includes('cannot access local variable');
    
    if (isBackendError) {
      console.warn('Backend error detected, attempting to recover...');
      // Try to recover by resetting error state after a delay
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 2000);
    }
    
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      // Don't show error UI for backend errors - let component try to recover
      if (this.state.error?.message?.includes('logger') || 
          this.state.error?.message?.includes('cannot access local variable')) {
        return <AllSignalsGraphQLPage />;
      }
      
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="max-w-md text-center">
            <h2 className="mb-4 text-2xl font-bold">Что-то пошло не так</h2>
            <p className="mb-4 text-muted-foreground">
              {this.state.error?.message || 'Произошла непредвиденная ошибка'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function AllSignalsPageWrapper() {
  return (
    <ErrorBoundary>
      <AllSignalsGraphQLPage />
    </ErrorBoundary>
  );
}
