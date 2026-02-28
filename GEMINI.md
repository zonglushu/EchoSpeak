# EchoSpeak - Gemini Context

## Project Overview
EchoSpeak is a monorepo for an AI-powered oral English practice platform. It consists of two main applications:
- **Learner App** (`apps/learner`): A React 19 + Vite SPA for students to practice shadowing and playback.
- **Admin App** (`apps/admin`): A Next.js 16 App Router dashboard for content managers to upload videos, generate subtitles, and publish content.

## Monorepo Structure (npm workspaces)

### Applications (`apps/`)
- `apps/learner`:
  - **Framework**: React 19, Vite.
  - **Purpose**: Student interface for learning.
  - **Port**: 5173 (Default).
- `apps/admin`:
  - **Framework**: Next.js 16 (App Router).
  - **Purpose**: Content management, Supabase integration.
  - **Port**: 3000 (Default).

### Shared Packages (`packages/`)
- `packages/ui` (`@echospeak/ui`):
  - Shared React components (e.g., `ProsodyRenderer`, `NotationLegend`).
  - Powered by Storybook.
  - Exports `theme.css`.
- `packages/services` (`@echospeak/services`):
  - Wrappers for Google Gemini API.
  - Functions: `generateProsodyNotation`, `bilingualizeText`, `transcribeMedia`.
- `packages/types` (`@echospeak/types`):
  - Shared TypeScript interfaces (`TranscriptLine`, `MediaAsset`, `PlaybackState`).
- `packages/config` (`@echospeak/config`):
  - Shared configurations for Tailwind, ESLint, and TypeScript.

## Development Workflow

### Key Commands
Run these from the project root:

| Action | Command | Details |
| :--- | :--- | :--- |
| **Install** | `npm install` | Installs dependencies for all workspaces. |
| **Dev (Learner)** | `npm run dev:learner` | Starts Vite dev server. |
| **Dev (Admin)** | `npm run dev:admin` | Starts Next.js dev server. |
| **Build (Learner)** | `npm run build:learner` | Builds the learner SPA. |
| **Build (Admin)** | `npm run build:admin` | Builds the admin app. |
| **Storybook** | `npm run storybook` | Starts Storybook for UI components. |
| **Lint** | `npm run lint:admin` | Lints the admin app. |

### Path Aliases
TypeScript is configured to use the following aliases across all projects. **Always use these instead of relative paths for shared code:**
- `@echospeak/ui` -> `packages/ui`
- `@echospeak/types` -> `packages/types`
- `@echospeak/services` -> `packages/services`
- `@echospeak/config` -> `packages/config`

## Tech Stack & Conventions
- **Language**: TypeScript (Strict mode).
- **Styling**: Tailwind CSS.
- **State Management**: React Context / Hooks (Local), URL state where appropriate.
- **Database**: Supabase (PostgreSQL) - Primarily managed by `apps/admin`.
- **AI**: Google Gemini Flash via `@echospeak/services`.

### Development Rules
1.  **Storybook First**: UI components in `packages/ui` should be developed/tested in Storybook first.
2.  **Shared Types**: If a type is used in more than one place (or passed between API and Frontend), define it in `packages/types`.
3.  **Environment Variables**:
    - Stored in `.env.local` (not committed).
    - Key vars: `GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Documentation Index
- **Architecture**: `docs/02-architecture/`
- **Setup**: `docs/03-setup/`
- **Development Guides**: `docs/04-development/`
- **Feature Plans**: `docs/08-feature/`
