"""
SQLAlchemy Models

All database models for AviLingo.
Import all models here for Alembic migrations to detect them.
"""

from app.models.user import User, SubscriptionTier
from app.models.vocabulary import VocabularyTerm, VocabularyProgress
from app.models.listening import ListeningExercise, ListeningQuestion, ListeningAttempt
from app.models.speaking import SpeakingScenario, SpeakingSubmission, SubmissionStatus, ScenarioType
from app.models.progress import DailyProgress, Streak, Achievement, UserAchievement

__all__ = [
    # User
    "User",
    "SubscriptionTier",
    
    # Vocabulary
    "VocabularyTerm",
    "VocabularyProgress",
    
    # Listening
    "ListeningExercise",
    "ListeningQuestion",
    "ListeningAttempt",
    
    # Speaking
    "SpeakingScenario",
    "SpeakingSubmission",
    "SubmissionStatus",
    "ScenarioType",
    
    # Progress
    "DailyProgress",
    "Streak",
    "Achievement",
    "UserAchievement",
]


# =============================================================================
# Model Summary
# =============================================================================
#
# 1. User
#    - Authentication: email, password_hash
#    - Profile: display_name, native_language
#    - ICAO: current_icao_level, target_icao_level, predicted_icao_level, test_date
#    - Subscription: subscription_tier, subscription_expires_at
#
# 2. VocabularyTerm
#    - Content: term, phonetic, definition, example_sentence
#    - Classification: category, difficulty, icao_level_target
#    - Media: audio_url
#
# 3. VocabularyProgress (SM-2 spaced repetition)
#    - Foreign keys: user_id, term_id
#    - SM-2 fields: ease_factor, interval_days, repetitions, next_review_at
#    - Stats: total_reviews, correct_reviews
#
# 4. ListeningExercise
#    - Content: title, audio_url, transcript
#    - Classification: category, accent, speed, difficulty
#
# 5. ListeningQuestion
#    - Foreign key: exercise_id
#    - Content: question_type, question_text, options, correct_answer
#
# 6. ListeningAttempt
#    - Foreign keys: user_id, exercise_id
#    - Results: score_percent, answers, completed
#
# 7. SpeakingScenario
#    - Content: title, scenario_type, category
#    - Instructions: setup, atc_prompt_text, expected_elements, sample_response
#
# 8. SpeakingSubmission
#    - Foreign keys: user_id, scenario_id
#    - Audio: audio_url, transcript
#    - Feedback: ai_feedback, scores (6 ICAO criteria), overall_score
#    - Status: pending, processing, completed, failed
#
# 9. DailyProgress
#    - Foreign key: user_id
#    - Activity: date, vocab_reviewed, listening_completed, speaking_completed
#
# 10. Streak
#     - Foreign key: user_id (one-to-one)
#     - Data: current_streak, longest_streak, last_practice_date
#
# 11. Achievement
#     - Definition: code, title, description, icon
#     - Requirements: category, requirement_type, requirement_value
#     - Reward: xp_reward
#
# 12. UserAchievement
#     - Foreign keys: user_id, achievement_id
#     - Status: progress, is_unlocked, unlocked_at
#
# =============================================================================
