import { NextRequest, NextResponse } from 'next/server';
import { getRouter } from '@/lib/ai/router';

/**
 * GET /api/ai/models
 *
 * 获取所有可用提供商的模型列表
 *
 * 查询参数:
 * - provider: 可选，指定提供商名称
 *
 * 响应:
 * {
 *   "providers": [
 *     {
 *       "key": string,
 *       "name": string,
 *       "type": string,
 *       "models": ModelInfo[]
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerKey = searchParams.get('provider');

    const router = getRouter();

    if (providerKey) {
      // 获取指定提供商的信息
      const providerInfo = await router.getProviderInfo(providerKey);

      if (!providerInfo) {
        return NextResponse.json(
          { error: `Provider "${providerKey}" not found` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        key: providerKey,
        ...providerInfo,
      });
    } else {
      // 获取所有提供商的信息
      const providersInfo = await router.getAllProvidersInfo();

      return NextResponse.json({
        providers: providersInfo,
      });
    }
  } catch (error) {
    console.error('AI models error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
