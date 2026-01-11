import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Admin App 中间件
 * 仅允许管理员账户登录
 */
export async function middleware(request: NextRequest) {
  const cookieStore = await cookies();

  // 创建响应对象以支持 cookie 设置
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          cookieStore.delete({
            name,
            ...options,
          });
        },
      },
    }
  );

  // 检查用户是否已登录
  const { data: { user } } = await supabase.auth.getUser();

  // 未登录用户重定向到登录页
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // 检查是否为管理员
  const userRole = user?.user_metadata?.role;

  if (userRole !== 'admin') {
    // 非管理员用户，拒绝访问
    const errorUrl = new URL('/unauthorized', request.url);
    return NextResponse.redirect(errorUrl);
  }

  // 管理员用户，允许访问
  return response;
}

/**
 * 配置中间件匹配路径
 * 保护所有 /admin 和 / 路径，除了登录页面
 */
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - /login (登录页)
     * - /unauthorized (未授权页面)
     * - /api/auth/* (认证 API)
     * - /_next/* (Next.js 内部)
     * - 静态文件
     */
    '/((?!login|unauthorized|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
