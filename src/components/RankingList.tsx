import { money, number } from '../utils/format';
import type { LaunchKpi } from '../types';

type Props = { rows: LaunchKpi[]; metric: 'revenue_usd' | 'dau' | 'dnu'; title: string };
export function RankingList({ rows, metric, title }: Props) {
  const sorted = [...rows].filter(r => r.period === '30days' && r[metric] != null).sort((a,b) => Number(b[metric]||0)-Number(a[metric]||0)).slice(0,8);
  const max = Math.max(...sorted.map(r => Number(r[metric] || 0)), 1);
  return <section className="panel"><div className="panel-head"><div><small>D+30 BENCHMARK</small><h3>{title}</h3></div><span className="pill">USD</span></div>
    <div className="ranking-list">{sorted.map((row, i) => <div className="rank-row" key={`${row.title}-${i}`}>
      <span className="rank-no">{i+1}</span><b>{row.title}</b><div className="bar"><i style={{width: `${(Number(row[metric]||0)/max)*100}%`}}/></div><strong>{metric === 'revenue_usd' ? money(row[metric]) : number(row[metric])}</strong>
    </div>)}</div>
  </section>;
}
