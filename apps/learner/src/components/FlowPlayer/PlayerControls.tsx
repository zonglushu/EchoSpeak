import React from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface PlayerControlsProps {
    isPlaying: boolean;
    onTogglePlay: () => void;
    onNext: () => void;
    onPrev: () => void;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({ isPlaying, onTogglePlay, onNext, onPrev }) => {
    return (
        <div className="w-full flex flex-col items-center space-y-6 pt-4 pb-8 bg-gradient-to-t from-teal-50 to-transparent">
            {/* Progress Bar Placeholder */}
            <div className="w-full h-1 bg-teal-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-400 w-1/3 rounded-full animate-pulse" />
            </div>

            <div className="flex items-center space-x-8">
                <button onClick={onPrev} className="text-teal-700 hover:text-teal-900 transition-colors">
                    <SkipBack size={28} />
                </button>

                <button
                    onClick={onTogglePlay}
                    className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center text-white shadow-xl hover:bg-teal-500 hover:scale-105 transition-all"
                >
                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </button>

                <button onClick={onNext} className="text-teal-700 hover:text-teal-900 transition-colors">
                    <SkipForward size={28} />
                </button>
            </div>
        </div>
    );
};

export default PlayerControls;
