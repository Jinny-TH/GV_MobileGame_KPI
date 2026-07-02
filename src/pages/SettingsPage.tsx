import { useMemo, useState } from 'react';
import { CheckCircle2, Database, FileSpreadsheet, KeyRound, RefreshCw, Save, TriangleAlert } from 'lucide-react';
import type { PortalData } from '../types';
import { clearSupabaseBrowserOverride, getSupabaseConfig, saveSupabaseBrowserOverride, testSupabaseConnection } from '../lib/supabase';

type Props = { data: PortalData };

export function SettingsPage({ data }: Props) {
  const config = useMemo(() => getSupabaseConfig(), []);
  const [url, setUrl] = useState(config.url || '');
  const [key, setKey] = useState('');
  const [testStatus, setTestStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const ok = data.status === 'ok';
  const envOk = config.status.validUrl && config.status.validKey;
  const dbHasData = data.source === 'supabase';

  async function saveOverride() {
    if (!url || !key) {
      setTestStatus('URL과 Publishable Key를 모두 입력해야 합니다.');
      return;
    }
    saveSupabaseBrowserOverride(url, key);
    setTestStatus('브라우저 연결 설정을 저장했습니다. 새로고침 후 다시 확인합니다.');
    window.setTimeout(() => window.location.reload(), 600);
  }

  async function clearOverride() {
    clearSupabaseBrowserOverride();
    setTestStatus('브라우저 연결 설정을 삭제했습니다. Vercel 환경변수 기준으로 다시 로드합니다.');
    window.setTimeout(() => window.location.reload(), 600);
  }

  async function runTest() {
    setBusy(true);
    setTestStatus('Supabase 연결 테스트 중...');
    try {
      const result = await testSupabaseConnection();
      setTestStatus(`${result.ok ? '✅' : '⚠️'} ${result.message} · Games ${result.gamesCount} / KPI ${result.kpiCount}`);
    } catch (e: any) {
      setTestStatus(`⚠️ 테스트 실패: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  return <section className="panel full settings-page">
    <div className="panel-head">
      <div>
        <small>SETTINGS · CONNECTION STATUS</small>
        <h3>Supabase 연결 상태</h3>
        <p>v6.0은 Vercel 환경변수와 브라우저 임시 설정을 모두 지원합니다.</p>
      </div>
      <span className={`pill ${ok ? 'success' : 'warn'}`}>{ok ? 'Live DB Mode' : 'Sample Data Mode'}</span>
    </div>

    <div className="status-grid">
      <div className="status-card">
        {envOk ? <CheckCircle2/> : <TriangleAlert/>}
        <span>Supabase 설정</span>
        <b>{envOk ? '정상' : '확인 필요'}</b>
        <p>{config.status.message}</p>
        <p>Source: {config.status.source} / Host: {config.status.urlHost || '-'}</p>
      </div>
      <div className="status-card">
        {data.status !== 'db-error' && envOk ? <CheckCircle2/> : <TriangleAlert/>}
        <span>Supabase 조회</span>
        <b>{data.status === 'db-error' ? '오류' : envOk ? '연결 가능' : '대기'}</b>
        <p>{data.diagnostics?.message || 'games / v_launch_kpi_flat 조회 기준'}</p>
      </div>
      <div className="status-card">
        {dbHasData ? <Database/> : <FileSpreadsheet/>}
        <span>DB 데이터</span>
        <b>{dbHasData ? '실데이터 표시 중' : '샘플 데이터 표시 중'}</b>
        <p>Games {data.diagnostics?.gamesCount ?? 0}건 / KPI {data.diagnostics?.kpiCount ?? 0}건</p>
      </div>
    </div>

    {data.warning && <div className="warning compact">⚠️ {data.warning}</div>}

    <div className="next-steps connection-box">
      <h4>브라우저 연결 설정</h4>
      <p>Vercel 환경변수가 정상인데도 앱에서 못 읽는 경우, 아래에 Supabase URL과 Publishable Key를 한 번 저장해 테스트할 수 있습니다. Secret Key는 절대 넣지 않습니다.</p>
      <label>Supabase URL<input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://xxxx.supabase.co" /></label>
      <label>Publishable Key<input value={key} onChange={e=>setKey(e.target.value)} placeholder="sb_publishable_..." type="password" /></label>
      <div className="settings-actions">
        <button onClick={saveOverride}><Save size={16}/> 저장 후 새로고침</button>
        <button onClick={runTest} disabled={busy}>{busy ? <RefreshCw size={16} className="spin"/> : <Database size={16}/>} 연결 테스트</button>
        <button className="ghost" onClick={clearOverride}>브라우저 설정 삭제</button>
      </div>
      {testStatus && <div className="import-status">{testStatus}</div>}
    </div>

    <div className="next-steps">
      <h4>다음 작업</h4>
      <ol>
        <li>Supabase SQL Editor에서 <code>supabase/import_policies.sql</code>를 1회 실행</li>
        <li>왼쪽 <b>Admin</b> 메뉴에서 KPI Excel 파일 업로드</li>
        <li>미리보기 확인 후 <b>Supabase DB 저장</b> 클릭</li>
        <li>Dashboard가 <b>Live DB Mode</b>로 바뀌는지 확인</li>
      </ol>
      <div className="key-note"><KeyRound size={16}/> Secret key는 절대 사이트에 넣지 말고, Publishable key만 사용합니다.</div>
    </div>
  </section>;
}
