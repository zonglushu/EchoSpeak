# 视频字幕提取实现方案

## 当前状态
已创建 `/api/ai/transcribe` 端点，目前返回模拟数据。需要集成真实的字幕提取功能。

## 完整实现方案（基于 plan.md 4.1 节）

### 架构概览
```
视频输入
  ↓
[1] 提取层（无需 AI）
  ├─ 检查内嵌字幕轨道
  ├─ 提取独立字幕文件
  └─ 无字幕 → 转到 [4]
  ↓
[2] 解析层
  ├─ webvtt-parser / srt-parser-2
  └─ 转换为标准格式
  ↓
[3] 语言检测 & 对齐
  ├─ franc / langdetect 检测语种
  ├─ 双语对齐 (text_en + text_cn)
  └─ 单语 → 标记 needsTranslation
  ↓
[4] 单语补全策略
  ├─ 翻译服务（Gemini / DeepL）
  └─ 或 AI 转写（Gemini / Whisper）
  ↓
[5] 保存到数据库
  └─ transcripts 表
```

## 实现方案

### 方案 1: 提取视频内嵌字幕（优先）

#### 前端方案：使用 mp4box.js 或 mux.js

适用于浏览器端快速预览或轻量级提取。

```bash
npm install mp4box
```

```typescript
import MP4Box from 'mp4box';

async function extractSubtitlesFromVideo(file: File): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const mp4boxfile = MP4Box.createFile();
    
    mp4boxfile.onReady = (info) => {
      // 查找字幕轨道
      const textTrack = info.tracks.find(track => 
        track.type === 'text' || track.codec === 'wvtt'
      );
      
      if (!textTrack) {
        resolve(null); // 无字幕轨道
        return;
      }
      
      // 提取字幕数据
      mp4boxfile.setExtractionOptions(textTrack.id, null, {
        nbSamples: 100
      });
      
      let subtitleData = '';
      mp4boxfile.onSamples = (id, user, samples) => {
        samples.forEach(sample => {
          subtitleData += new TextDecoder().decode(sample.data);
        });
      };
      
      mp4boxfile.start();
    };
    
    // 读取文件
    const reader = file.stream().getReader();
    let offset = 0;
    
    reader.read().then(function processChunk({ done, value }): any {
      if (done) {
        mp4boxfile.flush();
        return;
      }
      
      const buffer = value.buffer;
      buffer.fileStart = offset;
      offset += buffer.byteLength;
      mp4boxfile.appendBuffer(buffer);
      
      return reader.read().then(processChunk);
    });
  });
}
```

#### 后端方案：使用 fluent-ffmpeg（推荐生产环境）

```bash
npm install fluent-ffmpeg @types/fluent-ffmpeg
# 系统需要安装 ffmpeg
```

```typescript
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

async function extractEmbeddedSubtitles(videoPath: string): Promise<string | null> {
  // 1. 先检查是否有字幕轨道
  const hasSubtitles = await new Promise<boolean>((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      
      const subtitleStream = metadata.streams.find(
        s => s.codec_type === 'subtitle'
      );
      
      resolve(!!subtitleStream);
    });
  });
  
  if (!hasSubtitles) return null;
  
  // 2. 提取字幕到 SRT 文件
  const outputPath = path.join('/tmp', `${Date.now()}.srt`);
  
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions('-map', '0:s:0') // 第一个字幕流
      .output(outputPath)
      .on('end', () => {
        const content = fs.readFileSync(outputPath, 'utf-8');
        fs.unlinkSync(outputPath); // 清理临时文件
        resolve(content);
      })
      .on('error', reject)
      .run();
  });
}
```

### 方案 2: 解析独立字幕文件

使用专门的解析库处理 SRT/VTT/ASS 格式。

```bash
npm install srt-parser-2 webvtt-parser
```

```typescript
import SrtParser from 'srt-parser-2';
import { WebVTTParser } from 'webvtt-parser';

interface SubtitleLine {
  id: string;
  start: number; // milliseconds
  end: number;
  text: string;
}

function parseSRT(content: string): SubtitleLine[] {
  const parser = new SrtParser();
  const parsed = parser.fromSrt(content);
  
  return parsed.map((item, index) => ({
    id: `sub-${index}`,
    start: parseTimeToMs(item.startTime),
    end: parseTimeToMs(item.endTime),
    text: item.text,
  }));
}

function parseVTT(content: string): SubtitleLine[] {
  const parser = new WebVTTParser();
  const tree = parser.parse(content, 'metadata');
  
  return tree.cues.map((cue, index) => ({
    id: `sub-${index}`,
    start: cue.startTime * 1000,
    end: cue.endTime * 1000,
    text: cue.text,
  }));
}

function parseTimeToMs(time: string): number {
  // 00:01:23,456 → milliseconds
  const [hours, minutes, seconds] = time.split(':');
  const [secs, ms] = seconds.split(',');
  return (
    parseInt(hours) * 3600000 +
    parseInt(minutes) * 60000 +
    parseInt(secs) * 1000 +
    parseInt(ms)
  );
}
```

### 方案 3: 语言检测 & 对齐

```bash
npm install franc langdetect
```

```typescript
import { franc } from 'franc';

interface BilingualSubtitle {
  id: string;
  start: number;
  end: number;
  text_en?: string;
  text_cn?: string;
  needsTranslation: boolean;
}

async function detectAndAlignLanguages(
  subtitles: SubtitleLine[]
): Promise<BilingualSubtitle[]> {
  // 检测整体语言（取前几行的主要语言）
  const sampleText = subtitles.slice(0, 10).map(s => s.text).join(' ');
  const detectedLang = franc(sampleText);
  
  // eng: 英语, cmn: 中文
  const isEnglish = detectedLang === 'eng';
  const isChinese = detectedLang === 'cmn';
  
  return subtitles.map(sub => ({
    id: sub.id,
    start: sub.start,
    end: sub.end,
    text_en: isEnglish ? sub.text : undefined,
    text_cn: isChinese ? sub.text : undefined,
    needsTranslation: true, // 单语需要翻译
  }));
}

// 如果有双语字幕文件，对齐它们
function alignBilingualSubtitles(
  enSubs: SubtitleLine[],
  cnSubs: SubtitleLine[]
): BilingualSubtitle[] {
  // 按时间戳对齐
  return enSubs.map((enSub, index) => {
    // 找到时间最接近的中文字幕
    const cnSub = cnSubs.find(cn => 
      Math.abs(cn.start - enSub.start) < 1000 // 1秒误差
    );
    
    return {
      id: enSub.id,
      start: enSub.start,
      end: enSub.end,
      text_en: enSub.text,
      text_cn: cnSub?.text,
      needsTranslation: !cnSub,
    };
  });
}
```

### 方案 4: 单语补全策略

#### 选项 A: 使用 Gemini 翻译（推荐）

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

async function translateWithGemini(
  subtitles: BilingualSubtitle[],
  targetLang: 'en' | 'zh'
): Promise<BilingualSubtitle[]> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const sourceLang = targetLang === 'en' ? 'zh' : 'en';
  const sourceField = targetLang === 'en' ? 'text_cn' : 'text_en';
  const targetField = targetLang === 'en' ? 'text_en' : 'text_cn';
  
  // 批量翻译（每次20条）
  const batchSize = 20;
  const results = [...subtitles];
  
  for (let i = 0; i < subtitles.length; i += batchSize) {
    const batch = subtitles.slice(i, i + batchSize);
    const textsToTranslate = batch
      .map((s, idx) => `${idx + 1}. ${s[sourceField]}`)
      .join('\n');
    
    const prompt = `请将以下${sourceLang === 'zh' ? '中文' : '英文'}字幕翻译成${targetLang === 'zh' ? '中文' : '英文'}，保持序号，每行一句：

${textsToTranslate}`;
    
    const result = await model.generateContent(prompt);
    const translations = result.response.text().split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, ''));
    
    batch.forEach((sub, idx) => {
      results[i + idx][targetField] = translations[idx] || sub[sourceField];
      results[i + idx].needsTranslation = false;
    });
  }
  
  return results;
}
```

#### 选项 B: 使用 Whisper API 进行语音识别（无字幕时）

```typescript
import OpenAI from 'openai';
import fs from 'fs';

async function transcribeWithWhisper(
  audioPath: string
): Promise<BilingualSubtitle[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-1',
    response_format: 'verbose_json', // 包含时间戳
    language: 'en', // 或 'zh'
  });
  
  // 转换为标准格式
  return transcription.segments.map((segment, index) => ({
    id: `whisper-${index}`,
    start: segment.start * 1000,
    end: segment.end * 1000,
    text_en: transcription.language === 'en' ? segment.text : undefined,
    text_cn: transcription.language === 'zh' ? segment.text : undefined,
    needsTranslation: true,
  }));
}
```

### 方案 5: 完整集成到 API

更新 `/api/ai/transcribe/route.ts`:

```typescript
export async function POST(request: Request) {
  try {
    const { assetId } = await request.json();
    
    const supabase = getSupabaseServiceClient();
    
    // 1. 获取视频信息
    const { data: asset } = await supabase
      .from('media_assets')
      .select('source_url, title')
      .eq('id', assetId)
      .single();
    
    if (!asset?.source_url) {
      throw new Error('视频不存在');
    }
    
    // 2. 优先提取内嵌字幕
    let subtitleContent = await extractEmbeddedSubtitles(asset.source_url);
    let transcripts: BilingualSubtitle[];
    
    if (subtitleContent) {
      // 2a. 解析提取的字幕
      const parsed = subtitleContent.includes('WEBVTT') 
        ? parseVTT(subtitleContent)
        : parseSRT(subtitleContent);
      
      // 2b. 语言检测
      transcripts = await detectAndAlignLanguages(parsed);
      
      // 2c. 单语补全
      const needsTranslation = transcripts.some(t => t.needsTranslation);
      if (needsTranslation) {
        const hasEnglish = transcripts.some(t => t.text_en);
        transcripts = await translateWithGemini(
          transcripts,
          hasEnglish ? 'zh' : 'en'
        );
      }
    } else {
      // 2d. 无字幕，使用 AI 转写
      transcripts = await transcribeWithWhisper(asset.source_url);
      
      // 再翻译
      transcripts = await translateWithGemini(
        transcripts,
        transcripts[0]?.text_en ? 'zh' : 'en'
      );
    }
    
    // 3. 保存到数据库
    const { error: insertError } = await supabase
      .from('transcripts')
      .insert(
        transcripts.map((t, idx) => ({
          asset_id: assetId,
          sequence: idx,
          start_time_ms: t.start,
          end_time_ms: t.end,
          text_en: t.text_en || null,
          text_cn: t.text_cn || null,
          lock_state: 'unlocked',
          status: 'pending',
        }))
      );
    
    if (insertError) throw insertError;
    
    // 4. 更新任务状态
    await supabase.from('jobs').insert({
      asset_id: assetId,
      type: 'transcribe',
      status: 'success',
      progress: 100,
      payload: { method: subtitleContent ? 'extract' : 'transcribe' },
    });
    
    return NextResponse.json({
      success: true,
      transcripts: transcripts.map(t => ({
        id: t.id,
        startTime: t.start,
        endTime: t.end,
        text: t.text_en || t.text_cn || '',
        translation: t.text_cn || t.text_en || '',
        lockState: 'unlocked',
        status: 'pending',
      })),
    });
  } catch (error) {
    console.error('转写失败', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '转写失败' },
      { status: 500 }
    );
  }
}
```

## 推荐实现流程（基于 plan.md）

1. **第一优先级：提取内嵌字幕**
   - 成本：几乎为 0
   - 速度：最快
   - 实现：ffmpeg（后端）或 mp4box.js（前端）

2. **第二优先级：语言检测 + 翻译**
   - 使用 franc 检测语种
   - 单语字幕用 Gemini 翻译
   - 双语对齐到 text_en + text_cn

3. **第三优先级：AI 转写**
   - 视频无字幕时使用 Whisper/Gemini
   - 自动翻译生成双语

4. **兜底方案：手动上传**
   - 用户上传 SRT/VTT 文件
   - 支持粘贴文本

## 注意事项

1. **大文件处理**: 使用流式处理，避免内存溢出
2. **成本控制**: 优先提取，AI 转写作为备选
3. **语言检测**: 使用 franc 的置信度阈值
4. **错误处理**: 每个步骤都有降级方案
5. **进度反馈**: 使用 jobs 表跟踪状态

## 下一步

1. ✅ 安装依赖：`npm install srt-parser-2 webvtt-parser franc fluent-ffmpeg`
2. ✅ 实现提取层（ffmpeg 优先）
3. ✅ 实现解析 + 语言检测
4. ✅ 集成翻译服务
5. ⏳ 测试不同格式的视频
