import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * PWA 安装提示组件
 * 当浏览器检测到应用可以安装时显示
 */
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 检测是否为 iOS 设备
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // 检查是否已经安装（PWA 模式）
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;

    // iOS 需要手动提示
    if (isIOSDevice && !isInstalled) {
      // 检查是否已经显示过提示
      const hasShownPrompt = localStorage.getItem('ios-install-prompt-shown');
      if (!hasShownPrompt) {
        // 延迟 3 秒显示，不打扰用户
        const timer = setTimeout(() => {
          setShowInstallPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }

    // 非 iOS 设备监听 beforeinstallprompt 事件
    if (!isIOSDevice) {
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallPrompt(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // 监听应用安装成功事件
      window.addEventListener('appinstalled', () => {
        setShowInstallPrompt(false);
        setDeferredPrompt(null);
      });

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      // iOS 显示添加到主屏幕的教程
      setShowInstallPrompt(false);
      localStorage.setItem('ios-install-prompt-shown', 'true');
      return;
    }

    if (deferredPrompt) {
      // @ts-ignore - deferredPrompt 是自定义事件
      const prompt = deferredPrompt.prompt;
      if (prompt) {
        // @ts-ignore
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setShowInstallPrompt(false);
        }
        setDeferredPrompt(null);
      }
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    if (isIOS) {
      localStorage.setItem('ios-install-prompt-shown', 'true');
    }
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md animate-slide-up">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-2xl p-6 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-white opacity-10 rounded-full blur-xl"></div>

        {/* 关闭按钮 */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded-full transition-colors"
          aria-label="关闭"
        >
          <X size={20} />
        </button>

        {/* 内容 */}
        <div className="flex items-start gap-4">
          {/* 应用图标 */}
          <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-teal-600">ES</span>
          </div>

          {/* 文本 */}
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">安装 EchoSpeak</h3>
            <p className="text-teal-100 text-sm mb-3">
              {isIOS
                ? '添加到主屏幕，获得最佳学习体验'
                : '安装应用到桌面，离线也能学习'}
            </p>

            {/* iOS 安装说明 */}
            {isIOS && (
              <div className="bg-white/10 rounded-lg p-3 mb-3 text-sm">
                <p className="mb-2">
                  <span className="font-semibold">iOS 安装步骤：</span>
                </p>
                <ol className="space-y-1 text-teal-100 list-decimal list-inside">
                  <li>点击底部的分享按钮 <span className="inline-block">↑</span></li>
                  <li>向下滚动，选择"添加到主屏幕"</li>
                  <li>点击"添加"完成安装</li>
                </ol>
              </div>
            )}

            {/* 按钮 */}
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 bg-white text-teal-600 px-4 py-2 rounded-lg font-semibold hover:bg-teal-50 transition-colors shadow-lg"
              >
                {isIOS ? '知道了' : '立即安装'}
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-teal-100 hover:text-white transition-colors"
              >
                暂不
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 添加动画样式 */}
      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
