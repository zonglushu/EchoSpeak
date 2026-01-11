'use client';

import { useState } from 'react';
import type { ContentLibraryEntry } from '@echospeak/services';

interface ModerationDetailProps {
  content: ContentLibraryEntry;
}

export function ModerationDetail({ content }: ModerationDetailProps) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    // TODO: Call API to approve content
    console.log('Approving content:', content.id, 'with notes:', notes);
    setTimeout(() => {
      setLoading(false);
      alert('内容已批准');
    }, 1000);
  };

  const handleReject = async () => {
    setLoading(true);
    // TODO: Call API to reject content
    console.log('Rejecting content:', content.id, 'with notes:', notes);
    setTimeout(() => {
      setLoading(false);
      alert('内容已拒绝');
    }, 1000);
  };

  const toggleFeatured = async () => {
    setLoading(true);
    // TODO: Call API to toggle featured status
    console.log('Toggling featured for content:', content.id);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Video Preview */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex gap-6">
          {/* Thumbnail */}
          <div className="flex-shrink-0">
            <img
              src={content.thumbnailUrl || `https://img.youtube.com/vi/${content.youtubeId}/mqdefault.jpg`}
              alt={content.title || 'Video thumbnail'}
              className="h-40 w-64 rounded-lg object-cover shadow-sm"
            />
            <a
              href={`https://www.youtube.com/watch?v=${content.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-center text-sm text-primary hover:underline"
            >
              在 YouTube 上打开
            </a>
          </div>

          {/* Video Info */}
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-slate-900">
              {content.title || `YouTube Video (${content.youtubeId})`}
            </h3>

            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">视频 ID</dt>
                <dd className="font-mono text-slate-900">{content.youtubeId}</dd>
              </div>
              <div>
                <dt className="text-slate-500">时长</dt>
                <dd className="text-slate-900">
                  {Math.floor((content.duration || 0) / 60)} 分钟 {((content.duration || 0) % 60)} 秒
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">语言</dt>
                <dd className="text-slate-900">{content.languageCode.toUpperCase()}</dd>
              </div>
              <div>
                <dt className="text-slate-500">难度级别</dt>
                <dd className="text-slate-900 capitalize">{content.difficultyLevel || '未设置'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">查看次数</dt>
                <dd className="text-slate-900">{content.viewCount}</dd>
              </div>
              <div>
                <dt className="text-slate-500">缓存级别</dt>
                <dd className="text-slate-900 capitalize">
                  <span className={content.cacheTier === 'hot' ? 'text-orange-600 font-medium' : ''}>
                    {content.cacheTier}
                  </span>
                </dd>
              </div>
            </dl>

            {/* Topic Tags */}
            {content.topicTags && content.topicTags.length > 0 && (
              <div className="mt-4">
                <dt className="text-sm text-slate-500">主题标签</dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  {content.topicTags.map(tag => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Processing Info */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-slate-900">处理信息</h4>

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">提取时间</dt>
            <dd className="text-slate-900">{new Date(content.extractedAt).toLocaleString('zh-CN')}</dd>
          </div>
          <div>
            <dt className="text-slate-500">处理成本</dt>
            <dd className="text-slate-900">${content.processingCostUsd.toFixed(4)}</dd>
          </div>
          {content.basicProcessedAt && (
            <div>
              <dt className="text-slate-500">基础标注完成时间</dt>
              <dd className="text-slate-900">{new Date(content.basicProcessedAt).toLocaleString('zh-CN')}</dd>
            </div>
          )}
          {content.fullProcessedAt && (
            <div>
              <dt className="text-slate-500">完整标注完成时间</dt>
              <dd className="text-slate-900">{new Date(content.fullProcessedAt).toLocaleString('zh-CN')}</dd>
            </div>
          )}
          <div>
            <dt className="text-slate-500">AI 模型</dt>
            <dd className="text-slate-900">{content.aiModelUsed || 'N/A'}</dd>
          </div>
          {content.generationTimeMs && (
            <div>
              <dt className="text-slate-500">生成耗时</dt>
              <dd className="text-slate-900">{(content.generationTimeMs / 1000).toFixed(2)} 秒</dd>
            </div>
          )}
        </dl>

        {/* Layer Status */}
        <div className="mt-4 rounded-lg bg-slate-50 p-4">
          <h5 className="text-sm font-medium text-slate-700 mb-2">处理层级</h5>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className={`h-2 w-2 rounded-full ${content.rawSubtitles.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-slate-700">Layer 1: 原始字幕</span>
              <span className="text-slate-500">({content.rawSubtitles.length} 条)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={`h-2 w-2 rounded-full ${content.basicAnnotations ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-slate-700">Layer 2: 基础标注</span>
              {content.basicAnnotations && (
                <span className="text-slate-500">({content.basicAnnotations.length} 条)</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={`h-2 w-2 rounded-full ${content.fullProsodyData ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-slate-700">Layer 3: 完整韵律</span>
              {content.fullProsodyData && (
                <span className="text-slate-500">({content.fullProsodyData.length} 条)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Moderation Actions */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-slate-900">审核操作</h4>

        {/* Current Status */}
        <div className="mt-4 rounded-lg bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <dt className="text-sm text-slate-500">当前状态</dt>
              <dd className="mt-1">
                {content.moderationStatus === 'pending' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
                    待审核
                  </span>
                )}
                {content.moderationStatus === 'approved' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                    已批准
                  </span>
                )}
                {content.moderationStatus === 'rejected' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                    已拒绝
                  </span>
                )}
              </dd>
            </div>

            {/* Featured Toggle */}
            <button
              onClick={toggleFeatured}
              disabled={loading}
              className={`inline-flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                content.isFeatured
                  ? 'border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {content.isFeatured ? '⭐ 取消精选' : '☆ 设为精选'}
            </button>
          </div>

          {content.moderatedBy && (
            <div className="mt-3 text-sm text-slate-600">
              <span>审核人: {content.moderatedBy}</span>
              {content.moderatedAt && (
                <span className="ml-4">
                  时间: {new Date(content.moderatedAt).toLocaleString('zh-CN')}
                </span>
              )}
            </div>
          )}

          {content.moderationNotes && (
            <div className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-700">
              <dt className="font-medium text-slate-500">审核备注</dt>
              <dd className="mt-1">{content.moderationNotes}</dd>
            </div>
          )}
        </div>

        {/* Notes Input */}
        <div className="mt-4">
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
            审核备注
          </label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="添加审核备注（可选）..."
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleApprove}
            disabled={loading || content.moderationStatus === 'approved'}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            批准
          </button>

          <button
            onClick={handleReject}
            disabled={loading || content.moderationStatus === 'rejected'}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            拒绝
          </button>
        </div>
      </div>
    </div>
  );
}
