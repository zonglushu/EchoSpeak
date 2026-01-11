// 服务端组件 - 移除 'use client'
import { Suspense } from 'react';
import { getDailyCostStats, getCostTrend, getUserCostLeaderboard } from '@/lib/data/analytics';
import { CostOverview } from './CostOverview';
import { CostTrendChart } from './CostTrendChart';
import { CacheEfficiency } from './CacheEfficiency';
import { UserCostLeaderboard } from './UserCostLeaderboard';

export async function CostAnalyticsDashboard() {
  // ✅ 在服务端并行获取所有数据
  const [stats, trendData, leaderboard] = await Promise.all([
    getDailyCostStats(),
    getCostTrend(),
    getUserCostLeaderboard(),
  ]);

  return (
    <div className="space-y-8">
      {/* Cost Overview */}
      <CostOverview stats={stats} />

      {/* Charts and Metrics Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cost Trend */}
        <Suspense fallback={<div className="h-64 rounded-lg bg-slate-50 animate-pulse" />}>
          <CostTrendChart initialData={trendData} />
        </Suspense>

        {/* Cache Efficiency */}
        <CacheEfficiency stats={stats} />
      </div>

      {/* User Leaderboard */}
      <Suspense fallback={<div className="h-64 rounded-lg bg-slate-50 animate-pulse" />}>
        <UserCostLeaderboard initialData={leaderboard} />
      </Suspense>
    </div>
  );
}
