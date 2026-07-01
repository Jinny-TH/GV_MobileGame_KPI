const D = window.PORTAL_DATA;
let selectedGames = D.games.slice(0,4).map(g=>g.title);
let currentDetailGame = D.games[0]?.title;
let activeDetailTab = 'overview';
let dashboardFiltered = D.games;

const KRW = v => {
  if(v==null || isNaN(v)) return '-';
  const n = Number(v);
  if(Math.abs(n)>=1e9) return (n/1e9).toFixed(1)+'B';
  if(Math.abs(n)>=1e6) return (n/1e6).toFixed(1)+'M';
  if(Math.abs(n)>=1e3) return (n/1e3).toFixed(1)+'K';
  return n.toLocaleString();
};
const fmt = (v, metric) => {
  if(v==null || isNaN(v)) return '-';
  if(metric==='pur' || String(metric).includes('share') || String(metric).includes('ratio')) return (Number(v)*100).toFixed(1)+'%';
  if(String(metric).includes('revenue') || metric==='arpu' || metric==='arppu') return KRW(v);
  return Math.round(Number(v)).toLocaleString();
};
const metricLabel = { revenue_krw:'Revenue', dau:'DAU', dnu:'DNU', pu:'PU', pur:'PUR', arpu:'ARPU', arppu:'ARPPU' };
const periods = D.period_order || ['1day','10days','15days','30days','60days'];

function switchView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active', n.dataset.view===id));
  if(id==='dashboard') renderDashboardCards();
  if(id==='library') renderLibrary();
  if(id==='detail') renderGameDetail(currentDetailGame);
  if(id==='compare') renderCompare();
  if(id==='ranking') renderRankTable();
  if(id==='prereg') renderPrereg();
  window.scrollTo({top:0, behavior:'smooth'});
}
document.querySelectorAll('.nav').forEach(btn=>btn.onclick=()=>switchView(btn.dataset.view));

function rows(period){ return D.kpi.filter(r=>r.period===period); }
function gameRows(title){ return D.kpi.filter(r=>r.title===title).sort((a,b)=>periods.indexOf(a.period)-periods.indexOf(b.period)); }
function topRow(period, metric){ return rows(period).filter(r=>r[metric]!=null).sort((a,b)=>b[metric]-a[metric])[0]; }
function getKpi(title, period='30days'){ return D.kpi.find(r=>r.title===title && r.period===period) || D.kpi.find(r=>r.title===title) || {}; }
function getYear(g){ return g.launch_date ? String(new Date(g.launch_date).getFullYear()) : ''; }
function unique(arr){ return [...new Set(arr.filter(Boolean))].sort(); }
function scoreFor(title){
  const r30=getKpi(title,'30days'), r1=getKpi(title,'1day');
  const revRank = rankPercent('30days','revenue_krw', r30.revenue_krw);
  const dauRank = rankPercent('1day','dau', r1.dau);
  const purRank = rankPercent('30days','pur', r30.pur);
  const score = Math.round((revRank*0.45 + dauRank*0.25 + purRank*0.30) || 50);
  return Math.max(45, Math.min(98, score));
}
function rankPercent(period, metric, value){
  if(value==null) return 50;
  const arr=rows(period).filter(r=>r[metric]!=null).map(r=>Number(r[metric])).sort((a,b)=>a-b);
  const idx=arr.findIndex(v=>v>=value);
  return Math.round(((idx+1)/arr.length)*100);
}

function renderSummary(){
  const games = D.games.length;
  const regions = unique(D.games.map(g=>g.region)).length;
  const years = unique(D.games.map(getYear));
  const topRev = topRow('30days','revenue_krw');
  const cards = [
    ['Games', games, '비교 가능한 런칭 게임', '+ Library'],
    ['Regions', regions, '서비스 지역 기준', '+ Filter'],
    ['Launch Years', years.length ? `${years[0]}~${years[years.length-1]}` : '-', '런칭 히스토리 범위', '+ History'],
    ['Top D+30 Revenue', topRev?.title || '-', fmt(topRev?.revenue_krw,'revenue_krw'), '+ Benchmark'],
  ];
  document.getElementById('summaryCards').innerHTML = cards.map(c=>`
    <div class="card"><small>${c[0]}</small><strong>${c[1]}</strong><em>${c[2]}</em><span class="delta">${c[3]}</span></div>
  `).join('');
}
function renderBars(containerId, data, metric, limit=10){
  const arr = data.filter(r=>r[metric]!=null).sort((a,b)=>b[metric]-a[metric]).slice(0,limit);
  const max = Math.max(...arr.map(r=>Number(r[metric]||0)),1);
  document.getElementById(containerId).innerHTML = arr.map((r,i)=>`
    <div class="bar-row" onclick="openGame('${(r.title || r.game || '').replace(/'/g,"\\'")}')">
      <span class="bar-rank">${i+1}</span>
      <b>${r.title || r.game}<div class="bar-sub">${r.region || ''}</div></b>
      <div class="bar-bg"><div class="bar-fill" style="width:${Math.max(2,(Number(r[metric]||0)/max)*100)}%"></div></div>
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
function setupFilters(){
  const region=document.getElementById('filterRegion'), year=document.getElementById('filterYear');
  if(region && region.options.length===1) region.innerHTML += unique(D.games.map(g=>g.region)).map(x=>`<option>${x}</option>`).join('');
  if(year && year.options.length===1) year.innerHTML += unique(D.games.map(getYear)).map(x=>`<option>${x}</option>`).join('');
}
function applyDashboardFilter(){
  const q=(document.getElementById('filterGame').value || '').toLowerCase();
  const region=document.getElementById('filterRegion').value;
  const year=document.getElementById('filterYear').value;
  dashboardFiltered = D.games.filter(g=>(!q || g.title.toLowerCase().includes(q)) && (!region || g.region===region) && (!year || getYear(g)===year));
  renderDashboardCards();
}
function renderDashboardCards(){
  const metric=document.getElementById('filterMetric')?.value || 'revenue_krw';
  const el=document.getElementById('dashboardGameCards');
  if(!el) return;
  document.getElementById('filterCount').textContent = `${dashboardFiltered.length} games`;
  el.innerHTML = dashboardFiltered.slice(0,9).map(g=>gameCardHtml(g, metric)).join('') || '<div class="empty">검색 결과가 없습니다.</div>';
}
function gameCardHtml(g, metric='revenue_krw'){
  const r30=getKpi(g.title,'30days'), r1=getKpi(g.title,'1day');
  const score=scoreFor(g.title);
  return `<article class="game-card" onclick="openGame('${g.title.replace(/'/g,"\\'")}')">
    <h4>${g.title}</h4>
    <div class="game-meta"><span class="tag">${g.region || 'Global'}</span><span class="tag green">${getYear(g) || 'No Date'}</span><span class="tag gray">${(g.periods||[]).length} periods</span></div>
    <div class="mini-kpi">
      <div><small>D+30 Rev</small><b>${fmt(r30.revenue_krw,'revenue_krw')}</b></div>
      <div><small>D+1 DAU</small><b>${fmt(r1.dau,'dau')}</b></div>
      <div><small>D+30 PUR</small><b>${fmt(r30.pur,'pur')}</b></div>
      <div><small>D+30 ARPPU</small><b>${fmt(r30.arppu,'arppu')}</b></div>
    </div>
    <div class="game-score"><span class="caption">Launch Score</span><div class="score-circle" style="--score:${score}%"><span>${score}</span></div></div>
  </article>`;
}
function renderLibrary(){
  const q=(document.getElementById('librarySearch')?.value || '').toLowerCase();
  const arr=D.games.filter(g=>!q || g.title.toLowerCase().includes(q));
  document.getElementById('gameLibrary').innerHTML=arr.map(g=>gameCardHtml(g)).join('');
}
function openGame(title){
  const match = D.games.find(g=>g.title===title) || D.games.find(g=>title && g.title.includes(title));
  if(!match) return;
  currentDetailGame = match.title;
  switchView('detail');
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
  const series = selectedGames.map(g=>({game:g, values:periods.map(p=>getKpi(g,p)?.[metric] ?? null)}));
  document.getElementById('lineChart').innerHTML = lineSvg(series, metric, 900, 320);
}
function lineSvg(series, metric='revenue_krw', w=900, h=320){
  const vals = series.flatMap(s=>s.values).filter(v=>v!=null);
  const max = Math.max(...vals,1), min = Math.min(...vals,0);
  const pad=44, colors=['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'];
  const x=i=>pad+i*(w-pad*2)/(periods.length-1);
  const y=v=>h-pad-((v-min)/(max-min||1))*(h-pad*2);
  let svg = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">`;
  for(let i=0;i<5;i++){ const yy=pad+i*(h-pad*2)/4; svg+=`<line x1="${pad}" y1="${yy}" x2="${w-pad}" y2="${yy}" stroke="#e5e7eb"/>`; }
  periods.forEach((p,i)=>{ svg+=`<text x="${x(i)}" y="${h-12}" text-anchor="middle" font-size="13" fill="#6b7280">${p}</text>`; });
  series.forEach((s,idx)=>{
    const pts=s.values.map((v,i)=>v==null?null:[x(i),y(v)]).filter(Boolean);
    if(pts.length>1) svg += `<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${colors[idx%colors.length]}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
    pts.forEach(p=> svg+=`<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="${colors[idx%colors.length]}"/>`);
    svg += `<text x="${pad+idx*155}" y="20" font-size="13" font-weight="700" fill="${colors[idx%colors.length]}">${s.game}</text>`;
  });
  return svg+'</svg>';
}
function renderCompareTable(){
  const metric = document.getElementById('compareMetric').value;
  let html = `<thead><tr><th>Game</th>${periods.map(p=>`<th>${p} ${metricLabel[metric]}</th>`).join('')}</tr></thead><tbody>`;
  selectedGames.forEach(g=>{
    html += `<tr onclick="openGame('${g.replace(/'/g,"\\'")}')"><td>${g}</td>` + periods.map(p=>`<td>${fmt(getKpi(g,p)?.[metric],metric)}</td>`).join('') + `</tr>`;
  });
  html += `</tbody>`;
  document.getElementById('compareTable').innerHTML = html;
}
function renderCompare(){ renderCompareList(); renderLineChart(); renderCompareTable(); }
function renderRankTable(){
  const period=document.getElementById('rankPeriod').value, metric=document.getElementById('rankMetric').value;
  const arr=rows(period).filter(r=>r[metric]!=null).sort((a,b)=>b[metric]-a[metric]);
  let html=`<thead><tr><th>Rank</th><th>Game</th><th>Launch Date</th><th>${period} ${metricLabel[metric]}</th><th>DAU</th><th>Revenue</th><th>PUR</th><th>ARPPU</th></tr></thead><tbody>`;
  arr.forEach((r,i)=>html+=`<tr onclick="openGame('${r.title.replace(/'/g,"\\'")}')"><td>${i+1}</td><td>${r.title}</td><td>${(r.launch_date||'').slice(0,10)}</td><td>${fmt(r[metric],metric)}</td><td>${fmt(r.dau,'dau')}</td><td>${fmt(r.revenue_krw,'revenue_krw')}</td><td>${fmt(r.pur,'pur')}</td><td>${fmt(r.arppu,'arppu')}</td></tr>`);
  document.getElementById('rankTable').innerHTML=html+`</tbody>`;
}
function renderPrereg(){
  renderBars('preregBars', D.pre_registration.map(x=>({...x, title:x.title, total:x.total})), 'total', 10);
  const arr=D.pre_registration_ggt.filter(x=>x.total);
  let html=`<thead><tr><th>Game</th><th>Region</th><th>Period</th><th>Total</th><th>D+1 DAU</th><th>DAU / Pre-reg</th></tr></thead><tbody>`;
  arr.forEach(r=>html+=`<tr><td>${r.game}</td><td>${r.region||'-'}</td><td>${r.period||'-'}</td><td>${fmt(r.total,'dnu')}</td><td>${fmt(r.dau_1day,'dau')}</td><td>${fmt(r.dau_pre_ratio,'pur')}</td></tr>`);
  document.getElementById('preregTable').innerHTML=html+`</tbody>`;
}

function renderGameDetail(title){
  const g=D.games.find(x=>x.title===title) || D.games[0];
  if(!g) return;
  currentDetailGame=g.title;
  const r30=getKpi(g.title,'30days'), r1=getKpi(g.title,'1day'), score=scoreFor(g.title);
  const revSeries=[{game:g.title, values:periods.map(p=>getKpi(g.title,p)?.revenue_krw ?? null)}];
  const dauSeries=[{game:g.title, values:periods.map(p=>getKpi(g.title,p)?.dau ?? null)}];
  document.getElementById('gameDetail').innerHTML=`
    <div class="detail-hero">
      <div class="detail-top">
        <div class="detail-title"><p class="eyebrow">Game Profile</p><h2>${g.title}</h2><p class="caption">${g.region || 'Global'} 런칭 성과 상세</p></div>
        <div class="score-box"><span>Launch Score</span><strong>${score}</strong><span>Revenue · DAU · PUR 기준</span></div>
      </div>
      <div class="profile-grid">
        <div class="profile-item"><small>Launch Date</small><b>${(g.launch_date||'-').slice(0,10)}</b></div>
        <div class="profile-item"><small>Region</small><b>${g.region || '-'}</b></div>
        <div class="profile-item"><small>Genre</small><b>MMORPG / Ragnarok IP</b></div>
        <div class="profile-item"><small>Publisher</small><b>GGT / Gravity</b></div>
        <div class="profile-item"><small>Periods</small><b>${(g.periods||[]).join(' · ')}</b></div>
      </div>
    </div>
    <div class="tabs"><button class="tab ${activeDetailTab==='overview'?'active':''}" onclick="setDetailTab('overview')">Overview</button><button class="tab ${activeDetailTab==='kpi'?'active':''}" onclick="setDetailTab('kpi')">KPI Table</button><button class="tab ${activeDetailTab==='timeline'?'active':''}" onclick="setDetailTab('timeline')">Timeline</button></div>
    <div id="detailTabContent"></div>`;
  const content=document.getElementById('detailTabContent');
  if(activeDetailTab==='overview'){
    content.innerHTML=`<div class="cards cards-v2"><div class="card"><small>D+30 Revenue</small><strong>${fmt(r30.revenue_krw,'revenue_krw')}</strong><em>누적 매출 기준</em></div><div class="card"><small>D+1 DAU</small><strong>${fmt(r1.dau,'dau')}</strong><em>런칭 당일 활동</em></div><div class="card"><small>D+30 PUR</small><strong>${fmt(r30.pur,'pur')}</strong><em>결제 전환율</em></div><div class="card"><small>D+30 ARPPU</small><strong>${fmt(r30.arppu,'arppu')}</strong><em>결제자 객단가</em></div></div><div class="grid two"><section class="panel"><div class="panel-head"><h3>Revenue Growth</h3><span class="caption">D+1~D+60</span></div><div class="line-chart">${lineSvg(revSeries,'revenue_krw')}</div></section><section class="panel"><div class="panel-head"><h3>DAU Growth</h3><span class="caption">D+1~D+60</span></div><div class="line-chart">${lineSvg(dauSeries,'dau')}</div></section></div>`;
  } else if(activeDetailTab==='kpi'){
    let html=`<section class="panel"><div class="table-wrap"><table><thead><tr><th>Period</th><th>DNU</th><th>DAU</th><th>Revenue</th><th>PU</th><th>PUR</th><th>ARPU</th><th>ARPPU</th></tr></thead><tbody>`;
    periods.forEach(p=>{ const r=getKpi(g.title,p); html+=`<tr><td>${p}</td><td>${fmt(r.dnu,'dnu')}</td><td>${fmt(r.dau,'dau')}</td><td>${fmt(r.revenue_krw,'revenue_krw')}</td><td>${fmt(r.pu,'pu')}</td><td>${fmt(r.pur,'pur')}</td><td>${fmt(r.arpu,'arpu')}</td><td>${fmt(r.arppu,'arppu')}</td></tr>`; });
    content.innerHTML=html+`</tbody></table></div></section>`;
  } else {
    content.innerHTML=`<section class="panel"><h3>Launch Timeline</h3><div class="timeline"><div class="timeline-item"><div class="timeline-date">D-60 ~ D-1</div><div class="timeline-body"><b>Pre-registration / UA Campaign</b><p class="caption">사전예약, 마케팅 집행, 스토어 피처링 정보 저장 영역</p></div></div><div class="timeline-item"><div class="timeline-date">D-Day</div><div class="timeline-body"><b>Official Launch</b><p class="caption">런칭일: ${(g.launch_date||'-').slice(0,10)}</p></div></div><div class="timeline-item"><div class="timeline-date">D+1</div><div class="timeline-body"><b>Initial Response</b><p class="caption">DAU ${fmt(r1.dau,'dau')} / Revenue ${fmt(r1.revenue_krw,'revenue_krw')}</p></div></div><div class="timeline-item"><div class="timeline-date">D+30</div><div class="timeline-body"><b>First Month Benchmark</b><p class="caption">Revenue ${fmt(r30.revenue_krw,'revenue_krw')} / PUR ${fmt(r30.pur,'pur')}</p></div></div></div></section>`;
  }
}
function setDetailTab(tab){ activeDetailTab=tab; renderGameDetail(currentDetailGame); }

function bind(){
  setupFilters(); renderSummary(); renderQuickGames(); renderBars('rankingBars', rows('30days'), 'revenue_krw', 8); renderCompare(); renderRankTable(); renderPrereg(); renderDashboardCards();
  document.getElementById('metricSelect').onchange=e=>renderBars('rankingBars', rows('30days'), e.target.value, 8);
  document.getElementById('compareMetric').onchange=renderCompare;
  document.getElementById('rankPeriod').onchange=renderRankTable;
  document.getElementById('rankMetric').onchange=renderRankTable;
  document.getElementById('librarySearch')?.addEventListener('input', renderLibrary);
  document.getElementById('searchInput').oninput=e=>{
    const q=e.target.value.trim().toLowerCase();
    if(!q) return;
    const found=D.games.find(g=>g.title.toLowerCase().includes(q));
    if(found) openGame(found.title);
  };
}
bind();
