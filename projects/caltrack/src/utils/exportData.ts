import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';
import type { Entry, Settings } from '../types/models';

function csvEscape(val: unknown): string {
  const s = String(val ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export type ExportBundle = {
  exportedAt: string;
  appVersion?: string;
  platform?: string;
  settings: Settings;
  entries: Entry[];
};

export function entriesToCsv(entries: Entry[]): string {
  const header = [
    'createdAt',
    'dateKey',
    'meal',
    'emoji',
    'caption',
    'rawText',
    'calories',
    'protein',
    'fat',
    'carbs',
    'fiber',
    'sugar',
    'cholesterol',
    'sodium',
    'id',
  ];

  const rows = entries.map((e) => [
    new Date(e.createdAt).toISOString(),
    e.dateKey,
    e.meal,
    e.emoji || '',
    e.caption || '',
    e.rawText || '',
    e.calories,
    e.protein,
    e.fat ?? '',
    e.carbs ?? '',
    e.fiber ?? '',
    e.sugar ?? '',
    e.cholesterol ?? '',
    e.sodium ?? '',
    e.id,
  ]);

  return [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n');
}

async function writeAndShare(filename: string, content: string, mimeType: string) {
  const baseDir = FileSystem.Paths?.document?.uri || FileSystem.Paths?.cache?.uri;
  if (!baseDir) throw new Error('No writable directory available');

  const file = new FileSystem.File(baseDir, filename);
  file.create({ intermediates: true, overwrite: true });
  file.write(content, { encoding: 'utf8' });

  if (!(await Sharing.isAvailableAsync())) {
    return { ok: false as const, reason: 'sharing_unavailable' as const, uri: file.uri };
  }

  await Sharing.shareAsync(file.uri, {
    mimeType,
    dialogTitle: 'Export CalTrack data',
    UTI: mimeType,
  });

  return { ok: true as const, uri: file.uri };
}

export async function exportJson(bundle: ExportBundle) {
  const filename = `caltrack-export-${bundle.exportedAt.slice(0, 10)}.json`;
  const json = JSON.stringify(bundle, null, 2);
  return writeAndShare(filename, json, 'application/json');
}

export async function exportCsv(entries: Entry[]) {
  const filename = `caltrack-export-${new Date().toISOString().slice(0, 10)}.csv`;
  const csv = entriesToCsv(entries);
  return writeAndShare(filename, csv, 'text/csv');
}

export function makeBundle(settings: Settings, entries: Entry[]): ExportBundle {
  return {
    exportedAt: new Date().toISOString(),
    appVersion: Constants.expoConfig?.version,
    platform: Constants.platform?.ios ? 'ios' : Constants.platform?.android ? 'android' : 'unknown',
    settings,
    entries,
  };
}
