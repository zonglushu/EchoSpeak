import { nanoid } from 'nanoid';
import type { AdminTranscriptLine } from '@echospeak/types';

const TIMECODE_REGEX = /(\d{2}):(\d{2}):(\d{2})(?:[,.](\d{3}))?/;

const parseTimecode = (value: string): number => {
  const match = value.match(TIMECODE_REGEX);
  if (!match) return 0;
  const [, hh, mm, ss, ms = '0'] = match;
  return parseInt(hh, 10) * 3600_000 + parseInt(mm, 10) * 60_000 + parseInt(ss, 10) * 1_000 + parseInt(ms, 10);
};

const sanitizeText = (chunk: string) =>
  chunk
    .replace(/<[^>]+>/g, '')
    .replace(/\{[^}]+}/g, '')
    .replace(/\r/g, '')
    .trim();

export const parseTimedText = (raw: string): AdminTranscriptLine[] => {
  if (!raw.trim()) return [];
  const blocks = raw
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const lines: AdminTranscriptLine[] = [];
  blocks.forEach((block) => {
    const rows = block.split(/\n/).filter(Boolean);
    if (!rows.length) return;

    let cursor = 0;
    if (/^\d+$/.test(rows[0])) {
      cursor = 1;
    }

    const timeRow = rows[cursor];
    if (!timeRow) return;

    const [start, end] = timeRow.split(/\s+-->\s+/);
    const textRows = rows.slice(cursor + 1);
    const text = sanitizeText(textRows.join(' '));

    lines.push({
      id: nanoid(),
      startTime: parseTimecode(start ?? '00:00:00,000'),
      endTime: parseTimecode(end ?? start ?? '00:00:05,000'),
      text,
      translation: '',
      lockState: 'unlocked',
      status: 'pending',
    });
  });

  return lines.map((line, idx) => ({
    ...line,
    translation: line.translation ?? '',
    startTime: line.startTime || idx * 4_000,
    endTime: line.endTime || (idx + 1) * 4_000,
  }));
};

export const exportAsJson = (lines: AdminTranscriptLine[]) => {
  const normalized = lines.map(({ notation, ...rest }) => ({ ...rest, notation }));
  const blob = new Blob([JSON.stringify(normalized, null, 2)], { type: 'application/json' });
  triggerDownload('transcripts.json', blob);
};

export const exportAsCsv = (lines: AdminTranscriptLine[]) => {
  const header = 'id,startTime,endTime,text,translation\n';
  const body = lines
    .map((line) =>
      [line.id, line.startTime, line.endTime, escapeCsv(line.text), escapeCsv(line.translation)].join(',')
    )
    .join('\n');
  const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
  triggerDownload('transcripts.csv', blob);
};

const escapeCsv = (value: string) => {
  if (value.includes(',') || value.includes('\"') || value.includes('\n')) {
    return `"${value.replace(/\"/g, '""')}"`;
  }
  return value;
};

const triggerDownload = (filename: string, blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
