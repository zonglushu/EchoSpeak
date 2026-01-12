import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, Star, Zap, Download, HeadphonesIcon, Crown, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Tier {
  id: 'free' | 'pro' | 'premium';
  name: string;
  icon: string;
  tagline: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: {
    dailyBasic: number | string;
    dailyFull: number | string;
    priority: boolean;
    offlineDownloads: number;
    aiModel: string;
    adFree: boolean;
    support: string;
  };
  color: string;
  gradient: string;
  badge?: string;
}

const TIERS: Tier[] = [
  {
    id: 'free',
    name: '免费版',
    icon: '🔰',
    tagline: '体验基础功能',
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: {
      dailyBasic: 3,
      dailyFull: 1,
      priority: false,
      offlineDownloads: 0,
      aiModel: '标准',
      adFree: false,
      support: '社区支持',
    },
    color: 'text-gray-600',
    gradient: 'from-gray-500 to-gray-600',
  },
  {
    id: 'pro',
    name: '专业版',
    icon: '💎',
    tagline: '适合进阶学习',
    price: {
      monthly: 29,
      yearly: 299,
    },
    features: {
      dailyBasic: 20,
      dailyFull: 10,
      priority: true,
      offlineDownloads: 5,
      aiModel: '高级',
      adFree: true,
      support: '邮件支持',
    },
    color: 'text-teal-600',
    gradient: 'from-teal-500 to-teal-600',
    badge: '推荐',
  },
  {
    id: 'premium',
    name: '高级版',
    icon: '👑',
    tagline: '解锁全部特权',
    price: {
      monthly: 99,
      yearly: 999,
    },
    features: {
      dailyBasic: '无限',
      dailyFull: '无限',
      priority: true,
      offlineDownloads: 50,
      aiModel: '顶级',
      adFree: true,
      support: '专属客服',
    },
    color: 'text-cyan-600',
    gradient: 'from-cyan-500 to-cyan-600',
    badge: '超值',
  },
];

const FAQS = [
  {
    question: '如何升级会员？',
    answer: '点击上方的"立即订阅"按钮，选择您需要的套餐，完成支付后立即生效。',
  },
  {
    question: '可以随时取消吗？',
    answer: '是的，您可以随时取消订阅。取消后会员权益将持续至当前计费周期结束。',
  },
  {
    question: '年度订阅有什么优惠？',
    answer: '年度订阅可享受约8.5折优惠，专业版省¥49，高级版省¥89。',
  },
  {
    question: '配额用完后怎么办？',
    answer: '免费版配额每日零点重置。升级到专业版或高级版可获得更多配额，高级版享无限使用。',
  },
  {
    question: '支持哪些支付方式？',
    answer: '支持微信支付、支付宝和主要信用卡。',
  },
];

export const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [currentTier, setCurrentTier] = useState<'free' | 'pro' | 'premium'>('free');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setCurrentTier(user?.user_metadata?.tier || 'free');
    };
    loadUser();
  }, []);

  const handleSubscribe = (tierId: string) => {
    // TODO: 实现支付逻辑
    console.log('Subscribe to tier:', tierId, 'Billing:', billingCycle);
    alert(`即将跳转到支付页面...\n\n套餐: ${TIERS.find(t => t.id === tierId)?.name}\n周期: ${billingCycle === 'monthly' ? '月付' : '年付'}`);
  };

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24 safe-top dark:bg-dark-background dark:text-dark-text-primary">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-2xl border-b border-border p-4 safe-top dark:bg-dark-background/95 dark:border-dark-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl hover:bg-surface-hover transition-all touch-friendly dark:hover:bg-dark-surface-hover"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary dark:text-dark-text-secondary" />
          </button>
          <h1 className="text-xl font-black tracking-tight">会员中心</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 当前会员卡片 */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-white/80 mb-1">当前会员</p>
              <h2 className="text-2xl font-black">
                {TIERS.find(t => t.id === currentTier)?.icon} {TIERS.find(t => t.id === currentTier)?.name}
              </h2>
            </div>
            {currentTier !== 'premium' && (
              <button
                onClick={() => document.getElementById('pricing- tiers')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm transition-all"
              >
                立即升级
              </button>
            )}
          </div>
          {currentTier === 'premium' && (
            <div className="flex items-center gap-2 text-white/90">
              <Crown className="w-5 h-5" />
              <span className="text-sm font-bold">您已享受全部特权</span>
            </div>
          )}
        </div>

        {/* 计费周期切换 */}
        <div className="bg-surface rounded-2xl p-1 border border-border dark:bg-dark-surface dark:border-dark-border">
          <div className="flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-text-secondary hover:text-text-primary dark:text-dark-text-secondary dark:hover:text-dark-text-primary'
              }`}
            >
              月付
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all relative ${
                billingCycle === 'yearly'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-text-secondary hover:text-text-primary dark:text-dark-text-secondary dark:hover:text-dark-text-primary'
              }`}
            >
              年付
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-accent text-white text-xs rounded-full">
                省15%
              </span>
            </button>
          </div>
        </div>

        {/* 套餐对比 */}
        <div id="pricing-tiers" className="space-y-4">
          <h3 className="text-sm font-black text-text-secondary uppercase tracking-wider dark:text-dark-text-secondary">
            选择套餐
          </h3>

          <div className="space-y-4">
            {TIERS.map((tier) => {
              const isCurrentTier = tier.id === currentTier;
              const price = billingCycle === 'monthly' ? tier.price.monthly : tier.price.yearly;

              return (
                <div
                  key={tier.id}
                  className={`relative rounded-2xl border-2 overflow-hidden transition-all ${
                    isCurrentTier
                      ? 'border-primary shadow-lg scale-105'
                      : tier.id === 'pro'
                      ? 'border-teal-300 dark:border-teal-700'
                      : 'border-border hover:border-primary/50 dark:border-dark-border'
                  }`}
                >
                  {/* 推荐标签 */}
                  {tier.badge && (
                    <div className={`absolute top-0 right-0 px-3 py-1 bg-gradient-to-r ${tier.gradient} text-white text-xs font-bold rounded-bl-xl`}>
                      ⭐ {tier.badge}
                    </div>
                  )}

                  <div className={`p-5 ${isCurrentTier ? 'bg-primary/5 dark:bg-primary/10' : 'bg-surface dark:bg-dark-surface'}`}>
                    {/* 套餐名称和价格 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{tier.icon}</span>
                        <div>
                          <h4 className={`text-lg font-black ${tier.color}`}>{tier.name}</h4>
                          <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{tier.tagline}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {price === 0 ? (
                          <p className="text-2xl font-black text-text-primary dark:text-dark-text-primary">免费</p>
                        ) : (
                          <div>
                            <p className="text-2xl font-black text-text-primary dark:text-dark-text-primary">
                              ¥{price}
                            </p>
                            <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                              /{billingCycle === 'monthly' ? '月' : '年'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 功能列表 */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary dark:text-dark-text-secondary">基础版配额</span>
                        <span className="font-bold text-text-primary dark:text-dark-text-primary">
                          {typeof tier.features.dailyBasic === 'number' ? `${tier.features.dailyBasic}次/天` : tier.features.dailyBasic}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary dark:text-dark-text-secondary">完整版配额</span>
                        <span className="font-bold text-text-primary dark:text-dark-text-primary">
                          {typeof tier.features.dailyFull === 'number' ? `${tier.features.dailyFull}次/天` : tier.features.dailyFull}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary dark:text-dark-text-secondary">优先处理</span>
                        {tier.features.priority ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <X className="w-5 h-5 text-text-tertiary dark:text-dark-text-tertiary" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary dark:text-dark-text-secondary">离线下载</span>
                        <span className="font-bold text-text-primary dark:text-dark-text-primary">
                          {tier.features.offlineDownloads === 0 ? '不支持' : `${tier.features.offlineDownloads}个视频`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary dark:text-dark-text-secondary">AI模型</span>
                        <span className="font-bold text-text-primary dark:text-dark-text-primary">{tier.features.aiModel}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary dark:text-dark-text-secondary">去广告</span>
                        {tier.features.adFree ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <X className="w-5 h-5 text-text-tertiary dark:text-dark-text-tertiary" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary dark:text-dark-text-secondary">客服支持</span>
                        <span className="font-bold text-text-primary dark:text-dark-text-primary">{tier.features.support}</span>
                      </div>
                    </div>

                    {/* 按钮 */}
                    {isCurrentTier ? (
                      <button
                        disabled
                        className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-bold text-sm cursor-not-allowed"
                      >
                        当前套餐
                      </button>
                    ) : price === 0 ? (
                      <button
                        disabled
                        className="w-full py-3 bg-surface border border-border text-text-secondary rounded-xl font-bold text-sm cursor-not-allowed dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-secondary"
                      >
                        免费使用
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(tier.id)}
                        className={`w-full py-3 bg-gradient-to-r ${tier.gradient} text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all`}
                      >
                        立即订阅
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-text-secondary uppercase tracking-wider dark:text-dark-text-secondary">
            常见问题
          </h3>
          <div className="space-y-3">
            {FAQS.map((faq, index) => (
              <details
                key={index}
                className="group bg-surface rounded-xl border border-border dark:bg-dark-surface dark:border-dark-border"
              >
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-hover transition-all dark:hover:bg-dark-surface-hover">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm font-bold text-text-primary dark:text-dark-text-primary">{faq.question}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-secondary transition-transform group-open:rotate-90 dark:text-dark-text-secondary" />
                </summary>
                <div className="px-4 pb-4 pl-12">
                  <p className="text-sm text-text-secondary dark:text-dark-text-secondary">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Add ChevronRight import
import { ChevronRight } from 'lucide-react';

export default SubscriptionPage;
