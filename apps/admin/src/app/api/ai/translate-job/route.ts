import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/utils/supabaseServer';

interface Transcript {
  id: string;
  sequence: number;
  text_en?: string;
  text_cn?: string;
  translations?: Record<string, string>;
}

interface TranslateItem {
  id: string;
  sequence: number;
  text: string;
}

// 辅助函数：更新执行状态
async function updateExecutionStatus(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  executionId: string,
  updates: {
    status?: string;
    progress?: number;
    error_message?: string;
  }
) {
  const { error } = await supabase.rpc('update_stage_execution', {
    p_execution_id: executionId,
    p_status: updates.status,
    p_progress: updates.progress,
    p_error_message: updates.error_message,
  });

  if (error) {
    console.error('[updateExecutionStatus] 更新失败:', error);
  }
}

/**
 * POST /api/ai/translate-job
 * 
 * 独立的翻译任务 API - 将已提取的字幕翻译成目标语言
 * 
 * 与 transcribe API 分离，遵循单一职责原则
 * 
 * 使用翻译网关（支持 DeepL、腾讯云、百度等多种翻译服务）
 * 
 * @param jobId - 翻译任务 ID
 * @param assetId - 媒体资源 ID
 * @param sourceLanguage - 源语言代码 (en, zh, cn 等)
 * @param targetLanguage - 目标语言代码 (en, zh, cn 等)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { jobId, assetId, sourceLanguage, targetLanguage } = body;

    // 参数验证
    if (!jobId || !assetId) {
      return NextResponse.json(
        { error: '缺少必需参数: jobId, assetId' },
        { status: 400 }
      );
    }

    if (!sourceLanguage || !targetLanguage) {
      return NextResponse.json(
        { error: '缺少语言参数: sourceLanguage, targetLanguage' },
        { status: 400 }
      );
    }

    if (sourceLanguage === targetLanguage) {
      return NextResponse.json(
        { error: '源语言和目标语言不能相同' },
        { status: 400 }
      );
    }

    console.error('[Translate Job API] 开始翻译任务', {
      jobId,
      assetId,
      sourceLanguage,
      targetLanguage,
    });

    const supabase = getSupabaseServiceClient();

    // 1. 更新执行状态为 running
    await updateExecutionStatus(supabase, jobId, {
      status: 'running',
      progress: 0,
    });

    // 2. 从数据库获取原始字幕
    const { data: transcripts, error: fetchError } = await supabase
      .from('transcripts')
      .select('*')
      .eq('asset_id', assetId)
      .order('sequence', { ascending: true });

    if (fetchError || !transcripts || transcripts.length === 0) {
      console.error('[Translate Job API] 获取字幕失败:', fetchError);
      
      await updateExecutionStatus(supabase, jobId, {
        status: 'failed',
        error_message: fetchError?.message || '未找到字幕数据',
      });

      return NextResponse.json(
        { error: '未找到字幕数据' },
        { status: 404 }
      );
    }

    // 3. 更新进度：准备翻译
    await updateExecutionStatus(supabase, jobId, {
      progress: 10,
    });

    // 4. 准备待翻译的文本
    const textsToTranslate = (transcripts as Transcript[]).map((t) => {
      // 根据源语言选择正确的文本字段
      let sourceText = '';
      
      if (sourceLanguage === 'en' && t.text_en) {
        sourceText = t.text_en;
      } else if ((sourceLanguage === 'zh' || sourceLanguage === 'cn') && t.text_cn) {
        sourceText = t.text_cn;
      } else {
        // 尝试从 translations 中获取
        const translations = t.translations || {};
        sourceText = translations[sourceLanguage] || t.text_en || t.text_cn || '';
      }
      
      return {
        id: t.id,
        sequence: t.sequence,
        text: sourceText,
      };
    }).filter((item: TranslateItem) => item.text && item.text.trim() !== '');

    if (textsToTranslate.length === 0) {
      console.error('[Translate Job API] 没有找到可翻译的文本');
      
      await updateExecutionStatus(supabase, jobId, {
        status: 'failed',
        error_message: `没有找到源语言(${sourceLanguage})的字幕文本`,
      });

      return NextResponse.json(
        { error: `没有找到源语言(${sourceLanguage})的字幕文本` },
        { status: 400 }
      );
    }

    // 5. 调用翻译服务（批量翻译）
    await updateExecutionStatus(supabase, jobId, {
      progress: 20,
    });

    // 批量翻译，每次处理 10 条
    const batchSize = 10;
    const translatedResults: Array<{ id: string; translation: string }> = [];
    let totalCost = 0;
    let totalLatency = 0;
    
    for (let i = 0; i < textsToTranslate.length; i += batchSize) {
      const batch = textsToTranslate.slice(i, i + batchSize);
      
      try {
        // 调用翻译服务
        const batchResults = await translateBatch(batch, sourceLanguage, targetLanguage);
        
        // 组合结果
        batch.forEach((item: TranslateItem, index: number) => {
          translatedResults.push({
            id: item.id,
            translation: batchResults.translations[index] || item.text, // 如果翻译失败，保留原文
          });
        });
        
        // 累计成本和延迟
        totalCost += batchResults.cost || 0;
        totalLatency += batchResults.latency || 0;
        
        // 更新进度
        const progress = Math.min(90, 20 + Math.floor((i + batch.length) / textsToTranslate.length * 60));
        await updateExecutionStatus(supabase, jobId, {
          progress,
        });
          
      } catch (error) {
        console.error(`[Translate Job API] 批次翻译失败:`, error);
        // 翻译失败时保留原文
        batch.forEach((item: TranslateItem) => {
          translatedResults.push({
            id: item.id,
            translation: item.text,
          });
        });
      }
    }

    // 6. 保存翻译结果到数据库
    await updateExecutionStatus(supabase, jobId, {
      progress: 95,
    });

    // 使用批量更新函数
    const { error: updateError } = await supabase
      .rpc('batch_update_translations', {
        p_asset_id: assetId,
        p_target_language: targetLanguage,
        p_translations: translatedResults,
      });

    if (updateError) {
      console.error('[Translate Job API] 批量更新翻译失败:', updateError);
      
      await updateExecutionStatus(supabase, jobId, {
        status: 'failed',
        error_message: `保存翻译失败: ${updateError.message}`,
      });

      return NextResponse.json(
        { error: `保存翻译失败: ${updateError.message}` },
        { status: 500 }
      );
    }

    // 7. 更新执行状态为 completed
    await updateExecutionStatus(supabase, jobId, {
      status: 'completed',
      progress: 100,
    });

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      jobId,
      sourceLanguage,
      targetLanguage,
      translatedCount: translatedResults.length,
      duration,
      cost: totalCost,
      avgLatency: Math.round(totalLatency / Math.ceil(textsToTranslate.length / batchSize)),
    });

  } catch (error) {
    console.error('[Translate Job API] 翻译任务异常:', error);

    return NextResponse.json(
      {
        error: '翻译任务失败',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * 批量翻译文本
 * 
 * 使用翻译网关，支持多种翻译服务（DeepL、腾讯云、百度等）
 * 
 * @param items - 待翻译的文本项
 * @param sourceLang - 源语言
 * @param targetLang - 目标语言
 * @returns 翻译结果和统计信息
 */
async function translateBatch(
  items: Array<{ id: string; sequence: number; text: string }>,
  sourceLang: string,
  targetLang: string
): Promise<{
  translations: string[];
  provider: string;
  cost: number;
  latency: number;
}> {
  const startTime = Date.now();
  
  try {
    // 使用翻译网关（支持多种翻译服务）
    const { getTranslateGateway } = await import('@/lib/translate-gateway');
    const gateway = getTranslateGateway();
    
    // 提取文本
    const texts = items.map(item => item.text);
    
    // 类型断言：确保语言代码是支持的类型
    const validTargetLang = targetLang === 'en' || targetLang === 'zh' ? targetLang : 'en';
    const validSourceLang = sourceLang === 'en' || sourceLang === 'zh' ? sourceLang : 'en';
    
    // 使用翻译网关进行并发翻译
    // 默认策略：quality（质量优先）- DeepL > 百度大模型
    const result = await gateway.translateBatchWithConcurrency(
      texts,
      validTargetLang,
      validSourceLang,
      {
        strategy: 'quality',      // 质量优先：DeepL > 百度大模型 > 腾讯云
        enableFallback: true,     // 启用自动降级
        enableCache: true,        // 启用缓存
      },
      5,   // 最大并发数
      50   // 每批大小（DeepL 限制）
    );
    
    const latency = Date.now() - startTime;
    
    return {
      translations: result.translations,
      provider: result.provider,
      cost: result.cost || 0,
      latency,
    };
    
  } catch (error) {
    console.error('[translateBatch] 翻译网关翻译失败:', error);
    
    // 失败时返回原文
    return {
      translations: items.map(item => item.text),
      provider: 'fallback',
      cost: 0,
      latency: 0,
    };
  }
}
