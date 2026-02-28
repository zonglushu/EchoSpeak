/**
 * SettingsPanel - 设置面板组件
 *
 * 提供应用设置选项：
 * - 主题切换（浅色/深色/自动）
 * - 模式默认值设置
 * - 通知偏好
 * - 语言切换
 * - 字体大小调整
 *
 * 特性：
 * - 即时预览
 * - 分组管理
 * - 清晰的视觉层次
 *
 * @module components/ui/SettingsPanel
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon,
  Sun,
  Monitor,
  Bell,
  BellOff,
  Globe,
  Type,
  Info,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';

export interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

type Theme = 'light' | 'dark' | 'auto';
type NotificationLevel = 'all' | 'important' | 'none';
type Language = 'zh' | 'en';
type FontSize = 'sm' | 'md' | 'lg';

interface SettingSection {
  id: string;
  title: string;
  items: SettingItem[];
}

interface SettingItem {
  id: string;
  type: 'toggle' | 'select' | 'action';
  label: string;
  description?: string;
  icon?: React.ReactNode;
  value?: any;
  options?: { label: string; value: any }[];
  action?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  const [theme, setTheme] = useState<Theme>('auto');
  const [notifications, setNotifications] = useState<NotificationLevel>('important');
  const [language, setLanguage] = useState<Language>('zh');
  const [fontSize, setFontSize] = useState<FontSize>('md');

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Apply font size
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-sm', 'text-md', 'text-lg');
    root.classList.add(`text-${fontSize}`);
  }, [fontSize]);

  const sections: SettingSection[] = [
    {
      id: 'appearance',
      title: '外观',
      items: [
        {
          id: 'theme',
          type: 'select',
          label: '主题',
          description: '选择应用外观模式',
          icon: <Monitor className="w-5 h-5" />,
          value: theme,
          options: [
            { label: '浅色', value: 'light' as Theme },
            { label: '深色', value: 'dark' as Theme },
            { label: '跟随系统', value: 'auto' as Theme },
          ],
        },
        {
          id: 'fontSize',
          type: 'select',
          label: '字体大小',
          description: '调整文字大小',
          icon: <Type className="w-5 h-5" />,
          value: fontSize,
          options: [
            { label: '小', value: 'sm' as FontSize },
            { label: '中', value: 'md' as FontSize },
            { label: '大', value: 'lg' as FontSize },
          ],
        },
      ],
    },
    {
      id: 'notifications',
      title: '通知',
      items: [
        {
          id: 'notifications',
          type: 'select',
          label: '通知级别',
          description: '接收哪些通知',
          icon: <Bell className="w-5 h-5" />,
          value: notifications,
          options: [
            { label: '全部通知', value: 'all' as NotificationLevel },
            { label: '仅重要通知', value: 'important' as NotificationLevel },
            { label: '关闭通知', value: 'none' as NotificationLevel },
          ],
        },
      ],
    },
    {
      id: 'language',
      title: '语言和区域',
      items: [
        {
          id: 'language',
          type: 'select',
          label: '应用语言',
          description: '选择界面语言',
          icon: <Globe className="w-5 h-5" />,
          value: language,
          options: [
            { label: '简体中文', value: 'zh' as Language },
            { label: 'English', value: 'en' as Language },
          ],
        },
      ],
    },
    {
      id: 'about',
      title: '关于',
      items: [
        {
          id: 'version',
          type: 'action',
          label: '版本信息',
          description: 'v1.0.0',
          icon: <Info className="w-5 h-5" />,
          action: () => {
            alert('EchoSpeak Learner App v1.0.0');
          },
        },
      ],
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1100]"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, type: 'spring', damping: 25 }}
            className={`
              fixed top-0 right-0 h-full w-full max-w-md
              bg-white dark:bg-gray-800
              shadow-2xl z-[1200]
              flex flex-col
              ${className}
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-black text-gray-900 dark:text-white">设置</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {sections.map((section) => (
                <div key={section.id}>
                  <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                    {section.title}
                  </h3>

                  <div className="space-y-4">
                    {section.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        {/* Left: Icon + Label */}
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400">
                            {item.icon}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.label}
                            </p>
                            {item.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Control */}
                        <div className="flex-shrink-0">
                          {item.type === 'select' && (
                            <select
                              value={item.value}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (item.id === 'theme') setTheme(value as Theme);
                                if (item.id === 'notifications') setNotifications(value as NotificationLevel);
                                if (item.id === 'language') setLanguage(value as Language);
                                if (item.id === 'fontSize') setFontSize(value as FontSize);
                              }}
                              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            >
                              {item.options?.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          )}

                          {item.type === 'action' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={item.action}
                              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                            >
                              查看
                              <ChevronRight className="w-4 h-4" />
                            </motion.button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Info className="w-4 h-4" />
                <span>设置会自动保存</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * ThemeToggle - 主题切换快捷按钮
 */
export interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const [theme, setTheme] = React.useState<Theme>('auto');

  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);

    // Apply theme
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (nextTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      root.classList.add(nextTheme);
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={cycleTheme}
      className={`
        p-2 rounded-lg bg-gray-100 dark:bg-gray-700
        hover:bg-gray-200 dark:hover:bg-gray-600
        text-gray-600 dark:text-gray-400
        transition-colors
        ${className}
      `}
      title={`当前主题: ${theme === 'auto' ? '跟随系统' : theme === 'light' ? '浅色' : '深色'}`}
    >
      {getThemeIcon()}
    </motion.button>
  );
};

export default SettingsPanel;
