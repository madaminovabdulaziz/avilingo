"""
SM-2 Spaced Repetition Algorithm

Implementation of the SuperMemo SM-2 algorithm for vocabulary learning.
Reference: Product Bible Section 3.5

The algorithm determines optimal review intervals based on recall quality:
- Quality 0-2: Failed recall → reset to 1 day interval
- Quality 3-5: Success → multiply interval by ease factor

Key parameters:
- Ease Factor (EF): How easy the card is (min 1.3, default 2.5)
- Interval: Days until next review
- Repetitions: Consecutive correct answers
"""

from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import Tuple


@dataclass
class SM2Result:
    """Result of SM-2 algorithm calculation."""
    ease_factor: float
    interval_days: int
    repetitions: int
    next_review_at: datetime
    

# Minimum ease factor to prevent items from becoming too difficult
MIN_EASE_FACTOR = 1.3

# Default ease factor for new cards
DEFAULT_EASE_FACTOR = 2.5

# XP rewards based on quality
XP_BY_QUALITY = {
    0: 0,   # Complete blackout
    1: 2,   # Incorrect but recognized
    2: 3,   # Incorrect but easy to recall
    3: 5,   # Correct with difficulty
    4: 8,   # Correct with hesitation
    5: 10,  # Perfect recall
}


def calculate_sm2(
    quality: int,
    current_ease_factor: float,
    current_interval: int,
    current_repetitions: int
) -> SM2Result:
    """
    Calculate new SM-2 values based on review quality.
    
    SM-2 Algorithm:
    
    1. Calculate new ease factor:
       EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
       where q is the quality (0-5)
       
    2. If quality < 3 (failed recall):
       - Reset repetitions to 0
       - Reset interval to 1 day
       
    3. If quality >= 3 (successful recall):
       - Increment repetitions
       - Calculate new interval:
         * rep=1: interval = 1 day
         * rep=2: interval = 6 days
         * rep>2: interval = previous_interval * ease_factor
    
    Args:
        quality: Recall quality (0-5)
            0 = complete blackout
            1 = incorrect, but recognized
            2 = incorrect, easy to recall when reminded
            3 = correct with difficulty
            4 = correct with hesitation
            5 = perfect recall
        current_ease_factor: Current ease factor (typically 2.5 for new)
        current_interval: Current interval in days
        current_repetitions: Current consecutive correct count
        
    Returns:
        SM2Result with new values
    """
    # Validate quality
    quality = max(0, min(5, quality))
    
    # Calculate new ease factor using SM-2 formula
    # EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    new_ease_factor = current_ease_factor + (
        0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    )
    
    # Enforce minimum ease factor
    new_ease_factor = max(MIN_EASE_FACTOR, new_ease_factor)
    
    if quality < 3:
        # Failed recall - reset
        new_repetitions = 0
        new_interval = 1
    else:
        # Successful recall
        new_repetitions = current_repetitions + 1
        
        if new_repetitions == 1:
            new_interval = 1
        elif new_repetitions == 2:
            new_interval = 6
        else:
            # I(n) = I(n-1) * EF
            new_interval = round(current_interval * new_ease_factor)
    
    # Cap interval at 365 days (1 year)
    new_interval = min(new_interval, 365)
    
    # Calculate next review datetime
    next_review_at = datetime.utcnow() + timedelta(days=new_interval)
    
    return SM2Result(
        ease_factor=round(new_ease_factor, 2),
        interval_days=new_interval,
        repetitions=new_repetitions,
        next_review_at=next_review_at
    )


def get_xp_for_quality(quality: int) -> int:
    """Get XP reward for a given quality rating."""
    return XP_BY_QUALITY.get(quality, 0)


def calculate_priority(
    next_review_at: datetime,
    ease_factor: float,
    repetitions: int
) -> Tuple[int, int]:
    """
    Calculate review priority for sorting the review queue.
    
    Higher priority = should be reviewed first.
    
    Priority factors:
    - Overdue items get highest priority
    - Lower ease factor items (harder) get higher priority
    - Fewer repetitions get higher priority (less established)
    
    Args:
        next_review_at: When the item is due
        ease_factor: Current ease factor
        repetitions: Current repetitions count
        
    Returns:
        Tuple of (priority_score, overdue_days)
    """
    now = datetime.utcnow()
    
    # Calculate how overdue the item is
    if next_review_at <= now:
        overdue_delta = now - next_review_at
        overdue_days = overdue_delta.days
        overdue_hours = overdue_delta.seconds // 3600
    else:
        overdue_days = 0
        overdue_hours = 0
    
    # Priority calculation
    # Base priority: days overdue (weighted heavily)
    priority = overdue_days * 100 + overdue_hours
    
    # Bonus for harder items (lower ease factor)
    # (2.5 - ease_factor) / 1.2 gives 0-1 range for typical EF values
    ease_bonus = int((2.5 - ease_factor) / 1.2 * 20)
    priority += max(0, ease_bonus)
    
    # Bonus for less established items (fewer reps)
    if repetitions < 3:
        priority += (3 - repetitions) * 10
    
    return priority, overdue_days


def is_mastered(
    ease_factor: float,
    repetitions: int,
    correct_reviews: int,
    total_reviews: int
) -> bool:
    """
    Determine if a vocabulary term is considered "mastered".
    
    Criteria:
    - At least 5 consecutive correct reviews
    - Ease factor >= 2.3
    - Accuracy >= 80%
    """
    if total_reviews == 0:
        return False
    
    accuracy = correct_reviews / total_reviews
    
    return (
        repetitions >= 5 and
        ease_factor >= 2.3 and
        accuracy >= 0.8
    )


def calculate_mastery_percent(
    ease_factor: float,
    repetitions: int,
    correct_reviews: int,
    total_reviews: int
) -> float:
    """
    Calculate mastery percentage for a vocabulary term.
    
    Components:
    - 40% accuracy weight
    - 30% ease factor weight (normalized 1.3-3.0 range)
    - 30% repetitions weight (capped at 5)
    """
    if total_reviews == 0:
        return 0.0
    
    # Accuracy component (40%)
    accuracy = correct_reviews / total_reviews
    accuracy_score = accuracy * 40
    
    # Ease factor component (30%)
    # Normalize to 0-1 range (1.3 to 3.0)
    ef_normalized = min(1.0, max(0.0, (ease_factor - 1.3) / 1.7))
    ef_score = ef_normalized * 30
    
    # Repetitions component (30%)
    # Cap at 5 repetitions for max score
    rep_normalized = min(1.0, repetitions / 5)
    rep_score = rep_normalized * 30
    
    return round(accuracy_score + ef_score + rep_score, 1)
