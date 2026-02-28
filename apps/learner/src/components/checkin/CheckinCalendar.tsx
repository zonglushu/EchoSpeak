/**
 * P0-1: Daily Check-in System - Check-in Calendar
 * GitHub-style contribution heatmap with Duolingo-inspired check-in calendar
 * Supports 3-month and full-year views with activity visualization
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { getCheckinCalendar } from '../../services/p0FeaturesClient';
import { Calendar, TrendingUp, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CheckinCalendarProps {
  userId?: string;
  useDemoData?: boolean;
}

interface DayData {
  date: string;
  count: number;
  duration: number;
  hasData: boolean;
}

export const CheckinCalendar: React.FC<CheckinCalendarProps> = ({
  userId,
  useDemoData = false
}) => {
  const { t, i18n } = useTranslation();
  const [calendarData, setCalendarData] = useState<DayData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number } | null>(null);
  const [viewMonths, setViewMonths] = useState<number>(3);

  const buildDateGrid = useCallback(function buildDateGridInternal(months: number): Map<string, DayData> {
    const dataMap = new Map<string, DayData>();
    const today = new Date();
    const daysToShow = months * 30;

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dataMap.set(dateStr, {
        date: dateStr,
        count: 0,
        duration: 0,
        hasData: false,
      });
    }

    return dataMap;
  }, []);

  const generateDemoDataInternal = useCallback(function generateDemoDataFn(months: number): DayData[] {
    const today = new Date();
    const data: DayData[] = [];
    const daysToShow = months * 30;

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const random = Math.random();

      let duration = 0;
      let hasData = false;

      if (isWeekend) {
        if (random > 0.3) {
          duration = Math.floor(Math.random() * 1800) + 600;
          hasData = true;
        }
      } else {
        if (random > 0.15) {
          duration = Math.floor(Math.random() * 2400) + 1200;
          hasData = true;
        }
      }

      data.push({
        date: dateStr,
        count: hasData ? Math.floor(duration / 60) : 0,
        duration,
        hasData,
      });
    }

    return data;
  }, []);

  const loadCalendarData = useCallback(function loadCalendarDataInternal() {
    setIsLoading(true);

    if (useDemoData) {
      const demoData = generateDemoDataInternal(viewMonths);
      setCalendarData(demoData);
      setIsLoading(false);
      return;
    }

    if (!userId) {
      setIsLoading(false);
      return;
    }

    getCheckinCalendar(userId, viewMonths)
      .then((checkins) => {
        const dataMap = buildDateGrid(viewMonths);

        checkins.forEach((checkin) => {
          const existing = dataMap.get(checkin.checkin_date);
          if (existing) {
            existing.count = checkin.sentences_practiced || 1;
            existing.duration = checkin.practice_duration_seconds;
            existing.hasData = true;
          }
        });

        setCalendarData(Array.from(dataMap.values()));
      })
      .catch((error) => {
        console.error('Failed to load calendar data:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [useDemoData, userId, viewMonths, buildDateGrid, generateDemoDataInternal]);

  useEffect(() => {
    loadCalendarData();
  }, [userId, useDemoData, viewMonths, loadCalendarData]);

  const getHeatmapColor = useCallback(function getHeatmapColorInternal(day: DayData): string {
    if (!day.hasData) {
      return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }

    const mins = day.duration / 60;

    if (mins < 10) {
      return 'bg-teal-200 dark:bg-teal-900 border-teal-300 dark:border-teal-800';
    }
    if (mins < 20) {
      return 'bg-teal-300 dark:bg-teal-800 border-teal-400 dark:border-teal-700';
    }
    if (mins < 40) {
      return 'bg-teal-400 dark:bg-teal-700 border-teal-500 dark:border-teal-600';
    }
    if (mins < 60) {
      return 'bg-teal-500 dark:bg-teal-600 border-teal-600 dark:border-teal-500';
    }
    return 'bg-teal-600 dark:bg-teal-500 border-teal-700 dark:border-teal-400';
  }, []);

  const groupByWeeks = useCallback(function groupByWeeksInternal(data: DayData[]): DayData[][] {
    const weeks: DayData[][] = [];
    let currentWeek: DayData[] = [];

    const firstDate = new Date(data[0]?.date);
    const firstDayOfWeek = firstDate.getDay();

    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({
        date: '',
        count: 0,
        duration: 0,
        hasData: false,
      });
    }

    data.forEach((day, index) => {
      currentWeek.push(day);

      const date = new Date(day.date);
      const dayOfWeek = date.getDay();

      if (dayOfWeek === 6 || index === data.length - 1) {
        while (currentWeek.length < 7) {
          currentWeek.push({
            date: '',
            count: 0,
            duration: 0,
            hasData: false,
          });
        }
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    return weeks;
  }, []);

  const formatDuration = useCallback(function formatDurationInternal(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}${t('common.mins')}`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0
      ? `${hours}${t('common.hours')}${remainingMins}${t('common.mins')}`
      : `${hours}${t('common.hours')}`;
  }, [t]);

  const formatDate = useCallback(function formatDateInternal(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  }, [i18n.language]);

  // Memoize expensive stats calculation
  const stats = useMemo(() => {
    const totalDays = calendarData.filter(d => d.date).length;
    const activeDays = calendarData.filter(d => d.hasData).length;
    const totalDuration = calendarData.reduce((sum, d) => sum + d.duration, 0);
    const consistency = totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0;

    let currentStreak = 0;
    for (let i = calendarData.length - 1; i >= 0; i--) {
      if (calendarData[i].hasData) {
        currentStreak++;
      } else {
        break;
      }
    }

    let maxStreak = 0;
    let streak = 0;
    calendarData.forEach(d => {
      if (d.hasData) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 0;
      }
    });

    return {
      totalDays,
      activeDays,
      totalDuration,
      consistency,
      currentStreak,
      maxStreak,
    };
  }, [calendarData]);

  // Memoize week grouping (expensive array transformation)
  const weeks = useMemo(() => {
    return groupByWeeks(calendarData);
  }, [calendarData, groupByWeeks]);

  const weekdays = useMemo(() => {
    return i18n.language.startsWith('zh')
      ? ['日', '一', '二', '三', '四', '五', '六']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }, [i18n.language]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-white/10">
        <div className="h-64 bg-gray-100 dark:bg-slate-700/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            {t('calendar.title')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            {t('calendar.recentMonths', { count: viewMonths })}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMonths(3)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMonths === 3
                ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            {t('calendar.3months')}
          </button>
          <button
            onClick={() => setViewMonths(12)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMonths === 12
                ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            {t('calendar.fullYear')}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {/* Current streak */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 border border-orange-200 dark:border-orange-700">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <p className="text-xs font-semibold text-orange-700 dark:text-orange-300">
              {t('calendar.currentStreak')}
            </p>
          </div>
          <p className="text-3xl font-black text-orange-900 dark:text-orange-100">
            {stats.currentStreak}
          </p>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">{t('common.days')}</p>
        </div>

        {/* Max streak */}
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-teal-200 dark:border-teal-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">
              {t('calendar.maxStreak')}
            </p>
          </div>
          <p className="text-3xl font-black text-teal-900 dark:text-teal-100">
            {stats.maxStreak}
          </p>
          <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">{t('common.days')}</p>
        </div>

        {/* Consistency */}
        <div className="bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-cyan-200 dark:border-cyan-700">
          <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 mb-2">
            {t('calendar.consistency')}
          </p>
          <p className="text-3xl font-black text-cyan-900 dark:text-cyan-100">
            {stats.consistency}%
          </p>
          <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">
            {stats.activeDays}/{stats.totalDays}{t('common.days')}
          </p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 overflow-x-auto">
        <div className="min-w-max">
          {/* Month labels */}
          <div className="flex gap-[3px] mb-2 ml-6">
            {weeks.map((week, weekIndex) => {
              const firstDay = week.find(d => d.date);
              if (!firstDay || !firstDay.date) return <div key={weekIndex} className="w-3" />;

              const date = new Date(firstDay.date);
              const isFirstWeekOfMonth = date.getDate() <= 7;

              return (
                <div key={weekIndex} className="w-3">
                  {isFirstWeekOfMonth && (
                    <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                      {date.getMonth() + 1}{t('common.month')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Calendar grid */}
          <div className="flex gap-[3px]">
            {/* Weekday labels */}
            <div className="flex flex-col gap-[3px] mr-2">
              {weekdays.map((day, index) => (
                <div key={index} className="h-3 flex items-center">
                  <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 w-4">
                    {day}
                  </span>
                </div>
              ))}
            </div>

            {/* Day cells */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {week.map((day, dayIndex) => {
                  if (!day.date) {
                    return <div key={dayIndex} className="h-3 w-3" />;
                  }

                  return (
                    <div
                      key={dayIndex}
                      className={`
                        h-3 w-3 rounded-sm border cursor-pointer
                        transition-all duration-150
                        hover:scale-125 hover:z-10 hover:shadow-lg
                        ${getHeatmapColor(day)}
                      `}
                      onMouseEnter={(e) => {
                        setHoveredDay(day);
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredPosition({ x: rect.left, y: rect.top });
                      }}
                      onMouseLeave={() => {
                        setHoveredDay(null);
                        setHoveredPosition(null);
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Color legend */}
          <div className="flex items-center gap-2 mt-4 justify-end">
            <span className="text-xs text-gray-600 dark:text-gray-400">{t('calendar.less')}</span>
            <div className="h-3 w-3 rounded-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
            <div className="h-3 w-3 rounded-sm bg-teal-200 dark:bg-teal-900 border border-teal-300 dark:border-teal-800" />
            <div className="h-3 w-3 rounded-sm bg-teal-400 dark:bg-teal-700 border border-teal-500 dark:border-teal-600" />
            <div className="h-3 w-3 rounded-sm bg-teal-600 dark:bg-teal-500 border border-teal-700 dark:border-teal-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">{t('calendar.more')}</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && hoveredPosition && (
        <div
          className="fixed z-50 bg-gray-900 dark:bg-slate-700 text-white text-xs rounded-lg p-3 shadow-2xl pointer-events-none"
          style={{
            left: `${hoveredPosition.x}px`,
            top: `${hoveredPosition.y - 80}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-bold mb-1">{formatDate(hoveredDay.date)}</div>
          {hoveredDay.hasData ? (
            <>
              <div className="text-teal-400 font-semibold">
                {t('calendar.practiced')} {formatDuration(hoveredDay.duration)}
              </div>
              <div className="text-gray-400 text-[10px] mt-1">
                {t('calendar.completed')} {hoveredDay.count} {t('calendar.exercises')}
              </div>
            </>
          ) : (
            <div className="text-gray-400">{t('calendar.noPractice')}</div>
          )}
        </div>
      )}

      {/* Footer summary */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
        <p className="text-sm text-gray-600 dark:text-slate-400 text-center">
          {t('calendar.totalStudy')} <span className="font-bold text-teal-600 dark:text-teal-400">{formatDuration(stats.totalDuration)}</span>，
          {t('calendar.checkedIn')} <span className="font-bold text-teal-600 dark:text-teal-400">{stats.activeDays}</span> {t('common.days')}
          {stats.currentStreak >= 3 && (
            <span className="ml-2">
              {t('calendar.streakMessage', { days: stats.currentStreak })}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default CheckinCalendar;
