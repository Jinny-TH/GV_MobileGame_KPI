import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, BarChart3, Gamepad2, Trophy, Heart, Database, Settings, GitCompare } from 'lucide-react';
import { supabase, hasSupabaseEnv } from './lib/supabase';
import { fallbackData } from './data/fallbackData';
import './styles.css';

const periods = ['1day','10days','15days','30days','60days'];
const metricLabels = { revenue_usd:'Revenue USD', dau:'DAU', dnu:'DNU', pu:'PU', pur:'PUR', arpu_usd:'ARPU USD', arppu_usd:'ARPPU USD' };

function money(v){ if(v==null||isNaN(v)) return '-'; if(v>=1_000_000) return `$${(v/1_000_000).toFixed(2)}M`; if(v>=1000) return `$${(v/1000).toFixed(1)}K`; return `$${Number(v).toFixed(2)}`; }
function num(v){ if(v==null||isNaN(v)) return '-'; return Number(v).toLocaleString(); }
function pct(v){ if(v==null||isNaN(v)) return '-'; return `${(Number(v)*100).toFixed(1)}%`; }
function fmt(v,m){ return m?.includes('usd') ? money(v) : m==='pur' ? pct(v) : num(v); }
function regionOf(g){ return g.region || g.service_region || 'Global'; }
function launchYear(g){ return g.launch_date ? String(new Date(g.launch_date).getFullYear()) : 'Unknown'; }

async function loadData(){
  if(!supabase) return { ...fallbackData, source:'fallback' };
  try{
    const [{data:games,error:gErr},{data:kpi,error:kErr},{data:retention,error:rErr}] = await Promise.all([
      supabase.from('games').select('*').order('title'),
      supabase.from('v_launch_kpi_flat').select('*'),
      supabase.from('retention').select('*')
    ]);
    if(gErr || kErr) throw gErr || kErr;
    if(!games?.length || !kpi?.length) return { ...fallbackData, source:'fallback-empty' };
    return { ...fallbackData, games, kpi, retention: retention || [], source:'supabase' };
  } catch(e){
    console.warn('Supabase load failed:', e);
    return { ...fallbackData, source:'fallback-error' };
  }
}

function App(){
  const [data,setData] = useState(null);
  const [view,setView] = useState('dashboard');
  const [metric,setMetric] = useState('revenue_usd');
  const [selected,setSelected] = useState([]);
  const [current,setCurrent] = useState('');
  const [query,setQuery] = useState('');

  useEffect(()=>{ loadData().then(d=>{ setData(d); setSelected(d.games.slice(0,4).map(g=>g.title)); setCurrent(d.games[0]?.title || ''); }); },[]);
  if(!data) return <div className="loading">Loading Launch KPI Portal...</div>;

  const kpi = data.kpi || [];
  const games = data.games || [];
  const rows = p => kpi.filter(r=>r.period===p);
  const gameRows = title => kpi.filter(r=>String(r.title).trim()===String(title).trim()).sort((a,b)=>periods.indexOf(a.period)-periods.indexOf(b.period));
  const row = (title,p) => kpi.find(r=>String(r.title).trim()===String(title).trim() && r.period===p) || {};
  const d30 = title => row(title,'30days') || gameRows(title).at(-1) || {};
  const d1 = title => row(title,'1day') || gameRows(title)[0] || {};

  const topRev = [...games].sort((a,b)=>(d30(b.title).revenue_usd||0)-(d30(a.title).revenue_usd||0))[0];
  const topDau = [...games].sort((a,b)=>(d1(b.title).dau||0)-(d1(a.title).dau||0))[0];

  const nav = [
    ['dashboard', BarChart3, 'Dashboard'], ['library', Gamepad2, 'Game Library'], ['detail', Database, 'Game Detail'],
    ['compare', GitCompare, 'Comparison'], ['ranking', Trophy, 'Ranking'], ['retention', Heart, 'Retention'], ['admin', Settings, 'Admin']
  ];

  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><div className="logo">G</div><div><b>GGT Launch KPI</b><small>Official v4.0</small></div></div>
      <nav>{nav.map(([id,Icon,label])=><button key={id} onClick={()=>setView(id)} className={view===id?'active':''}><Icon size={16}/>{label}</button>)}</nav>
      <div className="side-note"><b>Currency Standard</b><span>모든 금액 지표는 USD 기준입니다.</span></div>
    </aside>
    <main>
      <header className="topbar">
        <div><p className="eyebrow">LAUNCH INTELLIGENCE PORTAL</p><h1>모바일게임 런칭 성과 비교 포탈</h1><p>과거 서비스 게임의 D+1 · D+10 · D+15 · D+30 · D+60 성과를 같은 기준으로 비교합니다.</p></div>
        <div className="search"><Search size={17}/><input placeholder="게임 검색" value={query} onChange={e=>{setQuery(e.target.value);setView('library')}} /></div>
      </header>
      <div className={data.source==='supabase'?'status ok':'status'}>{data.source==='supabase'?'✅ Supabase DB 연결 완료':'⚠️ Supabase 환경변수 미설정 또는 데이터 없음: 샘플 데이터 표시 중'}</div>

      {view==='dashboard' && <Dashboard games={games} rows={rows} d30={d30} d1={d1} topRev={topRev} topDau={topDau} metric={metric} setMetric={setMetric} selected={selected} setSelected={setSelected} setView={setView}/>} 
      {view==='library' && <Library games={games} query={query} setCurrent={setCurrent} setView={setView} d30={d30} d1={d1}/>} 
      {view==='detail' && <Detail current={current} games={games} gameRows={gameRows} d30={d30} d1={d1}/>} 
      {view==='compare' && <Compare games={games} selected={selected} setSelected={setSelected} row={row} metric={metric} setMetric={setMetric}/>} 
      {view==='ranking' && <Ranking rows={rows} metric={metric} setMetric={setMetric}/>} 
      {view==='retention' && <Retention data={data}/>} 
      {view==='admin' && <Admin/>}
    </main>
  </div>;
}

function Dashboard({games,rows,d30,d1,topRev,topDau,metric,setMetric,selected,setSelected,setView}){
  const data = [...rows('30days')].filter(r=>r[metric]!=null).sort((a,b)=>b[metric]-a[metric]).slice(0,8);
  const max = Math.max(...data.map(r=>Number(r[metric])),1);
  return <section>
    <div className="hero"><div><p className="eyebrow">EXECUTIVE VIEW</p><h2>GGT 사업부가 함께 보는 런칭 데이터 자산</h2><p>Revenue, Retention, UA, Pre-registration, Lessons Learned를 한 곳에서 관리합니다.</p></div><button onClick={()=>setView('library')}>게임 찾기</button><button className="dark" onClick={()=>setView('compare')}>비교 시작</button></div>
    <div className="cards"><Card title="Games" value={games.length} desc="비교 가능한 게임"/><Card title="Regions" value={new Set(games.map(regionOf)).size} desc="서비스 지역"/><Card title="Top D+30 Revenue" value={topRev?.title||'-'} desc={topRev?money(d30(topRev.title).revenue_usd):''}/><Card title="Top D+1 DAU" value={topDau?.title||'-'} desc={topDau?num(d1(topDau.title).dau):''}/></div>
    <div className="grid two"><Panel title="Top Revenue Ranking" eyebrow="D+30 Benchmark" action={<select value={metric} onChange={e=>setMetric(e.target.value)}>{Object.entries(metricLabels).map(([k,v])=><option value={k} key={k}>{v}</option>)}</select>}>
      {data.map((r,i)=><Bar key={r.title} rank={i+1} title={r.title} value={fmt(r[metric],metric)} width={(r[metric]/max)*100}/>)}</Panel>
      <Panel title="빠른 비교" eyebrow="Quick Compare" action={<span>최대 5개</span>}><Pills games={games} selected={selected} setSelected={setSelected}/><button className="full" onClick={()=>setView('compare')}>선택 게임 비교</button></Panel></div>
  </section>
}
function Card({title,value,desc}){return <div className="card"><span>{title}</span><strong>{value}</strong><small>{desc}</small></div>}
function Panel({title,eyebrow,action,children}){return <div className="panel"><div className="panel-head"><div><p className="eyebrow">{eyebrow}</p><h3>{title}</h3></div>{action}</div>{children}</div>}
function Bar({rank,title,value,width}){return <div className="bar-row"><div className="rank">{rank}</div><div><b>{title}</b><div className="bar-track"><div className="bar-fill" style={{width:`${Math.max(4,width)}%`}}/></div></div><strong>{value}</strong></div>}
function Pills({games,selected,setSelected}){return <div className="pills">{games.map(g=><button key={g.title} className={selected.includes(g.title)?'active':''} onClick={()=>setSelected(selected.includes(g.title)?selected.filter(x=>x!==g.title):[...selected,g.title].slice(0,5))}>{g.title}</button>)}</div>}
function Library({games,query,setCurrent,setView,d30,d1}){ const list=games.filter(g=>!query||g.title.toLowerCase().includes(query.toLowerCase())); return <div className="cards library">{list.map(g=><div className="game-card" key={g.title} onClick={()=>{setCurrent(g.title);setView('detail')}}><h3>{g.title}</h3><div className="tags"><span>{regionOf(g)}</span><span>{launchYear(g)}</span><span>Score {g.score||'-'}</span></div><div className="metrics"><div><small>D+30 Revenue</small><b>{money(d30(g.title).revenue_usd)}</b></div><div><small>D+1 DAU</small><b>{num(d1(g.title).dau)}</b></div></div></div>)}</div>}
function Detail({current,gameRows,d30,d1}){ const rs=gameRows(current); const r30=d30(current), r1=d1(current); return <section><div className="hero"><div><p className="eyebrow">Game Detail</p><h2>{current}</h2><p>게임별 런칭 KPI와 Lessons Learned를 관리하는 상세 페이지입니다.</p></div></div><div className="cards"><Card title="D+30 Revenue" value={money(r30.revenue_usd)} desc="USD"/><Card title="D+1 DAU" value={num(r1.dau)} desc="Users"/><Card title="D+30 PUR" value={pct(r30.pur)} desc="Pay rate"/><Card title="D+30 ARPPU" value={money(r30.arppu_usd)} desc="USD"/></div><Panel title="KPI Curve" eyebrow="Launch KPI"><DataTable rows={rs}/></Panel><div className="grid two"><Panel title="Retention" eyebrow="Data Required"><div className="empty">D1 / D3 / D7 / D14 / D30 Retention 데이터를 DB에 추가하면 여기에 표시됩니다.</div></Panel><Panel title="Lessons Learned" eyebrow="Business Note"><ul><li>Success Factors 기록</li><li>Risk / Issue 기록</li><li>Next Launch Memo 기록</li></ul></Panel></div></section>}
function DataTable({rows}){return <div className="table-wrap"><table><thead><tr><th>Period</th><th>Revenue</th><th>DAU</th><th>PU</th><th>PUR</th><th>ARPU</th><th>ARPPU</th></tr></thead><tbody>{rows.map(r=><tr key={r.period}><td>{r.period}</td><td>{money(r.revenue_usd)}</td><td>{num(r.dau)}</td><td>{num(r.pu)}</td><td>{pct(r.pur)}</td><td>{money(r.arpu_usd)}</td><td>{money(r.arppu_usd)}</td></tr>)}</tbody></table></div>}
function Compare({games,selected,setSelected,row,metric,setMetric}){return <section><Panel title="게임별 KPI 비교" eyebrow="Comparison" action={<select value={metric} onChange={e=>setMetric(e.target.value)}>{Object.entries(metricLabels).map(([k,v])=><option value={k} key={k}>{v}</option>)}</select>}><Pills games={games} selected={selected} setSelected={setSelected}/><div className="table-wrap"><table><thead><tr><th>Game</th>{periods.map(p=><th key={p}>{p}</th>)}</tr></thead><tbody>{selected.map(t=><tr key={t}><td><b>{t}</b></td>{periods.map(p=><td key={p}>{fmt(row(t,p)[metric],metric)}</td>)}</tr>)}</tbody></table></div></Panel></section>}
function Ranking({rows,metric,setMetric}){const [period,setPeriod]=useState('30days'); const arr=[...rows(period)].filter(r=>r[metric]!=null).sort((a,b)=>b[metric]-a[metric]); return <Panel title="Ranking" eyebrow="Launch Ranking" action={<><select value={period} onChange={e=>setPeriod(e.target.value)}>{periods.map(p=><option key={p}>{p}</option>)}</select><select value={metric} onChange={e=>setMetric(e.target.value)}>{Object.entries(metricLabels).map(([k,v])=><option value={k} key={k}>{v}</option>)}</select></>}><div className="table-wrap"><table><thead><tr><th>#</th><th>Game</th><th>Value</th><th>DAU</th><th>PUR</th></tr></thead><tbody>{arr.map((r,i)=><tr key={r.title}><td>{i+1}</td><td><b>{r.title}</b></td><td>{fmt(r[metric],metric)}</td><td>{num(r.dau)}</td><td>{pct(r.pur)}</td></tr>)}</tbody></table></div></Panel>}
function Retention({data}){return <Panel title="Retention Dashboard" eyebrow="Executive KPI"><div className="empty">현재 원본 파일의 Retention 값이 비어 있습니다. DB의 retention 테이블에 D1/D3/D7/D14/D30 값을 추가하면 이 화면이 활성화됩니다.</div></Panel>}
function Admin(){return <section><Panel title="v4.0 DB 연결 방식" eyebrow="Admin"><p><b>config.js를 제거했습니다.</b></p><p>Vercel Environment Variables에 아래 값을 등록하세요.</p><pre>VITE_SUPABASE_URL\nVITE_SUPABASE_PUBLISHABLE_KEY</pre><p>Secret key는 절대 프론트엔드에 넣지 않습니다.</p></Panel></section>}

createRoot(document.getElementById('root')).render(<App />);
