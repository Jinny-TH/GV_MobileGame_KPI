export type Period = '1day' | '10days' | '15days' | '30days' | '60days';

export type Game = {
  id?: string;
  code: string;
  title: string;
  region?: string | null;
  launch_date?: string | null;
  publisher?: string | null;
  developer?: string | null;
  genre?: string | null;
  platform?: string | null;
  ip?: string | null;
  launch_score?: number | null;
};

export type LaunchKpi = {
  id?: string;
  game_id?: string;
  game_code?: string;
  title?: string;
  region?: string | null;
  launch_date?: string | null;
  period: Period | string;
  dnu?: number | null;
  dau?: number | null;
  pu?: number | null;
  pur?: number | null;
  revenue_usd?: number | null;
  arpu_usd?: number | null;
  arppu_usd?: number | null;
};

export type PortalData = {
  games: Game[];
  kpis: LaunchKpi[];
  source: 'supabase' | 'sample';
  warning?: string;
};
