import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * 用户菜单组件
 */
export function UserMenu() {
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // 获取当前用户
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    // 刷新页面以更新状态
    window.location.reload();
  };

  if (!user) {
    return null;
  }

  const userTier = user?.user_metadata?.tier || 'free';
  const tierColors = {
    free: 'bg-gray-100 text-gray-800',
    pro: 'bg-blue-100 text-blue-800',
    premium: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
          {user.email?.[0].toUpperCase()}
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-gray-900">
            {user.user_metadata?.full_name || user.email}
          </p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      </button>

      {menuOpen && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-[45]"
            onClick={() => setMenuOpen(false)}
          />

          {/* 下拉菜单 */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-[50]">
            <div className="p-4 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">
                {user.user_metadata?.full_name || '用户'}
              </p>
              <p className="text-xs text-gray-500 mt-1">{user.email}</p>
              <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${tierColors[userTier as keyof typeof tierColors]}`}>
                {userTier === 'free' && '🔰 免费版'}
                {userTier === 'pro' && '💎 专业版'}
                {userTier === 'premium' && '👑 高级版'}
              </span>
            </div>

            <div className="p-2">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  // TODO: 打开设置页面
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ⚙️ 设置
              </button>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                🚪 登出
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
