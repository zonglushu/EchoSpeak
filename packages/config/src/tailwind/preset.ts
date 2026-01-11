import type { Config } from 'tailwindcss';

const themeExtend: Config['theme'] = {
  darkMode: 'class',
  extend: {
    colors: {
      // 方案A：清新活力配色
      primary: {
        DEFAULT: '#3B82F6',    // 主蓝色
        light: '#60A5FA',      // 浅蓝色
        dark: '#2563EB',       // 深蓝色
        50: '#EFF6FF',        // 极浅蓝
        100: '#DBEAFE',
        200: '#BFDBFE',
        300: '#93C5FD',
        400: '#60A5FA',
        500: '#3B82F6',
        600: '#2563EB',
        700: '#1D4ED8',
        800: '#1E40AF',
        900: '#1E3A8A',
      },
      accent: {
        DEFAULT: '#10B981',    // 强调绿
        light: '#34D399',      // 浅绿色
        dark: '#059669',       // 深绿色
      },
      warning: {
        DEFAULT: '#F59E0B',    // 警告黄
        light: '#FBBF24',
        dark: '#D97706',
      },
      info: {
        DEFAULT: '#6366F6',    // 信息灰
        light: '#94A3B8',
        dark: '#475569',
      },

      // 背景色
      background: {
        DEFAULT: '#FFFFFF',    // 白色背景
        secondary: '#F8FAFC',  // 浅灰背景
        muted: '#F1F5F9',      // 更深的浅灰
      },

      // 表面色
      surface: {
        DEFAULT: '#F8FAFC',    // 卡片背景
        hover: '#F1F5F9',      // 悬停状态
        active: '#E2E8F0',     // 激活状态
      },

      // 文字色
      text: {
        primary: {
          DEFAULT: '#0F172A',  // 深灰文字
          light: '#64748B',    // 浅灰文字
          muted: '#94A3B8',    // 更浅的灰
        },
        secondary: '#64748B',   // 次要文字
        tertiary: '#94A3B8',    // 三级文字
      },

      // 边框和分割线
      border: {
        DEFAULT: '#E2E8F0',    // 边框色
        light: '#F1F5F9',      // 浅色边框
        divider: '#F1F5F9',    // 分割线
      },

      // 保留原有颜色用于兼容
      bg: 'var(--color-bg)',
      muted: '#94A3B8',
      success: '#22C55E',
      danger: '#EF4444',

      // 深色模式专用（通过 dark: 前缀）
      dark: {
        background: '#0F172A',    // 深蓝黑背景
        surface: '#1E293B',       // 深灰蓝表面
        surfaceAlt: '#334155',    // 稍浅的深灰蓝
        text: {
          primary: '#F1F5F9',     // 浅灰白文字
          secondary: '#94A3B8',   // 中灰
          tertiary: '#64748B',    // 深灰
        },
        border: '#334155',        // 深色边框
        divider: '#1E293B',       // 深色分割线
      },
    },
    fontFamily: {
      sans: [
        '"SF Pro Display"',
        '"SF Pro Text"',
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'sans-serif',
      ],
      mono: ['"JetBrains Mono"', '"SF Mono"', 'monospace'],
    },
    spacing: {
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      6: '24px',
      8: '32px',
      12: '48px',
      18: '72px',
    },
    borderRadius: {
      glass: '24px',
      pill: '999px',
      '2xl': '1rem',
      '3xl': '1.75rem',
    },
    backdropBlur: {
      glass: '20px',
    },
    boxShadow: {
      glass: '0 20px 70px rgba(15, 23, 42, 0.25)',
      panel: '0 12px 32px rgba(15, 23, 42, 0.18)',
      'light-sm': '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
      'light': '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
      'light-md': '0 10px 15px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.06)',
    },
    fontSize: {
      h1: ['34px', { lineHeight: '40px', letterSpacing: '-0.01em' }],
      h2: ['28px', { lineHeight: '34px', letterSpacing: '-0.005em' }],
      h3: ['22px', { lineHeight: '28px' }],
      body: ['16px', { lineHeight: '24px' }],
      caption: ['13px', { lineHeight: '18px', letterSpacing: '0.01em' }],
      'prosody-mono': ['15px', { lineHeight: '24px', letterSpacing: '0.02em' }],
    },
  },
};

const preset: Config = {
  content: [],
  darkMode: 'class',
  theme: themeExtend,
  plugins: [],
};

export type SharedThemeTokens = typeof themeExtend;

export default preset;
