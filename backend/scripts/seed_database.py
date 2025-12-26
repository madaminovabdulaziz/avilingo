#!/usr/bin/env python3
"""
Database Seed Script

Seeds the AviLingo database with initial content:
- 50 vocabulary terms
- 12 listening exercises with questions
- 10 speaking scenarios
- All achievements

This script is idempotent - it can be run multiple times safely.
Existing records are updated, not duplicated.

Usage:
    python scripts/seed_database.py
    
    # Or from backend directory:
    python -m scripts.seed_database
"""

import json
import sys
import uuid
from pathlib import Path
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.vocabulary import VocabularyTerm
from app.models.listening import ListeningExercise, ListeningQuestion
from app.models.speaking import SpeakingScenario
from app.models.progress import Achievement


def load_seed_content() -> dict:
    """Load the seed content JSON file."""
    # Try multiple possible paths
    possible_paths = [
        Path(__file__).resolve().parent.parent.parent / "docs" / "AviLingo_Seed_Content.json",
        Path("docs/AviLingo_Seed_Content.json"),
        Path("../docs/AviLingo_Seed_Content.json"),
    ]
    
    for path in possible_paths:
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
    
    raise FileNotFoundError(
        f"Could not find AviLingo_Seed_Content.json. Tried: {possible_paths}"
    )


def seed_vocabulary(db: Session, vocabulary_data: list, limit: int = 50) -> tuple[int, int]:
    """
    Seed vocabulary terms into the database.
    
    Args:
        db: Database session
        vocabulary_data: List of vocabulary term dictionaries
        limit: Maximum number of terms to seed
        
    Returns:
        Tuple of (created_count, updated_count)
    """
    created = 0
    updated = 0
    
    for item in vocabulary_data[:limit]:
        term_id = item.get("id", str(uuid.uuid4()))
        
        # Check if exists by term (unique identifier from content)
        existing = db.execute(
            select(VocabularyTerm).where(VocabularyTerm.term == item["term"])
        ).scalar_one_or_none()
        
        if existing:
            # Update existing
            existing.phonetic = item.get("phonetic")
            existing.part_of_speech = item.get("part_of_speech")
            existing.definition = item["definition"]
            existing.aviation_context = item.get("aviation_context")
            existing.example_atc = item.get("example_atc")
            existing.example_response = item.get("example_response")
            existing.common_errors = item.get("common_errors")
            existing.cis_pronunciation_tips = item.get("cis_pronunciation_tips")
            existing.related_terms = item.get("related_terms")
            existing.category = item["category"]
            existing.difficulty = item.get("difficulty", 1)
            existing.icao_level_target = item.get("icao_level_target", 4)
            existing.updated_at = datetime.utcnow()
            updated += 1
        else:
            # Create new
            vocab_term = VocabularyTerm(
                id=str(uuid.uuid4()),
                term=item["term"],
                phonetic=item.get("phonetic"),
                part_of_speech=item.get("part_of_speech"),
                definition=item["definition"],
                aviation_context=item.get("aviation_context"),
                example_atc=item.get("example_atc"),
                example_response=item.get("example_response"),
                common_errors=item.get("common_errors"),
                cis_pronunciation_tips=item.get("cis_pronunciation_tips"),
                related_terms=item.get("related_terms"),
                category=item["category"],
                difficulty=item.get("difficulty", 1),
                icao_level_target=item.get("icao_level_target", 4),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(vocab_term)
            created += 1
    
    db.commit()
    return created, updated


def seed_listening_exercises(db: Session, listening_data: list, limit: int = 12) -> tuple[int, int]:
    """
    Seed listening exercises and their questions into the database.
    
    Args:
        db: Database session
        listening_data: List of listening exercise dictionaries
        limit: Maximum number of exercises to seed
        
    Returns:
        Tuple of (created_count, updated_count)
    """
    created = 0
    updated = 0
    
    for item in listening_data[:limit]:
        # Check if exists by title (unique identifier from content)
        existing = db.execute(
            select(ListeningExercise).where(ListeningExercise.title == item["title"])
        ).scalar_one_or_none()
        
        if existing:
            # Update existing exercise
            existing.difficulty = item.get("difficulty", 1)
            existing.icao_level_target = item.get("icao_level_target", 4)
            existing.category = item["category"]
            existing.accent = item.get("accent", "American - Standard")
            existing.speed = item.get("speed", "normal")
            existing.duration_seconds = item.get("duration_seconds", 30)
            existing.scenario_type = item.get("scenario_type", "routine")
            existing.transcript = item["transcript"]
            existing.teaching_points = item.get("teaching_points")
            existing.model_readback = item.get("model_readback")
            existing.audio_generation_notes = item.get("audio_generation_notes")
            existing.updated_at = datetime.utcnow()
            
            # Update questions
            _seed_questions(db, existing.id, item.get("questions", []))
            updated += 1
        else:
            # Create new exercise
            exercise = ListeningExercise(
                id=str(uuid.uuid4()),
                title=item["title"],
                difficulty=item.get("difficulty", 1),
                icao_level_target=item.get("icao_level_target", 4),
                category=item["category"],
                accent=item.get("accent", "American - Standard"),
                speed=item.get("speed", "normal"),
                duration_seconds=item.get("duration_seconds", 30),
                scenario_type=item.get("scenario_type", "routine"),
                transcript=item["transcript"],
                teaching_points=item.get("teaching_points"),
                model_readback=item.get("model_readback"),
                audio_generation_notes=item.get("audio_generation_notes"),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(exercise)
            db.flush()  # Get the ID
            
            # Create questions
            _seed_questions(db, exercise.id, item.get("questions", []))
            created += 1
    
    db.commit()
    return created, updated


def _seed_questions(db: Session, exercise_id: str, questions_data: list) -> None:
    """Seed questions for a listening exercise."""
    # Delete existing questions for this exercise
    existing_questions = db.execute(
        select(ListeningQuestion).where(ListeningQuestion.exercise_id == exercise_id)
    ).scalars().all()
    
    for q in existing_questions:
        db.delete(q)
    
    # Create new questions
    for i, q in enumerate(questions_data, 1):
        question = ListeningQuestion(
            id=str(uuid.uuid4()),
            exercise_id=exercise_id,
            question_type=q.get("type", "multiple_choice"),
            question_text=q["question"],
            options=q.get("options"),
            correct_answer=q["correct"],
            explanation=q.get("explanation"),
            order=i,
        )
        db.add(question)


def seed_speaking_scenarios(db: Session, speaking_data: list, limit: int = 10) -> tuple[int, int]:
    """
    Seed speaking scenarios into the database.
    
    Args:
        db: Database session
        speaking_data: List of speaking scenario dictionaries
        limit: Maximum number of scenarios to seed
        
    Returns:
        Tuple of (created_count, updated_count)
    """
    created = 0
    updated = 0
    
    for item in speaking_data[:limit]:
        # Check if exists by title (unique identifier from content)
        existing = db.execute(
            select(SpeakingScenario).where(SpeakingScenario.title == item["title"])
        ).scalar_one_or_none()
        
        if existing:
            # Update existing
            existing.difficulty = item.get("difficulty", 1)
            existing.icao_level_target = item.get("icao_level_target", 4)
            existing.category = item["category"]
            existing.scenario_type = item.get("scenario_type", "phraseology")
            existing.setup = item["setup"]
            existing.atc_prompt_text = item["atc_prompt_text"]
            existing.expected_elements = item.get("expected_elements")
            existing.sample_response = item["sample_response"]
            existing.scoring_rubric = item.get("scoring_rubric")
            existing.common_cis_errors = item.get("common_cis_errors")
            existing.updated_at = datetime.utcnow()
            updated += 1
        else:
            # Create new
            scenario = SpeakingScenario(
                id=str(uuid.uuid4()),
                title=item["title"],
                difficulty=item.get("difficulty", 1),
                icao_level_target=item.get("icao_level_target", 4),
                category=item["category"],
                scenario_type=item.get("scenario_type", "phraseology"),
                setup=item["setup"],
                atc_prompt_text=item["atc_prompt_text"],
                expected_elements=item.get("expected_elements"),
                sample_response=item["sample_response"],
                scoring_rubric=item.get("scoring_rubric"),
                common_cis_errors=item.get("common_cis_errors"),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(scenario)
            created += 1
    
    db.commit()
    return created, updated


def seed_achievements(db: Session) -> tuple[int, int]:
    """
    Seed achievements into the database.
    
    Returns:
        Tuple of (created_count, updated_count)
    """
    # Import the achievements list from the existing file
    from app.db.seed_achievements import ACHIEVEMENTS
    
    created = 0
    updated = 0
    
    for ach_data in ACHIEVEMENTS:
        # Check if exists
        existing = db.execute(
            select(Achievement).where(Achievement.code == ach_data["code"])
        ).scalar_one_or_none()
        
        if existing:
            # Update existing
            for key, value in ach_data.items():
                setattr(existing, key, value)
            updated += 1
        else:
            # Create new
            achievement = Achievement(
                id=str(uuid.uuid4()),
                created_at=datetime.utcnow(),
                **ach_data
            )
            db.add(achievement)
            created += 1
    
    db.commit()
    return created, updated


def run_seed():
    """Run the complete database seeding process."""
    print("=" * 60)
    print("AviLingo Database Seeding")
    print("=" * 60)
    
    # Load seed content
    print("\n📂 Loading seed content...")
    try:
        content = load_seed_content()
        print("   ✓ Seed content loaded successfully")
    except FileNotFoundError as e:
        print(f"   ✗ Error: {e}")
        sys.exit(1)
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Seed vocabulary
        print("\n📚 Seeding vocabulary terms...")
        vocab_created, vocab_updated = seed_vocabulary(
            db, 
            content.get("vocabulary", []),
            limit=50
        )
        print(f"   ✓ Vocabulary: {vocab_created} created, {vocab_updated} updated")
        
        # Seed listening exercises
        print("\n🎧 Seeding listening exercises...")
        listen_created, listen_updated = seed_listening_exercises(
            db,
            content.get("listening_exercises", []),
            limit=12
        )
        print(f"   ✓ Listening: {listen_created} created, {listen_updated} updated")
        
        # Seed speaking scenarios
        print("\n🎤 Seeding speaking scenarios...")
        speak_created, speak_updated = seed_speaking_scenarios(
            db,
            content.get("speaking_scenarios", []),
            limit=10
        )
        print(f"   ✓ Speaking: {speak_created} created, {speak_updated} updated")
        
        # Seed achievements
        print("\n🏆 Seeding achievements...")
        ach_created, ach_updated = seed_achievements(db)
        print(f"   ✓ Achievements: {ach_created} created, {ach_updated} updated")
        
        # Summary
        print("\n" + "=" * 60)
        print("✅ Database seeding completed successfully!")
        print("=" * 60)
        print(f"""
Summary:
  • Vocabulary:  {vocab_created + vocab_updated} terms ({vocab_created} new)
  • Listening:   {listen_created + listen_updated} exercises ({listen_created} new)
  • Speaking:    {speak_created + speak_updated} scenarios ({speak_created} new)
  • Achievements: {ach_created + ach_updated} items ({ach_created} new)
        """)
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()

