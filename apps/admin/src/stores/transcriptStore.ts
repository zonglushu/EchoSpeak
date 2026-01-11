'use client';

import { create } from 'zustand';
import type { AdminTranscriptLine } from '@echospeak/types';
import { mockTranscripts } from '@/data/mockTranscripts';

interface TranscriptStoreState {
  lines: AdminTranscriptLine[];
  selectedIds: string[];
  isDirty: boolean;
  loadMock: () => void;
  importFromFile: (payload: AdminTranscriptLine[]) => void;
  updateLine: (id: string, patch: Partial<AdminTranscriptLine>) => void;
  bulkUpdate: (ids: string[], patch: Partial<AdminTranscriptLine>) => void;
  setSelected: (ids: string[]) => void;
}

export const useTranscriptStore = create<TranscriptStoreState>((set) => ({
  lines: [],
  selectedIds: [],
  isDirty: false,
  loadMock: () => set({ lines: mockTranscripts, selectedIds: mockTranscripts.length ? [mockTranscripts[0].id] : [], isDirty: false }),
  importFromFile: (payload) =>
    set({
      lines: payload,
      selectedIds: payload.length ? [payload[0].id] : [],
      isDirty: true,
    }),
  updateLine: (id, patch) =>
    set((state) => ({
      lines: state.lines.map((line) => (line.id === id ? { ...line, ...patch } : line)),
      isDirty: true,
    })),
  bulkUpdate: (ids, patch) =>
    set((state) => ({
      lines: state.lines.map((line) => (ids.includes(line.id) ? { ...line, ...patch } : line)),
      isDirty: true,
    })),
  setSelected: (ids) => set({ selectedIds: ids }),
}));
