# Learner App Redesign: From Features to Modes

> **基于**: `skills/learner-end` (用户画像与学习场景)
> **目标**: 实现 "3 Core Learning Modes" 的顶层设计
> **转型**: 从 "课程列表式 (Course-based)" → "任务导向式 (Task-based)"

---

## 📋 目录

1. [用户画像映射](#2-用户画像映射personas)
2. [现状盘点与处理构想](#3-现状盘点与处理构想-inventory--action-plan)
3. [新架构设计](#4-新架构设计-new-architecture)
4. [三大核心模式详解](#5-三大核心模式详解)
5. [UI/UX 设计规范](#6-uiux-设计规范)
6. [技术架构与性能策略](#7-技术架构与性能策略)
7. [实施阶段](#8-实施阶段)

---

## 2. 用户画像映射（Personas）

基于 `skills/learner-end/references/personas.md`，我们的三种核心用户类型及其模式偏好：

### 2.1 职场进阶者 (Alex - Working Professional)

**核心需求**: Professional Presence & Meeting Confidence

| 时间段 | 推荐模式 | 内容策略 | 交互特点 |
|:---|:---|:---|:---|
| **早晨通勤** (07:30-08:30) | **Flow** | Business Podcast / TED Talks | 被动输入 + 一键收藏商务短语 |
| **午休** (14:00-14:10) | **Think** | Chunk Activation | 快速造句练习（5-10分钟） |
| **晚上** (20:00-20:45) | **Battle** | Meeting / Negotiation Scenarios | Gated Roleplay（发音 Gate + 对话实战）|
| **睡前** (23:00-23:15) | **Think** | Business Video Retelling | 轻度复盘 + 明日安排 |

**关键功能需求**:
- ✅ 一键收藏商务语块（"align on", "touch base"）
- ✅ 会议场景模拟（项目延期、预算谈判）
- ✅ 发音反馈（专业语调）
- ✅ 10-20分钟微学习窗口

---

### 2.2 备考学生 (Lily - Exam Prepper)

**核心需求**: IELTS/TOEFL High Score

| 时间段 | 推荐模式 | 内容策略 | 交互特点 |
|:---|:---|:---|:---|
| **空闲时段** | **Flow** | Academic Lectures | 词汇积累 + 背景知识 |
| **学习时段** | **Battle** | IELTS Speaking Simulation | Part 1/2/3 全真模拟 |
| **复习时段** | **Think** | Logic Rewriting | 句式升级（从简单到复杂）|

**关键功能需求**:
- ✅ 考试题库（IELTS/TOEFL Speaking Topics）
- ✅ 计时练习（模拟真实考试）
- ✅ 评分 Rubrics（Fluency, Grammar, Vocabulary）
- ✅ 逻辑扩展训练（How to extend answers）

---

### 2.3 兴趣/旅游党 (Uncle Sam - Casual Learner)

**核心需求**: Survival English & Fun

| 时间段 | 推荐模式 | 内容策略 | 交互特点 |
|:---|:---|:---|:---|
| **周末上午** | **Flow** | Travel Vlogs / Movies | 趣味内容 + 轻声跟读 |
| **晚上** | **Think** | Comedy Retelling | Video 复述 + 评分（鼓励为主）|
| **偶尔** | **Battle** | Survival Scenarios | 轻度对话（点餐、问路）|

**关键功能需求**:
- ✅ 娱乐性内容（电影、旅游视频）
- ✅ 生存场景（酒店、餐厅、购物）
- ✅ 正向反馈（鼓励式评分）
- ✅ 社交选项（可选分享）

---

## 3. 现状盘点与处理构想 (Inventory & Action Plan)

基于 `apps/learner/src/pages` 的代码扫描，我们制定以下 "Keep / Modify / Delete" 策略：

| 现有页面/组件 | 功能简述 | 判定 | 处理方案 (Migration Plan) |
| :--- | :--- | :--- | :--- |
| **HomePage.tsx** | 传统的 Feed 流/课程推荐 | **REFACTOR** | **改为 "Daily Mode Dashboard"**。不再推荐"课程"，而是根据时间段推荐"模式任务"（早晨推伴随，晚上推实战）。 |
| **VideoLearningPage.tsx** | 视频播放与学习 | **KEEP & MOVE** | 移入 **Mode C (内化模式)**。作为 "Video Retelling" 的输入源。 |
| **PracticePage.tsx** | 各种练习的集合 | **SPLIT** | 拆解。发音 Drill 归入 **Mode B** 前置关卡；Roleplay 归入 **Mode B** 核心关卡。 |
| **DiscoverPage.tsx** | 发现更多内容 | **MODIFY** | 改为 **"Resource Library"**。供用户主动寻找 Mode A 的听力素材或 Mode C 的视频素材。 |
| **CheckinCalendarV2** | 打卡日历 | **KEEP** | 保留。Streak 是跨模式通用的激励机制。 |
| **DailyGoals.tsx** | 每日目标 | **MODIFY** | 目标不再是 "学习30分钟"，而是 "获得3个Mode徽章" (听感/实战/内化)。 |
| **SubscriptionPage** | 订阅 | **KEEP** | 保持不变。 |
| **HelpPage** | 帮助 | **KEEP** | 保持不变。 |

## 2. 新架构设计 (New Architecture)

**核心决策: 采用 "Dynamic Pill" (灵动岛悬浮) 导航。**

我们抛弃传统的底部导航栏，采用极致简约的悬浮胶囊设计，以最大化内容的沉浸感。

### The Dynamic Pill (交互规范)
*   **外观**: 屏幕底部中央悬浮的一个小胶囊 (Capsule)。
    *   *Normal State*: 显示当前模式的 Icon 和名称 (e.g., "[ 🌊 Flow ]")。
    *   *Expanded State*: 点击胶囊，向上展开圆形菜单 (Pie Menu) 或列表，展示所有模式选项。
*   **模式定义**:
    1.  **Flow (伴随)**: 
        *   *Icon*: 🌊 (Wave/Headphones)
        *   *Default*: Morning/Commute
    2.  **Battle (实战)**: 
        *   *Icon*: ⚔️ (Sword/Fire)
        *   *Default*: Evening/Focus
    3.  **Think (内化)**:
        *   *Icon*: 💡 (Bulb/Note)
        *   *Default*: Bedtime/Review
    4.  **Profile (我的)**:
        *   *Icon*: 👤 (User)
        *   *Access*: 通过胶囊展开菜单访问，或在首页右上角保留入口。

### "Smart Default + Manual Overlay" 策略
*   **启动**: App 启动时计算 `TargetMode`，直接展示该模式的内容，胶囊显示该模式的名字。
*   **切换**: 用户随时点击胶囊切换到其他宇宙。

## 3. 核心体验重构 (UX Redesign)

### A. 动态入口与手动控制 (Dynamic Entry & Manual Control)
*   **无主页设计**: 三个模式即三个主页。
*   **沉浸式背景**: 切换模式时，不仅内容变，背景色/主题色也要平滑过渡 (Flow=Green, Battle=Red, Think=Blue)。

### B. 统一的 "Chunk Notebook" (语块本)
打通三个模式的**数据层**。
*   **Mode A (Flow)**: 来源。一键收藏产生语块。
*   **Mode B (Battle)**: 使用。系统提示 "Try to use these chunks in your roleplay"。
*   **Mode C (Think)**: 巩固。系统生成针对这些语块的造句练习。

## 4. 新架构设计 (New Architecture)



