import React from 'react';
import { Home, BookOpen, Mic, Heart, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
        fixed bottom-6 left-4 right-4 z-50
        ${className}
      `}
    >
      {/* Glassmorphism Floating Dock */}
      <div className="
        max-w-md mx-auto
        bg-white/90 dark:bg-gray-900/90
        backdrop-blur-xl
        border border-white/30 dark:border-gray-700/50
        rounded-[1.5rem]
        shadow-2xl shadow-gray-900/10 dark:shadow-black/30
        px-2.5 py-3
        relative
        overflow-hidden
      ">
        {/* Ambient Glow Effect */}
        <div className="
          absolute inset-0 bg-gradient-to-br from-teal-500/5 to-emerald-500/5
          pointer-events-none
        " />

        <div className="flex items-center justify-around gap-1 relative z-10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex flex-col items-center justify-center
                  w-14 h-14 rounded-2xl
                  transition-all duration-300
                  group
                  ${isActive
                    ? 'bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/30'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50'
                  }
                `}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Icon */}
                <Icon
                  className="w-6 h-6 transition-transform duration-300 group-hover:scale-110"
                  strokeWidth={2.5}
                />

                {/* Active Glow Effect */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl opacity-20 blur-xl"
                    />
                  )}
                </AnimatePresence>

                {/* Inner Shine Effect */}
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
