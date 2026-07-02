import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const LOCAL_URL_KEY = 'ggt_launch_kpi_supabase_url';
const LOCAL_KEY_KEY = 'ggt_launch_kpi_supabase_publishable_key';

let cachedClient: SupabaseClient | null = null;
let cachedSignature = '';

function safeTrim(value: unknown): string {
  return String(value ?? '').trim().replace(/^['\"]|['\"]$/g, '');
}

function fromLocalStorage(key: string): string {
  try {
    if (typeof window === 'undefined') return '';
    return safeTrim(window.localStorage.getItem(key));
  } catch {
    return '';
  }
}

function validUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

function validPublishableKey(value: string): boolean {
  return Boolean(
    value &&
    !value.includes('PASTE_') &&
    !value.includes('your_key_here') &&
    (value.startsWith('sb_publishable_') || value.startsWith('eyJ'))
  );
}

export type SupabaseConfigStatus = {
  hasUrl: boolean;
  hasKey: boolean;
  validUrl: boolean;
  validKey: boolean;
  source: 'vercel-env' | 'browser-override' | 'missing';
  urlHost: string | null;
  message: string;
};

export function getSupabaseConfig() {
  const envUrl = safeTrim(import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL);
  const envKey = safeTrim(
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const localUrl = fromLocalStorage(LOCAL_URL_KEY);
  const localKey = fromLocalStorage(LOCAL_KEY_KEY);

  const url = localUrl || envUrl;
  const publishableKey = localKey || envKey;
  const source = localUrl || localKey ? 'browser-override' : envUrl || envKey ? 'vercel-env' : 'missing';
  const status: SupabaseConfigStatus = {
    hasUrl: Boolean(url),
    hasKey: Boolean(publishableKey),
    validUrl: validUrl(url),
    validKey: validPublishableKey(publishableKey),
    source,
    urlHost: validUrl(url) ? new URL(url).host : null,
    message: '',
  };

  if (!status.hasUrl || !status.hasKey) {
    status.message = 'Supabase URL 또는 Publishable Key가 없습니다.';
  } else if (!status.validUrl) {
    status.message = 'Supabase URL 형식이 올바르지 않습니다. /rest/v1/ 없이 https://xxxx.supabase.co 형태여야 합니다.';
  } else if (!status.validKey) {
    status.message = 'Publishable Key 형식이 올바르지 않습니다. Secret Key가 아니라 sb_publishable_... 키를 사용해야 합니다.';
  } else {
    status.message = source === 'browser-override' ? '브라우저 저장 설정으로 연결 준비 완료' : 'Vercel 환경변수로 연결 준비 완료';
  }

  return { url, publishableKey, status };
}

export function hasSupabaseEnv(): boolean {
  const { status } = getSupabaseConfig();
  return status.validUrl && status.validKey;
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, publishableKey } = getSupabaseConfig();
  if (!hasSupabaseEnv()) return null;
  const signature = `${url}|${publishableKey.slice(0, 18)}`;
  if (!cachedClient || cachedSignature !== signature) {
    cachedClient = createClient(url, publishableKey);
    cachedSignature = signature;
  }
  return cachedClient;
}

export function saveSupabaseBrowserOverride(url: string, publishableKey: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_URL_KEY, safeTrim(url));
  window.localStorage.setItem(LOCAL_KEY_KEY, safeTrim(publishableKey));
  cachedClient = null;
  cachedSignature = '';
}

export function clearSupabaseBrowserOverride() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LOCAL_URL_KEY);
  window.localStorage.removeItem(LOCAL_KEY_KEY);
  cachedClient = null;
  cachedSignature = '';
}

export async function testSupabaseConnection() {
  const client = getSupabaseClient();
  const { status } = getSupabaseConfig();
  if (!client) {
    return { ok: false, message: status.message, gamesCount: 0, kpiCount: 0 };
  }
  const [{ count: gamesCount, error: gamesError }, { count: kpiCount, error: kpiError }] = await Promise.all([
    client.from('games').select('*', { count: 'exact', head: true }),
    client.from('v_launch_kpi_flat').select('*', { count: 'exact', head: true }),
  ]);
  if (gamesError) return { ok: false, message: gamesError.message, gamesCount: 0, kpiCount: 0 };
  if (kpiError) return { ok: false, message: kpiError.message, gamesCount: gamesCount || 0, kpiCount: 0 };
  return { ok: true, message: 'Supabase 연결 성공', gamesCount: gamesCount || 0, kpiCount: kpiCount || 0 };
}
