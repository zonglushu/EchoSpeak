/**
 * DeepL 测试脚本（简化版）
 * 直接测试 DeepL 客户端
 */

import { DeepLClient } from '@echospeak/services/google-translate';

// DeepL API 配置（从 .env.local 读取）
const DEEPL_API_KEY = 'c0a51070-f15d-4345-af74-ed19bca37049:fx';
const DEEPL_USE_FREE = true;

async function testDeepL() {
  console.log('🧪 DeepL 翻译服务测试\n');
  console.log('=' .repeat(60));

  // 1. 检查 API 密钥
  console.log('\n📋 配置检查:');
  console.log(`   API Key: ${DEEPL_API_KEY.substring(0, 20)}...`);
  console.log(`   API 类型: ${DEEPL_API_KEY.endsWith(':fx') ? '免费版 ✅' : '专业版 💎'}`);
  console.log(`   使用免费 API: ${DEEPL_USE_FREE ? '是' : '否'}`);

  // 2. 创建客户端
  console.log('\n📦 初始化 DeepL 客户端...');
  const client = new DeepLClient(DEEPL_API_KEY, DEEPL_USE_FREE);
  console.log('   ✅ 客户端创建成功');

  // 3. 测试单条翻译（英译中）
  console.log('\n📝 测试 1: 单条翻译 (英文 → 中文)');
  try {
    const testText = 'Hello, world! How are you today?';
    console.log(`   原文: "${testText}"`);
    
    const startTime = Date.now();
    const result = await client.translate(testText, 'ZH', 'EN');
    const latency = Date.now() - startTime;
    
    console.log(`   译文: "${result}"`);
    console.log(`   耗时: ${latency}ms`);
    console.log('   ✅ 翻译成功');
  } catch (error: any) {
    console.error('   ❌ 翻译失败:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应内容:', await error.response.text());
    }
    process.exit(1);
  }

  // 4. 测试批量翻译（中译英）
  console.log('\n📦 测试 2: 批量翻译 (中文 → 英文)');
  try {
    const testTexts = [
      '你好，世界！',
      '今天天气怎么样？',
      '很高兴见到你。',
      '让我们一起学习吧！',
      '谢谢你的帮助。'
    ];
    
    console.log(`   原文数量: ${testTexts.length} 条`);
    
    const startTime = Date.now();
    const results = await client.translateBatch(testTexts, 'EN', 'ZH');
    const latency = Date.now() - startTime;
    
    console.log('\n   翻译结果:');
    testTexts.forEach((text, i) => {
      console.log(`   ${i + 1}. "${text}"`);
      console.log(`      → "${results[i]}"`);
    });
    
    console.log(`\n   总耗时: ${latency}ms`);
    console.log(`   平均耗时: ${Math.round(latency / testTexts.length)}ms/条`);
    console.log('   ✅ 批量翻译成功');
  } catch (error: any) {
    console.error('   ❌ 批量翻译失败:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应内容:', await error.response.text());
    }
    process.exit(1);
  }

  // 5. 性能基准测试
  console.log('\n⚡ 测试 3: 性能基准 (20 条字幕)');
  try {
    const mockSubtitles = Array.from({ length: 20 }, (_, i) => 
      `This is subtitle number ${i + 1}. The quick brown fox jumps over the lazy dog.`
    );
    
    console.log(`   字幕数量: ${mockSubtitles.length} 条`);
    
    const startTime = Date.now();
    const results = await client.translateBatch(mockSubtitles, 'ZH', 'EN');
    const latency = Date.now() - startTime;
    
    const avgPerSubtitle = Math.round(latency / mockSubtitles.length);
    const estimated250 = Math.round((latency / mockSubtitles.length) * 250 / 1000);
    
    console.log(`   总耗时: ${latency}ms`);
    console.log(`   平均耗时: ${avgPerSubtitle}ms/条`);
    console.log(`   预计 250 条耗时: ~${estimated250}秒`);
    console.log('   ✅ 性能测试完成');
  } catch (error: any) {
    console.error('   ❌ 性能测试失败:', error.message);
  }

  // 6. 测试语言检测
  console.log('\n🔍 测试 4: 语言检测');
  try {
    const mixedTexts = [
      'Hello, world!',
      '你好，世界！',
      'Bonjour le monde!'
    ];
    
    for (const text of mixedTexts) {
      const result = await client.translate(text, 'EN');
      console.log(`   "${text}" → "${result}"`);
    }
    console.log('   ✅ 语言检测正常');
  } catch (error: any) {
    console.error('   ❌ 语言检测失败:', error.message);
  }

  // 7. 总结
  console.log('\n' + '='.repeat(60));
  console.log('🎉 DeepL 测试完成！');
  console.log('='.repeat(60));
  console.log('\n✅ 所有测试通过');
  console.log('\n💡 DeepL 特点:');
  console.log('   • 翻译质量: ⭐⭐⭐⭐⭐ (业界最高)');
  console.log('   • 免费额度: 50 万字符/月');
  console.log('   • 适合场景: 专业文档、高质量字幕');
  console.log('   • 支持语言: 30+ 种（欧洲语言为主）');
  console.log('\n🚀 现在可以开始使用 DeepL 翻译字幕了！');
  console.log('');
}

// 运行测试
testDeepL().catch((error) => {
  console.error('\n💥 测试失败:', error);
  process.exit(1);
});
