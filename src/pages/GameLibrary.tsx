import type { PortalData } from '../types';
export function GameLibrary({ data }: { data: PortalData }) {
  return <section className="panel full"><div className="panel-head"><div><small>GAME LIBRARY</small><h3>게임 라이브러리</h3></div><span>{data.games.length} games</span></div><div className="game-grid">{data.games.map(g=><article className="game-card" key={g.code}><div><b>{g.title}</b><span>{g.region || 'Global'} · {g.genre || 'MMORPG'}</span></div><strong>{g.launch_score ? `${g.launch_score}점` : 'N/A'}</strong><p>{g.launch_date || 'Launch date required'}</p></article>)}</div></section>;
}
