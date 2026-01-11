'use client';

import { useEffect, useState } from 'react';
import type { ContentLibraryEntry } from '@echospeak/services';

interface ModerationQueueProps {
  filter: 'all' | 'pending' | 'approved' | 'rejected';
  onSelectContent: (content: ContentLibraryEntry) => void;
  selectedId?: string;
}

// Mock data - replace with API call
const mockContent: ContentLibraryEntry[] = [
  {
    id: '1',
    youtubeId: 'abc123',
    rawSubtitles: [],
    languageCode: 'en',
    extractedAt: new Date(),
    title: 'English Conversation Practice',
    thumbnailUrl: 'https://img.youtube.com/vi/abc123/mqdefault.jpg',
    duration: 300,
    viewCount: 45,
    uniqueViewers: 30,
    lastAccessedAt: new Date(),
    difficultyLevel: 'intermediate',
    topicTags: ['conversation', 'daily-life'],
    isFeatured: false,
    moderationStatus: 'pending',
    processingCostUsd: 0.05,
    cacheTier: 'warm',
    accessCount: 45,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    youtubeId: 'def456',
    rawSubtitles: [],
    languageCode: 'en',
    extractedAt: new Date(),
    title: 'Business English Meeting',
    thumbnailUrl: 'https://img.youtube.com/vi/def456/mqdefault.jpg',
    duration: 450,
    viewCount: 120,
    uniqueViewers: 85,
    lastAccessedAt: new Date(),
    difficultyLevel: 'advanced',
    topicTags: ['business', 'meeting'],
    isFeatured: false,
    moderationStatus: 'approved',
    moderatedBy: 'admin-1',
    moderatedAt: new Date(),
    processingCostUsd: 0.08,
    cacheTier: 'hot',
    accessCount: 120,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    youtubeId: 'ghi789',
    rawSubtitles: [],
    languageCode: 'en',
    extractedAt: new Date(),
    title: 'Basic English Greetings',
    thumbnailUrl: 'https://img.youtube.com/vi/ghi789/mqdefault.jpg',
    duration: 180,
    viewCount: 8,
    uniqueViewers: 5,
    lastAccessedAt: new Date(),
    difficultyLevel: 'beginner',
    topicTags: ['greetings', 'basic'],
    isFeatured: false,
    moderationStatus: 'rejected',
    moderationNotes: 'Audio quality too poor',
    moderatedBy: 'admin-1',
    moderatedAt: new Date(),
    processingCostUsd: 0.03,
    cacheTier: 'cold',
    accessCount: 8,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function ModerationQueue({ filter, onSelectContent, selectedId }: ModerationQueueProps) {
  const [content, setContent] = useState<ContentLibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch from API based on filter
    setLoading(true);
    setTimeout(() => {
      const filtered = filter === 'all'
        ? mockContent
        : mockContent.filter(c => c.moderationStatus === filter);
      setContent(filtered);
      setLoading(false);
    }, 500);
  }, [filter]);

  const getStatusBadge = (status: ContentLibraryEntry['moderationStatus']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
            待审核
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            已批准
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            已拒绝
          </span>
        );
    }
  };

  const getDifficultyBadge = (level?: string) => {
    if (!level) return null;

    const colors = {
      beginner: 'bg-green-100 text-green-700',
      intermediate: 'bg-yellow-100 text-yellow-700',
      advanced: 'bg-red-100 text-red-700',
    };

    const labels = {
      beginner: '初级',
      intermediate: '中级',
      advanced: '高级',
    };

    return (
      <span className={`rounded px-2 py-0.5 text-xs font-medium ${colors[level as keyof typeof colors]}`}>
        {labels[level as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse rounded-lg bg-slate-100 p-4">
            <div className="h-4 w-3/4 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-slate-200">
        <div className="text-center">
          <p className="text-sm font-medium text-slate-900">暂无内容</p>
          <p className="mt-1 text-xs text-slate-500">该筛选条件下没有内容</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">
          {content.length} 条内容
        </p>
        <button className="text-sm text-primary hover:text-primary/80">
          刷新
        </button>
      </div>

      <div className="space-y-2">
        {content.map(item => (
          <button
            key={item.id}
            onClick={() => onSelectContent(item)}
            className={`w-full rounded-lg border-2 p-3 text-left transition-all hover:shadow-md ${
              selectedId === item.id
                ? 'border-primary bg-primary/5'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Thumbnail */}
              <img
                src={item.thumbnailUrl || `https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`}
                alt={item.title || 'Video thumbnail'}
                className="h-16 w-24 rounded object-cover"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="line-clamp-2 text-sm font-medium text-slate-900">
                    {item.title || `YouTube Video (${item.youtubeId})`}
                  </h4>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {getStatusBadge(item.moderationStatus)}
                  {getDifficultyBadge(item.difficultyLevel)}
                  {item.isFeatured && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                      ⭐ 精选
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                  <span>{Math.floor((item.duration || 0) / 60)} 分钟</span>
                  <span>{item.viewCount} 次查看</span>
                  <span className={item.cacheTier === 'hot' ? 'text-orange-600' : ''}>
                    {item.cacheTier === 'hot' && '🔥 热门'}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
