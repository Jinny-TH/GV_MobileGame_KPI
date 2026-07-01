import { RankingList } from '../components/RankingList';
import type { PortalData } from '../types';
export function Ranking({ data }: { data: PortalData }) { return <div className="grid two"><RankingList rows={data.kpis} metric="revenue_usd" title="D+30 Revenue"/><RankingList rows={data.kpis} metric="dau" title="D+30 DAU"/></div>; }
