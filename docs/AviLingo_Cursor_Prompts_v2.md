# AviLingo - Cursor AI Development Guide

## FILES TO UPLOAD TO CURSOR

Upload these files to Cursor's context before starting. You can either:
- Drag files into the chat
- Use @ to mention files from your project
- Add to Cursor's "Docs" feature for persistent context

### Required Files:
1. **avilingo_product_bible_md.pdf** - The complete product specification
2. **AviLingo_Seed_Content.json** - Database seed content (vocabulary, listening, speaking)

### Optional Files (if you have them):
3. **AviLingo_User_Flows.md** - Mermaid diagrams of user flows
4. **AviLingo_Design_System.md** - Design tokens and component specs
5. **AviLingo_Content_Summary.docx** - Content overview

---

## HOW TO USE THESE PROMPTS

1. Start a new Cursor chat
2. Upload the PDF and JSON files first
3. Run Prompt 0 to establish context
4. Run prompts in order (1.1, 1.2, 1.3, etc.)
5. Review generated code before proceeding
6. Commit to git after each major section

---

## PROMPT 0: CONTEXT SETUP

### Prompt 0.1 - Read the Product Bible
```
Please read the attached PDF file "avilingo_product_bible_md.pdf" completely. This is the complete product specification for AviLingo, an aviation English learning app.

After reading, summarize:
1. What problem does AviLingo solve?
2. Who are the 3 target user personas?
3. What are the 5 core features?
4. What tech stack is specified?
5. What does the database schema look like?

Do not generate any code yet. Just confirm you understand the project scope.
```

### Prompt 0.2 - Read the Seed Content
```
Now read the attached JSON file "AviLingo_Seed_Content.json". This contains the initial content for the app:
- 50 vocabulary terms with phonetics, definitions, examples
- 12 listening exercises with transcripts and questions
- 10 speaking scenarios with scoring rubrics
- Phonetic alphabet reference
- Common pronunciation errors for CIS pilots

Summarize the structure of each content type. What fields does a vocabulary term have? What does a listening exercise contain? What's in a speaking scenario?

Do not generate code yet.
```

---

## PHASE 1: BACKEND DEVELOPMENT

### Prompt 1.1 - Initialize Backend Project
```
Create a new FastAPI backend project for AviLingo.

Set up the project structure with these folders:
- app/api/routes (for API endpoints)
- app/core (for config and security)
- app/db (for database connection)
- app/models (for SQLAlchemy models)
- app/schemas (for Pydantic validation)
- app/services (for business logic)

Also create:
- requirements.txt with FastAPI, SQLAlchemy, PyMySQL, python-jose, passlib, redis, alembic
- .env.example with placeholders for DATABASE_URL, SECRET_KEY, API keys
- docker-compose.yml with MySQL and Redis services

Reference the Product Bible Section 3.1 for the architecture overview.
```

### Prompt 1.2 - Create Database Models
```
Create SQLAlchemy models based on the database schema in the Product Bible Section 3.2.

Create these models:
1. User - with email, password_hash, display_name, native_language, current_icao_level, target_icao_level, test_date, subscription_tier
2. VocabularyTerm - with term, phonetic, definition, example_sentence, category, difficulty, audio_url
3. VocabularyProgress - with user_id, term_id, ease_factor, interval_days, repetitions, next_review_at (for spaced repetition)
4. ListeningExercise - with title, audio_url, transcript, accent, speed, difficulty, category
5. ListeningQuestion - with exercise_id, question_type, question_text, options, correct_answer
6. ListeningAttempt - with user_id, exercise_id, score_percent, answers, completed
7. SpeakingScenario - with title, scenario_type, category, instructions, expected_elements, sample_response
8. SpeakingSubmission - with user_id, scenario_id, audio_url, transcript, ai_feedback, scores, status
9. DailyProgress - with user_id, date, vocab_reviewed, listening_completed, speaking_completed
10. Streak - with user_id, current_streak, longest_streak, last_practice_date
11. Achievement and UserAchievement - for gamification

Use UUID primary keys. Add proper foreign keys and indexes. The PDF has the complete schema with all fields.
```

### Prompt 1.3 - Create Pydantic Schemas
```
Create Pydantic schemas for API request/response validation.

For each model, create:
- CreateSchema (for POST requests)
- UpdateSchema (for PATCH requests, all optional fields)
- ResponseSchema (for API responses, includes id and timestamps)

Special schemas needed:
- LoginRequest and TokenResponse for authentication
- VocabularyReviewRequest with quality rating 0-5
- ListeningSubmitRequest with answers dictionary
- SpeakingSubmitRequest for audio file upload
- ProgressStatsResponse with vocabulary, listening, speaking stats

Use Pydantic v2 syntax. Add field validations like email format, password strength (min 8 chars, uppercase, digit).
```

### Prompt 1.4 - Implement Authentication
```
Create the authentication system with JWT tokens.

Endpoints needed (reference Product Bible Section 3.3):
- POST /api/v1/auth/register - create user, hash password, return tokens
- POST /api/v1/auth/login - verify credentials, return access and refresh tokens
- POST /api/v1/auth/refresh - exchange refresh token for new access token
- POST /api/v1/auth/logout - invalidate tokens
- POST /api/v1/auth/forgot-password - placeholder for password reset

Security requirements:
- Access token expires in 60 minutes
- Refresh token expires in 30 days
- Use bcrypt for password hashing
- Use HS256 for JWT
- Create get_current_user dependency for protected routes

Also implement rate limiting: 5 login attempts per minute per IP.
```

### Prompt 1.5 - Vocabulary API with Spaced Repetition
```
Create vocabulary endpoints.

Endpoints:
- GET /api/v1/vocabulary - list terms with filters (category, difficulty), pagination
- GET /api/v1/vocabulary/{id} - get single term details
- GET /api/v1/vocabulary/review-queue - get terms due for review, sorted by priority
- POST /api/v1/vocabulary/{id}/review - submit review with quality rating, update spaced repetition

Implement the SM-2 spaced repetition algorithm from Product Bible Section 3.5:
- Quality 0-2 means failed recall, reset to 1 day interval
- Quality 3-5 means successful, multiply interval by ease factor
- Update ease factor based on performance
- Minimum ease factor is 1.3

The algorithm determines when each word should be reviewed next.
```

### Prompt 1.6 - Listening API
```
Create listening exercise endpoints.

Endpoints:
- GET /api/v1/listening - list exercises with filters (category, difficulty, accent, speed, completed status)
- GET /api/v1/listening/{id} - get exercise with questions and user's previous attempts
- POST /api/v1/listening/{id}/submit - submit answers, calculate score, return correct answers with explanations

Features:
- Don't include transcript in list view (only reveal after attempt)
- Calculate percentage score
- Track time spent
- Return explanations for wrong answers
- Award XP based on performance
```

### Prompt 1.7 - Speaking API
```
Create speaking practice endpoints.

Endpoints:
- GET /api/v1/speaking/scenarios - list scenarios with filters (type, category, difficulty)
- GET /api/v1/speaking/scenarios/{id} - get scenario details with user's submissions
- POST /api/v1/speaking/scenarios/{id}/submit - upload audio recording, create pending submission
- GET /api/v1/speaking/submissions/{id} - get submission with transcript and feedback if completed
- GET /api/v1/speaking/submissions/{id}/status - lightweight status check for polling

Audio upload requirements:
- Accept webm, m4a, mp3, wav formats
- Maximum 3 minutes duration
- Maximum 10MB file size
- Store in cloud storage (placeholder for now)
- Create submission with status "pending"

Note: Actual transcription and AI feedback will be background jobs.
```

### Prompt 1.8 - Progress API
```
Create progress tracking endpoints.

Endpoints:
- GET /api/v1/progress/daily - daily activity for date range with streak info
- GET /api/v1/progress/stats - comprehensive stats (vocab mastery, listening scores, speaking scores, predicted ICAO level)
- GET /api/v1/progress/achievements - earned and available achievements
- POST /api/v1/progress/practice-session - log completed session, update streak, check achievements

Streak logic:
- If practiced yesterday: increment streak
- If practiced today: no change
- If missed a day: reset to 1
- Track longest streak ever

Calculate predicted ICAO level from all performance data.
```

### Prompt 1.9 - Database Migrations and Seeding
```
Set up Alembic for database migrations.

Create initial migration with all models.

Create a seed script that:
1. Reads AviLingo_Seed_Content.json
2. Inserts 50 vocabulary terms
3. Inserts 12 listening exercises with their questions
4. Inserts 10 speaking scenarios
5. Creates initial achievements (first_word, week_streak, vocab_100, etc.)

The seed script should be idempotent (can run multiple times safely).

Also create a reset script for development that drops all tables, runs migrations, and seeds data.
```

### Prompt 1.10 - Main App Setup
```
Create the main FastAPI application file.

Include:
- App metadata (title: AviLingo API, version 1.0.0)
- CORS middleware configured for frontend origins
- All routers mounted under /api/v1 prefix
- Health check endpoint at GET /health
- Exception handlers for validation errors and server errors
- Startup event to verify database connection
- Request logging middleware

Reference Product Bible Section 3.1 for the complete architecture.
```

---

## PHASE 2: FRONTEND DEVELOPMENT

### Prompt 2.1 - Initialize Next.js Project
```
Create a new Next.js 14 project with App Router for AviLingo.

Use TypeScript, Tailwind CSS, and ESLint.

Project structure:
- src/app for pages using App Router
- src/components for React components
- src/lib for utilities and API client
- src/hooks for custom hooks
- src/types for TypeScript interfaces

Install additional packages:
- @tanstack/react-query for data fetching
- zustand for state management
- framer-motion for animations
- lucide-react for icons
- recharts for charts
- shadcn/ui for base components

Set up shadcn with dark theme as default.
```

### Prompt 2.2 - Implement Design System
```
Implement the AviLingo design system in Tailwind.

Colors (dark mode first):
- Background: slate-900 (#0F172A)
- Surface: slate-800 (#1E293B)
- Border: slate-700 (#334155)
- Text: slate-50 (#F8FAFC) primary, slate-400 (#94A3B8) secondary
- Accent: blue-500 (#3B82F6)
- Success: green-500 (#22C55E)
- Warning: yellow-500 (#EAB308)
- Error: red-500 (#EF4444)

ICAO Level Colors:
- Level 1-2: red
- Level 3: amber
- Level 4: green
- Level 5: blue
- Level 6: purple

Typography:
- Body: Inter font
- Phonetics/code: JetBrains Mono

Create base components: Button, Card, Input, Badge, Progress, Dialog, Toast.
```

### Prompt 2.3 - Authentication Flow
```
Implement complete authentication.

Create:
- AuthContext and AuthProvider for managing user state
- useAuth hook for login, register, logout functions
- Token storage and auto-refresh logic
- Middleware to protect /app routes

Pages:
- /login with email/password form, link to register
- /register with email, password, native language, target ICAO level
- /forgot-password with email input

Redirect authenticated users away from auth pages.
Redirect unauthenticated users to login when accessing protected routes.
Show loading state while checking auth.
```

### Prompt 2.4 - Dashboard Page
```
Create the main dashboard at /app/dashboard.

Layout:
1. Greeting with user's name
2. Quick stats row: streak, words learned, listening score, predicted level
3. "Continue Learning" card with next recommended activity
4. Three module cards: Vocabulary, Listening, Speaking with progress indicators
5. Recent activity list
6. Test countdown if test date is set

Fetch data from:
- GET /api/v1/users/me
- GET /api/v1/progress/stats
- GET /api/v1/vocabulary/review-queue (count only)

Reference the Rustam persona from Product Bible - he wants to see his progress at a glance.
```

### Prompt 2.5 - Vocabulary Module
```
Create vocabulary learning interface.

Page /app/vocabulary:
- Grid of category cards (Standard Phraseology, Weather, Navigation, Emergencies, Aircraft Systems, Airport Operations)
- Each card shows progress and mastery percentage
- "Review Due" section at top if words need review

Page /app/vocabulary/review:
- Flashcard interface with flip animation
- Card front: term with audio play button
- Card back: definition, phonetic (in monospace font), example, common errors, CIS pronunciation tip
- Rating buttons: Again (0), Hard (2), Good (4), Easy (5)
- Progress bar showing remaining cards
- Session summary at end

Call POST /api/v1/vocabulary/{id}/review after each card rating.
```

### Prompt 2.6 - Listening Module
```
Create listening comprehension interface.

Page /app/listening:
- Filter tabs: All, Routine, Non-Routine, Emergency
- Filter dropdowns: Difficulty, Accent, Category
- Exercise cards showing title, duration, accent, difficulty, completion status

Page /app/listening/[id]:
- Scenario context at top
- Audio player with play/pause, progress bar, speed control (0.75x, 1x, 1.25x)
- "Ready to answer" button after listening
- Questions appear: multiple choice, fill in blank, true/false
- Submit button
- Results: score, correct/incorrect for each question, transcript reveal, teaching points

Custom audio player component with keyboard shortcuts.
```

### Prompt 2.7 - Speaking Module
```
Create speaking practice interface.

Page /app/speaking:
- Filter by type: Phraseology, Picture Description, Conversation
- Scenario cards with title, type, difficulty, average score

Page /app/speaking/[id]:
- Scenario setup and instructions
- ATC prompt with audio playback
- Expected elements checklist
- Large record button with timer (max 3 min)
- Waveform visualization during recording
- Playback, re-record, and submit buttons

After submission:
- "Analyzing..." with progress indicator
- Results: transcript, 6 ICAO criteria scores as gauges, strengths, improvements, model response

Create useAudioRecorder hook for microphone access and recording.
```

### Prompt 2.8 - Progress Page
```
Create progress tracking page at /app/progress.

Sections:
1. Overview: current streak (large), longest streak, total practice time, words mastered
2. ICAO Readiness: overall predicted level gauge, 6 criteria breakdown as bars, strongest/weakest areas
3. Activity: daily heatmap or line chart of practice minutes
4. Category Progress: vocabulary and listening by category
5. Achievements: earned with dates, locked with progress toward unlock
6. Activity Timeline: recent activities with timestamps

Date range selector: 7 days, 30 days, 90 days, all time.

Create reusable components: ICAOGauge, StreakDisplay, AchievementCard.
```

### Prompt 2.9 - App Layout and Navigation
```
Create the app shell layout.

Desktop:
- Left sidebar with logo, navigation links (Dashboard, Vocabulary, Listening, Speaking, Progress, Settings), streak display at bottom
- Collapsible to icons only
- Top header with page title, notifications, user menu

Mobile:
- Bottom navigation with 5 main icons
- Hamburger menu for settings and profile

Navigation items:
- Dashboard (home icon)
- Vocabulary (book icon)
- Listening (headphones icon)
- Speaking (mic icon)
- Progress (chart icon)

User menu dropdown: Profile, Settings, Help, Logout.

Active states and badges for due items.
```

### Prompt 2.10 - Settings Page
```
Create settings page at /app/settings.

Sections:
1. Profile: display name, email (read-only), native language, target ICAO level, test date
2. Notifications: push toggle, reminder time, reminder days
3. Practice: daily goal, difficulty preference, default audio speed
4. Account: change password, delete account
5. Subscription: current plan, upgrade button (placeholder)
6. About: version, terms, privacy, contact

Use form validation. Show toast on save. API calls to update profile.
```

---

## PHASE 3: INTEGRATION

### Prompt 3.1 - API Client
```
Create a robust API client for the frontend.

Features:
- Base URL from environment variable
- Automatic token attachment to requests
- Handle 401 by attempting token refresh, then redirect to login if failed
- Typed functions for every endpoint
- Error parsing and handling

Create React Query hooks:
- useUser for current user data
- useVocabulary for term list and review queue
- useListening for exercises
- useSpeaking for scenarios and submissions
- useProgress for stats and achievements

Handle loading, error, and empty states consistently.
```

### Prompt 3.2 - Loading and Error States
```
Create consistent loading and error UI components.

Loading:
- Spinner component with sizes
- Skeleton cards matching real cards
- Full page loading during auth check

Errors:
- Error state with icon, message, retry button
- Empty state with illustration and action button
- Error boundary to catch React errors

Add loading states to all data-fetching components.
Use Suspense boundaries where appropriate.
```

### Prompt 3.3 - Animations
```
Add polish with Framer Motion animations.

Animations to add:
- Page fade transitions
- Card hover lift and click feedback
- Flashcard 3D flip
- Swipe with spring physics
- Audio player waveform
- Recording pulse animation
- Progress gauge fill animation
- Streak fire animation
- Achievement unlock celebration

Keep animations fast (200-400ms).
Respect reduced-motion preferences.
```

---

## PHASE 4: DEPLOYMENT

### Prompt 4.1 - Backend Deployment
```
Create deployment configuration for the backend.

Create:
- Dockerfile for FastAPI app with Python 3.11
- docker-compose.yml for local development with MySQL and Redis
- Configuration for Railway or Render deployment
- Environment variable documentation

Include health check endpoint.
Configure for production (disable debug, proper logging).
```

### Prompt 4.2 - Frontend Deployment
```
Create deployment configuration for the frontend.

Create:
- Vercel configuration
- Environment variables setup
- Production build optimization
- PWA manifest for mobile install

Configure proper caching and CDN.
```

---

## TROUBLESHOOTING

### If database connection fails:
```
I'm getting a database connection error: [paste error]

Check the connection string format, MySQL is running, credentials are correct, and the database exists.
```

### If authentication isn't working:
```
Authentication is failing: [describe issue]

Debug the token generation, validation, CORS settings, and how tokens are stored/sent.
```

### If frontend can't reach backend:
```
API calls are failing: [describe error]

Check CORS configuration, API base URL, that backend is running, and look at Network tab.
```

### If audio recording doesn't work:
```
Audio recording isn't working: [describe issue]

Check microphone permissions, browser compatibility, and the MediaRecorder API usage.
```
