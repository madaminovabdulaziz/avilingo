/**
 * Progress Query Hooks
 * 
 * React Query hooks for progress stats and achievements.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';

// =============================================================================
// Types
// =============================================================================

export interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  last_practice_date: string | null;
  is_at_risk: boolean;
}

export interface VocabularyStats {
  total_terms: number;
  learned_terms: number;
  mastered_terms: number;
  due_for_review: number;
  new_available: number;
  mastery_percent: number;
  by_category: CategoryProgress[];
  review_accuracy: number;
}

export interface ListeningStats {
  total_exercises: number;
  completed_exercises: number;
  completion_percent: number;
  average_score: number;
  by_category: CategoryProgress[];
}

export interface SpeakingStats {
  total_scenarios: number;
  attempted_scenarios: number;
  completion_percent: number;
  average_score: number;
  by_type: Array<{
    type: string;
    attempted: number;
    total: number;
    average_score: number;
  }>;
  icao_averages: ICAOCriteriaAverage[];
}

export interface CategoryProgress {
  category: string;
  display_name: string;
  icon: string;
  total_items: number;
  completed_items: number;
  mastered_items: number;
  mastery_percent: number;
  due_for_review?: number;
  average_score?: number;
}

export interface ICAOCriteriaAverage {
  criterion: string;
  display_name: string;
  average_score: number;
  level: number;
}

export interface ProgressStats {
  user_id: string;
  display_name: string;
  vocabulary: VocabularyStats;
  listening: ListeningStats;
  speaking: SpeakingStats;
  overall_icao_level: number;
  predicted_icao_level: number;
  target_icao_level: number;
  icao_criteria: ICAOCriteriaAverage[];
  streak: StreakInfo;
  total_practice_minutes: number;
  total_xp: number;
  days_until_test: number | null;
}

export interface DailyProgress {
  date: string;
  practice_minutes: number;
  vocabulary_reviews: number;
  listening_completed: number;
  speaking_completed: number;
  xp_earned: number;
  goal_met: boolean;
}

export interface DailyProgressResponse {
  items: DailyProgress[];
  streak: StreakInfo;
  goal_minutes: number;
}

export interface TodayProgress {
  today: DailyProgress;
  streak: StreakInfo;
  goal_minutes: number;
  goal_progress_percent: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement: string;
  xp_reward: number;
  // User-specific
  is_earned: boolean;
  earned_at: string | null;
  progress_percent: number;
  current_value: number;
  target_value: number;
}

export interface AchievementsResponse {
  earned: Achievement[];
  in_progress: Achievement[];
  locked: Achievement[];
}

export interface ActivityItem {
  id: string;
  type: 'vocabulary_review' | 'listening_complete' | 'speaking_complete' | 'achievement_earned' | 'streak_milestone';
  title: string;
  description: string;
  xp_earned: number;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityTimelineResponse {
  items: ActivityItem[];
  total: number;
  page: number;
  limit: number;
}

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Get comprehensive progress stats
 */
export function useProgressStats() {
  return useQuery({
    queryKey: queryKeys.progress.stats(),
    queryFn: () => api.get<ProgressStats>('/progress/stats'),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Get daily progress data for a date range
 */
export function useDailyProgress(days = 7) {
  return useQuery({
    queryKey: queryKeys.progress.daily(String(days)),
    queryFn: () => api.get<DailyProgressResponse>('/progress/daily', {
      params: { days },
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get today's progress
 */
export function useTodayProgress() {
  return useQuery({
    queryKey: queryKeys.progress.today(),
    queryFn: () => api.get<TodayProgress>('/progress/daily/today'),
    staleTime: 30 * 1000, // 30 seconds - today changes frequently
  });
}

/**
 * Get user achievements
 */
export function useAchievements() {
  return useQuery({
    queryKey: queryKeys.progress.achievements(),
    queryFn: () => api.get<AchievementsResponse>('/achievements'),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Get activity timeline
 */
export function useActivityTimeline(page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.progress.timeline(),
    queryFn: () => api.get<ActivityTimelineResponse>('/progress/activity', {
      params: { page, limit },
    }),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Claim an achievement reward
 */
export function useClaimAchievement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (achievementId: string) =>
      api.post<{ message: string; xp_earned: number }>(`/achievements/${achievementId}/claim`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.achievements() });
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.stats() });
    },
  });
}

// =============================================================================
// Derived State Helpers
// =============================================================================

/**
 * Get current streak
 */
export function useCurrentStreak(): number {
  const { data } = useProgressStats();
  return data?.streak.current_streak ?? 0;
}

/**
 * Check if streak is at risk
 */
export function useStreakAtRisk(): boolean {
  const { data } = useProgressStats();
  return data?.streak.is_at_risk ?? false;
}

/**
 * Get overall ICAO level
 */
export function useOverallICAOLevel(): number {
  const { data } = useProgressStats();
  return data?.overall_icao_level ?? 1;
}

/**
 * Get predicted ICAO level
 */
export function usePredictedICAOLevel(): number {
  const { data } = useProgressStats();
  return data?.predicted_icao_level ?? 1;
}

/**
 * Get total XP
 */
export function useTotalXP(): number {
  const { data } = useProgressStats();
  return data?.total_xp ?? 0;
}

/**
 * Get today's goal progress
 */
export function useTodayGoalProgress(): number {
  const { data } = useTodayProgress();
  return data?.goal_progress_percent ?? 0;
}

/**
 * Count of earned achievements
 */
export function useEarnedAchievementsCount(): number {
  const { data } = useAchievements();
  return data?.earned.length ?? 0;
}

