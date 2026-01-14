/**
 * Learning Modes Page - 三种学习模式说明
 *
 * 帮助用户理解 Flow、Battle、Think 三种核心学习模式
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Target, Brain, Zap, ChevronRight, BookOpen, Headphones } from 'lucide-react';

const MODES = [
  {
    id: 'flow',
    emoji: '🌊',
    name: 'Flow Mode',
    title: '伴随输入',
    color: 'from-teal-400 to-emerald-500',
    bgColor: 'bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20',
    borderColor: 'border-teal-200 dark:border-teal-800',
    textColor: 'text-teal-700 dark:text-teal-400',
    icon: <Headphones size={32} />,
    description: '轻量级听力输入，培养语感',
    bestFor: '晨间通勤、家务时间、放松时刻',
    features: [
      {
        icon: '🎧',
        title: '被动聆听',
        desc: 'hands-busy 时的轻学习'
      },
      {
        icon: '🔊',
        title: '轻声跟读',
        desc: ' whispershadowing，实时触觉反馈'
      },
      {
        icon: '❤️',
        title: '一键收藏',
        desc: '遇到好短语立刻保存'
      }
    ],
    scenarios: [
      { time: '早晨 07:30-08:30', activity: 'Business Podcast / TED Talks', goal: '积累商务表达' },
      { time: '午休 14:00-14:10', activity: 'Chunk Activation', goal: '快速造句练习' }
    ],
    tips: [
      '适合注意力有限的时候',
      '重在积累，不要强求理解每一个词',
      '每天 10-20 分钟即可'
    ]
  },
  {
    id: 'battle',
    emoji: '⚔️',
    name: 'Battle Mode',
    title: '实战练习',
    color: 'from-rose-400 to-red-500',
    bgColor: 'bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20',
    borderColor: 'border-rose-200 dark:border-rose-800',
    textColor: 'text-rose-700 dark:text-rose-400',
    icon: <Zap size={32} />,
    description: '高强度角色扮演，突破表达障碍',
    bestFor: '晚间练习、周末深度学习',
    features: [
      {
        icon: '🎯',
        title: '闯关式角色扮演',
        desc: '发音 Gate + 对话实战'
      },
      {
        icon: '📊',
        title: '多维反馈',
        desc: '发音、语法、语用全面评分'
      },
      {
        icon: '🏆',
        title: '成就解锁',
        desc: '完成任务获得徽章'
      }
    ],
    scenarios: [
      { time: '晚上 20:00-20:45', activity: 'Meeting / Negotiation Scenarios', goal: '模拟真实商务对话' },
      { time: '周末集中', activity: 'IELTS Speaking Simulation', goal: '全真模拟考试' }
    ],
    tips: [
      '需要专注和安静的环境',
      '不要怕犯错，越多练越好',
      '建议每次 20-40 分钟'
    ]
  },
  {
    id: 'think',
    emoji: '💡',
    name: 'Think Mode',
    title: '思维内化',
    color: 'from-indigo-400 to-purple-500',
    bgColor: 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    textColor: 'text-indigo-700 dark:text-indigo-400',
    icon: <Brain size={32} />,
    description: '逻辑重构与语块激活，巩固记忆',
    bestFor: '睡前复习、反思总结',
    features: [
      {
        icon: '🎬',
        title: '视频复述',
        desc: '理解 + 表达双重训练'
      },
      {
        icon: '📝',
        title: '逻辑重写',
        desc: '句式升级，从简单到复杂'
      },
      {
        icon: '🔄',
        title: '语块激活',
        desc: '间隔重复，长期记忆'
      }
    ],
    scenarios: [
      { time: '睡前 23:00-23:15', activity: 'Business Video Retelling', goal: '轻度复盘 + 明日安排' },
      { time: '复习时段', activity: 'Logic Rewriting', goal: '句式升级（从简单到复杂）' }
    ],
    tips: [
      '适合低压力的环境',
      '重在输出，检验学习效果',
      '每天 5-15 分钟即可'
    ]
  }
];

const USER_JOURNEYS = [
  {
    persona: '💼 职场进阶者',
    path: '早晨 Flow → 午休 Think → 晚上 Battle',
    goal: '提升会议自信和商务表达'
  },
  {
    persona: '📚 备考学生',
    path: '空闲 Flow → 学习 Battle → 复习 Think',
    goal: 'IELTS/TOEFL 高分突破'
  },
  {
    persona: '🌴 兴趣/旅游党',
    path: '周末 Flow → 晚上 Think → 偶尔 Battle',
    goal: '生存英语 + 娱乐学习'
  }
];

const LearningModesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-32 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-200 p-4 safe-top dark:bg-gray-900/80 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-slate-900 dark:text-white">学习模式说明</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">三种模式，灵活组合</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8 max-w-4xl mx-auto">
        {/* 介绍 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">
            选择适合你的学习方式
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            我们设计了三种核心学习模式，分别对应不同的时间、场景和目标。
            你可以根据自己的情况灵活组合使用。
          </p>
        </motion.div>

        {/* 三种模式详解 */}
        {MODES.map((mode, index) => (
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${mode.bgColor} rounded-3xl p-8 border-2 ${mode.borderColor} shadow-lg`}
          >
            {/* 模式标题 */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-6xl">{mode.emoji}</div>
                  <div>
                    <h3 className={`text-3xl font-black ${mode.textColor} mb-1`}>
                      {mode.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">{mode.name}</p>
                  </div>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-lg mb-4">{mode.description}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{mode.bestFor}</span>
                </div>
              </div>
            </div>

            {/* 核心功能 */}
            <div className="mb-6">
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                核心功能
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {mode.features.map((feature, idx) => (
                  <div key={idx} className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-slate-200 dark:border-gray-700">
                    <div className="text-2xl mb-2">{feature.icon}</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">{feature.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{feature.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 使用场景 */}
            <div className="mb-6">
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                使用场景
              </h4>
              <div className="space-y-2">
                {mode.scenarios.map((scenario, idx) => (
                  <div key={idx} className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-slate-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{scenario.time}</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{scenario.activity}</div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">→ {scenario.goal}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 小贴士 */}
            <div className="bg-slate-900/5 dark:bg-slate-900/20 rounded-xl p-4 border border-slate-200 dark:border-gray-700">
              <h4 className="text-sm font-black text-slate-900 dark:text-white mb-2">💡 小贴士</h4>
              <ul className="space-y-1">
                {mode.tips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                    <span className="text-slate-400">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}

        {/* 用户路径示例 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-3xl p-8 border-2 border-slate-200 dark:border-gray-800 shadow-lg"
        >
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Target className="w-5 h-5" />
            推荐学习路径
          </h3>
          <div className="space-y-4">
            {USER_JOURNEYS.map((journey, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-gray-800 rounded-2xl p-5 border border-slate-200 dark:border-gray-700">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{journey.persona.split(' ')[0]}</div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                      {journey.persona.split(' ').slice(1).join(' ')}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {journey.path.split(' → ').map((step, stepIdx) => (
                        <React.Fragment key={stepIdx}>
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            step.includes('Flow') ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' :
                            step.includes('Battle') ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                            'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                          }`}>
                            {step}
                          </span>
                          {stepIdx < 2 && <ChevronRight className="w-4 h-4 text-slate-400" />}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      目标：{journey.goal}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 开始使用按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all inline-flex items-center gap-3"
          >
            <span>开始学习</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default LearningModesPage;
