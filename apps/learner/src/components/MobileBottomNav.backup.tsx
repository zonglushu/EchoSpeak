/**
 * MobileBottomNav - 方案3: Minimal Line Indicator (备份方案)
 *
 * 特点：
 * - 极简设计
 * - 细线指示器
 * - 无浮动，贴底
 * - 性能最优
 */

import React from 'react';
import { Home, BookOpen, Mic, Heart, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export type TabType = 'home' | 'learn' | 'practice' | 'favorites' | 'profile';

interface MobileBottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  className?: string;
}

export const MobileBottomNavMinimal: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  className = '',
}) => {
  const { t } = useTranslation();

  const tabs = [
    { id: 'home' as TabType, label: t('nav.home'), icon: Home },
    { id: 'learn' as TabType, label: t('nav.learn'), icon: BookOpen },
    { id: 'practice' as TabType, label: t('nav.practice'), icon: Mic },
    { id: 'favorites' as TabType, label: t('nav.favorites'), icon: Heart },
    { id: 'profile' as TabType, label: t('nav.profile'), icon: User },
  ];

  return (
    <nav
      className={`
        lg:hidden
        fixed bottom-0 left-0 right-0 z-50
        bg-white/95 dark:bg-gray-950/95
        backdrop-blur-xl
        border-t border-gray-100 dark:border-gray-800
        pb-safe
        ${className}
      `}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex-1 flex flex-col items-center justify-center
                h-full transition-all duration-200
                ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400'}
              `}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Icon */}
              <Icon
                className="w-6 h-6 mb-1 transition-transform duration-200"
                strokeWidth={isActive ? 2.5 : 2}
              />

              {/* Active Indicator - Line */}
              {isActive && (
                <motion.div
                  layoutId="activeLine"
                  className="absolute bottom-0 w-12 h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
