import React from 'react';
import { Flame, ChevronLeft, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthProvider';
import { UserStats } from '@echospeak/types';
import { getGreeting } from '../utils/homeHelpers';

type DisplayMode = 'full' | 'compact' | 'minimal';

interface GlobalHeaderProps {
  mode: DisplayMode;
  userStats: UserStats | null;
  showBackButton?: boolean;
  onBackClick?: () => void;
  modeTitle?: string;  // 模式页面显示的标题
  modeDescription?: string;  // 模式页面显示的描述
  modeEmoji?: string;  // 模式页面显示的 Emoji
  showNotification?: boolean;  // 是否显示通知按钮
  showStreak?: boolean;  // 是否显示连续学习天数（默认 true）
  showAvatar?: boolean;  // 是否显示用户头像（默认 true）
  rightActions?: React.ReactNode;  // 右侧自定义操作区域
  leftContent?: React.ReactNode;  // 左侧自定义内容区域
  className?: string;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  mode,
  userStats,
  showBackButton = false,
  onBackClick,
  modeTitle,
  modeDescription,
  modeEmoji,
  showNotification = true,
  showStreak = true,
  showAvatar = true,
  rightActions = null,
  leftContent = null,
  className = '',
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const userTier = user?.user_metadata?.tier || 'free';
  const userInitial = (user?.email?.split('@')[0] || 'U')[0].toUpperCase();
  const streak = userStats?.current_streak || 0;

  // 首页完整版
  if (mode === 'full') {
    return (
      <header className={`
        sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80
        backdrop-blur-2xl border-b border-gray-200
        dark:border-gray-800 px-6 py-4
        ${className}
      `}>
        <div className="flex items-center justify-between">
          {/* 左侧：品牌 + 问候 */}
          {leftContent || (
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-gray-950 dark:text-white tracking-tight leading-none mb-1">
                EchoSpeak
              </h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {getGreeting(t)}, {t(`tier.${userTier}`)}
              </p>
            </div>
          )}

          {/* 右侧：Streak + 通知 + 头像 */}
          <div className="flex items-center gap-3">
            {/* Streak Counter */}
            {showStreak && (
              <div className="flex items-center gap-1.5 px-3 py-1.5
                bg-orange-50 dark:bg-orange-900/20
                border border-orange-100 dark:border-orange-800/30
                rounded-full">
                <Flame className="w-4 h-4 text-orange-600
                  shadow-[0_0_8px_rgba(234,88,12,0.3)]" />
                <span className="text-sm font-black text-orange-700
                  dark:text-orange-400">
                  {streak}
                </span>
              </div>
            )}

            {/* Notification Button */}
            {showNotification && (
              <button className="p-2.5 bg-white dark:bg-gray-900
                border border-gray-100 dark:border-gray-800
                rounded-full shadow-sm text-gray-500
                hover:text-teal-600 transition-colors"
                aria-label="通知">
                <Bell className="w-5 h-5" />
              </button>
            )}

            {/* 自定义右侧操作区域 */}
            {rightActions}

            {/* User Avatar */}
            {showAvatar && (
              <button
                onClick={() => navigate('/profile')}
                className="w-10 h-10 bg-indigo-500 rounded-full
                  flex items-center justify-center text-white
                  font-black text-sm shadow-lg hover:ring-4
                  ring-indigo-500/10 transition-all"
                aria-label="个人中心">
                {userInitial}
              </button>
            )}
          </div>
        </div>
      </header>
    );
  }

  // 模式页面紧凑版
  if (mode === 'compact') {
    return (
      <header className={`
        sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80
        backdrop-blur-2xl border-b border-gray-200
        dark:border-gray-800 px-4 py-3
        ${className}
      `}>
        <div className="flex items-center gap-3">
          {/* 返回按钮 */}
          {showBackButton && (
            <button
              onClick={onBackClick}
              className="p-2 -ml-2 rounded-xl hover:bg-gray-100
                dark:hover:bg-gray-800 transition-all"
              aria-label="返回">
              <ChevronLeft className="w-5 h-5 text-gray-600
                dark:text-gray-400" />
            </button>
          )}

          {/* 左侧自定义内容或模式标题 */}
          {leftContent || (
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {modeEmoji && (
                  <span className="text-2xl">{modeEmoji}</span>
                )}
                <h1 className="text-lg font-black text-gray-900
                  dark:text-white">
                  {modeTitle}
                </h1>
              </div>
              {modeDescription && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {modeDescription}
                </p>
              )}
            </div>
          )}

          {/* Streak（紧凑） */}
          {showStreak && (
            <div className="flex items-center gap-1.5 px-2 py-1
              bg-orange-50 dark:bg-orange-900/20
              border border-orange-100 dark:border-orange-800/30
              rounded-full">
              <Flame className="w-3 h-3 text-orange-600" />
              <span className="text-xs font-black text-orange-700
                dark:text-orange-400">
                {streak}
              </span>
            </div>
          )}

          {/* 自定义右侧操作或用户头像 */}
          {rightActions || (
            showAvatar && (
              <button
                onClick={() => navigate('/profile')}
                className="w-8 h-8 bg-indigo-500 rounded-full
                  flex items-center justify-center text-white
                  font-black text-xs shadow-lg hover:ring-2
                  ring-indigo-500/10 transition-all"
                aria-label="个人中心">
                {userInitial}
              </button>
            )
          )}
        </div>
      </header>
    );
  }

  // 超紧凑版（可选，用于滚动时收起）
  if (mode === 'minimal') {
    return (
      <header className={`
        sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90
        backdrop-blur-2xl border-b border-gray-200
        dark:border-gray-800 px-3 py-2
        ${className}
      `}>
        <div className="flex items-center gap-2">
          {/* 返回按钮 */}
          {showBackButton && (
            <button
              onClick={onBackClick}
              className="p-1 rounded hover:bg-gray-100
                dark:hover:bg-gray-800 transition-all"
              aria-label="返回">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
          )}

          {/* 左侧自定义内容或模式名（缩写） */}
          {leftContent || (
            <span className="text-sm font-black text-gray-900">
              {modeTitle?.split(' ')[0]}
            </span>
          )}

          <div className="flex-1" />

          {/* Streak（仅数字） */}
          {showStreak && (
            <span className="text-xs font-black text-orange-600">
              🔥{streak}
            </span>
          )}

          {/* 自定义右侧操作或用户首字母 */}
          {rightActions || (
            showAvatar && (
              <button
                onClick={() => navigate('/profile')}
                className="w-6 h-6 bg-indigo-500 rounded-full
                  flex items-center justify-center text-white
                  font-black text-xs"
                aria-label="个人中心">
                {userInitial}
              </button>
            )
          )}
        </div>
      </header>
    );
  }

  return null;
};

export default GlobalHeader;
