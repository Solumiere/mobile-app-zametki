/* ===== Мои Цели — офлайн PWA. Данные хранятся локально в localStorage. ===== */
const KEY='moicely_v1';
const todayISO=()=>new Date().toISOString().slice(0,10);
const monthKey=(d=new Date())=>d.toISOString().slice(0,7);
const MONTHS=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const MONTHS_N=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const DOW=['вс','пн','вт','ср','чт','пт','сб'];
const MOODS=['😄','🙂','😐','😕','😔'];
const MOOD_SCORE={'😄':5,'🙂':4,'😐':3,'😕':2,'😔':1};
const CHECK_SVG='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5 19 6.5"/></svg>';
const X_SVG='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6 18 18M18 6 6 18"/></svg>';
const CHEV_SVG='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
const QUOTES=[
  {t:'Путь в тысячу ли начинается с первого шага.',a:'Лао-цзы'},
  {t:'Не важно, насколько медленно ты идёшь, главное — не останавливаться.',a:'Конфуций'},
  {t:'Дисциплина — это мост между целями и их достижением.',a:'Джим Рон'},
  {t:'Секрет успеха в том, чтобы просто начать.',a:'Марк Твен'},
  {t:'Маленькие шаги каждый день приводят к большим результатам.',a:''},
  {t:'Лучшее время посадить дерево было 20 лет назад. Второе лучшее — сегодня.',a:''},
  {t:'Делай сегодня то, за что завтра скажешь себе спасибо.',a:''},
  {t:'Успех — это сумма небольших усилий, повторяемых день за днём.',a:'Роберт Кольер'},
  {t:'Цель без плана — это просто мечта.',a:''},
  {t:'Каждый день — новый шанс изменить свою жизнь.',a:''},
  {t:'Не сравнивай себя с другими, сравнивай с собой вчерашним.',a:''},
  {t:'Мотивация заставляет начать, привычка — продолжать.',a:''},
  {t:'Дорогу осилит идущий.',a:''},
  {t:'Сделай первый шаг, и ты поймёшь, что не всё так страшно.',a:''}
];
const THEMES={
  dark:{'--bg':'#0A0A0B','--surface':'#141416','--surface-2':'#1A1A1D','--line':'rgba(255,255,255,.08)','--line-strong':'rgba(255,255,255,.15)','--ink':'#F4F4F2','--ink-2':'#9B9B9F','--ink-3':'#64646A'},
  light:{'--bg':'#F6F6F4','--surface':'#FFFFFF','--surface-2':'#EFEFEC','--line':'rgba(0,0,0,.07)','--line-strong':'rgba(0,0,0,.14)','--ink':'#1A1A1C','--ink-2':'#5F5F66','--ink-3':'#9A9AA0'}
};
const ACCENTS={
  mono:{dark:['#F4F4F2','#0A0A0B'],light:['#1A1A1C','#FFFFFF']},
  blue:{dark:['#5B8DEF','#06121F'],light:['#2E6FD6','#FFFFFF']},
  green:{dark:['#5FBF8A','#06140D'],light:['#2C9A63','#FFFFFF']},
  amber:{dark:['#E0B25A','#1A1304'],light:['#C98A1E','#FFFFFF']},
  violet:{dark:['#9A8BFF','#0B0820'],light:['#6E5BE0','#FFFFFF']}
};

let state=load();
let curTab='dash';
let goalFilter='all';
let catFilter='all';
let jQ='';
let expanded=new Set();

function load(){
  let s; try{ s=JSON.parse(localStorage.getItem(KEY)); }catch(e){}
  if(!s) s={};
  s.goals=Array.isArray(s.goals)?s.goals:[];
  s.habits=Array.isArray(s.habits)?s.habits:[];
  s.journal=Array.isArray(s.journal)?s.journal:[];
  s.goals.forEach(g=>{ if(!Array.isArray(g.subtasks)) g.subtasks=[]; });
  s.name=s.name||'Young';
  s.settings=Object.assign({theme:'dark',accent:'mono',lastReminded:''}, s.settings||{});
  s.settings.reminder=Object.assign({enabled:false,time:'20:00'}, s.settings.reminder||{});
  return s;
}
function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const esc=s=>(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- оформление (тема + акцент) ---------- */
function applyAppearance(){
  const s=state.settings;
  const t=THEMES[s.theme]||THEMES.dark;
  const ac=(ACCENTS[s.accent]||ACCENTS.mono)[s.theme==='light'?'light':'dark'];
  const r=document.documentElement.style;
  Object.keys(t).forEach(k=>r.setProperty(k,t[k]));
  r.setProperty('--accent',ac[0]); r.setProperty('--accent-ink',ac[1]);
  const m=document.querySelector('meta[name=theme-color]'); if(m) m.setAttribute('content',t['--bg']);
}

/* ---------- навигация ---------- */
const TITLES={dash:'Сегодня', goals:'Цели', habits:'Привычки', journal:'Дневник'};
function go(tab){
  curTab=tab;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('p-'+tab).classList.add('active');
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===tab));
  document.getElementById('pageTitle').textContent=TITLES[tab];
  window.scrollTo(0,0); render();
}
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>go(t.dataset.tab));
document.getElementById('goalFilter').onclick=e=>{ if(e.target.dataset.f){ goalFilter=e.target.dataset.f;
  document.querySelectorAll('#goalFilter button').forEach(b=>b.classList.toggle('on',b.dataset.f===goalFilter)); renderGoals(); } };
document.getElementById('avatar').onclick=settingsSheet;
document.getElementById('monthlyBtn').onclick=monthlySheet;
document.getElementById('jSearch').oninput=e=>{ jQ=e.target.value.trim(); renderJournal(); };

/* ---------- расчёты ---------- */
function monthStats(){ const g=state.goals; const total=g.length, done=g.filter(x=>x.done).length; return {total,done,pct: total?Math.round(done/total*100):0}; }
function habitStreak(h){ let s=0; const d=new Date(); for(;;){ const k=d.toISOString().slice(0,10); if(h.log&&h.log[k]){ s++; d.setDate(d.getDate()-1);} else break; } return s; }
function bestStreak(){ return state.habits.reduce((m,h)=>Math.max(m,habitStreak(h)),0); }
function habitsToday(){ const k=todayISO(); return {done: state.habits.filter(h=>h.log&&h.log[k]).length, total: state.habits.length}; }
function yearProgress(){ const now=new Date(); const y=now.getFullYear(); const a=new Date(y,0,1), b=new Date(y+1,0,1);
  const total=Math.round((b-a)/86400000); const day=Math.floor((now-a)/86400000)+1; const pct=Math.round((now-a)/(b-a)*100);
  return {y,total,day,left:total-day,pct}; }

/* ---------- графики ---------- */
function barChart(data,max){ const W=100,H=40,n=data.length,gap=1.5; const bw=(W-gap*(n-1))/n; let bars='';
  for(let i=0;i<n;i++){ const h=max>0?(data[i]/max)*H:0; const x=i*(bw+gap); const y=H-Math.max(h,0.8);
    bars+='<rect x="'+x.toFixed(2)+'" y="'+y.toFixed(2)+'" width="'+bw.toFixed(2)+'" height="'+Math.max(h,0.8).toFixed(2)+'" rx="1"/>'; }
  return '<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" class="bars">'+bars+'</svg>'; }
function renderHabitChart(){ const days=[]; const d=new Date(); d.setDate(d.getDate()-13);
  for(let i=0;i<14;i++){ const k=d.toISOString().slice(0,10); days.push(state.habits.filter(h=>h.log&&h.log[k]).length); d.setDate(d.getDate()+1); }
  const max=Math.max(1,state.habits.length,...days);
  document.getElementById('habitChart').innerHTML=barChart(days,max);
  document.getElementById('habitChartSum').textContent=days.reduce((a,b)=>a+b,0)+' отметок'; }
function renderCatChart(){ const map={}; state.goals.forEach(g=>{ const c=(g.category||'').trim()||'Без категории'; (map[c]=map[c]||{t:0,d:0}); map[c].t++; if(g.done) map[c].d++; });
  const ent=Object.keys(map).map(k=>[k,map[k]]).sort((a,b)=>b[1].t-a[1].t).slice(0,6);
  const el=document.getElementById('catChart');
  if(!ent.length){ el.innerHTML='<div class="empty">Пока нет целей</div>'; return; }
  const max=Math.max(...ent.map(e=>e[1].t));
  el.innerHTML=ent.map(e=>{ const c=e[0],v=e[1]; return '<div class="cbar"><div class="cbar-top"><span>'+esc(c)+'</span><span>'+v.d+'/'+v.t+'</span></div><div class="cbar-track"><span style="width:'+(v.t/max*100).toFixed(0)+'%"></span><i style="width:'+(v.d/max*100).toFixed(0)+'%"></i></div></div>'; }).join(''); }

/* ---------- цитата дня ---------- */
function quoteOfDay(){ const now=new Date(); const a=new Date(now.getFullYear(),0,1); const day=Math.floor((now-a)/86400000); return QUOTES[day%QUOTES.length]; }

/* ---------- render ---------- */
function render(){ const now=new Date();
  document.getElementById('avatar').textContent=((state.name||'Y').trim()[0]||'Y').toUpperCase();
  document.getElementById('monthPill').textContent=MONTHS_N[now.getMonth()]+' '+now.getFullYear();
  if(curTab==='dash') renderDash();
  if(curTab==='goals') renderGoals();
  if(curTab==='habits') renderHabits();
  if(curTab==='journal') renderJournal(); }

function goalCard(g){ const pr={high:'p-high',mid:'p-mid',low:'p-low'}[g.priority]||'p-mid'; const bits=[];
  if(g.category) bits.push(esc(g.category)); if(g.period) bits.push(esc(g.period));
  if(g.deadline){ const dl=new Date(g.deadline+'T00:00'); bits.push('до '+dl.getDate()+' '+MONTHS[dl.getMonth()]); }
  const st=g.subtasks||[]; const sd=st.filter(s=>s.done).length; if(st.length) bits.push('шаги '+sd+'/'+st.length);
  const meta=bits.length?'<div class="row-meta">'+bits.join(' · ')+'</div>':'';
  const chev=st.length?'<button class="chev '+(expanded.has(g.id)?'open':'')+'" data-expand="'+g.id+'">'+CHEV_SVG+'</button>':'';
  const subs=(st.length&&expanded.has(g.id))?'<div class="subs">'+st.map(s=>'<div class="sub"><button class="scheck '+(s.done?'on':'')+'" data-subtoggle="'+g.id+'|'+s.id+'">'+CHECK_SVG+'</button><span class="'+(s.done?'sd':'')+'">'+esc(s.title)+'</span></div>').join('')+'</div>':'';
  return '<div class="row-wrap"><div class="row '+(g.done?'is-done':'')+'"><button class="check '+(g.done?'on':'')+'" data-toggle="'+g.id+'">'+CHECK_SVG+'</button><div class="row-main" data-editgoal="'+g.id+'"><div class="row-title"><span class="pdot '+pr+'"></span>'+esc(g.title)+'</div>'+meta+'</div>'+chev+'<button class="row-del" data-delgoal="'+g.id+'">'+X_SVG+'</button></div>'+subs+'</div>'; }

function renderDash(){ const st=monthStats();
  document.getElementById('dashPct').textContent=st.pct+'%';
  document.getElementById('dashBar').style.width=st.pct+'%';
  document.getElementById('dashGoalsLine').textContent=st.done+' из '+st.total+' выполнено';
  document.getElementById('stStreak').textContent=bestStreak();
  const ht=habitsToday(); document.getElementById('stHabits').textContent=ht.done+'/'+ht.total;
  document.getElementById('stGoals').textContent=state.goals.filter(g=>!g.done).length;
  document.getElementById('stJournal').textContent=state.journal.filter(j=>(j.date||'').slice(0,7)===monthKey()).length;
  const q=quoteOfDay(); document.getElementById('quoteText').textContent='«'+q.t+'»';
  document.getElementById('quoteAuthor').textContent=q.a?'— '+q.a:'';
  const y=yearProgress(); document.getElementById('yearLabel').textContent=y.y+' год';
  document.getElementById('yearPct').textContent=y.pct+'%'; document.getElementById('yearBar').style.width=y.pct+'%';
  document.getElementById('yearSub').textContent='День '+y.day+' из '+y.total+' · осталось '+y.left+' дн.';
  renderHabitChart(); renderCatChart();
  const rem=document.getElementById('dashReminder');
  if(state.settings.reminder.enabled && ht.total && ht.done<ht.total){ rem.innerHTML='<div class="banner">Сегодня отмечено '+ht.done+' из '+ht.total+' привычек.<button data-go="habits">Открыть</button></div>'; } else rem.innerHTML='';
  const up=state.goals.filter(g=>!g.done).slice(0,3);
  document.getElementById('dashGoals').innerHTML=up.length?up.map(goalCard).join(''):'<div class="empty">Пока нет активных целей.<br>Нажмите + чтобы добавить первую.</div>'; }

function renderCatChips(){ const cats=[]; state.goals.forEach(g=>{ const c=(g.category||'').trim(); if(c&&cats.indexOf(c)<0) cats.push(c); });
  const el=document.getElementById('catChips');
  if(!cats.length){ el.innerHTML=''; catFilter='all'; return; }
  const chips=['<button class="chip '+(catFilter==='all'?'on':'')+'" data-cat="all">Все</button>'];
  cats.forEach(c=>chips.push('<button class="chip '+(catFilter===c?'on':'')+'" data-cat="'+esc(c)+'">'+esc(c)+'</button>'));
  el.innerHTML=chips.join(''); }

function renderGoals(){ renderCatChips();
  let list=state.goals.slice().sort((a,b)=>(a.done-b.done)||(b.created||'').localeCompare(a.created||''));
  if(goalFilter==='active') list=list.filter(g=>!g.done);
  if(goalFilter==='done') list=list.filter(g=>g.done);
  if(catFilter!=='all') list=list.filter(g=>(g.category||'').trim()===catFilter);
  document.getElementById('goalsList').innerHTML=list.length?list.map(goalCard).join(''):'<div class="empty">Здесь появятся ваши цели.</div>'; }

function renderHabits(){ const wrap=document.getElementById('habitsList');
  if(!state.habits.length){ wrap.innerHTML='<div class="empty">Добавьте привычку и отмечайте её каждый день.</div>'; return; }
  const days=[]; const d=new Date(); d.setDate(d.getDate()-6);
  for(let i=0;i<7;i++){ days.push(new Date(d)); d.setDate(d.getDate()+1); }
  wrap.innerHTML=state.habits.map(h=>{ const cells=days.map(dt=>{ const k=dt.toISOString().slice(0,10); const on=h.log&&h.log[k]; const isT=k===todayISO();
    return '<div class="day '+(on?'on':'')+' '+(isT?'today':'')+'" data-habit="'+h.id+'" data-day="'+k+'"><span class="dn">'+DOW[dt.getDay()]+'</span><span class="dd">'+dt.getDate()+'</span></div>'; }).join('');
    return '<div class="card"><div class="habit-head"><div class="habit-name" data-edithabit="'+h.id+'">'+esc(h.title)+'</div><div class="habit-right"><span class="streak">'+habitStreak(h)+' дн.</span><button class="row-del" data-delhabit="'+h.id+'">'+X_SVG+'</button></div></div><div class="week">'+cells+'</div></div>'; }).join(''); }

function renderJournal(){ let list=state.journal.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  if(jQ){ const q=jQ.toLowerCase(); list=list.filter(j=>((j.text||'')+' '+(j.good||[]).join(' ')).toLowerCase().indexOf(q)>=0); }
  document.getElementById('journalList').innerHTML=list.length?list.map(j=>{ const dt=new Date(j.date+'T00:00');
    const goods=(j.good||[]).filter(x=>x.trim()).map(x=>'<div class="g">'+esc(x)+'</div>').join('');
    return '<div class="jrnl"><div class="jrnl-head"><span class="jrnl-date">'+dt.getDate()+' '+MONTHS[dt.getMonth()]+' '+dt.getFullYear()+'</span><span class="jrnl-mood">'+(j.mood||'')+'</span></div>'+(goods?'<div class="jrnl-good">'+goods+'</div>':'')+(j.text?'<div class="jrnl-text">'+esc(j.text)+'</div>':'')+'<div class="jrnl-del"><button data-deljrnl="'+j.id+'">Удалить</button></div></div>'; }).join(''):'<div class="empty">'+(jQ?'Ничего не найдено.':'Запишите, что хорошего случилось сегодня.')+'</div>'; }

/* ---------- клики по спискам ---------- */
document.body.addEventListener('click', e=>{
  const goEl=e.target.closest('[data-go]'); if(goEl){ go(goEl.dataset.go); return; }
  const catEl=e.target.closest('[data-cat]'); if(catEl){ catFilter=catEl.dataset.cat; renderGoals(); return; }
  const t=e.target.closest('[data-toggle],[data-delgoal],[data-editgoal],[data-expand],[data-subtoggle],[data-habit],[data-edithabit],[data-delhabit],[data-deljrnl]');
  if(!t) return;
  if(t.dataset.toggle){ const g=state.goals.find(x=>x.id===t.dataset.toggle); g.done=!g.done; g.doneAt=g.done?new Date().toISOString():null; save(); if(g.done) toast('Цель выполнена'); render(); }
  else if(t.dataset.delgoal){ state.goals=state.goals.filter(x=>x.id!==t.dataset.delgoal); save(); render(); }
  else if(t.dataset.editgoal){ const g=state.goals.find(x=>x.id===t.dataset.editgoal); if(g) goalSheet(g); }
  else if(t.dataset.expand){ const id=t.dataset.expand; expanded.has(id)?expanded.delete(id):expanded.add(id); render(); }
  else if(t.dataset.subtoggle){ const p=t.dataset.subtoggle.split('|'); const g=state.goals.find(x=>x.id===p[0]); const s=g&&g.subtasks.find(x=>x.id===p[1]); if(s){ s.done=!s.done; save(); render(); } }
  else if(t.dataset.habit){ const h=state.habits.find(x=>x.id===t.dataset.habit); const k=t.dataset.day; h.log=h.log||{}; if(h.log[k]) delete h.log[k]; else h.log[k]=true; save(); render(); }
  else if(t.dataset.edithabit){ const h=state.habits.find(x=>x.id===t.dataset.edithabit); if(h) habitSheet(h); }
  else if(t.dataset.delhabit){ if(confirm('Удалить привычку?')){ state.habits=state.habits.filter(x=>x.id!==t.dataset.delhabit); save(); render(); } }
  else if(t.dataset.deljrnl){ state.journal=state.journal.filter(x=>x.id!==t.dataset.deljrnl); save(); render(); }
});

/* ---------- модальные окна ---------- */
const overlay=document.getElementById('overlay'), sheet=document.getElementById('sheet');
overlay.onclick=e=>{ if(e.target===overlay) closeSheet(); };
function openSheet(html){ sheet.innerHTML='<div class="grab"></div>'+html; overlay.classList.add('show'); }
function closeSheet(){ overlay.classList.remove('show'); }
document.getElementById('fab').onclick=()=>{ if(curTab==='habits') habitSheet(); else if(curTab==='journal') journalSheet(); else goalSheet(); };

function goalSheet(goal){ const g=goal||{}; let subs=(g.subtasks||[]).map(s=>({id:s.id,title:s.title,done:!!s.done}));
  openSheet('<h3>'+(goal?'Редактировать цель':'Новая цель')+'</h3>'+
    '<label class="fld"><span class="lt">Название</span><input id="gT" placeholder="Например: запустить канал" /></label>'+
    '<label class="fld"><span class="lt">Категория</span><input id="gC" placeholder="Работа, здоровье, деньги…" /></label>'+
    '<div class="row2"><label class="fld"><span class="lt">Приоритет</span><select id="gP"><option value="high">Высокий</option><option value="mid">Средний</option><option value="low">Низкий</option></select></label><label class="fld"><span class="lt">Срок</span><input type="date" id="gD" /></label></div>'+
    '<label class="fld"><span class="lt">Период</span><input id="gPer" placeholder="Неделя / месяц / год / без срока" /></label>'+
    '<label class="fld"><span class="lt">Шаги (по желанию)</span><div id="subList"></div><button type="button" class="btn ghost" id="subAdd" style="margin-top:8px">+ Добавить шаг</button></label>'+
    '<button class="btn" id="gSave">'+(goal?'Сохранить':'Добавить цель')+'</button>'+
    (goal?'<button class="btn ghost" id="gDel">Удалить цель</button>':''));
  document.getElementById('gT').value=g.title||'';
  document.getElementById('gC').value=g.category||'';
  document.getElementById('gP').value=g.priority||'mid';
  document.getElementById('gD').value=g.deadline||'';
  document.getElementById('gPer').value=g.period||'';
  function renderSubs(){ const box=document.getElementById('subList');
    box.innerHTML=subs.map((s,i)=>'<div class="sub-edit"><input data-si="'+i+'" placeholder="Шаг '+(i+1)+'" /><button type="button" class="sub-rm" data-sx="'+i+'">'+X_SVG+'</button></div>').join('');
    subs.forEach((s,i)=>{ const inp=box.querySelector('input[data-si="'+i+'"]'); inp.value=s.title; inp.oninput=()=>{ subs[i].title=inp.value; }; });
    box.querySelectorAll('.sub-rm').forEach(b=>b.onclick=()=>{ subs.splice(+b.dataset.sx,1); renderSubs(); }); }
  renderSubs();
  document.getElementById('subAdd').onclick=()=>{ subs.push({id:uid(),title:'',done:false}); renderSubs(); };
  document.getElementById('gT').focus();
  document.getElementById('gSave').onclick=()=>{ const title=document.getElementById('gT').value.trim(); if(!title){ toast('Введите название'); return; }
    const data={title:title,category:document.getElementById('gC').value.trim(),priority:document.getElementById('gP').value,deadline:document.getElementById('gD').value,period:document.getElementById('gPer').value.trim(),subtasks:subs.filter(s=>s.title.trim()).map(s=>({id:s.id,title:s.title.trim(),done:s.done}))};
    if(goal){ Object.assign(goal,data); } else { state.goals.push(Object.assign({id:uid(),done:false,created:new Date().toISOString()},data)); }
    save(); closeSheet(); go('goals'); toast(goal?'Сохранено':'Цель добавлена'); };
  if(goal){ document.getElementById('gDel').onclick=()=>{ state.goals=state.goals.filter(x=>x.id!==goal.id); save(); closeSheet(); go('goals'); toast('Удалено'); }; }
}

function habitSheet(habit){ const h=habit||{};
  openSheet('<h3>'+(habit?'Редактировать привычку':'Новая привычка')+'</h3>'+
    '<label class="fld"><span class="lt">Название</span><input id="hT" placeholder="Например: читать 20 минут" /></label>'+
    '<button class="btn" id="hSave">'+(habit?'Сохранить':'Добавить привычку')+'</button>'+
    (habit?'<button class="btn ghost" id="hDel">Удалить привычку</button>':''));
  document.getElementById('hT').value=h.title||''; document.getElementById('hT').focus();
  document.getElementById('hSave').onclick=()=>{ const title=document.getElementById('hT').value.trim(); if(!title){ toast('Введите название'); return; }
    if(habit){ habit.title=title; } else { state.habits.push({id:uid(),title:title,log:{}}); }
    save(); closeSheet(); go('habits'); toast(habit?'Сохранено':'Привычка добавлена'); };
  if(habit){ document.getElementById('hDel').onclick=()=>{ state.habits=state.habits.filter(x=>x.id!==habit.id); save(); closeSheet(); go('habits'); toast('Удалено'); }; }
}

function journalSheet(){ openSheet('<h3>Запись в дневник</h3>'+
    '<label class="fld"><span class="lt">Дата</span><input type="date" id="jD" value="'+todayISO()+'" /></label>'+
    '<label class="fld"><span class="lt">Настроение</span><div class="mood-pick" id="jMood">'+MOODS.map((m,i)=>'<button data-m="'+m+'" class="'+(i===1?'on':'')+'">'+m+'</button>').join('')+'</div></label>'+
    '<label class="fld"><span class="lt">3 хорошие штуки за день</span><input id="jg1" placeholder="1" style="margin-bottom:8px"/><input id="jg2" placeholder="2" style="margin-bottom:8px"/><input id="jg3" placeholder="3"/></label>'+
    '<label class="fld"><span class="lt">Рефлексия</span><textarea id="jT" placeholder="Как прошёл день, о чём подумал…"></textarea></label>'+
    '<button class="btn" id="jSave">Сохранить запись</button>');
  let mood=MOODS[1];
  document.getElementById('jMood').onclick=e=>{ if(e.target.dataset.m){ mood=e.target.dataset.m; document.querySelectorAll('#jMood button').forEach(b=>b.classList.toggle('on',b===e.target)); } };
  document.getElementById('jSave').onclick=()=>{ const good=[document.getElementById('jg1').value,document.getElementById('jg2').value,document.getElementById('jg3').value]; const text=document.getElementById('jT').value.trim(); const date=document.getElementById('jD').value||todayISO();
    if(!text && !good.some(x=>x.trim())){ toast('Добавьте хотя бы одну запись'); return; }
    state.journal.push({id:uid(),date:date,mood:mood,good:good,text:text}); save(); closeSheet(); go('journal'); toast('Запись сохранена'); };
}

function monthlySheet(){ const mk=monthKey(); const mName=MONTHS_N[new Date().getMonth()];
  const gDone=state.goals.filter(g=>g.done&&(g.doneAt||'').slice(0,7)===mk).length;
  const gActive=state.goals.filter(g=>!g.done).length;
  const hMarks=state.habits.reduce((n,h)=>n+Object.keys(h.log||{}).filter(k=>k.slice(0,7)===mk).length,0);
  const js=state.journal.filter(j=>(j.date||'').slice(0,7)===mk);
  const moods=js.map(j=>MOOD_SCORE[j.mood]).filter(Boolean);
  const avg=moods.length?moods.reduce((a,b)=>a+b,0)/moods.length:0;
  const avgEmoji=avg?MOODS[Math.min(4,Math.max(0,5-Math.round(avg)))]:'—';
  const row=(l,v)=>'<div class="mrow"><span>'+l+'</span><b>'+v+'</b></div>';
  let note='Хорошее начало — продолжай в том же духе!';
  const st=monthStats(); if(st.pct>=70) note='Отличный месяц! Ты держишь курс.'; else if(st.pct>=40) note='Уверенный прогресс. Ещё немного — и цели закрыты.';
  openSheet('<h3>Итоги · '+mName+'</h3>'+
    '<div class="msum">'+row('Целей выполнено за месяц',gDone)+row('Активных целей сейчас',gActive)+row('Лучший стрик привычек',bestStreak()+' дн.')+row('Отметок привычек за месяц',hMarks)+row('Записей в дневнике',js.length)+row('Среднее настроение',avgEmoji)+'</div>'+
    '<div class="callout-note">'+note+'</div>'+
    '<button class="btn ghost" onclick="closeSheet()">Закрыть</button>');
}

function settingsSheet(){ const s=state.settings;
  openSheet('<h3>Настройки</h3>'+
    '<label class="fld"><span class="lt">Ваше имя</span><input id="sName" /></label>'+
    '<label class="fld"><span class="lt">Тема</span><div class="seg" id="themeSeg"><button data-t="dark" class="'+(s.theme==='dark'?'on':'')+'">Тёмная</button><button data-t="light" class="'+(s.theme==='light'?'on':'')+'">Светлая</button></div></label>'+
    '<label class="fld"><span class="lt">Акцент</span><div class="swatches" id="swatches">'+Object.keys(ACCENTS).map(k=>'<button data-acc="'+k+'" class="swatch '+(s.accent===k?'on':'')+'" style="background:'+ACCENTS[k][s.theme==='light'?'light':'dark'][0]+'"></button>').join('')+'</div></label>'+
    '<label class="fld"><span class="lt">Ежедневное напоминание</span><div class="rem-row"><label class="switch"><input type="checkbox" id="remOn" '+(s.reminder.enabled?'checked':'')+'/><span></span></label><input type="time" id="remTime" value="'+s.reminder.time+'" /></div><p class="mini" style="text-align:left;margin-top:8px">Срабатывает, пока приложение открыто или висит в фоне. Пуш при полностью закрытом приложении требует сервера.</p></label>'+
    '<button class="btn ghost" id="sExport">Экспорт данных (резервная копия)</button>'+
    '<button class="btn ghost" id="sImport">Импорт данных</button>'+
    '<input type="file" id="sFile" accept="application/json" style="display:none" />'+
    '<button class="btn" onclick="closeSheet()" style="margin-top:14px">Готово</button>'+
    '<p class="mini">Данные хранятся только на этом устройстве. Делайте экспорт, чтобы не потерять их при смене телефона.</p>');
  const nameInp=document.getElementById('sName'); nameInp.value=state.name||'';
  nameInp.oninput=()=>{ state.name=nameInp.value.trim()||'Young'; save(); };
  document.getElementById('themeSeg').onclick=e=>{ if(e.target.dataset.t){ state.settings.theme=e.target.dataset.t; save(); applyAppearance();
    document.querySelectorAll('#themeSeg button').forEach(b=>b.classList.toggle('on',b.dataset.t===state.settings.theme));
    document.querySelectorAll('#swatches .swatch').forEach(b=>b.style.background=ACCENTS[b.dataset.acc][state.settings.theme==='light'?'light':'dark'][0]); } };
  document.getElementById('swatches').onclick=e=>{ const b=e.target.closest('[data-acc]'); if(b){ state.settings.accent=b.dataset.acc; save(); applyAppearance();
    document.querySelectorAll('#swatches .swatch').forEach(x=>x.classList.toggle('on',x.dataset.acc===state.settings.accent)); } };
  document.getElementById('remOn').onchange=function(){ if(this.checked){ if('Notification' in window && Notification.permission!=='granted'){ Notification.requestPermission().then(p=>{ if(p!=='granted') toast('Уведомления не разрешены'); }); } state.settings.reminder.enabled=true; } else state.settings.reminder.enabled=false; save(); };
  document.getElementById('remTime').onchange=function(){ state.settings.reminder.time=this.value||'20:00'; save(); };
  document.getElementById('sExport').onclick=()=>{ const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='moi-celi-backup-'+todayISO()+'.json'; a.click(); toast('Файл скачан'); };
  document.getElementById('sImport').onclick=()=>document.getElementById('sFile').click();
  document.getElementById('sFile').onchange=e=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ const d=JSON.parse(r.result); state.goals=d.goals||[]; state.habits=d.habits||[]; state.journal=d.journal||[]; state.name=d.name||'Young'; if(d.settings) state.settings=Object.assign(state.settings,d.settings); state.goals.forEach(g=>{ if(!Array.isArray(g.subtasks)) g.subtasks=[]; }); save(); closeSheet(); applyAppearance(); render(); toast('Данные восстановлены'); }catch(err){ toast('Ошибка файла'); } }; r.readAsText(f); };
}

/* ---------- напоминания ---------- */
function checkReminder(){ const r=state.settings.reminder; if(!r||!r.enabled) return;
  if(!('Notification' in window) || Notification.permission!=='granted') return;
  const now=new Date(); const hh=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0'); const t=todayISO();
  if(hh===r.time && state.settings.lastReminded!==t){ state.settings.lastReminded=t; save(); const ht=habitsToday();
    const body=ht.total?('Привычки сегодня: '+ht.done+'/'+ht.total+'. Не забудь про цели и дневник!'):'Загляни в приложение и отметь прогресс за день.';
    try{ new Notification('Мои Цели', {body:body, icon:'icon.svg'}); }catch(e){} } }
setInterval(checkReminder, 30000);

/* ---------- toast ---------- */
let tT; function toast(msg){ const el=document.getElementById('toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(tT); tT=setTimeout(()=>el.classList.remove('show'),1800); }

/* ---------- старт ---------- */
applyAppearance(); render(); checkReminder();
if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js').catch(()=>{}); }
