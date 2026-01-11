import { Suspense } from 'react';
import { getModerationStats } from '@/lib/data/moderation';
import { ModerationDashboardClient } from '@/components/moderation/ModerationDashboardClient';

export default async function ModerationPage() {
  // ✅ 在页面级（服务端）获取数据
  const stats = await getModerationStats();

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">内容审核管理</h1>
        <p className="mt-1 text-sm text-slate-500">审核用户上传的 YouTube 内容，管理精选内容库</p>
      </header>

      {/* Statistics Overview - 服务端组件，直接渲染 */}
      <div className="mb-8">
        <Suspense fallback={<div className="flex items-center justify-center py-12">加载统计数据...</div>}>
          {/* 直接渲染统计数据，不需要传递 props */}
          <ModerationStatsWrapper stats={stats} />
        </Suspense>
      </div>

      {/* Main Content - 客户端交互组件 */}
      <ModerationDashboardClient />
    </div>
  );
}

// 服务端组件：渲染统计数据
async function ModerationStatsWrapper({ stats }: { stats: any }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {/* Total Content */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">总内容数</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-full bg-slate-100 p-3">
            <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
      </div>

      {/* Pending */}
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-orange-700">待审核</p>
            <p className="mt-2 text-3xl font-semibold text-orange-900">{stats.pending}</p>
            <p className="mt-1 text-xs text-orange-600">今日新增 {stats.pendingToday}</p>
          </div>
          <div className="rounded-full bg-orange-100 p-3">
            <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Approved */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-700">已批准</p>
            <p className="mt-2 text-3xl font-semibold text-green-900">{stats.approved}</p>
            <p className="mt-1 text-xs text-green-600">
              {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% 批准率
            </p>
          </div>
          <div className="rounded-full bg-green-100 p-3">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Rejected */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-700">已拒绝</p>
            <p className="mt-2 text-3xl font-semibold text-red-900">{stats.rejected}</p>
          </div>
          <div className="rounded-full bg-red-100 p-3">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Avg Processing Time */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">平均处理时间</p>
            <p className="mt-2 text-3xl font-semibold text-blue-900">
              {stats.avgProcessingTime > 0 ? stats.avgProcessingTime.toFixed(1) : '0.0'}m
            </p>
          </div>
          <div className="rounded-full bg-blue-100 p-3">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
