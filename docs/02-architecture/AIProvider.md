  📌 核心架构分析

  1. 统一的 LLM 客户端抽象

  // lib/llm-client.js 的核心设计
  export async function callLLM(config, messages, onChunk) {
    const { type, baseUrl, apiKey, model } = config;

    if (type === 'openai') {
      return callOpenAI(baseUrl, apiKey, model, messages, onChunk);
    } else if (type === 'anthropic') {
      return callAnthropic(baseUrl, apiKey, model, messages, onChunk);
    }
  }

  关键优势：
  - ✅ 策略模式：通过 type 字段路由到不同的提供商
  - ✅ 统一接口：所有模型都用相同的调用方式
  - ✅ 可扩展：添加新模型只需增加新的 callXxx() 函数

  2. 流式传输实现 (SSE)

  // app/api/generate/route.js
  const stream = new ReadableStream({
    async start(controller) {
      await callLLM(finalConfig, fullMessages, (chunk) => {
        const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
        controller.enqueue(encoder.encode(data));
      });
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    }
  });

  核心价值：
  - ⚡ 实时反馈，提升用户体验
  - 🔄 支持长时间生成任务（如打谱、转写）
  - 💰 成本优化（按 token 计费时可以提前终止）

  3. 配置灵活性（双模式）

  // 模式 1：客户端配置（用户自己填 API Key）
  const finalConfig = config; // 直接使用前端传来的配置

  // 模式 2：服务端配置（环境变量 + 密码保护）
  if (accessPassword) {
    finalConfig = {
      type: process.env.SERVER_LLM_TYPE,
      baseUrl: process.env.SERVER_LLM_BASE_URL,
      apiKey: process.env.SERVER_LLM_API_KEY,
      model: process.env.SERVER_LLM_MODEL,
    };
  }

  设计亮点：
  - 🔐 安全：服务端模式下 API Key 不暴露给前端
  - 🎯 灵活：开发时用客户端配置，生产环境用服务端配置
  - 💼 多租户友好：可以为不同用户配置不同的后端

  4. 模型发现与测试

  // lib/llm-client.js
  export async function fetchModels(type, baseUrl, apiKey) {
    const url = `${baseUrl}/models`;
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}` }});
    const data = await response.json();
    return data.data.map(model => ({ id: model.id, name: model.name }));
  }

  export async function testConnection(config) {
    const models = await fetchModels(config.type, config.baseUrl, config.apiKey);
    return { success: true, message: `连接成功，找到 ${models.length} 个可用模型` };
  }

  实用价值：
  - 🔍 动态模型列表：不需要硬编码模型名称
  - ✅ 连接测试：配置 UI 可以让用户测试 API 是否可用
  - 📊 兼容性检查：验证 API 格式是否正确

  🎯 对比我的方案

  | 维度       | smart-excalidraw-next    | 我之前的建议            |
  |------------|--------------------------|-------------------------|
  | 实现复杂度 | ⭐⭐ 简单                | ⭐⭐⭐⭐ 较复杂         |
  | 部署成本   | Next.js 自带，零额外成本 | 需要 Supabase Functions |
  | 流式支持   | ✅ 原生 SSE              | ❌ 没考虑               |
  | 模型发现   | ✅ 动态获取              | ❌ 硬编码               |
  | 监控追踪   | ❌ 无                    | ✅ 数据库记录           |
  | 路由策略   | 手动选择                 | 自动成本优化            |
  | 多模态     | ✅ 文本+图片             | ❌ 没考虑               |

  💡 改进建议：混合方案

  结合两者的优点，我建议为 EchoSpeak 设计这样的架构：

  方案设计

  apps/admin (Next.js)
  ├── app/api/
  │   ├── ai/generate/route.ts        # 主生成端点
  │   ├── ai/test/route.ts            # 连接测试
  │   └── ai/models/route.ts          # 模型发现
  ├── lib/
  │   ├── ai/
  │   │   ├── providers/              # 提供商实现
  │   │   │   ├── base.ts            # 基础接口
  │   │   │   ├── gemini.ts          # Gemini 实现
  │   │   │   ├── zhipu.ts           # 智谱实现
  │   │   │   └── openai-compatible.ts # OpenAI 格式兼容
  │   │   ├── router.ts               # 智能路由
  │   │   └── client.ts               # 统一客户端
  │   └── db/
  │       └── ai-usage.ts            # 用量追踪（Supabase）

  核心代码框架

  // lib/ai/providers/base.ts
  export interface AIProvider {
    name: string;
    type: 'gemini' | 'zhipu' | 'openai';

    // 核心方法
    generateProsody(sentence: string, options?: GenerateOptions): Promise<string>;
    bilingualizeText(text: string, options?: GenerateOptions): Promise<TranscriptLine[]>;
    transcribeMedia(data: string, mimeType: string): Promise<TranscriptLine[]>;

    // 元能力
    fetchModels(): Promise<ModelInfo[]>;
    testConnection(): Promise<ConnectionResult>;
    estimateCost(operation: string, tokens: number): number;
  }

  // lib/ai/providers/zhipu.ts
  export class ZhipuProvider implements AIProvider {
    name = '智谱 GLM';
    type = 'zhipu' as const;

    private baseUrl = 'https://open.bigmodel.cn/api/paas/v4/';

    constructor(private apiKey: string) {}

    async generateProsody(sentence: string): Promise<string> {
      const response = await fetch(`${this.baseUrl}chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'glm-4-flash',
          messages: [{
            role: 'user',
            content: `为以下句子标注发音谱：\n${sentence}\n\n标注要求：\n- **BOLD CAPS**: 主重音\n- *Italics*: 次重音\n- [ə]: 元音弱读\n- _:  连读\n- ↘/↗: 语调\n\n只返回标注后的句子。`
          }]
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    }

    // 实现其他方法...
  }

  // lib/ai/router.ts
  export class AIProviderRouter {
    private providers: Map<string, AIProvider>;

    constructor() {
      this.providers = new Map([
        ['gemini', new GeminiProvider(process.env.GEMINI_API_KEY!)],
        ['zhipu', new ZhipuProvider(process.env.ZHIPU_API_KEY!)],
      ]);
    }

    async execute(task: string, input: unknown, options?: { provider?: string }) {
      // 1. 选择提供商
      const provider = options?.provider
        ? this.providers.get(options.provider)!
        : this.selectBestProvider(task);

      // 2. 执行任务
      const startTime = Date.now();
      let result;

      try {
        switch (task) {
          case 'prosody':
            result = await provider.generateProsody(input as string);
            break;
          case 'bilingualize':
            result = await provider.bilingualizeText(input as string);
            break;
          case 'transcribe':
            result = await provider.transcribeMedia(input.data, input.mimeType);
            break;
        }

        const latency = Date.now() - startTime;

        // 3. 记录到数据库
        await this.logUsage({
          provider: provider.name,
          task,
          latency,
          status: 'success',
        });

        return { data: result, provider: provider.name, latency };
      } catch (error) {
        // 记录失败
        await this.logUsage({
          provider: provider.name,
          task,
          status: 'error',
          error: error.message,
        });

        // 尝试降级到备用提供商
        if (!options?.provider) {
          console.warn(`${provider.name} 失败，降级到备用模型`);
          return this.execute(task, input, { provider: 'gemini' });
        }

        throw error;
      }
    }

    private selectBestProvider(task: string): AIProvider {
      // 策略：简单任务用便宜的，复杂任务用质量好的
      const costOptimized = ['bilingualize'];
      const qualityFocused = ['prosody', 'transcribe'];

      if (costOptimized.includes(task)) {
        return this.providers.get('zhipu')!;
      }

      return this.providers.get('gemini')!;
    }

    private async logUsage(log: UsageLog) {
      // 写入 Supabase ai_usage_logs 表
      await supabase.from('ai_usage_logs').insert(log);
    }
  }

  // app/api/ai/generate/route.ts
  import { AIProviderRouter } from '@/lib/ai/router';

  const router = new AIProviderRouter();

  export async function POST(request: NextRequest) {
    const { task, input, provider } = await request.json();

    // 支持流式传输（可选）
    if (request.headers.get('accept') === 'text/event-stream') {
      return streamResponse(task, input, provider);
    }

    const result = await router.execute(task, input, { provider });

    return NextResponse.json(result);
  }

  🚀 实施建议

  阶段 1：基础框架（1周）

  - 创建 lib/ai/providers/ 目录结构
  - 实现 AIProvider 基础接口
  - 迁移现有 Gemini 代码到 GeminiProvider
  - 实现 ZhipuProvider（智谱 SDK 集成）

  阶段 2：路由与监控（1周）

  - 实现 AIProviderRouter
  - 添加 Supabase ai_usage_logs 表
  - 实现用量追踪逻辑

  阶段 3：API 层（1周）

  - 创建 /api/ai/generate 端点
  - 创建 /api/ai/models 端点（模型发现）
  - 创建 /api/ai/test 端点（连接测试）
  - 支持流式传输（SSE）

  阶段 4：前端集成（1周）

  - 重构 packages/services 调用新 API
  - 管理后台添加"模型配置"页面
  - 添加用量监控仪表板

  💰 成本对比（基于智谱定价）

  | 任务             | Gemini    | 智谱 GLM-4-Flash     | 节省 |
  |------------------|-----------|----------------------|------|
  | 翻译 (1K tokens) | $0.000075 | ¥0.0001 (≈$0.000014) | 81%  |
  | 打谱 (1K tokens) | $0.000075 | ¥0.0001 (≈$0.000014) | 81%  |

  结论：简单任务优先用智谱，每天处理 10 万 tokens 可省 $6-7

  ✅ 最终建议

  1. 立即开始：参考 smart-excalidraw-next 的简洁设计，先做基础版本
  2. 保留监控：加入 Supabase 日志记录，便于成本分析
  3. 渐进式迁移：
    - 第 1 步：重构现有代码，支持双模型
    - 第 2 步：添加智能路由和降级
    - 第 3 步：完善监控和优化策略
---

## ✅ 实施状态（2025-12-31）

所有核心功能已完成实施：

### 已完成 ✅

1. ✅ **基础框架**
   - 创建 `apps/admin/src/lib/ai/providers/` 目录结构
   - 实现 `AIProvider` 基础接口
   - 实现 `GeminiProvider`（迁移现有代码）
   - 实现 `ZhipuProvider`（智谱 GLM 集成）
   - 实现 `OpenAICompatibleProvider`（支持 Azure OpenAI、DeepSeek、Qwen 等）

2. ✅ **路由与监控**
   - 实现 `AIProviderRouter` 智能路由器
   - 创建 Supabase `ai_usage_logs` 表
   - 实现用量追踪逻辑（`lib/db/ai-usage.ts`）
   - 数据库迁移已执行

3. ✅ **API 层**
   - 创建 `/api/ai/generate` 端点（统一生成接口）
   - 创建 `/api/ai/models` 端点（模型发现）
   - 创建 `/api/ai/test` 端点（连接测试）
   - 支持流式传输（SSE）

4. ✅ **前端集成**
   - 创建 `packages/services/src/ai-client.ts` 新客户端
   - 保持向后兼容（旧 `gemini.ts` 仍可用）
   - 添加环境变量配置（`.env.local.example`）

### 使用文档

详细使用指南请参考：[AI_PROVIDER_GUIDE.md](./AI_PROVIDER_GUIDE.md)

### 关键文件

- **提供商实现**: `apps/admin/src/lib/ai/providers/`
  - `base.ts` - 基础接口
  - `gemini.ts` - Gemini 实现
  - `zhipu.ts` - 智谱实现
  - `openai-compatible.ts` - OpenAI 兼容实现

- **路由器**: `apps/admin/src/lib/ai/router.ts`
- **用量追踪**: `apps/admin/src/lib/db/ai-usage.ts`
- **API 端点**: `apps/admin/src/app/api/ai/`
- **客户端**: `packages/services/src/ai-client.ts`

### 环境变量

在 `.env.local` 中添加：

```bash
# 智谱 GLM（可选）
ZHIPU_API_KEY=your-zhipu-api-key

# OpenAI 兼容（可选）
OPENAI_API_KEY=your-openai-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_NAME=OpenAI
OPENAI_MODEL=gpt-3.5-turbo
```

### 智能路由策略

- `bilingualize` → 智谱 GLM（成本优化）
- `prosody` → Gemini（质量优先）
- `transcribe` → Gemini（多模态支持）

自动降级：主提供商失败时切换到备用提供商。

### 成本节省

使用智谱 GLM 处理简单任务可节省约 **81%** 成本。
