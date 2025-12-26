"""
Progress API Routes

Endpoints for progress tracking, streak management, and achievements.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, timedelta

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.services.progress_service import ProgressService
from app.schemas.progress import (
    DailyProgressList,
    DailyProgressWithStreakResponse,
    StreakResponse,
    ProgressStatsResponse,
    AchievementListResponse,
    PracticeSessionRequest,
    PracticeSessionResponse,
    WeeklySummary,
)

router = APIRouter()


# =============================================================================
# Daily Progress
# =============================================================================

@router.get("/daily", response_model=DailyProgressWithStreakResponse)
async def get_daily_progress(
    start_date: Optional[date] = Query(
        None, 
        description="Start of date range (default: 30 days ago)"
    ),
    end_date: Optional[date] = Query(
        None, 
        description="End of date range (default: today)"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get daily activity data for a date range with streak information.
    
    Returns:
    - Daily practice logs (vocab reviewed, listening completed, speaking completed)
    - Practice minutes per day
    - XP earned per day
    - Total and active days count
    - Current streak and longest streak
    - Last practice date
    - Whether streak is at risk (needs practice today)
    """
    service = ProgressService(db)
    
    # Validate date range
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date cannot be after end_date"
        )
    
    # Limit range to 90 days max
    if start_date and end_date:
        max_range = timedelta(days=90)
        if (end_date - start_date) > max_range:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Date range cannot exceed 90 days"
            )
    
    return service.get_daily_progress(current_user.id, start_date, end_date, include_streak=True)


@router.get("/daily/today")
async def get_today_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get today's progress summary.
    """
    service = ProgressService(db)
    today = date.today()
    progress = service.get_daily_progress(current_user.id, today, today)
    
    streak = service.get_streak(current_user.id)
    
    return {
        "today": progress.items[0] if progress.items else {
            "date": today,
            "vocab_reviewed": 0,
            "listening_completed": 0,
            "speaking_completed": 0,
            "practice_minutes": 0,
            "xp_earned": 0,
            "goal_met": False,
            "total_activities": 0
        },
        "streak": streak,
        "goal_minutes": current_user.daily_goal_minutes,
        "goal_progress_percent": min(100, round(
            (progress.items[0].practice_minutes / current_user.daily_goal_minutes * 100)
            if progress.items and current_user.daily_goal_minutes else 0, 1
        ))
    }


@router.get("/streak", response_model=StreakResponse)
async def get_streak(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current streak information.
    
    Returns:
    - Current streak count
    - Longest streak ever
    - Last practice date
    - Whether streak is at risk (needs practice today)
    """
    service = ProgressService(db)
    return service.get_streak(current_user.id)


# =============================================================================
# Comprehensive Stats
# =============================================================================

@router.get("/stats", response_model=ProgressStatsResponse)
async def get_progress_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive progress statistics.
    
    Returns:
    - Vocabulary: total terms, mastered count, mastery percentage per category
    - Listening: exercises completed, average score, scores by category
    - Speaking: scenarios completed, average scores per ICAO criteria
    - Predicted ICAO level (calculated from all performance data)
    - 6 ICAO criteria breakdown
    - Total practice time
    - Streak information
    - Test countdown
    """
    service = ProgressService(db)
    return service.get_comprehensive_stats(current_user.id)


@router.get("/weekly-summary", response_model=WeeklySummary)
async def get_weekly_summary(
    week_offset: int = Query(
        0, 
        ge=0, 
        le=52,
        description="Week offset (0 = current week, 1 = last week, etc.)"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get weekly progress summary.
    
    Returns activity counts, practice time, XP, and comparison to previous week.
    """
    service = ProgressService(db)
    
    today = date.today()
    week_start = today - timedelta(days=today.weekday() + (week_offset * 7))
    week_end = week_start + timedelta(days=6)
    
    # Get this week's data
    progress = service.get_daily_progress(current_user.id, week_start, week_end)
    
    vocab_reviewed = sum(p.vocab_reviewed for p in progress.items)
    listening_completed = sum(p.listening_completed for p in progress.items)
    speaking_completed = sum(p.speaking_completed for p in progress.items)
    practice_minutes = sum(p.practice_minutes for p in progress.items)
    xp_earned = sum(p.xp_earned for p in progress.items)
    
    # Get previous week for comparison
    prev_start = week_start - timedelta(days=7)
    prev_end = week_end - timedelta(days=7)
    prev_progress = service.get_daily_progress(current_user.id, prev_start, prev_end)
    
    prev_minutes = sum(p.practice_minutes for p in prev_progress.items)
    prev_xp = sum(p.xp_earned for p in prev_progress.items)
    
    return WeeklySummary(
        week_start=week_start,
        week_end=week_end,
        vocab_reviewed=vocab_reviewed,
        listening_completed=listening_completed,
        speaking_completed=speaking_completed,
        practice_minutes=practice_minutes,
        active_days=progress.active_days,
        xp_earned=xp_earned,
        new_terms_learned=vocab_reviewed,  # Simplified
        practice_minutes_change=practice_minutes - prev_minutes,
        xp_change=xp_earned - prev_xp
    )


# =============================================================================
# Achievements
# =============================================================================

@router.get("/achievements", response_model=AchievementListResponse)
async def get_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user's achievements.
    
    Returns:
    - Earned achievements with unlock dates
    - In-progress achievements with current progress
    - Available (locked) achievements
    - Total XP from achievements
    """
    service = ProgressService(db)
    return service.get_achievements(current_user.id)


@router.get("/achievements/recent")
async def get_recent_achievements(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get recently unlocked achievements.
    """
    service = ProgressService(db)
    all_achievements = service.get_achievements(current_user.id)
    
    # Sort earned by unlock date (newest first)
    recent = sorted(
        all_achievements.earned,
        key=lambda a: a.unlocked_at or 0,
        reverse=True
    )[:limit]
    
    return {
        "achievements": recent,
        "total_earned": all_achievements.total_earned
    }


# =============================================================================
# Practice Session
# =============================================================================

@router.post("/practice-session", response_model=PracticeSessionResponse)
async def log_practice_session(
    session: PracticeSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Log a completed practice session.
    
    Updates:
    - Daily progress record
    - Streak (increment if practiced yesterday, reset if missed a day)
    - Check and award any newly unlocked achievements
    
    Streak Logic:
    - If practiced yesterday: increment streak
    - If practiced today: no change
    - If missed a day: reset to 1
    - Track longest streak ever
    
    Returns:
    - Updated daily progress
    - Updated streak info
    - Any new achievements unlocked
    - XP earned
    - Goal progress
    - Predicted ICAO level
    """
    service = ProgressService(db)
    
    try:
        return service.log_practice_session(current_user.id, session)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# =============================================================================
# XP and Level
# =============================================================================

@router.get("/xp")
async def get_xp_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get XP information.
    """
    service = ProgressService(db)
    achievements = service.get_achievements(current_user.id)
    
    # Get this week's XP
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    progress = service.get_daily_progress(current_user.id, week_start, today)
    week_xp = sum(p.xp_earned for p in progress.items)
    
    # Calculate level from XP (simple formula)
    level = 1 + (current_user.total_xp // 1000)
    xp_in_level = current_user.total_xp % 1000
    xp_to_next = 1000 - xp_in_level
    
    return {
        "total_xp": current_user.total_xp,
        "this_week_xp": week_xp,
        "level": level,
        "xp_in_level": xp_in_level,
        "xp_to_next_level": xp_to_next,
        "level_progress_percent": round(xp_in_level / 1000 * 100, 1),
        "xp_from_achievements": achievements.total_xp_from_achievements
    }


@router.get("/leaderboard")
async def get_leaderboard(
    period: str = Query(
        "week",
        regex="^(week|month|all)$",
        description="Time period: week, month, or all"
    ),
    limit: int = Query(10, ge=5, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get XP leaderboard.
    
    Note: This is a simplified implementation. In production,
    you'd want caching and more sophisticated ranking.
    """
    from sqlalchemy import select, func
    from app.models.progress import DailyProgress
    
    today = date.today()
    
    if period == "week":
        start_date = today - timedelta(days=today.weekday())
    elif period == "month":
        start_date = today.replace(day=1)
    else:
        start_date = None
    
    # Query top users by XP
    if start_date:
        # For period-based leaderboard
        query = (
            select(
                User.id,
                User.display_name,
                User.avatar_url,
                func.sum(DailyProgress.xp_earned).label('period_xp')
            )
            .join(DailyProgress, User.id == DailyProgress.user_id)
            .where(DailyProgress.date >= start_date)
            .group_by(User.id)
            .order_by(func.sum(DailyProgress.xp_earned).desc())
            .limit(limit)
        )
    else:
        # All-time leaderboard
        query = (
            select(
                User.id,
                User.display_name,
                User.avatar_url,
                User.total_xp.label('period_xp')
            )
            .order_by(User.total_xp.desc())
            .limit(limit)
        )
    
    results = db.execute(query).all()
    
    leaderboard = []
    user_rank = None
    
    for i, row in enumerate(results, 1):
        entry = {
            "rank": i,
            "user_id": row.id,
            "display_name": row.display_name,
            "avatar_url": row.avatar_url,
            "xp": row.period_xp or 0,
            "is_current_user": row.id == current_user.id
        }
        leaderboard.append(entry)
        
        if row.id == current_user.id:
            user_rank = i
    
    return {
        "period": period,
        "leaderboard": leaderboard,
        "user_rank": user_rank,
        "total_users": len(results)
    }


# =============================================================================
# Activity Timeline
# =============================================================================

@router.get("/activity")
async def get_activity_timeline(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get recent activity timeline.
    """
    from sqlalchemy import select, union_all, desc
    from app.models.vocabulary import VocabularyProgress, VocabularyTerm
    from app.models.listening import ListeningAttempt, ListeningExercise
    from app.models.speaking import SpeakingSubmission, SpeakingScenario, SubmissionStatus
    
    activities = []
    
    # Recent vocabulary reviews
    vocab_reviews = db.execute(
        select(VocabularyProgress, VocabularyTerm)
        .join(VocabularyTerm, VocabularyProgress.term_id == VocabularyTerm.id)
        .where(VocabularyProgress.user_id == current_user.id)
        .order_by(desc(VocabularyProgress.last_reviewed_at))
        .limit(limit)
    ).all()
    
    for vp, term in vocab_reviews:
        if vp.last_reviewed_at:
            activities.append({
                "type": "vocabulary",
                "action": "reviewed",
                "title": term.term,
                "score": vp.last_quality * 20 if vp.last_quality else None,  # Convert 0-5 to percentage
                "xp_earned": 2,
                "timestamp": vp.last_reviewed_at.isoformat()
            })
    
    # Recent listening attempts
    listening_attempts = db.execute(
        select(ListeningAttempt, ListeningExercise)
        .join(ListeningExercise, ListeningAttempt.exercise_id == ListeningExercise.id)
        .where(
            ListeningAttempt.user_id == current_user.id,
            ListeningAttempt.completed == True
        )
        .order_by(desc(ListeningAttempt.completed_at))
        .limit(limit)
    ).all()
    
    for attempt, exercise in listening_attempts:
        if attempt.completed_at:
            activities.append({
                "type": "listening",
                "action": "completed",
                "title": exercise.title,
                "score": attempt.score_percent,
                "xp_earned": 10 + int(attempt.score_percent / 10),
                "timestamp": attempt.completed_at.isoformat()
            })
    
    # Recent speaking submissions
    speaking_subs = db.execute(
        select(SpeakingSubmission, SpeakingScenario)
        .join(SpeakingScenario, SpeakingSubmission.scenario_id == SpeakingScenario.id)
        .where(
            SpeakingSubmission.user_id == current_user.id,
            SpeakingSubmission.status == SubmissionStatus.COMPLETED
        )
        .order_by(desc(SpeakingSubmission.processed_at))
        .limit(limit)
    ).all()
    
    for sub, scenario in speaking_subs:
        if sub.processed_at:
            activities.append({
                "type": "speaking",
                "action": "submitted",
                "title": scenario.title,
                "score": sub.overall_score * 100 / 6 if sub.overall_score else None,
                "xp_earned": 15 + int((sub.overall_score or 0) * 5),
                "timestamp": sub.processed_at.isoformat()
            })
    
    # Sort by timestamp
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    
    # Apply pagination
    paginated = activities[offset:offset + limit]
    
    return {
        "items": paginated,
        "total": len(activities),
        "has_more": len(activities) > offset + limit
    }


# =============================================================================
# Goals
# =============================================================================

@router.get("/goals")
async def get_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user's learning goals and progress.
    """
    service = ProgressService(db)
    stats = service.get_comprehensive_stats(current_user.id)
    
    goals = []
    
    # Test date goal
    if current_user.test_date:
        goals.append({
            "type": "test_preparation",
            "title": "ICAO Test Preparation",
            "description": f"Reach Level {current_user.target_icao_level} by {current_user.test_date}",
            "target": current_user.target_icao_level,
            "current": stats.predicted_icao_level,
            "progress_percent": min(100, round(
                stats.predicted_icao_level / current_user.target_icao_level * 100, 1
            )),
            "days_remaining": stats.days_until_test,
            "on_track": stats.on_track_for_goal
        })
    
    # Daily goal
    today = date.today()
    daily_progress = service.get_daily_progress(current_user.id, today, today)
    today_minutes = daily_progress.items[0].practice_minutes if daily_progress.items else 0
    
    goals.append({
        "type": "daily_practice",
        "title": "Daily Practice Goal",
        "description": f"Practice for {current_user.daily_goal_minutes} minutes today",
        "target": current_user.daily_goal_minutes,
        "current": today_minutes,
        "progress_percent": min(100, round(
            today_minutes / current_user.daily_goal_minutes * 100, 1
        ) if current_user.daily_goal_minutes else 100),
        "completed": today_minutes >= current_user.daily_goal_minutes
    })
    
    # Streak goal
    streak = service.get_streak(current_user.id)
    
    # Weekly streak milestones
    next_milestone = 7
    for milestone in [7, 14, 30, 60, 90, 180, 365]:
        if streak.current_streak < milestone:
            next_milestone = milestone
            break
    
    goals.append({
        "type": "streak",
        "title": f"{next_milestone}-Day Streak",
        "description": f"Maintain a {next_milestone}-day practice streak",
        "target": next_milestone,
        "current": streak.current_streak,
        "progress_percent": round(streak.current_streak / next_milestone * 100, 1)
    })
    
    return {"goals": goals}


@router.patch("/goals/daily")
async def update_daily_goal(
    daily_goal_minutes: int = Query(..., ge=5, le=120),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update daily practice goal.
    """
    current_user.daily_goal_minutes = daily_goal_minutes
    db.commit()
    
    return {
        "message": "Daily goal updated",
        "daily_goal_minutes": daily_goal_minutes
    }
