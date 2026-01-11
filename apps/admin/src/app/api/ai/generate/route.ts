import { NextRequest, NextResponse } from 'next/server';
import { getRouter, type TaskType } from '@/lib/ai/router';

/**
 * POST /api/ai/generate
 *
 * 统一的 AI 生成端点
 *
 * 请求体:
 * {
 *   "task": "prosody" | "bilingualize" | "transcribe",
 *   "input": any,
 *   "provider?: string,
 *   "model?: string,
 *   "temperature?: number,
 *   "maxTokens?: number,
 *   "stream?: boolean
 * }
 *
 * 响应:
 * {
 *   "data": any,
 *   "provider": string,
 *   "model": string,
 *   "latency": number,
 *   "tokens?: number,
 *   "cost?: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task, input, provider, model, temperature, maxTokens, stream } = body;

    // 验证必需参数
    if (!task) {
      return NextResponse.json({ error: 'Missing required field: task' }, { status: 400 });
    }

    if (!input) {
      return NextResponse.json({ error: 'Missing required field: input' }, { status: 400 });
    }

    // 验证任务类型
    const validTasks = ['prosody', 'bilingualize', 'transcribe'];
    if (!validTasks.includes(task)) {
      return NextResponse.json(
        { error: `Invalid task. Must be one of: ${validTasks.join(', ')}` },
        { status: 400 }
      );
    }

    // 如果请求流式传输，使用流式响应
    if (stream) {
      return streamResponse(task as TaskType, input, { provider, model, temperature, maxTokens });
    }

    // 执行任务
    const router = getRouter();
    const result = await router.execute(task as TaskType, input, {
      provider,
      model,
      temperature,
      maxTokens,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI generate error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * 流式响应 (SSE)
 */
async function streamResponse(
  task: TaskType,
  input: unknown,
  options: {
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const router = getRouter();

        // 发送开始事件
        const startEvent = `data: ${JSON.stringify({ type: 'start', task })}\n\n`;
        controller.enqueue(encoder.encode(startEvent));

        // 执行任务（注意：当前实现不支持真正的流式，只是模拟）
        // TODO: 实现真正的流式传输需要提供商支持
        const result = await router.execute(task, input, options);

        // 发送进度事件
        const progressEvent = `data: ${JSON.stringify({ type: 'progress', progress: 100 })}\n\n`;
        controller.enqueue(encoder.encode(progressEvent));

        // 发送完成事件
        const doneEvent = `data: ${JSON.stringify({ type: 'done', result })}\n\n`;
        controller.enqueue(encoder.encode(doneEvent));

        // 发送结束标记
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        console.error('Stream error:', error);

        // 发送错误事件
        const errorEvent = `data: ${JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })}\n\n`;
        controller.enqueue(encoder.encode(errorEvent));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
