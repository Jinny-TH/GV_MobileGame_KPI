import { getSupabaseClient, getSupabaseConfig, hasSupabaseEnv } from '../lib/supabase';
import { fallbackData } from '../data/fallbackData.js';
import type { Game, LaunchKpi, PortalData } from '../types';

function normalizeFallback(): PortalData {
  const kpis = (fallbackData.kpi || []) as LaunchKpi[];
  const map = new Map<string, Game>();
  kpis.forEach((row: any) => {
    const code = String(row.title || '').toUpperCase().replace(/[^A-Z0-9]+/g, '_');
    if (!map.has(code)) {
      map.set(code, {
        code,
        title: row.title,
        region: row.title?.split(' ').pop(),
        launch_date: row.launch_date,
        publisher: 'GGT',
        genre: 'MMORPG',
        platform: 'AOS/iOS',
        ip: 'Ragnarok',
      });
    }
  });
  return { games: [...map.values()], kpis, source: 'sample' };
}

function withStatus(base: PortalData, status: PortalData['status'], warning: string, diagnostics?: PortalData['diagnostics']): PortalData {
  return { ...base, status, warning, diagnostics };
}

function errorMessage(error: unknown) {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  try { return JSON.stringify(error); } catch { return String(error); }
}

export async function loadPortalData(): Promise<PortalData> {
  const config = getSupabaseConfig();
  const supabase = getSupabaseClient();
  if (!hasSupabaseEnv() || !supabase) {
    return withStatus(
      normalizeFallback(),
      'env-missing',
      `Supabase 설정을 읽지 못했습니다: ${config.status.message}`,
      { hasEnv: false, message: JSON.stringify(config.status) }
    );
  }

  try {
    const [{ data: games, error: gamesError }, { data: flat, error: flatError }] = await Promise.all([
      supabase.from('games').select('*').order('launch_date', { ascending: false }),
      supabase.from('v_launch_kpi_flat').select('*'),
    ]);

    if (gamesError) throw gamesError;
    if (flatError) throw flatError;

    const gamesCount = games?.length || 0;
    const kpiCount = flat?.length || 0;

    if (gamesCount === 0 || kpiCount === 0) {
      return withStatus(
        normalizeFallback(),
        'db-empty',
        `Supabase 연결은 되었지만 DB 데이터가 비어 있습니다. Admin에서 Excel 업로드 후 'Supabase DB 저장'을 실행해줘. 현재 games ${gamesCount}건 / KPI ${kpiCount}건`,
        { hasEnv: true, gamesCount, kpiCount }
      );
    }

    return {
      games: games as Game[],
      kpis: flat as LaunchKpi[],
      source: 'supabase',
      status: 'ok',
      diagnostics: { hasEnv: true, gamesCount, kpiCount },
    };
  } catch (error) {
    console.error('Supabase load failed', error);
    return withStatus(
      normalizeFallback(),
      'db-error',
      `Supabase 연결 또는 조회 중 오류가 발생했습니다: ${errorMessage(error)}. RLS 정책 또는 테이블/View 생성을 확인해줘.`,
      { hasEnv: true, message: errorMessage(error) }
    );
  }
}
