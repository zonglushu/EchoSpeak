import { MessageSquare, Film, Briefcase, Mic2, Newspaper, LucideIcon } from 'lucide-react';

/**
 * Video difficulty levels
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Recommended video item interface
 */
export interface RecommendedVideo {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  difficulty: DifficultyLevel;
  difficultyLabel: string;
  thumbnail: LucideIcon;
  duration: string;
  students: number;
}

/**
 * Category configuration
 */
export interface CategoryConfig {
  id: string;
  icon: LucideIcon;
  color: string;
}

/**
 * Category configuration for home page
 */
export const CATEGORY_CONFIG: CategoryConfig[] = [
  { id: 'daily', icon: MessageSquare, color: 'from-teal-400 to-emerald-500' },
  { id: 'movies', icon: Film, color: 'from-cyan-400 to-blue-500' },
  { id: 'business', icon: Briefcase, color: 'from-teal-500 to-teal-700' },
  { id: 'ted', icon: Mic2, color: 'from-orange-400 to-amber-500' },
];

/**
 * Recommended videos mock data
 */
export const RECOMMENDED_VIDEOS: RecommendedVideo[] = [
  {
    id: '1',
    title: 'News Report - Weather',
    category: 'news',
    categoryLabel: '新闻',
    difficulty: 'beginner',
    difficultyLabel: '初级',
    thumbnail: Newspaper,
    duration: '3:15',
    students: 1800,
  },
  {
    id: '2',
    title: 'Movie Scene - Friends',
    category: 'movies',
    categoryLabel: '影视',
    difficulty: 'intermediate',
    difficultyLabel: '中级',
    thumbnail: Film,
    duration: '5:42',
    students: 2300,
  },
  {
    id: '3',
    title: 'Business Meeting',
    category: 'business',
    categoryLabel: '商务',
    difficulty: 'advanced',
    difficultyLabel: '高级',
    thumbnail: Briefcase,
    duration: '8:20',
    students: 980,
  },
  {
    id: '4',
    title: 'TED Talk: Communication',
    category: 'ted',
    categoryLabel: 'TED',
    difficulty: 'advanced',
    difficultyLabel: '高级',
    thumbnail: Mic2,
    duration: '12:35',
    students: 3200,
  },
];

/**
 * Daily goal interface
 */
export interface DailyGoal {
  id: string;
  title: string;
  completed: boolean;
}

/**
 * Default daily goals
 */
export const DEFAULT_DAILY_GOALS: DailyGoal[] = [
  { id: '1', title: '完成一个视频', completed: false },
  { id: '2', title: '练习 20 个句子', completed: false },
  { id: '3', title: '学习 30 分钟', completed: false },
  { id: '4', title: '复习昨天的内容', completed: false },
];

/**
 * Color schemes for recommended video cards (by index)
 */
export const VIDEO_CARD_BG_COLORS = [
  'bg-purple-50 dark:bg-purple-900/10',
  'bg-blue-50 dark:bg-blue-900/10',
  'bg-green-50 dark:bg-green-900/10',
  'bg-orange-50 dark:bg-orange-900/10',
];

/**
 * Icon color schemes for recommended video cards (by index)
 */
export const VIDEO_CARD_ICON_COLORS = [
  'text-purple-400',
  'text-blue-400',
  'text-green-400',
  'text-orange-400',
];
