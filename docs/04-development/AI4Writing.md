> 现在我们来想 一个逻辑，用户上传一个YouTube链接后，我们提取出字幕后，还需要用AI为每个字幕都写发音谱子，但是这个发音谱子我们需要入库嘛，因     
为用AI转写成本很大，如果用户随便就传一个链接我们就为其转写谱子，成本不够，但是如果入库的话，是不是还需要把链接跟发音谱子一块存一下 
，但是这样存储的话，就跟之前我们的让用户随意上传链接的需求就不一样，你去网络上搜索一下看看有没有类似的软件/解决方案设计的 

● Web Search("language learning app YouTube video pronunciation annotation cache strategy design")
  ⎿  Did 5 searches in 25s

● Web Search("prosody annotation AI generation cost control caching solution architecture")
  ⎿  Did 1 search in 7s

● Web Search("video subtitle processing queue system async task design pattern")
  ⎿  Did 1 search in 16s

● Web Search("education app user generated content moderation storage strategy 2024")
  ⎿  Did 5 searches in 15s

● 非常好的问题！这是很多 AI 教育应用面临的核心挑战。让我基于搜索结果给你提供几种成熟的解决方案：

  🎯 核心问题分析

  你的困境：
  - ✅ 需求：让用户随意上传 YouTube 链接
  - ❌ 成本：AI 生成发音谱子很贵
  - ❌ 冲突：缓存存储 vs 灵活性

  ---
  📊 行业最佳实践方案

  根据搜索结果，我整理了 3 种主流设计方案：

  方案 1：异步处理 + 内容库模式（推荐） ⭐

  核心理念：区分"用户内容"和"平台内容库"

  ┌─────────────────────────────────────────────────────────┐
  │                    用户上传流程                          │
  ├─────────────────────────────────────────────────────────┤
  │ 1. 用户粘贴 YouTube 链接                                │
  │ 2. 系统检查：是否已在内容库？                             │
  │    ├─ 是 → 直接展示（成本：$0）                          │
  │    └─ 否 → 提示用户："添加到处理队列"                     │
  │ 3. 后台异步处理（无需等待）                               │
  │ 4. 完成后通知用户                                         │
  └─────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────┐
  │                  内容库管理策略                          │
  ├─────────────────────────────────────────────────────────┤
  │ ✓ 热门/精选视频：管理员预先处理，入内容库                  │
  │ ✓ 用户上传：处理5个免费额度后，需审核才能入库              │
  │ ✓ 去重机制：YouTube ID + 语言版本                         │
  │ ✓ 过期策略：30天无人访问 → 标记为"冷数据"                  │
  └─────────────────────────────────────────────────────────┘

  数据表设计：

  -- 内容库表（只存储经过处理的视频）
  CREATE TABLE content_library (
    id UUID PRIMARY KEY,
    youtube_id VARCHAR(20) UNIQUE NOT NULL,
    language_code VARCHAR(5),

    -- 原始字幕
    subtitles_json JSONB,

    -- AI 生成的发音谱子（昂贵数据）
    prosody_annotations JSONB,
    generated_at TIMESTAMP,

    -- 使用统计
    view_count INT DEFAULT 0,
    last_viewed_at TIMESTAMP,
    is_featured BOOLEAN DEFAULT FALSE, -- 精选内容

    -- 质量控制
    moderation_status VARCHAR(20), -- 'pending', 'approved', 'rejected'
    moderated_by UUID REFERENCES admin_users(id),

    -- 成本控制
    processing_cost DECIMAL(10,2), -- 记录成本
    is_free_tier BOOLEAN DEFAULT TRUE -- 免费额度内容

    created_at TIMESTAMP DEFAULT NOW()
  );

  -- 用户处理历史表（限制滥用）
  CREATE TABLE user_processing_history (
    id UUID PRIMARY KEY,
    user_id UUID,
    youtube_id VARCHAR(20),
    status VARCHAR(20), -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- 异步任务队列表
  CREATE TABLE processing_queue (
    id UUID PRIMARY KEY,
    youtube_id VARCHAR(20) UNIQUE NOT NULL,
    requested_by UUID,
    priority INT DEFAULT 0, -- 精选内容优先级高
    status VARCHAR(20),
    error_message TEXT,
    created_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
  );

  优点：
  - ✅ 平衡成本和灵活性
  - ✅ 可以逐步建立优质内容库
  - ✅ 用户体验流畅（异步处理）
  - ✅ 防止滥用（配额限制）

  缺点：
  - ⚠️ 用户不能立即使用所有链接
  - ⚠️ 需要后台任务系统

  ---
  方案 2：分层处理策略（成本优化）

  核心理念：不同内容用不同处理策略

  ┌─────────────────────────────────────────────────────────┐
  │              内容分层处理策略                            │
  ├─────────────────────────────────────────────────────────┤
  │                                                          │
  │  🔴 Layer 1: 原始字幕（即时，$0）                        │
  │     - 提取 YouTube 字幕                                  │
  │     - 直接展示，无 AI 注释                               │
  │                                                          │
  │  🟡 Layer 2: 基础AI处理（异步，低成本）                  │
  │     - 简单重音标记（正则规则）                           │
  │     - 翻译（调用翻译API）                                │
  │     - 成本：~$0.01/视频                                 │
  │                                                          │
  │  🟢 Layer 3: 完整AI处理（异步，高成本）                  │
  │     - 完整韵律标注（Gemini Pro）                         │
  │     - AI 翻译 + 上下文理解                              │
  │     - 成本：~$0.05-0.10/视频                            │
  │                                                          │
  └─────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────┐
  │              用户决策流程                                │
  ├─────────────────────────────────────────────────────────┤
  │  用户上传链接 → 立即展示 Layer 1                         │
  │                ↓                                        │
  │           提示升级：                                    │
  │           "开启完整AI分析？"                             │
  │           ├─ 基础版（免费）                              │
  │           └─ 完整版（消耗积分/配额）                      │
  └─────────────────────────────────────────────────────────┘

  实现逻辑：

  // apps/admin/src/services/contentProcessor.ts

  export class ContentProcessor {
    async processYouTubeLink(youtubeId: string, tier: 'basic' | 'full') {

      // Layer 1: 总是执行（即时）
      const rawSubtitles = await this.extractSubtitles(youtubeId);

      // 立即返回，用户可以先看原始字幕
      if (tier === 'basic') {
        return {
          status: 'ready',
          data: await this.basicProcessing(rawSubtitles)
        };
      }

      // Layer 2/3: 异步处理
      return {
        status: 'processing',
        data: rawSubtitles,
        taskId: await this.enqueueProcessing(youtubeId, tier)
      };
    }

    private async basicProcessing(subtitles: Subtitle[]) {
      // 规则-based 标注（几乎免费）
      return subtitles.map(sub => ({
        ...sub,
        stress: this.detectStressWithRules(sub.text), // 正则匹配
        intonation: this.detectIntonationWithPunctuation(sub.text)
      }));
    }

    private async fullProcessing(subtitles: Subtitle[]) {
      // 调用 Gemini（昂贵）
      return await generateProsodyNotation(subtitles);
    }
  }

  优点：
  - ✅ 降低 80% 的 AI 成本
  - ✅ 用户立即获得价值
  - ✅ 可渐进式升级

  ---
  方案 3：智能缓存 + 配额系统（混合模式）

  核心理念：LRU 缓存 + 用户配额

  // 智能缓存策略
  export class SmartCacheManager {

    async getOrGenerate(youtubeId: string, userId: string) {
      // 1. 检查全局缓存（热门内容）
      const globalCache = await this.checkGlobalCache(youtubeId);
      if (globalCache) return globalCache;

      // 2. 检查用户配额
      const userQuota = await this.checkUserQuota(userId);

      if (userQuota.remaining > 0) {
        // 3. 生成并缓存
        const result = await this.generateAndCache(youtubeId);

        // 4. 扣除配额
        await this.deductQuota(userId, youtubeId);

        return result;
      } else {
        // 5. 配额不足，返回原始字幕
        return {
          tier: 'free',
          data: await this.extractRawSubtitles(youtubeId),
          message: '今日AI配额已用完，明天再来吧！'
        };
      }
    }

    // 缓存淘汰策略
    private async evictColdData() {
      // 30天未访问 OR 浏览量 < 10 的内容
      await db.query(`
        DELETE FROM content_library
        WHERE last_viewed_at < NOW() - INTERVAL '30 days'
        AND view_count < 10
        AND NOT is_featured
      `);
    }
  }

  用户配额设计：

  ┌─────────────────────────────────────────────────────────┐
  │              配额层级设计                                │
  ├─────────────────────────────────────────────────────────┤
  │  免费用户：3 个视频/天                                   │
  │  Pro 用户：50 个视频/天                                  │
  │  团队版：无限 + 优先处理                                  │
  │                                                          │
  │  特殊规则：                                              │
  │  ✓ 用户上传的内容：如果浏览量 > 100，自动升级为精选       │
  │  ✓ 精选内容：不消耗用户配额                              │
  │  ✓ 分享奖励：邀请好友 → +5 个配额                        │
  └─────────────────────────────────────────────────────────┘

  ---
  🔧 技术实现：异步任务系统

  基于搜索结果中的 Event-Driven Architecture 模式（参考：https://gcore.com/blog/event-driven-ai-architectures）：

  // apps/admin/src/background/jobs/processor.ts

  import { Queue, Worker } from 'bullmq';

  // 创建处理队列
  export const subtitleProcessingQueue = new Queue('subtitle-processing', {
    connection: redis
  });

  // Worker：处理实际任务
  const worker = new Worker('subtitle-processing', async (job) => {
    const { youtubeId, userId, tier } = job.data;

    try {
      // 1. 提取字幕
      const subtitles = await fetchYouTubeCaptions(youtubeId);

      // 2. AI 处理
      const prosodyData = await generateProsodyNotation(subtitles);

      // 3. 存储到数据库
      await db.contentLibrary.create({
        youtube_id: youtubeId,
        subtitles_json: subtitles,
        prosody_annotations: prosodyData,
        view_count: 0,
        is_featured: false
      });

      // 4. 更新队列状态
      await job.updateProgress(100);

      return { success: true };
    } catch (error) {
      await job.moveToFailed({ message: error.message });
      throw error;
    }
  }, {
    connection: redis,
    concurrency: 5 // 限制并发，控制成本
  });

  // API：用户请求处理
  export async function POST(request: NextRequest) {
    const { youtubeId } = await request.json();
    const userId = getUserId(request);

    // 检查是否已存在
    const existing = await db.contentLibrary.findUnique({
      where: { youtube_id: youtubeId }
    });

    if (existing) {
      return Response.json({ status: 'ready', data: existing });
    }

    // 检查配额
    const quota = await checkUserQuota(userId);
    if (quota.remaining <= 0) {
      return Response.json({
        status: 'quota_exceeded',
        message: '今日配额已用完'
      }, { status: 429 });
    }

    // 加入队列
    const job = await subtitleProcessingQueue.add('process', {
      youtubeId,
      userId,
      tier: 'full'
    });

    return Response.json({
      status: 'processing',
      jobId: job.id,
      estimatedTime: '2-5 分钟'
    });
  }

  ---
  📈 推荐方案对比

  | 维度       | 方案1：异步+内容库 | 方案2：分层处理 | 方案3：智能缓存 |
  |------------|--------------------|-----------------|-----------------|
  | 用户体验   | ⭐⭐⭐⭐           | ⭐⭐⭐⭐⭐      | ⭐⭐⭐⭐        |
  | 成本控制   | ⭐⭐⭐⭐⭐         | ⭐⭐⭐⭐        | ⭐⭐⭐⭐        |
  | 开发复杂度 | ⭐⭐⭐             | ⭐⭐            | ⭐⭐⭐⭐        |
  | 扩展性     | ⭐⭐⭐⭐⭐         | ⭐⭐⭐⭐        | ⭐⭐⭐⭐        |
  | 适合场景   | 长期运营           | 快速MVP         | 成熟产品        |

  ---
  🎯 我的推荐：混合方案

  结合方案 1 + 方案 2：

  // 最终推荐实现
  export class YouTubeLinkHandler {

    async handleUserSubmission(youtubeId: string, userId: string) {

      // 1️⃣ 总是先提取原始字幕（即时，免费）
      const rawSubtitles = await this.extractSubtitles(youtubeId);

      // 2️⃣ 立即返回，让用户先看内容
      const immediateResponse = {
        status: 'ready',
        tier: 'basic',
        data: rawSubtitles,
        canUpgrade: true
      };

      // 3️⃣ 后台：检查是否需要升级处理
      this.backgroundCheck(youtubeId, userId);

      return immediateResponse;
    }

    private async backgroundCheck(youtubeId: string, userId: string) {

      // 检查是否已有完整处理版本
      const cached = await this.checkCache(youtubeId);
      if (cached?.prosody_annotations) {
        // 通知用户可以升级
        this.notifyUser(userId, 'full_version_available');
        return;
      }

      // 检查用户配额
      const quota = await this.getUserQuota(userId);
      if (quota.remaining > 0) {
        // 自动加入处理队列（免费）
        await this.enqueueProcessing(youtubeId, userId, 'auto');
      }
    }
  }

  ---
  📚 参考资源

  - https://medium.com/@kiranvutukuri/asynchronous-processing-in-system-design-part-22-56c821477286
  - https://gcore.com/blog/event-driven-ai-architectures
  - https://www.systemdesignhandbook.com/guides/design-youtube/
  - https://assets.amazon.science/ed/22/a38559fa46f683a25325737a661e/caching-networks-capitalizing-on-common-speech-for-asr.pdf

  ---
  🌍 行业最佳实践案例研究

  基于 2024-2025 年的行业调研，以下是成功语言学习平台的关键策略：

  **Duolingo 的成功要素**（来源：[ResearchGate 战略分析](https://www.researchgate.net/publication/366354830_STRATEGIC_ANALYSIS_OF_DUOLINGO_LANGUAGE_LEARNING_PLATFORM)、[AI 策略报告](https://chiefaiofficer.com/blog/blog/duolingos-ai-strategy-fuels-51-user-growth-and-1b-revenue/)）

  ┌─────────────────────────────────────────────────────────┐
  │              Duolingo 的核心策略                        │
  ├─────────────────────────────────────────────────────────┤
  │  ✅ AI-First 方法：                                      │
  │     - 使用 GPT-4 生成个性化练习和解释                    │
  │     - AI 辅助的角色对话（Roleplay Chat）                 │
  │     - 实现了 51% 用户增长和 $10 亿收入                   │
  │                                                          │
  │  ✅ 成本管理（FinOps）：                                 │
  │     - 使用 CDN 缓存（schools-cdn.duolingo.com）          │
  │     - 边缘缓存减少服务器负载                             │
  │     - 云成本优化策略（来源：[InfoQ](https://www.infoq.com/news/2025/10/duolingo-finops-engineering/)） │
  │                                                          │
  │  ✅ 游戏化学习：                                         │
  │     - 连续学习天数追踪（Streak）                         │
  │     - 经验值和等级系统                                   │
  │     - 社交竞争元素                                       │
  └─────────────────────────────────────────────────────────┘

  **Lingopie 的内容策略**（来源：[Lingopie 官网](https://lingopie.com/)、[功能评测](https://lingopie.com/blog/best-features-on-lingopie/)）

  ┌─────────────────────────────────────────────────────────┐
  │              Lingopie 的视频学习模式                     │
  ├─────────────────────────────────────────────────────────┤
  │  ✅ "刷剧学习"（Binge-Learning）方法：                   │
  │     - 使用真实 TV 节目和电影                             │
  │     - 双语字幕（交互式点击翻译）                         │
  │     - 离线下载功能                                       │
  │                                                          │
  │  ✅ 内容管理：                                           │
  │     - 精选内容库（管理员策划）                           │
  │     - 难度分级标记                                       │
  │     - 主题分类（喜剧、纪录片、新闻等）                   │
  └─────────────────────────────────────────────────────────┘

  **YouTube 字幕处理架构**（来源：[ResearchGate 研究](https://www.researchgate.net/publication/393349716_YouTube's_automatic_subtitles_in_the_ESLESP_classroom)、[MDPI 可持续学习研究](https://www.mdpi.com/2673-4591/104/1/47)）

  ┌─────────────────────────────────────────────────────────┐
  │          YouTube 的级联架构（Cascaded Architecture）     │
  ├─────────────────────────────────────────────────────────┤
  │                                                          │
  │  原始视频 → ASR（语音识别） → MT（机器翻译） → TTS      │
  │                                                          │
  │  关键组件：                                              │
  │  1. ASR (Automatic Speech Recognition)：                 │
  │     - 多语言支持                                        │
  │     - 时间戳对齐                                         │
  │     - 自动标点                                          │
  │                                                          │
  │  2. MT (Machine Translation)：                           │
  │     - 上下文感知翻译                                     │
  │     - 双语字幕生成                                       │
  │                                                          │
  │  3. TTS (Text-to-Speech)：                               │
  │     - 发音示范                                          │
  │     - 语速调节                                           │
  │                                                          │
  └─────────────────────────────────────────────────────────┘

  **内容审核最佳实践**（来源：[Isahit 2024 指南](https://www.isahit.com/blog/the-ultimate-guide-of-content-moderation)、[CometChat 最佳实践](https://www.cometchat.com/blog/content-moderation-best-practices)、[Toloka 工具研究](https://toloka.ai/blog/video-annotation-tools-turning-raw-footage-into-intelligence/)）

  ┌─────────────────────────────────────────────────────────┐
  │         多层内容审核策略（Multi-Layered Approach）       │
  ├─────────────────────────────────────────────────────────┤
  │                                                          │
  │  Layer 1: AI 预过滤（Pre-filtering）                     │
  │  ├─ 内容分类（NSFW、暴力、仇恨言论）                     │
  │  ├─ 逐帧分析（Frame-by-Frame Analysis）                  │
  │  ├─ 多模态检测（视频 + 音频 + 文本）                     │
  │  └─ 置信度评分                                          │
  │                                                          │
  │  Layer 2: 人工审核（Human Moderation）                   │
  │  ├─ AI 辅助预标注（AI-Assisted Labeling）                │
  │  ├─ HITL（Human-in-the-Loop）工作流                      │
  │  ├─ 争议内容仲裁（来源：[Humans in the Loop](https://humansintheloop.org/how-hitl-video-annotation-reduces-ai-bias-in-models-2025/)） │
  │  └─ 质量控制（多人共识机制）                             │
  │                                                          │
  │  Layer 3: 社区审核（Community Moderation）               │
  │  ├─ 用户举报系统                                         │
  │  ├─ 随机用户评分                                         │
  │  └─ 反馈循环优化                                        │
  │                                                          │
  │  运营最佳实践：                                          │
  │  - 审核员轮岗制度（减少心理创伤）                        │
  │  - 清晰的审核指南文档                                    │
  │  - 申诉流程（Appeal Process）                            │
  │  - 偏见减少策略（Bias Reduction）                        │
  │                                                          │
  └─────────────────────────────────────────────────────────┘

  **视频流与 CDN 架构**（来源：[DesignGurus 指南](https://www.designgurus.io/blog/design-video-streaming-platform)、[CacheFly 多 CDN 策略](https://www.cachefly.com/news/enhancing-video-streaming-experiences-with-advanced-cdn-technology/)、[Springer QoE 研究](https://journalofcloudcomputing.springeropen.com/articles/10.1186/s13677-020-00204-8)）

  ┌─────────────────────────────────────────────────────────┐
  │            可扩展视频平台架构                            │
  ├─────────────────────────────────────────────────────────┤
  │                                                          │
  │  用户请求 → 边缘 CDN 节点 → 命中缓存？                   │
  │                   ├─ 是 → 立即返回                      │
  │                   └─ 否 → 源服务器                       │
  │                          ├─ 处理请求                     │
  │                          ├─ 生成内容                     │
  │                          └─ 回填 CDN 缓存                │
  │                                                          │
  │  缓存策略：                                              │
  │  - 动态边缘缓存（基于内容热度）                          │
  │  - 多 CDN 策略（避免单点故障）                           │
  │  - 预加载热门内容                                        │
  │  - QoE 感知（Quality of Experience）                     │
  │                                                          │
  └─────────────────────────────────────────────────────────┘

  ---
  🔬 从行业实践中提取的关键设计原则

  1. **分层处理是标准做法**
     - Duolingo 使用不同 AI 模型处理不同任务
     - YouTube 的 ASR → MT → TTS 管道
     - 让用户先看到基础内容，后台生成高级内容

  2. **CDN + 缓存必不可少**
     - Duolingo 使用 schools-cdn.duolingo.com
     - 边缘缓存可减少 80% 的服务器负载
     - 冷热数据分离存储

  3. **内容审核是多层的**
     - AI 过滤 → 人工审核 → 社区反馈
     - HITL（Human-in-the-Loop）减少 AI 偏见
     - 逐帧分析而不是仅检查缩略图

  4. **成本管理是核心**
     - Duolingo 使用 FinOps 管理云成本
     - 配额系统防止滥用
     - 智能缓存淘汰策略

  5. **用户体验优先**
     - 异步处理（不阻塞用户）
     - 渐进式升级（基础→高级）
     - 即时反馈（即使内容未就绪）

  ---
  🎯 针对EchoSpeak的改进建议方案

  结合上述行业最佳实践，我提出以下**混合架构方案**：

  **核心改进点：**

  1. **采用级联架构（类似 YouTube）**
  ```
  YouTube 链接 → 提取字幕 → Layer 1（即时） → Layer 2（异步） → Layer 3（按需）
  ```

  2. **实现智能 CDN 缓存（参考 Duolingo）**
  - 使用 Supabase Storage 作为内容库
  - 实现边缘缓存策略（可通过 Cloudflare Workers）
  - 热门内容自动缓存到边缘节点

  3. **多层审核机制**
  - AI 预过滤（检查 NSFW、不当内容）
  - 管理员审核精选内容
  - 社区反馈（举报、评分）

  4. **渐进式内容处理**
  - 用户提交链接后立即返回原始字幕
  - 后台异步生成基础标注
  - 用户可选择升级到完整 AI 分析

  ---
  🏗️ 改进后的技术架构

  ```typescript
  // packages/services/src/contentProcessor.ts

  export interface ProcessingLayers {
    layer1: RawSubtitles;      // 即时，免费
    layer2?: BasicAnnotation;   // 异步，低成本
    layer3?: FullProsodyData;   // 按需，高成本
  }

  export class SmartContentProcessor {

    async processYouTubeLink(
      youtubeId: string,
      userId: string,
      options: { tier?: 'basic' | 'full' }
    ): Promise<ProcessingResult> {

      // ========== Layer 1: 总是立即执行 ==========
      const rawSubtitles = await this.extractYouTubeSubtitles(youtubeId);

      // 立即返回基础内容（用户不用等待）
      const immediateResponse: ProcessingResult = {
        status: 'ready',
        youtubeId,
        layer1: rawSubtitles,
        metadata: {
          extractedAt: new Date(),
          source: 'youtube',
          language: 'en'
        }
      };

      // ========== 后台：检查是否需要升级 ==========
      this.backgroundProcessing(youtubeId, userId, options.tier).catch(err => {
        console.error('Background processing failed:', err);
      });

      return immediateResponse;
    }

    private async backgroundProcessing(
      youtubeId: string,
      userId: string,
      requestedTier?: 'basic' | 'full'
    ) {

      // 1️⃣ 检查缓存
      const cached = await this.checkCache(youtubeId);
      if (cached) {
        await this.notifyUser(userId, 'content_ready', { youtubeId, tier: cached.tier });
        return;
      }

      // 2️⃣ 检查用户配额
      const quota = await this.getUserQuota(userId);

      // 3️⃣ 决定处理层级
      const processingTier = this.determineProcessingTier(cached, quota, requestedTier);

      if (processingTier === 'none') {
        await this.notifyUser(userId, 'quota_exceeded', { youtubeId });
        return;
      }

      // 4️⃣ 加入处理队列
      await this.enqueueProcessing({
        youtubeId,
        userId,
        tier: processingTier,
        priority: this.calculatePriority(userId, quota)
      });
    }

    private determineProcessingTier(
      cached: CachedContent | null,
      quota: UserQuota,
      requestedTier?: 'basic' | 'full'
    ): 'basic' | 'full' | 'none' {

      // 如果已有完整版，直接返回
      if (cached?.layer3) return 'none';

      // 用户明确要求完整版且有配额
      if (requestedTier === 'full' && quota.remainingFull > 0) {
        return 'full';
      }

      // 用户要求基础版且有配额
      if (requestedTier === 'basic' && quota.remainingBasic > 0) {
        return 'basic';
      }

      // 自动决策：热门内容自动升级
      if (cached?.viewCount && cached.viewCount > 100) {
        return quota.remainingFull > 0 ? 'full' : 'none';
      }

      // 默认：基础版
      return quota.remainingBasic > 0 ? 'basic' : 'none';
    }

    private calculatePriority(userId: string, quota: UserQuota): number {
      // 付费用户优先级更高
      if (quota.tier === 'premium') return 10;
      if (quota.tier === 'pro') return 5;
      return 1;
    }
  }
  ```

  ---
  📊 数据库设计改进

  ```sql
  -- 内容库表（存储所有处理过的内容）
  CREATE TABLE content_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youtube_id VARCHAR(20) UNIQUE NOT NULL,

    -- Layer 1: 原始字幕（总是存在）
    raw_subtitles JSONB NOT NULL,
    language_code VARCHAR(5) DEFAULT 'en',
    extracted_at TIMESTAMP DEFAULT NOW(),

    -- Layer 2: 基础标注（可选）
    basic_annotations JSONB,
    basic_processed_at TIMESTAMP,

    -- Layer 3: 完整韵律标注（可选，昂贵）
    full_prosody_data JSONB,
    full_processed_at TIMESTAMP,

    -- 元数据
    title TEXT,
    thumbnail_url TEXT,
    duration INT, -- 秒

    -- 使用统计（用于缓存决策）
    view_count INT DEFAULT 0,
    unique_viewers INT DEFAULT 0,
    last_viewed_at TIMESTAMP,
    first_viewed_at TIMESTAMP,

    -- 内容分类
    difficulty_level VARCHAR(20), -- 'beginner', 'intermediate', 'advanced'
    topic_tags TEXT[],
    is_featured BOOLEAN DEFAULT FALSE,

    -- 质量控制
    moderation_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    moderation_notes TEXT,
    moderated_by UUID REFERENCES admin_users(id),
    moderated_at TIMESTAMP,

    -- 成本追踪
    processing_cost_usd DECIMAL(10,4) DEFAULT 0,
    ai_model_used VARCHAR(50),
    generation_time_ms INT,

    -- 缓存管理
    cache_tier VARCHAR(20) DEFAULT 'cold', -- 'hot', 'warm', 'cold'
    last_accessed_at TIMESTAMP DEFAULT NOW(),
    access_count INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  -- 用户配额表
  CREATE TABLE user_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,

    -- 配额层级
    tier VARCHAR(20) DEFAULT 'free', -- 'free', 'pro', 'premium'

    -- 每日配额
    daily_basic_limit INT DEFAULT 3,
    daily_full_limit INT DEFAULT 1,
    resets_at TIMESTAMP DEFAULT DATE(NOW() + INTERVAL '1 day'),

    -- 当前使用量
    basic_used_today INT DEFAULT 0,
    full_used_today INT DEFAULT 0,

    -- 历史统计
    total_basic_used INT DEFAULT 0,
    total_full_used INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  -- 异步处理队列表（使用 BullMQ 或 Supabase Edge Functions）
  CREATE TABLE processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youtube_id VARCHAR(20) NOT NULL,

    -- 任务信息
    requested_by UUID REFERENCES users(id),
    tier VARCHAR(20) NOT NULL, -- 'basic', 'full'
    priority INT DEFAULT 1,

    -- 状态管理
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    progress INT DEFAULT 0, -- 0-100

    -- 错误处理
    error_message TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,

    -- 时间追踪
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    estimated_completion_at TIMESTAMP
  );

  -- 用户处理历史表（防止滥用）
  CREATE TABLE user_processing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    youtube_id VARCHAR(20) NOT NULL,

    -- 处理信息
    tier VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,

    -- 成本追踪
    cost_usd DECIMAL(10,4),
    quota_consumed INT DEFAULT 1,

    created_at TIMESTAMP DEFAULT NOW()
  );

  -- 内容审核日志表
  CREATE TABLE moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES content_library(id),

    -- 审核信息
    moderator_type VARCHAR(20), -- 'ai', 'human', 'community'
    moderator_id UUID,

    -- 审核结果
    status VARCHAR(20) NOT NULL, -- 'approved', 'rejected', 'flagged'
    flags TEXT[], -- ['nsfw', 'violence', 'spam']
    confidence DECIMAL(3,2), -- AI 审核的置信度

    -- 审核笔记
    notes TEXT,
    severity VARCHAR(20), -- 'low', 'medium', 'high'

    created_at TIMESTAMP DEFAULT NOW()
  );

  -- 索引优化
  CREATE INDEX idx_content_library_youtube_id ON content_library(youtube_id);
  CREATE INDEX idx_content_library_cache_tier ON content_library(cache_tier, last_accessed_at);
  CREATE INDEX idx_content_library_moderation ON content_library(moderation_status, is_featured);
  CREATE INDEX idx_user_quotas_user_id ON user_quotas(user_id);
  CREATE INDEX idx_processing_queue_status ON processing_queue(status, priority, created_at);
  CREATE INDEX idx_user_processing_history_user_id ON user_processing_history(user_id, created_at);

  -- 触发器：自动更新 updated_at
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  CREATE TRIGGER update_content_library_updated_at BEFORE UPDATE ON content_library
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_user_quotas_updated_at BEFORE UPDATE ON user_quotas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  ```

  ---
  🔄 缓存策略实现

  ```typescript
  // packages/services/src/cacheManager.ts

  export class IntelligentCacheManager {

    /**
     * 智能缓存策略：基于访问热度和内容价值
     */
    async getCachedContent(youtubeId: string): Promise<CachedContent | null> {

      // 1. 查询数据库
      const content = await db.contentLibrary.findUnique({
        where: { youtube_id: youtubeId }
      });

      if (!content) return null;

      // 2. 更新访问统计
      await this.updateAccessStats(youtubeId);

      // 3. 根据热度分级
      const cacheTier = this.calculateCacheTier(content);

      // 4. 如果分级变化，更新数据库
      if (cacheTier !== content.cache_tier) {
        await db.contentLibrary.update({
          where: { id: content.id },
          data: { cache_tier: cacheTier }
        });
      }

      return {
        ...content,
        cacheTier
      };
    }

    /**
     * 计算缓存热度分级
     */
    private calculateCacheTier(content: any): 'hot' | 'warm' | 'cold' {

      const daysSinceLastAccess = this.daysBetween(content.last_accessed_at, new Date());
      const daysSinceCreated = this.daysBetween(content.created_at, new Date());

      // 热门内容：精选 OR 7天内访问 > 50次 OR 总访问 > 500
      if (
        content.is_featured ||
        (daysSinceLastAccess < 7 && content.access_count > 50) ||
        content.view_count > 500
      ) {
        return 'hot';
      }

      // 温内容：30天内有访问 且 访问 > 10次
      if (
        daysSinceLastAccess < 30 &&
        content.access_count > 10
      ) {
        return 'warm';
      }

      // 冷内容：其他
      return 'cold';
    }

    /**
     * 缓存淘汰策略：定期清理冷数据
     */
    async evictColdData() {

      // 删除条件：
      // 1. 非精选内容
      // 2. 冷数据
      // 3. 30天未访问
      // 4. 总访问量 < 20
      const deleted = await db.contentLibrary.deleteMany({
        where: {
          is_featured: false,
          cache_tier: 'cold',
          last_accessed_at: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          },
          view_count: {
            lt: 20
          }
        }
      });

      console.log(`🧹 Evicted ${deleted.count} cold content items`);
      return deleted.count;
    }

    private async updateAccessStats(youtubeId: string) {
      await db.contentLibrary.update({
        where: { youtube_id: youtubeId },
        data: {
          last_accessed_at: new Date(),
          access_count: { increment: 1 }
        }
      });
    }

    private daysBetween(date1: Date, date2: Date): number {
      const oneDay = 24 * 60 * 60 * 1000;
      return Math.abs((date1.getTime() - date2.getTime()) / oneDay);
    }
  }
  ```

  ---
  📝 最终实现建议

  **推荐方案：渐进式处理 + 智能缓存 + 配额管理**

  理由：
  1. ✅ 用户体验最佳（立即看到内容）
  2. ✅ 成本可控（80% 内容只处理基础版）
  3. ✅ 可扩展性强（支持未来增长）
  4. ✅ 符合行业最佳实践（Duolingo、YouTube 模式）

  **实施优先级：**

  Phase 1 - MVP（最小可行产品）：
  - ✅ 实现 Layer 1（原始字幕提取）
  - ✅ 实现基础配额系统（3个/天）
  - ✅ 简单的内容库（存储 YouTube ID + 字幕）
  - ✅ 手动内容审核（管理员后台）

  Phase 2 - 核心功能：
  - ✅ 实现 Layer 2（基础 AI 标注）
  - ✅ 异步任务队列（BullMQ 或 Supabase Jobs）
  - ✅ 用户配额管理界面
  - ✅ 基础缓存策略

  Phase 3 - 高级功能：
  - ✅ 实现 Layer 3（完整韵律标注）
  - ✅ 智能缓存系统（热/温/冷分级）
  - ✅ AI 预审核（NSFW 检测）
  - ✅ 社区反馈系统

  Phase 4 - 优化：
  - ✅ CDN 集成（Cloudflare Workers）
  - ✅ 自动缓存淘汰
  - ✅ 成本分析和优化
  - ✅ A/B 测试不同处理策略

  ---
  ❓ 需要你决策的问题（更新版）

  **1. 配额策略**
  - 免费用户：每天 3 个基础版 + 1 个完整版？
  - Pro 用户：每天 50 个基础版 + 10 个完整版？
  - Premium 用户：无限？

  **2. 存储策略**
  - 冷数据（30天未访问 + <20 次查看）自动删除？
  - 保留精选内容永久存储？
  - 用户上传的内容多久后审核？

  **3. 内容审核**
  - AI 预审核后自动发布？
  - 需要人工审核所有用户上传内容？
  - 社区举报触发审核？

  **4. 异步处理**
  - 使用 BullMQ（需要 Redis）？
  - 使用 Supabase Edge Functions + cron？
  - 使用 Vercel Cron Jobs？

  **5. 缓存层**
  - Phase 1-3 使用数据库缓存
  - Phase 4 集成 Cloudflare CDN
  - 还是自建 Redis 缓存？

  **6. 成本控制**
  - 设置每日最大 AI 调用次数？
  - 每个用户每月最大成本限制？
  - 超额后降级到规则-based 标注？

  ---
  📚 参考资源（更新版）

  **行业案例：**
  - [Duolingo 的 AI 战略实现 51% 增长](https://chiefaiofficer.com/blog/blog/duolingos-ai-strategy-fuels-51-user-growth-and-1b-revenue/)
  - [Duolingo FinOps 成本管理](https://www.infoq.com/news/2025/10/duolingo-finops-engineering/)
  - [Lingopie 的刷剧学习法](https://lingopie.com/blog/best-features-on-lingopie/)
  - [YouTube 字幕在教育中的应用](https://www.researchgate.net/publication/393349716_YouTube's_automatic_subtitles_in_the_ESLESP_classroom)
  - [AI 字幕翻译研究](https://www.mdpi.com/2673-4591/104/1/47)

  **技术架构：**
  - [教育平台系统设计](https://www.fastpix.io/blog/site-architecture-and-system-design-for-an-e-learning-platform)
  - [视频流平台架构](https://www.designgurus.io/blog/design-video-streaming-platform)
  - [多 CDN 策略](https://www.cachefly.com/news/enhancing-video-streaming-experiences-with-advanced-cdn-technology/)
  - [QoE 感知缓存策略](https://journalofcloudcomputing.springeropen.com/articles/10.1186/s13677-020-00204-8)

  **内容审核：**
  - [2024 内容审核终极指南](https://www.isahit.com/blog/the-ultimate-guide-of-content-moderation)
  - [内容审核最佳实践](https://www.cometchat.com/blog/content-moderation-best-practices)
  - [HITL 减少 AI 偏见](https://humansintheloop.org/how-hitl-video-annotation-reduces-ai-bias-in-models-2025/)
  - [视频标注工具研究](https://toloka.ai/blog/video-annotation-tools-turning-raw-footage-into-intelligence/)

  **异步处理：**
  - [异步处理系统设计](https://medium.com/@kiranvutukuri/asynchronous-processing-in-system-design-part-22-56c821477286)
  - [事件驱动 AI 架构](https://gcore.com/blog/event-driven-ai-architectures)

  **系统设计：**
  - [YouTube 系统设计](https://www.systemdesignhandbook.com/guides/design-youtube/)
  - [ASR 缓存优化](https://assets.amazon.science/ed/22/a38559fa46f683a25325737a661e/caching-networks-capitalizing-on-common-speech-for-asr.pdf)

  ---
  ✅ 决策问题的最佳实践答案

  基于对行业最佳实践的深入研究，以下是6个关键决策问题的推荐方案：

  ## 1️⃣ 配额策略

  **行业标杆：Duolingo 和主流 SaaS 应用**

  ┌─────────────────────────────────────────────────────────┐
  │         推荐配额方案（基于市场调研）                     │
  ├─────────────────────────────────────────────────────────┤
  │                                                          │
  │  免费层（Free Tier）：                                   │
  │  ✅ 每日 3 个基础版（Layer 2）                          │
  │  ✅ 每日 1 个完整版（Layer 3）                          │
  │  ✅ 理由：提供真实价值而非"空心免费增值"                 │
  │     （来源：[Wingback Free Tier 研究](https://www.wingback.com/blog/free-tiers-in-b2b-saas-knowhow)、[MKTClarity 慷慨限额分析](https://mktclarity.com/blogs/news/list-free-tier-saas-generous-limits)） │
  │                                                          │
  │  Pro 层（$9.99/月）：                                   │
  │  ✅ 每日 20 个基础版                                     │
  │  ✅ 每日 5 个完整版                                      │
  │  ✅ 无限访问 Layer 1（原始字幕）                        │
  │                                                          │
  │  Premium 层（$19.99/月）：                               │
  │  ✅ 无限基础版 + 完整版                                  │
  │  ✅ 优先处理（priority = 10）                            │
  │  ✅ 离线下载功能                                         │
  │                                                          │
  │  特殊规则：                                              │
  │  ✓ 精选内容不消耗配额                                   │
  │  ✓ 分享奖励：邀请好友 → +3 个配额                       │
  │  ✓ 连续学习奖励：连续7天 → +5 个配额                    │
  │                                                          │
  └─────────────────────────────────────────────────────────┘

  **API 速率限制最佳实践**（来源：[Moesif API 限额指南](https://www.moesif.com/blog/technical/rate-limiting/Best-Practices-for-API-Rate-Limits-and-Quotas-With-Moesif-to-Avoid-Angry-Customers/)、[Zuplo 2025 最佳实践](https://zuplo.com/learning-center/10-best-practices-for-api-rate-limiting-in-2025)）：

  ```typescript
  // 推荐的速率限制实现
  const rateLimitConfig = {
    free: {
      basic: { limit: 3, window: '1d' },
      full: { limit: 1, window: '1d' }
    },
    pro: {
      basic: { limit: 20, window: '1d' },
      full: { limit: 5, window: '1d' }
    },
    premium: {
      basic: { limit: -1 }, // -1 表示无限
      full: { limit: -1 }
    }
  };
  ```

  ## 2️⃣ 存储策略

  **行业最佳实践：60-80% 成本节省**

  ┌─────────────────────────────────────────────────────────┐
  │         推荐存储策略（基于成本优化研究）                 │
  ├─────────────────────────────────────────────────────────┤
  │                                                          │
  │  冷数据自动删除（来源：[Komprise 数据分层陷阱](https://www.komprise.com/resources/7-archiving-pitfalls-that-reduce-your-savings/)、[NetApp 数据归档最佳实践](https://www.netapp.com/learn/clc-blg-data-archiving-the-basics-and-5-best-practices/)）： │
  │                                                          │
  │  删除条件（同时满足）：                                  │
  │  ✓ 非精选内容（is_featured = false）                    │
  │  ✓ 冷数据（cache_tier = 'cold'）                        │
  │  ✓ 30天未访问（last_accessed_at < 30天前）              │
  │  ✓ 总访问量 < 20 次（view_count < 20）                  │
  │  ✓ 非用户创建（仅缓存的YouTube内容）                    │
  │                                                          │
  │  精选内容永久保留：                                      │
  │  ✓ 管理员标记为 is_featured = true                      │
  │  ✓ 浏览量 > 500 次                                      │
  │  ✓ 或 7天内访问 > 50 次                                 │
  │                                                          │
  │  成本优化（来源：[Trilio 冷存储策略](https://trilio.io/resources/cold-data-storage/)、[Medium 智能归档](https://medium.com/@ravibeedige/smart-data-archival-cut-costs-and-improve-performance-83b083883c2e)）： │
  │  ✓ 预计节省：60-80% 存储成本                            │
  │  ✓ 避免隐藏费用（检索费）                               │
  │  ✓ 自动化生命周期管理                                   │
  │                                                          │
  └─────────────────────────────────────────────────────────┘

  **数据保留最佳实践**（来源：[FileCloud 数据保留政策](https://www.filecloud.com/blog/data-retention-policy-best-practices/)、[Drata 合规指南](https://drata.com/blog/data-retention-policy)）：

  ```typescript
  // 推荐的自动清理 Cron Job（每周执行）
  async function cleanupColdData() {
    const deleted = await db.contentLibrary.deleteMany({
      where: {
        is_featured: false,
        cache_tier: 'cold',
        last_accessed_at: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        view_count: { lt: 20 },
        created_at: {
          lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 创建至少60天
        }
      }
    });

    console.log(`🧹 Cleaned up ${deleted.count} cold items`);
  }

  // 数据保留策略
  const retentionPolicy = {
    userUploaded: '365d',      // 用户上传内容保留1年
    youtubeCached: '30d',      // YouTube缓存内容保留30天
    featuredContent: 'forever', // 精选内容永久保留
    popularContent: '90d'      // 热门内容（>100次访问）保留90天
  };
  ```

  ## 3️⃣ 内容审核

  **行业标准：AI + 人工混合审核**

  ┌─────────────────────────────────────────────────────────┐
  │      推荐审核流程（事件驱动架构）                       │
  ├─────────────────────────────────────────────────────────┤
  │                                                          │
  │  Step 1: AI 预过滤（Pre-moderation）                    │
  │  ├─ 检测 NSFW、暴力、仇恨言论                           │
  │  ├─ 置信度评分（0-100）                                 │
  │  └─ 自动决策：                                         │
  │     • 置信度 > 95% → 自动批准                           │
  │     • 置信度 < 50% → 自动拒绝                           │
  │     • 50-95% → 人工审核                                 │
  │                                                          │
  │  Step 2: 人工审核（针对边界情况）                       │
  │  ├─ 管理员后台查看待审核队列                            │
  │  ├─ 批量审核操作                                        │
  │  └─ AI 辅助预标注（减少工作量）                         │
  │                                                          │
  │  Step 3: 社区反馈（Post-moderation）                    │
  │  ├─ 用户举报功能                                        │
  │  ├─ 随机用户评分（质量保证）                           │
  │  └─ 反馈循环优化 AI 模型                                │
  │                                                          │
  └─────────────────────────────────────────────────────────┘

  **AI 审核置信度阈值**（来源：[Medium 事件驱动审核系统](https://medium.com/@edgarr_t/app-store-compliance-on-autopilot-building-an-event-driven-ai-content-moderation-system-ed4076a33a87)、[Watchers 实时审核](https://watchers.io/post/ai-content-moderation)）：

  ```typescript
  // 推荐的 AI 审核配置
  const moderationConfig = {
    thresholds: {
      autoApprove: 0.95,  // 95% 置信度自动批准
      autoReject: 0.50,   // 50% 置信度以下自动拒绝
      manualReview: [0.50, 0.95] // 中间区间需要人工审核
    },
    categories: {
      nsfw: { enabled: true, weight: 1.0 },
      violence: { enabled: true, weight: 0.8 },
      hate: { enabled: true, weight: 1.0 },
      spam: { enabled: true, weight: 0.5 }
    }
  };

  // 审核流程实现
  async function moderateContent(contentId: string) {
    // 1. AI 预过滤
    const aiResult = await aiModerationService.analyze(contentId);

    if (aiResult.confidence >= 0.95) {
      // 自动批准
      return { status: 'approved', method: 'ai-auto' };
    } else if (aiResult.confidence < 0.50) {
      // 自动拒绝
      return { status: 'rejected', method: 'ai-auto', reason: aiResult.flags };
    } else {
      // 加入人工审核队列
      await moderationQueue.add({
        contentId,
        aiResult,
        priority: aiResult.confidence < 0.70 ? 'high' : 'normal'
      });
      return { status: 'pending', method: 'human-review' };
    }
  }
  ```

  **关键最佳实践**（来源：[Pexly AI+人工混合审核](https://pexly.com/blog/customer-care/ai-and-human-content-moderation-combining-forces-for-safe-online-business/)、[arXiv 混合审核研究](https://arxiv.org/html/2508.05527v1)）：
  - AI 减少人工工作量 70-90%
  - 人工审核员专注于边界情况
  - AI 从人工决策中持续学习
  - 定期调整阈值以减少误报

  ## 4️⃣ 异步处理

  **推荐方案：Supabase Edge Functions + Cron**

  ┌─────────────────────────────────────────────────────────┐
  │     异步处理方案对比（基于搜索结果）                    │
  ├─────────────────────────────────────────────────────────┤
  │                                                          │
  │  BullMQ（来源：[BullMQ vs cron 对比](https://sourceforge.net/software/compare/BullMQ-vs-cron-job.org/)）： │
  │  ✅ 最强大：优先级队列、重试、并发控制                  │
  │  ❌ 需要 Redis 基础设施（额外成本和运维）               │
  │  💰 成本：$15-50/月（Redis 托管）                      │
  │  🎯 适合：大规模、复杂任务链                            │
  │                                                          │
  │  Supabase Edge Functions + Cron（推荐⭐）：             │
  │  ✅ 零基础设施                                          │
  │  ✅ 数据库集成（PostgreSQL）                            │
  │  ✅ 内置 Cron 调度                                      │
  │  💰 成本：免费层包含，Pro $25/月                        │
  │  🎯 适合：中小规模、已使用 Supabase                     │
  │  （来源：[Supabase 处理大任务博客](https://supabase.com/blog/processing-large-jobs-with-edge-functions)） │
  │                                                          │
  │  Vercel Cron Jobs：                                     │
  │  ✅ 最简单：已部署在 Vercel                             │
  │  ❌ 功能有限：最小间隔 1 小时（Hobby 计划）             │
  │  💰 成本：Hobby 免费，Pro $20/月                        │
  │  🎯 适合：简单定时任务                                  │
  │                                                          │
  └─────────────────────────────────────────────────────────┘

  **推荐配置**：

  ```typescript
  // Phase 1-2: 使用 Supabase（已集成）
  // apps/admin/src/background/jobs/supabaseProcessor.ts

  import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

  // Supabase Edge Function
  serve(async (req) => {
    const { jobId } = await req.json();

    // 从数据库获取任务
    const { data: job } = await supabase
      .from('processing_queue')
      .select('*')
      .eq('id', jobId)
      .single();

    if (!job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404 });
    }

    try {
      // 更新状态为处理中
      await supabase.from('processing_queue').update({
        status: 'processing',
        started_at: new Date()
      }).eq('id', jobId);

      // 执行处理
      const result = await processContent(job);

      // 标记完成
      await supabase.from('processing_queue').update({
        status: 'completed',
        completed_at: new Date(),
        progress: 100
      }).eq('id', jobId);

      return new Response(JSON.stringify({ success: true, result }));

    } catch (error) {
      // 错误处理
      await supabase.from('processing_queue').update({
        status: 'failed',
        error_message: error.message,
        retry_count: { increment: 1 }
      }).eq('id', jobId);

      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  });

  // Supabase Cron（定期检查队列）
  // 在 Supabase Dashboard 中配置：每 5 分钟执行一次
  ```

  **迁移路径**：
  - **Phase 1-3**: Supabase Edge Functions（零基础设施）
  - **Phase 4+**: 如果队列 > 1000 并发，迁移到 BullMQ + Redis

  ## 5️⃣ 缓存层

  **推荐方案：三层缓存架构**

  ┌─────────────────────────────────────────────────────────┐
  │      多层缓存策略（来源：[Medium 多层缓存](https://medium.com/@sonal.sadafal/%25EF%25B8%258F-multi-layered-caching-from-browser-to-database-36b70f9ab7ff)、[Hackernoon 缓存层](https://hackernoon.com/the-many-layers-of-caching-all-the-places-data-lives-in-modern-systems)） │
  ├─────────────────────────────────────────────────────────┤
  │                                                          │
  │  Layer 1: CDN 缓存（Cloudflare）                        │
  │  ├─ 内容：静态资源、公开 API 响应                       │
  │  ├─ TTL: 180 秒（API 数据）                             │
  │  ├─ 适合：产品列表、热门内容元数据                      │
  │  └─ 成本：免费层够用                                    │
  │                                                          │
  │  Layer 2: Redis 缓存（可选，Phase 4）                   │
  │  ├─ 内容：动态数据、用户会话                            │
  │  ├─ TTL: 3600 秒（1小时）                               │
  │  ├─ 适合：频繁访问的 JSON 数据、配额计数               │
  │  └─ 成本：Upstash Redis（免费 10,000 次请求/天）        │
  │                                                          │
  │  Layer 3: 数据库缓存（PostgreSQL）                      │
  │  ├─ 内容：查询结果缓存                                  │
  │  ├─ TTL: 永久（手动失效）                               │
  │  ├─ 适合：内容库数据、用户配额                          │
  │  └─ 成本：已包含在 Supabase                             │
  │                                                          │
  └─────────────────────────────────────────────────────────┘

  **缓存决策矩阵**（来源：[Leapcell 多层缓存策略](https://leapcell.io/blog/optimal-data-caching-strategies-across-database-application-and-edge-layers)）：

  | 数据类型 | 推荐缓存 | TTL | 理由 |
  |---------|---------|-----|------|
  | 静态图片/视频 | CDN | 30d | 大文件，地理分布 |
  | 产品列表（公开） | CDN | 180s | 相同响应，高并发 |
  | 用户会话 | Redis | 24h | 私有数据，快速访问 |
  | 配额计数 | Redis | 实时 | 频繁更新 |
  | 内容库数据 | Database | 永久 | 主数据源 |
  | API 响应（私有） | Redis | 3600s | 私有，动态 |

  **实施建议**：

  ```typescript
  // Phase 1-3: 仅使用 Database + CDN
  const cacheStrategy = {
    phase1: {
      cdn: true,      // Cloudflare 自动缓存公开 API
      database: true, // content_library 表
      redis: false
    },
    phase4: {
      cdn: true,
      database: true,
      redis: true     // 添加 Upstash Redis 缓存热数据
    }
  };

  // CDN 缓存配置（Next.js）
  export async function GET(request: NextRequest) {
    const data = await getContent();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=60'
      }
    });
  }

  // Redis 缓存示例（Phase 4）
  import { Redis } from '@upstash/redis';

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
  });

  async function getCachedContent(youtubeId: string) {
    // 1. 检查 Redis
    const cached = await redis.get(`content:${youtubeId}`);
    if (cached) return JSON.parse(cached as string);

    // 2. 检查数据库
    const content = await db.contentLibrary.findUnique({
      where: { youtube_id: youtubeId }
    });

    // 3. 回填 Redis
    if (content && content.cache_tier === 'hot') {
      await redis.set(`content:${youtubeId}`, JSON.stringify(content), {
        ex: 3600 // 1小时
      });
    }

    return content;
  }
  ```

  ## 6️⃣ 成本控制

  **推荐策略：多层防护 + 降级机制**

  ┌─────────────────────────────────────────────────────────┐
  │       AI 成本控制策略（来源：[OpenAI 最佳实践](https://platform.openai.com/docs/guides/production-best-practices)、[CloudZero OpenAI 优化](https://www.cloudzero.com/blog/openai-cost-optimization/)） │
  ├─────────────────────────────────────────────────────────┤
  │                                                          │
  │  防护层级：                                              │
  │                                                          │
  │  1️⃣ 用户级配额（防止滥用）                              │
  │     • 免费用户：每天 3 个基础版 + 1 个完整版            │
  │     • Pro 用户：每天 20 个基础版 + 5 个完整版           │
  │     • 超额后降级到规则-based 标注                       │
  │                                                          │
  │  2️⃣ 应用级限额（每日最大调用）                          │
  │     • 设置每日最大 AI 调用次数：1000 次                  │
  │     • 预算上限：$50/天（防止异常）                      │
  │     • 超额后自动降级                                    │
  │                                                          │
  │  3️⃣ 模型级优化（降低单次成本）                          │
  │     • 基础版：规则引擎（几乎免费）                      │
  │     • 完整版：Gemini Flash（$0.075/百万token）          │
  │     • Prompt 优化：减少 30% token 使用                  │
  │                                                          │
  │  4️⃣ 结果缓存（避免重复调用）                            │
  │     • 热内容缓存命中率 > 80%                            │
  │     • 智能去重（相同内容不重复处理）                    │
  │                                                          │
  └─────────────────────────────────────────────────────────┘

  **降级策略**（来源：[Skywork AI 令牌数学](https://skywork.ai/blog/ai-api-cost-throughput-pricing-token-math-budgets-2025/)）：

  ```typescript
  // 成本控制实现
  const costControl = {
    dailyBudget: 50, // $50/天
    maxCallsPerDay: 1000,
    alertThreshold: 0.8, // 80% 时告警

    async checkBudget() {
      const todayUsage = await this.getTodayUsage();

      if (todayUsage.cost >= this.dailyBudget) {
        // 超预算，降级到规则引擎
        return { allowed: false, tier: 'rules-based' };
      } else if (todayUsage.calls >= this.maxCallsPerDay) {
        return { allowed: false, tier: 'rules-based' };
      } else if (todayUsage.cost >= this.dailyBudget * this.alertThreshold) {
        // 接近上限，发送告警
        await this.sendAlert('Budget 80% used');
        return { allowed: true, tier: 'full' };
      }

      return { allowed: true, tier: 'full' };
    }
  };

  // 用户配额检查
  async function checkUserQuota(userId: string, tier: 'basic' | 'full') {
    const quota = await db.userQuotas.findUnique({ where: { user_id: userId } });

    if (tier === 'basic') {
      return quota.basic_used_today < quota.daily_basic_limit;
    } else {
      return quota.full_used_today < quota.daily_full_limit;
    }
  }

  // 降级处理
  async function processWithFallback(youtubeId: string, tier: string) {
    const budget = await costControl.checkBudget();

    if (budget.tier === 'rules-based') {
      // 降级到规则引擎（几乎免费）
      return {
        tier: 'basic',
        method: 'rules-based',
        cost: 0.001, // ~$0.001
        data: await processWithRules(youtubeId)
      };
    } else {
      // 正常 AI 处理
      return {
        tier: 'full',
        method: 'gemini-flash',
        cost: 0.07, // ~$0.07
        data: await processWithAI(youtubeId)
      };
    }
  }

  // Prompt 优化示例
  async function optimizedProsodyGeneration(text: string) {
    // 优化前：~500 tokens
    const oldPrompt = `
      Please analyze the following text and generate detailed prosody notation
      for each word including stress patterns, intonation contours, and liaison points...
      Text: ${text}
    `;

    // 优化后：~200 tokens（节省 60%）
    const newPrompt = `
      Task: Prosody notation
      Input: ${text}
      Output: JSON with stress (0-2), intonation (↗↘), liaison (_)
    `;

    return await generateProsodyNotation(text, { prompt: newPrompt });
  }
  ```

  **成本监控仪表板**：

  ```typescript
  // 成本追踪表
  CREATE TABLE cost_tracking (
    id UUID PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,

    -- 用量统计
    total_calls INT DEFAULT 0,
    total_tokens BIGINT DEFAULT 0,
    total_cost_usd DECIMAL(10,2) DEFAULT 0,

    -- 分层统计
    basic_calls INT DEFAULT 0,
    full_calls INT DEFAULT 0,
    rules_based_calls INT DEFAULT 0,

    -- 用户统计
    unique_users INT DEFAULT 0,
    avg_cost_per_user DECIMAL(10,4),

    -- 缓存效果
    cache_hit_rate DECIMAL(3,2), // 0.80 = 80%
    money_saved_by_cache DECIMAL(10,2) DEFAULT 0
  );

  -- 每日汇总
  async function aggregateDailyStats() {
    const today = new Date().toISOString().split('T')[0];

    const stats = await db.userProcessingHistory.aggregate({
      where: { created_at: { gte: today } },
      _count: { id: true },
      _sum: { cost_usd: true }
    });

    await db.costTracking.upsert({
      where: { date: today },
      update: {
        total_calls: stats._count.id,
        total_cost_usd: stats._sum.cost_usd || 0
      },
      create: {
        date: today,
        total_calls: stats._count.id,
        total_cost_usd: stats._sum.cost_usd || 0
      }
    });
  }
  ```

  ---
  📋 最终推荐配置总结

  **基于行业最佳实践的快速决策：**

  | 决策问题 | 推荐方案 | 理由 |
  |---------|---------|------|
  | 1. 配额策略 | 免费层：3基础+1完整/天<br>Pro：20基础+5完整/天<br>Premium：无限 | 提供真实价值（[Wingback](https://www.wingback.com/blog/free-tiers-in-b2b-saas-knowhow)） |
  | 2. 存储策略 | 30天未访问且<20次查看自动删除<br>精选内容永久保留 | 节省60-80%成本（[Komprise](https://www.komprise.com/resources/7-archiving-pitfalls-that-reduce-your-savings/)） |
  | 3. 内容审核 | AI预过滤（95%置信度自动批准）<br>+ 人工审核边界情况 | AI减少70-90%人工工作量（[Pexly](https://pexly.com/blog/customer-care/ai-and-human-content-moderation-combining-forces-for-safe-online-business/)） |
  | 4. 异步处理 | Phase 1-3: Supabase Edge Functions<br>Phase 4+: BullMQ + Redis | 零基础设施（[Supabase Blog](https://supabase.com/blog/processing-large-jobs-with-edge-functions)） |
  | 5. 缓存层 | Phase 1-3: Database + CDN<br>Phase 4+: 添加 Redis | 多层架构最佳性能（[Medium](https://medium.com/@sonal.sadafal/%25EF%25B8%258F-multi-layered-caching-from-browser-to-database-36b70f9ab7ff)） |
  | 6. 成本控制 | 用户配额 + 每日$50上限 + 降级机制 | 防止异常（[OpenAI Best Practices](https://platform.openai.com/docs/guides/production-best-practices)） |

  **实施时间线：**

  ```
  Phase 1（MVP - 1个月）:
  ✅ Layer 1 字幕提取
  ✅ 基础配额（3/天）
  ✅ 数据库缓存
  ✅ Supabase 异步任务
  ✅ 手动内容审核

  Phase 2（核心功能 - 2个月）:
  ✅ Layer 2 基础AI标注
  ✅ AI预审核（95%阈值）
  ✅ 用户配额管理界面
  ✅ 成本追踪仪表板

  Phase 3（高级功能 - 3个月）:
  ✅ Layer 3 完整韵律标注
  ✅ 智能缓存（热/温/冷）
  ✅ 社区举报系统
  ✅ 自动缓存淘汰

  Phase 4（优化 - 4个月）:
  ✅ CDN集成（Cloudflare）
  ✅ Redis缓存（Upstash）
  ✅ BullMQ（如需要）
  ✅ A/B测试
  ```

  ---
  📚 参考资源（决策问题专题）

  **配额策略与定价：**
  - [Top SaaS Pricing Models 2024](https://www.altdigital.tech/blogs/top-5-saas-pricing-models-for-2024)
  - [Free-Tier SaaS Generous Limits](https://mktclarity.com/blogs/news/list-free-tier-saas-generous-limits)
  - [Everything About Free Tiers in B2B SaaS](https://www.wingback.com/blog/free-tiers-in-b2b-saas-knowhow)
  - [Best Practices for API Rate Limits - Moesif](https://www.moesif.com/blog/technical/rate-limiting/Best-Practices-for-API-Rate-Limits-and-Quotas-With-Moesif-to-Avoid-Angry-Customers/)
  - [10 Best Practices for API Rate Limiting 2025 - Zuplo](https://zuplo.com/learning-center/10-best-practices-for-api-rate-limiting-in-2025)

  **存储与成本优化：**
  - [7 Data Tiering Pitfalls - Komprise](https://www.komprise.com/resources/7-archiving-pitfalls-that-reduce-your-savings/)
  - [Data Archiving Best Practices - NetApp](https://www.netapp.com/learn/clc-blg-data-archiving-the-basics-and-5-best-practices/)
  - [Smart Data Archival - Medium](https://medium.com/@ravibeedige/smart-data-archival-cut-costs-and-improve-performance-83b083883c2e)
  - [Optimize Your Data Storage Strategy - Trilio](https://trilio.io/resources/cold-data-storage/)
  - [Data Retention Policy Best Practices - FileCloud](https://www.filecloud.com/blog/data-retention-policy-best-practices/)
  - [Data Retention Policy - Drata](https://drata.com/blog/data-retention-policy)

  **内容审核：**
  - [AI vs Human Content Moderation - Utopia Analytics](https://www.utopiaanalytics.com/article/ai-vs-human-content-moderation)
  - [Leveraging AI for Content Moderation - Appen](https://www.appen.com/blog/content-moderation)
  - [Content Moderation Complete Guide 2025 - Enrich Labs](https://www.enrichlabs.ai/blog/content-moderation-complete-guide)
  - [AI vs Human Moderators: A Comparative Evaluation - arXiv](https://arxiv.org/html/2508.05527v1)
  - [AI and Human Content Moderation: Combining Forces - Pexly](https://pexly.com/blog/customer-care/ai-and-human-content-moderation-combining-forces-for-safe-online-business)
  - [Building Event-Driven AI Content Moderation - Medium](https://medium.com/@edgarr_t/app-store-compliance-on-autopilot-building-an-event-driven-ai-content-moderation-system-ed4076a33a87)
  - [How AI Content Moderation Works - Watchers](https://watchers.io/post/ai-content-moderation)
  - [Get Started with AI Moderation - Stream](https://getstream.io/blog/get-started-ai-moderation/)

  **异步处理方案：**
  - [Processing Large Jobs with Supabase - Supabase Blog](https://supabase.com/blog/processing-large-jobs-with-edge-functions)
  - [Supabase Cron - Supabase Blog](https://supabase.com/blog/supabase-cron)
  - [Schedulers in Node: Top 10 Libraries Comparison - BetterStack](https://betterstack.com/community/guides/scaling-nodejs/best-nodejs-schedulers/)
  - [Scalable API Rate Limiting System - Medium](https://medium.com/@hafeez.fijur/scalable-api-rate-limiting-system-quota-management-system-f936e827ae53)

  **缓存架构：**
  - [Multi-Layered Caching: From Browser to Database - Medium](https://medium.com/@sonal.sadafal/%25EF%25B8%258F-multi-layered-caching-from-browser-to-database-36b70f9ab7ff)
  - [Caching Layers Explained: CDN, Redis, Memcached - LinkedIn](https://www.linkedin.com/pulse/caching-layers-explained-cdn-redis-memcached-why-matter-deepak-dalal-i5z0c)
  - [Optimal Data Caching Strategies - Leapcell](https://leapcell.io/blog/optimal-data-caching-strategies-across-database-application-and-edge-layers)
  - [The Many Layers of Caching - Hackernoon](https://hackernoon.com/the-many-layers-of-caching-all-the-places-data-lives-in-modern-systems)
  - [Caching as a Discipline: 10× Throughput - Medium](https://medium.com/@ThinkingLoop/caching-as-a-discipline-10-throughput-with-redis-cdn-ed15e6accc00)

  **AI 成本控制：**
  - [OpenAI Production Best Practices](https://platform.openai.com/docs/guides/production-best-practices)
  - [OpenAI Cost Optimization: 14 Strategies - CloudZero](https://www.cloudzero.com/blog/openai-cost-optimization/)
  - [OpenAI Cost Optimization: 10 Best Practices - WrangleAI](https://wrangleai.com/blog/openai-cost-optimization/)
  - [API Pricing, Token Math, and Budgets 2025 - Skywork](https://skywork.ai/blog/ai-api-cost-throughput-pricing-token-math-budgets-2025/)
  - [3 Strategies to Overcome OpenAI Token Limits - Bret Cameron](https://www.bretcameron.com/blog/three-strategies-to-overcome-open-ai-token-limits)
  - [Gemini Developer API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
  - [LLM API Pricing Comparison 2025 - Intuition Labs](https://intuitionlabs.ai/articles/llm-api-pricing-comparison-2025)
  - [Gemini AI Pricing: What You'll Really Pay in 2025 - CloudZero](https://www.cloudzero.com/blog/gemini-pricing/)