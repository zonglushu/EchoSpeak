import { Suspense } from 'react';
import { CostAnalyticsDashboard } from '@/components/analytics/CostAnalyticsDashboard';

export default function AnalyticsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">成本分析与追踪</h1>
        <p className="mt-1 text-sm text-slate-500">监控 AI 处理成本、分析缓存效果、优化资源使用</p>
      </header>

      {/* Main Content - 服务端组件获取数据 */}
      <Suspense fallback={<div className="flex items-center justify-center py-12">加载中...</div>}>
        <CostAnalyticsDashboard />
      </Suspense>
    </div>
  );
}
