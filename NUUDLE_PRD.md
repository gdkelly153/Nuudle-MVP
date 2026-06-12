# Nuudle — Product Requirements Document (Rebuild)

> **Purpose of this doc:** A self-contained brief that can be pasted into a UI builder (Lovable, v0, Bolt, Replit Agent, etc.) to scaffold a new implementation of Nuudle. It describes what to build, how it should feel, and which assets from the previous build are worth preserving.

---

## 1. Product Vision

**Nuudle** is a thinking tool — not a productivity app, not a journal, not a chatbot. Its tagline is **"Mind Matters."**

The core belief: most people try to solve problems before they've understood them. Nuudle slows you down and walks you through a deliberate process of examining a situation, identifying root causes, confronting the fears that keep you stuck, and committing to an action you actually believe in. It does this through a guided multi-step experience where an AI asks Socratic questions — it never hands you the answer.

Nuudle also offers short daily cognitive exercises (riddles, lateral-thinking puzzles, decision scenarios) that build the same underlying muscle: asking better questions.

### Who it's for
- Thoughtful adults dealing with a recurring personal or professional problem they keep bouncing off of
- Knowledge workers and founders who want a structured way to think through hard decisions
- Lifelong learners who enjoy cognitive puzzles and want a daily habit around sharper thinking

### What makes it different
- **AI as coach, not oracle.** The assistant asks questions; it does not give advice or generate solutions unprompted.
- **Fears and contingencies are first-class.** Most planning tools skip the step where you confront why you haven't acted yet.
- **Progressive disclosure.** The interface guides one step at a time. The user is never shown a blank multi-section form.
- **Warm, not clinical.** Cream backgrounds, golden-mustard accents, DM Sans typography. It should feel like a well-designed notebook, not a SaaS dashboard.

### Non-goals
- Not a task manager, calendar, or habit tracker
- Not a social network or community feature set
- Not a general-purpose AI chat interface
- Not a therapy replacement (clearly communicate this)

---

## 2. Recommended Tech Stack (Rebuild)

Pick what matches your UI builder's defaults, but the original stack worked well:

| Layer | Original | Recommended Rebuild |
|---|---|---|
| Frontend framework | Next.js 15 (App Router) | Next.js 15 App Router, or whatever the UI builder defaults to |
| UI | React 19 + CSS Modules + Tailwind | Tailwind + shadcn/ui component primitives |
| Typography | DM Sans (Google Fonts) | **Keep DM Sans** — central to the brand feel |
| Icons | lucide-react | Keep lucide-react |
| Theming | next-themes (light/dark) | next-themes |
| Backend | FastAPI (Python) + MongoDB | Next.js route handlers OR a lightweight Python/FastAPI service. Use **Postgres (via Supabase or Neon)** in the rebuild instead of MongoDB — the data is relational. |
| Auth | Custom JWT + bcrypt | **Supabase Auth, Clerk, or Auth.js** — don't hand-roll this again |
| AI | Anthropic Claude (Messages API) | **Keep Anthropic Claude. Use Claude Sonnet 4.6 or Opus 4.7.** |
| Voice (optional) | ElevenLabs TTS + Web Speech API STT | ElevenLabs TTS + Web Speech API, or defer voice entirely in MVP |
| PDF/Image export | html2canvas + jspdf | Same, or use `@react-pdf/renderer` |
| Celebration UI | react-confetti | Same |
| Deployment | Render (backend) + Vercel (frontend) | Vercel + managed DB provider |

**Do NOT rebuild:**
- The custom JWT auth system. Use a managed auth provider.
- MongoDB. The data model is relational — use Postgres.
- The pile of planning markdown files in the repo root.

---

## 3. Design System

### Color tokens (keep these exactly)

```css
/* Light mode (default) */
--bg-primary: #FDF9F4;          /* warm cream background */
--bg-surface: #FFFFFF;          /* card surfaces */
--text-primary: #333333;
--text-secondary: #6B6B6B;

/* Dark mode */
--bg-primary-dark: #333333;
--bg-surface-dark: #3F3F3F;
--text-primary-dark: #E0E0E0;

/* Brand */
--golden-mustard: #C6A55F;      /* primary interactive, CTA, focus */
--refined-balance-teal: #41ADB0;/* progress, completion, success */
--warm-brick: #CD6547;          /* destructive actions only */
```

**Usage rules:**
- Golden-mustard for primary CTAs, links, progress accents
- Teal exclusively for "completed" / "solved" / "success" states
- Warm-brick ONLY for delete/destructive actions. Never for normal CTAs.
- Background should always feel warm. No pure white in light mode except cards.

### Typography
- Font family: **DM Sans** (all weights: 400, 500, 600, 700)
- Headings: 600–700 weight
- Body: 400, 1.6 line-height
- Page titles: ~3rem (5xl)
- Section headers: ~1.5rem (2xl)
- Max content width: 800px for reading flows; 1024–1200px for dashboard views

### Spacing & layout
- Generous whitespace — err on the side of too much air
- Rounded corners (12–16px) on cards; pill buttons for primary CTAs
- Subtle shadows on cards, not heavy drop shadows
- Sticky top navigation with backdrop blur

### Motion
- Fade + slight y-transform between wizard steps (~300ms)
- Typing animation for riddle/puzzle text reveal
- Confetti on riddle/puzzle solve
- A subtle "thinking" animation on an AI brain icon while the model is working

### Accessibility (improve from v1)
- All interactive elements have focus rings
- AI responses announce via `aria-live="polite"`
- Don't rely on color alone for state — pair teal "solved" with a check icon, etc.
- Keyboard navigation through the wizard

---

## 4. Information Architecture / Routes

| Route | Auth | Purpose |
|---|---|---|
| `/` | public | Landing page, four module cards |
| `/problem-solver` | public | Entry screen — choose text or voice mode |
| `/problem-solver/session/[id]` | auth (anonymous allowed) | Main 6-step wizard |
| `/problem-solver/voice-session/[id]` | auth | Voice-driven version of the wizard (can be deferred) |
| `/daily-riddle` | public | Today's riddle + 20-questions gameplay |
| `/lateral-thinking-puzzles` | public | Today's multi-component puzzle |
| `/daily-scenario` | public | Today's branching decision scenario |
| `/history` | auth | List of saved sessions with search/filter |
| `/settings` | auth | Theme, account, voice preferences (new in rebuild) |
| `/login`, `/signup` | public | Auth screens (use managed provider's UI) |

---

## 5. Core Feature: Problem Solver (6-Step Wizard)

This is the heart of the product. Every design decision should serve this flow.

### Global wizard behavior
- One step visible at a time. Previous/next steps fade out.
- A top stepper shows progress (1–6) with the current step highlighted in golden-mustard and completed steps in teal.
- Each step has a **"Help me nuudle"** button that opens AI assistance contextual to that step.
- Session state auto-saves on every meaningful change.
- The user can exit mid-session and resume from `/history`.

### Step 1 — Articulate the problem
- Single auto-expanding textarea
- Placeholder: *"What's been on your mind? Describe the problem in your own words."*
- On submit, an AI validator checks: is this goal-oriented ("I want to X") or problem-oriented ("I keep getting stuck on X")?
- If goal-oriented, the AI suggests a reframe as a question, not a command
- User confirms or edits; then advances

### Step 2 — Identify contributing causes
- User adds 1–N causes (each as a chip/row with edit + delete)
- Each cause can be inspected via an **"Analyze"** button that opens a **Cause Analysis Modal**
- The modal is a chat-style interface where the AI asks 1–2 Socratic yes/no questions to probe whether the cause is a symptom or a root cause
- After the exchange, the AI may offer alternative root causes; user can accept, edit, or dismiss
- Separately, a **self-awareness check** analyzes the set of causes: does the user acknowledge their own role? If not, prompt gently.

### Step 3 — Perpetuations
- Free-text: *"What are you doing (or not doing) that keeps this going?"*
- Multi-entry (list of strings)
- Help-me-nuudle button opens modal with reflective questions

### Step 4 — Fears, mitigations, contingencies
- For each cause from Step 2, user adds:
  - **Fear** — what scares them about addressing it
  - **Mitigation** — how they could reduce the risk
  - **Contingency** — what they'd do if the risk happened anyway
- Each row is collapsible
- AI assist can generate suggested mitigations/contingencies the user can accept or modify

### Step 5 — Action planning
- For each cause, AI generates 3–5 specific, creative action options (button: "Generate actions")
- User picks one per cause OR writes their own
- A **Refine** button opens a conversation to iterate on a chosen action
- An **AI check** warns if an action targets a symptom rather than a root cause

### Step 6 — Summary
- AI generates a narrative summary with a title, key insights, and a forward-looking recommendation block
- Rendered as styled markdown
- Actions: **Download as PDF**, **Generate shareable image**, **Save & finish**
- On finish, return user to `/history` with celebration

---

## 6. Secondary Features

### 6.1 Daily Riddle (`/daily-riddle`)
- One riddle per day, reset at midnight Pacific
- Up to 20 yes/no questions; AI answers **Yes / No / Irrelevant**
- Solution submission with smart validation (don't require exact string match)
- Streak counter, total solved
- Typing animation on the riddle text
- Countdown timer to next riddle
- Confetti on solve
- Session saved to user history (if signed in)

### 6.2 Lateral Thinking Puzzle (`/lateral-thinking-puzzles`)
- One puzzle per day; has 3–5 **solution components** to discover
- Same yes/no question format
- Visual checklist of components (each shows only after being "discovered")
- Each component has an associated icon keyword for visual representation
- Full solution revealed on completion

### 6.3 Daily Scenario (`/daily-scenario`)
- Interactive branching narrative
- User makes decisions at checkpoints (3+ options per checkpoint)
- Each decision produces a consequence narrative and leads to the next checkpoint
- Optional voice narration with emotional context (encouraging, questioning, supportive, celebratory)
- **Note:** This was the least complete feature in v1. Consider deferring to v2 of the rebuild.

### 6.4 Session History (`/history`)
- List of all saved problem-solver sessions
- Each entry: summary header (AI-generated title or pain point), date, key causes preview
- Search bar (searches across pain point, causes, actions, assumptions)
- Filter by month/year
- Click to view full session detail in a modal or dedicated page
- Actions per session: view, download PDF, share image, delete

### 6.5 Voice Mode (optional, defer if scoping tight)
- Voice-driven version of the problem-solver wizard
- Uses Web Speech API for user input, ElevenLabs for AI voice output
- Two voice personalities: "Sarah — warm coach" and "James — professional guide"
- Audio visualizer during recording
- **Recommendation:** Ship text-only in v1 of rebuild; add voice as v2.

---

## 7. AI System (Preserve this — it's the most valuable asset from v1)

The v1 backend at [backend/ai_service.py](backend/ai_service.py) contains battle-tested system prompts for each of the following AI roles. **The actual prompt text is reproduced verbatim in Appendix A at the end of this document — copy those into the rebuild.**

| AI role | Purpose | Where used |
|---|---|---|
| **Guidance** | Socratic question-asker; never gives advice | Help-me-nuudle buttons across all steps |
| **Problem validator** | Detects goal-oriented vs. problem-oriented framing | Step 1 |
| **Self-awareness analyzer** | Detects whether the user acknowledges their own role | Step 2 |
| **Cause analyzer** | Probes whether a cause is symptom or root cause | Step 2 modal |
| **Action generator** | Produces 3–5 creative, specific action options | Step 5 |
| **Action refiner** | Iterates on a chosen action via conversation | Step 5 |
| **Fear analyzer** | Suggests mitigations and contingencies | Step 4 |
| **Summary generator** | Writes narrative summary with title + recommendations | Step 6 |
| **Riddle Q&A** | Answers yes/no/irrelevant to user questions | Daily Riddle |
| **Puzzle Q&A** | Same but tracks component discovery | Daily Puzzle |
| **Scenario narrator** | Produces consequence narrative and next checkpoint | Daily Scenario |

### AI behavior rules (enforce in every prompt)
1. The assistant's name is **Nuudle**. Never say "As an AI" or similar.
2. **Ask questions, do not give advice** — except when explicitly asked for options (Step 5).
3. Tone: supportive, genuinely curious, never clinical or corporate.
4. Output is always **markdown** with clear line breaks between points.
5. Never self-reference ("as your AI coach...") after the first turn.
6. Keep responses short — 2–4 sentences max unless generating options/summaries.

### Model choice
- Use **Claude Sonnet 4.6** as the default (`claude-sonnet-4-6`).
- Use **Claude Opus 4.7** (`claude-opus-4-7`) for the summary generator (Step 6) only, where quality matters most.
- Set `max_tokens: 1024` for most calls; 2048 for summary generation.

### Usage controls
- Per-session AI call limit (e.g., 50) with graceful fallback messaging when exceeded
- Per-user daily limit (e.g., 200) enforced server-side
- Track token usage per user for future billing

---

## 8. Data Model (Postgres — redesigned from the v1 Mongo schema)

```sql
-- Users are handled by the auth provider (Supabase/Clerk), but we mirror minimal fields:
users (
  id uuid primary key,
  email text unique not null,
  created_at timestamptz default now()
)

-- The master table for problem-solver work
sessions (
  id uuid primary key,
  user_id uuid references users(id),          -- nullable for anonymous sessions
  session_type text not null,                 -- 'problem_solver' | 'daily_riddle' | 'daily_puzzle' | 'daily_scenario'
  status text not null default 'in_progress', -- 'in_progress' | 'completed' | 'abandoned'
  pain_point text,
  perpetuations text[],                        -- simple array
  action_plan text,
  ai_summary jsonb,                            -- { title, body_markdown, key_insights[], recommendation }
  summary_header text,                         -- denormalized for history list
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
)

-- One row per cause in a session
causes (
  id uuid primary key,
  session_id uuid references sessions(id) on delete cascade,
  text text not null,
  is_root_cause boolean default false,
  position int,                                -- for ordering
  created_at timestamptz default now()
)

-- Per cause: fear + mitigation + contingency
fears (
  id uuid primary key,
  cause_id uuid references causes(id) on delete cascade,
  fear_text text,
  mitigation text,
  contingency text
)

-- Per cause: the chosen action
actions (
  id uuid primary key,
  cause_id uuid references causes(id) on delete cascade,
  action_text text,
  was_ai_generated boolean default false
)

-- Daily content (pre-generated, one row per date)
daily_riddles (
  id uuid primary key,
  date date unique not null,
  riddle_text text not null,
  solution text not null,
  solution_context text[]
)

daily_puzzles (
  id uuid primary key,
  date date unique not null,
  puzzle_text text not null,
  components jsonb not null,  -- [{ text, icon_keyword }]
  total_components int not null
)

daily_scenarios (
  id uuid primary key,
  date date unique not null,
  title text not null,
  briefing text not null,
  checkpoints jsonb not null  -- { checkpoint_id: { narrative, options: { id: text } } }
)

-- Per-user progress on daily content
riddle_attempts (
  id uuid primary key,
  user_id uuid references users(id),
  riddle_id uuid references daily_riddles(id),
  questions jsonb[],          -- [{ text, response }]
  solution_attempts text[],
  status text,                -- 'ongoing' | 'solved' | 'abandoned'
  started_at timestamptz default now(),
  ended_at timestamptz
)

puzzle_attempts (
  id uuid primary key,
  user_id uuid references users(id),
  puzzle_id uuid references daily_puzzles(id),
  solved_components int[],    -- indexes of discovered components
  questions jsonb[],
  status text,
  started_at timestamptz default now(),
  ended_at timestamptz
)

scenario_attempts (
  id uuid primary key,
  user_id uuid references users(id),
  scenario_id uuid references daily_scenarios(id),
  decisions jsonb[],          -- [{ checkpoint_id, choice_id, timestamp }]
  narrative_state jsonb,
  status text
)

-- Streaks (derivable, but cheaper to maintain)
user_streaks (
  user_id uuid primary key references users(id),
  riddle_current_streak int default 0,
  riddle_best_streak int default 0,
  puzzle_current_streak int default 0,
  puzzle_best_streak int default 0,
  last_riddle_date date,
  last_puzzle_date date
)

-- AI usage tracking
ai_usage (
  id uuid primary key,
  user_id uuid references users(id),
  session_id uuid references sessions(id),
  stage text,
  model text,
  input_tokens int,
  output_tokens int,
  cost_cents int,
  created_at timestamptz default now()
)
```

---

## 9. Key User Flows

### Flow A — First-time user solves a problem
1. Lands on `/`, clicks "Problem Solver"
2. Signs up (or continues anonymously — session saves to localStorage and offers account creation at Step 6)
3. Is taken to `/problem-solver/session/[new-id]`
4. Works through Steps 1–6 with AI assistance as desired
5. At Step 6, sees summary, downloads PDF
6. If anonymous, is prompted to create an account to save the session
7. Lands on `/history` with their new session at the top

### Flow B — Daily habit user
1. Opens app in the morning
2. Nav offers badges on modules with new content
3. Completes riddle in 2–5 minutes, sees streak increment
4. Optionally completes puzzle and scenario
5. Returns to a half-finished problem-solver session if one exists

### Flow C — Returning to an old session
1. `/history` → clicks a saved session card
2. Session opens in read-only summary view with option to "Continue editing"
3. User can add a new action or revise their plan
4. Re-download PDF

---

## 10. Landing Page Spec

The current landing page ([frontend/src/app/page.tsx](frontend/src/app/page.tsx)) is bare. The rebuild should upgrade it to something that communicates the product's value.

### Above the fold
- Large headline: **"Think harder, not faster."**
- Subhead: *"Nuudle is a guided thinking tool. Work through hard problems with an AI that asks the right questions — never gives you the answer."*
- Two CTAs: **"Start solving a problem"** (primary) and **"Try today's riddle"** (secondary)
- Optional subtle illustration or animation (knotted rope untangling, or a slowly-rotating mobius strip)

### Below the fold
- A three-panel walkthrough of the 6-step flow (Articulate → Understand → Commit)
- A module grid with the four modules (Problem Solver, Daily Riddle, Daily Puzzle, Daily Scenario) — this is what the v1 landing page had, keep it but position it lower on the page
- Small testimonial or quote section (can be placeholder for now)
- Minimal footer with links to About, Privacy, Contact

---

## 11. What to Preserve From v1

The v1 codebase has serious value in two areas. **Copy these directly into the rebuild:**

### 11.1 AI prompts
- Every system prompt and stage-specific prompt is reproduced verbatim in **Appendix A** at the end of this document
- Specifically the Guidance, Cause Analysis, Action Generation, Fear Analysis, and Summary Generator prompts
- These have been iterated on for months; do not rewrite them

### 11.2 Design tokens
- Color palette (listed in Section 3 above)
- DM Sans typography
- Spacing and shadow conventions

### 11.3 Specific UI patterns to carry over
- Multi-step wizard with fade transitions
- Cause Analysis Modal (chat-style)
- Action Planning Modal (multi-turn)
- Fears Analysis Modal
- Brain icon thinking animation
- Confetti on riddle/puzzle solve
- Markdown summary rendering with styled sections

### 11.4 What to discard
- All planning markdown files in the repo root (`*_plan.md`, `*_fix_plan.md`, etc.) — there are ~150 of them, they're historical artifacts
- The custom JWT auth implementation
- MongoDB schema (redesign as relational Postgres)
- `nuudle.db` SQLite file (stale local dev artifact)
- Any component-level CSS Modules that duplicate Tailwind utilities

---

## 12. Scope for v1 of the Rebuild

### In scope (MVP)
- Landing page with new copy + module grid
- Full text-based Problem Solver (all 6 steps) with AI assistance
- Session history with search and PDF export
- Daily Riddle (full feature)
- Daily Lateral Thinking Puzzle (full feature)
- Auth via managed provider (email + password + Google OAuth)
- Light/dark theme
- Mobile responsive (phone, tablet, desktop)

### Deferred to v2
- Voice mode (Problem Solver voice-session)
- Daily Scenario (branching narratives)
- Shareable image generation
- Admin dashboard for daily content generation
- Billing / subscription tiers

### Explicitly out of scope
- Mobile native apps
- Collaborative / shared sessions
- Email notifications
- Calendar or task-tool integrations

---

## 13. Environment Variables

```bash
# AI
ANTHROPIC_API_KEY=sk-ant-...

# Database (if self-managed Postgres)
DATABASE_URL=postgres://...

# Auth (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Voice (optional, v2)
ELEVENLABS_API_KEY=sk_...

# App
NEXT_PUBLIC_APP_URL=https://nuudle.ai
```

---

## 14. Success Metrics

Track these from day one:
- **Activation:** % of signups who complete a Problem Solver session within 7 days
- **Depth:** Median number of causes identified per session
- **AI engagement:** % of sessions using "Help me nuudle" at least once
- **Daily habit:** DAU/MAU, riddle streak distribution
- **Retention:** W1, W4, W12 retention cohorts
- **Qualitative:** NPS or single-question post-session survey ("Did this help you see the problem differently?")

---

## 15. Voice & Tone Guidelines (for all UI copy)

- **Warm, not corporate.** "Let's take a look at what's underneath this" — not "Analyzing your input."
- **Curious, not prescriptive.** "What do you notice about..." — not "You should..."
- **Confident, not cute.** No exclamation points in AI output. No emoji in product UI.
- **Second person.** Always "you," never "the user."
- **Short.** If a sentence reads long, cut it.

Example of the tone, from Step 1:
> "What's been on your mind? Describe it however it comes out — we'll untangle it together."

Example AI response after Step 2 cause:
> "That sounds like it might be a symptom rather than a root. What would have to be true underneath for that to keep happening?"

---

## 16. Handoff Notes for the UI Builder

When pasting this into a UI builder:
1. Start with the landing page and the four-module grid.
2. Build the Problem Solver wizard shell (stepper + placeholder steps) before any AI wiring.
3. Wire up auth next so sessions can be saved.
4. Build Step 1 + Step 2 end-to-end with AI before moving to Steps 3–6.
5. Build Daily Riddle as a parallel track — it shares design tokens but has its own data model.
6. Leave voice, scenario, and sharing features for later milestones.

The AI prompts in [backend/ai_service.py](backend/ai_service.py) are the crown jewels. Preserve them.


The v1 backend at [backend/ai_service.py](backend/ai_service.py) contains battle-tested system prompts for each of the following AI roles. **The actual prompt text is reproduced verbatim in Appendix A at the end of this document — copy those into the rebuild.**