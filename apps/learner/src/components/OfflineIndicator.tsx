import { useState, useEffect } from 'react';
import { WifiOff, Loader2 } from 'lucide-react';

/**
 * 离线状态指示器组件
 * 当网络断开时显示警告，恢复后自动隐藏
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnecting, setShowReconnecting] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // 显示重连成功提示 2 秒后隐藏
      setTimeout(() => {
        setShowReconnecting(false);
      }, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // 监听网络状态变化
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 如果在线，不显示任何内容
  if (isOnline) return null;

  return (
    <>
      {/* 顶部警告条 */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-center py-3 px-4 shadow-lg">
        <div className="flex items-center justify-center gap-2 max-w-7xl mx-auto">
          <WifiOff size={20} className="flex-shrink-0" />
          <p className="text-sm font-medium">
            ⚠️ 网络已断开 - 部分功能可能受限，但您仍可查看已缓存的内容
          </p>
        </div>
      </div>

      {/* 占位符，防止内容被遮挡 */}
      <div className="h-14"></div>

      {/* 可选：添加重连中提示 */}
      {!isOnline && showReconnecting && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="animate-spin text-blue-600" size={20} />
            <div>
              <p className="font-semibold text-gray-900">正在重连...</p>
              <p className="text-sm text-gray-600">网络恢复后将自动同步您的数据</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * 网络状态监听 Hook
 * 可用于在组件内部监听网络状态
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}
