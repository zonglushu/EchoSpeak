'use client';

import { useState, Suspense } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const [email, setEmail] = useState('admin@echospeak.test');
  const [password, setPassword] = useState('admin1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('开始登录...', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('登录失败:', error);
        setError('登录失败：' + error.message);
        setLoading(false);
        return;
      }

      console.log('登录成功，用户数据:', data.user);
      console.log('用户角色:', data.user?.user_metadata?.role);

      // 检查用户角色
      const userRole = data.user?.user_metadata?.role;

      if (userRole !== 'admin') {
        await supabase.auth.signOut();
        setError('此账户无管理员权限');
        setLoading(false);
        return;
      }

      setSuccess(true);

      // 登录成功，等待 session 完全保存后再重定向
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('准备重定向到:', redirect);

      router.push(redirect);
    } catch (err) {
      console.error('登录异常:', err);
      setError('登录失败，请稍后重试');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-xl rounded-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              EchoSpeak Admin
            </h1>
            <p className="text-gray-600">
              管理员控制台
            </p>
          </div>

          {/* 登录表单 */}
          <form onSubmit={handleLogin} className="space-y-6">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@echospeak.test"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                ✓ 登录成功，正在跳转...
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? '登录中...' : success ? '跳转中...' : '登录'}
            </button>
          </form>

          {/* 测试账户提示 */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">
              🔧 测试账户
            </p>
            <div className="text-xs text-blue-800 space-y-1">
              <p><strong>邮箱:</strong> admin@echospeak.test</p>
              <p><strong>密码:</strong> admin1234</p>
            </div>
          </div>

          {/* 底部链接 */}
          <div className="mt-6 text-center">
            <a
              href="http://localhost:5173"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              前往 Learner App →
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
