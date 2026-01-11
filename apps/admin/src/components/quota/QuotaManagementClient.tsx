'use client';

import { useState } from 'react';

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

interface QuotaManagementClientProps {
  initialQuota: UserQuotaData;
  allQuotas: any[];
}

export function QuotaManagementClient({ initialQuota, allQuotas }: QuotaManagementClientProps) {
  const [quota] = useState<UserQuotaData>(initialQuota);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users'>('overview');

  const handleTierChange = async (newTier: 'free' | 'pro' | 'premium') => {
    // TODO: Implement tier upgrade
    console.log('Upgrade to:', newTier);
  };

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setSelectedTab('overview')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            selectedTab === 'overview'
              ? 'border-b-2 border-primary text-primary'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          配额概览
        </button>
        <button
          onClick={() => setSelectedTab('users')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            selectedTab === 'users'
              ? 'border-b-2 border-primary text-primary'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          所有用户
        </button>
      </div>

      {selectedTab === 'overview' ? (
        <div className="space-y-6">
          {/* Quota Cards */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Basic Quota */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">基础版配额</h3>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                  {quota.tier}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-600">已使用</span>
                    <span className="font-medium text-slate-900">
                      {quota.usage.basicUsed} / {quota.limits.basic}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
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

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">剩余</span>
                  <span className="font-medium text-green-600">{quota.remaining.basic}</span>
                </div>
              </div>
            </div>

            {/* Full Quota */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">完整版配额</h3>
                <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
                  {quota.tier}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-600">已使用</span>
                    <span className="font-medium text-slate-900">
                      {quota.usage.fullUsed} / {quota.limits.full}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
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

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">剩余</span>
                  <span className="font-medium text-green-600">{quota.remaining.full}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reset Info */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">重置时间</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">距离下次重置</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{quota.timeUntilReset}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">重置日期</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {new Date(quota.resetsAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">所有用户配额</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">用户 ID</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">等级</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">基础版使用</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">完整版使用</th>
                  </tr>
                </thead>
                <tbody>
                  {allQuotas.map((q) => (
                    <tr key={q.user_id} className="border-b border-slate-100">
                      <td className="px-4 py-3 text-sm text-slate-900">{q.user_id}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          {q.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {q.basic_used} / {q.basic_limit}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {q.full_used} / {q.full_limit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
