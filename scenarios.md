# User Scenarios: Personas & Learning Modes

我们将用户场景从具体的"时间/地点"抽象为三种核心的**学习模式 (Learning Modes)**，并结合典型**用户画像 (Personas)** 来说明不同用户如何利用这些模式。

## 1. 用户画像 (Personas)

| 角色 | 痛点 (Pain Points) | 目标 (Goals) | 核心学习模式偏好 |
| :--- | :--- | :--- | :--- |
| **职场进阶者 (Alex)** | 发音不自信，开会不敢发言；词汇量够但说不出来（哑巴英语）。 | **Professional Presence**: 想听起来更专业、更自信。 | **伴随式** (利用通勤) + **高频实战** (攻克会议场景) |
| **备考学生 (Lily)** | 雅思/托福口语卡分；经常因为不知如何展开话题而卡顿。 | **High Score**: 需要流利度与逻辑性的双重提升。 | **高频实战** (刷题) + **思维内化** (逻辑重构) |
| **兴趣/旅游党 (Uncle Sam)** | 只能蹦单词，无法连成句；怕老外听不懂。 | **Survival English**: 能沟通就行，不追求完美发音。 | **伴随式** (磨耳朵) + **思维内化** (趣味视频复述) |

---

## 2. 核心学习模式 (Learning Modes)

### A. 伴随式听感输入 (Companion Input Mode)
> *对应原"通勤场景" | 状态: Hands-busy, Ears-free*

**核心定义**:
低认知负荷下的听力输入与轻声开口，侧重培养语感流利度 (Flow)。
**具体任务 (Concrete Tasks)**:
1.  **Whisper Shadowing (轻声跟读流)**:
    *   耳机里播放 News/Podcast。
    *   用户轻声跟读，AI 捕捉微弱语音。
    *   **评分重点**: 不纠结单个音素，只震动反馈**语调 (Intonation)** 和 **节奏 (Rhythm)** 的偏离。
2.  **One-Tap Collection (一键收藏)**:
    *   听到好词句，双击耳机键或点一下大按钮。
    *   自动截取前后句存入 "今日语块本" (Chunk Notebook)，供后续深度练习。

### B. 高频交互实战 (Intensive Interaction Mode)
> *对应原"居家深度" | 状态: High Focus, Visual-assisted*

**核心定义**:
高认知负荷下的"发音+内容"综合训练，侧重精准度 (Accuracy) 和语用能力 (Pragmatics)。
**具体任务 (Concrete Tasks)**:
1.  **Gated Roleplay (闯关式角色扮演)**:
    *   **Mission**: "向老板解释为什么项目延期" (Persuasion)。
    *   **Prerequisite**: 必须先练准 "delay", "schedule", "unforeseen" 三个词的发音 (Drill)。
    *   **Action**: 进入对话，只有对方听懂并接受解释，才算 Mission Complete。
2.  **AI Coach Feedback (多维反馈)**:
    *   对话结束后，展示发音热力图。
    *   **Grammar**: "你说了 'I delay the project', 更好是 'The project was delayed' (被动语态更客观)"。

### C. 思维内化与重构 (Reflective Consolidation Mode)
> *对应原"睡前/复述" | 状态: Reflective, Low-Stress*

**核心定义**:
侧重于知识的整理、复盘和逻辑重构，将短期记忆转化为长期记忆。
**具体任务 (Concrete Tasks)**:
1.  **Video Retelling (视频复述)**:
    *   看一段 30s 趣味视频。
    *   AI 提问: "Why was she angry?"
    *   用户回答: "Because her boyfriend was late."
2.  **Logic Rewriting (逻辑重写)**:
    *   AI 挑战: "Can you say that using the word 'furious'?"
    *   用户尝试: "Because her boyfriend was late, she was furious."
3.  **Chunk Activation (语块激活)**:
    *   回顾今日在"伴随模式"收藏的语块，尝试用它们造句。

---

## 3. 用户旅程示例 (User Journey Example: Alex)
1.  **早晨 (Commute)**: 在地铁上听商务英语播客，听到 "We need to align on this" 觉得很地道，一键收藏 (**Mode A**)。
2.  **晚上 (Deep Work)**: 打开 APP，AI 提示"你今天收藏了3个语块，要不要试着用在对话里？"。进入 "Team Alignment" 的模拟对话任务 (**Mode B**)。
3.  **睡前 (Relax)**: 刷到一个关于"美国职场潜规则"的短视频，简单的复述了一下观点，巩固记忆 (**Mode C**)。

这个redesign_proposal.md是符合skill的一个learner端顶层设计的一个文档，那现在根据这个完整的redesign_proposal.md和learner-end的skill，把implementation_PLAN.md文档的内容补充完整一下，这个imple文档用来描述交互和技术细节的