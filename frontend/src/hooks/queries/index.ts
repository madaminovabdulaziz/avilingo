/**
 * React Query Hooks Index
 * 
 * Centralized exports for all query hooks.
 */

// User hooks
export {
  useUser,
  useUserSettings,
  useUpdateProfile,
  useUpdateSettings,
  useChangePassword,
  useDeleteAccount,
  useUserDisplayName,
  useUserInitials,
  useDaysUntilTest,
  type UserProfile,
  type UserSettings,
  type UpdateProfileRequest,
  type ChangePasswordRequest,
} from './use-user';

// Vocabulary hooks
export {
  useVocabularyCategories,
  useVocabularyCategoryStats,
  useVocabularyTerms,
  useVocabularyTerm,
  useReviewQueue,
  useSubmitReview,
  useStartLearning,
  useReviewDueCount,
  useHasReviewsDue,
  type VocabularyTerm,
  type VocabularyCategory,
  type CategoryStats,
  type ReviewQueueItem,
  type ReviewQueue,
  type ReviewSubmission,
  type ReviewResult,
  type VocabularyFilters,
  type TermsResponse,
} from './use-vocabulary';

// Listening hooks
export {
  useListeningExercises,
  useListeningExercise,
  useListeningFilters,
  useListeningStats,
  useSubmitListeningAnswers,
  useListeningCompletedCount,
  useListeningAverageScore,
  type ListeningExercise,
  type ListeningQuestion,
  type ListeningExerciseDetail,
  type ListeningFilters,
  type ListeningFiltersRequest,
  type ListeningExercisesResponse,
  type ListeningAnswer,
  type ListeningSubmission,
  type QuestionResult,
  type ListeningResult,
  type ListeningStats as ListeningStatsType,
} from './use-listening';

// Speaking hooks
export {
  useSpeakingScenarios,
  useSpeakingScenario,
  useSpeakingSubmission,
  useSpeakingStats,
  useGetUploadUrl,
  useSubmitRecording,
  useConfirmUpload,
  useRetrySubmission,
  useSpeakingAttemptedCount,
  useSpeakingAverageScore,
  type SpeakingScenario,
  type ExpectedElement,
  type SpeakingPrompt,
  type SpeakingScenarioDetail,
  type ICAOCriteriaScore,
  type SpeakingFeedback,
  type SpeakingSubmission as SpeakingSubmissionType,
  type SpeakingFiltersRequest,
  type SpeakingScenariosResponse,
  type SpeakingStats as SpeakingStatsType,
  type UploadUrlResponse,
} from './use-speaking';

// Progress hooks
export {
  useProgressStats,
  useDailyProgress,
  useTodayProgress,
  useAchievements,
  useActivityTimeline,
  useClaimAchievement,
  useCurrentStreak,
  useStreakAtRisk,
  useOverallICAOLevel,
  usePredictedICAOLevel,
  useTotalXP,
  useTodayGoalProgress,
  useEarnedAchievementsCount,
  type StreakInfo,
  type VocabularyStats,
  type ListeningStats as ListeningProgressStats,
  type SpeakingStats as SpeakingProgressStats,
  type CategoryProgress,
  type ICAOCriteriaAverage,
  type ProgressStats,
  type DailyProgress,
  type DailyProgressResponse,
  type TodayProgress,
  type Achievement,
  type AchievementsResponse,
  type ActivityItem,
  type ActivityTimelineResponse,
} from './use-progress';

