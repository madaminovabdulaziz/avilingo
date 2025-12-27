"""
Pydantic Schemas for API Validation

All request/response schemas for the AviLingo API.
Uses Pydantic v2 syntax with field validations.
"""

# =============================================================================
# User Schemas
# =============================================================================
from app.schemas.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
    UserBrief,
    UserInDB,
    PasswordChange,
)

# =============================================================================
# Authentication Schemas
# =============================================================================
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    TokenWithUser,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
    ResendCodeRequest,
    EmailNotVerifiedError,
    LogoutRequest,
    TokenValidationResponse,
    ChangePasswordRequest,
)

# =============================================================================
# Vocabulary Schemas
# =============================================================================
from app.schemas.vocabulary import (
    VocabularyTermBase,
    VocabularyTermCreate,
    VocabularyTermUpdate,
    VocabularyTermResponse,
    VocabularyTermBrief,
    VocabularyProgressResponse,
    VocabularyReviewRequest,
    VocabularyReviewResponse,
    VocabularyReviewQueueItem,
    VocabularyReviewQueue,
    VocabularyListResponse,
    VocabularyCategoryStats,
)

# =============================================================================
# Listening Schemas
# =============================================================================
from app.schemas.listening import (
    ListeningExerciseBase,
    ListeningExerciseCreate,
    ListeningExerciseUpdate,
    ListeningExerciseBrief,
    ListeningExerciseResponse,
    ListeningQuestionBase,
    ListeningQuestionCreate,
    ListeningQuestionResponse,
    ListeningQuestionWithAnswer,
    ListeningSubmitRequest,
    ListeningQuestionResult,
    ListeningSubmitResponse,
    ListeningAttemptBrief,
    ListeningAttemptResponse,
    ListeningListResponse,
    ListeningFilters,
)

# =============================================================================
# Speaking Schemas
# =============================================================================
from app.schemas.speaking import (
    SpeakingScenarioBase,
    SpeakingScenarioCreate,
    SpeakingScenarioUpdate,
    SpeakingScenarioBrief,
    SpeakingScenarioResponse,
    ICAOScores,
    AIFeedback,
    SpeakingSubmitRequest,
    SpeakingSubmitMetadata,
    SpeakingSubmissionBrief,
    SpeakingSubmissionResponse,
    SpeakingSubmissionStatus,
    SpeakingListResponse,
    SpeakingSubmissionListResponse,
)

# =============================================================================
# Progress Schemas
# =============================================================================
from app.schemas.progress import (
    DailyProgressBase,
    DailyProgressCreate,
    DailyProgressResponse,
    DailyProgressList,
    StreakResponse,
    StreakUpdate,
    CategoryProgress,
    ICAOCriteriaProgress,
    VocabularyStats,
    ListeningStats,
    SpeakingStats,
    ProgressStatsResponse,
    AchievementBase,
    AchievementCreate,
    AchievementResponse,
    AchievementListResponse,
    AchievementUnlocked,
    PracticeSessionRequest,
    PracticeSessionResponse,
    ActivityItem,
    ActivityTimeline,
    WeeklySummary,
)


__all__ = [
    # User
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserBrief",
    "UserInDB",
    "PasswordChange",
    
    # Auth
    "LoginRequest",
    "TokenResponse",
    "TokenWithUser",
    "RefreshRequest",
    "RegisterRequest",
    "RegisterResponse",
    "ForgotPasswordRequest",
    "ResetPasswordRequest",
    "VerifyEmailRequest",
    "ResendCodeRequest",
    "EmailNotVerifiedError",
    "LogoutRequest",
    "TokenValidationResponse",
    "ChangePasswordRequest",
    
    # Vocabulary
    "VocabularyTermBase",
    "VocabularyTermCreate",
    "VocabularyTermUpdate",
    "VocabularyTermResponse",
    "VocabularyTermBrief",
    "VocabularyProgressResponse",
    "VocabularyReviewRequest",
    "VocabularyReviewResponse",
    "VocabularyReviewQueueItem",
    "VocabularyReviewQueue",
    "VocabularyListResponse",
    "VocabularyCategoryStats",
    
    # Listening
    "ListeningExerciseBase",
    "ListeningExerciseCreate",
    "ListeningExerciseUpdate",
    "ListeningExerciseBrief",
    "ListeningExerciseResponse",
    "ListeningQuestionBase",
    "ListeningQuestionCreate",
    "ListeningQuestionResponse",
    "ListeningQuestionWithAnswer",
    "ListeningSubmitRequest",
    "ListeningQuestionResult",
    "ListeningSubmitResponse",
    "ListeningAttemptBrief",
    "ListeningAttemptResponse",
    "ListeningListResponse",
    "ListeningFilters",
    
    # Speaking
    "SpeakingScenarioBase",
    "SpeakingScenarioCreate",
    "SpeakingScenarioUpdate",
    "SpeakingScenarioBrief",
    "SpeakingScenarioResponse",
    "ICAOScores",
    "AIFeedback",
    "SpeakingSubmitRequest",
    "SpeakingSubmitMetadata",
    "SpeakingSubmissionBrief",
    "SpeakingSubmissionResponse",
    "SpeakingSubmissionStatus",
    "SpeakingListResponse",
    "SpeakingSubmissionListResponse",
    
    # Progress
    "DailyProgressBase",
    "DailyProgressCreate",
    "DailyProgressResponse",
    "DailyProgressList",
    "StreakResponse",
    "StreakUpdate",
    "CategoryProgress",
    "ICAOCriteriaProgress",
    "VocabularyStats",
    "ListeningStats",
    "SpeakingStats",
    "ProgressStatsResponse",
    "AchievementBase",
    "AchievementCreate",
    "AchievementResponse",
    "AchievementListResponse",
    "AchievementUnlocked",
    "PracticeSessionRequest",
    "PracticeSessionResponse",
    "ActivityItem",
    "ActivityTimeline",
    "WeeklySummary",
]


# =============================================================================
# Schema Documentation
# =============================================================================
#
# Each model has three main schemas:
#
# 1. CreateSchema - For POST requests
#    - All required fields for creating a new record
#    - Field validations (min/max length, regex patterns)
#    - Custom validators for business rules
#
# 2. UpdateSchema - For PATCH requests  
#    - All fields optional
#    - Same validations as Create
#    - extra='forbid' to reject unknown fields
#
# 3. ResponseSchema - For API responses
#    - Includes id and timestamps
#    - from_attributes=True for ORM model conversion
#    - Computed properties where needed
#
# Special Schemas:
#
# - LoginRequest: email + password for authentication
# - TokenResponse: access_token + refresh_token + expires_in
# - VocabularyReviewRequest: quality rating 0-5 for SM-2 algorithm
# - ListeningSubmitRequest: answers dict {question_id: answer}
# - SpeakingSubmitRequest: metadata for audio file upload
# - ProgressStatsResponse: comprehensive stats with all categories
#
# Validation Features:
#
# - Email validation with EmailStr
# - Password strength: min 8 chars, uppercase, lowercase, digit
# - Range validations: ge, le, gt, lt
# - Pattern validation: regex for time format, dates
# - Custom validators with @field_validator
#
# =============================================================================
