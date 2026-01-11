/**
 * 从视频文件生成缩略图
 * @param file 视频文件
 * @param timeInSeconds 截取的时间点（秒），默认 1 秒
 * @returns Promise<Blob> 缩略图的 Blob 对象
 */
export async function generateVideoThumbnail(
  file: File,
  timeInSeconds: number = 1
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // 创建 video 元素
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    // 创建 canvas 用于截图
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('无法创建 canvas context'));
      return;
    }

    // 清理函数
    const cleanup = () => {
      URL.revokeObjectURL(video.src);
    };

    // 当视频元数据加载完成
    video.addEventListener('loadedmetadata', () => {
      // 设置画布尺寸（保持视频宽高比，最大宽度 1280px）
      const maxWidth = 1280;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;

      // 跳转到指定时间点（但不超过视频长度）
      const seekTime = Math.min(timeInSeconds, video.duration - 0.1);
      video.currentTime = seekTime;
    });

    // 当跳转完成后
    video.addEventListener('seeked', () => {
      try {
        // 绘制当前帧到 canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 转换为 Blob
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
          0.85 // JPEG 质量
        );
      } catch (error) {
        cleanup();
        reject(error);
      }
    });

    // 错误处理
    video.addEventListener('error', () => {
      cleanup();
      reject(new Error('视频加载失败'));
    });

    // 开始加载视频
    video.src = URL.createObjectURL(file);
  });
}

/**
 * 上传缩略图到 Supabase Storage
 * @param assetId 资源 ID
 * @param thumbnailBlob 缩略图 Blob
 * @param supabaseUrl Supabase URL
 * @param supabaseAnonKey Supabase 匿名密钥
 * @returns Promise<string> 缩略图的公开 URL
 */
export async function uploadThumbnailToSupabase(
  assetId: string,
  thumbnailBlob: Blob,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<string> {
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? 'media-uploads';
  const filename = `${assetId}/thumbnail.jpg`;

  // 使用 Supabase Storage API 上传
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${filename}`;

  const formData = new FormData();
  formData.append('file', thumbnailBlob, 'thumbnail.jpg');

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`上传缩略图失败: ${response.statusText}`);
  }

  // 返回公开 URL
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${filename}`;
}

/**
 * 从视频文件生成并上传缩略图
 * @param file 视频文件
 * @param assetId 资源 ID
 * @returns Promise<string | null> 缩略图 URL，失败返回 null
 */
export async function generateAndUploadThumbnail(
  file: File,
  assetId: string
): Promise<string | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('缺少 Supabase 配置');
      return null;
    }

    // 生成缩略图
    const thumbnailBlob = await generateVideoThumbnail(file, 1);

    // 上传到 Supabase
    const thumbnailUrl = await uploadThumbnailToSupabase(
      assetId,
      thumbnailBlob,
      supabaseUrl,
      supabaseAnonKey
    );

    return thumbnailUrl;
  } catch (error) {
    console.error('生成/上传缩略图失败:', error);
    return null;
  }
}
