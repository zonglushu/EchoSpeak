import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { flowService, FlowItem } from '../services/flowService';
import LyricStream from '../components/FlowPlayer/LyricStream';
import PlayerControls from '../components/FlowPlayer/PlayerControls';
import { TranscriptLine } from '@echospeak/types';
import { Loader2, Music } from 'lucide-react';
import type {
  YouTubePlayer,
  YouTubePlayerStateEvent,
} from '../types/youtube';

const FlowPage: React.FC = () => {
    const [playlist, setPlaylist] = useState<FlowItem[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeLineId, setActiveLineId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    // Player Refs
    const playerRef = useRef<YouTubePlayer | null>(null);
    const syncIntervalRef = useRef<number | null>(null);

    // Initial Load
    useEffect(() => {
        const loadContent = async () => {
            setIsLoading(true);
            const items = await flowService.getPlaylist();
            if (items.length > 0) {
                setPlaylist(items);
            } else {
                setPlaylist(flowService.getMockPlaylist());
            }
            setIsLoading(false);
        };
        loadContent();
    }, []);

    const currentTrack = playlist[currentTrackIndex];

    // Playback Control
    const togglePlay = () => {
        if (!playerRef.current) return;
        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    };

    const handleNext = () => {
        if (currentTrackIndex < playlist.length - 1) {
            setCurrentTrackIndex(prev => prev + 1);
        } else {
            setCurrentTrackIndex(0);
        }
    };

    const handlePrev = () => {
        if (currentTrackIndex > 0) {
            setCurrentTrackIndex(prev => prev - 1);
        }
    };

    // Sync Logic
    useEffect(() => {
        const runSync = () => {
            if (playerRef.current && currentTrack) {
                const time = playerRef.current.getCurrentTime();
                const line = currentTrack.transcript.find(l => time >= l.startTime && time <= l.endTime);
                if (line && line.id !== activeLineId) {
                    setActiveLineId(line.id);
                }
            }
        };

        if (isPlaying) {
            syncIntervalRef.current = window.setInterval(runSync, 200);
        } else {
            if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
        }
        return () => {
            if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
        };
    }, [isPlaying, currentTrack, activeLineId]);

    // YouTube Event Handlers
    const onPlayerStateChange = (event: YouTubePlayerStateEvent) => {
        setIsPlaying(event.data === 1); // 1 = Playing
        if (event.data === 0) { // 0 = Ended
            handleNext();
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-teal-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-teal-600" size={32} />
            </div>
        );
    }

    if (!currentTrack) {
        return <div className="min-h-screen bg-teal-50 flex items-center justify-center text-teal-800">No Content Available</div>;
    }

    return (
        <div className="relative min-h-screen bg-slate-50 flex flex-col overflow-hidden">

            {/* 1. Header & Album Art Placeholder */}
            {/* We're shrinking the top area slightly, but adding a nice card to fill the space visually */}
            <div className="pt-6 px-6 pb-2 z-10 bg-gradient-to-b from-slate-50 to-transparent">

                {/* Visual Placeholder (Fake Album Art) */}
                <div className="w-full aspect-[4/3] bg-gradient-to-br from-teal-400 to-emerald-600 rounded-[2rem] shadow-2xl shadow-teal-200 mb-6 flex items-center justify-center relative overflow-hidden group">
                    {/* Decorative Circles */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-900/10 rounded-full blur-xl transform -translate-x-10 translate-y-10"></div>

                    <div className="text-white text-center p-6 relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30">
                            <Music size={32} fill="currentColor" className="text-white" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight leading-tight mb-2 opacity-95">
                            {currentTrack.name.split(':')[0]}
                        </h2>
                        <p className="text-teal-50 font-medium text-sm tracking-wide opacity-80 uppercase">
                            Daily Conversation
                        </p>
                    </div>
                </div>

                {/* Track Info (Minimal) */}
                <div className="text-center">
                    <h1 className="text-slate-900 font-bold text-lg line-clamp-1">{currentTrack.name}</h1>
                    <p className="text-slate-400 text-xs font-bold tracking-[0.2em] uppercase mt-1">
                        Episode {currentTrackIndex + 1} of {playlist.length}
                    </p>
                </div>
            </div>

            {/* 2. Lyric Stream */}
            <div className="flex-1 relative overflow-hidden flex flex-col -mt-4 z-0">
                <LyricStream
                    lines={currentTrack.transcript}
                    activeLineId={activeLineId}
                    sourceId={currentTrack.id}
                    sourceTitle={currentTrack.name}
                />
            </div>

            {/* 3. Controls (Docked) */}
            <div className="z-20 pb-28 pt-4 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent">
                <PlayerControls
                    isPlaying={isPlaying}
                    onTogglePlay={togglePlay}
                    onNext={handleNext}
                    onPrev={handlePrev}
                />
            </div>

            {/* Hidden Player */}
            <div className="hidden">
                <YouTube
                    videoId={currentTrack.id}
                    opts={{ height: '0', width: '0', playerVars: { autoplay: 1, controls: 0 } }}
                    onReady={(e) => { playerRef.current = e.target.player ?? null; }}
                    onStateChange={onPlayerStateChange}
                />
            </div>
        </div>
    );
};

export default FlowPage;
