# 🚀 P0 Features Quick Start Guide

## 快速开始使用 P0 核心留存功能

---

## 📋 前置检查

在开始之前，确保：

✅ 数据库迁移已完成（19个成就已导入）  
✅ Supabase 环境变量已配置  
✅ 应用编译无错误  

---

## 🎯 测试 P0 功能（5分钟快速测试）

### 1. 启动应用

```powershell
# 启动 learner 应用
cd D:\code\EchoSpeak
npm run dev:learner
```

访问: `http://localhost:5173`

---

### 2. 访问 Dashboard（⭐ 核心页面）

**方式 A: 直接访问**
```
http://localhost:5173/dashboard
```

**方式 B: 从首页导航**
- 点击首页右上角的 📊 图标

**期望结果：**
- ✅ 看到 6 个 P0 组件
- ✅ Streak Counter 显示
- ✅ 练习日历显示
- ✅ 空的历史记录
- ✅ 空的播放列表
- ✅ 成就列表（19个待解锁）
- ✅ 热门排行榜

---

### 3. 测试练习追踪（⏱️ 2分钟）

1. **选择视频**
   - 点击首页的任意视频
   - 或访问 `/video/video-1`

2. **开始练习**
   - 点击不同的句子（至少3个）
   - 观察绿色 ✓ 标记出现
   - 看到进度计数器更新（如 3/12）

3. **离开页面**
   - 点击返回按钮或导航到其他页面
   - 练习会话会自动保存

4. **验证数据记录**
   - 返回 Dashboard
   - 在 "Learning History" 中应该看到新的练习记录
   - Streak Counter 应该显示 1 天
   - 练习日历应该有一个标记

---

### 4. 测试成就系统（🏆 1分钟）

1. **查看成就**
   - 在 Dashboard 滚动到 "Achievement Badges"
   - 应该看到 "First Steps" 成就已解锁（完成首次练习）

2. **查看浏览器控制台**
   ```javascript
   // 应该看到类似信息:
   🎉 New achievements unlocked! [{
     code: 'first_practice',
     name: 'First Steps',
     ...
   }]
   ```

---

### 5. 测试播放列表（📋 1分钟）

1. **添加到播放列表**（功能需要在视频页面实现，当前演示 UI）
   - 在 Dashboard 的 "Practice Playlist" 区域
   - 查看 UI 布局

2. **管理播放列表**
   - 测试拖拽排序（如果有数据）
   - 点击 "开始练习" 按钮导航

---

### 6. 测试通知系统（🔔 30秒）

1. **打开通知管理器**
   - 在 Dashboard 顶部点击通知图标

2. **授予权限**
   - 点击 "Enable Notifications"
   - 在浏览器弹窗中允许通知

3. **设置提醒**
   - 选择提醒时间
   - 保存设置

---

## 📊 验证数据库记录

打开 Supabase Dashboard，执行以下查询：

### 验证练习历史

```sql
SELECT 
  id,
  video_title,
  duration_seconds,
  sentences_completed,
  practice_date,
  created_at
FROM practice_history
ORDER BY created_at DESC
LIMIT 5;
```

**期望结果：** 看到你刚才的练习记录

---

### 验证打卡记录

```sql
SELECT 
  checkin_date,
  streak_count,
  practice_duration_seconds,
  sentences_practiced
FROM user_checkins
ORDER BY checkin_date DESC
LIMIT 7;
```

**期望结果：** 今天的打卡记录

---

### 验证成就解锁

```sql
SELECT 
  ua.earned_at,
  a.name,
  a.description,
  a.xp_reward
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
ORDER BY ua.earned_at DESC;
```

**期望结果：** 至少看到 "First Steps" 成就

---

### 验证用户统计

```sql
SELECT 
  total_practice_seconds,
  total_sentences_practiced,
  current_streak,
  total_checkins,
  total_xp
FROM user_stats
WHERE user_id = 'your-user-id';
```

**期望结果：** 看到汇总的统计数据

---

## 🎨 UI 预览

### Dashboard 布局

```
┌──────────────────────────────────────────┐
│ 📊 Learning Dashboard    [🔔 通知]       │
├──────────────────────────────────────────┤
│                                          │
│  🔥 Streak Counter                       │
│  ┌────────────────────────────────────┐ │
│  │ 1 天连续打卡    今天: ✅           │ │
│  │ 最长: 1 天      本周: 10 分钟     │ │
│  └────────────────────────────────────┘ │
│                                          │
│  📅 Practice Calendar (6 months)         │
│  ┌────────────────────────────────────┐ │
│  │ [···] [···] [··•] [···] [···] [···]│ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌─────────────────┬──────────────────┐ │
│  │ 📊 History      │ ⭐ Playlist      │ │
│  ├─────────────────┼──────────────────┤ │
│  │ • Video 1 (5m)  │ • Saved Video 1  │ │
│  │ • Video 2 (3m)  │ • Saved Video 2  │ │
│  └─────────────────┴──────────────────┘ │
│                                          │
│  ┌─────────────────┬──────────────────┐ │
│  │ 🏆 Achievements │ 📈 Trending      │ │
│  ├─────────────────┼──────────────────┤ │
│  │ • First Steps ✅│ • Hot Video 1    │ │
│  │ • Week Warrior  │ • Hot Video 2    │ │
│  └─────────────────┴──────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Ready to Practice? [开始练习] →   │ │
│  └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

---

## 🐛 常见问题

### Q1: Dashboard 显示空白

**A:** 检查：
1. 是否已登录（user?.id 存在）
2. 浏览器控制台是否有错误
3. Supabase 环境变量是否正确

---

### Q2: 练习记录没有保存

**A:** 检查：
1. 练习时长是否 >= 10秒
2. 浏览器控制台查看错误
3. 确认 Supabase RLS 策略正确配置

---

### Q3: 成就没有解锁

**A:** 检查：
1. 是否满足成就条件（如练习 >= 10秒）
2. 查看 `checkAndAwardAchievements` 函数日志
3. 验证数据库中成就定义是否正确

---

### Q4: 通知不工作

**A:** 检查：
1. 是否使用 HTTPS 或 localhost
2. 浏览器是否支持 Web Push API
3. 是否授予了通知权限

---

## 📱 移动端测试

在手机浏览器上测试：

```
1. 确保手机和电脑在同一网络
2. 访问: http://[你的IP]:5173/dashboard
3. 测试所有功能
4. 验证响应式布局
```

**期望结果：**
- ✅ 响应式布局正常
- ✅ 触摸交互流畅
- ✅ 底部导航可见
- ✅ 所有组件可滚动

---

## 🎯 完整测试流程（10分钟）

```
1. [2分钟] 访问 Dashboard，浏览所有组件
2. [3分钟] 练习一个视频，完成5-10个句子
3. [2分钟] 返回 Dashboard，验证数据更新
4. [1分钟] 查看成就解锁
5. [1分钟] 测试播放列表 UI
6. [1分钟] 测试通知设置
```

---

## 📈 监控指标

建议监控的关键指标：

```sql
-- 今日活跃用户
SELECT COUNT(DISTINCT user_id) as daily_active
FROM user_checkins
WHERE checkin_date = CURRENT_DATE;

-- 连续打卡用户
SELECT COUNT(*) as streak_users
FROM user_stats
WHERE current_streak >= 7;

-- 成就完成率
SELECT 
  COUNT(DISTINCT user_id) * 100.0 / (SELECT COUNT(*) FROM auth.users) as achievement_rate
FROM user_achievements;

-- 平均练习时长
SELECT 
  AVG(duration_seconds) / 60.0 as avg_minutes
FROM practice_history
WHERE practice_date >= CURRENT_DATE - INTERVAL '7 days';
```

---

## ✅ 测试完成检查清单

- [ ] Dashboard 页面正常显示
- [ ] 练习追踪功能工作
- [ ] 数据正确保存到数据库
- [ ] 成就系统触发正常
- [ ] Streak Counter 显示正确
- [ ] 日历热力图显示
- [ ] 响应式布局正常
- [ ] 深色模式切换正常
- [ ] 通知设置可用
- [ ] 所有导航链接工作

---

## 🎓 下一步

完成测试后：

1. **收集用户反馈**
   - 邀请测试用户试用
   - 记录问题和建议

2. **优化性能**
   - 检查 API 调用次数
   - 优化数据库查询
   - 添加缓存

3. **准备 P1 功能**
   - 参考 `docs/08-feature/优先级.md`
   - 规划下一阶段开发

4. **监控指标**
   - 每天查看留存率
   - 跟踪成就完成率
   - 分析用户行为

---

## 📞 需要帮助？

遇到问题时：

1. 检查浏览器控制台
2. 查看 Supabase logs
3. 参考 `P0-IMPLEMENTATION-COMPLETE.md`
4. 检查 `P0-IMPLEMENTATION-GUIDE.md`

---

**祝测试顺利！** 🎉

如果所有功能正常，恭喜你成功实施了 P0 核心留存功能！
