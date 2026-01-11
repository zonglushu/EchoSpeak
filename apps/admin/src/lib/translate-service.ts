/**
 * 翻译服务 - 核心逻辑
 * 
 * 从 translate-job API 中提取出来，作为可复用的服务函数
 */

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

interface TranslateResult {
  success: boolean;
  translatedCount?: number;
  duration?: number;
  totalCost?: number;
  error?: string;
}

// 辅助函数：更新执行状态
async function updateExecutionStatus(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  executionId: string,
  updates: {
    status?: string;
    progress?: number;
    error_message?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const { error } = await supabase.rpc('update_stage_execution', {
    p_execution_id: executionId,
    p_status: updates.status,
    p_progress: updates.progress,
    p_error_message: updates.error_message,
    p_metadata: updates.metadata,
  });

  if (error) {
    console.error('[updateExecutionStatus] 更新失败:', error);
  }
}

/**
 * 批量翻译文本
 */
async function translateBatch(
  items: TranslateItem[],
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
    const result = await gateway.translateBatchWithConcurrency(
      texts,
      validTargetLang,
      validSourceLang,
      {
        strategy: 'quality',
        enableFallback: true,
        enableCache: true,
      },
      5,   // 最大并发数
      50   // 每批大小
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

/**
 * 执行翻译任务
 * 
 * 这是核心逻辑函数，可以被任何地方调用（API Route、Server Action 等）
 * 
 * @param jobId - 翻译任务 ID（stage_executions 表）
 * @param assetId - 媒体资源 ID
 * @param sourceLanguage - 源语言
 * @param targetLanguage - 目标语言
 */
export async function executeTranslation(
  jobId: string,
  assetId: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<TranslateResult> {
  const startTime = Date.now();

  try {
    console.error('[Translation Service] 开始翻译任务', {
      jobId,
      assetId,
      sourceLanguage,
      targetLanguage,
    });

    const supabase = getSupabaseServiceClient();

    // 定义翻译的所有步骤
    const steps = [
      { id: 'initializing', label: '初始化翻译任务', status: 'pending' },
      { id: 'loading_subtitles', label: '加载原始字幕', status: 'pending' },
      { id: 'preparing', label: '准备翻译数据', status: 'pending' },
      { id: 'translating', label: '正在翻译', status: 'pending' },
      { id: 'saving', label: '保存翻译结果', status: 'pending' },
    ];

    // 1. 更新执行状态为 running - 初始化
    steps[0].status = 'running';
    await updateExecutionStatus(supabase, jobId, {
      status: 'running',
      progress: 0,
      metadata: {
        current_step: 'initializing',
        step_label: '初始化翻译任务',
        steps_completed: 0,
        total_steps: steps.length,
        steps: steps,
      },
    });

    // 2. 加载原始字幕
    steps[0].status = 'completed';
    steps[1].status = 'running';
    await updateExecutionStatus(supabase, jobId, {
      progress: 10,
      metadata: {
        current_step: 'loading_subtitles',
        step_label: '加载原始字幕',
        steps_completed: 1,
        total_steps: steps.length,
        steps: steps,
      },
    });

    const { data: transcripts, error: fetchError } = await supabase
      .from('transcripts')
      .select('*')
      .eq('asset_id', assetId)
      .order('sequence', { ascending: true });

    if (fetchError || !transcripts || transcripts.length === 0) {
      console.error('[Translation Service] 获取字幕失败:', fetchError);
      
      await updateExecutionStatus(supabase, jobId, {
        status: 'failed',
        error_message: fetchError?.message || '未找到字幕数据',
      });

      return {
        success: false,
        error: '未找到字幕数据',
      };
    }

    // 3. 准备翻译数据
    steps[1].status = 'completed';
    steps[2].status = 'running';
    await updateExecutionStatus(supabase, jobId, {
      progress: 20,
      metadata: {
        current_step: 'preparing',
        step_label: `准备翻译 ${transcripts.length} 条字幕`,
        steps_completed: 2,
        total_steps: steps.length,
        subtitle_count: transcripts.length,
        steps: steps,
      },
    });

    // 4. 准备待翻译的文本
    const textsToTranslate = (transcripts as Transcript[]).map((t) => {
      let sourceText = '';
      
      if (sourceLanguage === 'en' && t.text_en) {
        sourceText = t.text_en;
      } else if ((sourceLanguage === 'zh' || sourceLanguage === 'cn') && t.text_cn) {
        sourceText = t.text_cn;
      } else {
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
      console.error('[Translation Service] 没有找到可翻译的文本');
      
      steps[2].status = 'failed';
      await updateExecutionStatus(supabase, jobId, {
        status: 'failed',
        error_message: `没有找到源语言(${sourceLanguage})的字幕文本`,
        metadata: {
          steps: steps,
        },
      });

      return {
        success: false,
        error: `没有找到源语言(${sourceLanguage})的字幕文本`,
      };
    }

    // 5. 开始翻译
    steps[2].status = 'completed';
    steps[3].status = 'running';
    await updateExecutionStatus(supabase, jobId, {
      progress: 30,
      metadata: {
        current_step: 'translating',
        step_label: `正在翻译 (0/${textsToTranslate.length})`,
        steps_completed: 3,
        total_steps: steps.length,
        subtitle_count: textsToTranslate.length,
        translated_count: 0,
        steps: steps,
      },
    });

    const batchSize = 10;
    const translatedResults: Array<{ id: string; translation: string }> = [];
    let totalCost = 0;
    
    for (let i = 0; i < textsToTranslate.length; i += batchSize) {
      const batch = textsToTranslate.slice(i, i + batchSize);
      
      try {
        const batchResults = await translateBatch(batch, sourceLanguage, targetLanguage);
        
        batch.forEach((item: TranslateItem, index: number) => {
          translatedResults.push({
            id: item.id,
            translation: batchResults.translations[index] || item.text,
          });
        });
        
        totalCost += batchResults.cost || 0;
        
        // 更新进度和翻译计数
        const translatedCount = i + batch.length;
        const progress = Math.min(85, 30 + Math.floor(translatedCount / textsToTranslate.length * 55));
        
        await updateExecutionStatus(supabase, jobId, {
          progress,
          metadata: {
            current_step: 'translating',
            step_label: `正在翻译 (${translatedCount}/${textsToTranslate.length})`,
            steps_completed: 3,
            total_steps: steps.length,
            subtitle_count: textsToTranslate.length,
            translated_count: translatedCount,
            steps: steps,
          },
        });
          
      } catch (error) {
        console.error(`[Translation Service] 批次翻译失败:`, error);
        batch.forEach((item: TranslateItem) => {
          translatedResults.push({
            id: item.id,
            translation: item.text,
          });
        });
      }
    }

    // 6. 保存翻译结果
    steps[3].status = 'completed';
    steps[4].status = 'running';
    await updateExecutionStatus(supabase, jobId, {
      progress: 90,
      metadata: {
        current_step: 'saving',
        step_label: '保存翻译结果到数据库',
        steps_completed: 4,
        total_steps: steps.length,
        translated_count: translatedResults.length,
        steps: steps,
      },
    });

    const { error: updateError } = await supabase
      .rpc('batch_update_translations', {
        p_asset_id: assetId,
        p_target_language: targetLanguage,
        p_translations: translatedResults,
      });

    if (updateError) {
      console.error('[Translation Service] 批量更新翻译失败:', updateError);
      
      steps[4].status = 'failed';
      await updateExecutionStatus(supabase, jobId, {
        status: 'failed',
        error_message: `保存翻译失败: ${updateError.message}`,
        metadata: {
          steps: steps,
        },
      });

      return {
        success: false,
        error: `保存翻译失败: ${updateError.message}`,
      };
    }

    // 7. 完成
    steps[4].status = 'completed';
    await updateExecutionStatus(supabase, jobId, {
      status: 'completed',
      progress: 100,
      metadata: {
        current_step: 'completed',
        step_label: '翻译完成',
        steps_completed: steps.length,
        total_steps: steps.length,
        translated_count: translatedResults.length,
        total_cost: totalCost,
        steps: steps,
      },
    });

    const duration = Date.now() - startTime;

    console.error('[Translation Service] ✅ 翻译完成', {
      jobId,
      translatedCount: translatedResults.length,
      duration: `${duration}ms`,
      totalCost: `$${totalCost.toFixed(6)}`,
    });

    return {
      success: true,
      translatedCount: translatedResults.length,
      duration,
      totalCost,
    };

  } catch (error) {
    console.error('[Translation Service] 翻译任务异常:', error);

    const supabase = getSupabaseServiceClient();
    await updateExecutionStatus(supabase, jobId, {
      status: 'failed',
      error_message: error instanceof Error ? error.message : '未知错误',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}
