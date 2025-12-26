#!/usr/bin/env python3
"""
Database Reset Script (Development Only)

This script will:
1. Drop all tables
2. Run all migrations
3. Seed the database with initial data

⚠️ WARNING: This will DELETE ALL DATA in the database!
Only use in development environment.

Usage:
    python scripts/reset_database.py
    
    # Skip confirmation prompt:
    python scripts/reset_database.py --yes
    
    # Or from backend directory:
    python -m scripts.reset_database
"""

import os
import sys
import subprocess
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def confirm_reset() -> bool:
    """Prompt user for confirmation."""
    print("\n⚠️  WARNING: This will DELETE ALL DATA in the database!")
    print("   This action cannot be undone.\n")
    
    response = input("Are you sure you want to continue? (type 'yes' to confirm): ")
    return response.lower() == 'yes'


def check_environment() -> bool:
    """Check if we're in development environment."""
    from app.core.config import settings
    
    if settings.ENVIRONMENT == "production":
        print("❌ ERROR: Cannot reset database in production environment!")
        print("   This script is for development use only.")
        return False
    
    return True


def drop_all_tables():
    """Drop all tables from the database."""
    from sqlalchemy import text
    from app.db.session import engine
    from app.db.base import Base
    
    # Import all models to ensure they're registered
    from app.models.user import User
    from app.models.vocabulary import VocabularyTerm, VocabularyProgress
    from app.models.listening import ListeningExercise, ListeningQuestion, ListeningAttempt
    from app.models.speaking import SpeakingScenario, SpeakingSubmission
    from app.models.progress import DailyProgress, Streak, Achievement, UserAchievement
    
    print("\n🗑️  Dropping all tables...")
    
    # Disable foreign key checks (MySQL specific)
    with engine.connect() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
        conn.commit()
    
    # Drop all tables
    Base.metadata.drop_all(bind=engine)
    
    # Re-enable foreign key checks
    with engine.connect() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
        conn.commit()
    
    # Also clean alembic version table
    with engine.connect() as conn:
        try:
            conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
            conn.commit()
        except Exception:
            pass  # Table might not exist
    
    print("   ✓ All tables dropped")


def run_migrations():
    """Run all Alembic migrations."""
    print("\n🔄 Running migrations...")
    
    # Get the backend directory
    backend_dir = Path(__file__).resolve().parent.parent
    
    # Run alembic upgrade
    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        cwd=backend_dir,
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print(f"   ✗ Migration failed: {result.stderr}")
        raise Exception("Migration failed")
    
    print("   ✓ Migrations completed")
    if result.stdout:
        for line in result.stdout.strip().split('\n'):
            print(f"      {line}")


def run_seed():
    """Run the database seeding script."""
    print("\n🌱 Seeding database...")
    
    # Import and run the seed script
    from scripts.seed_database import run_seed as seed_database
    seed_database()


def run_reset(skip_confirm: bool = False):
    """Run the complete database reset process."""
    print("=" * 60)
    print("AviLingo Database Reset (Development)")
    print("=" * 60)
    
    # Check environment
    if not check_environment():
        sys.exit(1)
    
    # Confirm with user
    if not skip_confirm:
        if not confirm_reset():
            print("\n🚫 Reset cancelled.")
            sys.exit(0)
    
    try:
        # Step 1: Drop all tables
        drop_all_tables()
        
        # Step 2: Run migrations
        run_migrations()
        
        # Step 3: Seed database
        run_seed()
        
        print("\n" + "=" * 60)
        print("✅ Database reset completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error during reset: {e}")
        sys.exit(1)


if __name__ == "__main__":
    # Check for --yes flag to skip confirmation
    skip_confirm = "--yes" in sys.argv or "-y" in sys.argv
    run_reset(skip_confirm=skip_confirm)

