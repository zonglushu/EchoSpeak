/**
 * 视频网格选择器组件
 * 用于显示视频列表并支持选择、分页
 */

import { FileVideo, Loader2, LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { Pagination } from './Pagination';

interface VideoAsset {
  id: string;
  title: string;
  cover_url?: string | null;
  source_url?: string | null;
  platform?: string | null;
  status?: string | null;
  created_at: string;
}

interface VideoGridSelectorProps {
  assets: VideoAsset[];
  isLoading?: boolean;
  pageSize?: number;
  onSelect: (asset: VideoAsset) => void;
  hoverIcon?: LucideIcon;
  hoverText?: string;
  emptyMessage?: string;
  emptyDescription?: string;
}

export function VideoGridSelector({
  assets,
  isLoading = false,
  pageSize = 9,
  onSelect,
  hoverIcon: HoverIcon,
  hoverText = '点击选择',
  emptyMessage = '暂无视频',
  emptyDescription = '请先在上传页面上传视频',
}: VideoGridSelectorProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // 辅助函数：判断是否为最新视频（24小时内）
  const isLatest = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 24;
  };

  // 辅助函数：判断是否为YouTube视频
  const isYouTube = (sourceUrl?: string | null) => {
    if (!sourceUrl) return false;
    return sourceUrl.includes('youtube.com') || sourceUrl.includes('youtu.be');
  };

  // 辅助函数：格式化相对时间
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return '刚刚';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}天前`;
    
    return date.toLocaleDateString('zh-CN');
  };

  // 获取状态显示文本
  const getStatusText = (status?: string | null) => {
    if (!status) return null;
    const statusMap: Record<string, string> = {
      published: '已发布',
      processing: '处理中',
      draft: '草稿',
    };
    return statusMap[status] || status;
  };

  // 获取状态样式类名
  const getStatusClassName = (status?: string | null) => {
    if (!status) return 'bg-slate-100 text-slate-700';
    const statusClasses: Record<string, string> = {
      published: 'bg-emerald-100 text-emerald-700',
      processing: 'bg-blue-100 text-blue-700',
      draft: 'bg-slate-100 text-slate-700',
    };
    return statusClasses[status] || 'bg-slate-100 text-slate-700';
  };

  // 分页处理
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedAssets = assets.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileVideo className="h-12 w-12 text-slate-400 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{emptyMessage}</h3>
        <p className="text-sm text-slate-500">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <>
      {/* 视频网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedAssets.map((asset) => (
          <button
            key={asset.id}
            type="button"
            onClick={() => onSelect(asset)}
            className="group relative rounded-2xl border-2 border-slate-200 bg-white/50 p-4 text-left transition-all hover:border-primary hover:shadow-lg hover:bg-white"
          >
            {/* 视频封面 */}
            <div className="aspect-video bg-slate-100 rounded-lg mb-3 overflow-hidden relative">
              {asset.cover_url ? (
                <img
                  src={asset.cover_url}
                  alt={asset.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FileVideo className="h-12 w-12 text-slate-300" />
                </div>
              )}

              {/* 标签 */}
              <div className="absolute top-2 left-2 flex gap-1.5">
                {isLatest(asset.created_at) && (
                  <span className="inline-flex items-center rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-medium text-white shadow-sm">
                    最新
                  </span>
                )}
                {isYouTube(asset.source_url) && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white shadow-sm">
                    <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    YouTube
                  </span>
                )}
              </div>
            </div>

            {/* 视频信息 */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-2 group-hover:text-primary transition">
                {asset.title}
              </h4>
              <p className="text-xs text-slate-500 mb-2">
                {formatRelativeTime(asset.created_at)}
              </p>

              {/* 状态标签 */}
              {asset.status && (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClassName(asset.status)}`}>
                  {getStatusText(asset.status)}
                </span>
              )}
            </div>

            {/* 悬浮提示 */}
            <div className="absolute inset-0 rounded-2xl bg-primary/95 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="text-center text-white">
                {HoverIcon && <HoverIcon className="h-8 w-8 mx-auto mb-2" />}
                <p className="text-sm font-medium">{hoverText}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 分页控件 */}
      <Pagination
        currentPage={currentPage}
        totalItems={assets.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </>
  );
}
