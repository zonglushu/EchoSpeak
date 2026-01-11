/**
 * 触发待处理的翻译任务
 * 
 * 用法:
 * 1. 触发特定 job:
 *    npx tsx scripts/trigger-translate.ts <job-id>
 * 
 * 2. 触发所有待处理的 jobs:
 *    npx tsx scripts/trigger-translate.ts --batch
 * 
 * 3. 查看待处理的 jobs:
 *    npx tsx scripts/trigger-translate.ts --list
 */

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function listPendingJobs() {
  console.log('\n📋 查看待处理的翻译任务...\n');
  
  try {
    const response = await fetch(`${appUrl}/api/jobs/trigger-translate`);
    const data = await response.json();
    
    if (data.count === 0) {
      console.log('✅ 没有待处理的翻译任务');
      return;
    }
    
    console.log(`找到 ${data.count} 个待处理的翻译任务:\n`);
    
    data.jobs.forEach((job: any, index: number) => {
      console.log(`${index + 1}. Job ID: ${job.id}`);
      console.log(`   翻译: ${job.source_language} → ${job.target_language}`);
      console.log(`   Asset ID: ${job.pipelines.asset_id}`);
      console.log(`   创建时间: ${job.created_at}`);
      console.log();
    });
    
    console.log(`\n💡 提示: 运行 "npx tsx scripts/trigger-translate.ts --batch" 批量触发`);
  } catch (error) {
    console.error('❌ 获取待处理任务失败:', error);
  }
}

async function triggerSingleJob(jobId: string) {
  console.log(`\n🚀 触发翻译任务: ${jobId}\n`);
  
  try {
    const response = await fetch(`${appUrl}/api/jobs/trigger-translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobId }),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ 翻译任务触发成功!');
      console.log('\n结果:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error('❌ 触发失败:');
      console.error(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ 触发任务异常:', error);
  }
}

async function triggerBatchJobs() {
  console.log('\n🚀 批量触发所有待处理的翻译任务...\n');
  
  try {
    const response = await fetch(`${appUrl}/api/jobs/trigger-translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ batchMode: true }),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ 批量触发完成!');
      console.log(`\n总计: ${result.total} 个任务`);
      console.log(`成功: ${result.successCount} 个`);
      console.log(`失败: ${result.failCount} 个`);
      
      if (result.results && result.results.length > 0) {
        console.log('\n详细结果:');
        result.results.forEach((r: any, index: number) => {
          const status = r.success ? '✅' : '❌';
          console.log(`${index + 1}. ${status} Job ${r.jobId}`);
          if (!r.success) {
            console.log(`   错误: ${r.error || JSON.stringify(r.result)}`);
          }
        });
      }
    } else {
      console.error('❌ 批量触发失败:');
      console.error(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ 批量触发异常:', error);
  }
}

// 主函数
async function main() {
  const arg = process.argv[2];
  
  if (!arg) {
    console.log('\n用法:');
    console.log('  npx tsx scripts/trigger-translate.ts <job-id>     # 触发特定任务');
    console.log('  npx tsx scripts/trigger-translate.ts --batch      # 批量触发');
    console.log('  npx tsx scripts/trigger-translate.ts --list       # 查看待处理任务');
    console.log('\n示例:');
    console.log('  npx tsx scripts/trigger-translate.ts abc123');
    console.log('  npx tsx scripts/trigger-translate.ts --batch');
    process.exit(1);
  }
  
  if (arg === '--list') {
    await listPendingJobs();
  } else if (arg === '--batch') {
    await triggerBatchJobs();
  } else {
    await triggerSingleJob(arg);
  }
}

main().catch(console.error);
