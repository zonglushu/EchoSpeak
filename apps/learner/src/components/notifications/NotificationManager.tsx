/**
 * P0-5: Notification & Reminder System
 * Manages Web Push API notifications for daily practice reminders
 */

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, Check } from 'lucide-react';
import {
  requestNotificationPermission,
  showNotification,
  scheduleDailyReminder,
} from '../../services/p0FeaturesClient';

interface NotificationManagerProps {
  userId?: string;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ userId }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [reminderTime, setReminderTime] = useState<string>('20:00');
  const [isReminderActive, setIsReminderActive] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setPermission('granted');
      // Show test notification
      showNotification('🔔 Notifications Enabled!', {
        body: 'You\'ll receive daily practice reminders to keep your streak alive!',
        tag: 'test-notification',
      });
    } else {
      setPermission('denied');
    }
  };

  const handleToggleReminder = () => {
    if (isReminderActive) {
      setIsReminderActive(false);
      showNotification('⏰ Reminders Disabled', {
        body: 'You won\'t receive daily practice reminders anymore.',
        tag: 'reminder-disabled',
      });
    } else {
      const [hour, minute] = reminderTime.split(':').map(Number);
      scheduleDailyReminder(hour, minute);
      setIsReminderActive(true);

      // Show confirmation
      showNotification('⏰ Daily Reminder Set!', {
        body: `You'll be reminded at ${reminderTime} every day.`,
        tag: 'reminder-enabled',
      });
    }
  };

  const canRequestPermission = permission === 'default';
  const isGranted = permission === 'granted';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-800 shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {isGranted ? (
              <Bell className="w-6 h-6 text-green-600 dark:text-green-500" />
            ) : (
              <BellOff className="w-6 h-6 text-gray-500" />
            )}
            练习提醒
          </h3>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {showSettings ? '收起' : '设置'}
          </button>
        </div>
        <p className="text-base text-gray-600 dark:text-gray-400">
          每日提醒助你保持练习习惯
        </p>
      </div>

      {/* Permission Request */}
      {!isGranted && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <BellOff className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                {canRequestPermission
                  ? '开启通知以接收每日练习提醒'
                  : '浏览器已阻止通知'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {canRequestPermission
                  ? '我们会在每天的固定时间友好地提醒你练习，你可以在下方自定义提醒时间。'
                  : '要启用通知，请前往浏览器设置并允许此网站的通知权限。'}
              </div>
              {canRequestPermission && (
                <button
                  onClick={handleRequestPermission}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg transition-all active:scale-95 text-sm"
                >
                  开启通知
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && isGranted && (
        <div className="mb-6 space-y-4">
          {/* Reminder Time */}
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
              每日提醒时间
            </label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Toggle Reminder */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-teal-600 dark:text-blue-500" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">每日提醒</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {isReminderActive
                    ? `已启用，${reminderTime} 提醒`
                    : '未启用'}
                </div>
              </div>
            </div>
            <button
              onClick={handleToggleReminder}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                isReminderActive
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {isReminderActive ? (
                <>
                  <Check className="w-4 h-4 inline mr-1" />
                  已启用
                </>
              ) : (
                '启用'
              )}
            </button>
          </div>

          {/* Test Notification */}
          <button
            onClick={() =>
              showNotification('🔔 测试通知', {
                body: '这是一条来自 EchoSpeak 的测试通知！',
                tag: 'test',
              })
            }
            className="w-full py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            发送测试通知
          </button>
        </div>
      )}

      {/* Benefits */}
      <div className="space-y-2">
        <div className="text-sm font-bold text-gray-900 dark:text-white">提醒的好处：</div>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <div className="text-green-600 dark:text-green-500 mt-0.5 font-bold">✓</div>
            <span>保持连续打卡，避免错过练习日</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="text-green-600 dark:text-green-500 mt-0.5 font-bold">✓</div>
            <span>养成持续学习的好习惯</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="text-green-600 dark:text-green-500 mt-0.5 font-bold">✓</div>
            <span>更快实现你的学习目标</span>
          </li>
        </ul>
      </div>

      {/* Info */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
          <Bell className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            通知由你的浏览器发送。你可以随时在浏览器设置或此面板中关闭通知。
          </span>
        </div>
      </div>
    </div>
  );
};

export default NotificationManager;
