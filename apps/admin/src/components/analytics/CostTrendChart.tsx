'use client';

import { useState } from 'react';

interface CostTrendChartProps {
  initialData?: Array<{ date: string; cost: number }>;
}

export function CostTrendChart({ initialData }: CostTrendChartProps) {
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');

  // TODO: Use initialData when available, currently using mock data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unused = initialData;
  
  // Mock data
  const data = period === '7d'
    ? [
        { date: '12-24', cost: 8.50, calls: 156 },
        { date: '12-25', cost: 12.30, calls: 234 },
        { date: '12-26', cost: 10.80, calls: 198 },
        { date: '12-27', cost: 15.20, calls: 287 },
        { date: '12-28', cost: 11.40, calls: 210 },
        { date: '12-29', cost: 12.45, calls: 234 },
        { date: '12-30', cost: 9.80, calls: 182 },
      ]
    : [
        { date: '12-01', cost: 8.50, calls: 156 },
        { date: '12-05', cost: 10.20, calls: 189 },
        { date: '12-10', cost: 12.30, calls: 234 },
        { date: '12-15', cost: 11.80, calls: 215 },
        { date: '12-20', cost: 13.50, calls: 256 },
        { date: '12-25', cost: 12.45, calls: 234 },
        { date: '12-30', cost: 9.80, calls: 182 },
      ];

  const maxCost = Math.max(...data.map(d => d.cost));
  const maxCalls = Math.max(...data.map(d => d.calls));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">成本趋势</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('7d')}
            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
              period === '7d'
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            7 天
          </button>
          <button
            onClick={() => setPeriod('30d')}
            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
              period === '30d'
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            30 天
          </button>
        </div>
      </div>

      {/* Simple bar chart (CSS-based) */}
      <div className="mt-6 space-y-4">
        {/* Cost bars */}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">成本 (USD)</span>
            <span className="text-slate-500">最近 {period === '7d' ? '7' : '6'} 个数据点</span>
          </div>
          <div className="flex gap-2">
            {data.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-blue-500 hover:bg-blue-600 transition-colors"
                  style={{ height: `${(d.cost / maxCost) * 120}px`, minHeight: '4px' }}
                  title={`$${d.cost.toFixed(2)}`}
                />
                <span className="text-xs text-slate-500">{d.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Call count bars */}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">调用次数</span>
          </div>
          <div className="flex gap-2">
            {data.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-purple-500 hover:bg-purple-600 transition-colors"
                  style={{ height: `${(d.calls / maxCalls) * 80}px`, minHeight: '4px' }}
                  title={`${d.calls} calls`}
                />
                <span className="text-xs text-slate-500">{d.calls}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-200 pt-4">
        <div>
          <p className="text-xs text-slate-500">平均成本</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            ${(data.reduce((sum, d) => sum + d.cost, 0) / data.length).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">总调用</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {data.reduce((sum, d) => sum + d.calls, 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">平均/天</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {Math.round(data.reduce((sum, d) => sum + d.calls, 0) / data.length)}
          </p>
        </div>
      </div>
    </div>
  );
}
