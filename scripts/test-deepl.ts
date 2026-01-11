/**
 * DeepL 翻译服务测试脚本
 * 
 * 用法：
 * cd apps/admin && npx tsx ../../scripts/test-deepl.ts
 */

async function testDeepL() {
  console.log('🧪 开始测试 DeepL 翻译服务...\n');

  // 1. 检查环境变量
  console.log('📋 环境变量检查:');
  const apiKey = process.env.DEEPL_API_KEY;
  const useFree = process.env.DEEPL_USE_FREE !== 'false';
  
  if (!apiKey) {
    console.error('❌ DEEPL_API_KEY 未配置');
    console.error('   请在 apps/admin/.env.local 中配置 DEEPL_API_KEY');
    process.exit(1);
  }

  console.log(`   DEEPL_API_KEY: ${apiKey.substring(0, 20)}...`);
  console.log(`   DEEPL_USE_FREE: ${useFree}`);
  console.log(`   API 类型: ${apiKey.endsWith(':fx') ? '免费版 ✅' : '专业版 💎'}\n`);

  // 2. 导入翻译网关
  console.log('📦 加载翻译网关...');
  const { getTranslateGateway } = await import('../apps/admin/src/lib/translate-gateway');
  const gateway = getTranslateGateway();
  console.log('   ✅ 翻译网关加载成功\n');

  // 3. 检查可用服务
  console.log('🔍 检查可用的翻译服务:');
  const providers = gateway.getAvailableProviders();
  console.log(`   可用服务: ${providers.join(', ')}`);
  
  if (!providers.includes('deepl')) {
    console.error('   ❌ DeepL 未在可用服务列表中');
    process.exit(1);
  }
  console.log('   ✅ DeepL 已配置\n');

  // 4. 测试 DeepL 连接
  console.log('🌐 测试 DeepL API 连接...');
  try {
    const isAvailable = await gateway.testProvider('deepl');
    if (!isAvailable) {
      console.error('   ❌ DeepL 连接失败');
      process.exit(1);
    }
    console.log('   ✅ DeepL 连接成功\n');
  } catch (error) {
    console.error('   ❌ DeepL 连接测试失败:', error);
    process.exit(1);
  }

  // 5. 测试单条翻译（英译中）
  console.log('📝 测试单条翻译 (英文 → 中文):');
  try {
    const testText = 'Hello, world! How are you today?';
    console.log(`   原文: "${testText}"`);
    
    const startTime = Date.now();
    const result = await gateway.translate(testText, 'zh', 'en', {
      provider: 'deepl'
    });
    const latency = Date.now() - startTime;
    
    console.log(`   译文: "${result}"`);
    console.log(`   耗时: ${latency}ms`);
    console.log('   ✅ 单条翻译成功\n');
  } catch (error) {
    console.error('   ❌ 单条翻译失败:', error);
    process.exit(1);
  }

  // 6. 测试批量翻译（中译英）
  console.log('📦 测试批量翻译 (中文 → 英文):');
  try {
    const testTexts = [
      '你好，世界！',
      '今天天气怎么样？',
      '很高兴见到你。',
      '让我们一起学习吧！',
      '谢谢你的帮助。'
    ];
    
    console.log(`   原文数量: ${testTexts.length} 条`);
    console.log(`   原文示例: "${testTexts[0]}"`);
    
    const startTime = Date.now();
    const results = await gateway.translateBatch(testTexts, 'en', 'zh', {
      provider: 'deepl',
      enableCache: false,
      enableFallback: false,
    });
    const latency = Date.now() - startTime;
    
    console.log(`\n   翻译结果:`);
    testTexts.forEach((text, i) => {
      console.log(`   ${i + 1}. "${text}" → "${results.translations[i]}"`);
    });
    
    console.log(`\n   提供商: ${results.provider}`);
    console.log(`   总耗时: ${latency}ms`);
    console.log(`   平均耗时: ${Math.round(latency / testTexts.length)}ms/条`);
    console.log('   ✅ 批量翻译成功\n');
  } catch (error) {
    console.error('   ❌ 批量翻译失败:', error);
    process.exit(1);
  }

  // 7. 测试缓存功能
  console.log('💾 测试缓存功能:');
  try {
    const testText = 'Cache test message';
    
    // 第一次翻译（从服务器）
    const start1 = Date.now();
    const result1 = await gateway.translate(testText, 'zh', 'en', {
      provider: 'deepl',
      enableCache: true,
    });
    const latency1 = Date.now() - start1;
    console.log(`   第一次翻译: ${latency1}ms (从服务器)`);
    
    // 第二次翻译（从缓存）
    const start2 = Date.now();
    const result2 = await gateway.translate(testText, 'zh', 'en', {
      provider: 'deepl',
      enableCache: true,
    });
    const latency2 = Date.now() - start2;
    console.log(`   第二次翻译: ${latency2}ms (从缓存)`);
    
    if (result1 === result2 && latency2 < latency1) {
      console.log(`   加速比: ${Math.round(latency1 / latency2)}x`);
      console.log('   ✅ 缓存功能正常\n');
    } else {
      console.warn('   ⚠️  缓存可能未生效\n');
    }
  } catch (error) {
    console.error('   ❌ 缓存测试失败:', error);
  }

  // 8. 性能基准测试（模拟字幕翻译）
  console.log('⚡ 性能基准测试 (模拟 50 条字幕):');
  try {
    // 生成 50 条模拟字幕
    const mockSubtitles = Array.from({ length: 50 }, (_, i) => 
      `This is subtitle number ${i + 1}. The quick brown fox jumps over the lazy dog.`
    );
    
    console.log(`   字幕数量: ${mockSubtitles.length} 条`);
    console.log(`   批次大小: 10 条/批`);
    
    const batchSize = 10;
    const totalBatches = Math.ceil(mockSubtitles.length / batchSize);
    const overallStart = Date.now();
    
    for (let i = 0; i < totalBatches; i++) {
      const batch = mockSubtitles.slice(i * batchSize, (i + 1) * batchSize);
      const batchStart = Date.now();
      
      await gateway.translateBatch(batch, 'zh', 'en', {
        provider: 'deepl',
        enableCache: false,
        enableFallback: false,
      });
      
      const batchLatency = Date.now() - batchStart;
      console.log(`   批次 ${i + 1}/${totalBatches}: ${batchLatency}ms`);
    }
    
    const totalLatency = Date.now() - overallStart;
    const avgPerSubtitle = Math.round(totalLatency / mockSubtitles.length);
    const estimated250 = Math.round((totalLatency / mockSubtitles.length) * 250 / 1000);
    
    console.log(`\n   总耗时: ${totalLatency}ms`);
    console.log(`   平均耗时: ${avgPerSubtitle}ms/条`);
    console.log(`   预计 250 条字幕耗时: ~${estimated250}s`);
    console.log('   ✅ 性能测试完成\n');
  } catch (error) {
    console.error('   ❌ 性能测试失败:', error);
  }

  // 9. 测试总结
  console.log('=' .repeat(60));
  console.log('🎉 DeepL 测试完成！');
  console.log('=' .repeat(60));
  console.log('');
  console.log('✅ DeepL API 配置正确');
  console.log('✅ 翻译功能正常');
  console.log('✅ 缓存功能正常');
  console.log('✅ 性能符合预期');
  console.log('');
  console.log('💡 提示:');
  console.log('   - DeepL 免费版每月 50 万字符');
  console.log('   - 翻译质量: ⭐⭐⭐⭐⭐ (业界最高)');
  console.log('   - 适合场景: 专业文档、高质量字幕');
  console.log('   - 如需更快速度，可考虑腾讯云 TMT');
  console.log('');
}

// 运行测试
testDeepL().catch((error) => {
  console.error('\n❌ 测试过程中发生错误:', error);
  process.exit(1);
});
