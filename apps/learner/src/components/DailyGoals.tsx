import React from 'react';
import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface DailyGoal {
    id: string;
    title: string;
    completed: boolean;
}

interface DailyGoalsProps {
    goals: DailyGoal[];
    onGoalToggle?: (goalId: string) => void;
}

export const DailyGoals: React.FC<DailyGoalsProps> = ({ goals, onGoalToggle }) => {
    const { t } = useTranslation();
    const completedCount = goals.filter(g => g.completed).length;
    const progress = (completedCount / goals.length) * 100;

    // SVG Circular Progress config
    const size = 100;
    const strokeWidth = 10;
    const center = size / 2;
    const radius = size / 2 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-[2.5rem] p-8 border border-white dark:border-gray-800 shadow-xl shadow-blue-500/5 transition-all">
            <div className="flex items-center justify-between gap-8 mb-8">
                <div className="flex-1">
                    <h3 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight mb-2">{t('home.todaysGoal')}</h3>
                    <p className="text-sm font-medium text-gray-400 leading-relaxed mb-4">{t('home.makingProgress')}</p>

                    <div className="flex items-center gap-4">
                        <div className="inline-flex items-center px-4 py-1.5 bg-[#E1F1FF] dark:bg-blue-900/30 rounded-full text-[11px] font-black text-[#0085FF] dark:text-blue-400 tracking-wider">
                            {completedCount}/{goals.length} {t('common.tasks')}
                        </div>
                        <span className="text-[11px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-widest">~15 {t('common.minsLeft')}</span>
                    </div>
                </div>

                {/* Circular Progress */}
                <div className="relative flex-shrink-0">
                    <svg width={size} height={size} className="transform -rotate-90">
                        {/* Background Circle */}
                        <circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth={strokeWidth}
                            className="text-[#F5F9FF] dark:text-gray-800"
                        />
                        {/* Progress Circle */}
                        <motion.circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="transparent"
                            stroke="#00A3FF"
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-black text-gray-950 dark:text-white leading-none">
                            {Math.round(progress)}<span className="text-sm">%</span>
                        </span>
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-blue-400/10 rounded-full blur-xl animate-pulse -z-10" />
                </div>
            </div>

            {/* Task List - Design Aligned */}
            {/* Task List - Carousel */}
            <div className="relative group/list">
                <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-1 px-1 pb-4"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}>
                    {Array.from({ length: Math.ceil(goals.length / 2) }).map((_, pageIndex) => (
                        <div key={pageIndex} className="min-w-full snap-center space-y-3 px-1">
                            {goals.slice(pageIndex * 2, (pageIndex + 1) * 2).map((goal) => (
                                <button
                                    key={goal.id}
                                    onClick={() => onGoalToggle?.(goal.id)}
                                    className="group/item w-full flex items-center gap-4 p-5 bg-[#F8FAFC]/50 dark:bg-gray-800/30 rounded-3xl border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30 transition-all active:scale-[0.98]"
                                >
                                    <div
                                        className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${goal.completed
                                            ? 'bg-[#0085FF] border-[#0085FF] shadow-lg shadow-blue-500/20'
                                            : 'border-gray-200 dark:border-gray-700'
                                            }`}
                                    >
                                        {goal.completed && <CheckCircle className="w-5 h-5 text-white" />}
                                    </div>
                                    <span
                                        className={`flex-1 text-left text-sm font-bold tracking-tight ${goal.completed
                                            ? 'text-gray-400 dark:text-gray-500 line-through'
                                            : 'text-gray-700 dark:text-gray-200'
                                            }`}
                                    >
                                        {goal.title}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Pagination Dots */}
                {goals.length > 2 && (
                    <div className="flex justify-center gap-1.5 mt-[-10px]">
                        {Array.from({ length: Math.ceil(goals.length / 2) }).map((_, i) => (
                            <div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700"
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DailyGoals;
