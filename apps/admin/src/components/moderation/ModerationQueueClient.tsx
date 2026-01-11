'use client';

import { useEffect, useState } from 'react';
import type { ContentLibraryEntry } from '@echospeak/services';

interface ModerationQueueClientProps {
  filter: 'all' | 'pending' | 'approved' | 'rejected';
  selectedId?: string;
  onSelectContent: (content: ContentLibraryEntry) => void;
}

export function ModerationQueueClient({ filter, selectedId, onSelectContent }: ModerationQueueClientProps) {
  const [content, setContent] = useState<ContentLibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 客户端通过 API 获取数据
    const fetchContent = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/moderation/content?filter=${filter}`);
        const data = await response.json();
        setContent(data.content || []);
      } catch (error) {
        console.error('Failed to fetch content:', error);
        setContent([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [filter]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
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
        <p className="text-sm font-medium text-slate-700">{content.length} 条内容</p>
      </div>

      <div className="space-y-2">
        {content.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectContent(item)}
            className={`w-full rounded-lg border-2 p-3 text-left transition-all hover:shadow-md ${
              selectedId === item.id ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:border-slate-300'
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
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                    待审核
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                  <span>{Math.floor((item.duration || 0) / 60)} 分钟</span>
                  <span>{item.viewCount || 0} 次查看</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
