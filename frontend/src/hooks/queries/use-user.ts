/**
 * User Query Hooks
 * 
 * React Query hooks for user profile and settings.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api-client';
import { queryKeys, invalidations } from '@/lib/query-client';

// =============================================================================
// Types
// =============================================================================

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  native_language: string | null;
  avatar_url: string | null;
  current_icao_level: number | null;
  target_icao_level: number;
  predicted_icao_level: number | null;
  test_date: string | null;
  test_location: string | null;
  days_until_test: number | null;
  subscription_tier: string;
  subscription_expires_at: string | null;
  daily_goal_minutes: number;
  reminder_enabled: boolean;
  reminder_time: string | null;
  preferred_difficulty: number;
  total_xp: number;
  total_practice_minutes: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login_at: string | null;
  last_practice_at: string | null;
}

export interface UserSettings {
  daily_goal_minutes: number;
  reminder_enabled: boolean;
  reminder_time: string | null;
  preferred_difficulty: number;
  native_language: string | null;
  target_icao_level: number;
  test_date: string | null;
}

export interface UpdateProfileRequest {
  display_name?: string;
  native_language?: string;
  target_icao_level?: number;
  test_date?: string | null;
  test_location?: string;
  daily_goal_minutes?: number;
  reminder_enabled?: boolean;
  reminder_time?: string;
  preferred_difficulty?: number;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Get current user profile
 */
export function useUser() {
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: () => api.get<UserProfile>('/users/me'),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Get user settings
 */
export function useUserSettings() {
  return useQuery({
    queryKey: queryKeys.user.settings(),
    queryFn: () => api.get<UserSettings>('/users/me/settings'),
    staleTime: 60 * 1000,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => 
      api.patch<UserProfile>('/users/me', data),
    onSuccess: (data) => {
      // Update the cache with new profile
      queryClient.setQueryData(queryKeys.user.profile(), data);
      invalidations.progress(queryClient); // May affect stats
    },
  });
}

/**
 * Update user settings
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<UserSettings>) =>
      api.patch<{ message: string; settings: UserSettings }>('/users/me/settings', data),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.user.settings(), response.settings);
      invalidations.user(queryClient);
    },
  });
}

/**
 * Change password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) =>
      api.post<{ message: string }>('/users/me/change-password', data),
  });
}

/**
 * Delete/deactivate account
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => api.delete<{ message: string }>('/users/me'),
  });
}

// =============================================================================
// Derived State Helpers
// =============================================================================

export function useUserDisplayName(): string {
  const { data } = useUser();
  return data?.display_name || 'User';
}

export function useUserInitials(): string {
  const { data } = useUser();
  if (!data?.display_name) return '??';
  return data.display_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function useDaysUntilTest(): number | null {
  const { data } = useUser();
  return data?.days_until_test ?? null;
}

export { ApiError };

