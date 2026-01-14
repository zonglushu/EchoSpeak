/**
 * Custom Hook for P0 Features Integration
 * Handles practice recording, view tracking, and achievement checking
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../components/AuthProvider';
import {
  recordPracticeHistory,
  recordView,
  checkAndAwardAchievements,
  recordCheckin,
} from '../services/p0FeaturesClient';

interface UsePracticeTrackingOptions {
  videoId: string;
  videoTitle: string;
  videoThumbnail?: string;
  assetId?: string;
}

interface PracticeSession {
  startTime: number;
  sentencesCompleted: number;
  sentencesTotal: number;
}

export function usePracticeTracking(options: UsePracticeTrackingOptions) {
  const { user } = useAuth();
  const sessionRef = useRef<PracticeSession | null>(null);
  const viewRecordedRef = useRef(false);

  // Start tracking a practice session
  const startPractice = useCallback((totalSentences: number = 0) => {
    sessionRef.current = {
      startTime: Date.now(),
      sentencesCompleted: 0,
      sentencesTotal: totalSentences,
    };
  }, []);

  // Update sentences completed
  const updateProgress = useCallback((sentencesCompleted: number) => {
    if (sessionRef.current) {
      sessionRef.current.sentencesCompleted = sentencesCompleted;
    }
  }, []);

  // End practice session and record to database
  const endPractice = useCallback(async () => {
    if (!user?.id || !sessionRef.current) return;

    const session = sessionRef.current;
    const durationSeconds = Math.floor((Date.now() - session.startTime) / 1000);

    // Only record if user practiced for at least 10 seconds
    if (durationSeconds < 10) {
      sessionRef.current = null;
      return;
    }

    try {
      // Record practice history
      await recordPracticeHistory(user.id, {
        asset_id: options.assetId,
        video_id: options.videoId,
        video_title: options.videoTitle,
        video_thumbnail: options.videoThumbnail,
        duration_seconds: durationSeconds,
        sentences_completed: session.sentencesCompleted,
        sentences_total: session.sentencesTotal,
      });

      // Record daily check-in
      await recordCheckin(user.id, durationSeconds, session.sentencesCompleted);

      // Check for new achievements
      const newAchievements = await checkAndAwardAchievements(user.id);

      if (newAchievements.length > 0) {
        // TODO: Show toast notification for new achievements
      }
    } catch (error) {
      console.error('Failed to record practice session:', error);
    } finally {
      sessionRef.current = null;
    }
  }, [user, options]);

  // Record view when component mounts (for trending)
  useEffect(() => {
    if (!user?.id || viewRecordedRef.current) return;

    const recordVideoView = async () => {
      try {
        await recordView(user.id, {
          asset_id: options.assetId,
          video_id: options.videoId,
        });
        viewRecordedRef.current = true;
      } catch (error) {
        console.error('Failed to record view:', error);
      }
    };

    recordVideoView();
  }, [user, options]);

  // Auto-save practice when user leaves the page
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        // Use a synchronous beacon API for more reliable cleanup
        if (user?.id && sessionRef.current.startTime) {
          const durationSeconds = Math.floor((Date.now() - sessionRef.current.startTime) / 1000);
          
          if (durationSeconds >= 10) {
            // Send a beacon request (doesn't wait for response)
            const data = {
              user_id: user.id,
              video_id: options.videoId,
              video_title: options.videoTitle,
              duration_seconds: durationSeconds,
              sentences_completed: sessionRef.current.sentencesCompleted,
              sentences_total: sessionRef.current.sentencesTotal,
            };
            // TODO: Implement beacon request for practice tracking
            void data;
          }
        }
      }
    };
  }, [user, options]);

  return {
    startPractice,
    updateProgress,
    endPractice,
    isTracking: sessionRef.current !== null,
  };
}
