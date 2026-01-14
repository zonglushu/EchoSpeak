# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EchoSpeak is a monorepo for an AI-powered oral English practice platform with dual interfaces:
- **Learner app** (`apps/learner`): React 19 + Vite SPA for students to practice shadowing and playback
- **Admin app** (`apps/admin`): Next.js 16 App Router dashboard for content upload, transcription, and publishing

The monorepo uses npm workspaces to manage shared packages for UI components, types, services, and configuration.

## Development Commands

### Prerequisites
- Node.js 20+
- Copy `.env.local.example` to `.env.local` and configure environment variables (especially `GEMINI_API_KEY`)

### Running Applications
```bash
# Install all workspace dependencies (run from root)
npm install

# Learner app (Vite SPA) - runs on http://localhost:5173
npm run dev:learner
# or: npm run dev --workspace @echospeak/learner

# Admin app (Next.js) - runs on http://localhost:3000
npm run dev:admin
# or: npm run dev --workspace @echospeak/admin
```

### Building
```bash
# Build learner app
npm run build:learner
# or: npm run build --workspace @echospeak/learner

# Build admin app
npm run build:admin
# or: npm run build --workspace @echospeak/admin

# Build Storybook UI components
npm run build-storybook
```

### Other Commands
```bash
# Lint admin app
npm run lint:admin
# or: npm run lint --workspace @echospeak/admin

# Run Storybook dev server (port 6006)
npm run storybook
```

## Monorepo Architecture

### Workspace Structure
```
apps/
  learner/          # Vite SPA for students
  admin/            # Next.js App Router for content management
packages/
  ui/               # Shared React components (ProsodyRenderer, NotationLegend)
  services/         # Gemini API wrappers (@echospeak/services)
  types/            # Shared TypeScript types (@echospeak/types)
  config/           # Tailwind preset, ESLint/TS baselines (@echospeak/config)
skills/             # Claude Code skills for domain expertise
  learner-end/      # Learner app user personas and scenarios
    ├── SKILL.md
    ├── references/
    └── dist/       # Skill distribution package
      └── learner-end.skill
  admin-end/        # Admin app workflows and patterns (to be added)
docs/               # Project documentation
```

### Package Dependencies
- Both apps consume `@echospeak/ui` for shared visual components
- Both apps consume `@echospeak/types` for data contracts
- Learner app uses `@echospeak/services` for direct Gemini API calls
- Admin app currently manages its own Supabase integration

### Path Aliases
TypeScript path aliases are configured across all workspaces:
- `@echospeak/ui` → `packages/ui`
- `@echospeak/types` → `packages/types`
- `@echospeak/services` → `packages/services`
- `@echospeak/config` → `packages/config`

Use these in imports instead of relative paths.

## Core Concepts

### AI Services (`packages/services`)
The `@echospeak/services` package wraps Google Gemini AI with three main functions:

- `generateProsodyNotation(sentence, options)`: Generates oral shadowing annotations (stress, intonation, liaisons)
- `bilingualizeText(rawText, options)`: Converts text to bilingual transcript lines with translations
- `transcribeMedia(base64Data, mimeType, options)`: Transcribes media files with embedded/mixed subtitles

All functions use `gemini-3-flash-preview` model by default and include fallback behavior when `GEMINI_API_KEY` is missing.

### Shared Types (`packages/types`)
Core data structures include:
- `TranscriptLine`: Individual subtitle segments with timing, text, translation, and optional prosody notation
- `MediaAsset` / `MediaAssetSummary`: Content metadata and status
- `UploadJob`: Background job tracking for media processing
- `PlaybackState`: Player state machine (IDLE, PLAYING, RECORDING, ANALYZING)

### UI Components (`packages/ui`)
Storybook-driven component library with:
- `ProsodyRenderer`: Renders annotated text with stress, intonation, and liaison markers
- `NotationLegend`: Visual guide for prosody symbols
- Exports `theme.css` for consistent styling across all apps

When modifying shared components, always update Stories first and validate across both consuming apps.

### Configuration (`packages/config`)
Provides:
- `tailwindPreset`: Shared design tokens (colors, spacing, typography)
- ESLint and TypeScript baseline configurations
- Inherited by all apps and packages to ensure consistency

### Claude Code Skills (`skills/`)
Domain expertise packages for Claude Code AI assistant:

**Available Skills**:
- `learner-end`: User personas and learning scenarios for the learner app
  - Three user archetypes: Working Professionals, Exam Preppers, Casual Learners
  - Three learning modes: Companion Input, Intensive Interaction, Reflective Consolidation
  - User journey examples and design principles

**Skill Structure**:
- Each skill has a `SKILL.md` with metadata and quick reference
- Detailed documentation in `references/` subdirectory
- Packaged as `.skill` files in the skill's own `dist/` directory
- Each skill is a self-contained unit (source + distribution)

**When Skills Are Used**:
Claude automatically triggers relevant skills when:
- Designing features for specific user segments
- Writing user stories or acceptance criteria
- Making product decisions
- Implementing domain-specific workflows

See [`docs/README.md`](docs/README.md#08-skills) for complete skills documentation.

## Environment Variables

Required in `.env.local`:
```bash
GEMINI_API_KEY=your-gemini-api-key  # Required for AI features
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=media-uploads
SUPABASE_COVER_BUCKET=media-covers
SUPABASE_DEFAULT_USER_ID=uuid-for-admin-operations
```

The apps degrade gracefully without `GEMINI_API_KEY` (show placeholder content) but require it for production use.

## CI/CD Pipeline

GitHub Actions (`.github/workflows/ci.yml`) runs on main branch and PRs:
1. Installs dependencies
2. Builds learner app
3. Lints admin app
4. Builds admin app
5. Builds Storybook

Ensure all builds pass before pushing to main.

## Documentation

Complete project documentation is organized in the [`docs/`](docs/) directory:

- **📋 01-overview**: Project introduction, planning, milestones ([`project-overview.md`](docs/01-overview/project-overview.md), [`plan.md`](docs/01-overview/plan.md))
- **🏗️ 02-architecture**: System architecture, design decisions ([`structure.md`](docs/02-architecture/structure.md), [`AIProvider.md`](docs/02-architecture/AIProvider.md))
- **🔧 03-setup**: Environment setup guides ([`supabase-setup.md`](docs/03-setup/supabase-setup.md), [`auth-setup-complete.md`](docs/03-setup/auth-setup-complete.md))
- **💻 04-development**: Feature implementation guides ([`Admin-APP.md`](docs/04-development/Admin-APP.md), [`user-quota-system.md`](docs/04-development/user-quota-system.md))
- **🔌 05-api**: API documentation (to be added)
- **🚀 06-deployment**: Deployment guides (to be added)
- **📦 07-archive**: Historical/resolved issue docs

See [`docs/README.md`](docs/README.md) for full documentation index and navigation.

## Key Implementation Notes

- **API Key Security**: Currently, both apps call Gemini directly from the client using environment variables. For production, implement a proxy/Server Action to prevent key exposure.
- **Gemini Response Parsing**: The `sanitizeJsonPayload` helper handles markdown-wrapped JSON responses from LLMs.
- **Shared Client Pattern**: `configureGeminiClient()` allows dependency injection for testing; otherwise, uses a singleton client initialized from env vars.
- **Storybook First**: When modifying shared UI components, update Stories in `packages/ui` before consuming apps.
- **Supabase Integration**: Admin app uses Supabase for media storage and metadata; learner app currently works with local data.
