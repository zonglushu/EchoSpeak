import { ProcessingVideoList } from '@/components/ProcessingVideoList';

export default function Home() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">内容管理</h1>
        <p className="text-gray-600">
          查看和管理所有视频内容，实时跟踪处理状态
        </p>
      </div>

      <ProcessingVideoList />
    </div>
  );
}
