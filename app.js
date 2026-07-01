
const D = window.PORTAL_DATA;
let selectedGames = D.games.slice(0,4).map(g=>g.title);
const KRW = v => {
  if(v==null || isNaN(v)) return '-';
  const n = Number(v);
  if(Math.abs(n)>=1e9) return (n/1e9).toFixed(1)+'B';
  if(Math.abs(n)>=1e6) return (n/1e6).toFixed(1)+'M';
  if(Math.abs(n)>=1e3) return (n/1e3).toFixed(1)+'K';
  return n.toLocaleString();
}
const fmt = (v, metric) => {
  if(v==null || isNaN(v)) return '-';
  if(metric==='pur' || metric.includes('share') || metric.includes('ratio')) return (Number(v)*100).toFixed(1)+'%';
  if(metric.includes('revenue') || metric==='arpu' || metric==='arppu') return KRW(v);
  return Math.round(v).toLocaleString();
}
const metricLabel = {
  revenue_krw:'Revenue', dau:'DAU', dnu:'DNU', pu:'PU', pur:'PUR', arpu:'ARPU', arppu:'ARPPU'
};
function switchView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active', n.dataset.view===id));
  if(id==='compare') renderCompare();
  if(id==='ranking') renderRankTable();
  if(id==='prereg') renderPrereg();
}
document.querySelectorAll('.nav').forEach(btn=>btn.onclick=()=>switchView(btn.dataset.view));

function rows(period){ return D.kpi.filter(r=>r.period===period); }
function topRow(period, metric){ return rows(period).filter(r=>r[metric]!=null).sort((a,b)=>b[metric]-a[metric])[0]; }

function renderSummary(){
  const games = D.games.length;
  const topRev = topRow('30days','revenue_krw');
  const topDau = topRow('1day','dau');
  const topPur = topRow('30days','pur');
  const cards = [
    ['비교 게임 수', games, 'ALL KPI 비교 기준'],
    ['Top D+30 Revenue', topRev?.title || '-', fmt(topRev?.revenue_krw,'revenue_krw')],
    ['Top D+1 DAU', topDau?.title || '-', fmt(topDau?.dau,'dau')],
    ['Top D+30 PUR', topPur?.title || '-', fmt(topPur?.pur,'pur')],
  ];
  document.getElementById('summaryCards').innerHTML = cards.map(c=>`
    <div class="card"><span>${c[0]}</span><strong>${c[1]}</strong><em>${c[2]}</em></div>
  `).join('');
}
function renderBars(containerId, data, metric, limit=10){
  const arr = data.filter(r=>r[metric]!=null).sort((a,b)=>b[metric]-a[metric]).slice(0,limit);
  const max = Math.max(...arr.map(r=>Number(r[metric]||0)),1);
  document.getElementById(containerId).innerHTML = arr.map(r=>`
    <div class="bar-row">
      <b>${r.title || r.game}</b>
      <div class="bar-bg"><div class="bar-fill" style="width:${Math.max(2,(r[metric]/max)*100)}%"></div></div>
      <span class="value">${fmt(r[metric],metric)}</span>
    </div>
  `).join('');
}
function renderQuickGames(){
  const el = document.getElementById('quickGameList');
  el.innerHTML = D.games.map(g=>`<button class="game-check ${selectedGames.includes(g.title)?'selected':''}" data-game="${g.title}">${g.title}</button>`).join('');
  el.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    const g=b.dataset.game;
    if(selectedGames.includes(g)) selectedGames = selectedGames.filter(x=>x!==g);
    else if(selectedGames.length<5) selectedGames.push(g);
    renderQuickGames(); renderCompareList();
  });
}
function goCompareSelected(){ switchView('compare'); renderCompare(); }
function renderCompareList(){
  const el = document.getElementById('compareGameList');
  el.innerHTML = D.games.map(g=>`<button class="pill ${selectedGames.includes(g.title)?'selected':''}" data-game="${g.title}">${g.title}</button>`).join('');
  el.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    const g=b.dataset.game;
    if(selectedGames.includes(g)) selectedGames = selectedGames.filter(x=>x!==g);
    else if(selectedGames.length<5) selectedGames.push(g);
    renderCompareList(); renderCompare();
  });
}
function renderLineChart(){
  const metric = document.getElementById('compareMetric').value;
  const periods = D.period_order;
  const series = selectedGames.map(g=>({game:g, values:periods.map(p=>{
    const r=D.kpi.find(x=>x.title===g && x.period===p); return r?.[metric] ?? null;
  })}));
  const vals = series.flatMap(s=>s.values).filter(v=>v!=null);
  const max = Math.max(...vals,1), min = Math.min(...vals,0);
  const w=900,h=320,pad=44;
  const colors=['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'];
  const x=i=>pad+i*(w-pad*2)/(periods.length-1);
  const y=v=>h-pad-((v-min)/(max-min||1))*(h-pad*2);
  let svg = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">`;
  for(let i=0;i<5;i++){ const yy=pad+i*(h-pad*2)/4; svg+=`<line x1="${pad}" y1="${yy}" x2="${w-pad}" y2="${yy}" stroke="#e5e7eb"/>`; }
  periods.forEach((p,i)=>{ svg+=`<text x="${x(i)}" y="${h-12}" text-anchor="middle" font-size="13" fill="#6b7280">${p}</text>`; });
  series.forEach((s,idx)=>{
    const pts=s.values.map((v,i)=>v==null?null:[x(i),y(v)]).filter(Boolean);
    if(pts.length>1){
      svg += `<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${colors[idx]}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    pts.forEach(p=> svg+=`<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="${colors[idx]}"/>`);
    svg += `<text x="${pad+idx*155}" y="20" font-size="13" font-weight="700" fill="${colors[idx]}">${s.game}</text>`;
  });
  svg+='</svg>';
  document.getElementById('lineChart').innerHTML = svg;
}
function renderCompareTable(){
  const metric = document.getElementById('compareMetric').value;
  let html = `<thead><tr><th>Game</th>${D.period_order.map(p=>`<th>${p} ${metricLabel[metric]}</th>`).join('')}</tr></thead><tbody>`;
  selectedGames.forEach(g=>{
    html += `<tr><td>${g}</td>` + D.period_order.map(p=>{
      const r=D.kpi.find(x=>x.title===g && x.period===p);
      return `<td>${fmt(r?.[metric],metric)}</td>`;
    }).join('') + `</tr>`;
  });
  html += `</tbody>`;
  document.getElementById('compareTable').innerHTML = html;
}
function renderCompare(){ renderCompareList(); renderLineChart(); renderCompareTable(); }
function renderRankTable(){
  const period=document.getElementById('rankPeriod').value, metric=document.getElementById('rankMetric').value;
  const arr=rows(period).filter(r=>r[metric]!=null).sort((a,b)=>b[metric]-a[metric]);
  let html=`<thead><tr><th>Rank</th><th>Game</th><th>Launch Date</th><th>${period} ${metricLabel[metric]}</th><th>DAU</th><th>Revenue</th><th>PUR</th><th>ARPPU</th></tr></thead><tbody>`;
  arr.forEach((r,i)=>html+=`<tr><td>${i+1}</td><td>${r.title}</td><td>${(r.launch_date||'').slice(0,10)}</td><td>${fmt(r[metric],metric)}</td><td>${fmt(r.dau,'dau')}</td><td>${fmt(r.revenue_krw,'revenue_krw')}</td><td>${fmt(r.pur,'pur')}</td><td>${fmt(r.arppu,'arppu')}</td></tr>`);
  html+=`</tbody>`;
  document.getElementById('rankTable').innerHTML=html;
}
function renderPrereg(){
  renderBars('preregBars', D.pre_registration.map(x=>({...x, title:x.title, total:x.total})), 'total', 10);
  const arr=D.pre_registration_ggt.filter(x=>x.total);
  let html=`<thead><tr><th>Game</th><th>Region</th><th>Period</th><th>Total</th><th>D+1 DAU</th><th>DAU / Pre-reg</th></tr></thead><tbody>`;
  arr.forEach(r=>html+=`<tr><td>${r.game}</td><td>${r.region||'-'}</td><td>${r.period||'-'}</td><td>${fmt(r.total,'dnu')}</td><td>${fmt(r.dau_1day,'dau')}</td><td>${fmt(r.dau_pre_ratio,'pur')}</td></tr>`);
  html+=`</tbody>`;
  document.getElementById('preregTable').innerHTML=html;
}
function bind(){
  renderSummary(); renderQuickGames(); renderBars('rankingBars', rows('30days'), 'revenue_krw', 8); renderCompare(); renderRankTable(); renderPrereg();
  document.getElementById('metricSelect').onchange=e=>renderBars('rankingBars', rows('30days'), e.target.value, 8);
  document.getElementById('compareMetric').onchange=renderCompare;
  document.getElementById('rankPeriod').onchange=renderRankTable;
  document.getElementById('rankMetric').onchange=renderRankTable;
  document.getElementById('searchInput').oninput=e=>{
    const q=e.target.value.trim().toLowerCase();
    if(!q) return;
    const found=D.games.find(g=>g.title.toLowerCase().includes(q));
    if(found && !selectedGames.includes(found.title)){ selectedGames=[found.title,...selectedGames].slice(0,5); renderQuickGames(); renderCompare(); }
  };
}
bind();
