/**
 * React Query Configuration
 * 
 * Query client setup with default options for caching,
 * stale time, and error handling.
 */

import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api-client';

// =============================================================================
// Query Keys Factory
// =============================================================================

export const queryKeys = {
  // User
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    settings: () => [...queryKeys.user.all, 'settings'] as const,
  },

  // Vocabulary
  vocabulary: {
    all: ['vocabulary'] as const,
    categories: () => [...queryKeys.vocabulary.all, 'categories'] as const,
    terms: (filters?: Record<string, unknown>) => 
      [...queryKeys.vocabulary.all, 'terms', filters] as const,
    term: (id: string) => [...queryKeys.vocabulary.all, 'term', id] as const,
    reviewQueue: () => [...queryKeys.vocabulary.all, 'reviewQueue'] as const,
    categoryStats: () => [...queryKeys.vocabulary.all, 'categoryStats'] as const,
  },

  // Listening
  listening: {
    all: ['listening'] as const,
    exercises: (filters?: Record<string, unknown>) => 
      [...queryKeys.listening.all, 'exercises', filters] as const,
    exercise: (id: string) => [...queryKeys.listening.all, 'exercise', id] as const,
    filters: () => [...queryKeys.listening.all, 'filters'] as const,
    stats: () => [...queryKeys.listening.all, 'stats'] as const,
  },

  // Speaking
  speaking: {
    all: ['speaking'] as const,
    scenarios: (filters?: Record<string, unknown>) => 
      [...queryKeys.speaking.all, 'scenarios', filters] as const,
    scenario: (id: string) => [...queryKeys.speaking.all, 'scenario', id] as const,
    submission: (id: string) => [...queryKeys.speaking.all, 'submission', id] as const,
    stats: () => [...queryKeys.speaking.all, 'stats'] as const,
  },

  // Progress
  progress: {
    all: ['progress'] as const,
    stats: () => [...queryKeys.progress.all, 'stats'] as const,
    daily: (dateRange?: string) => [...queryKeys.progress.all, 'daily', dateRange] as const,
    achievements: () => [...queryKeys.progress.all, 'achievements'] as const,
    timeline: () => [...queryKeys.progress.all, 'timeline'] as const,
    today: () => [...queryKeys.progress.all, 'today'] as const,
  },
} as const;

// =============================================================================
// Default Options
// =============================================================================

const defaultQueryOptions = {
  // Data considered fresh for 30 seconds
  staleTime: 30 * 1000,
  
  // Cache data for 5 minutes
  gcTime: 5 * 60 * 1000,
  
  // Retry failed requests
  retry: (failureCount: number, error: unknown) => {
    // Don't retry on 401, 403, 404
    if (error instanceof ApiError) {
      if ([401, 403, 404].includes(error.status)) {
        return false;
      }
    }
    return failureCount < 3;
  },
  
  // Retry delay with exponential backoff
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  
  // Refetch on window focus for fresh data
  refetchOnWindowFocus: true,
  
  // Don't refetch on reconnect (we handle this separately)
  refetchOnReconnect: false,
};

const defaultMutationOptions = {
  retry: false,
};

// =============================================================================
// Create Query Client
// =============================================================================

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: defaultQueryOptions,
      mutations: defaultMutationOptions,
    },
  });
}

// Singleton for client-side
let clientQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always create a new client
    return createQueryClient();
  }
  
  // Browser: reuse client
  if (!clientQueryClient) {
    clientQueryClient = createQueryClient();
  }
  
  return clientQueryClient;
}

// =============================================================================
// Invalidation Helpers
// =============================================================================

export const invalidations = {
  // Invalidate all user-related data
  user: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
  },

  // Invalidate all vocabulary data
  vocabulary: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.vocabulary.all });
  },

  // Invalidate all listening data
  listening: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.listening.all });
  },

  // Invalidate all speaking data
  speaking: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.speaking.all });
  },

  // Invalidate all progress data
  progress: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.progress.all });
  },

  // Invalidate everything after major changes
  all: (queryClient: QueryClient) => {
    queryClient.invalidateQueries();
  },
};

