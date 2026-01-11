/**
 * 待练清单工具函数
 * Watch Later List Utilities
 */

export interface WatchLaterItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  categoryName: string;
  difficulty: string;
  difficultyLabel: string;
  duration: string;
  sentences: number;
  thumbnail: string;
  addedAt: string; // ISO timestamp
}

const STORAGE_KEY = 'echospeak_watch_later';
const MAX_ITEMS = 50; // 最多保存50个

/**
 * 获取待练清单
 */
export const getWatchLaterList = (): WatchLaterItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[WatchLater] Failed to load list:', error);
  }
  return [];
};

/**
 * 保存待练清单
 */
export const saveWatchLaterList = (list: WatchLaterItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    console.error('[WatchLater] Failed to save list:', error);
  }
};

/**
 * 添加到待练清单
 */
export const addToWatchLater = (item: Omit<WatchLaterItem, 'addedAt'>): boolean => {
  const list = getWatchLaterList();

  // 检查是否已存在
  if (list.some((i) => i.id === item.id)) {
    return false; // 已存在
  }

  // 检查数量限制
  if (list.length >= MAX_ITEMS) {
    // 移除最早添加的
    list.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
    list.shift();
  }

  // 添加新项
  const newItem: WatchLaterItem = {
    ...item,
    addedAt: new Date().toISOString(),
  };

  list.unshift(newItem); // 添加到开头
  saveWatchLaterList(list);
  return true;
};

/**
 * 从待练清单移除
 */
export const removeFromWatchLater = (id: string): void => {
  const list = getWatchLaterList();
  const filtered = list.filter((item) => item.id !== id);
  saveWatchLaterList(filtered);
};

/**
 * 检查是否在待练清单中
 */
export const isInWatchLater = (id: string): boolean => {
  const list = getWatchLaterList();
  return list.some((item) => item.id === id);
};

/**
 * 切换待练状态
 */
export const toggleWatchLater = (item: Omit<WatchLaterItem, 'addedAt'>): boolean => {
  if (isInWatchLater(item.id)) {
    removeFromWatchLater(item.id);
    return false; // 已移除
  } else {
    addToWatchLater(item);
    return true; // 已添加
  }
};

/**
 * 清空待练清单
 */
export const clearWatchLater = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * 获取待练清单数量
 */
export const getWatchLaterCount = (): number => {
  return getWatchLaterList().length;
};
