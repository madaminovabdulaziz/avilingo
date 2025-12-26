"""
Seed Achievements

Default achievements to populate the database.
Run with: python -m app.db.seed_achievements
"""

import uuid
from datetime import datetime

# Using icon codes instead of emojis for database compatibility
# Frontend will map these to actual emoji or icon components
ACHIEVEMENTS = [
    # ==========================================================================
    # First Steps (Onboarding)
    # ==========================================================================
    {
        "code": "first_word",
        "title": "First Word",
        "description": "Complete your first vocabulary review",
        "icon": "book",
        "category": "vocabulary",
        "requirement_type": "first",
        "requirement_value": 1,
        "xp_reward": 50,
        "is_hidden": False,
        "sort_order": 1
    },
    {
        "code": "first_listen",
        "title": "First Listen",
        "description": "Complete your first listening exercise",
        "icon": "headphones",
        "category": "listening",
        "requirement_type": "first",
        "requirement_value": 1,
        "xp_reward": 50,
        "is_hidden": False,
        "sort_order": 2
    },
    {
        "code": "first_speak",
        "title": "First Transmission",
        "description": "Submit your first speaking exercise",
        "icon": "microphone",
        "category": "speaking",
        "requirement_type": "first",
        "requirement_value": 1,
        "xp_reward": 75,
        "is_hidden": False,
        "sort_order": 3
    },
    
    # ==========================================================================
    # Vocabulary Milestones
    # ==========================================================================
    {
        "code": "vocab_10",
        "title": "Word Collector",
        "description": "Learn 10 vocabulary terms",
        "icon": "book-open",
        "category": "vocabulary",
        "requirement_type": "vocab_count",
        "requirement_value": 10,
        "xp_reward": 100,
        "is_hidden": False,
        "sort_order": 10
    },
    {
        "code": "vocab_50",
        "title": "Vocabulary Builder",
        "description": "Learn 50 vocabulary terms",
        "icon": "books",
        "category": "vocabulary",
        "requirement_type": "vocab_count",
        "requirement_value": 50,
        "xp_reward": 250,
        "is_hidden": False,
        "sort_order": 11
    },
    {
        "code": "vocab_100",
        "title": "Word Master",
        "description": "Learn 100 vocabulary terms",
        "icon": "trophy",
        "category": "vocabulary",
        "requirement_type": "vocab_count",
        "requirement_value": 100,
        "xp_reward": 500,
        "is_hidden": False,
        "sort_order": 12
    },
    {
        "code": "vocab_250",
        "title": "Lexicon Expert",
        "description": "Learn 250 vocabulary terms",
        "icon": "book-closed",
        "category": "vocabulary",
        "requirement_type": "vocab_count",
        "requirement_value": 250,
        "xp_reward": 1000,
        "is_hidden": False,
        "sort_order": 13
    },
    
    # ==========================================================================
    # Listening Milestones
    # ==========================================================================
    {
        "code": "listening_5",
        "title": "Radio Rookie",
        "description": "Complete 5 listening exercises",
        "icon": "radio",
        "category": "listening",
        "requirement_type": "listening_count",
        "requirement_value": 5,
        "xp_reward": 100,
        "is_hidden": False,
        "sort_order": 20
    },
    {
        "code": "listening_25",
        "title": "Radio Operator",
        "description": "Complete 25 listening exercises",
        "icon": "headphones",
        "category": "listening",
        "requirement_type": "listening_count",
        "requirement_value": 25,
        "xp_reward": 300,
        "is_hidden": False,
        "sort_order": 21
    },
    {
        "code": "listening_50",
        "title": "Radio Professional",
        "description": "Complete 50 listening exercises",
        "icon": "satellite-dish",
        "category": "listening",
        "requirement_type": "listening_count",
        "requirement_value": 50,
        "xp_reward": 600,
        "is_hidden": False,
        "sort_order": 22
    },
    
    # ==========================================================================
    # Speaking Milestones
    # ==========================================================================
    {
        "code": "speaking_5",
        "title": "Voice Active",
        "description": "Complete 5 speaking exercises",
        "icon": "mic",
        "category": "speaking",
        "requirement_type": "speaking_count",
        "requirement_value": 5,
        "xp_reward": 150,
        "is_hidden": False,
        "sort_order": 30
    },
    {
        "code": "speaking_20",
        "title": "Radio Talker",
        "description": "Complete 20 speaking exercises",
        "icon": "mic-2",
        "category": "speaking",
        "requirement_type": "speaking_count",
        "requirement_value": 20,
        "xp_reward": 400,
        "is_hidden": False,
        "sort_order": 31
    },
    {
        "code": "speaking_50",
        "title": "Communications Expert",
        "description": "Complete 50 speaking exercises",
        "icon": "plane",
        "category": "speaking",
        "requirement_type": "speaking_count",
        "requirement_value": 50,
        "xp_reward": 800,
        "is_hidden": False,
        "sort_order": 32
    },
    
    # ==========================================================================
    # Streak Achievements
    # ==========================================================================
    {
        "code": "streak_3",
        "title": "Getting Started",
        "description": "Maintain a 3-day streak",
        "icon": "flame",
        "category": "streak",
        "requirement_type": "streak",
        "requirement_value": 3,
        "xp_reward": 75,
        "is_hidden": False,
        "sort_order": 40
    },
    {
        "code": "streak_7",
        "title": "Week Warrior",
        "description": "Maintain a 7-day streak",
        "icon": "flame",
        "category": "streak",
        "requirement_type": "streak",
        "requirement_value": 7,
        "xp_reward": 200,
        "is_hidden": False,
        "sort_order": 41
    },
    {
        "code": "streak_14",
        "title": "Fortnight Flyer",
        "description": "Maintain a 14-day streak",
        "icon": "flame",
        "category": "streak",
        "requirement_type": "streak",
        "requirement_value": 14,
        "xp_reward": 400,
        "is_hidden": False,
        "sort_order": 42
    },
    {
        "code": "streak_30",
        "title": "Month Master",
        "description": "Maintain a 30-day streak",
        "icon": "gem",
        "category": "streak",
        "requirement_type": "streak",
        "requirement_value": 30,
        "xp_reward": 750,
        "is_hidden": False,
        "sort_order": 43
    },
    {
        "code": "streak_60",
        "title": "Dedicated Pilot",
        "description": "Maintain a 60-day streak",
        "icon": "gem",
        "category": "streak",
        "requirement_type": "streak",
        "requirement_value": 60,
        "xp_reward": 1500,
        "is_hidden": False,
        "sort_order": 44
    },
    {
        "code": "streak_90",
        "title": "Quarter Champion",
        "description": "Maintain a 90-day streak",
        "icon": "crown",
        "category": "streak",
        "requirement_type": "streak",
        "requirement_value": 90,
        "xp_reward": 2500,
        "is_hidden": False,
        "sort_order": 45
    },
    {
        "code": "streak_365",
        "title": "Year of Flight",
        "description": "Maintain a 365-day streak",
        "icon": "trophy-gold",
        "category": "streak",
        "requirement_type": "streak",
        "requirement_value": 365,
        "xp_reward": 10000,
        "is_hidden": True,
        "sort_order": 46
    },
    
    # ==========================================================================
    # XP Milestones
    # ==========================================================================
    {
        "code": "xp_1000",
        "title": "First Thousand",
        "description": "Earn 1,000 XP",
        "icon": "star",
        "category": "general",
        "requirement_type": "total_xp",
        "requirement_value": 1000,
        "xp_reward": 100,
        "is_hidden": False,
        "sort_order": 50
    },
    {
        "code": "xp_5000",
        "title": "Rising Star",
        "description": "Earn 5,000 XP",
        "icon": "star-filled",
        "category": "general",
        "requirement_type": "total_xp",
        "requirement_value": 5000,
        "xp_reward": 250,
        "is_hidden": False,
        "sort_order": 51
    },
    {
        "code": "xp_10000",
        "title": "XP Elite",
        "description": "Earn 10,000 XP",
        "icon": "sparkles",
        "category": "general",
        "requirement_type": "total_xp",
        "requirement_value": 10000,
        "xp_reward": 500,
        "is_hidden": False,
        "sort_order": 52
    },
    {
        "code": "xp_50000",
        "title": "XP Legend",
        "description": "Earn 50,000 XP",
        "icon": "medal",
        "category": "general",
        "requirement_type": "total_xp",
        "requirement_value": 50000,
        "xp_reward": 2000,
        "is_hidden": True,
        "sort_order": 53
    },
]


def seed_achievements(db):
    """Seed achievements into the database."""
    from app.models.progress import Achievement
    
    created = 0
    updated = 0
    
    for ach_data in ACHIEVEMENTS:
        # Check if exists
        existing = db.query(Achievement).filter(
            Achievement.code == ach_data["code"]
        ).first()
        
        if existing:
            # Update existing
            for key, value in ach_data.items():
                setattr(existing, key, value)
            updated += 1
        else:
            # Create new
            achievement = Achievement(
                id=str(uuid.uuid4()),
                **ach_data
            )
            db.add(achievement)
            created += 1
    
    db.commit()
    return created, updated


if __name__ == "__main__":
    from app.db.session import SessionLocal
    
    db = SessionLocal()
    try:
        created, updated = seed_achievements(db)
        print(f"Seeded achievements: {created} created, {updated} updated")
    finally:
        db.close()
