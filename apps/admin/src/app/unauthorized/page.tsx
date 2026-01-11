import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            访问被拒绝
          </h1>
          <p className="text-gray-600 mb-6">
            此页面仅供管理员访问。普通用户请使用{' '}
            <a
              href="http://localhost:5173"
              className="text-blue-600 hover:underline"
            >
              Learner App
            </a>
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">
              测试账户信息：
            </h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>📧 <strong>管理员</strong>: admin@echospeak.test</p>
              <p>🔑 <strong>密码</strong>: admin1234</p>
              <p className="mt-3 text-xs">
                ℹ️ 管理员仅可登录 Admin App（当前站点）
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回登录
            </Link>
            <a
              href="http://localhost:5173"
              className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              前往 Learner App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
