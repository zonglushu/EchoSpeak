import { Suspense } from 'react';
import { QuotaOverview } from '@/components/quota/QuotaOverview';

export default function QuotaPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">配额管理</h1>
        <p className="mt-1 text-sm text-slate-500">查看和管理用户配额使用情况</p>
      </header>

      {/* Main Content - 服务端组件获取数据 */}
      <Suspense fallback={<div className="flex items-center justify-center py-12">加载中...</div>}>
        <QuotaOverview />
      </Suspense>
    </div>
  );
}
