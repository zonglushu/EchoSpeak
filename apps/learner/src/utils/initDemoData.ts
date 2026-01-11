/**
 * 初始化假数据 - 用于演示和测试
 * Initialize Demo Data
 */

import { StreakData } from './streakUtils';
import { WatchLaterItem } from './watchLaterUtils';

/**
 * 初始化Streak假数据
 * 模拟用户已经连续学习了7天
 */
export const initDemoStreakData = (): void => {
  const STORAGE_KEY = 'echospeak_streak_data';

  // 检查是否已有数据
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    const data = JSON.parse(existing);
    if (data.currentStreak > 0) {
      console.log('[Demo] 已有真实streak数据，跳过初始化');
      return;
    }
  }

  const now = new Date();
  const practiceHistory: Record<string, number> = {};

  // 生成过去7天的练习记录
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateStr = formatDateToString(date);

    // 随机练习时长 10-40分钟
    const minutes = Math.floor(Math.random() * 30) + 10;
    practiceHistory[dateStr] = minutes;
  }

  const demoData: StreakData = {
    currentStreak: 7,
    longestStreak: 7,
    lastPracticeDate: formatDateToString(now),
    practiceHistory,
    streakFreezeCount: 2,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(demoData));
  console.log('[Demo] 已初始化streak假数据：连续学习7天');
};

/**
 * 格式化日期为字符串
 */
export const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 初始化待练清单假数据
 */
export const initDemoWatchLaterData = (): void => {
  const STORAGE_KEY = 'echospeak_watch_later';

  // 检查是否已有数据
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    const list = JSON.parse(existing);
    if (list.length > 0) {
      console.log('[Demo] 已有待练清单数据，跳过初始化');
      return;
    }
  }

  const demoItems: WatchLaterItem[] = [
    {
      id: 'demo-1',
      title: 'Job Interview Self Introduction',
      subtitle: '面试自我介绍',
      category: 'business',
      categoryName: '商务',
      difficulty: 'advanced',
      difficultyLabel: '🌳 高级',
      duration: '8:24',
      sentences: 18,
      thumbnail: '💼',
      addedAt: new Date().toISOString(),
    },
    {
      id: 'demo-2',
      title: 'Ordering at a Restaurant',
      subtitle: '餐厅点餐',
      category: 'daily',
      categoryName: '日常对话',
      difficulty: 'beginner',
      difficultyLabel: '🌱 初级',
      duration: '4:15',
      sentences: 10,
      thumbnail: '🍽️',
      addedAt: new Date(Date.now() - 3600000).toISOString(), // 1小时前
    },
    {
      id: 'demo-3',
      title: 'TED Talk: The Power of Yet',
      subtitle: '成长型思维',
      category: 'ted',
      categoryName: 'TED',
      difficulty: 'intermediate',
      difficultyLabel: '🌿 中级',
      duration: '12:30',
      sentences: 25,
      thumbnail: '🎤',
      addedAt: new Date(Date.now() - 7200000).toISOString(), // 2小时前
    },
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(demoItems));
  console.log('[Demo] 已初始化待练清单假数据：3个视频');
};

/**
 * 一键初始化所有假数据
 */
export const initAllDemoData = (): void => {
  console.log('[Demo] 开始初始化所有假数据...');
  initDemoStreakData();
  initDemoWatchLaterData();
  console.log('[Demo] 假数据初始化完成！');
  console.log('[Demo] 刷新页面即可查看效果');
};

/**
 * 清除所有假数据
 */
export const clearAllDemoData = (): void => {
  localStorage.removeItem('echospeak_streak_data');
  localStorage.removeItem('echospeak_watch_later');
  console.log('[Demo] 已清除所有假数据');
};

/**
 * 在浏览器控制台使用：
 * initAllDemoData() - 初始化假数据
 * clearAllDemoData() - 清除假数据
 */

// 暴露到window对象以便在控制台调用
if (typeof window !== 'undefined') {
  (window as any).initAllDemoData = initAllDemoData;
  (window as any).clearAllDemoData = clearAllDemoData;
}
