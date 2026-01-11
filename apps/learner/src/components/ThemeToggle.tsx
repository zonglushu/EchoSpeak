import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 rounded-xl
        bg-surface border border-border
        hover:bg-surface-hover
        transition-all duration-200
        touch-friendly
        dark:bg-dark-surface dark:border-dark-border dark:hover:bg-dark-surface-hover
        ${className}
      `}
      title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-text-secondary dark:text-dark-text-secondary" />
      ) : (
        <Sun className="w-5 h-5 text-text-secondary dark:text-dark-text-secondary" />
      )}
    </button>
  );
};

export default ThemeToggle;
