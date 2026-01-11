import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

type PublishRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, context: PublishRouteContext) {
  const { id: assetId } = await context.params;
  await new Promise((resolve) => setTimeout(resolve, 600));
  return NextResponse.json({
    id: assetId,
    status: 'published',
    publishedAt: new Date().toISOString(),
    message: '已推送至学员端并触发 Webhook',
  });
}
