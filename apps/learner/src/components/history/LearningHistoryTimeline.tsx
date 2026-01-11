/**
 * P0-2: Learning History Timeline
 * Displays practice sessions grouped by date with progress visualization
 */

import React, { useEffect, useState } from 'react';
import { Clock, TrendingUp, PlayCircle } from 'lucide-react';
import { getPracticeHistory, formatDuration } from '../../services/p0FeaturesClient';
import { PracticeHistory } from '@echospeak/types';

interface LearningHistoryTimelineProps {
  userId?: string;
  days?: number;
}

interface GroupedHistory {
  date: string;
  sessions: PracticeHistory[];
  totalDuration: number;
  totalSentences: number;
}

export const LearningHistoryTimeline: React.FC<LearningHistoryTimelineProps> = ({
  userId,
  days = 30
}) => {
  const [groupedHistory, setGroupedHistory] = useState<GroupedHistory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    loadHistory();
  }, [userId, days]);

  const loadHistory = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const history = await getPracticeHistory(userId, days);
      const grouped = groupHistoryByDate(history);
      setGroupedHistory(grouped);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const groupHistoryByDate = (history: PracticeHistory[]): GroupedHistory[] => {
    const grouped = new Map<string, GroupedHistory>();

    history.forEach((session) => {
      const date = session.practice_date;
      if (!grouped.has(date)) {
        grouped.set(date, {
          date,
          sessions: [],
          totalDuration: 0,
          totalSentences: 0,
        });
      }

      const group = grouped.get(date)!;
      group.sessions.push(session);
      group.totalDuration += session.duration_seconds;
      group.totalSentences += session.sentences_completed;
    });

    return Array.from(grouped.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Today';
    }
    if (dateStr === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-slate-600';
  };

  const getWeekRange = (): string => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - days);

    return `${weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="h-64 bg-slate-700/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Calculate totals
  const totalDuration = groupedHistory.reduce((sum, g) => sum + g.totalDuration, 0);
  const totalSessions = groupedHistory.reduce((sum, g) => sum + g.sessions.length, 0);
  const totalSentences = groupedHistory.reduce((sum, g) => sum + g.totalSentences, 0);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-white">Learning History</h3>
          <div className="text-sm text-slate-400">{getWeekRange()}</div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <PlayCircle className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">{totalSessions}</div>
              <div className="text-xs text-slate-400">Sessions</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Clock className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">{formatDuration(totalDuration)}</div>
              <div className="text-xs text-slate-400">Total Time</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">{totalSentences}</div>
              <div className="text-xs text-slate-400">Sentences</div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
        {groupedHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-500 mb-2">No practice history yet</div>
            <div className="text-sm text-slate-600">
              Start practicing to see your learning journey!
            </div>
          </div>
        ) : (
          groupedHistory.map((group) => (
            <div
              key={group.date}
              className="border-l-2 border-slate-700 pl-4 hover:border-blue-500 transition-colors"
            >
              {/* Date Header */}
              <button
                onClick={() => setSelectedDate(selectedDate === group.date ? null : group.date)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-bold text-white">{formatDate(group.date)}</div>
                    <div className="text-xs text-slate-400">
                      {group.sessions.length} {group.sessions.length === 1 ? 'session' : 'sessions'} • {formatDuration(group.totalDuration)} • {group.totalSentences} sentences
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {selectedDate === group.date ? '▲' : '▼'}
                  </div>
                </div>
              </button>

              {/* Expanded Sessions */}
              {selectedDate === group.date && (
                <div className="space-y-2 mt-3">
                  {group.sessions.map((session, index) => (
                    <div
                      key={session.id}
                      className="bg-slate-900/50 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white mb-1">
                            {session.video_title}
                          </div>
                          <div className="text-xs text-slate-400">
                            {formatDuration(session.duration_seconds)} • {session.sentences_completed}/{session.sentences_total} sentences
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(session.completed_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${getProgressColor(session.progress_percentage)} transition-all`}
                          style={{ width: `${session.progress_percentage}%` }}
                        />
                      </div>

                      <div className="text-right text-xs text-slate-500 mt-1">
                        {Math.round(session.progress_percentage)}% complete
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {groupedHistory.length >= days && (
        <button
          onClick={() => loadHistory()}
          className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          Load more history...
        </button>
      )}
    </div>
  );
};

export default LearningHistoryTimeline;
