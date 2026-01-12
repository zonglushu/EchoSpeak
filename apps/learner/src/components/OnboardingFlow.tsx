import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface OnboardingFlowProps {
  onComplete?: (userLevel: 'beginner' | 'intermediate' | 'advanced') => void;
  onSkip?: () => void;
  isManual?: boolean; // 是否手动触发（从帮助中心打开）
}

const ONBOARDING_COMPLETED_KEY = 'echospeak_onboarding_completed';

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  onSkip,
  isManual = false
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');

  const totalPages = 4;
  const isLastPage = currentPage === totalPages - 1;

  const pages = [
    {
      icon: '🎯',
      title: '欢迎来到EchoSpeak',
      subtitle: '你的AI口语跟读教练',
      content: (
        <div className="space-y-4">
          <p className="text-text-secondary dark:text-dark-text-secondary">
            通过观看视频、跟读练习，让AI帮助你提升英语口语流利度和发音准确度
          </p>
          <div className="bg-surface rounded-xl p-4 dark:bg-dark-surface">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📹</span>
              <span className="text-sm font-bold text-text-primary dark:dark-text-primary">观看精选视频</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🎤</span>
              <span className="text-sm font-bold text-text-primary dark:dark-text-primary">跟读练习发音</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <span className="text-sm font-bold text-text-primary dark:dark-text-primary">AI实时反馈</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: '🎵',
      title: '什么是发音谱子？',
      subtitle: 'AI标注的节奏指南',
      content: (
        <div className="space-y-4">
          <p className="text-text-secondary dark:text-dark-text-secondary">
            就像音乐乐谱标注节奏一样，我们的AI会为每个英语句子标注发音节奏，帮助你：
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-surface rounded-xl p-3 dark:bg-dark-surface">
              <span className="text-xl">📌</span>
              <div>
                <p className="text-sm font-bold text-text-primary dark:dark-text-primary">掌握重读位置</p>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">知道哪些词需要读得更重</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-surface rounded-xl p-3 dark:bg-dark-surface">
              <span className="text-xl">🎼</span>
              <div>
                <p className="text-sm font-bold text-text-primary dark:dark-text-primary">学习语调变化</p>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">模仿自然的语调起伏</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-surface rounded-xl p-3 dark:bg-dark-surface">
              <span className="text-xl">🔗</span>
              <div>
                <p className="text-sm font-bold text-text-primary dark:dark-text-primary">练习连读技巧</p>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">像母语者一样流畅</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: '📖',
      title: '如何读发音谱子？',
      subtitle: '符号说明',
      content: (
        <div className="space-y-4">
          <p className="text-text-secondary dark:text-dark-text-secondary">
            发音谱子用简单的符号标注句子的节奏特征：
          </p>
          <div className="bg-surface rounded-xl p-4 dark:bg-dark-surface">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                  ▂
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-text-primary dark:dark-text-primary">下划线</p>
                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary">表示这个词要<strong>重读</strong></p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center text-2xl">
                  ↗
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-text-primary dark:dark-text-primary">上升箭头</p>
                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary">表示语调<strong>上升</strong></p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center text-2xl">
                  ‿
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-text-primary dark:dark-text-primary">波浪线</p>
                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary">表示<strong>连读</strong>，要读得连贯</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
            <p className="text-xs font-bold text-primary dark:text-primary-light mb-2">💡 小贴士</p>
            <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
              不需要记住所有符号！跟着谱子的提示，模仿原声的节奏和语调即可
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: '🚀',
      title: '准备开始了！',
      subtitle: '选择你的英语水平',
      content: (
        <div className="space-y-4">
          <p className="text-text-secondary dark:text-dark-text-secondary">
            选择你的水平，我们将为你推荐合适的学习内容
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setSelectedLevel('beginner')}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedLevel === 'beginner'
                  ? 'bg-green-50 border-green-500 dark:bg-green-900/20'
                  : 'bg-surface border-border hover:border-green-300 dark:bg-dark-surface dark:border-dark-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌱</span>
                <div className="text-left flex-1">
                  <p className="text-sm font-bold text-text-primary dark:dark-text-primary">初级</p>
                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary">我刚起步，想学简单对话</p>
                </div>
                {selectedLevel === 'beginner' && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </button>
            <button
              onClick={() => setSelectedLevel('intermediate')}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedLevel === 'intermediate'
                  ? 'bg-teal-50 border-teal-500 dark:bg-teal-900/20'
                  : 'bg-surface border-border hover:border-teal-300 dark:bg-dark-surface dark:border-dark-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌿</span>
                <div className="text-left flex-1">
                  <p className="text-sm font-bold text-text-primary dark:dark-text-primary">中级</p>
                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary">我能基本交流，想更流利</p>
                </div>
                {selectedLevel === 'intermediate' && (
                  <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </button>
            <button
              onClick={() => setSelectedLevel('advanced')}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedLevel === 'advanced'
                  ? 'bg-cyan-50 border-purple-500 dark:bg-purple-900/20'
                  : 'bg-surface border-border hover:border-cyan-300 dark:bg-dark-surface dark:border-dark-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌳</span>
                <div className="text-left flex-1">
                  <p className="text-sm font-bold text-text-primary dark:dark-text-primary">高级</p>
                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary">我很流利，想练地道发音</p>
                </div>
                {selectedLevel === 'advanced' && (
                  <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </button>
          </div>
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-3 border border-teal-200 dark:border-teal-800">
            <p className="text-xs font-bold text-teal-700 dark:text-teal-300 mb-1">💡 提示</p>
            <p className="text-xs text-teal-600 dark:text-teal-400">
              之后可以在「帮助中心」随时查看这些引导内容
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (isLastPage) {
      // 完成引导
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      onComplete?.(selectedLevel);
    } else {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    onSkip?.();
  };

  const currentPageData = pages[currentPage];

  return (
    <div className="fixed inset-0 z-[60] bg-background dark:bg-dark-background">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between p-4 safe-top">
        <div className="flex-1">
          {/* 进度指示器 */}
          <div className="flex gap-1.5">
            {Array.from({ length: totalPages }).map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all ${
                  index === currentPage
                    ? 'bg-primary flex-1'
                    : index < currentPage
                    ? 'bg-primary'
                    : 'bg-surface dark:bg-dark-surface'
                }`}
                style={{ width: index === currentPage ? '40%' : '10%' }}
              />
            ))}
          </div>
        </div>
        {!isManual && (
          <button
            onClick={handleSkip}
            className="px-3 py-1.5 text-xs font-bold text-text-secondary hover:text-text-primary dark:text-dark-text-secondary dark:hover:text-dark-text-primary"
          >
            跳过
          </button>
        )}
      </div>

      {/* 内容区域 */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)] px-6">
        {/* 图标 */}
        <div className="text-6xl mb-6 animate-bounce">
          {currentPageData.icon}
        </div>

        {/* 标题 */}
        <h1 className="text-2xl font-black text-center mb-2 text-text-primary dark:dark-text-primary">
          {currentPageData.title}
        </h1>
        <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-8">
          {currentPageData.subtitle}
        </p>

        {/* 内容 */}
        <div className="w-full max-w-md">
          {currentPageData.content}
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-background/95 backdrop-blur-2xl border-t border-border safe-bottom dark:bg-dark-background/95 dark:border-dark-border" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom) + 1rem)' }}>
        <div className="flex gap-3 max-w-md mx-auto">
          {currentPage > 0 && (
            <button
              onClick={handleBack}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-surface border-2 border-border rounded-xl font-bold text-text-primary hover:bg-surface-hover transition-all dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-primary dark:hover:bg-dark-surface-hover shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              返回
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-primary hover:bg-primary-dark rounded-xl font-bold text-white transition-all touch-friendly shadow-lg shadow-primary/30"
          >
            {isLastPage ? '开始学习' : '继续'}
            {!isLastPage && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook to check if user has completed onboarding
export const useOnboarding = () => {
  const [hasCompleted, setHasCompleted] = useState(true);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
    setHasCompleted(completed === 'true');
  }, []);

  return {
    hasCompleted,
    resetOnboarding: () => localStorage.removeItem(ONBOARDING_COMPLETED_KEY),
  };
};

export default OnboardingFlow;
