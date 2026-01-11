/**
 * YouTube Subtitle Extraction Service (Layer 1)
 *
 * This service handles extracting raw subtitles from YouTube videos.
 * It's part of the layered processing architecture:
 * - Layer 1: Raw subtitle extraction (instant, free)
 * - Layer 2: Basic annotation (async, low cost)
 * - Layer 3: Full prosody analysis (async, high cost)
 */

import type { TranscriptLine } from '@echospeak/types';

/**
 * YouTube video metadata
 */
export interface YouTubeVideoMetadata {
  id: string;
  title: string;
  thumbnailUrl: string;
  duration: number; // seconds
  channelTitle?: string;
  publishedAt?: string;
}

/**
 * Raw subtitle data from YouTube
 */
export interface YouTubeSubtitles {
  videoId: string;
  language: string;
  lines: TranscriptLine[];
  extractedAt: Date;
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Fetch YouTube video metadata
 */
export async function fetchYouTubeMetadata(
  videoId: string,
  apiKey?: string
): Promise<YouTubeVideoMetadata | null> {
  try {
    // If API key is provided, use YouTube Data API v3
    if (apiKey) {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.items?.[0]) {
        return null;
      }

      const item = data.items[0];
      const snippet = item.snippet;

      // Parse ISO 8601 duration (PT4M13S -> 253 seconds)
      const duration = parseDuration(item.contentDetails?.duration || 'PT0S');

      return {
        id: videoId,
        title: snippet?.title || '',
        thumbnailUrl: snippet?.thumbnails?.medium?.url || snippet?.thumbnails?.default?.url || '',
        duration,
        channelTitle: snippet?.channelTitle,
        publishedAt: snippet?.publishedAt,
      };
    }

    // Fallback: Use oEmbed API (no API key required, but limited data)
    const oembedResponse = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );

    if (!oembedResponse.ok) {
      return null;
    }

    const oembedData = await oembedResponse.json();

    return {
      id: videoId,
      title: oembedData.title || '',
      thumbnailUrl: oembedData.thumbnail_url || '',
      duration: 0, // oEmbed doesn't provide duration
    };
  } catch (error) {
    console.error('Failed to fetch YouTube metadata:', error);
    return null;
  }
}

/**
 * Parse ISO 8601 duration format (PT4M13S -> 253 seconds)
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetch YouTube subtitles using Tim Stock's YouTube Transcript API
 * This is a free API that doesn't require authentication
 */
export async function fetchYouTubeSubtitles(
  videoId: string,
  language: string = 'en'
): Promise<TranscriptLine[]> {
  try {
    // Using youtube-transcript-api via a CORS proxy or similar service
    // For production, you should host your own transcript extraction service
    // or use the YouTube Data API with proper authentication

    // Option 1: Use YouTube Data API v3 (requires API key)
    // Option 2: Use a third-party transcript service
    // Option 3: Use a server-side extraction service

    // For now, we'll implement a basic version using a proxy service
    const response = await fetch(
      `https://youtube-transcriptor.vercel.app/api/transcript?videoId=${videoId}&lang=${language}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch subtitles: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.transcript || !Array.isArray(data.transcript)) {
      throw new Error('Invalid transcript data format');
    }

    // Transform the transcript data to our format
    return data.transcript.map((item: any, index: number) => ({
      id: `${videoId}-${index}`,
      text: item.text || '',
      translation: '', // No translation in raw subtitles
      startTime: item.offset || item.start || index * 5,
      endTime: (item.offset || item.start || index * 5) + (item.duration || 5),
    }));
  } catch (error) {
    console.error('Failed to fetch YouTube subtitles:', error);

    // Return placeholder data for development
    console.warn('Returning placeholder subtitles for development');
    return [
      {
        id: `${videoId}-0`,
        text: '[Subtitles not available. Please check the video URL or try again later.]',
        translation: '[字幕不可用。请检查视频链接或稍后重试。]',
        startTime: 0,
        endTime: 5,
      },
    ];
  }
}

/**
 * Extract complete YouTube subtitle data (metadata + subtitles)
 */
export async function extractYouTubeSubtitles(
  videoIdOrUrl: string,
  options: {
    language?: string;
    apiKey?: string;
  } = {}
): Promise<YouTubeSubtitles & { metadata: YouTubeVideoMetadata | null }> {
  // Extract video ID if URL is provided
  const videoId = extractYouTubeId(videoIdOrUrl);
  if (!videoId) {
    throw new Error('Invalid YouTube URL or video ID');
  }

  // Fetch metadata and subtitles in parallel
  const [metadata, subtitles] = await Promise.all([
    fetchYouTubeMetadata(videoId, options.apiKey),
    fetchYouTubeSubtitles(videoId, options.language || 'en'),
  ]);

  return {
    videoId,
    language: options.language || 'en',
    lines: subtitles,
    extractedAt: new Date(),
    metadata,
  };
}

/**
 * Validate if a string is a valid YouTube URL or video ID
 */
export function isValidYouTubeUrl(input: string): boolean {
  return extractYouTubeId(input) !== null;
}

/**
 * Generate thumbnail URL for a YouTube video
 */
export function getYouTubeThumbnailUrl(
  videoId: string,
  quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'medium'
): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}
