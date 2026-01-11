'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWorkflowStore } from '@/stores/workflowStore';
import type { UploadJob } from '@echospeak/types';
import {
  FileVideo,
  Youtube,
  Upload,
  Search,
  Filter,
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Trash2,
  RefreshCw,
  Loader2,
} from 'lucide-react';

const statusConfig: Record<UploadJob['status'], { icon: typeof CheckCircle; label: string; className: string }> = {
  queued: { icon: Clock, label: '排队中', className: 'bg-slate-100 text-slate-600' },
  uploading: { icon: RefreshCw, label: '上传中', className: 'bg-blue-100 text-blue-600' },
  processing: { icon: Clock, label: '处理中', className: 'bg-amber-100 text-amber-600' },
  completed: { icon: CheckCircle, label: '已完成', className: 'bg-green-100 text-green-600' },
  error: { icon: XCircle, label: '错误', className: 'bg-red-100 text-red-600' },
};

const stageConfig: Record<UploadJob['stage'], { label: string }> = {
  upload: { label: '上传' },
  transcribe: { label: '转写' },
  notation: { label: '打谱' },
  publish: { label: '发布' },
};

export function UploadWorkbench() {
  const { selectAsset, markStepComplete } = useWorkflowStore();
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<UploadJob['status'] | 'all'>('all');
  const [search, setSearch] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedJob, setSelectedJob] = useState<UploadJob | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 从 API 获取上传任务列表（只显示 upload 阶段）
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 只获取 upload 阶段的 jobs
      const response = await fetch('/api/jobs?stage=upload&limit=100');
      if (!response.ok) {
        throw new Error('获取任务列表失败');
      }
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : '获取任务列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 组件加载时获取数据
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // 移除了自动定时刷新，改为只支持手动刷新
  // 用户可以点击"刷新"按钮来更新任务列表

  // 过滤和搜索
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const statusMatch = filter === 'all' || job.status === filter;
      const keyword = search.trim().toLowerCase();
      const searchMatch = !keyword || job.filename.toLowerCase().includes(keyword);
      return statusMatch && searchMatch;
    });
  }, [jobs, filter, search]);

  // 分页
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredJobs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredJobs, currentPage]);

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    const newJob: UploadJob = {
      id: `job-${Date.now()}`,
      filename: file.name,
      size: file.size,
      createdAt: new Date().toISOString(),
      status: 'uploading',
      stageStatus: 'uploading',
      stage: 'upload',
      progress: 0,
      language: '双语',
    };

    setJobs((prev) => [newJob, ...prev]);

    try {
      // Step 1: 生成缩略图（不阻塞上传）
      let thumbnailBlob: Blob | null = null;
      try {
        thumbnailBlob = await generateVideoThumbnail(file, 1);
      } catch (thumbnailError) {
        console.warn('生成缩略图失败，继续上传:', thumbnailError);
      }

      // Step 2: 获取上传签名
      const signResponse = await fetch('/api/upload/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          size: file.size,
          type: file.type,
          title: file.name,
        }),
      });

      if (!signResponse.ok) {
        throw new Error('获取上传签名失败');
      }

      const signData = await signResponse.json();
      const { uploadUrl, assetId } = signData;

      // Step 3: 上传文件到 Supabase Storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('文件上传失败');
      }

      // Step 4: 上传缩略图（如果生成成功）
      if (thumbnailBlob && assetId) {
        try {
          const thumbnailFormData = new FormData();
          thumbnailFormData.append('thumbnail', thumbnailBlob, 'thumbnail.jpg');

          await fetch(`/api/assets/${assetId}/thumbnail`, {
            method: 'POST',
            body: thumbnailFormData,
          });
        } catch (thumbnailError) {
          console.warn('上传缩略图失败:', thumbnailError);
        }
      }

      // Step 5: 更新 UI 为完成状态
      setJobs((prev) =>
        prev.map((job) =>
          job.id === newJob.id
            ? { ...job, status: 'completed' as const, stageStatus: 'completed' as const, progress: 100 }
            : job
        )
      );

      // 刷新任务列表
      fetchJobs();
    } catch (error) {
      console.error('文件上传失败:', error);
      setJobs((prev) =>
        prev.map((job) =>
          job.id === newJob.id
            ? { ...job, status: 'error' as const, stageStatus: 'error' as const }
            : job
        )
      );
    }
  };

  // 从视频文件生成缩略图
  const generateVideoThumbnail = (file: File, timeInSeconds: number = 1): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('无法创建 canvas context'));
        return;
      }

      const cleanup = () => {
        URL.revokeObjectURL(video.src);
      };

      video.addEventListener('loadedmetadata', () => {
        const maxWidth = 1280;
        const scale = Math.min(1, maxWidth / video.videoWidth);
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;

        const seekTime = Math.min(timeInSeconds, video.duration - 0.1);
        video.currentTime = seekTime;
      });

      video.addEventListener('seeked', () => {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(
            (blob) => {
              cleanup();
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('生成缩略图失败'));
              }
            },
            'image/jpeg',
            0.85
          );
        } catch (error) {
          cleanup();
          reject(error);
        }
      });

      video.addEventListener('error', () => {
        cleanup();
        reject(new Error('视频加载失败'));
      });

      video.src = URL.createObjectURL(file);
    });
  };

  const handleYoutubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;

    // Extract YouTube video ID
    const match = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\s]+)/);
    if (!match) {
      alert('无效的 YouTube URL');
      return;
    }

    const videoId = match[1];
    
    // 创建临时 job 用于 UI 显示
    const tempJobId = `temp-${Date.now()}`;
    const tempJob: UploadJob = {
      id: tempJobId,
      filename: `YouTube: ${videoId}`,
      size: 0,
      createdAt: new Date().toISOString(),
      status: 'uploading',
      stageStatus: 'uploading',
      stage: 'upload',
      progress: 50,
      language: '双语',
      payload: {
        youtubeUrl,
        videoId,
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      },
    };

    setJobs((prev) => [tempJob, ...prev]);
    setYoutubeUrl('');

    try {
      // 调用后端 API 创建 YouTube 资源
      const response = await fetch('/api/upload/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          youtubeUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'YouTube 导入失败');
      }

      const result = await response.json();
      
      // 移除临时 job，重新获取真实的任务列表
      setJobs((prev) => prev.filter(job => job.id !== tempJobId));
      
      // 刷新任务列表以获取真实的 job
      await fetchJobs();
      
      // 可以选择性地跳转到字幕处理页面
      if (result.assetId) {
        // selectAsset(result.assetId, result.title || `YouTube: ${videoId}`, youtubeUrl);
        // markStepComplete('upload');
      }
    } catch (error) {
      console.error('YouTube 导入失败:', error);
      
      // 更新临时 job 为错误状态
      setJobs((prev) =>
        prev.map((job) =>
          job.id === tempJobId
            ? { 
                ...job, 
                status: 'error' as const, 
                stageStatus: 'error' as const,
                progress: 0 
              }
            : job
        )
      );
      
      alert(error instanceof Error ? error.message : 'YouTube 导入失败，请重试');
    }
  };

  const handleJobClick = (job: UploadJob) => {
    setSelectedJob(job);
    if (job.status === 'completed') {
      selectAsset(job.id, job.filename, job.payload?.embedUrl);
      markStepComplete('upload');
    }
  };

  const handleDeleteJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // 确认删除
    if (!confirm('确定要删除这个任务吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '删除任务失败');
      }

      // 从列表中移除
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
      if (selectedJob?.id === jobId) {
        setSelectedJob(null);
      }
    } catch (err) {
      console.error('Error deleting job:', err);
      alert(err instanceof Error ? err.message : '删除任务失败');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">上传视频</h2>
        <p className="mt-1 text-sm text-slate-500">支持本地视频文件或 YouTube 链接</p>

        {/* YouTube URL Input */}
        <form onSubmit={handleYoutubeSubmit} className="mt-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Youtube className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-red-500" />
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="粘贴 YouTube 视频链接..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-red-600"
            >
              <Upload className="h-4 w-4" />
              导入 YouTube
            </button>
          </div>
        </form>

        {/* File Upload Area */}
        <div
          className={`relative mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-slate-200 bg-slate-50 hover:border-slate-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'video/*';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleFileUpload(file);
            };
            input.click();
          }}
        >
          <div className="rounded-full bg-slate-100 p-4">
            <FileVideo className="h-8 w-8 text-slate-400" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-900">点击上传或拖拽文件到此处</p>
          <p className="mt-1 text-xs text-slate-500">支持 MP4, MOV, AVI 等常见视频格式</p>
        </div>
      </div>

      {/* Jobs List Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">上传任务</h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredJobs.length} 个任务 · {filter === 'all' ? '全部' : statusConfig[filter]?.label}
            </p>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchJobs}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="搜索文件名..."
                className="w-64 rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value as UploadJob['status'] | 'all');
                  setCurrentPage(1);
                }}
                className="appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2 pr-10 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="all">全部状态</option>
                <option value="queued">排队中</option>
                <option value="uploading">上传中</option>
                <option value="processing">处理中</option>
                <option value="completed">已完成</option>
                <option value="error">错误</option>
              </select>
              <Filter className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-100">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-slate-600">加载中...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="mt-3 text-sm text-slate-900">{error}</p>
              <button
                onClick={fetchJobs}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary/90"
              >
                <RefreshCw className="h-4 w-4" />
                重试
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">文件名</th>
                  <th className="px-4 py-3 font-medium">阶段</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">进度</th>
                  <th className="px-4 py-3 font-medium">大小</th>
                  <th className="px-4 py-3 font-medium">创建时间</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      暂无任务
                    </td>
                  </tr>
                ) : (
                  paginatedJobs.map((job) => {
                  const StatusIcon = statusConfig[job.status].icon;
                  return (
                    <tr
                      key={job.id}
                      className={`cursor-pointer border-t border-slate-100 transition-colors ${
                        selectedJob?.id === job.id ? 'bg-primary/5' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => handleJobClick(job)}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {job.payload?.thumbnail ? (
                            <img
                              src={job.payload.thumbnail}
                              alt=""
                              className="h-12 w-16 rounded object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-16 items-center justify-center rounded bg-slate-100">
                              <FileVideo className="h-6 w-6 text-slate-400" />
                            </div>
                          )}
                          <div className="max-w-xs">
                            <p className="truncate font-medium text-slate-900">{job.filename}</p>
                            {job.payload?.youtubeUrl && (
                              <p className="truncate text-xs text-slate-500">{job.payload.youtubeUrl}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {stageConfig[job.stage].label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusConfig[job.status].className}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[job.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600">{job.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600">
                        {job.size > 0 ? formatFileSize(job.size) : '-'}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600">
                        {formatDate(job.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={(e) => handleDeleteJob(job.id, e)}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              显示 {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredJobs.length)} 条，
              共 {filteredJobs.length} 条
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                上一页
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[2rem] rounded-lg px-3 py-1.5 text-sm ${
                      currentPage === page
                        ? 'bg-primary text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
