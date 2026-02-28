import { AuthForm } from './components/AuthForm';
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

  return <App />;
}
