'use client';

import { useEffect, useState } from 'react';

interface UserQuotaData {
  userId: string;
  tier: 'free' | 'pro' | 'premium';
  limits: {
    basic: number;
    full: number;
  };
  usage: {
    basicUsed: number;
    fullUsed: number;
    totalBasicUsed: number;
    totalFullUsed: number;
  };
  remaining: {
    basic: number;
    full: number;
  };
  usagePercentage: {
    basic: number;
    full: number;
  };
  resetsAt: string;
  timeUntilReset: string;
  canRequest: {
    basic: boolean;
    full: boolean;
  };
}

export function QuotaManagementDashboard() {
  const [quota, setQuota] = useState<UserQuotaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('default-user');

  useEffect(() => {
    fetchQuota();
  }, [userId]);

  const fetchQuota = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/quota/check?userId=${userId}&tier=free`);
      const result = await response.json();
      if (result.success) {
        setQuota(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch quota:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTierChange = async (newTier: 'free' | 'pro' | 'premium') => {
    // TODO: Implement tier upgrade
    console.log('Upgrade to:', newTier);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-sm text-slate-600">加载配额数据中...</p>
        </div>
      </div>
    );
  }

  if (!quota) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-700">加载配额数据失败</p>
        <button
          onClick={fetchQuota}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Tier Card */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">当前账户层级</h3>
            <p className="mt-1 text-sm text-slate-500">
              用户 ID: {quota.userId}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-lg px-4 py-2 text-lg font-bold ${
              quota.tier === 'premium'
                ? 'bg-yellow-100 text-yellow-800'
                : quota.tier === 'pro'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-slate-100 text-slate-800'
            }`}>
              {quota.tier.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Quota Usage Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Basic Tier Quota */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900">基础版配额 (Layer 2)</h4>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
              quota.remaining.basic > 0
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {quota.remaining.basic > 0 ? '可用' : '已用完'}
            </span>
          </div>

          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-600">已使用</span>
                <span className="font-medium text-slate-900">
                  {quota.usage.basicUsed} / {quota.limits.basic}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    quota.usagePercentage.basic > 90
                      ? 'bg-red-500'
                      : quota.usagePercentage.basic > 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(quota.usagePercentage.basic, 100)}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
              <div>
                <p className="text-xs text-slate-500">剩余配额</p>
                <p className="text-lg font-semibold text-slate-900">
                  {quota.remaining.basic === -1 ? '无限' : quota.remaining.basic}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">总使用量</p>
                <p className="text-lg font-semibold text-slate-900">
                  {quota.usage.totalBasicUsed}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full Tier Quota */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900">完整版配额 (Layer 3)</h4>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
              quota.remaining.full > 0
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {quota.remaining.full > 0 ? '可用' : '已用完'}
            </span>
          </div>

          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-600">已使用</span>
                <span className="font-medium text-slate-900">
                  {quota.usage.fullUsed} / {quota.limits.full}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    quota.usagePercentage.full > 90
                      ? 'bg-red-500'
                      : quota.usagePercentage.full > 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(quota.usagePercentage.full, 100)}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
              <div>
                <p className="text-xs text-slate-500">剩余配额</p>
                <p className="text-lg font-semibold text-slate-900">
                  {quota.remaining.full === -1 ? '无限' : quota.remaining.full}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">总使用量</p>
                <p className="text-lg font-semibold text-slate-900">
                  {quota.usage.totalFullUsed}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Information */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-blue-900">配额重置时间</h4>
            <p className="mt-1 text-sm text-blue-700">
              配额将在 {quota.timeUntilReset} 后重置
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {new Date(quota.resetsAt).toLocaleString('zh-CN')}
            </p>
          </div>
          <div className="text-blue-600">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Upgrade Options */}
      {quota.tier !== 'premium' && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-6">
          <h4 className="font-semibold text-purple-900 mb-4">升级账户</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            {quota.tier === 'free' && (
              <button
                onClick={() => handleTierChange('pro')}
                className="rounded-lg border-2 border-blue-500 bg-white p-4 text-left hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-blue-900">Pro</span>
                  <span className="text-sm font-medium text-blue-600">$9.99/月</span>
                </div>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>✓ 20 基础版/天</li>
                  <li>✓ 5 完整版/天</li>
                  <li>✓ 优先处理</li>
                </ul>
              </button>
            )}
            <button
              onClick={() => handleTierChange('premium')}
              className="rounded-lg border-2 border-yellow-500 bg-white p-4 text-left hover:bg-yellow-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-yellow-900">Premium</span>
                <span className="text-sm font-medium text-yellow-600">$19.99/月</span>
              </div>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>✓ 无限配额</li>
                <li>✓ 最高优先级</li>
                <li>✓ 离线下载</li>
              </ul>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
