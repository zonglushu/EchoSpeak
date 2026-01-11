'use client';

import { useState } from 'react';
import type { ContentLibraryEntry } from '@echospeak/services';
import { ModerationQueueClient } from './ModerationQueueClient';
import { ModerationDetail } from './ModerationDetail';

export function ModerationDashboardClient() {
  const [selectedContent, setSelectedContent] = useState<ContentLibraryEntry | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  return (
    <div className="space-y-8">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => {
            setFilter('all');
            setSelectedContent(null);
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'border-b-2 border-primary text-primary'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          全部
        </button>
        <button
          onClick={() => {
            setFilter('pending');
            setSelectedContent(null);
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'border-b-2 border-orange-500 text-orange-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          待审核
        </button>
        <button
          onClick={() => {
            setFilter('approved');
            setSelectedContent(null);
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'approved'
              ? 'border-b-2 border-green-500 text-green-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          已批准
        </button>
        <button
          onClick={() => {
            setFilter('rejected');
            setSelectedContent(null);
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'rejected'
              ? 'border-b-2 border-red-500 text-red-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          已拒绝
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Queue List - 客户端组件，通过 API 获取数据 */}
        <div className="lg:col-span-1">
          <ModerationQueueClient filter={filter} selectedId={selectedContent?.id} onSelectContent={setSelectedContent} />
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          {selectedContent ? (
            <ModerationDetail content={selectedContent} />
          ) : (
            <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50">
              <div className="text-center">
                <p className="text-lg font-medium text-slate-900">选择内容进行审核</p>
                <p className="mt-2 text-sm text-slate-500">从左侧列表中选择一条内容查看详情并进行审核</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
