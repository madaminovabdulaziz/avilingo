/**
 * Listening Query Hooks
 * 
 * React Query hooks for listening exercises.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys, invalidations } from '@/lib/query-client';

// =============================================================================
// Types
// =============================================================================

export interface ListeningExercise {
  id: string;
  title: string;
  description: string;
  scenario_type: 'routine' | 'non_routine' | 'emergency';
  difficulty: number;
  duration_seconds: number;
  audio_url: string;
  accent: string;
  speed: string;
  category: string;
  icao_level: number;
  is_completed?: boolean;
  best_score?: number;
}

export interface ListeningQuestion {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'fill_blank' | 'true_false';
  options: string[] | null;
  order: number;
}

export interface ListeningExerciseDetail extends ListeningExercise {
  scenario_context: string;
  teaching_points: string[];
  questions: ListeningQuestion[];
}

export interface ListeningFilters {
  all: string[];
  categories: string[];
  accents: string[];
  speeds: string[];
  difficulties: number[];
}

export interface ListeningFiltersRequest {
  scenario_type?: 'routine' | 'non_routine' | 'emergency';
  difficulty?: number;
  accent?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface ListeningExercisesResponse {
  items: ListeningExercise[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ListeningAnswer {
  question_id: string;
  answer: string | boolean;
}

export interface ListeningSubmission {
  answers: ListeningAnswer[];
  time_spent_seconds?: number;
}

export interface QuestionResult {
  question_id: string;
  is_correct: boolean;
  user_answer: string | boolean;
  correct_answer: string | boolean;
  explanation: string | null;
}

export interface ListeningResult {
  exercise_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  results: QuestionResult[];
  transcript: string;
  xp_earned: number;
  is_new_completion: boolean;
}

export interface ListeningStats {
  total_exercises: number;
  completed_exercises: number;
  average_score: number;
  by_category: Array<{
    category: string;
    completed: number;
    total: number;
    average_score: number;
  }>;
}

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Get listening exercises with filters
 */
export function useListeningExercises(filters?: ListeningFiltersRequest) {
  return useQuery({
    queryKey: queryKeys.listening.exercises(filters),
    queryFn: () => api.get<ListeningExercisesResponse>('/listening/exercises', {
      params: filters as Record<string, string | number | undefined>,
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get a single listening exercise with questions
 */
export function useListeningExercise(id: string) {
  return useQuery({
    queryKey: queryKeys.listening.exercise(id),
    queryFn: () => api.get<ListeningExerciseDetail>(`/listening/exercises/${id}`),
    enabled: !!id,
  });
}

/**
 * Get available filter options
 */
export function useListeningFilters() {
  return useQuery({
    queryKey: queryKeys.listening.filters(),
    queryFn: () => api.get<ListeningFilters>('/listening/filters'),
    staleTime: 5 * 60 * 1000, // 5 minutes - filters rarely change
  });
}

/**
 * Get listening stats for current user
 */
export function useListeningStats() {
  return useQuery({
    queryKey: queryKeys.listening.stats(),
    queryFn: () => api.get<ListeningStats>('/listening/stats'),
    staleTime: 60 * 1000, // 1 minute
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Submit listening exercise answers
 */
export function useSubmitListeningAnswers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ exerciseId, data }: { exerciseId: string; data: ListeningSubmission }) =>
      api.post<ListeningResult>(`/listening/exercises/${exerciseId}/submit`, data),
    onSuccess: (result) => {
      // Update the exercise in cache with completion status
      queryClient.setQueryData(
        queryKeys.listening.exercise(result.exercise_id),
        (old: ListeningExerciseDetail | undefined) => {
          if (!old) return old;
          return {
            ...old,
            is_completed: true,
            best_score: Math.max(old.best_score || 0, result.score),
          };
        }
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.listening.exercises() });
      queryClient.invalidateQueries({ queryKey: queryKeys.listening.stats() });
      invalidations.progress(queryClient);
    },
  });
}

// =============================================================================
// Derived State Helpers
// =============================================================================

/**
 * Get count of completed listening exercises
 */
export function useListeningCompletedCount(): number {
  const { data } = useListeningStats();
  return data?.completed_exercises ?? 0;
}

/**
 * Get average listening score
 */
export function useListeningAverageScore(): number {
  const { data } = useListeningStats();
  return data?.average_score ?? 0;
}

