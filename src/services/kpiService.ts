import { supabase, hasSupabaseEnv } from '../lib/supabase';
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
  return { games: [...map.values()], kpis, source: 'sample', warning: 'Supabase 환경변수 미설정 또는 데이터 없음: 샘플 데이터 표시 중' };
}

export async function loadPortalData(): Promise<PortalData> {
  if (!hasSupabaseEnv || !supabase) return normalizeFallback();

  try {
    const [{ data: games, error: gamesError }, { data: flat, error: flatError }] = await Promise.all([
      supabase.from('games').select('*').order('launch_date', { ascending: false }),
      supabase.from('v_launch_kpi_flat').select('*'),
    ]);

    if (gamesError) throw gamesError;
    if (flatError) throw flatError;
    if (!games || !flat || games.length === 0 || flat.length === 0) return normalizeFallback();

    return {
      games: games as Game[],
      kpis: flat as LaunchKpi[],
      source: 'supabase',
    };
  } catch (error) {
    console.error('Supabase load failed', error);
    return normalizeFallback();
  }
}
