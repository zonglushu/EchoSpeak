import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Target, ChevronUp, ChevronDown } from 'lucide-react';

type PathType = 'browse' | 'bymode';

export function FloatingPathToggle() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const currentPath = (searchParams.get('path') as PathType) || 'browse';

  const handlePathChange = useCallback((path: PathType) => {
    setSearchParams({ path });
    setIsExpanded(false);
  }, [setSearchParams]);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Close expanded menu when path changes externally
  useEffect(() => {
    setIsExpanded(false);
  }, [currentPath]);

  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex flex-col-reverse items-center gap-2">
      {/* Main Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleExpand}
        className="
          px-6 py-3 rounded-full font-bold text-sm
          bg-gradient-to-r from-teal-500 to-emerald-500
          text-white shadow-2xl shadow-teal-500/30
          backdrop-blur-xl border-2 border-white/30
          flex items-center gap-2
          hover:shadow-teal-500/50 transition-shadow
          relative z-10
        "
        aria-label="切换路径模式"
        aria-expanded={isExpanded}
      >
        {currentPath === 'browse' ? (
          <>
            <BookOpen className="w-4 h-4" />
            <span>浏览视频</span>
          </>
        ) : (
          <>
            <Target className="w-4 h-4" />
            <span>选择模式</span>
          </>
        )}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </motion.div>
      </motion.button>

      {/* Expanded Options */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex gap-2"
          >
            {/* Browse Option */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePathChange('browse')}
              className={`
                px-6 py-3 rounded-2xl font-bold text-sm
                backdrop-blur-xl border-2 shadow-2xl
                flex items-center gap-2 transition-all
                ${
                  currentPath === 'browse'
                    ? 'bg-white/90 dark:bg-slate-800/90 border-teal-400 text-teal-700 dark:text-teal-400'
                    : 'bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-800/70'
                }
              `}
              aria-label="浏览视频模式"
              aria-pressed={currentPath === 'browse'}
            >
              <BookOpen className="w-4 h-4" />
              <span>浏览视频</span>
            </motion.button>

            {/* By Mode Option */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePathChange('bymode')}
              className={`
                px-6 py-3 rounded-2xl font-bold text-sm
                backdrop-blur-xl border-2 shadow-2xl
                flex items-center gap-2 transition-all
                ${
                  currentPath === 'bymode'
                    ? 'bg-white/90 dark:bg-slate-800/90 border-teal-400 text-teal-700 dark:text-teal-400'
                    : 'bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-800/70'
                }
              `}
              aria-label="选择模式"
              aria-pressed={currentPath === 'bymode'}
            >
              <Target className="w-4 h-4" />
              <span>选择模式</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
