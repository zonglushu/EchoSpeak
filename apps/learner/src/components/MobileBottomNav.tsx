import React, { useState } from 'react';
import { Home, BookOpen, Mic, Heart, User } from 'lucide-react';

export type TabType = 'home' | 'learn' | 'practice' | 'favorites' | 'profile';

interface MobileBottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  className?: string;
}

const tabs = [
  { id: 'home' as TabType, label: '首页', icon: Home },
  { id: 'learn' as TabType, label: '学习', icon: BookOpen },
  { id: 'practice' as TabType, label: '练习', icon: Mic },
  { id: 'favorites' as TabType, label: '收藏', icon: Heart },
  { id: 'profile' as TabType, label: '我的', icon: User },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  className = '',
}) => {
  return (
    <nav
      className={`
        lg:hidden
        fixed bottom-0 left-0 right-0 z-50
        bg-background/95 backdrop-blur-2xl
        border-t border-border
        pb-safe
        dark:bg-dark-background/95 dark:border-dark-border
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
                flex flex-col items-center justify-center
                min-w-[64px] h-full
                transition-all duration-200
                touch-manipulation
                ${isActive ? 'text-primary dark:text-primary-light' : 'text-text-secondary hover:text-text-tertiary dark:text-dark-text-secondary dark:hover:text-dark-text-tertiary'}
              `}
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <div
                className={`
                  relative flex items-center justify-center
                  transition-all duration-200
                  ${isActive ? 'scale-110' : 'scale-100'}
                `}
              >
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <span className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full dark:bg-primary-light" />
                )}
              </div>
              <span
                className={`
                  text-[10px] font-bold mt-1 tracking-wide
                  transition-opacity duration-200
                  ${isActive ? 'opacity-100' : 'opacity-70'}
                `}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Safe area for iPhone notch */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
};

export default MobileBottomNav;
