import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { GameLibrary } from './pages/GameLibrary';
import { Ranking } from './pages/Ranking';
import { Placeholder } from './pages/Placeholder';
import { loadPortalData } from './services/kpiService';
import type { PortalData } from './types';
import './styles.css';

export default function App() {
  const [active, setActive] = useState('Dashboard');
  const [query, setQuery] = useState('');
  const [data, setData] = useState<PortalData | null>(null);

  useEffect(() => { loadPortalData().then(setData); }, []);
  const filtered = useMemo(() => {
    if (!data || !query.trim()) return data;
    const q = query.toLowerCase();
    const games = data.games.filter(g => [g.title, g.region, g.publisher, g.genre].join(' ').toLowerCase().includes(q));
    const titles = new Set(games.map(g => g.title));
    return { ...data, games, kpis: data.kpis.filter(k => !k.title || titles.has(k.title)) };
  }, [data, query]);

  if (!filtered) return <div className="loading">GGT Launch KPI Portal 로딩 중...</div>;
  return <div className="app"><Sidebar active={active} setActive={setActive}/><main className="main"><header className="top"><div><small>LAUNCH INTELLIGENCE PORTAL</small><h1>모바일게임 런칭 성과 비교 포탈</h1><p>과거 서비스 게임의 D+1 · D+10 · D+15 · D+30 · D+60 성과를 같은 기준으로 비교합니다.</p></div><label className="search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="게임 검색"/></label></header><div className="source-badge">{filtered.source === 'supabase' ? '✅ Supabase DB 연결됨' : '🧪 Sample Data Mode'} · Currency: USD</div>{active === 'Dashboard' && <Dashboard data={filtered} setActive={setActive}/>} {active === 'Game Library' && <GameLibrary data={filtered}/>} {active === 'Ranking' && <Ranking data={filtered}/>} {!['Dashboard','Game Library','Ranking'].includes(active) && <Placeholder title={active}/>}</main></div>;
}
