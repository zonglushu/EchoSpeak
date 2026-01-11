import { useQuota } from '../hooks/useQuota';
import { Sparkles } from 'lucide-react';

/**
 * 配额显示组件
 * 在 Learner App 中显示当前用户的配额信息
 */
export function QuotaDisplay() {
  const { quota, loading, error, refetch } = useQuota();

  const handleNavigateToSubscription = () => {
    window.location.href = '/subscription';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error || !quota) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p className="text-sm">⚠️ 无法加载配额信息</p>
        <p className="text-xs mt-1">{error || '未知错误'}</p>
      </div>
    );
  }

  const tierConfig = {
    free: {
      name: '🔰 免费版',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    pro: {
      name: '💎 专业版',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    premium: {
      name: '👑 高级版',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  };

  const config = tierConfig[quota.tier as keyof typeof tierConfig] || tierConfig.free;

  return (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${config.color.replace('text', 'border')}`}>
      {/* 标题和层级 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-bold text-lg ${config.color}`}>
          {config.name}
        </h3>
        <button
          onClick={refetch}
          className="text-sm text-gray-500 hover:text-gray-700"
          title="刷新配额"
        >
          🔄
        </button>
      </div>

      {/* 配额详情 */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-700">基础版 AI 标注:</span>
          <span className="font-semibold text-gray-900">
            {quota.basic_remaining === -1 ? (
              <span className="text-green-600">✓ 无限</span>
            ) : quota.basic_remaining === 0 ? (
              <span className="text-red-600">已用完</span>
            ) : (
              <span>{quota.basic_remaining} / {quota.daily_basic_limit}</span>
            )}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-700">完整版 AI 标注:</span>
          <span className="font-semibold text-gray-900">
            {quota.full_remaining === -1 ? (
              <span className="text-green-600">✓ 无限</span>
            ) : quota.full_remaining === 0 ? (
              <span className="text-red-600">已用完</span>
            ) : (
              <span>{quota.full_remaining} / {quota.daily_full_limit}</span>
            )}
          </span>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            重置时间: {new Date(quota.resets_at).toLocaleString('zh-CN')}
          </p>
        </div>
      </div>

      {/* 警告提示 */}
      {(quota.basic_remaining === 0 || quota.full_remaining === 0) && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ 今日配额已用完
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            明天自动重置，或升级到 Pro 版获得更多配额
          </p>
          <button
            onClick={handleNavigateToSubscription}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold text-sm hover:from-blue-700 hover:to-blue-800 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            立即升级
          </button>
        </div>
      )}

      {/* 历史统计 */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          历史累计: {quota.total_basic_used} 次基础版, {quota.total_full_used} 次完整版
        </p>
      </div>
    </div>
  );
}
