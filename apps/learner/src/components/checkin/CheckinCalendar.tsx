/**
 * P0-1: Daily Check-in System - Check-in Calendar (周视图)
 * 使用柱状图展示最近一周的学习时长
 */

import React, { useEffect, useState } from 'react';
import { getCheckinCalendar } from '../../services/p0FeaturesClient';
import { UserCheckin } from '@echospeak/types';

interface CheckinCalendarProps {
  userId?: string;
  useDemoData?: boolean; // 是否使用假数据预览
}

interface DayData {
  date: string;
  count: number;
  duration: number;
  hasData: boolean;
}

export const CheckinCalendar: React.FC<CheckinCalendarProps> = ({ userId, useDemoData = false }) => {
  const [calendarData, setCalendarData] = useState<DayData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  useEffect(() => {
    loadCalendarData();
  }, [userId, useDemoData]);

  const loadCalendarData = async () => {
    setIsLoading(true);

    if (useDemoData) {
      // 使用假数据
      const demoData = generateDemoData();
      setCalendarData(demoData);
      setIsLoading(false);
      return;
    }

    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const checkins = await getCheckinCalendar(userId, 1); // 只获取1个月的数据
      const dataMap = new Map<string, DayData>();

      // Build date grid - 最近7天
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
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

      // Fill in check-in data
      checkins.forEach((checkin) => {
        const dateStr = checkin.checkin_date;
        const existing = dataMap.get(dateStr);
        if (existing) {
          existing.count = checkin.sentences_practiced || 1;
          existing.duration = checkin.practice_duration_seconds;
          existing.hasData = true;
        }
      });

      setCalendarData(Array.from(dataMap.values()));
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 生成假数据
  const generateDemoData = (): DayData[] => {
    const today = new Date();
    const data: DayData[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // 模拟不同时长的练习
      const demoPatterns = [
        { duration: 1800, hasData: true },   // 今天: 30分钟
        { duration: 2700, hasData: true },   // 昨天: 45分钟
        { duration: 0, hasData: false },     // 前天: 未练习
        { duration: 3600, hasData: true },   // 3天前: 60分钟
        { duration: 1500, hasData: true },   // 4天前: 25分钟
        { duration: 5400, hasData: true },   // 5天前: 90分钟
        { duration: 2100, hasData: true },   // 6天前: 35分钟
      ];

      const pattern = demoPatterns[i];
      data.push({
        date: dateStr,
        count: pattern.hasData ? Math.floor(pattern.duration / 60) : 0,
        duration: pattern.duration,
        hasData: pattern.hasData,
      });
    }

    return data;
  };

  const getBarHeight = (day: DayData): number => {
    if (!day.hasData) return 4; // 最小高度
    const mins = day.duration / 60;
    if (mins < 15) return 25;
    if (mins < 30) return 40;
    if (mins < 45) return 55;
    if (mins < 60) return 70;
    return 100; // >= 60分钟
  };

  const getBarColor = (day: DayData): string => {
    if (!day.hasData) return 'bg-gray-200 dark:bg-slate-700';
    const mins = day.duration / 60;
    if (mins < 15) return 'bg-green-300 dark:bg-green-700';
    if (mins < 30) return 'bg-green-400 dark:bg-green-600';
    if (mins < 45) return 'bg-green-500 dark:bg-green-500';
    if (mins < 60) return 'bg-green-600 dark:bg-green-400';
    return 'bg-green-700 dark:bg-green-300';
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}分钟`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}小时${remainingMins}分钟` : `${hours}小时`;
  };

  const getDayLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-white/10">
        <div className="h-48 bg-gray-100 dark:bg-slate-700/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  const totalActiveDays = calendarData.filter((d) => d.hasData).length;
  const totalDuration = calendarData.reduce((sum, d) => sum + d.duration, 0);
  const avgDuration = totalActiveDays > 0 ? totalDuration / totalActiveDays / 60 : 0;

  return (
    <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-white/10">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">练习日历</h3>
        <p className="text-sm text-gray-600 dark:text-slate-400">最近 7 天的学习记录</p>
      </div>

      {/* 柱状图 */}
      <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-6">
        <div className="flex items-end gap-3 h-40">
          {calendarData.map((day) => {
            const barHeight = getBarHeight(day);
            const barColor = getBarColor(day);

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                {/* 柱子 */}
                <div className="w-full relative">
                  <div
                    className={`w-full rounded-t-lg ${barColor} transition-all group-hover:opacity-80 shadow-sm`}
                    style={{ height: `${barHeight}%`, minHeight: '8px' }}
                  />
                </div>

                {/* 星期标签 */}
                <div className="text-xs font-medium text-gray-600 dark:text-slate-400">
                  {getDayLabel(day.date)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Y轴刻度线 */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between py-6 pointer-events-none opacity-50">
          <div className="text-[10px] text-gray-400">60+</div>
          <div className="text-[10px] text-gray-400">45</div>
          <div className="text-[10px] text-gray-400">30</div>
          <div className="text-[10px] text-gray-400">15</div>
          <div className="text-[10px] text-gray-400">0</div>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredDay && (
        <div className="fixed bottom-4 right-4 bg-gray-900 dark:bg-slate-700 text-white text-xs rounded-lg p-3 shadow-xl z-50">
          <div className="font-bold mb-1">
            {new Date(hoveredDay.date).toLocaleDateString('zh-CN', {
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </div>
          {hoveredDay.hasData ? (
            <div className="text-green-400">
              练习 {formatDuration(hoveredDay.duration)}
            </div>
          ) : (
            <div className="text-gray-400">未练习</div>
          )}
        </div>
      )}

      {/* Stats summary */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/10 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {totalActiveDays}/7
          </div>
          <div className="text-xs text-gray-600 dark:text-slate-400">活跃天数</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {Math.round((totalActiveDays / 7) * 100)}%
          </div>
          <div className="text-xs text-gray-600 dark:text-slate-400">坚持率</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {Math.round(avgDuration)}分钟
          </div>
          <div className="text-xs text-gray-600 dark:text-slate-400">平均时长</div>
        </div>
      </div>
    </div>
  );
};

export default CheckinCalendar;
