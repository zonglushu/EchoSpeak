# EchoSpeak Learner App - Complete Implementation Plan

> **Based on**: `redesign_proposal.md`, `scenarios.md`, and `skills/learner-end`
> **Goal**: Implement the 3 Core Learning Modes architecture with detailed interaction and technical specifications
> **Approach**: Mode-driven design with seamless transitions and cross-mode data flow

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Mode A: Flow (Companion Input)](#2-mode-a-flow-companion-input)
3. [Mode B: Battle (Intensive Interaction)](#3-mode-b-battle-intensive-interaction)
4. [Mode C: Think (Reflective Consolidation)](#4-mode-c-think-reflective-consolidation)
5. [Cross-Mode Integration](#5-cross-mode-integration)
6. [Technical Infrastructure](#6-technical-infrastructure)
7. [Implementation Phases](#7-implementation-phases)
8. [Success Metrics](#8-success-metrics)

---

## 1. Architecture Overview

### 1.1 Design Philosophy

**From Course-based to Task-based Learning**

- **Old Paradigm**: Course list → Video library → Practice exercises
- **New Paradigm**: Time-aware mode suggestion → Task execution → Cross-mode reinforcement

**Three Modes, Three User States**

| Mode | User State | Cognitive Load | Primary Goal | Time Context |
|:---|:---|:---|:---|:---|
| **Flow** | Hands-busy, Ears-free | Low | Rhythm & Intonation absorption | Morning commute (5:00-12:00) |
| **Battle** | High Focus, Visual-assisted | High | Accuracy & Pragmatics | Evening practice (12:00-21:00) |
| **Think** | Reflective, Low-Stress | Medium | Logic & Memory consolidation | Bedtime review (21:00-5:00) |

### 1.2 Navigation System: The Dynamic Pill

**Current Status**: ✅ Implemented (`DynamicPillNav.tsx`)

**Behavior**:
- **Collapsed State**: Shows current mode icon + name in floating capsule
- **Expanded State**: Circular/pie menu with all 4 options (Flow, Battle, Think, Profile)
- **Smart Default**: Auto-selects mode based on time of day
- **Manual Override**: User can always tap to expand and switch

**Theme Integration**:
```
Flow Mode   → Teal/Green gradient  (calm, passive)
Battle Mode → Rose/Red gradient    (energetic, intense)
Think Mode  → Indigo/Blue gradient (reflective, calm)
```

### 1.3 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Shared Data Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Chunk        │  │ Performance  │  │ User         │      │
│  │ Notebook     │←→│ History      │←→│ Preferences  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
         ↑                    ↑                    ↑
    One-Tap Save        Session Results      Mode Selection
         │                    │                    │
┌────────┴────────┐  ┌──────┴───────┐  ┌────────┴────────┐
│   Flow Mode     │  │ Battle Mode  │  │  Think Mode     │
│  (Collection)   │  │ (Usage)      │  │ (Activation)    │
└─────────────────┘  └──────────────┘  └─────────────────┘
```

---

## 2. Mode A: Flow (Companion Input)

> **User Persona Context**:
> - *职场进阶者*: Morning commute, business podcasts
> - *备考学生*: Academic lectures during breaks
> - *兴趣/旅游党*: Travel vlogs, entertainment content

### 2.1 Core Features

#### Feature 1: Whisper Shadowing (轻声跟读)

**Status**: 🚧 Partially implemented (needs sensitive audio capture)

**Interaction Design**:
```
┌─────────────────────────────────────┐
│          [Album Art Area]           │
│      (Faded/Blurred in background)   │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│    "So, how have you been lately?"   │  ← Active line (centered)
│    "最近过得怎么样？"                  │  ← Translation (appears below)
│          [ ❤️ Save ]                 │  ← One-tap action
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│     [◀️ Prev]  [⏸️ Play]  [▶️ Next]  │
│     ══════════════════════════       │  ← Progress bar
└─────────────────────────────────────┘
```

**Technical Implementation**:

**Component**: `WhisperShadowingEngine.ts` (NEW)

```typescript
interface WhisperDetectionConfig {
  sensitivity: number;      // -30dB to -50dB threshold
  noiseSuppression: boolean; // Filter environmental noise
  bufferSize: number;        // 4096 samples for WebAudio API
  analysisWindow: number;   // 200ms intervals
}

interface IntonationFeedback {
  hasPattern: boolean;      // Detected rising/falling/contour
  deviation: number;        // 0-1 score (1 = perfect match)
  hapticType: 'pulse' | 'double-tap' | 'triple-buzz';
}
```

**Audio Processing Pipeline**:
1. **Input**: Web Audio API `AudioContext` + `MediaStreamSource`
2. **Pre-processing**: High-pass filter (>80Hz) to remove rumble
3. **Detection**: RMS amplitude analysis for voice activity
4. **Feature Extraction**: Pitch contour (autocorrelation)
5. **Comparison**: User contour vs. reference audio contour
6. **Feedback**: Haptic vibration via `navigator.vibrate()`

**Key Algorithms**:
- **Pitch Detection**: YIN algorithm or autocorrelation for F0 extraction
- **Contour Matching**: Dynamic Time Warping (DTW) for pattern similarity
- **Rhythm Scoring**: Onset detection + timing alignment

**Browser Compatibility**:
- ✅ Chrome/Edge (Full Web Audio API)
- ✅ Safari (iOS 14.5+)
- ⚠️ Firefox (Full API but haptic support varies)

---

#### Feature 2: One-Tap Collection (一键收藏)

**Status**: ✅ Implemented (basic version in `LyricStream.tsx`)

**Current Implementation**:
- Heart icon appears next to active line
- Click triggers toast notification
- Saves to console log (placeholder)

**Enhancement Requirements**:

**Data Structure**:
```typescript
interface SavedChunk {
  id: string;              // UUID
  text: string;            // English phrase
  translation: string;     // Chinese translation
  startTime: number;       // Video timestamp
  duration: number;        // Phrase duration
  sourceId: string;        // Video/Asset ID
  contextBefore: string;   // 5s before transcript
  contextAfter: string;    // 5s after transcript
  category: ChunkCategory; // Auto-classified
  collectedAt: number;     // Timestamp
  practiceCount: number;   // Times used in Battle/Think
  masteryLevel: number;    // 0-1 score
}

enum ChunkCategory {
  BUSINESS = 'business',
  ACADEMIC = 'academic',
  DAILY_LIFE = 'daily_life',
  TRAVEL = 'travel',
  IDIOM = 'idiom',
  CUSTOM = 'custom'
}
```

**Storage Layer**:
```typescript
// apps/learner/src/services/chunkService.ts (NEW)
export const chunkService = {
  async saveChunk(chunk: SavedChunk): Promise<void> {
    const db = await openDB();
    const tx = db.transaction('chunks', 'readwrite');
    await tx.objectStore('chunks').put(chunk);
  },

  async getChunksByCategory(category: ChunkCategory): Promise<SavedChunk[]> {
    // Implementation with index lookup
  },

  async getDueForReview(): Promise<SavedChunk[]> {
    // Spaced repetition logic (Day 1, 3, 7, 14)
  },

  async classifyChunk(text: string): Promise<ChunkCategory> {
    // Simple keyword matching or ML classifier
    const businessKeywords = ['align', 'schedule', 'deliverable', 'bandwidth'];
    const academicKeywords = ['hypothesis', 'methodology', 'analysis'];
    // ... classification logic
  }
};
```

**UI Enhancements**:
1. **Double-tap Headphone Support**:
   - Listen for HID events via WebHID API (limited support)
   - Fallback: In-app large button (already implemented)

2. **Smart Buffering**:
   - Maintain rolling 10s buffer in memory
   - When user taps "Save", capture ±5s around current timestamp

3. **Deduplication**:
   - Check for exact text match before saving
   - Fuzzy match for similar phrases (Levenshtein distance)

---

#### Feature 3: Auto-Scroll & Synchronization

**Status**: ✅ Implemented in `LyricStream.tsx`

**Current Behavior**:
- Active line scrolls into view with `scrollIntoView({ block: 'center' })`
- Sync interval: 200ms (checked via `useEffect`)

**Optimization Opportunities**:
1. **Reduce sync interval** to 100ms for smoother transitions
2. **Add prediction**: Pre-calculate next active line based on playback rate
3. **Smooth damping**: Use CSS transitions for scroll position

---

### 2.2 Mode A Technical Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| **UI** | React + Framer Motion | Smooth animations for active line transitions |
| **Audio** | Web Audio API | Sensitive microphone capture |
| **Playback** | react-youtube (hidden) | Audio source (background) |
| **Storage** | IndexedDB (chunks store) | Offline-first chunk storage |
| **Analysis** | Custom pitch detection | Real-time intonation scoring |

---

### 2.3 Mode A: Current Implementation Gaps

| Feature | Status | Priority | Complexity |
|:---|:---|:---|:---|
| Whisper shadowing | ❌ Not implemented | 🔴 High | 🟡 Medium |
| One-tap collection | ✅ Basic version | 🟢 Low | 🟢 Low |
| Auto-classification | ❌ Not implemented | 🟡 Medium | 🟢 Low |
| Spaced repetition | ❌ Not implemented | 🟡 Medium | 🟢 Low |
| Progress bar | ❌ Not implemented | 🟡 Medium | 🟢 Low |

---

## 3. Mode B: Battle (Intensive Interaction)

> **User Persona Context**:
> - *职场进阶者*: Meeting simulations, negotiations
> - *备考学生*: IELTS/TOEFL speaking practice
> - *兴趣/旅游党*: Survival scenarios (hotel, restaurant)

### 3.1 Core Features

#### Feature 1: Gated Roleplay (闯关式角色扮演)

**Status**: ❌ Not implemented (placeholder page only)

**Interaction Flow**:
```
1. MISSION SELECTION
   ┌─────────────────────────────────┐
   │  🎯 Today's Mission             │
   │  "Persuade your boss why the    │
   │   project is delayed"           │
   │                                 │
   │  [START MISSION]                │
   └─────────────────────────────────┘
              ↓
2. PREREQUISITE DRILL (Hard Gate)
   ┌─────────────────────────────────┐
   │  🔊 Practice these words first: │
   │                                 │
   │  1. delay       [○○○○○] 85% ✓  │
   │  2. schedule    [○○○○○] 92% ✓  │
   │  3. unforeseen  [○○○○○] 78% ✗  │
   │                                 │
   │  Must reach 85% on all to unlock│
   │  [RETRY "unforeseen"]           │
   └─────────────────────────────────┘
              ↓ (All passed)
3. DIALOGUE PHASE
   ┌─────────────────────────────────┐
   │  👔 Boss (AI): "Why is the Q3   │
   │     report late again?"         │
   │                                 │
   │  [🎤 Hold to Speak]             │
   │                                 │
   │  User: "Well, we had some       │
   │         unforeseen issues..."   │
   └─────────────────────────────────┘
              ↓
4. BRANCHING OUTCOME
   ┌─────────────────────────────────┐
   │  ✅ Boss accepts explanation    │
   │     (Good logic + persuasion)   │
   │                                 │
   │  OR                             │
   │                                 │
   │  ❌ Boss demands more details   │
   │     (Vague response)            │
   └─────────────────────────────────┘
              ↓
5. MISSION COMPLETE / RETRY
```

**Technical Implementation**:

**Component Structure**:
```
apps/learner/src/pages/BattlePage.tsx
├── MissionSelector.tsx        (Choose scenario)
├── DrillPhase.tsx             (Pronunciation gate)
│   └── WordDrillCard.tsx
├── DialoguePhase.tsx          (Roleplay interaction)
│   ├── AICharacter.tsx        (Boss/examiner/etc.)
│   └── UserResponseRecorder.tsx
└── FeedbackDashboard.tsx      (Post-session summary)
```

**State Machine**:
```typescript
type BattlePhase =
  | 'mission-selection'
  | 'drill-phase'
  | 'dialogue-phase'
  | 'feedback'
  | 'mission-complete';

interface BattleState {
  phase: BattlePhase;
  currentMission: Mission;
  drillProgress: Map<string, number>; // wordId → accuracy
  dialogueHistory: DialogueTurn[];
  userAttempts: number;
  unlocked: boolean; // Passed drill gate
}
```

**Data Models**:
```typescript
interface Mission {
  id: string;
  title: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  category: 'business' | 'academic' | 'travel';
  prerequisites: {
    words: string[];          // Key vocabulary
    minAccuracy: number;      // Gate threshold (default 0.85)
  };
  dialogueScript: DialogueNode;
  evaluationCriteria: EvaluationCriteria;
}

interface DialogueNode {
  id: string;
  character: 'ai' | 'user';
  text: string;
  personality?: string;       // e.g., "strict", "friendly", "skeptical"
  branches: DialogueBranch[]; // Next options based on user response
}

interface DialogueBranch {
  condition: (responseAnalysis: ResponseAnalysis) => boolean;
  nextNodeId: string;
  feedbackHint?: string;
}

interface ResponseAnalysis {
  pronunciationScore: number;
  grammarScore: number;
  pragmaticScore: number;
  contentRelevance: number;
  suggestedReply: string;
}
```

**AI Integration**:
1. **ASR (Automatic Speech Recognition)**:
   - Option A: Web Speech API (free, browser-native, limited accuracy)
   - Option B: Whisper API (OpenAI, high accuracy, paid)
   - Option C: Cloud Speech-to-Text (Google/AWS, paid)

2. **Pronunciation Scoring**:
   ```typescript
   // Compare user phonemes to reference
   async function analyzePronunciation(
     userAudio: AudioBuffer,
     referencePhonemes: string[]
   ): Promise<number> {
     // 1. Extract MFCC features from user audio
     // 2. Align to reference phonemes (DTW)
     // 3. Calculate phone-level error rates
     // 4. Return overall accuracy (0-1)
   }
   ```

3. **Grammar & Pragmatics**:
   - Use Gemini API for grammar checking
   - Prompt engineering for tone/register assessment

---

#### Feature 2: AI Coach Feedback (多维反馈)

**Status**: ❌ Not implemented

**UI Design**:
```
┌──────────────────────────────────────────┐
│  MISSION COMPLETE! 🎉                    │
│  Overall Score: 7.2/10                   │
├──────────────────────────────────────────┤
│  Pronunciation Heatmap                   │
│  ┌────────────────────────────────────┐  │
│  │ delay      ████████░░ 85% ✓        │  │
│  │ schedule   ██████████ 92% ✓        │  │
│  │ unforeseen ██████░░░░ 78% ⚠️       │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│  Grammar Insights                        │
│  ❌ You said: "I delay the project"      │
│  ✅ Better: "The project was delayed"    │
│  💡 Why: Passive voice sounds more       │
│     objective in business contexts       │
├──────────────────────────────────────────┤
│  Pragmatics Coaching                     │
│  ⚠️ Tone check: You sounded very         │
│     apologetic                           │
│  💡 Try: More confident, less            │
│     defensive                            │
│  📺 [Play native example]                │
├──────────────────────────────────────────┤
│  Performance Metrics                     │
│  Overall: 7.2/10                         │
│  ├─ Pronunciation: 8.5/10 ⬆️ +0.3       │
│  ├─ Fluency: 6.8/10 ➡️ Same             │
│  ├─ Grammar: 7.0/10 ⬆️ +0.5             │
│  └─ Pragmatics: 7.5/10 ⬆️ +0.2          │
│                                          │
│  [RETRY MISSION]  [NEXT CHALLENGE]      │
└──────────────────────────────────────────┘
```

**Component**: `FeedbackDashboard.tsx` (NEW)

**Data Visualization**:
- **Heatmap**: Simple HTML5 `<progress>` bars with color coding
- **Before/After**: Side-by-side text comparison with diff highlighting
- **Trend Analysis**: Mini line chart (Chart.js or custom SVG)

---

### 3.2 Mode B Technical Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| **ASR** | Web Speech API (v1) / Whisper API | Speech recognition |
| **Audio Analysis** | Web Audio API | Pronunciation scoring |
| **NLP** | Gemini API | Grammar + pragmatics feedback |
| **State Management** | React Context + hooks | Battle phase state machine |
| **Storage** | IndexedDB | Session history + progress |

---

### 3.3 Mode B: Implementation Priorities

| Feature | Status | Priority | Complexity |
|:---|:---|:---|:---|
| Mission selector UI | ❌ Not implemented | 🔴 High | 🟢 Low |
| Pronunciation drill gate | ❌ Not implemented | 🔴 High | 🟡 Medium |
| Dialogue phase | ❌ Not implemented | 🔴 High | 🔴 High |
| Branching logic | ❌ Not implemented | 🟡 Medium | 🔴 High |
| Feedback dashboard | ❌ Not implemented | 🟡 Medium | 🟢 Low |
| Historical progress tracking | ❌ Not implemented | 🟢 Low | 🟢 Low |

---

## 4. Mode C: Think (Reflective Consolidation)

> **User Persona Context**:
> - *职场进阶者*: Evening review of business phrases
> - *备考学生*: Logic rewriting exercises
> - *兴趣/旅游党*: Video retelling of comedy/travel clips

### 4.1 Core Features

#### Feature 1: Video Retelling (视频复述)

**Status**: ❌ Not implemented (placeholder page only)

**Interaction Flow**:
```
1. VIDEO SELECTION
   ┌─────────────────────────────────┐
   │  🎬 Today's Video               │
   │  [30s clip: Office comedy]      │
   │                                 │
   │  [WATCH NOW]                    │
   └─────────────────────────────────┘
              ↓
2. WATCH & COMPREHEND
   ┌─────────────────────────────────┐
   │  [Video Player]                 │
   │  (Subtitles ON/OFF toggle)      │
   │                                 │
   │  ❓ Why was she angry?          │
   └─────────────────────────────────┘
              ↓
3. USER ANSWERS
   ┌─────────────────────────────────┐
   │  [🎤 Hold to Speak]             │
   │                                 │
   │  User: "Because her boyfriend   │
   │         was late..."            │
   └─────────────────────────────────┘
              ↓
4. AI EVALUATION
   ┌─────────────────────────────────┐
   │  Content Score: 8/10 ✓          │
   │  └─ Caught main idea            │
   │  └─ Good detail recall          │
   │                                 │
   │  Language Score: 7/10 ⚠️        │
   │  └─ Grammar check: "Because..." │
   │  └─ Try: "Her lateness made     │
   │      her furious."              │
   │                                 │
   │  [TRY AGAIN]  [NEXT VIDEO]      │
   └─────────────────────────────────┘
```

**Technical Implementation**:

**Component**: `VideoRetellingExercise.tsx` (NEW)

**Video Integration**:
- Use existing `VideoLearningPage.tsx` as base
- Add question overlay panel
- Custom recording controls

**AI Question Generation**:
```typescript
// Prompt for Gemini
async function generateComprehensionQuestion(
  videoTranscript: string,
  videoContext: string
): Promise<string> {
  const prompt = `
    Given this video transcript:
    "${videoTranscript}"

    Context: ${videoContext}

    Generate ONE comprehension question that tests:
    1. Main idea understanding
    2. Cause-effect reasoning
    3. Key detail recall

    Question format: "Why..." / "What..." / "How..."
    Keep it simple and direct.
  `;

  return await geminiGenerate(prompt);
}
```

**Response Evaluation**:
```typescript
interface RetellingEvaluation {
  contentScore: number;      // 0-1: Did they understand?
  languageScore: number;     // 0-1: Grammar + vocab
  feedback: {
    content: string;         // "Good detail recall!"
    language: string;        // Grammar suggestion
    improvement: string;     // "Try using passive voice"
  };
}
```

---

#### Feature 2: Logic Rewriting (逻辑重写)

**Status**: ❌ Not implemented

**Interaction Flow**:
```
User's Answer: "Because her boyfriend was late."
                    ↓
AI Challenge: "Can you say that using 'furious'?"
                    ↓
User Attempts: "Because her boyfriend was late, she was furious"
                    ↓
AI Feedback:
  ✅ Great use of "furious"!
  ⚠️ Grammar: "Because..., she was" → "She was furious because..."
  💡 Advanced: "Her boyfriend's lateness made her furious."
```

**Technical Implementation**:

**Component**: `LogicRewritingExercise.tsx` (NEW)

**Challenge Types**:
```typescript
type ChallengeType =
  | 'vocabulary-upgrade'      // Use target word
  | 'grammar-structure'       // Use passive/conditional
  | 'logic-extension'         // Add cause/effect
  | 'style-transformation';   // Formal ↔ Casual

interface LogicChallenge {
  id: string;
  originalAnswer: string;
  challengeType: ChallengeType;
  targetElement: string;      // Word/structure to use
  difficulty: 1 | 2 | 3 | 4;
  hint?: string;
}
```

**Adaptive Difficulty**:
- Level 1: Single word substitution
- Level 2: Phrase/collocation usage
- Level 3: Grammar structure change
- Level 4: Complex logic reconstruction

---

#### Feature 3: Chunk Activation (语块激活)

**Status**: 🚧 Partially implemented (UI placeholder exists)

**Current State**:
- `ThinkPage.tsx` shows "Chunk Review" with mock count (12 items)
- No actual exercise logic

**Required Implementation**:

**Component**: `ChunkActivationExercise.tsx` (NEW)

**Practice Formats**:
```
1. SENTENCE CREATION
   ┌─────────────────────────────────┐
   │  📝 Today's Chunk               │
   │  "align on" (达成一致)           │
   │                                 │
   │  Make your own sentence:        │
   │  [________________]              │
   │  [🎤 Speak]  [⌨️ Type]          │
   └─────────────────────────────────┘

2. SCENARIO APPLICATION
   ┌─────────────────────────────────┐
   │  💼 Scenario: Team Meeting      │
   │                                 │
   │  Use "align on" in this context:│
   │  "We need to _____ on the       │
   │   project timeline."            │
   │                                 │
   │  [🎤 Record your response]      │
   └─────────────────────────────────┘

3. SPACED REPETITION QUEUE
   ┌─────────────────────────────────┐
   │  ⏰ Due for Review Today        │
   │                                 │
   │  • touch base (Day 3)           │
   │  • loop in (Day 7)              │
   │  • deliverable (Day 14)         │
   │                                 │
   │  [START REVIEW SESSION]         │
   └─────────────────────────────────┘
```

**Spaced Repetition Logic**:
```typescript
// SuperMemo-2 algorithm (simplified)
function calculateNextReview(
  chunk: SavedChunk,
  quality: number // 0-5 rating from user
): Date {
  let { interval, easeFactor } = chunk;

  if (quality >= 3) {
    // Correct response
    if (interval === 0) interval = 1;
    else if (interval === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
  } else {
    // Incorrect response
    interval = 1;
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  return nextDate;
}
```

---

### 4.2 Mode C Technical Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| **Video Player** | react-youtube / HTML5 video | Video playback |
| **ASR** | Web Speech API | Speech capture |
| **NLP** | Gemini API | Question generation + evaluation |
| **SRS Algorithm** | Custom implementation | Spaced repetition scheduling |
| **Storage** | IndexedDB | Chunk mastery tracking |

---

### 4.3 Mode C: Implementation Priorities

| Feature | Status | Priority | Complexity |
|:---|:---|:---|:---|
| Chunk activation (basic) | 🚧 UI placeholder only | 🔴 High | 🟢 Low |
| Spaced repetition logic | ❌ Not implemented | 🔴 High | 🟡 Medium |
| Video retelling | ❌ Not implemented | 🟡 Medium | 🔴 High |
| Logic rewriting | ❌ Not implemented | 🟡 Medium | 🔴 High |
| Progress visualization | ❌ Not implemented | 🟢 Low | 🟢 Low |

---

## 5. Cross-Mode Integration

### 5.1 Mode Bridging Prompts

**Feature**: Smart suggestions to transition between modes

**Implementation**: `ModeBridgeService.ts` (NEW)

```typescript
interface BridgeSuggestion {
  fromMode: 'flow' | 'battle' | 'think';
  toMode: 'flow' | 'battle' | 'think';
  message: string;
  actionLabel: string;
  contextData: any;
}

function generateBridgeSuggestions(
  currentMode: string,
  recentActivity: ActivityData
): BridgeSuggestion[] {
  const suggestions: BridgeSuggestion[] = [];

  // Flow → Battle
  if (currentMode === 'flow' && recentActivity.chunksCollected > 0) {
    suggestions.push({
      fromMode: 'flow',
      toMode: 'battle',
      message: `You collected ${recentActivity.chunksCollected} phrases today. Practice them in a negotiation scenario?`,
      actionLabel: 'Start Roleplay',
      contextData: { chunks: recentActivity.todayChunks }
    });
  }

  // Battle → Think
  if (currentMode === 'battle' && recentActivity.weakPoints.length > 0) {
    suggestions.push({
      fromMode: 'battle',
      toMode: 'think',
      message: 'Great session! Review your grammar weak points?',
      actionLabel: 'Review Now',
      contextData: { weakPoints: recentActivity.weakPoints }
    });
  }

  // Think → Flow
  if (currentMode === 'think' && recentActivity.masteredChunks > 0) {
    suggestions.push({
      fromMode: 'think',
      toMode: 'flow',
      message: `Mastered ${recentActivity.masteredChunks} chunks! Add them to your passive listening rotation?`,
      actionLabel: 'Add to Playlist',
      contextData: { chunks: recentActivity.masteredChunks }
    });
  }

  return suggestions;
}
```

**UI Component**: `ModeBridgeBanner.tsx` (NEW)

```
┌──────────────────────────────────────────┐
│  💡 Bridge Suggestion                    │
│                                          │
│  You collected 5 phrases today.          │
│  Practice them in a negotiation scenario?│
│                                          │
│  [LATER]  [START ROLEPLAY →]            │
└──────────────────────────────────────────┘
```

---

### 5.2 Unified Chunk Notebook

**Status**: ❌ Not implemented (conceptual only)

**Schema**:
```typescript
// Unified across all three modes
interface ChunkNotebook {
  userId: string;
  chunks: SavedChunk[];
  categories: ChunkCategory[];
  statistics: {
    totalCollected: number;
    masteredCount: number;
    dueForReview: number;
    practiceStreak: number;
  };
}

// IndexedDB stores
const STORES = {
  CHUNKS: 'chunks',
  REVIEWS: 'reviews',      // SRS history
  PRACTICE: 'practice_sessions'  // Usage in Battle/Think
};
```

**Access Patterns**:
- **Flow Mode**: Write-only (save new chunks)
- **Battle Mode**: Read (suggest chunks to use) + Write (record usage)
- **Think Mode**: Read (review due chunks) + Write (update mastery)

---

## 6. Technical Infrastructure

### 6.1 Shared Services

**Service Layer**: `apps/learner/src/services/`

| Service | Purpose | Status |
|:---|:---|:---|
| `flowService.ts` | Playlist management, IndexedDB access | ✅ Implemented |
| `chunkService.ts` | Chunk CRUD, classification, SRS | ❌ NEW |
| `battleService.ts` | Mission loading, session state | ❌ NEW |
| `thinkService.ts` | Review queue, exercise generation | ❌ NEW |
| `audioService.ts` | Whisper detection, pitch analysis | ❌ NEW |
| `bridgeService.ts` | Cross-mode suggestions | ❌ NEW |

---

### 6.2 State Management

**Approach**: React Context + Hooks (no Redux for simplicity)

```typescript
// apps/learner/src/contexts/ModeContext.tsx (NEW)
interface ModeContextValue {
  currentMode: 'flow' | 'battle' | 'think' | 'profile';
  switchMode: (mode: string) => void;
  bridgeSuggestions: BridgeSuggestion[];
  dismissBridge: (index: number) => void;
}

export const ModeProvider: React.FC = ({ children }) => {
  // ... implementation
};
```

```typescript
// apps/learner/src/contexts/ChunkContext.tsx (NEW)
interface ChunkContextValue {
  chunks: SavedChunk[];
  saveChunk: (chunk: Partial<SavedChunk>) => Promise<void>;
  getDueForReview: () => Promise<SavedChunk[]>;
  updateMastery: (chunkId: string, score: number) => Promise<void>;
}

export const ChunkProvider: React.FC = ({ children }) => {
  // ... implementation with IndexedDB backend
};
```

---

### 6.3 IndexedDB Schema

**Database**: `EchoSpeakStudioDB_v3`

**Object Stores**:

1. **`youtube_library`** (existing)
   - Media assets for Flow mode
   - Key: `id`

2. **`chunks`** (NEW)
   - Saved chunks from all modes
   - Key: `id`
   - Indexes: `category`, `collectedAt`, `nextReview`

3. **`practice_sessions`** (NEW)
   - Battle mode history
   - Key: `sessionId`
   - Indexes: `mode`, `timestamp`, `missionId`

4. **`reviews`** (NEW)
   - Think mode SRS history
   - Key: `reviewId`
   - Indexes: `chunkId`, `reviewedAt`, `quality`

---

### 6.4 API Integration

**Gemini API Usage**:

| Feature | Prompt Type | Model | Frequency |
|:---|:---|:---|:---|
| Whisper intonation scoring | Comparison (audio features) | gemini-3-flash-preview | Real-time |
| Battle grammar feedback | Error correction | gemini-3-flash-preview | Per dialogue turn |
| Think question generation | Content understanding | gemini-3-flash-preview | Per video |
| Think evaluation | Scoring rubric | gemini-3-flash-preview | Per response |
| Chunk classification | Categorization | gemini-3-flash-preview | On save |

**Cost Optimization**:
- Cache frequently-used prompts
- Batch requests where possible
- Use `gemini-3-flash-preview` for speed
- Fallback to local logic when API unavailable

---

## 7. Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Establish data layer and basic infrastructure

**Tasks**:
- [x] Dynamic Pill Navigation ✅ (already done)
- [ ] Implement `chunkService.ts` with IndexedDB
- [ ] Create `ChunkProvider` context
- [ ] Build basic chunk collection UI (enhance existing `LyricStream`)
- [ ] Implement chunk classification (keyword-based)

**Deliverables**:
- Functional Chunk Notebook (save + list)
- Basic categorization
- Cross-component state sharing

---

### Phase 2: Mode A Enhancement (Week 3-4)

**Goal**: Complete Flow mode features

**Tasks**:
- [ ] Implement `WhisperShadowingEngine` (audio capture + pitch detection)
- [ ] Add progress bar to `PlayerControls`
- [ ] Implement double-tap headphone support (WebHID exploration)
- [ ] Add chunk deduplication
- [ ] Implement smart buffering (10s rolling buffer)

**Deliverables**:
- Whisper shadowing with haptic feedback
- Improved one-tap collection
- Progress tracking

---

### Phase 3: Mode B Core (Week 5-7)

**Goal**: Implement Battle mode MVP

**Tasks**:
- [ ] Design mission data structure + seed content
- [ ] Build `MissionSelector` UI
- [ ] Implement pronunciation drill gate (Web Speech API)
- [ ] Build dialogue phase with recording
- [ ] Integrate Gemini for grammar feedback
- [ ] Create `FeedbackDashboard` with heatmap

**Deliverables**:
- 3-5 sample missions (business + academic + travel)
- Functional drill gate
- Basic dialogue with AI character
- Post-session feedback

---

### Phase 4: Mode C Core (Week 8-10)

**Goal**: Implement Think mode MVP

**Tasks**:
- [ ] Build chunk activation exercise (sentence creation)
- [ ] Implement SuperMemo-2 SRS algorithm
- [ ] Create review queue UI
- [ ] Add video retelling (single video initially)
- [ ] Implement logic rewriting (vocabulary challenges)

**Deliverables**:
- Functional chunk activation
- Spaced repetition system
- Video retelling with AI evaluation
- Basic logic rewriting exercises

---

### Phase 5: Cross-Mode Polish (Week 11-12)

**Goal**: Integrate modes and optimize

**Tasks**:
- [ ] Implement `ModeBridgeService`
- [ ] Add bridge suggestion banners
- [ ] Create unified statistics dashboard
- [ ] Optimize performance (bundle size, lazy loading)
- [ ] Add animations and transitions
- [ ] Write end-to-end tests

**Deliverables**:
- Seamless mode transitions
- Cross-mode data flow
- Performance optimization
- Test coverage >80%

---

## 8. Success Metrics

### 8.1 User Engagement

| Metric | Target | Measurement |
|:---|:---|:---|
| **Daily Active Users (DAU)** | +50% from baseline | Firebase Analytics |
| **Session Duration** | Avg 15 min/day | Analytics |
| **Mode Switching** | ≥2 mode switches/day | Event tracking |
| **Chunk Collection Rate** | Avg 5 chunks/day | DB query |
| **Review Completion Rate** | ≥80% of due chunks | DB query |

---

### 8.2 Learning Outcomes

| Metric | Target | Measurement |
|:---|:---|:---|
| **Chunk Mastery** | 50 chunks mastered/month | SRS algorithm |
| **Pronunciation Accuracy** | +15% improvement | Battle mode scores |
| **Speaking Fluency** | Self-report + AI scoring | Pre/post surveys |
| **Retention Rate** | 60% return after 30 days | Analytics |

---

### 8.3 Technical Performance

| Metric | Target | Measurement |
|:---|:---|:---|
| **Audio Latency** | <200ms for shadowing | Performance API |
| **Sync Accuracy** | ±100ms for captions | Manual testing |
| **Bundle Size** | <500KB (gzipped) | Bundle analyzer |
| **IndexedDB Operations** | <50ms per transaction | Performance API |
| **API Response Time** | <2s for Gemini calls | Monitoring |

---

## Appendix: Quick Reference

### A. File Structure

```
apps/learner/src/
├── pages/
│   ├── FlowPage.tsx ✅           (Phase 2 enhancement)
│   ├── BattlePage.tsx ✅         (Phase 3 rebuild)
│   └── ThinkPage.tsx ✅          (Phase 4 rebuild)
├── components/
│   ├── DynamicPillNav.tsx ✅     (DONE)
│   ├── FlowPlayer/
│   │   ├── LyricStream.tsx ✅    (Phase 2 polish)
│   │   ├── PlayerControls.tsx ✅ (Phase 2 enhancement)
│   │   └── WhisperEngine.tsx ❌  (NEW, Phase 2)
│   ├── BattleMode/
│   │   ├── MissionSelector.tsx ❌ (NEW, Phase 3)
│   │   ├── DrillPhase.tsx ❌      (NEW, Phase 3)
│   │   ├── DialoguePhase.tsx ❌   (NEW, Phase 3)
│   │   └── FeedbackDashboard.tsx ❌(NEW, Phase 3)
│   └── ThinkMode/
│       ├── ChunkActivation.tsx ❌  (NEW, Phase 4)
│       ├── VideoRetelling.tsx ❌   (NEW, Phase 4)
│       └── LogicRewriting.tsx ❌   (NEW, Phase 4)
├── services/
│   ├── flowService.ts ✅         (Phase 2 enhancement)
│   ├── chunkService.ts ❌        (NEW, Phase 1)
│   ├── battleService.ts ❌       (NEW, Phase 3)
│   ├── thinkService.ts ❌        (NEW, Phase 4)
│   ├── audioService.ts ❌        (NEW, Phase 2)
│   └── bridgeService.ts ❌       (NEW, Phase 5)
├── contexts/
│   ├── ModeContext.tsx ❌        (NEW, Phase 5)
│   └── ChunkContext.tsx ❌       (NEW, Phase 1)
└── types/
    └── mode.ts ❌                (NEW, Phase 1)
```

### B. Environment Variables

```bash
# .env.local
GEMINI_API_KEY=your-gemini-api-key
VITE_ENABLE_WHISPER_SHADOWING=true
VITE_ENABLE_HEADPHONE_DOUBLE_TAP=false  # Experimental
VITE_AUDIO_SENSITIVITY=-40              # dB threshold
```

### C. Browser Compatibility Matrix

| Feature | Chrome | Safari | Firefox | Edge |
|:---|:---:|:---:|:---:|:---:|
| Web Audio API | ✅ | ✅ | ✅ | ✅ |
| Web Speech API (ASR) | ✅ | ⚠️ | ✅ | ✅ |
| WebHID API | ✅ | ❌ | ⚠️ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| Vibration API | ✅ | ⚠️ | ❌ | ⚠️ |

---

**End of Implementation Plan**

*Last Updated: 2025-01-13*
