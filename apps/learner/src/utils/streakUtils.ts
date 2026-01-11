/**
 * 每日打卡系统工具函数
 * Daily Streak System Utilities
 */

export interface StreakData {
  currentStreak: number;      // 当前连续天数
  longestStreak: number;      // 最长连续天数
  lastPracticeDate: string;   // 上次练习日期 (YYYY-MM-DD)
  practiceHistory: Record<string, number>; // 练习历史 { date: minutes }
  streakFreezeCount: number;  // Streak Freeze卡片数量
}

const STORAGE_KEY = 'echospeak_streak_data';

/**
 * 获取streak数据
 */
export const getStreakData = (): StreakData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[Streak] Failed to load streak data:', error);
  }

  // 返回默认值
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastPracticeDate: '',
    practiceHistory: {},
    streakFreezeCount: 1, // 默认送1张保护卡
  };
};

/**
 * 保存streak数据
 */
export const saveStreakData = (data: StreakData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[Streak] Failed to save streak data:', error);
  }
};

/**
 * 记录今天的练习
 * @param minutes 练习时长（分钟）
 * @returns 是否成功打卡
 */
export const recordPractice = (minutes: number): boolean => {
  const data = getStreakData();
  const today = getTodayDateString();

  // 如果今天已经练习过，只更新时长
  if (data.lastPracticeDate === today) {
    data.practiceHistory[today] = (data.practiceHistory[today] || 0) + minutes;
    saveStreakData(data);
    return false; // 不是首次打卡
  }

  // 计算连续天数
  const yesterday = getYesterdayDateString();
  const isConsecutive = data.lastPracticeDate === yesterday;

  if (isConsecutive) {
    // 连续练习，增加天数
    data.currentStreak += 1;
  } else if (data.lastPracticeDate !== today) {
    // 检查是否使用了Streak Freeze
    if (data.streakFreezeCount > 0 && shouldUseStreakFreeze(data.lastPracticeDate)) {
      data.streakFreezeCount -= 1;
      data.currentStreak += 1; // 保持连续
    } else {
      // 断签了，重置
      data.currentStreak = 1;
    }
  }

  // 更新最长记录
  if (data.currentStreak > data.longestStreak) {
    data.longestStreak = data.currentStreak;
  }

  // 记录今天的练习
  data.practiceHistory[today] = minutes;
  data.lastPracticeDate = today;

  saveStreakData(data);
  return true; // 首次打卡成功
};

/**
 * 检查是否应该使用Streak Freeze
 * 规则：如果上次练习是2-3天前，可以使用freeze保护
 */
export const shouldUseStreakFreeze = (lastPracticeDate: string): boolean => {
  if (!lastPracticeDate) return false;

  const last = new Date(lastPracticeDate);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  return diffDays >= 2 && diffDays <= 3;
};

/**
 * 检查今天是否已经打卡
 */
export const hasPracticedToday = (): boolean => {
  const data = getStreakData();
  return data.lastPracticeDate === getTodayDateString();
};

/**
 * 获取今天的日期字符串 (YYYY-MM-DD)
 */
export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 获取昨天的日期字符串 (YYYY-MM-DD)
 */
export const getYesterdayDateString = (): string => {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 获取最近N天的练习记录
 * @param days 天数
 */
export const getRecentPracticeHistory = (days: number): Array<{ date: string; minutes: number }> => {
  const data = getStreakData();
  const result: Array<{ date: string; minutes: number }> = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = formatDateToString(date);
    result.push({
      date: dateStr,
      minutes: data.practiceHistory[dateStr] || 0,
    });
  }

  return result.reverse();
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
 * 获取本周练习总时长（分钟）
 */
export const getThisWeekPracticeMinutes = (): number => {
  const data = getStreakData();
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = 周日
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  let totalMinutes = 0;
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateStr = formatDateToString(date);
    totalMinutes += data.practiceHistory[dateStr] || 0;
  }

  return totalMinutes;
};

/**
 * 检查是否濒临断签（2-3天没练习）
 */
export const isStreakAtRisk = (): boolean => {
  const data = getStreakData();
  if (data.currentStreak === 0) return false;
  if (!data.lastPracticeDate) return false;

  const last = new Date(data.lastPracticeDate);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  // 如果昨天没练习，今天必须练，否则断签
  return diffDays >= 1 && diffDays <= 2;
};

/**
 * 使用Streak Freeze卡片
 */
export const useStreakFreeze = (): boolean => {
  const data = getStreakData();
  if (data.streakFreezeCount > 0) {
    // 标记使用了freeze（实际在recordPractice时生效）
    localStorage.setItem('echospeak_streak_freeze_pending', 'true');
    return true;
  }
  return false;
};

/**
 * 获取练习日历数据（用于热力图）
 * @param months 获取最近几个月的数据
 */
export const getPracticeCalendar = (months: number = 3): Array<{ date: string; minutes: number }> => {
  const data = getStreakData();
  const result: Array<{ date: string; minutes: number }> = [];
  const now = new Date();

  for (let i = 0; i < months * 30; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateStr = formatDateToString(date);
    result.push({
      date: dateStr,
      minutes: data.practiceHistory[dateStr] || 0,
    });
  }

  return result.reverse();
};
