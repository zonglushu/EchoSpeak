# AI 多提供商架构使用指南

## 概述

EchoSpeak 现在支持多个 AI 提供商，包括：
- **Google Gemini** - 默认提供商，质量高
- **智谱 GLM** - 性价比高，适合简单任务
- **OpenAI 兼容** - 支持 Azure OpenAI、DeepSeek、Qwen 等

## 架构特点

1. **智能路由** - 根据任务类型自动选择最优提供商
2. **降级机制** - 主提供商失败时自动切换到备用提供商
3. **用量追踪** - 所有请求记录到 Supabase，便于成本分析
4. **统一接口** - 一个 API 支持所有提供商
5. **流式传输** - 支持 SSE 实时反馈

## 环境配置

在 `.env.local` 中配置 AI 提供商：

```bash
# === AI 提供商配置 ===

# 主要 AI 提供商（必需）
GEMINI_API_KEY=your-gemini-api-key

# 智谱 GLM（可选，用于成本优化）
ZHIPU_API_KEY=your-zhipu-api-key

# OpenAI 兼容提供商（可选）
OPENAI_API_KEY=your-openai-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_NAME=OpenAI
OPENAI_MODEL=gpt-3.5-turbo
```

## 使用方法

### 1. 在前端调用（推荐）

```typescript
import { generateProsodyNotation, bilingualizeText, transcribeMedia } from '@echospeak/services';

// 生成发音谱
const annotated = await generateProsodyNotation('Hello world');

// 双语翻译
const subtitles = await bilingualizeText('Hello world');

// 媒体转写
const transcription = await transcribeMedia(base64Data, 'video/mp4');
```

### 2. 直接调用 API

```typescript
// 调用生成 API
const response = await fetch('/api/ai/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    task: 'prosody',
    input: 'Hello world',
    provider: 'zhipu', // 可选，不指定则自动选择
    model: 'glm-4-flash', // 可选
  }),
});

const result = await response.json();
console.log(result.data); // 标注结果
console.log(result.provider); // 实际使用的提供商
console.log(result.latency); // 延迟
console.log(result.cost); // 成本
```

### 3. 流式传输

```typescript
import { streamGenerate } from '@echospeak/services';

await streamGenerate(
  'prosody',
  'Hello world',
  {
    onStart: () => console.log('开始生成'),
    onProgress: (progress) => console.log(`进度: ${progress}%`),
    onDone: (result) => console.log('完成:', result),
    onError: (error) => console.error('错误:', error),
  },
  { provider: 'gemini' }
);
```

## API 端点

### POST /api/ai/generate

统一的 AI 生成端点。

**请求体：**
```json
{
  "task": "prosody" | "bilingualize" | "transcribe",
  "input": any,
  "provider?: string,
  "model?: string,
  "temperature?: number,
  "stream?: boolean
}
```

**响应：**
```json
{
  "data": any,
  "provider": string,
  "model": string,
  "latency": number,
  "tokens?: number,
  "cost?: number
}
```

### GET /api/ai/models

获取可用模型列表。

**查询参数：**
- `provider`: 可选，指定提供商名称

**响应：**
```json
{
  "providers": [
    {
      "key": "gemini",
      "name": "Google Gemini",
      "type": "gemini",
      "models": [
        { "id": "gemini-3-flash-preview", "name": "Gemini 3 Flash", ... }
      ]
    }
  ]
}
```

### POST /api/ai/test

测试提供商连接。

**请求体：**
```json
{
  "provider?: string  // 不提供则测试所有
}
```

**响应：**
```json
{
  "results": [
    {
      "key": "gemini",
      "name": "Google Gemini",
      "test": {
        "success": true,
        "message": "连接成功",
        "latency": 1234
      }
    }
  ]
}
```

## 智能路由策略

**默认策略：优先使用智谱 GLM**

所有任务（打谱、翻译、转写）默认都使用智谱 GLM，原因：
- ✅ 成本极低（文本任务比 Gemini 便宜 81%，转写免费）
- ✅ 支持视频理解（GLM-4.6V）
- ✅ 质量优秀

**降级策略：**
1. 智谱 GLM 不可用 → 自动切换到 Gemini
2. 用户明确指定提供商 → 使用用户的选择

**模型选择：**
- 文本任务（打谱、翻译）→ `glm-4-flash`（高性价比）
- 视频转写 → `glm-4.6v-flash`（免费）或 `glm-4.6v`（高质量）

### 路由优先级

```
用户指定提供商 > 智谱 GLM > Gemini > 其他可用提供商
```

## 用量追踪

所有 AI 请求都会记录到 Supabase `ai_usage_logs` 表：

```sql
-- 查看用量统计
SELECT * FROM ai_usage_summary;

-- 按提供商统计
SELECT
  provider,
  COUNT(*) as total_requests,
  SUM(cost) as total_cost
FROM ai_usage_logs
GROUP BY provider;

-- 查看最近的错误
SELECT * FROM ai_usage_logs
WHERE status = 'error'
ORDER BY created_at DESC
LIMIT 10;
```

## 成本对比（估算）

| 提供商 | 模型 | 输入成本 | 输出成本 |
|--------|------|---------|---------|
| Gemini | gemini-3-flash-preview | $0.000075/1K | $0.0003/1K |
| 智谱 GLM (文本) | glm-4-flash | ¥0.0001/1K (≈$0.000014) | ¥0.0001/1K (≈$0.000014) |
| 智谱 GLM (视觉) | glm-4.6v | ¥1/百万 (≈$0.00014/1K) | ¥3/百万 (≈$0.00042/1K) |
| 智谱 GLM (视觉) | glm-4.6v-flash | **免费** | **免费** |
| OpenAI | gpt-3.5-turbo | $0.0005/1K | $0.0015/1K |

**结论：**
- 简单文本任务用智谱 GLM-4-Flash 可节省约 **81%** 成本
- 视频转写用智谱 GLM-4.6V-Flash **完全免费**，比 Gemini 节省 **100%**
- 即使使用付费的 GLM-4.6V，也比 Gemini 便宜约 **50%**

## 向后兼容性

旧的 Gemini 客户端仍然可用：

```typescript
import { generateProsodyNotation as oldGenerateProsody } from '@echospeak/services';

// 仍然有效，直接调用 Gemini
const result = await oldGenerateProsody('Hello world', { apiKey: '...' });
```

**建议：** 新代码使用新的 AI 客户端以享受多提供商和智能路由。

## 故障排查

### 问题：API 返回 "Provider not found"

**原因：** 未配置该提供商的 API Key。

**解决：** 在 `.env.local` 中添加对应的 API Key。

### 问题：智谱 GLM 转写视频失败

**可能原因：**
1. 视频文件太大，超过模型限制（建议压缩到 100MB 以下）
2. 使用了错误的模型（转写需要使用 `glm-4.6v`）
3. API Key 权限不足

**解决方案：**
- 确保使用 `model: 'glm-4.6v'` 参数
- 压缩视频文件
- 检查智谱 API Key 是否有视觉模型权限

### 问题：连接超时

**原因：** API 请求超时（默认 2 分钟）。

**解决：** 在调用时增加超时时间：

```typescript
await generateProsodyNotation(text, {
  config: { timeout: 300000 } // 5 分钟
});
```

## 下一步

- [ ] 添加管理后台的用量监控仪表板
- [ ] 实现真正的流式传输（需要提供商支持）
- [ ] 添加更多提供商（Claude、Qwen 等）
- [ ] 实现基于历史数据的智能路由优化
