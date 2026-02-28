/**
 * Mode Theme Color Configuration
 * 定义三种学习模式的专属颜色配置
 */

export type ModeType = 'flow' | 'battle' | 'think' | 'null';

export interface ModeColorConfig {
  // 主要渐变色（用于按钮、图标）
  gradientFrom: string;
  gradientTo: string;

  // RGB 值（用于计算带透明度的颜色）
  rgb: [number, number, number];
}

export const MODE_COLORS: Record<'flow' | 'battle' | 'think', ModeColorConfig> = {
  flow: {
    gradientFrom: 'from-teal-500',
    gradientTo: 'to-emerald-500',
    rgb: [20, 184, 166], // teal-500
  },

  battle: {
    gradientFrom: 'from-rose-500',
    gradientTo: 'to-red-500',
    rgb: [244, 63, 94], // rose-500
  },

  think: {
    gradientFrom: 'from-indigo-500',
    gradientTo: 'to-purple-500',
    rgb: [99, 102, 241], // indigo-500
  },
};
