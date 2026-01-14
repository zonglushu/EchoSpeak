import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { TranscriptLine } from '@echospeak/types';
import { Heart, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChunks } from '../../contexts/ChunkContext';

interface LyricStreamProps {
    lines: TranscriptLine[];
    activeLineId: string;
    onSaveChunk?: (line: TranscriptLine) => void; // Deprecated, kept for compatibility
    sourceId?: string; // Video/Asset ID
    sourceTitle?: string; // Video title
}

const LyricStream: React.FC<LyricStreamProps> = ({
    lines,
    activeLineId,
    onSaveChunk,
    sourceId,
    sourceTitle
}) => {
    const activeRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { saveChunk } = useChunks();

    // Track saved line IDs
    const [savedLineIds, setSavedLineIds] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState<string | null>(null);

    // Auto-scroll to active line
    useEffect(() => {
        if (activeRef.current && containerRef.current) {
            activeRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [activeLineId]);

    // Handle chunk save
    const handleSaveChunk = useCallback(async function saveChunkFromLine(line: TranscriptLine) {
        if (isSaving) return; // Prevent double-click

        setIsSaving(line.id);

        try {
            // Create chunk with context
            const currentIndex = lines.findIndex(l => l.id === line.id);
            const previousLine = currentIndex > 0 ? lines[currentIndex - 1] : null;
            const nextLine = currentIndex < lines.length - 1 ? lines[currentIndex + 1] : null;

            await saveChunk({
                text: line.text,
                translation: line.translation || '',
                startTime: line.startTime,
                duration: line.endTime - line.startTime,
                sourceId: sourceId || 'unknown',
                sourceTitle: sourceTitle,
                contextBefore: previousLine?.text || '',
                contextAfter: nextLine?.text || '',
            });

            // Mark as saved
            setSavedLineIds(prev => new Set(prev).add(line.id));

            // Show toast
            showToast('Added to collection ✓', 'success');

            // Call legacy callback if provided
            if (onSaveChunk) {
                onSaveChunk(line);
            }
        } catch (error) {
            console.error('Failed to save chunk:', error);
            showToast('Failed to save', 'error');
        } finally {
            setIsSaving(null);
        }
    }, [isSaving, lines, sourceId, sourceTitle, saveChunk, onSaveChunk]);

    // Simple toast notification
    const showToast = useCallback(function showToastNotification(message: string, type: 'success' | 'error') {
        const toast = document.createElement('div');
        toast.className = `fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border px-6 py-4 rounded-2xl shadow-2xl z-50 animate-bounce flex items-center space-x-3 ${
            type === 'success'
                ? 'bg-slate-900 border-slate-800 text-white'
                : 'bg-red-50 border-red-200 text-red-800'
        }`;
        toast.innerHTML = `
            <span class="${type === 'success' ? 'text-rose-500' : 'text-red-600'} text-xl">
                ${type === 'success' ? '❤️' : '❌'}
            </span>
            <span class="font-bold">${message}</span>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 1500);
    }, []);

    return (
        <div
            ref={containerRef}
            className="flex-1 w-full overflow-y-auto px-6 py-8 space-y-8 scrollbar-hide"
            style={{
                // Enhanced gradient mask for a smoother "fade out" at edges
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
            }}
        >
            <div className="h-[30vh]" /> {/* Top spacer to allow first item to be centered */}

            {lines.map((line) => {
                const isActive = line.id === activeLineId;
                const isSaved = savedLineIds.has(line.id);
                const currentlySaving = isSaving === line.id;

                return (
                    <motion.div
                        key={line.id}
                        ref={isActive ? activeRef : null}
                        initial={false}
                        animate={{
                            scale: isActive ? 1.05 : 0.95,
                            opacity: isActive ? 1 : 0.3,
                            filter: isActive ? 'blur(0px)' : 'blur(0.5px)'
                        }}
                        transition={{ duration: 0.4 }}
                        className={`
                            transition-all duration-500 ease-out flex flex-col space-y-3 cursor-pointer
                            ${isActive ? 'py-4' : 'py-1'}
                        `}
                        onClick={() => {
                            // Optional: Click to seek (would need callback)
                        }}
                    >
                        {/* English Text */}
                        <h4 className={`
                            text-2xl font-bold leading-tight font-serif tracking-wide
                            ${isActive ? 'text-teal-950' : 'text-slate-400'}
                        `}>
                            {line.text}
                        </h4>

                        {/* Active Metadata (Translation + Actions) */}
                        <AnimatePresence>
                            {isActive && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, y: -10 }}
                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center justify-between pt-2 border-t border-teal-100/50"
                                >
                                    <p className="text-teal-700 font-medium text-lg tracking-wide">
                                        {line.translation || "无中文翻译"}
                                    </p>
                                    <motion.button
                                        whileTap={{ scale: 0.8 }}
                                        whileHover={{ scale: 1.1 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSaveChunk(line);
                                        }}
                                        disabled={currentlySaving || isSaved}
                                        className={`p-2.5 rounded-full transition-colors shadow-sm ${
                                            isSaved
                                                ? 'bg-rose-100 text-rose-500'
                                                : 'bg-teal-50 hover:bg-teal-100 text-teal-400 hover:text-rose-500'
                                        } ${currentlySaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isSaved ? (
                                            <Check size={20} fill="currentColor" />
                                        ) : currentlySaving ? (
                                            <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Heart size={20} fill={isSaved ? 'currentColor' : 'none'} />
                                        )}
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}

            <div className="h-[40vh]" /> {/* Bottom spacer */}
        </div>
    );
};

export default LyricStream;
