/**
 * Mode Anchor Navigation
 *
 * Provides quick anchor links to jump to specific mode sections on the homepage
 */

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';

interface ModeAnchorNavProps {
  onAnchorClick?: (mode: 'flow' | 'battle' | 'think') => void;
}

interface AnchorButton {
  id: 'flow' | 'battle' | 'think';
  emoji: string;
  label: string;
  color: string;
  bgColor: string;
}

const ANCHORS: AnchorButton[] = [
  {
    id: 'flow',
    emoji: '🌊',
    label: 'Flow',
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'battle',
    emoji: '⚔️',
    label: 'Battle',
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
  },
  {
    id: 'think',
    emoji: '💡',
    label: 'Think',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
  },
];

export function ModeAnchorNav({ onAnchorClick }: ModeAnchorNavProps): React.JSX.Element {
  const handleAnchorClick = useCallback(
    (mode: 'flow' | 'battle' | 'think') => {
      // Find the section element
      const sectionId = `mode-section-${mode}`;
      const element = document.getElementById(sectionId);

      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      onAnchorClick?.(mode);
    },
    [onAnchorClick]
  );

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-40 mb-6 px-1"
    >
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-2xl p-2 shadow-sm">
        <div className="flex gap-2">
          {ANCHORS.map((anchor) => (
            <motion.button
              key={anchor.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAnchorClick(anchor.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 ${anchor.bgColor} ${anchor.color} font-bold text-sm transition-all hover:shadow-md`}
            >
              <span className="text-lg">{anchor.emoji}</span>
              <span>{anchor.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.nav>
  );
}
