import { useEffect } from 'react';
import { AuthForm } from './components/AuthForm';
import { UserMenu } from './components/UserMenu';
import { QuotaDisplay } from './components/QuotaDisplay';
import { useAuth } from './components/AuthProvider';
import App from './App';

/**
 * 带认证功能的 App 入口
 * 如果用户未登录，显示登录表单
 * 如果用户已登录，显示主应用
 */
export default function AppAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg"></div>
                <h1 className="text-xl font-bold text-gray-900">EchoSpeak</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* 配额显示 */}
              <div className="hidden md:block">
                <QuotaDisplay />
              </div>

              {/* 用户菜单 */}
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      {/* 主应用内容 */}
      <App />
    </div>
  );
}
