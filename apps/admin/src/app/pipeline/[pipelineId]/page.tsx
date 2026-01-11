'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PipelineProgress } from '@/components/PipelineProgress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PipelineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pipelineId = params.pipelineId as string;
  const [assetTitle, setAssetTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取视频标题
    fetch(`/api/pipelines/${pipelineId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.pipeline?.asset?.title) {
          setAssetTitle(data.pipeline.asset.title);
        }
      })
      .catch((err) => console.error('Failed to fetch pipeline:', err))
      .finally(() => setLoading(false));
  }, [pipelineId]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 返回按钮 */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          ← 返回列表
        </Button>
        {loading ? (
          <Skeleton className="h-8 w-48" />
        ) : (
          <h1 className="text-2xl font-bold">{assetTitle || '视频处理详情'}</h1>
        )}
      </div>

      {/* Pipeline 进度显示 */}
      <PipelineProgress pipelineId={pipelineId} assetTitle={assetTitle} />

      {/* 操作按钮 */}
      <Card className="p-6">
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => {
              // TODO: 实现重试功能
              alert('重试功能开发中');
            }}
          >
            🔄 重试失败步骤
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // TODO: 实现取消功能
              if (confirm('确定要取消整个处理流程吗？')) {
                alert('取消功能开发中');
              }
            }}
          >
            ⏸️ 取消全部
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // TODO: 实现重新处理功能
              if (confirm('确定要重新开始处理这个视频吗？')) {
                alert('重新处理功能开发中');
              }
            }}
          >
            🔁 重新处理
          </Button>
        </div>
      </Card>
    </div>
  );
}
