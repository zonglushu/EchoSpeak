'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, memo } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { href: '/', label: '内容管理', icon: '📊' },
  { href: '/processing', label: '生产工作台', icon: '🎬' },
  { href: '/moderation', label: '内容审核', icon: '📋', badge: '23' },
  { href: '/analytics', label: '成本分析', icon: '💰' },
  { href: '/quota', label: '配额管理', icon: '⚡' },
];

// 单例模式：避免重复创建 Supabase 客户端
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseInstance;
};

// 使用 React.memo 避免不必要的重渲染
const NavLink = memo(({ href, label, icon, badge, isActive }: NavItem & { isActive: boolean }) => (
  <Link
    href={href}
    className={`relative inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary/10 text-primary'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <span className="text-base">{icon}</span>
    <span>{label}</span>
    {badge && (
      <span className="ml-1 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-medium text-white">
        {badge}
      </span>
    )}
  </Link>
));

NavLink.displayName = 'NavLink';

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  // 使用 useMemo 避免每次渲染都创建新实例
  const supabase = useMemo(() => getSupabaseClient(), []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // 隐藏导航栏在登录和未授权页面
  if (pathname === '/login' || pathname === '/unauthorized') {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-500 text-sm font-bold text-white">
              ES
            </div>
            <span className="text-lg font-semibold text-slate-900">EchoSpeak Admin</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} isActive={pathname === item.href} />
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title="退出登录"
            >
              退出登录
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-500 text-xs font-medium text-white">
              AD
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
