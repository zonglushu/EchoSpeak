import React from 'react';
import { Flame, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../AuthProvider';
import { UserStats } from '@echospeak/types';
import { getGreeting } from '../../utils/homeHelpers';

interface WelcomeHeaderProps {
  userStats: UserStats | null;
}

export function WelcomeHeader({ userStats }: WelcomeHeaderProps): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userTier = user?.user_metadata?.tier || 'free';

  const userInitial = (user?.email?.split('@')[0] || 'L')[0].toUpperCase();

  return (
    <div className="bg-white/50 dark:bg-gray-950/50 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
      <div className="flex flex-col">
        <h1 className="text-xl font-black text-gray-950 dark:text-white tracking-tight leading-none mb-1">
          EchoSpeak
        </h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {getGreeting(t)}, {userTier === 'free' ? t('tier.free') : t(`tier.${userTier}`)}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Streak counter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 rounded-full">
          <Flame className="w-4 h-4 text-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.3)]" />
          <span className="text-sm font-black text-orange-700 dark:text-orange-400">
            {userStats?.current_streak || 0}
          </span>
        </div>

        {/* Notifications button */}
        <button className="p-2.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-full shadow-sm text-gray-500 hover:text-teal-600 transition-colors">
          <Video className="w-5 h-5" />
        </button>

        {/* User avatar */}
        <button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg hover:ring-4 ring-indigo-500/10 transition-all"
        >
          {userInitial}
        </button>
      </div>
    </div>
  );
}
