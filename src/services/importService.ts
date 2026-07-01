import * as XLSX from 'xlsx';
import { supabase, hasSupabaseEnv } from '../lib/supabase';
import type { Period } from '../types';

export type ImportPreview = {
  games: any[];
  launchKpis: any[];
  retention: any[];
  preRegistration: any[];
  warnings: string[];
  sourceFile: string;
};

export type ImportResult = {
  ok: boolean;
  message: string;
  preview: ImportPreview;
};

const PERIODS: Period[] = ['1day', '10days', '15days', '30days', '60days'];
const KRW_PER_USD = 1300;

function cleanText(v: any): string {
  return String(v ?? '').replace(/\s+/g, ' ').trim();
}

function toNumber(v: any): number | null {
  if (v === null || v === undefined || v === '' || v === '-') return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(String(v).replace(/[,₩$%\s]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function toInteger(v: any): number | null {
  const n = toNumber(v);
  return n === null ? null : Math.round(n);
}

function excelDateToIso(v: any): string | null {
  if (!v) return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  if (typeof v === 'number') {
    const parsed = XLSX.SSF.parse_date_code(v);
    if (parsed) {
      const d = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
      return d.toISOString().slice(0, 10);
    }
  }
  const s = cleanText(v);
  if (!s) return null;
  const replaced = s.replace(/[.]/g, '-').replace(/[\/]/g, '-');
  const d = new Date(replaced);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function codeFromTitle(title: string): string {
  return cleanText(title).toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function inferRegion(title: string): string | null {
  const parts = cleanText(title).split(' ');
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : null;
}

function normalizePercent(v: any): number | null {
  const n = toNumber(v);
  if (n === null) return null;
  return n > 1 ? n / 100 : n;
}

function sheetRows(workbook: XLSX.WorkBook, sheetName: string): any[][] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true }) as any[][];
}

function findSheet(workbook: XLSX.WorkBook, candidates: string[]): string | undefined {
  const names = workbook.SheetNames;
  return names.find(name => candidates.some(c => name.toLowerCase().replace(/\s/g, '').includes(c.toLowerCase().replace(/\s/g, ''))));
}

function parseAllKpi(workbook: XLSX.WorkBook, sourceFile: string) {
  const sheetName = findSheet(workbook, ['ALL KPI 비교', 'ALL KPI']);
  const games = new Map<string, any>();
  const launchKpis: any[] = [];
  const warnings: string[] = [];
  if (!sheetName) {
    warnings.push('ALL KPI 비교 시트를 찾지 못했습니다. launch_kpi는 가져오지 않았습니다.');
    return { games, launchKpis, warnings };
  }

  const rows = sheetRows(workbook, sheetName);
  let period: Period | null = null;

  rows.forEach(row => {
    const marker = cleanText(row[0]).toLowerCase();
    const matched = PERIODS.find(p => marker === p.toLowerCase());
    if (matched) {
      period = matched;
      return;
    }

    const title = cleanText(row[1]);
    const date = excelDateToIso(row[0]);
    if (!period || !title || !date) return;

    const revenueKrw = toNumber(row[4]);
    const googleKrw = toNumber(row[10]);
    const appleKrw = toNumber(row[11]);
    const mycardKrw = toNumber(row[13]);
    const razerKrw = toNumber(row[15]);
    const unipinKrw = toNumber(row[17]);
    const oneoneKrw = toNumber(row[18]);
    const ebanxKrw = toNumber(row[19]);
    const xsollaKrw = toNumber(row[20]);
    const code = codeFromTitle(title);

    games.set(code, {
      code,
      title,
      region: inferRegion(title),
      launch_date: date,
      publisher: 'GGT',
      genre: 'MMORPG',
      platform: 'AOS/iOS',
      ip: 'Ragnarok',
      status: 'launched',
    });

    launchKpis.push({
      game_code: code,
      period,
      dnu: toInteger(row[2]),
      dau: toInteger(row[3]),
      revenue_usd: revenueKrw === null ? null : +(revenueKrw / KRW_PER_USD).toFixed(2),
      pu: toInteger(row[5]),
      pur: normalizePercent(row[6]),
      arpu_usd: toNumber(row[7]) === null ? null : +(toNumber(row[7])! / KRW_PER_USD).toFixed(4),
      arppu_usd: toNumber(row[8]) === null ? null : +(toNumber(row[8])! / KRW_PER_USD).toFixed(4),
      google_usd: googleKrw === null ? null : +(googleKrw / KRW_PER_USD).toFixed(2),
      apple_usd: appleKrw === null ? null : +(appleKrw / KRW_PER_USD).toFixed(2),
      mycard_usd: mycardKrw === null ? null : +(mycardKrw / KRW_PER_USD).toFixed(2),
      razer_usd: razerKrw === null ? null : +(razerKrw / KRW_PER_USD).toFixed(2),
      unipin_usd: unipinKrw === null ? null : +(unipinKrw / KRW_PER_USD).toFixed(2),
      oneone_usd: oneoneKrw === null ? null : +(oneoneKrw / KRW_PER_USD).toFixed(2),
      ebanx_usd: ebanxKrw === null ? null : +(ebanxKrw / KRW_PER_USD).toFixed(2),
      xsolla_usd: xsollaKrw === null ? null : +(xsollaKrw / KRW_PER_USD).toFixed(2),
      source_file: sourceFile,
    });
  });

  if (launchKpis.length === 0) warnings.push(`${sheetName}에서 KPI 행을 찾지 못했습니다.`);
  return { games, launchKpis, warnings };
}

function parseRetention(workbook: XLSX.WorkBook, sourceFile: string) {
  const sheetName = findSheet(workbook, ['1M Retention', 'Retention']);
  if (!sheetName) return { retention: [], warnings: ['Retention 시트를 찾지 못했습니다.'] };
  const rows = sheetRows(workbook, sheetName);
  const retention: any[] = [];
  const warnings: string[] = [];
  rows.forEach(row => {
    const title = cleanText(row[3]);
    if (!title || title.toLowerCase().includes('title')) return;
    const values = [row[4], row[5], row[6], row[7], row[8], row[9], row[10], row[11]];
    if (values.every(v => toNumber(v) === null)) return;
    retention.push({
      game_code: codeFromTitle(title),
      d1: normalizePercent(row[4]),
      d2: normalizePercent(row[5]),
      d3: normalizePercent(row[6]),
      d4: normalizePercent(row[7]),
      d5: normalizePercent(row[8]),
      d6: normalizePercent(row[9]),
      d7: normalizePercent(row[10]),
      d14: normalizePercent(row[11]),
      source_file: sourceFile,
    });
  });
  if (retention.length === 0) warnings.push(`${sheetName}에는 실제 Retention 값이 거의 없어서 가져오지 않았습니다.`);
  return { retention, warnings };
}

function parsePreRegistration(workbook: XLSX.WorkBook, sourceFile: string) {
  const sheetName = findSheet(workbook, ['사전예약', 'pre']);
  if (!sheetName) return { preRegistration: [], warnings: ['사전예약 시트를 찾지 못했습니다.'] };
  const rows = sheetRows(workbook, sheetName);
  const preRegistration: any[] = [];
  rows.forEach((row, idx) => {
    if (idx < 3) return;
    const title = cleanText(row[0]);
    const total = toInteger(row[1]);
    if (!title || total === null) return;
    preRegistration.push({
      game_code: codeFromTitle(title),
      region: inferRegion(title),
      total,
      official: toInteger(row[2]),
      google: toInteger(row[3]),
      apple: toInteger(row[4]),
      etc: toInteger(row[8]),
      source_file: sourceFile,
    });
  });
  return { preRegistration, warnings: [] as string[] };
}

function mergeGameCodes(preview: ImportPreview) {
  const map = new Map(preview.games.map(g => [g.code, g]));
  [...preview.retention, ...preview.preRegistration].forEach((row: any) => {
    if (row.game_code && !map.has(row.game_code)) {
      const title = String(row.game_code).replace(/_/g, ' ');
      map.set(row.game_code, {
        code: row.game_code,
        title,
        region: row.region || inferRegion(title),
        publisher: 'GGT',
        genre: 'MMORPG',
        platform: 'AOS/iOS',
        ip: 'Ragnarok',
        status: 'launched',
      });
    }
  });
  preview.games = [...map.values()];
}

export async function previewExcelImport(file: File): Promise<ImportPreview> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const allKpi = parseAllKpi(workbook, file.name);
  const retention = parseRetention(workbook, file.name);
  const pre = parsePreRegistration(workbook, file.name);
  const preview: ImportPreview = {
    games: [...allKpi.games.values()],
    launchKpis: allKpi.launchKpis,
    retention: retention.retention,
    preRegistration: pre.preRegistration,
    warnings: [...allKpi.warnings, ...retention.warnings, ...pre.warnings],
    sourceFile: file.name,
  };
  mergeGameCodes(preview);
  return preview;
}

export async function importPreviewToSupabase(preview: ImportPreview): Promise<ImportResult> {
  if (!hasSupabaseEnv || !supabase) {
    return { ok: false, message: 'Supabase 환경변수가 없어 DB 저장을 할 수 없습니다.', preview };
  }
  if (preview.games.length === 0) {
    return { ok: false, message: '저장할 게임 데이터가 없습니다.', preview };
  }

  const { error: gameError } = await supabase.from('games').upsert(preview.games, { onConflict: 'code' });
  if (gameError) throw gameError;

  const codes = preview.games.map(g => g.code);
  const { data: savedGames, error: fetchError } = await supabase.from('games').select('id, code').in('code', codes);
  if (fetchError) throw fetchError;
  const idByCode = new Map((savedGames || []).map((g: any) => [g.code, g.id]));

  const launchRows = preview.launchKpis
    .map(row => ({ ...row, game_id: idByCode.get(row.game_code), game_code: undefined }))
    .filter(row => row.game_id);
  if (launchRows.length) {
    const { error } = await supabase.from('launch_kpi').upsert(launchRows, { onConflict: 'game_id,period' });
    if (error) throw error;
  }

  const retentionRows = preview.retention
    .map(row => ({ ...row, game_id: idByCode.get(row.game_code), game_code: undefined }))
    .filter(row => row.game_id);
  if (retentionRows.length) {
    const { error } = await supabase.from('retention').upsert(retentionRows, { onConflict: 'game_id' });
    if (error) throw error;
  }

  const preRows = preview.preRegistration
    .map(row => ({ ...row, game_id: idByCode.get(row.game_code), game_code: undefined }))
    .filter(row => row.game_id);
  if (preRows.length) {
    const { error } = await supabase.from('pre_registration').upsert(preRows, { onConflict: 'game_id,region' });
    if (error) throw error;
  }

  return {
    ok: true,
    message: `DB 저장 완료: 게임 ${preview.games.length}개, KPI ${launchRows.length}건, Retention ${retentionRows.length}건, 사전예약 ${preRows.length}건`,
    preview,
  };
}
