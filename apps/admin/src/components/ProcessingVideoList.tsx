'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Image from 'next/image';

interface Job {
  id: string;
  stage: string;
  status: string;
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

interface ProcessingVideo {
  asset: {
    id: string;
    title: string;
    coverUrl?: string;
    status: string;
    createdAt: string;
  };
  pipeline: {
    id: string;
    status: string;
    currentStage?: string;
    progress: number;
    statusText: string;
    statusIcon: string;
    lastUpdated: string;
  };
  jobs: Job[];
}

export function ProcessingVideoList() {
  const router = useRouter();
  const [videos, setVideos] = useState<ProcessingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);
  const pageSize = 10; // 每页显示10个视频

  const fetchVideos = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }
      
      const response = await fetch(`/api/videos/processing?${params}`);
      const data = await response.json();
      
      if (data.videos) {
        setVideos(data.videos);
        setTotalVideos(data.videos.length);
      }
    } catch (error) {
      console.error('Failed to fetch processing videos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
    // 每 5 秒刷新一次
    const interval = setInterval(fetchVideos, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // 当筛选器改变时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // 计算分页数据
  const totalPages = Math.ceil(totalVideos / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedVideos = videos.slice(startIndex, endIndex);

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      upload: '📤 上传视频',
      transcribe: '📝 提取字幕',
      translate: '🌐 翻译字幕',
      notation: '🎵 生成发音谱',
      publish: '✅ 发布',
    };
    return labels[stage] || stage;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-500',
      failed: 'bg-red-500',
      canceled: 'bg-gray-500',
      running: 'bg-blue-500',
      queued: 'bg-yellow-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex gap-4">
              <Skeleton className="h-24 w-40" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-2 w-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 筛选器 */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          全部
        </Button>
        <Button
          variant={filter === 'running' ? 'default' : 'outline'}
          onClick={() => setFilter('running')}
          size="sm"
        >
          处理中
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
          size="sm"
        >
          已完成
        </Button>
        <Button
          variant={filter === 'failed' ? 'default' : 'outline'}
          onClick={() => setFilter('failed')}
          size="sm"
        >
          失败
        </Button>
      </div>

      {/* 视频列表 */}
      <div className="space-y-4">
        {paginatedVideos.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <p className="text-lg">暂无视频处理记录</p>
            <p className="text-sm mt-2">上传新视频后，处理进度将显示在这里</p>
          </Card>
        ) : (
          paginatedVideos.map((video) => (
            <Card
              key={video.pipeline.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/pipeline/${video.pipeline.id}`)}
            >
              <div className="flex gap-4">
                {/* 视频封面 */}
                {video.asset.coverUrl ? (
                  <div className="relative h-24 w-40 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                    {/* YouTube 缩略图使用 img 标签（Next.js Image 无法处理 YouTube CDN） */}
                    {video.asset.coverUrl.includes('youtube.com') || 
                     video.asset.coverUrl.includes('ytimg.com') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={video.asset.coverUrl}
                        alt={video.asset.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          // 降级到默认缩略图
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      /* Supabase 存储的图片使用 Next.js Image 组件优化 */
                      <Image
                        src={video.asset.coverUrl}
                        alt={video.asset.title}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                ) : (
                  <div className="h-24 w-40 bg-gradient-to-br from-blue-50 to-blue-100 rounded flex flex-col items-center justify-center text-gray-500 border border-gray-200 flex-shrink-0">
                    <span className="text-3xl mb-1">🎬</span>
                    <span className="text-xs">暂无封面</span>
                  </div>
                )}

                {/* 视频信息 */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold">{video.asset.title}</h3>
                    <Badge className={getStatusColor(video.pipeline.status)}>
                      {video.pipeline.statusIcon} {video.pipeline.statusText}
                    </Badge>
                  </div>

                  {/* 当前阶段 */}
                  {video.pipeline.currentStage && (
                    <div className="text-sm text-gray-600">
                      当前阶段: {getStageLabel(video.pipeline.currentStage)}
                    </div>
                  )}

                  {/* 进度条 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>整体进度</span>
                      <span>{video.pipeline.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${video.pipeline.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* 时间信息 */}
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>
                      更新时间:{' '}
                      {formatDistanceToNow(new Date(video.pipeline.lastUpdated), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                    </span>
                  </div>

                  {/* 快速操作按钮 */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/pipeline/${video.pipeline.id}`);
                      }}
                    >
                      查看详情
                    </Button>
                    {video.pipeline.status === 'failed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: 实现重试功能
                          alert('重试功能开发中');
                        }}
                      >
                        重试
                      </Button>
                    )}
                    {/* 取消按钮已隐藏 */}
                    {false && video.pipeline.status === 'running' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: 实现取消功能
                          alert('取消功能开发中');
                        }}
                      >
                        取消
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 分页器 */}
      {totalVideos > pageSize && (
        <div className="flex items-center justify-between mt-6 px-2">
          <div className="text-sm text-gray-600">
            显示 {startIndex + 1}-{Math.min(endIndex, totalVideos)} 条，共 {totalVideos} 条
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              上一页
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // 显示当前页附近的页码
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="min-w-[36px]"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
