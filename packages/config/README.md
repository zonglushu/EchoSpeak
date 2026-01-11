# @echospeak/config

Shared configuration primitives (Tailwind preset, base ESLint rules, baseline TypeScript settings) consumed by the learner and admin apps.

## Usage

### Tailwind

```ts
// apps/learner/tailwind.config.ts
import sharedPreset from '@echospeak/config/tailwind-preset';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  presets: [sharedPreset],
};
```

### ESLint

```ts
// apps/admin/eslint.config.mjs
import sharedIgnores from '@echospeak/config/eslint/base';
```

### TypeScript

Extend `packages/config/tsconfig.base.json` (or the published `@echospeak/config/tsconfig.base` export) from any workspace `tsconfig` to align compiler options across apps and packages.
