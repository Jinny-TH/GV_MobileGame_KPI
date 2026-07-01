import { BarChart3, Database, Gamepad2, Heart, LineChart, Settings, Trophy, Upload } from 'lucide-react';

type Props = { active: string; setActive: (v: string) => void };
const items = [
  ['Dashboard', BarChart3],
  ['Game Library', Gamepad2],
  ['Game Detail', Database],
  ['Comparison', LineChart],
  ['Ranking', Trophy],
  ['Retention', Heart],
  ['Admin', Upload],
  ['Settings', Settings],
] as const;

export function Sidebar({ active, setActive }: Props) {
  return <aside className="sidebar">
    <div className="brand"><div className="logo">G</div><div><strong>GGT Launch KPI</strong><span>Product v5.1</span></div></div>
    <nav>{items.map(([label, Icon]) => <button key={label} onClick={() => setActive(label)} className={active === label ? 'active' : ''}><Icon size={16}/>{label}</button>)}</nav>
    <div className="side-note"><b>Currency Standard</b><span>모든 금액 KPI는 USD 기준입니다.</span></div>
  </aside>;
}
