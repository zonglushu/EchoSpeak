'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { MediaAssetSummary } from '@echospeak/types';
import { mockAssets } from '@/data/mockAssets';
import {
  BadgeCheck,
  BookCheck,
  Loader2,
  PlayCircle,
  Search,
  Sparkles,
  Tag,
  UploadCloud,
} from 'lucide-react';

const statusTheme: Record<MediaAssetSummary['status'], { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-slate-100 text-slate-600' },
  processing: { label: '处理中', className: 'bg-amber-100 text-amber-600' },
  published: { label: '已发布', className: 'bg-emerald-100 text-emerald-600' },
  archived: { label: '已归档', className: 'bg-slate-200 text-slate-500' },
};

const languageMap: Record<MediaAssetSummary['language'], string> = {
  bilingual: '中英双语',
  english: '英文',
  chinese: '中文',
};

export const ContentLibrary = () => {
  const [assets, setAssets] = useState<MediaAssetSummary[]>(mockAssets);
  const [statusFilter, setStatusFilter] = useState<MediaAssetSummary['status'] | 'all'>('all');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<MediaAssetSummary | null>(mockAssets[0]);
  const [isPublishing, setIsPublishing] = useState(false);

  const filtered = useMemo(() => {
    return assets.filter((asset) => {
      const statusMatch = statusFilter === 'all' || asset.status === statusFilter;
      const keyword = search.trim().toLowerCase();
      const searchMatch = !keyword || asset.title.toLowerCase().includes(keyword) || asset.tags.some((tag) => tag.includes(keyword));
      return statusMatch && searchMatch;
    });
  }, [assets, search, statusFilter]);

  const publishAsset = async (asset: MediaAssetSummary) => {
    if (asset.status === 'published') return;
    setIsPublishing(true);
    try {
  const response = await fetch(`/api/assets/${asset.id}/publish`, { method: 'POST' });
  if (!response.ok) throw new Error('发布失败');
  const nextAsset: MediaAssetSummary = { ...asset, status: 'published', jobProgress: 100 };
      setAssets((prev) => prev.map((item) => (item.id === asset.id ? nextAsset : item)));
      setPreview(nextAsset);
    } catch (error) {
      console.error(error);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <section className="glass-panel rounded-3xl border border-white/10 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-slate-900">内容库 & 发布</p>
          <p className="text-sm text-slate-500">筛选素材、预览字幕、批量发布或归档</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {(['all', 'draft', 'processing', 'published'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status === 'all' ? 'all' : status)}
              className={`rounded-full px-4 py-1 font-medium transition ${
                statusFilter === status ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {status === 'all' ? '全部' : statusTheme[status].label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="rounded-3xl border border-slate-100 bg-white/80 p-4">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-500">
            <Search className="h-4 w-4" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索标题 / 标签"
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </label>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">素材</th>
                  <th className="px-4 py-3 font-medium">进度</th>
                  <th className="px-4 py-3 font-medium">语言</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((asset) => (
                  <tr key={asset.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <button type="button" onClick={() => setPreview(asset)} className="text-left">
                        <p className="font-medium text-slate-900">{asset.title}</p>
                        <p className="text-xs text-slate-500">{asset.tags.join(' · ')}</p>
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${asset.jobProgress}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{asset.jobProgress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">{languageMap[asset.language]}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${statusTheme[asset.status].className}`}>
                        {statusTheme[asset.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <button
                        type="button"
                        onClick={() => publishAsset(asset)}
                        disabled={asset.status === 'published' || isPublishing}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-slate-600 disabled:opacity-50"
                      >
                        {asset.status === 'published' ? <BadgeCheck className="h-3 w-3 text-success" /> : <UploadCloud className="h-3 w-3" />}
                        {asset.status === 'published' ? '已发布' : '发布'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white/80 p-5 text-sm">
          {preview ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-slate-500">预览</p>
                <div className="relative h-48 w-full overflow-hidden rounded-2xl">
                  <Image
                    src={preview.coverUrl}
                    alt={preview.title}
                    fill
                    className="object-cover"
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 480px"
                  />
                  <div className="absolute inset-0 bg-slate-900/40" />
                  <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
                    <div>
                      <p className="text-lg font-semibold">{preview.title}</p>
                      <p className="text-xs text-slate-200">{languageMap[preview.language]} · {Math.round(preview.durationSeconds / 60)} 分钟</p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm backdrop-blur"
                    >
                      <PlayCircle className="h-4 w-4" /> 播放片段
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">关键信息</p>
                <div className="mt-3 space-y-2 text-xs text-slate-600">
                  <p>字幕行数:{preview.transcriptCount}</p>
                  <p suppressHydrationWarning>最近更新:{new Date(preview.updatedAt).toLocaleString('zh-CN', { hour12: false })}</p>
                  <div className="flex flex-wrap gap-2">
                    {preview.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-xs text-primary">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4" /> 发布提示
                </p>
                <p className="mt-2 text-slate-600">
                  发布会触发 Supabase Webhook，3 秒内同步至学员端。你可以在发布前再次校对字幕、发音谱与 QA 备注。
                </p>
                <button
                  type="button"
                  onClick={() => publishAsset(preview)}
                  disabled={preview.status === 'published' || isPublishing}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-white disabled:opacity-60"
                >
                  {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookCheck className="h-4 w-4" />}
                  {preview.status === 'published' ? '已发布' : '发布到学员端'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid h-full place-content-center text-slate-400">请选择一条素材</div>
          )}
        </div>
      </div>
    </section>
  );
};
