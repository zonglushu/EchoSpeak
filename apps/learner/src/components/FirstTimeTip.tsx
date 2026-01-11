import React, { useState, useEffect } from 'react';
import { X, Lightbulb, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FIRST_TIME_TIP_KEY = 'echospeak_first_time_tip_shown';

interface FirstTimeTipProps {
  onDismiss?: () => void;
}

export const FirstTimeTip: React.FC<FirstTimeTipProps> = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 检查是否已经显示过
    const hasShown = localStorage.getItem(FIRST_TIME_TIP_KEY);
    if (!hasShown) {
      // 延迟1秒显示，让用户先看到页面内容
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(FIRST_TIME_TIP_KEY, 'true');
    setIsVisible(false);
    onDismiss?.();
  };

  const handleLearnMore = () => {
    localStorage.setItem(FIRST_TIME_TIP_KEY, 'true');
    setIsVisible(false);
    navigate('/help');
  };

  if (!isVisible) return null;

  return (
    <div className="mb-4 animate-in slide-in-from-top-2 duration-500">
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-4 border border-primary/20 dark:from-primary/5 dark:to-accent/5 dark:border-primary/10">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-primary dark:text-primary-light" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-text-primary dark:dark-text-primary">
                第一次看到发音谱子？
              </h3>
              <button
                onClick={handleDismiss}
                className="p-1 -mr-1 rounded-lg hover:bg-surface-hover transition-colors"
              >
                <X className="w-4 h-4 text-text-secondary dark:text-dark-text-secondary" />
              </button>
            </div>
            <p className="text-xs text-text-secondary mb-3 dark:text-dark-text-secondary">
              这是AI标注的节奏指南，帮助你掌握重读、语调和连读技巧
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDismiss}
                className="flex-1 py-2 px-3 bg-surface hover:bg-surface-hover rounded-lg text-xs font-bold text-text-primary transition-all dark:bg-dark-surface dark:hover:bg-dark-surface-hover"
              >
                我知道了
              </button>
              <button
                onClick={handleLearnMore}
                className="flex-1 py-2 px-3 bg-primary hover:bg-primary-light rounded-lg text-xs font-bold text-white transition-all flex items-center justify-center gap-1"
              >
                查看教程
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook to check if tip has been shown
export const useFirstTimeTip = () => {
  const resetTip = () => localStorage.removeItem(FIRST_TIME_TIP_KEY);
  return { resetTip };
};

export default FirstTimeTip;
