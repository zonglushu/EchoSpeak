/**
 * YouTube Player Type Definitions
 *
 * Types for the YouTube IFrame Player API
 * https://developers.google.com/youtube/iframe_api_reference
 */

/**
 * YouTube Player states
 */
export enum YouTubePlayerState {
  UNSTARTED = -1,
  ENDED = 0,
  PLAYING = 1,
  PAUSED = 2,
  BUFFERING = 3,
  CUED = 5,
}

/**
 * YouTube Player error codes
 */
export enum YouTubePlayerError {
  INVALID_PARAM = 2,
  HTML5_ERROR = 5,
  NOT_FOUND = 100,
  NOT_EMBEDDABLE = 101,
  CANNOT_FIND_VIDEO = 150,
}

/**
 * YouTube Player instance methods
 */
export interface YouTubePlayer {
  /**
   * Plays the currently cued/loaded video
   */
  playVideo(): void;

  /**
   * Pauses the currently playing video
   */
  pauseVideo(): void;

  /**
   * Stops and cancels loading of the current video
   */
  stopVideo(): void;

  /**
   * Seeks to a specified time in the video
   */
  seekTo(seconds: number, allowSeekAhead: boolean): void;

  /**
   * Returns the elapsed time in seconds since the video started playing
   */
  getCurrentTime(): number;

  /**
   * Returns the duration in seconds of the currently playing video
   */
  getDuration(): number;

  /**
   * Returns the byte-array of the downloaded video data
   */
  getVideoBytesLoaded(): number;

  /**
   * Returns the byte-array of the entire video
   */
  getVideoBytesTotal(): number;

  /**
   * Returns the number of bytes loaded since the video was loaded
   */
  getVideoStartBytes(): number;

  /**
   * Mutes the player
   */
  mute(): void;

  /**
   * Unmutes the player
   */
  unMute(): void;

  /**
   * Returns true if the player is muted, false if not
   */
  isMuted(): boolean;

  /**
   * Sets the volume
   */
  setVolume(volume: number): void;

  /**
   * Returns the player's current volume
   */
  getVolume(): number;

  /**
   * Sets the playback rate
   */
  setPlaybackRate(playbackRate: number): void;

  /**
   * Returns the playback rate
   */
  getPlaybackRate(): number;

  /**
   * Returns the available playback rates
   */
  getAvailablePlaybackRates(): number[];

  /**
   * Returns the YouTube player instance
   */
  getIframe(): HTMLIFrameElement;

  /**
   * Returns the embed code
   */
  getPlaylist(): string;

  /**
   * Returns the playlist ID
   */
  getPlaylistIndex(): number;

  /**
   * Loads and plays the next video in the playlist
   */
  nextVideo(): void;

  /**
   * Loads and plays the previous video in the playlist
   */
  previousVideo(): void;

  /**
   * Loads the specified video
   */
  cueVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;

  /**
   * Loads the specified video and starts playback
   */
  loadVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;

  /**
   * Queues the specified video
   */
  cueVideoByUrl(mediaContentUrl: string, startSeconds?: number): void;

  /**
   * Loads and plays the specified video
   */
  loadVideoByUrl(mediaContentUrl: string, startSeconds?: number): void;

  /**
   * Sets the size in pixels of the player
   */
  setSize(width: number, height: number): void;

  /**
   * Destroys the player
   */
  destroy(): void;
}

/**
 * YouTube Player event targets
 */
export interface YouTubePlayerEventTarget {
  player?: YouTubePlayer;
}

/**
 * Event data for onStateChange event
 */
export interface YouTubePlayerStateEvent {
  target: YouTubePlayerEventTarget;
  data: YouTubePlayerState;
}

/**
 * Event data for onReady event
 */
export interface YouTubePlayerReadyEvent {
  target: YouTubePlayerEventTarget;
}

/**
 * Event data for onError event
 */
export interface YouTubePlayerErrorEvent {
  target: YouTubePlayerEventTarget;
  data: YouTubePlayerError;
}

/**
 * YouTube Player options
 */
export interface YouTubePlayerOptions {
  height?: string | number;
  width?: string | number;
  videoId: string;
  playerVars?: {
    autoplay?: 0 | 1;
    controls?: 0 | 1;
    disablekb?: 0 | 1;
    enablejsapi?: 0 | 1;
    fs?: 0 | 1;
    hl?: string;
    cc_load_policy?: 0 | 1;
    cc_lang_pref?: string;
    color?: 'red' | 'white';
    iv_load_policy?: 1 | 3;
    loop?: 0 | 1;
    playlist?: string;
    rel?: 0 | 1;
    showinfo?: 0 | 1;
    modestbranding?: 0 | 1;
    start?: number;
    end?: number;
    [key: string]: string | number | undefined;
  };
  events?: {
    onReady?: (event: YouTubePlayerReadyEvent) => void;
    onStateChange?: (event: YouTubePlayerStateEvent) => void;
    onError?: (event: YouTubePlayerErrorEvent) => void;
    onPlaybackRateChange?: (event: { target: YouTubePlayerEventTarget; data: number }) => void;
    onPlaybackQualityChange?: (event: { target: YouTubePlayerEventTarget; data: string }) => void;
    [key: string]: ((event: unknown) => void) | undefined;
  };
}

/**
 * Ref type for YouTube player
 */
export type YouTubePlayerRef = React.RefObject<YouTubePlayer | null>;

/**
 * IndexedDB types
 * Standard DOM types for IndexedDB operations
 */

/**
 * Event for IndexedDB version change
 */
export interface IDBVersionChangeEvent extends Event {
  oldVersion: number;
  newVersion: number | null;
  target: IDBOpenDBRequest;
}

/**
 * Open request for IndexedDB
 */
export interface IDBOpenDBRequest extends IDBRequest<IDBDatabase> {
  onupgradeneeded: ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => unknown) | null;
  onblocked: ((this: IDBOpenDBRequest, ev: Event) => unknown) | null;
  result: IDBDatabase;
  transaction: IDBTransaction | null;
  error: DOMException | null;
}
