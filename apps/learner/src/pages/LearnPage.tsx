import React from 'react';
import { BookOpen, Play, CheckCircle, Info, ArrowRight } from 'lucide-react';

export const LearnPage: React.FC = () => {
  // TODO: Add actual tutorial content
  const tutorials = [
    {
      id: 1,
      title: '什么是发音谱子？',
      duration: '2:30',
      completed: false,
      description: '了解发音谱子的基本概念和作用',
    },
    {
      id: 2,
      title: '重音符号的使用',
      duration: '3:15',
      completed: false,
      description: '学习如何识别和标注重音',
    },
    {
      id: 3,
      title: '语调符号的使用',
      duration: '3:45',
      completed: false,
      description: '掌握升调和降调的表达方式',
    },
    {
      id: 4,
      title: '连读符号的使用',
      duration: '3:00',
      completed: false,
      description: '学会识别和练习连读现象',
    },
    {
      id: 5,
      title: '综合跟读练习',
      duration: '5:00',
      completed: false,
      description: '综合运用所学符号进行实战练习',
    },
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border dark:bg-dark-background/95 dark:border-dark-border">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary dark:text-primary-light" />
            </div>
            <div>
              <h1 className="text-lg font-black">发音谱子教程</h1>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                系统学习发音谱子的使用方法
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* 引导说明卡片 */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-5 mb-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-lg flex-shrink-0">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-black text-blue-900 dark:text-blue-100 mb-2">
                什么是发音谱子？
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed mb-3">
                发音谱子是一套特殊的符号系统，用来标注英语的<span className="font-bold">重音、语调、连读</span>等发音要点。就像音乐乐谱告诉你怎么唱歌一样，发音谱子告诉你怎么"说"英语。
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-bold">重音（_）</span>：告诉你哪个词需要重读
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-bold">语调（↗ ↘）</span>：标注句子的升调和降调
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-bold">连读（‿）</span>：标示需要连读的词
              </p>
            </div>
          </div>

          <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 border border-blue-200 dark:border-blue-700">
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              <span className="font-bold">💡 示例：</span>
              <span className="font-mono bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded text-xs">
                Hel`lo_ ↗ how are ↘ you?
              </span>
              <br />
              这句话表示："Hello" 要升调，重音在 "lo"，"are" 要降调
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
            <p className="text-xs text-blue-700 dark:text-blue-300 font-bold mb-2">
              为什么要学习发音谱子？
            </p>
            <div className="space-y-1.5">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                ✅ 让你的英语发音更地道、更自然
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                ✅ 掌握英语的节奏和韵律
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                ✅ 跟读练习时知道重点在哪里
              </p>
            </div>
          </div>
        </div>

        {/* 学习路径指引 */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 mb-6 border border-border dark:border-dark-border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ArrowRight className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-black text-text-primary dark:text-dark-text-primary">
              学习路径指引
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary dark:text-dark-text-primary mb-1">
                  观看教学视频
                </p>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                  按顺序观看下方的 5 个课程视频，理解每个符号的含义
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary dark:text-dark-text-primary mb-1">
                  理解符号标注
                </p>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                  学会看懂视频字幕中的发音谱子标注
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary dark:text-dark-text-primary mb-1">
                  去练习页面实战
                </p>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                  完成教程后，点击底部"练习"标签开始实际跟读练习
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5 mb-6 border border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-text-primary dark:text-dark-text-primary">
              我的学习进度
            </span>
            <span className="text-xs font-bold text-primary">
              0/5 课程
            </span>
          </div>
          <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all duration-300"
              style={{ width: '0%' }}
            />
          </div>
          <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-3">
            完成所有课程后，你就能熟练使用发音谱子进行口语练习了！
          </p>
        </div>

        {/* Tutorial List */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-text-secondary dark:text-dark-text-secondary">
            课程列表
          </h2>

          {tutorials.map((tutorial, index) => (
            <div
              key={tutorial.id}
              className="bg-surface dark:bg-dark-surface rounded-2xl p-4 border border-border dark:border-dark-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Video Thumbnail Placeholder */}
                <div className="w-24 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                  <Play className="w-6 h-6 text-primary relative z-10" />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm font-bold text-text-primary dark:text-dark-text-primary line-clamp-2">
                      {index + 1}. {tutorial.title}
                    </h3>
                    {tutorial.completed && (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary mb-2 line-clamp-1">
                    {tutorial.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary">
                      {tutorial.duration}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-8 p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2">
            📚 教程内容即将上线
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            我们正在精心准备教学视频和练习材料，帮助你快速掌握发音谱子的使用方法。敬请期待！
          </p>
        </div>
      </div>
    </div>
  );
};
