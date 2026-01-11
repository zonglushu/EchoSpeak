import type { Config } from 'tailwindcss';
import sharedPreset from '@echospeak/config/tailwind-preset';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  presets: [sharedPreset],
};

export default config;
