import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, BookOpen, Play, Lightbulb, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OnboardingFlow, useOnboarding } from '../components/OnboardingFlow';

interface HelpPageProps {
  onRestartOnboarding?: () => void;
}

export const HelpPage: React.FC<HelpPageProps> = ({ onRestartOnboarding }) => {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleRestartOnboarding = () => {
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = (userLevel: 'beginner' | 'intermediate' | 'advanced') => {
    setShowOnboarding(false);
    onRestartOnboarding?.();
  };

  if (showOnboarding) {
    return (
      <OnboardingFlow
        isManual={true}
        onComplete={handleOnboardingComplete}
        onSkip={() => setShowOnboarding(false)}
      />
    );
  }

  const faqs = [
    {
      id: '1',
      question: '什么是发音谱子？',
      answer: '发音谱子是AI为每个英语句子自动标注的节奏指南。就像音乐乐谱标注节奏一样，它会标注句子的重读、语调和连读，帮助你像母语者一样自然地说话。',
      icon: '🎵',
    },
    {
      id: '2',
      question: '如何读发音谱子符号？',
      answer: '记住三个基本符号：下划线(▂)表示重读，上升箭头(↗)表示语调上升，波浪线(‿)表示连读。不需要死记硬背，跟着提示模仿原声的节奏即可。',
      icon: '📖',
    },
    {
      id: '3',
      question: '如何提高发音评分？',
      answer: '建议：1) 多听原声，模仿语调；2) 不要急，慢慢练习；3) 注意重读和连读；4) 每天坚持练习15分钟。熟能生巧！',
      icon: '💡',
    },
    {
      id: '4',
      question: '为什么有些视频没有谱子？',
      answer: 'AI生成发音谱子需要一些时间。如果视频刚发布，谱子可能还在生成中。请稍等片刻再刷新页面。谱子生成完成后会自动显示。',
      icon: '⏳',
    },
    {
      id: '5',
      question: '可以调整学习难度吗？',
      answer: '可以！在"我的"页面点击"主题模式"旁边的学习偏好，或者进入帮助中心重新完成引导流程，即可调整你的英语水平。',
      icon: '🎯',
    },
  ];

  const tips = [
    {
      icon: '📅',
      title: '每天练习',
      description: '坚持每天15分钟，比一周练习一次更有效',
    },
    {
      icon: '🎬',
      title: '先听后说',
      description: '先完整听一遍原声，理解整体节奏',
    },
    {
      icon: '🔊',
      title: '大声跟读',
      description: '不要害羞，大声说出来才能发现问题',
    },
    {
      icon: '📝',
      title: '录制自己',
      description: '录下自己的声音，和原声对比找差距',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24 safe-top dark:bg-dark-background dark:text-dark-text-primary">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-2xl border-b border-border p-4 safe-top dark:bg-dark-background/95 dark:border-dark-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl hover:bg-surface-hover transition-all touch-friendly dark:hover:bg-dark-surface-hover"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary dark:text-dark-text-secondary" />
          </button>
          <h1 className="text-xl font-black tracking-tight">帮助中心</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 重新引导 */}
        <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <RotateCcw className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-white">重新了解EchoSpeak</h2>
              <p className="text-xs text-white/80">想再看一遍引导流程？</p>
            </div>
          </div>
          <button
            onClick={handleRestartOnboarding}
            className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold text-white transition-all touch-friendly"
          >
            查看引导教程
          </button>
        </div>

        {/* 常见问题 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-text-secondary uppercase tracking-wider dark:text-dark-text-secondary">
              常见问题
            </h2>
            <span className="text-xs text-text-secondary dark:text-dark-text-secondary">{faqs.length} 个问题</span>
          </div>
          <div className="space-y-2">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-surface rounded-2xl p-4 border border-border dark:bg-dark-surface dark:border-dark-border"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{faq.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-text-primary mb-2 dark:dark-text-primary">
                      {faq.question}
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed dark:text-dark-text-secondary">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 学习技巧 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-text-secondary uppercase tracking-wider dark:text-dark-text-secondary">
              学习技巧
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {tips.map((tip, index) => (
              <div
                key={index}
                className="bg-surface rounded-2xl p-4 border border-border dark:bg-dark-surface dark:border-dark-border"
              >
                <span className="text-2xl mb-2 block">{tip.icon}</span>
                <h4 className="text-sm font-bold text-text-primary mb-1 dark:dark-text-primary">
                  {tip.title}
                </h4>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                  {tip.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 发音谱子详细教程 */}
        <div>
          <h2 className="text-sm font-black text-text-secondary uppercase tracking-wider mb-3 dark:text-dark-text-secondary">
            发音谱子详细教程
          </h2>
          <div className="bg-surface rounded-2xl p-5 border border-border dark:bg-dark-surface dark:border-dark-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-xl">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary dark:dark-text-primary">完整符号说明</h3>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                  掌握所有符号的含义
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-background rounded-xl p-3 dark:bg-dark-background">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-xl">
                    ▂
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-text-primary dark:dark-text-primary">下划线 (Underscore)</p>
                    <p className="text-xs text-text-secondary dark:text-dark-text-secondary">重读标记</p>
                  </div>
                </div>
                <p className="text-xs text-text-secondary ml-13 dark:text-dark-text-secondary">
                  标记在单词下方，表示这个词需要读得更重、更清晰
                </p>
              </div>

              <div className="bg-background rounded-xl p-3 dark:bg-dark-background">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center text-xl">
                    ↗
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-text-primary dark:dark-text-primary">上升箭头 (Rise)</p>
                    <p className="text-xs text-text-secondary dark:text-dark-text-secondary">语调上升</p>
                  </div>
                </div>
                <p className="text-xs text-text-secondary ml-13 dark:text-dark-text-secondary">
                  表示在这个位置语调要上扬，常用于疑问句
                </p>
              </div>

              <div className="bg-background rounded-xl p-3 dark:bg-dark-background">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center text-xl">
                    ‿
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-text-primary dark:dark-text-primary">波浪线 (Wave)</p>
                    <p className="text-xs text-text-secondary dark:text-dark-text-secondary">连读标记</p>
                  </div>
                </div>
                <p className="text-xs text-text-secondary ml-13 dark:text-dark-text-secondary">
                  表示两个或多个词要连在一起读，不要停顿
                </p>
              </div>
            </div>

            <button
              onClick={handleRestartOnboarding}
              className="w-full mt-4 py-3 bg-primary/10 hover:bg-primary/20 rounded-xl text-sm font-bold text-primary transition-all touch-friendly dark:bg-primary/20 dark:hover:bg-primary/30"
            >
              <div className="flex items-center justify-center gap-2">
                <Play className="w-4 h-4" />
                观看完整引导教程
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
