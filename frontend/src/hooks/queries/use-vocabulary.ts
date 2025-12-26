/**
 * Vocabulary Query Hooks
 * 
 * React Query hooks for vocabulary terms and reviews.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys, invalidations } from '@/lib/query-client';

// =============================================================================
// Types
// =============================================================================

export interface VocabularyTerm {
  id: string;
  term: string;
  phonetic: string | null;
  part_of_speech: string | null;
  definition: string;
  aviation_context: string | null;
  example_atc: string | null;
  example_response: string | null;
  example_sentence: string | null;
  audio_url: string | null;
  category: string;
  difficulty_level: number;
  icao_level: number;
  common_errors: string[];
  cis_tips: string[];
  related_terms: string[];
}

export interface VocabularyCategory {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon: string;
  color: string;
  total_terms: number;
  difficulty_range: { min: number; max: number };
}

export interface CategoryStats {
  category: string;
  display_name: string;
  icon: string;
  total_items: number;
  completed_items: number;
  mastered_items: number;
  mastery_percent: number;
  due_for_review: number;
}

export interface ReviewQueueItem {
  id: string;
  term: string;
  definition: string;
  phonetic: string | null;
  audio_url: string | null;
  category: string;
  example_atc: string | null;
  common_errors: string[];
  cis_tips: string[];
  difficulty_level: number;
  progress: {
    ease_factor: number;
    interval: number;
    repetitions: number;
    last_reviewed: string | null;
    next_review: string | null;
  };
}

export interface ReviewQueue {
  items: ReviewQueueItem[];
  total_due: number;
  new_count: number;
  review_count: number;
}

export interface ReviewSubmission {
  quality: number; // 0-5
  response_time_ms?: number;
}

export interface ReviewResult {
  message: string;
  term_id: string;
  next_review: string;
  new_interval: number;
  ease_factor: number;
  xp_earned: number;
}

export interface VocabularyFilters {
  category?: string;
  difficulty?: number;
  icao_level?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TermsResponse {
  items: VocabularyTerm[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Get vocabulary categories
 */
export function useVocabularyCategories() {
  return useQuery({
    queryKey: queryKeys.vocabulary.categories(),
    queryFn: () => api.get<VocabularyCategory[]>('/vocabulary/categories'),
    staleTime: 5 * 60 * 1000, // 5 minutes - categories rarely change
  });
}

/**
 * Get category stats for current user
 */
export function useVocabularyCategoryStats() {
  return useQuery({
    queryKey: queryKeys.vocabulary.categoryStats(),
    queryFn: () => api.get<{ categories: CategoryStats[] }>('/vocabulary/categories/stats'),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Get vocabulary terms with filters
 */
export function useVocabularyTerms(filters?: VocabularyFilters) {
  return useQuery({
    queryKey: queryKeys.vocabulary.terms(filters),
    queryFn: () => api.get<TermsResponse>('/vocabulary/terms', { params: filters as Record<string, string | number | undefined> }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get a single vocabulary term
 */
export function useVocabularyTerm(id: string) {
  return useQuery({
    queryKey: queryKeys.vocabulary.term(id),
    queryFn: () => api.get<VocabularyTerm>(`/vocabulary/terms/${id}`),
    enabled: !!id,
  });
}

/**
 * Get review queue
 */
export function useReviewQueue(limit = 20) {
  return useQuery({
    queryKey: queryKeys.vocabulary.reviewQueue(),
    queryFn: () => api.get<ReviewQueue>('/vocabulary/review-queue', { 
      params: { limit } 
    }),
    staleTime: 30 * 1000, // 30 seconds - review queue changes often
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Submit a vocabulary review
 */
export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ termId, data }: { termId: string; data: ReviewSubmission }) =>
      api.post<ReviewResult>(`/vocabulary/terms/${termId}/review`, data),
    onSuccess: () => {
      // Invalidate review queue and progress
      queryClient.invalidateQueries({ queryKey: queryKeys.vocabulary.reviewQueue() });
      queryClient.invalidateQueries({ queryKey: queryKeys.vocabulary.categoryStats() });
      invalidations.progress(queryClient);
    },
  });
}

/**
 * Start learning a new term
 */
export function useStartLearning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (termId: string) =>
      api.post<{ message: string }>(`/vocabulary/terms/${termId}/start`),
    onSuccess: () => {
      invalidations.vocabulary(queryClient);
      invalidations.progress(queryClient);
    },
  });
}

// =============================================================================
// Derived State Helpers
// =============================================================================

/**
 * Get count of terms due for review
 */
export function useReviewDueCount(): number {
  const { data } = useReviewQueue(1);
  return data?.total_due ?? 0;
}

/**
 * Check if there are terms to review
 */
export function useHasReviewsDue(): boolean {
  const count = useReviewDueCount();
  return count > 0;
}

