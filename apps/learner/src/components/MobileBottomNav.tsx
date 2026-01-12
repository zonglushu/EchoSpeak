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

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
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
        bg-white/95 backdrop-blur-3xl
        border-t border-gray-100/50
        pb-safe
        dark:bg-gray-950/95 dark:border-gray-800/50
        ${className}
      `}
    >
      <div className="flex items-center justify-around h-16 px-4 relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isPractice = tab.id === 'practice';

          if (isPractice) {
            return (
              <div key={tab.id} className="relative -top-5 flex flex-col items-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    w-14 h-14 rounded-full
                    bg-gradient-to-br from-teal-400 to-cyan-600
                    flex items-center justify-center
                    shadow-[0_8px_20px_-4px_rgba(20,184,166,0.4)]
                    border-4 border-white dark:border-gray-950
                    relative z-20
                  `}
                >
                  <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                </motion.button>
                <span className={`
                  text-[10px] font-black mt-2 tracking-widest uppercase
                  transition-colors duration-200
                  ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500'}
                `}>
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-1 w-1.5 h-1.5 bg-teal-600 dark:bg-teal-400 rounded-full"
                  />
                )}
              </div>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center justify-center
                flex-1 h-full
                transition-all duration-200
                relative
                ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400'}
              `}
            >
              <div
                className={`
                  relative flex items-center justify-center
                  transition-all duration-200
                  ${isActive ? 'scale-110 -translate-y-1' : 'scale-100 translate-y-0'}
                `}
              >
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={`
                  text-[10px] font-black mt-1.5 tracking-tighter uppercase
                  transition-all duration-200
                  ${isActive ? 'opacity-100' : 'opacity-60'}
                `}
              >
                {tab.label}
              </span>
              {isActive && !isPractice && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute bottom-2 w-1.5 h-1.5 bg-teal-600 dark:bg-teal-400 rounded-full"
                />
              )}
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
