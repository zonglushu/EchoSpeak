/**
 * Mode Theme Updater
 * 根据当前模式更新 CSS 变量，无需 React Context
 */

import { MODE_COLORS } from '../constants/modeColors';
import type { ModeType } from '../constants/modeColors';

/**
 * 更新模式主题色 CSS 变量
 * @param mode - 'flow' | 'battle' | 'think' | null
 */
export function updateModeTheme(mode: ModeType): void {
  const colorMap = {
    flow: { from: '#14b8a6', to: '#10b981' },    // teal-500, emerald-500
    battle: { from: '#f43f5e', to: '#ef4444' },  // rose-500, red-500
    think: { from: '#6366f1', to: '#a855f7' },   // indigo-500, purple-500
  };

  // 默认使用 flow 颜色（当 mode 为 null 时）
  const colors = colorMap[mode || 'flow'];
  const config = MODE_COLORS[mode || 'flow'];

  const root = document.documentElement;
  root.style.setProperty('--mode-gradient-from', colors.from);
  root.style.setProperty('--mode-gradient-to', colors.to);
  root.style.setProperty('--mode-rgb', `${config.rgb[0]}, ${config.rgb[1]}, ${config.rgb[2]}`);
}

/**
 * 根据路径推断当前模式
 * @param pathname - 路由路径
 * @returns 推断的模式类型
 */
export function inferModeFromPath(pathname: string): ModeType {
  if (pathname.startsWith('/mode/flow')) return 'flow';
  if (pathname.startsWith('/mode/battle') || pathname.startsWith('/battle/')) return 'battle';
  if (pathname.startsWith('/mode/think')) return 'think';
  return null;
}
