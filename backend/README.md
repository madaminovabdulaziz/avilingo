# AviLingo Backend API

FastAPI backend for the AviLingo aviation English learning platform.

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── routes/          # API endpoint handlers
│   │       ├── auth.py      # Authentication endpoints
│   │       ├── users.py     # User profile endpoints
│   │       ├── vocabulary.py # Vocabulary/flashcard endpoints
│   │       ├── listening.py # Listening exercise endpoints
│   │       ├── speaking.py  # Speaking practice endpoints
│   │       └── progress.py  # Progress tracking endpoints
│   ├── core/
│   │   ├── config.py        # Application configuration
│   │   └── security.py      # JWT and password utilities
│   ├── db/
│   │   ├── base.py          # SQLAlchemy base model
│   │   └── session.py       # Database session management
│   ├── models/              # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── vocabulary.py
│   │   ├── listening.py
│   │   ├── speaking.py
│   │   └── progress.py
│   ├── schemas/             # Pydantic validation schemas
│   │   ├── user.py
│   │   ├── auth.py
│   │   ├── vocabulary.py
│   │   ├── listening.py
│   │   ├── speaking.py
│   │   └── progress.py
│   ├── services/            # Business logic
│   │   ├── spaced_repetition.py  # SM-2 algorithm
│   │   └── icao_scoring.py       # ICAO level calculation
│   └── main.py              # FastAPI application
├── alembic/
│   ├── env.py               # Alembic configuration
│   └── versions/            # Database migrations
├── scripts/
│   ├── seed_database.py     # Seed initial content
│   └── reset_database.py    # Reset database (dev only)
├── docker/
│   └── mysql/
│       └── init.sql         # Database initialization
├── docker-compose.yml       # Local development services
├── requirements.txt         # Python dependencies
├── alembic.ini              # Alembic configuration file
├── env.example              # Environment variables template
└── README.md
```

## Quick Start

### 1. Prerequisites

- Python 3.11+
- Docker and Docker Compose (for MySQL and Redis)

### 2. Start Database Services

```bash
cd backend
docker-compose up -d mysql redis
```

### 3. Set Up Python Environment

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Configure Environment

```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your settings (the defaults work for local development)
```

### 5. Run Database Migrations

```bash
# Run all pending migrations
alembic upgrade head
```

### 6. Seed the Database

```bash
# Seed initial content (50 vocab terms, 12 listening exercises, 10 speaking scenarios, 24 achievements)
python scripts/seed_database.py
```

The seed script is **idempotent** - running it multiple times is safe and will update existing records.

### 7. Start the API Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs (Swagger)**: http://localhost:8000/api/v1/docs
- **Docs (ReDoc)**: http://localhost:8000/api/v1/redoc
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Create new user
- `POST /api/v1/auth/login` - Get access tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Invalidate tokens

### Users
- `GET /api/v1/users/me` - Get current user profile
- `PATCH /api/v1/users/me` - Update profile

### Vocabulary
- `GET /api/v1/vocabulary` - List terms with filters
- `GET /api/v1/vocabulary/review-queue` - Get terms due for review
- `GET /api/v1/vocabulary/{id}` - Get term details
- `POST /api/v1/vocabulary/{id}/review` - Submit review rating

### Listening
- `GET /api/v1/listening` - List exercises
- `GET /api/v1/listening/{id}` - Get exercise with questions
- `POST /api/v1/listening/{id}/submit` - Submit answers

### Speaking
- `GET /api/v1/speaking/scenarios` - List scenarios
- `GET /api/v1/speaking/scenarios/{id}` - Get scenario details
- `POST /api/v1/speaking/scenarios/{id}/submit` - Upload recording
- `GET /api/v1/speaking/submissions/{id}` - Get feedback
- `GET /api/v1/speaking/submissions/{id}/status` - Check status

### Progress
- `GET /api/v1/progress/daily` - Daily activity
- `GET /api/v1/progress/stats` - Comprehensive stats
- `GET /api/v1/progress/achievements` - Achievements
- `POST /api/v1/progress/practice-session` - Log session

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | `mysql+pymysql://avilingo:avilingo_password@localhost:3306/avilingo_db` |
| `SECRET_KEY` | JWT signing key | (generate with `openssl rand -hex 32`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | `60` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime | `30` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `http://localhost:3000` |
| `DEBUG` | Enable debug mode | `true` |

## Development

### Running Tests

```bash
pytest
```

### Database Migrations

```bash
# Create new migration after model changes
alembic revision --autogenerate -m "Description of changes"

# Apply all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Check current migration version
alembic current
```

### Database Seeding

```bash
# Seed initial content (vocabulary, listening, speaking, achievements)
python scripts/seed_database.py
```

### Database Reset (Development Only)

⚠️ **WARNING**: This will delete all data!

```bash
# Reset database - drops all tables, runs migrations, seeds data
python scripts/reset_database.py

# Skip confirmation prompt
python scripts/reset_database.py --yes
```

### Code Formatting

```bash
# Format code
black app/

# Check types
mypy app/
```

## Key Algorithms

### SM-2 Spaced Repetition

The vocabulary module uses the SuperMemo SM-2 algorithm for optimal review scheduling. See `app/services/spaced_repetition.py`.

### ICAO Level Prediction

User performance is analyzed to predict their ICAO level based on vocabulary mastery, listening scores, and speaking feedback. See `app/services/icao_scoring.py`.

