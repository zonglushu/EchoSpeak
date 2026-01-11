'use client';

import { useEffect, useState } from 'react';

interface UserCostData {
  userId: string;
  totalCost: number;
  totalCalls: number;
  avgCostPerCall: number;
  tier: 'free' | 'pro' | 'premium';
}

interface UserCostLeaderboardProps {
  initialData?: Array<{ userId: string; totalCost: number }>;
}

export function UserCostLeaderboard({ initialData }: UserCostLeaderboardProps) {
  const [users, setUsers] = useState<UserCostData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Use initialData when available
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _unused = initialData;
    
    // TODO: Fetch from API
    setTimeout(() => {
      setUsers([
        { userId: 'user-1', totalCost: 3.45, totalCalls: 65, avgCostPerCall: 0.053, tier: 'premium' },
        { userId: 'user-2', totalCost: 2.18, totalCalls: 42, avgCostPerCall: 0.052, tier: 'pro' },
        { userId: 'user-3', totalCost: 1.85, totalCalls: 38, avgCostPerCall: 0.049, tier: 'free' },
        { userId: 'user-4', totalCost: 1.42, totalCalls: 28, avgCostPerCall: 0.051, tier: 'pro' },
        { userId: 'user-5', totalCost: 1.15, totalCalls: 25, avgCostPerCall: 0.046, tier: 'free' },
        { userId: 'user-6', totalCost: 0.98, totalCalls: 22, avgCostPerCall: 0.045, tier: 'free' },
        { userId: 'user-7', totalCost: 0.82, totalCalls: 18, avgCostPerCall: 0.046, tier: 'free' },
        { userId: 'user-8', totalCost: 0.65, totalCalls: 15, avgCostPerCall: 0.043, tier: 'free' },
      ]);
      setLoading(false);
    }, 800);
  }, [initialData]);

  const getTierBadge = (tier: string) => {
    const styles = {
      premium: 'bg-yellow-100 text-yellow-700',
      pro: 'bg-blue-100 text-blue-700',
      free: 'bg-slate-100 text-slate-700',
    };

    const labels = {
      premium: 'Premium',
      pro: 'Pro',
      free: 'Free',
    };

    return (
      <span className={`rounded px-2 py-0.5 text-xs font-medium ${styles[tier as keyof typeof styles]}`}>
        {labels[tier as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">用户成本排行榜</h3>
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-slate-200" />
                <div className="h-4 w-32 rounded bg-slate-200" />
              </div>
              <div className="h-4 w-20 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">用户成本排行榜</h3>
        <span className="text-sm text-slate-500">今日 TOP 8</span>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="pb-3 text-left text-sm font-medium text-slate-600">排名</th>
              <th className="pb-3 text-left text-sm font-medium text-slate-600">用户</th>
              <th className="pb-3 text-left text-sm font-medium text-slate-600">层级</th>
              <th className="pb-3 text-right text-sm font-medium text-slate-600">总成本</th>
              <th className="pb-3 text-right text-sm font-medium text-slate-600">调用次数</th>
              <th className="pb-3 text-right text-sm font-medium text-slate-600">平均成本</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.userId} className="border-b border-slate-100 last:border-0">
                <td className="py-3">
                  <div className="flex items-center justify-center">
                    {index < 3 ? (
                      <span className={`text-lg ${
                        index === 0 ? 'text-yellow-500' : index === 1 ? 'text-slate-400' : 'text-amber-600'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-slate-500">#{index + 1}</span>
                    )}
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-500 text-sm font-medium text-white">
                      {user.userId.slice(-2).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-slate-900">
                      {user.userId}
                    </span>
                  </div>
                </td>
                <td className="py-3">
                  {getTierBadge(user.tier)}
                </td>
                <td className="py-3 text-right">
                  <span className="text-sm font-semibold text-slate-900">
                    ${user.totalCost.toFixed(2)}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <span className="text-sm text-slate-600">{user.totalCalls}</span>
                </td>
                <td className="py-3 text-right">
                  <span className="text-sm text-slate-600">
                    ${user.avgCostPerCall.toFixed(3)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
        <div className="text-sm text-slate-600">
          总计 <span className="font-semibold text-slate-900">{users.length}</span> 位用户
        </div>
        <div className="text-sm text-slate-600">
          总成本 <span className="font-semibold text-slate-900">
            ${users.reduce((sum, u) => sum + u.totalCost, 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
