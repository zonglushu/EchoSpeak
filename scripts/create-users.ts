/**
 * 创建测试用户脚本
 * 使用 Supabase Management API 创建用户
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qpdmmzfravgswrezxsci.supabase.co';
// 需要使用 service_role key 才能绕过邮箱验证
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZG1temZyYXZnc3dyZXp4c2NpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjY2MTIyNiwiZXhwIjoyMDgyMjM3MjI2fQ.DfxME7FMs7qFWHN6omy_ezk0vxz4qcixGWMmUL_Tzq8';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUser(email: string, password: string, metadata: any) {
  console.log(`\n📧 创建用户: ${email}`);

  // 使用 admin API 创建用户（绕过邮箱验证）
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,  // 自动确认邮箱
    user_metadata: metadata,
  });

  if (error) {
    console.error(`❌ 创建失败:`, error.message);
    return null;
  }

  console.log(`✅ 创建成功!`);
  console.log(`   用户ID: ${data.user.id}`);
  console.log(`   邮箱: ${data.user.email}`);
  console.log(`   角色: ${data.user.user_metadata?.role}`);
  console.log(`   层级: ${data.user.user_metadata?.tier}`);

  return data.user;
}

async function createQuota(userId: string, tier: string, basicLimit: number, fullLimit: number) {
  const { error } = await supabase
    .from('user_quotas')
    .insert({
      user_id: userId,
      tier,
      daily_basic_limit: basicLimit,
      daily_full_limit: fullLimit,
    });

  if (error) {
    console.error(`❌ 创建配额失败:`, error.message);
  } else {
    console.log(`✅ 配额创建成功 (${tier})`);
  }
}

async function main() {
  console.log('🚀 开始创建测试用户...\n');

  // 创建管理员
  const admin = await createUser(
    'admin@echospeak.test',
    'admin1234',
    {
      full_name: 'EchoSpeak Admin',
      role: 'admin',
    }
  );

  if (admin) {
    // 更新 .env.local
    console.log(`\n📝 请更新 .env.local 中的 SUPABASE_DEFAULT_USER_ID 为:`);
    console.log(`   SUPABASE_DEFAULT_USER_ID=${admin.id}`);
  }

  // 创建 Free 用户
  const freeUser = await createUser(
    'free-user@echospeak.test',
    'test1234',
    {
      full_name: 'Free Tier User',
      role: 'user',
      tier: 'free',
    }
  );

  if (freeUser) {
    await createQuota(freeUser.id, 'free', 3, 1);
  }

  // 创建 Pro 用户
  const proUser = await createUser(
    'pro-user@echospeak.test',
    'test1234',
    {
      full_name: 'Pro Tier User',
      role: 'user',
      tier: 'pro',
    }
  );

  if (proUser) {
    await createQuota(proUser.id, 'pro', 20, 5);
  }

  // 创建 Premium 用户
  const premiumUser = await createUser(
    'premium-user@echospeak.test',
    'test1234',
    {
      full_name: 'Premium Tier User',
      role: 'user',
      tier: 'premium',
    }
  );

  if (premiumUser) {
    await createQuota(premiumUser.id, 'premium', -1, -1);
  }

  console.log('\n✅ 所有用户创建完成！');
  console.log('\n📋 测试账户列表:');
  console.log('   1. admin@echospeak.test / admin1234 (管理员)');
  console.log('   2. free-user@echospeak.test / test1234 (Free)');
  console.log('   3. pro-user@echospeak.test / test1234 (Pro)');
  console.log('   4. premium-user@echospeak.test / test1234 (Premium)');
}

main().then(() => {
  console.log('\n✅ 脚本执行完成');
  process.exit(0);
}).catch((err) => {
  console.error('\n❌ 脚本执行失败:', err);
  process.exit(1);
});
