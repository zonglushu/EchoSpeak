// 服务端组件 - 移除 'use client'
import type { DailyCostStats } from '@echospeak/services';

interface CacheEfficiencyProps {
  stats: DailyCostStats;
}

export function CacheEfficiency({ stats }: CacheEfficiencyProps) {
  const hitRate = stats.cacheHitRate * 100;
  const missRate = 100 - hitRate;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">缓存效率</h3>

      <div className="mt-6">
        {/* Donut chart (CSS conic-gradient) */}
        <div className="flex items-center justify-center">
          <div
            className="relative h-40 w-40 rounded-full"
            style={{
              background: `conic-gradient(
                #22c55e 0deg ${hitRate * 3.6}deg,
                #ef4444 ${hitRate * 3.6}deg 360deg
              )`,
            }}
          >
            <div className="absolute inset-4 flex items-center justify-center rounded-full bg-white">
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">{hitRate.toFixed(0)}%</p>
                <p className="text-xs text-slate-500">命中率</p>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-slate-600">命中: {hitRate.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-slate-600">未命中: {missRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-200 pt-4">
        <div className="text-center">
          <p className="text-xs text-slate-500">节省金额</p>
          <p className="mt-1 text-lg font-semibold text-green-600">
            ${stats.moneySavedByCache.toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500">节省比例</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {stats.totalCostUsd + stats.moneySavedByCache > 0
              ? ((stats.moneySavedByCache / (stats.totalCostUsd + stats.moneySavedByCache)) * 100).toFixed(0)
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Tier breakdown */}
      <div className="mt-6 space-y-2">
        <h4 className="text-sm font-medium text-slate-700">调用分布</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">基础版 (Layer 2)</span>
            <span className="font-medium text-slate-900">{stats.basicCalls} 次</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">完整版 (Layer 3)</span>
            <span className="font-medium text-slate-900">{stats.fullCalls} 次</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">规则引擎</span>
            <span className="font-medium text-slate-900">{stats.rulesBasedCalls} 次</span>
          </div>
        </div>
      </div>
    </div>
  );
}
