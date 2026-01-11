import { NextRequest, NextResponse } from 'next/server';
import { getRouter } from '@/lib/ai/router';

/**
 * POST /api/ai/test
 *
 * 测试指定提供商的连接
 *
 * 请求体:
 * {
 *   "provider": string  // 提供商 key (可选，不提供则测试所有)
 * }
 *
 * 响应:
 * {
 *   "results": [
 *     {
 *       "key": string,
 *       "name": string,
 *       "test": ConnectionResult
 *     }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider } = body;

    const router = getRouter();

    if (provider) {
      // 测试指定提供商
      const providerInfo = await router.getProviderInfo(provider);

      if (!providerInfo) {
        return NextResponse.json(
          { error: `Provider "${provider}" not found` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        results: [
          {
            key: provider,
            name: providerInfo.name,
            test: providerInfo.connectionTest,
          },
        ],
      });
    } else {
      // 测试所有提供商
      const providersInfo = await router.getAllProvidersInfo();

      const results = providersInfo.map((info) => ({
        key: info.key,
        name: info.name,
        test: info.connectionTest,
      }));

      return NextResponse.json({
        results,
      });
    }
  } catch (error) {
    console.error('AI test error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
