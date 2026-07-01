import { KpiCard } from '../components/KpiCard';
import { RankingList } from '../components/RankingList';
import { money, number } from '../utils/format';
import type { PortalData } from '../types';

type Props = { data: PortalData; setActive: (v:string)=>void };
export function Dashboard({ data, setActive }: Props) {
  const d30 = data.kpis.filter(k => k.period === '30days');
  const d1 = data.kpis.filter(k => k.period === '1day');
  const topRevenue = [...d30].sort((a,b)=>Number(b.revenue_usd||0)-Number(a.revenue_usd||0))[0];
  const topDau = [...d1].sort((a,b)=>Number(b.dau||0)-Number(a.dau||0))[0];
  const regions = new Set(data.games.map(g => g.region).filter(Boolean)).size;
  return <>
    {data.warning && <div className="warning">⚠️ {data.warning}</div>}
    <section className="hero"><div><small>EXECUTIVE VIEW</small><h2>GGT 사업부가 함께 보는 런칭 데이터 자산</h2><p>Revenue, Retention, UA, Pre-registration, Lessons Learned를 한 곳에서 관리합니다.</p></div><div className="hero-actions"><button onClick={()=>setActive('Game Library')}>게임 찾기</button><button className="dark" onClick={()=>setActive('Comparison')}>비교 시작</button></div></section>
    <div className="grid cards"><KpiCard label="Games" value={String(data.games.length)} desc="비교 가능한 게임"/><KpiCard label="Regions" value={String(regions)} desc="서비스 지역"/><KpiCard label="Top D+30 Revenue" value={topRevenue?.title || '-'} desc={money(topRevenue?.revenue_usd)}/><KpiCard label="Top D+1 DAU" value={topDau?.title || '-'} desc={number(topDau?.dau)}/></div>
    <div className="grid two"><RankingList rows={data.kpis} metric="revenue_usd" title="Top Revenue Ranking"/><section className="panel"><div className="panel-head"><div><small>QUICK COMPARE</small><h3>빠른 비교</h3></div><span>최대 5개</span></div><div className="chips">{data.games.slice(0,18).map(g=><button key={g.code}>{g.title}</button>)}</div><button className="wide" onClick={()=>setActive('Comparison')}>선택 게임 비교</button></section></div>
  </>;
}
