import React from 'react';
import { CheckCircle, Target } from 'lucide-react';

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
    const completedCount = goals.filter(g => g.completed).length;
    const progress = (completedCount / goals.length) * 100;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-lg">
            {/* 标题和进度 */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-gray-900 dark:text-white">今日目标</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            已完成 {completedCount}/{goals.length} 个任务
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-teal-600 dark:text-blue-500">{Math.round(progress)}%</p>
                </div>
            </div>

            {/* 进度条 */}
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 mb-4 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-teal-600 to-cyan-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* 任务列表 */}
            <div className="space-y-2">
                {goals.map((goal) => (
                    <button
                        key={goal.id}
                        onClick={() => onGoalToggle?.(goal.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${goal.completed
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750'
                            }`}
                    >
                        <div
                            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${goal.completed
                                    ? 'bg-green-600 border-green-600'
                                    : 'border-gray-300 dark:border-gray-600'
                                }`}
                        >
                            {goal.completed && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        <span
                            className={`flex-1 text-left text-sm font-medium ${goal.completed
                                    ? 'text-green-700 dark:text-green-400 line-through'
                                    : 'text-gray-900 dark:text-white'
                                }`}
                        >
                            {goal.title}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DailyGoals;
