/**
 * API Service
 * 
 * Centralized API functions for data fetching.
 */

import { getAccessToken, refreshTokenWithDedup, isTokenExpired } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// =============================================================================
// API Error
// =============================================================================

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// =============================================================================
// Authenticated Request Helper
// =============================================================================

async function authenticatedRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Check if token needs refresh
  if (isTokenExpired()) {
    const refreshed = await refreshTokenWithDedup();
    if (!refreshed) {
      throw new ApiError(401, 'Session expired');
    }
  }
  
  const token = getAccessToken();
  
  if (!token) {
    throw new ApiError(401, 'Not authenticated');
  }
  
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    let message = 'An error occurred';
    try {
      const error = await response.json();
      message = error.detail || error.message || message;
    } catch {
      message = response.statusText;
    }
    throw new ApiError(response.status, message);
  }
  
  const text = await response.text();
  if (!text) return {} as T;
  
  return JSON.parse(text) as T;
}

// =============================================================================
// Dashboard Types
// =============================================================================

export interface ProgressStats {
  user_id: string;
  display_name: string;
  vocabulary: {
    total_terms: number;
    learned_terms: number;
    mastered_terms: number;
    due_for_review: number;
    new_available: number;
    mastery_percent: number;
    by_category: Array<{
      category: string;
      display_name: string;
      icon: string;
      total_items: number;
      completed_items: number;
      mastered_items: number;
      mastery_percent: number;
      due_for_review: number;
    }>;
    review_accuracy: number;
  };
  listening: {
    total_exercises: number;
    completed_exercises: number;
    completion_percent: number;
    average_score: number;
    total_attempts: number;
    by_category: Array<{
      category: string;
      display_name: string;
      icon: string;
      total_items: number;
      completed_items: number;
      mastered_items: number;
      mastery_percent: number;
      average_score: number | null;
    }>;
    by_difficulty: Record<number, number>;
  };
  speaking: {
    total_scenarios: number;
    completed_scenarios: number;
    completion_percent: number;
    average_score: number;
    total_submissions: number;
    icao_criteria: {
      pronunciation: number;
      structure: number;
      vocabulary: number;
      fluency: number;
      comprehension: number;
      interaction: number;
    };
    by_category: Array<{
      category: string;
      display_name: string;
      icon: string;
      total_items: number;
      completed_items: number;
      mastered_items: number;
      mastery_percent: number;
    }>;
    weakest_criterion: string;
    strongest_criterion: string;
  };
  predicted_icao_level: number;
  level_description: string;
  level_progress_percent: number;
  total_practice_minutes: number;
  practice_this_week_minutes: number;
  average_daily_minutes: number;
  total_xp: number;
  xp_this_week: number;
  streak: {
    current_streak: number;
    longest_streak: number;
    last_practice_date: string | null;
    freeze_available: number;
    is_at_risk: boolean;
  };
  test_date: string | null;
  days_until_test: number | null;
  on_track_for_goal: boolean;
  last_practice_at: string | null;
}

export interface ReviewQueue {
  items: Array<{
    id: string;
    term: string;
    definition: string;
    category: string;
    priority_score: number;
  }>;
  total_due: number;
  new_available: number;
}

export interface ActivityItem {
  type: 'vocabulary' | 'listening' | 'speaking';
  action: string;
  title: string;
  score: number | null;
  xp_earned: number;
  timestamp: string;
}

export interface ActivityTimeline {
  items: ActivityItem[];
  total: number;
  has_more: boolean;
}

export interface TodayProgress {
  today: {
    date: string;
    vocab_reviewed: number;
    listening_completed: number;
    speaking_completed: number;
    practice_minutes: number;
    xp_earned: number;
    goal_met: boolean;
    total_activities: number;
  };
  streak: {
    current_streak: number;
    longest_streak: number;
    last_practice_date: string | null;
    is_at_risk: boolean;
  };
  goal_minutes: number;
  goal_progress_percent: number;
}

export interface WeeklySummary {
  week_start: string;
  week_end: string;
  vocab_reviewed: number;
  listening_completed: number;
  speaking_completed: number;
  practice_minutes: number;
  active_days: number;
  xp_earned: number;
  new_terms_learned: number;
  practice_minutes_change: number;
  xp_change: number;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get comprehensive progress stats
 */
export async function getProgressStats(): Promise<ProgressStats> {
  return authenticatedRequest<ProgressStats>('/api/v1/progress/stats');
}

/**
 * Get vocabulary review queue
 */
export async function getReviewQueue(limit: number = 10): Promise<ReviewQueue> {
  return authenticatedRequest<ReviewQueue>(`/api/v1/vocabulary/review-queue?limit=${limit}`);
}

/**
 * Get activity timeline
 */
export async function getActivityTimeline(limit: number = 10): Promise<ActivityTimeline> {
  return authenticatedRequest<ActivityTimeline>(`/api/v1/progress/activity?limit=${limit}`);
}

/**
 * Get today's progress
 */
export async function getTodayProgress(): Promise<TodayProgress> {
  return authenticatedRequest<TodayProgress>('/api/v1/progress/daily/today');
}

/**
 * Get weekly summary
 */
export async function getWeeklySummary(): Promise<WeeklySummary> {
  return authenticatedRequest<WeeklySummary>('/api/v1/progress/weekly-summary');
}

// =============================================================================
// Vocabulary Types
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
  common_errors: string[] | null;
  cis_pronunciation_tips: string | null;
  related_terms: string[] | null;
  category: string;
  difficulty: number;
  icao_level_target: number;
  audio_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface VocabularyProgress {
  id: string;
  term_id: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
  total_reviews: number;
  correct_reviews: number;
  last_quality: number | null;
  last_reviewed_at: string | null;
  mastery_percent: number;
  is_due: boolean;
}

export interface VocabularyReviewQueueItem {
  term: VocabularyTerm;
  progress: VocabularyProgress | null;
  is_new: boolean;
  priority: number;
  overdue_days: number;
}

export interface VocabularyReviewQueue {
  items: VocabularyReviewQueueItem[];
  total_due: number;
  total_new: number;
}

export interface VocabularyCategoryStats {
  category: string;
  total_terms: number;
  learned_terms: number;
  mastered_terms: number;
  due_for_review: number;
  average_mastery: number;
}

export interface VocabularyReviewResponse {
  term_id: string;
  new_ease_factor: number;
  new_interval_days: number;
  new_repetitions: number;
  next_review_at: string;
  mastery_percent: number;
  xp_earned: number;
  streak_maintained: boolean;
}

// =============================================================================
// Vocabulary API Functions
// =============================================================================

/**
 * Get vocabulary categories with stats
 */
export async function getVocabularyCategoryStats(): Promise<VocabularyCategoryStats[]> {
  return authenticatedRequest<VocabularyCategoryStats[]>('/api/v1/vocabulary/stats/categories');
}

/**
 * Get vocabulary review queue
 */
export async function getVocabularyReviewQueue(
  limit: number = 20,
  category?: string
): Promise<VocabularyReviewQueue> {
  let url = `/api/v1/vocabulary/review-queue?limit=${limit}&include_new=true`;
  if (category) {
    url += `&category=${encodeURIComponent(category)}`;
  }
  return authenticatedRequest<VocabularyReviewQueue>(url);
}

/**
 * Submit vocabulary review
 */
export async function submitVocabularyReview(
  termId: string,
  quality: number,
  timeSpentSeconds?: number
): Promise<VocabularyReviewResponse> {
  return authenticatedRequest<VocabularyReviewResponse>(
    `/api/v1/vocabulary/${termId}/review`,
    {
      method: 'POST',
      body: JSON.stringify({
        quality,
        time_spent_seconds: timeSpentSeconds,
      }),
    }
  );
}

/**
 * Get single vocabulary term
 */
export async function getVocabularyTerm(termId: string): Promise<VocabularyTerm> {
  return authenticatedRequest<VocabularyTerm>(`/api/v1/vocabulary/${termId}`);
}

/**
 * Get vocabulary stats
 */
export async function getVocabularyStats(): Promise<{
  total_terms: number;
  learned_terms: number;
  mastered_terms: number;
  due_for_review: number;
  overall_accuracy: number;
}> {
  return authenticatedRequest('/api/v1/vocabulary/stats');
}

// =============================================================================
// Listening Types
// =============================================================================

export interface ListeningExerciseBrief {
  id: string;
  title: string;
  category: string;
  scenario_type: string;
  accent: string;
  speed: string;
  difficulty: number;
  icao_level_target: number;
  duration_seconds: number;
  audio_url: string | null;
  question_count: number;
  completed: boolean;
  attempt_count: number;
  best_score: number | null;
}

export interface ListeningListResponse {
  items: ListeningExerciseBrief[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

export interface ListeningFilters {
  categories: string[];
  accents: string[];
  speeds: string[];
  difficulties: number[];
}

export interface ListeningQuestion {
  id: string;
  question_type: 'multiple_choice' | 'fill_blank' | 'true_false';
  question_text: string;
  options: string[] | null;
  order: number;
}

export interface ListeningAttemptBrief {
  id: string;
  score_percent: number;
  completed_at: string | null;
}

export interface ListeningExercise {
  id: string;
  title: string;
  audio_url: string | null;
  duration_seconds: number;
  category: string;
  scenario_type: string;
  accent: string;
  speed: string;
  difficulty: number;
  icao_level_target: number;
  questions: ListeningQuestion[];
  created_at: string;
  previous_attempts: ListeningAttemptBrief[];
}

export interface ListeningQuestionResult {
  question_id: string;
  question_text: string;
  question_type: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation: string | null;
}

export interface ListeningSubmitResponse {
  attempt_id: string;
  exercise_id: string;
  score_percent: number;
  correct_count: number;
  total_questions: number;
  results: ListeningQuestionResult[];
  transcript: string;
  teaching_points: string[] | null;
  model_readback: string | null;
  xp_earned: number;
  time_spent_seconds: number;
  completed_at: string;
}

// =============================================================================
// Listening API Functions
// =============================================================================

/**
 * Get listening exercises list with filters
 */
export async function getListeningExercises(params: {
  category?: string;
  difficulty?: number;
  accent?: string;
  speed?: string;
  completed?: boolean;
  skip?: number;
  limit?: number;
} = {}): Promise<ListeningListResponse> {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set('category', params.category);
  if (params.difficulty) searchParams.set('difficulty', params.difficulty.toString());
  if (params.accent) searchParams.set('accent', params.accent);
  if (params.speed) searchParams.set('speed', params.speed);
  if (params.completed !== undefined) searchParams.set('completed', params.completed.toString());
  searchParams.set('skip', (params.skip || 0).toString());
  searchParams.set('limit', (params.limit || 20).toString());
  
  return authenticatedRequest<ListeningListResponse>(
    `/api/v1/listening?${searchParams.toString()}`
  );
}

/**
 * Get listening filter options
 */
export async function getListeningFilters(): Promise<ListeningFilters> {
  return authenticatedRequest<ListeningFilters>('/api/v1/listening/filters');
}

/**
 * Get single listening exercise with questions
 */
export async function getListeningExercise(id: string): Promise<ListeningExercise> {
  return authenticatedRequest<ListeningExercise>(`/api/v1/listening/${id}`);
}

/**
 * Submit listening exercise answers
 */
export async function submitListeningAnswers(
  exerciseId: string,
  answers: Record<string, string>,
  timeSpentSeconds: number,
  audioPlays: number
): Promise<ListeningSubmitResponse> {
  return authenticatedRequest<ListeningSubmitResponse>(
    `/api/v1/listening/${exerciseId}/submit`,
    {
      method: 'POST',
      body: JSON.stringify({
        answers,
        time_spent_seconds: timeSpentSeconds,
        audio_plays: audioPlays,
      }),
    }
  );
}

/**
 * Get listening stats
 */
export async function getListeningStats(): Promise<{
  total_exercises: number;
  completed_exercises: number;
  total_attempts: number;
  average_score: number;
  total_time_spent: number;
  total_xp: number;
}> {
  return authenticatedRequest('/api/v1/listening/stats');
}

// =============================================================================
// Speaking Types
// =============================================================================

export interface SpeakingScenarioBrief {
  id: string;
  title: string;
  scenario_type: string;
  category: string;
  difficulty: number;
  icao_level_target: number;
  completed: boolean;
  submission_count: number;
  best_score: number | null;
}

export interface SpeakingListResponse {
  items: SpeakingScenarioBrief[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

export interface SpeakingSubmissionBrief {
  id: string;
  overall_score: number | null;
  status: string;
  created_at: string;
}

export interface SpeakingScenario {
  id: string;
  title: string;
  scenario_type: string;
  category: string;
  difficulty: number;
  icao_level_target: number;
  setup: string;
  instructions: string | null;
  atc_prompt_text: string;
  atc_prompt_audio_url: string | null;
  expected_elements: string[] | null;
  created_at: string;
  previous_submissions: SpeakingSubmissionBrief[];
}

export interface ICAOScores {
  pronunciation: number;
  structure: number;
  vocabulary: number;
  fluency: number;
  comprehension: number;
  interaction: number;
}

export interface AIFeedback {
  strengths: string[];
  improvements: string[];
  overall: string;
  specific_corrections: Array<{
    said: string;
    should_be: string;
    explanation: string;
  }> | null;
}

export interface SpeakingSubmission {
  id: string;
  scenario_id: string;
  audio_url: string | null;
  duration_seconds: number;
  transcript: string | null;
  scores: ICAOScores | null;
  overall_score: number | null;
  ai_feedback: AIFeedback | null;
  sample_response: string;
  expected_elements: string[] | null;
  common_cis_errors: string[] | null;
  status: string;
  error_message: string | null;
  xp_earned: number;
  created_at: string;
  processed_at: string | null;
}

export interface SpeakingSubmissionStatus {
  id: string;
  status: string;
  progress_percent: number;
  estimated_seconds_remaining: number | null;
  error_message: string | null;
  error_code: string | null;
  can_retry: boolean;
  retry_count: number;
  user_action: string | null;
}

export interface UploadUrlResponse {
  upload_url: string;
  object_key: string;
  fields: Record<string, string>;
  submission_id: string;
  scenario_id: string;
  expires_in_seconds: number;
  max_file_size_bytes: number;
}

// =============================================================================
// Speaking API Functions
// =============================================================================

/**
 * Get speaking scenarios list with filters
 */
export async function getSpeakingScenarios(params: {
  scenario_type?: string;
  category?: string;
  difficulty?: number;
  completed?: boolean;
  skip?: number;
  limit?: number;
} = {}): Promise<SpeakingListResponse> {
  const searchParams = new URLSearchParams();
  if (params.scenario_type) searchParams.set('scenario_type', params.scenario_type);
  if (params.category) searchParams.set('category', params.category);
  if (params.difficulty) searchParams.set('difficulty', params.difficulty.toString());
  if (params.completed !== undefined) searchParams.set('completed', params.completed.toString());
  searchParams.set('skip', (params.skip || 0).toString());
  searchParams.set('limit', (params.limit || 20).toString());
  
  return authenticatedRequest<SpeakingListResponse>(
    `/api/v1/speaking/scenarios?${searchParams.toString()}`
  );
}

/**
 * Get single speaking scenario
 */
export async function getSpeakingScenario(id: string): Promise<SpeakingScenario> {
  return authenticatedRequest<SpeakingScenario>(`/api/v1/speaking/scenarios/${id}`);
}

/**
 * Get pre-signed upload URL for direct upload
 */
export async function getUploadUrl(
  scenarioId: string,
  fileExtension: string = 'webm'
): Promise<UploadUrlResponse> {
  return authenticatedRequest<UploadUrlResponse>(
    `/api/v1/speaking/upload-url?scenario_id=${scenarioId}&file_extension=${fileExtension}`
  );
}

/**
 * Submit audio recording via multipart upload
 */
export async function submitSpeakingRecording(
  scenarioId: string,
  audioBlob: Blob,
  durationSeconds: number
): Promise<{ submission_id: string; status: string }> {
  const token = getAccessToken();
  if (!token) throw new ApiError(401, 'Not authenticated');
  
  const formData = new FormData();
  formData.append('audio', audioBlob, `recording.${audioBlob.type.split('/')[1] || 'webm'}`);
  formData.append('duration_seconds', durationSeconds.toString());
  
  const response = await fetch(
    `${API_BASE_URL}/api/v1/speaking/scenarios/${scenarioId}/submit`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new ApiError(response.status, error.detail || 'Upload failed');
  }
  
  return response.json();
}

/**
 * Confirm direct upload to S3
 */
export async function confirmUpload(
  scenarioId: string,
  submissionId: string,
  objectKey: string,
  durationSeconds: number
): Promise<{ submission_id: string; status: string }> {
  const params = new URLSearchParams({
    submission_id: submissionId,
    object_key: objectKey,
    duration_seconds: durationSeconds.toString(),
  });
  
  return authenticatedRequest(
    `/api/v1/speaking/scenarios/${scenarioId}/confirm-upload?${params.toString()}`,
    { method: 'POST' }
  );
}

/**
 * Get submission with feedback
 */
export async function getSpeakingSubmission(submissionId: string): Promise<SpeakingSubmission> {
  return authenticatedRequest<SpeakingSubmission>(`/api/v1/speaking/submissions/${submissionId}`);
}

/**
 * Get submission status (for polling)
 */
export async function getSpeakingSubmissionStatus(
  submissionId: string
): Promise<SpeakingSubmissionStatus> {
  return authenticatedRequest<SpeakingSubmissionStatus>(
    `/api/v1/speaking/submissions/${submissionId}/status`
  );
}

/**
 * Retry failed submission
 */
export async function retrySpeakingSubmission(
  submissionId: string
): Promise<SpeakingSubmissionStatus> {
  return authenticatedRequest<SpeakingSubmissionStatus>(
    `/api/v1/speaking/submissions/${submissionId}/retry`,
    { method: 'POST' }
  );
}

/**
 * Get speaking stats
 */
export async function getSpeakingStats(): Promise<{
  total_scenarios: number;
  completed_scenarios: number;
  total_submissions: number;
  average_score: number;
  scores_by_criterion: ICAOScores;
  total_xp: number;
}> {
  return authenticatedRequest('/api/v1/speaking/stats');
}

// =============================================================================
// Progress Types
// =============================================================================

export interface DailyProgressItem {
  id: string;
  date: string;
  vocab_reviewed: number;
  listening_completed: number;
  speaking_completed: number;
  practice_minutes: number;
  xp_earned: number;
  goal_met: boolean;
  total_activities: number;
}

export interface DailyProgressResponse {
  items: DailyProgressItem[];
  start_date: string;
  end_date: string;
  total_days: number;
  active_days: number;
  current_streak: number;
  longest_streak: number;
  last_practice_date: string | null;
  is_at_risk: boolean;
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  is_hidden: boolean;
  requirement_type: string;
  requirement_value: number;
  is_unlocked: boolean;
  unlocked_at: string | null;
  progress: number;
  progress_percent: number;
}

export interface AchievementListResponse {
  earned: Achievement[];
  in_progress: Achievement[];
  locked: Achievement[];
  total_earned: number;
  total_xp_from_achievements: number;
}

// =============================================================================
// Progress API Functions
// =============================================================================

/**
 * Get daily progress with streak info
 */
export async function getDailyProgress(params: {
  start_date?: string;
  end_date?: string;
} = {}): Promise<DailyProgressResponse> {
  const searchParams = new URLSearchParams();
  if (params.start_date) searchParams.set('start_date', params.start_date);
  if (params.end_date) searchParams.set('end_date', params.end_date);
  
  const query = searchParams.toString();
  return authenticatedRequest<DailyProgressResponse>(
    `/api/v1/progress/daily${query ? `?${query}` : ''}`
  );
}

/**
 * Get achievements list
 */
export async function getAchievements(): Promise<AchievementListResponse> {
  return authenticatedRequest<AchievementListResponse>('/api/v1/progress/achievements');
}

/**
 * Get today's progress
 */
export async function getTodayProgressDetailed(): Promise<{
  today: DailyProgressItem;
  streak: {
    current_streak: number;
    longest_streak: number;
    last_practice_date: string | null;
    is_at_risk: boolean;
  };
  goal_minutes: number;
  goal_progress_percent: number;
}> {
  return authenticatedRequest('/api/v1/progress/daily/today');
}

// =============================================================================
// Settings Types
// =============================================================================

export interface UserSettings {
  daily_goal_minutes: number;
  reminder_enabled: boolean;
  reminder_time: string | null;
  preferred_difficulty: number;
  native_language: string | null;
  target_icao_level: number;
  test_date: string | null;
}

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

// =============================================================================
// Settings API Functions
// =============================================================================

/**
 * Get user settings
 */
export async function getUserSettings(): Promise<UserSettings> {
  return authenticatedRequest<UserSettings>('/api/v1/users/me/settings');
}

/**
 * Update user settings
 */
export async function updateUserSettings(settings: Partial<UserSettings>): Promise<{
  message: string;
  settings: UserSettings;
}> {
  return authenticatedRequest('/api/v1/users/me/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

/**
 * Get user profile
 */
export async function getUserProfile(): Promise<UserProfile> {
  return authenticatedRequest<UserProfile>('/api/v1/users/me');
}

/**
 * Update user profile
 */
export async function updateUserProfile(data: {
  display_name?: string;
  native_language?: string;
  target_icao_level?: number;
  test_date?: string | null;
  test_location?: string;
  daily_goal_minutes?: number;
  reminder_enabled?: boolean;
  reminder_time?: string;
  preferred_difficulty?: number;
}): Promise<UserProfile> {
  return authenticatedRequest<UserProfile>('/api/v1/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Change password
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  return authenticatedRequest('/api/v1/users/me/change-password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

/**
 * Delete/deactivate account
 */
export async function deleteAccount(): Promise<{ message: string }> {
  return authenticatedRequest('/api/v1/users/me', {
    method: 'DELETE',
  });
}

