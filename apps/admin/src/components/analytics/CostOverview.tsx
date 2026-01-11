// 服务端组件 - 移除 'use client'
import type { DailyCostStats } from '@echospeak/services';
import { formatCurrency, estimateMonthlyCost } from '@echospeak/services';

interface CostOverviewProps {
  stats: DailyCostStats;
}

export function CostOverview({ stats }: CostOverviewProps) {
  const budgetLimit = 50; // $50 daily budget
  const budgetUsed = (stats.totalCostUsd / budgetLimit) * 100;
  const estimatedMonthly = estimateMonthlyCost(stats);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Daily Cost */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">今日成本</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {formatCurrency(stats.totalCostUsd)}
            </p>
            <p className="mt-1 text-xs text-slate-500">{stats.totalCalls} 次调用</p>
          </div>
          <div className="rounded-full bg-green-100 p-3">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Budget Usage */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">预算使用</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{budgetUsed.toFixed(1)}%</p>
            <p className="mt-1 text-xs text-slate-500">{formatCurrency(budgetLimit - stats.totalCostUsd)} 剩余</p>
          </div>
          <div className="rounded-full bg-blue-100 p-3">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${
                budgetUsed > 90 ? 'bg-red-500' : budgetUsed > 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(budgetUsed, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Estimated Monthly */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">预估月度成本</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {formatCurrency(estimatedMonthly)}
            </p>
            <p className="mt-1 text-xs text-slate-500">基于当前使用量</p>
          </div>
          <div className="rounded-full bg-purple-100 p-3">
            <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Cache Savings */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">缓存节省</p>
            <p className="mt-2 text-3xl font-semibold text-green-600">
              {formatCurrency(stats.moneySavedByCache)}
            </p>
            <p className="mt-1 text-xs text-slate-500">命中率 {(stats.cacheHitRate * 100).toFixed(0)}%</p>
          </div>
          <div className="rounded-full bg-green-100 p-3">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
