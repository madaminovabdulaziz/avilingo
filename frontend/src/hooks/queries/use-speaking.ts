/**
 * Speaking Query Hooks
 * 
 * React Query hooks for speaking exercises and submissions.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, uploadFile } from '@/lib/api-client';
import { queryKeys, invalidations } from '@/lib/query-client';

// =============================================================================
// Types
// =============================================================================

export interface SpeakingScenario {
  id: string;
  title: string;
  description: string;
  scenario_type: 'phraseology' | 'picture' | 'conversation';
  difficulty: number;
  icao_level: number;
  image_url?: string;
  average_score?: number;
  attempt_count?: number;
}

export interface ExpectedElement {
  id: string;
  text: string;
  required: boolean;
  category: string;
}

export interface SpeakingPrompt {
  id: string;
  text: string;
  audio_url: string | null;
  order: number;
}

export interface SpeakingScenarioDetail extends SpeakingScenario {
  setup_text: string;
  instructions: string;
  prompts: SpeakingPrompt[];
  expected_elements: ExpectedElement[];
  time_limit_seconds: number;
  model_response?: string;
}

export interface ICAOCriteriaScore {
  criterion: string;
  score: number;
  feedback: string;
}

export interface SpeakingFeedback {
  overall_score: number;
  icao_scores: ICAOCriteriaScore[];
  transcript: string;
  strengths: string[];
  improvements: string[];
  model_response: string;
}

export interface SpeakingSubmission {
  id: string;
  scenario_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  feedback?: SpeakingFeedback;
  audio_url?: string;
  processing_progress?: number;
}

export interface SpeakingFiltersRequest {
  scenario_type?: 'phraseology' | 'picture' | 'conversation';
  difficulty?: number;
  page?: number;
  limit?: number;
}

export interface SpeakingScenariosResponse {
  items: SpeakingScenario[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface SpeakingStats {
  total_scenarios: number;
  attempted_scenarios: number;
  average_score: number;
  by_type: Array<{
    type: string;
    attempted: number;
    total: number;
    average_score: number;
  }>;
  icao_averages: Array<{
    criterion: string;
    average_score: number;
  }>;
}

export interface UploadUrlResponse {
  upload_url: string;
  audio_key: string;
  submission_id: string;
}

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Get speaking scenarios with filters
 */
export function useSpeakingScenarios(filters?: SpeakingFiltersRequest) {
  return useQuery({
    queryKey: queryKeys.speaking.scenarios(filters),
    queryFn: () => api.get<SpeakingScenariosResponse>('/speaking/scenarios', {
      params: filters as Record<string, string | number | undefined>,
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get a single speaking scenario with details
 */
export function useSpeakingScenario(id: string) {
  return useQuery({
    queryKey: queryKeys.speaking.scenario(id),
    queryFn: () => api.get<SpeakingScenarioDetail>(`/speaking/scenarios/${id}`),
    enabled: !!id,
  });
}

/**
 * Get a speaking submission with feedback
 */
export function useSpeakingSubmission(id: string) {
  return useQuery({
    queryKey: queryKeys.speaking.submission(id),
    queryFn: () => api.get<SpeakingSubmission>(`/speaking/submissions/${id}`),
    enabled: !!id,
    // Poll while processing
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === 'processing' || data?.status === 'pending') {
        return 2000; // Poll every 2 seconds
      }
      return false;
    },
  });
}

/**
 * Get speaking stats for current user
 */
export function useSpeakingStats() {
  return useQuery({
    queryKey: queryKeys.speaking.stats(),
    queryFn: () => api.get<SpeakingStats>('/speaking/stats'),
    staleTime: 60 * 1000, // 1 minute
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Get a pre-signed upload URL
 */
export function useGetUploadUrl() {
  return useMutation({
    mutationFn: ({ scenarioId, fileExtension }: { scenarioId: string; fileExtension: string }) =>
      api.get<UploadUrlResponse>('/speaking/upload-url', {
        params: { scenario_id: scenarioId, file_extension: fileExtension },
      }),
  });
}

/**
 * Submit a speaking recording via multipart upload
 */
export function useSubmitRecording() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ scenarioId, audioBlob }: { scenarioId: string; audioBlob: Blob }) => {
      const file = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      const result = await uploadFile(
        `/speaking/scenarios/${scenarioId}/submit`,
        file,
        'audio',
        {}
      );
      return result as unknown as SpeakingSubmission;
    },
    onSuccess: () => {
      invalidations.speaking(queryClient);
      invalidations.progress(queryClient);
    },
  });
}

/**
 * Confirm a direct S3 upload
 */
export function useConfirmUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, audioKey }: { submissionId: string; audioKey: string }) =>
      api.post<SpeakingSubmission>(`/speaking/submissions/${submissionId}/confirm`, {
        audio_key: audioKey,
      }),
    onSuccess: () => {
      invalidations.speaking(queryClient);
      invalidations.progress(queryClient);
    },
  });
}

/**
 * Retry a failed submission
 */
export function useRetrySubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submissionId: string) =>
      api.post<SpeakingSubmission>(`/speaking/submissions/${submissionId}/retry`),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.speaking.submission(result.id), result);
    },
  });
}

// =============================================================================
// Derived State Helpers
// =============================================================================

/**
 * Get count of attempted speaking scenarios
 */
export function useSpeakingAttemptedCount(): number {
  const { data } = useSpeakingStats();
  return data?.attempted_scenarios ?? 0;
}

/**
 * Get average speaking score
 */
export function useSpeakingAverageScore(): number {
  const { data } = useSpeakingStats();
  return data?.average_score ?? 0;
}

