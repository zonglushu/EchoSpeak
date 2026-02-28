import React from 'react';
import { Home, Waves, Swords, Lightbulb, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export type TabType = 'home' | 'flow' | 'battle' | 'think' | 'profile';

interface MobileBottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  className?: string;
}

// Tab configuration with mode-specific styling
interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  type: 'functional' | 'mode';
  size: 'small' | 'large';
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  className = '',
}) => {
  const { t } = useTranslation();

  const tabs: TabConfig[] = [
    {
      id: 'home',
      label: t('nav.home') || '首页',
      icon: Home,
      type: 'functional',
      size: 'small'
    },
    {
      id: 'flow',
      label: 'Flow',
      icon: Waves,
      type: 'mode',
      size: 'large',
    },
    {
      id: 'battle',
      label: 'Battle',
      icon: Swords,
      type: 'mode',
      size: 'large',
    },
    {
      id: 'think',
      label: 'Think',
      icon: Lightbulb,
      type: 'mode',
      size: 'large',
    },
    {
      id: 'profile',
      label: t('nav.profile') || '我的',
      icon: User,
      type: 'functional',
      size: 'small'
    },
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
        backdrop-blur-xl
        rounded-[1.5rem]
        px-2 py-3
        relative
        overflow-hidden
        transition-all duration-500
        bg-gradient-to-br
        from-[rgba(var(--mode-rgb),0.15)]
        to-[rgba(var(--mode-rgb),0.08)]
        dark:from-[rgba(var(--mode-rgb),0.25)]
        dark:to-[rgba(var(--mode-rgb),0.15)]
        border
        border-[rgba(var(--mode-rgb),0.3)]
        dark:border-[rgba(var(--mode-rgb),0.4)]
        shadow-2xl
        shadow-[rgba(var(--mode-rgb),0.25)]
        dark:shadow-[rgba(var(--mode-rgb),0.4)]
      ">
        {/* Ambient Glow Effect */}
        <div className="
          absolute inset-0 bg-gradient-to-br
          from-[var(--mode-gradient-from)]/10
          to-[var(--mode-gradient-to)]/10
          pointer-events-none
          transition-all duration-500
        " />

        <div className="flex items-center justify-around gap-1 relative z-10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={false}
                animate={{
                  scale: isActive ? 1.05 : 1,
                  boxShadow: isActive
                    ? `0 10px 40px rgba(var(--mode-rgb),0.4)`
                    : '0 0 0 transparent',
                }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 25,
                }}
                className={`
                  relative flex flex-col items-center justify-center
                  ${tab.size === 'large' ? 'w-16 h-16' : 'w-14 h-14'}
                  rounded-2xl
                  transition-all duration-300
                  ${isActive
                    ? 'bg-gradient-to-br from-[var(--mode-gradient-from)] to-[var(--mode-gradient-to)] text-white shadow-lg shadow-[rgba(var(--mode-rgb),0.3)]'
                    : 'bg-[rgba(var(--mode-rgb),0.1)] dark:bg-[rgba(var(--mode-rgb),0.2)] text-[rgb(var(--mode-rgb))] hover:bg-[rgba(var(--mode-rgb),0.2)] dark:hover:bg-[rgba(var(--mode-rgb),0.3)]'
                  }
                `}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`${tab.size === 'large' ? 'w-7 h-7' : 'w-6 h-6'}`} strokeWidth={2.5} />
                <span className="text-[10px] font-bold mt-0.5">{tab.label}</span>

                {/* Inner Shine Effect - Glass texture */}
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
