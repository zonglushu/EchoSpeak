/**
 * Supabase Auth 测试脚本
 * 运行: npx tsx scripts/test-auth.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qpdmmzfravgswrezxsci.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZG1temZyYXZnc3dyZXp4c2NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjEyMjYsImV4cCI6MjA4MjIzNzIyNn0.Z2Ku-mxlwS1YyF0ykFbmUmmZXvnTTtY7yoUnNXDpo4E';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('🔍 测试 Supabase Auth 连接...\n');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseAnonKey.substring(0, 20) + '...\n');

  // 测试 1: 管理员登录
  console.log('📧 测试管理员登录...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@echospeak.test',
      password: 'admin1234',
    });

    if (error) {
      console.error('❌ 管理员登录失败:', error.message);
      console.error('   错误详情:', error);
    } else {
      console.log('✅ 管理员登录成功!');
      console.log('   用户ID:', data.user?.id);
      console.log('   邮箱:', data.user?.email);
      console.log('   角色:', data.user?.user_metadata?.role);
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.error('❌ 管理员登录异常:', err);
  }

  console.log('\n' + '-'.repeat(60) + '\n');

  // 测试 2: Free 用户登录
  console.log('📧 测试 Free 用户登录...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'free-user@echospeak.test',
      password: 'test1234',
    });

    if (error) {
      console.error('❌ Free 用户登录失败:', error.message);
      console.error('   错误详情:', error);
    } else {
      console.log('✅ Free 用户登录成功!');
      console.log('   用户ID:', data.user?.id);
      console.log('   邮箱:', data.user?.email);
      console.log('   层级:', data.user?.user_metadata?.tier);
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.error('❌ Free 用户登录异常:', err);
  }

  console.log('\n' + '-'.repeat(60) + '\n');

  // 测试 3: 检查数据库连接
  console.log('🗄️ 测试数据库连接...');
  try {
    const { data, error } = await supabase
      .from('user_quotas')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ 数据库查询失败:', error.message);
      console.error('   错误详情:', error);
    } else {
      console.log('✅ 数据库连接成功!');
      console.log('   查询结果:', data);
    }
  } catch (err) {
    console.error('❌ 数据库查询异常:', err);
  }
}

testAuth().then(() => {
  console.log('\n✅ 测试完成');
  process.exit(0);
}).catch((err) => {
  console.error('\n❌ 测试失败:', err);
  process.exit(1);
});
