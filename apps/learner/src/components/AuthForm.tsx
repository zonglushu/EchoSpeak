import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthFormProps {
  onLoginSuccess?: () => void;
}

/**
 * Learner App 登录/注册表单
 */
export function AuthForm({ onLoginSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('free-user@echospeak.test');
  const [password, setPassword] = useState('test1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // 登录
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError('登录失败：' + error.message);
          return;
        }

        // 检查是否为管理员
        const userRole = data.user?.user_metadata?.role;
        if (userRole === 'admin') {
          setError('管理员请使用 Admin App (http://localhost:3000)');
          await supabase.auth.signOut();
          return;
        }

        // 登录成功
        onLoginSuccess?.();
      } else {
        // 注册
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'user',
              tier: 'free',
              full_name: email.split('@')[0],
            },
          },
        });

        if (error) {
          setError('注册失败：' + error.message);
          return;
        }

        // 注册成功，自动分配 free 配额
        if (data.user) {
          const { error: quotaError } = await supabase
            .from('user_quotas')
            .insert({
              user_id: data.user.id,
              tier: 'free',
              daily_basic_limit: 3,
              daily_full_limit: 1,
            });

          if (quotaError) {
            console.error('创建配额失败:', quotaError);
          }

          onLoginSuccess?.();
        }
      }
    } catch (err) {
      setError(isLogin ? '登录失败，请稍后重试' : '注册失败，请稍后重试');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-xl rounded-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              EchoSpeak
            </h1>
            <p className="text-gray-600">
              口语练习平台
            </p>
          </div>

          {/* 切换登录/注册 */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                isLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                !isLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              注册
            </button>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? '处理中...' : isLogin ? '登录' : '注册'}
            </button>
          </form>

          {/* 测试账户提示 */}
          {isLogin && (
            <div className="mt-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
              <p className="text-sm font-medium text-teal-900 mb-2">
                🧪 测试账户
              </p>
              <div className="text-xs text-teal-800 space-y-1">
                <p><strong>Free:</strong> free-user@echospeak.test</p>
                <p><strong>Pro:</strong> pro-user@echospeak.test</p>
                <p><strong>Premium:</strong> premium-user@echospeak.test</p>
                <p className="mt-1">密码统一: test1234</p>
              </div>
            </div>
          )}

          {/* 管理员登录链接 */}
          <div className="mt-6 text-center">
            <a
              href="http://localhost:3000"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              管理员？前往 Admin App →
            </a>
          </div>
        </div>

        {/* 页脚 */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>© 2025 EchoSpeak. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
