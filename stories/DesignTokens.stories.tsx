import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

const colorTokens = [
  { name: 'Background', token: '--color-bg', usage: '页面背景 / App Shell' },
  { name: 'Surface', token: '--color-surface', usage: '毛玻璃面板 / 卡片' },
  { name: 'Primary', token: '--color-primary', usage: 'CTA / 主要按钮' },
  { name: 'Accent', token: '--color-accent', usage: '进度 / 收藏 / 点缀' },
  { name: 'Muted', token: '--color-muted', usage: '次级文本 / 辅助信息' },
  { name: 'Success', token: '--color-success', usage: 'AI 处理成功 / 状态标签' },
  { name: 'Warning', token: '--color-warning', usage: '告警 / 上传提示' },
];

const typographySamples = [
  { label: 'Display / H1', size: '34px', lineHeight: '40px', sample: 'EchoSpeak — Master the Flow' },
  { label: 'Heading / H2', size: '28px', lineHeight: '34px', sample: 'AI Shadowing Playground' },
  { label: 'Heading / H3', size: '22px', lineHeight: '28px', sample: '练习清单 · Favorites' },
  { label: 'Body', size: '16px', lineHeight: '24px', sample: 'Upload a video or paste your bilingual script to get started.' },
  { label: 'Caption', size: '13px', lineHeight: '18px', sample: 'AI 生成中 · ETA 00:32' },
];

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{title}</h3>
    {children}
  </section>
);

const ColorGrid: React.FC = () => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '16px',
    }}
  >
    {colorTokens.map((color) => (
      <div
        key={color.token}
        style={{
          borderRadius: '24px',
          padding: '16px',
          border: '1px solid rgba(15,23,42,0.1)',
          background: 'var(--color-surface)',
          boxShadow: '0 20px 45px rgba(15,23,42,0.08)',
        }}
      >
        <div
          style={{
            height: '80px',
            borderRadius: '18px',
            background: `var(${color.token})`,
            border: '1px solid rgba(255,255,255,0.4)',
          }}
        />
        <h4 style={{ marginTop: '12px', marginBottom: '4px', fontWeight: 600 }}>{color.name}</h4>
        <code style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{color.token}</code>
        <p style={{ fontSize: '13px', marginTop: '6px', color: 'var(--color-muted)' }}>{color.usage}</p>
      </div>
    ))}
  </div>
);

const TypographyScale: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    {typographySamples.map((item) => (
      <div
        key={item.label}
        style={{
          borderRadius: '24px',
          padding: '16px 20px',
          border: '1px solid rgba(15,23,42,0.08)',
          background: 'var(--color-surface)',
        }}
      >
        <p style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
          {item.label} · {item.size}/{item.lineHeight}
        </p>
        <p
          style={{
            fontSize: item.size,
            lineHeight: item.lineHeight,
            margin: '4px 0 0',
            fontFamily: item.label.includes('Code') ? 'var(--font-mono)' : 'var(--font-sans)',
          }}
        >
          {item.sample}
        </p>
      </div>
    ))}
  </div>
);

const PlaceholderComponent: React.FC = () => null;

const meta: Meta<typeof PlaceholderComponent> = {
  title: 'Design System/Theme Tokens',
  component: PlaceholderComponent,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Colors: Story = {
  render: () => (
    <Section title="Color Palette">
      <ColorGrid />
    </Section>
  ),
};

export const Typography: Story = {
  render: () => (
    <Section title="Typography Scale">
      <TypographyScale />
    </Section>
  ),
};
