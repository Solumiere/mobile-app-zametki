/* ===== Мои Цели — офлайн PWA. Все данные хранятся локально в localStorage. ===== */
const KEY = 'moicely_v1';
const todayISO = () => new Date().toISOString().slice(0,10);
const monthKey = (d=new Date()) => d.toISOString().slice(0,7);
const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const MONTHS_N = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const DOW = ['вс','пн','вт','ср','чт','пт','сб'];
const MOODS = ['😄','🙂','😐','😔','😫'];

let state = load();
let curTab = 'dash';
let goalFilter = 'all';

function load(){
  try{ const s = JSON.parse(localStorage.getItem(KEY)); if(s) return s; }catch(e){}
  return { goals:[], habits:[], journal:[], name:'Young' };
}
function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const esc = s => (s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const TITLES = {dash:'Дашборд', goals:'Мои цели', habits:'Привычки', journal:'Дневник'};
function go(tab){
  curTab = tab;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('p-'+tab).classList.add('active');
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===tab));
  document.getElementById('pageTitle').textContent = TITLES[tab];
  window.scrollTo(0,0);
  render();
}
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>go(t.dataset.tab));
document.querySelectorAll('[data-go]').forEach(el=>el.onclick=()=>go(el.dataset.go));
document.getElementById('goalFilter').onclick = e => {
  if(e.target.dataset.f){ goalFilter=e.target.dataset.f;
    document.querySelectorAll('#goalFilter button').forEach(b=>b.classList.toggle('on',b.dataset.f===goalFilter));
    renderGoals(); }
};

function monthStats(){
  const mg = state.goals;
  const total = mg.length, done = mg.filter(g=>g.done).length;
  const pct = total? Math.round(done/total*100):0;
  return {total,done,pct};
}
function habitStreak(h){
  let s=0; const d=new Date();
  for(;;){ const k=d.toISOString().slice(0,10);
    if(h.log&&h.log[k]){ s++; d.setDate(d.getDate()-1); } else break; }
  return s;
}
function bestStreak(){ return state.habits.reduce((m,h)=>Math.max(m,habitStreak(h)),0); }
function habitsToday(){ const k=todayISO();
  const done = state.habits.filter(h=>h.log&&h.log[k]).length;
  return {done, total:state.habits.length}; }

function render(){
  const now=new Date();
  document.getElementById('uname').textContent = state.name||'Young';
  document.getElementById('monthPill').textContent = '📅 '+MONTHS_N[now.getMonth()]+' '+now.getFullYear();
  if(curTab==='dash') renderDash();
  if(curTab==='goals') renderGoals();
  if(curTab==='habits') renderHabits();
  if(curTab==='journal') renderJournal();
}

function goalCard(g){
  const pr = {high:['p-high','Высокий'],mid:['p-mid','Средний'],low:['p-low','Низкий']}[g.priority]||['p-mid','Средний'];
  let meta='';
  if(g.category) meta+=`<span class="tag cat">${esc(g.category)}</span>`;
  if(g.period) meta+=`<span class="tag">${esc(g.period)}</span>`;
  meta+=`<span class="tag ${pr[0]}">${pr[1]}</span>`;
  if(g.deadline){ const dl=new Date(g.deadline); meta+=`<span class="tag date">⏰ ${dl.getDate()} ${MONTHS[dl.getMonth()]}</span>`; }
  return `<div class="item ${g.done?'done':''}">
    <div class="chk ${g.done?'on':''}" data-toggle="${g.id}">✓</div>
    <div class="body"><div class="nm">${esc(g.title)}</div><div class="meta">${meta}</div></div>
    <div class="del" data-delgoal="${g.id}">×</div></div>`;
}

function renderDash(){
  const st=monthStats();
  document.getElementById('dashPct').textContent = st.pct+'%';
  document.getElementById('dashBar').style.width = st.pct+'%';
  document.getElementById('dashGoalsLine').textContent = `${st.done} из ${st.total} целей выполнено`;
  document.getElementById('stStreak').textContent = bestStreak();
  const ht=habitsToday();
  document.getElementById('stHabits').textContent = ht.done+'/'+ht.total;
  document.getElementById('stGoals').textContent = state.goals.filter(g=>!g.done).length;
  document.getElementById('stJournal').textContent = state.journal.filter(j=>(j.date||'').slice(0,7)===monthKey()).length;
  const up = state.goals.filter(g=>!g.done).slice(0,3);
  document.getElementById('dashGoals').innerHTML = up.length
    ? up.map(goalCard).join('')
    : `<div class="empty"><span class="e">🌟</span>Пока нет активных целей. Нажми +, чтобы добавить первую!</div>`;
}

function renderGoals(){
  let list=state.goals.slice().sort((a,b)=>(a.done-b.done)|| (b.created||'').localeCompare(a.created||''));
  if(goalFilter==='active') list=list.filter(g=>!g.done);
  if(goalFilter==='done') list=list.filter(g=>g.done);
  document.getElementById('goalsList').innerHTML = list.length
    ? list.map(goalCard).join('')
    : `<div class="empty"><span class="e">🎯</span>Здесь появятся твои цели</div>`;
}

function renderHabits(){
  const wrap=document.getElementById('habitsList');
  if(!state.habits.length){ wrap.innerHTML=`<div class="empty"><span class="e">🔁</span>Добавь привычку — отмечай каждый день</div>`; return; }
  const days=[]; const d=new Date(); d.setDate(d.getDate()-6);
  for(let i=0;i<7;i++){ days.push(new Date(d)); d.setDate(d.getDate()+1); }
  wrap.innerHTML = state.habits.map(h=>{
    const cells = days.map(dt=>{ const k=dt.toISOString().slice(0,10);
      const on=h.log&&h.log[k]; const isT=k===todayISO();
      return `<div class="day ${on?'on':''} ${isT?'today':''}" data-habit="${h.id}" data-day="${k}">
        <span class="dn">${DOW[dt.getDay()]}</span><span class="dd">${dt.getDate()}</span></div>`;
    }).join('');
    return `<div class="habit"><div class="hh">
      <div class="nm">${esc(h.icon||'⭐')} ${esc(h.title)}</div>
      <div style="display:flex;align-items:center;gap:10px"><span class="streak">🔥 ${habitStreak(h)}</span>
      <span class="del" data-delhabit="${h.id}">×</span></div></div>
      <div class="week">${cells}</div></div>`;
  }).join('');
}

function renderJournal(){
  const list=state.journal.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  document.getElementById('journalList').innerHTML = list.length ? list.map(j=>{
    const dt=new Date(j.date+'T00:00');
    const goods=(j.good||[]).filter(x=>x.trim()).map(x=>`<li>${esc(x)}</li>`).join('');
    return `<div class="jrnl"><div class="jd">
      <span class="jdate">${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}</span>
      <span class="mood">${j.mood||''}</span></div>
      ${goods?`<div class="good"><div class="gl">Хорошие штуки</div><ul>${goods}</ul></div>`:''}
      ${j.text?`<div class="refl">${esc(j.text)}</div>`:''}
      <div style="text-align:right"><span class="del" data-deljrnl="${j.id}">× удалить</span></div></div>`;
  }).join('') : `<div class="empty"><span class="e">📓</span>Запиши, что хорошего случилось сегодня</div>`;
}

document.body.addEventListener('click', e=>{
  const t=e.target.closest('[data-toggle],[data-delgoal],[data-habit],[data-delhabit],[data-deljrnl]');
  if(!t) return;
  if(t.dataset.toggle){ const g=state.goals.find(x=>x.id===t.dataset.toggle);
    g.done=!g.done; g.doneAt=g.done?new Date().toISOString():null; save();
    if(g.done) toast('🎉 Цель выполнена!'); render(); }
  else if(t.dataset.delgoal){ state.goals=state.goals.filter(x=>x.id!==t.dataset.delgoal); save(); render(); }
  else if(t.dataset.habit){ const h=state.habits.find(x=>x.id===t.dataset.habit); const k=t.dataset.day;
    h.log=h.log||{}; if(h.log[k]) delete h.log[k]; else h.log[k]=true; save(); render(); }
  else if(t.dataset.delhabit){ if(confirm('Удалить привычку?')){ state.habits=state.habits.filter(x=>x.id!==t.dataset.delhabit); save(); render(); } }
  else if(t.dataset.deljrnl){ state.journal=state.journal.filter(x=>x.id!==t.dataset.deljrnl); save(); render(); }
});

const overlay=document.getElementById('overlay'), sheet=document.getElementById('sheet');
overlay.onclick=e=>{ if(e.target===overlay) closeSheet(); };
function openSheet(html){ sheet.innerHTML='<div class="grab"></div>'+html; overlay.classList.add('show'); }
function closeSheet(){ overlay.classList.remove('show'); }

document.getElementById('fab').onclick=()=>{
  if(curTab==='habits') addHabitSheet();
  else if(curTab==='journal') addJournalSheet();
  else addGoalSheet();
};

function addGoalSheet(){
  openSheet(`<h3>🎯 Новая цель</h3>
    <label class="fld"><span class="lt">Название цели</span><input id="gT" placeholder="Например: Запустить YouTube-канал" /></label>
    <label class="fld"><span class="lt">Категория</span><input id="gC" placeholder="Работа, Здоровье, Деньги..." /></label>
    <div class="row2">
      <label class="fld"><span class="lt">Приоритет</span><select id="gP">
        <option value="high">🔴 Высокий</option><option value="mid" selected>🟡 Средний</option><option value="low">🔵 Низкий</option></select></label>
      <label class="fld"><span class="lt">Срок (необяз.)</span><input type="date" id="gD" /></label>
    </div>
    <label class="fld"><span class="lt">Период (как пойдёт)</span><input id="gPer" placeholder="Неделя / Месяц / Год / Без срока" /></label>
    <button class="btn" id="gSave">Добавить цель</button>`);
  document.getElementById('gT').focus();
  document.getElementById('gSave').onclick=()=>{
    const title=document.getElementById('gT').value.trim(); if(!title){ toast('Введи название'); return; }
    state.goals.push({id:uid(),title,category:document.getElementById('gC').value.trim(),
      priority:document.getElementById('gP').value,deadline:document.getElementById('gD').value,
      period:document.getElementById('gPer').value.trim(),done:false,created:new Date().toISOString()});
    save(); closeSheet(); go('goals'); toast('✅ Цель добавлена');
  };
}

function addHabitSheet(){
  const EMO=['💪','📚','🏃','💧','🧘','🍎','🛏️','✍️','🎸','💻'];
  openSheet(`<h3>🔁 Новая привычка</h3>
    <label class="fld"><span class="lt">Название</span><input id="hT" placeholder="Например: Читать 20 минут" /></label>
    <label class="fld"><span class="lt">Иконка</span><div class="mood-pick" id="hIcons" style="flex-wrap:wrap">${EMO.map((x,i)=>`<button data-i="${x}" class="${i===0?'on':''}">${x}</button>`).join('')}</div></label>
    <button class="btn" id="hSave">Добавить привычку</button>`);
  let icon='💪';
  document.getElementById('hIcons').onclick=e=>{ if(e.target.dataset.i){ icon=e.target.dataset.i;
    document.querySelectorAll('#hIcons button').forEach(b=>b.classList.toggle('on',b===e.target)); } };
  document.getElementById('hT').focus();
  document.getElementById('hSave').onclick=()=>{
    const title=document.getElementById('hT').value.trim(); if(!title){ toast('Введи название'); return; }
    state.habits.push({id:uid(),title,icon,log:{}}); save(); closeSheet(); go('habits'); toast('✅ Привычка добавлена');
  };
}

function addJournalSheet(){
  openSheet(`<h3>📓 Запись в дневник</h3>
    <label class="fld"><span class="lt">Дата</span><input type="date" id="jD" value="${todayISO()}" /></label>
    <label class="fld"><span class="lt">Настроение</span><div class="mood-pick" id="jMood">${MOODS.map((m,i)=>`<button data-m="${m}" class="${i===0?'on':''}">${m}</button>`).join('')}</div></label>
    <label class="fld"><span class="lt">3 хорошие штуки за день</span>
      <input id="jg1" placeholder="1." style="margin-bottom:8px"/><input id="jg2" placeholder="2." style="margin-bottom:8px"/><input id="jg3" placeholder="3."/></label>
    <label class="fld"><span class="lt">Рефлексия / заметки</span><textarea id="jT" placeholder="Как прошёл день, о чём подумал..."></textarea></label>
    <button class="btn" id="jSave">Сохранить запись</button>`);
  let mood=MOODS[0];
  document.getElementById('jMood').onclick=e=>{ if(e.target.dataset.m){ mood=e.target.dataset.m;
    document.querySelectorAll('#jMood button').forEach(b=>b.classList.toggle('on',b===e.target)); } };
  document.getElementById('jSave').onclick=()=>{
    const good=[document.getElementById('jg1').value,document.getElementById('jg2').value,document.getElementById('jg3').value];
    const text=document.getElementById('jT').value.trim();
    const date=document.getElementById('jD').value||todayISO();
    if(!text && !good.some(x=>x.trim())){ toast('Добавь хотя бы одну запись'); return; }
    state.journal.push({id:uid(),date,mood,good,text}); save(); closeSheet(); go('journal'); toast('✅ Запись сохранена');
  };
}

let tT;
function toast(msg){ const el=document.getElementById('toast'); el.textContent=msg; el.classList.add('show');
  clearTimeout(tT); tT=setTimeout(()=>el.classList.remove('show'),1800); }

let pT;
document.getElementById('pageTitle').addEventListener('pointerdown',()=>{ pT=setTimeout(settingsSheet,650); });
document.getElementById('pageTitle').addEventListener('pointerup',()=>clearTimeout(pT));
document.getElementById('pageTitle').addEventListener('pointerleave',()=>clearTimeout(pT));
function settingsSheet(){
  openSheet(`<h3>⚙️ Настройки и данные</h3>
    <label class="fld"><span class="lt">Твоё имя</span><input id="sName" value="${esc(state.name||'')}" /></label>
    <button class="btn" id="sSaveName">Сохранить имя</button>
    <button class="btn ghost" id="sExport">⬇️ Экспорт данных (JSON)</button>
    <button class="btn ghost" id="sImport">⬆️ Импорт данных</button>
    <input type="file" id="sFile" accept="application/json" style="display:none" />
    <p class="mini">Данные хранятся только на этом устройстве. Делай экспорт, чтобы не потерять их при смене телефона.</p>`);
  document.getElementById('sSaveName').onclick=()=>{ state.name=document.getElementById('sName').value.trim()||'Young'; save(); closeSheet(); render(); toast('Сохранено'); };
  document.getElementById('sExport').onclick=()=>{
    const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='moi-celi-backup-'+todayISO()+'.json'; a.click(); toast('Файл скачан'); };
  document.getElementById('sImport').onclick=()=>document.getElementById('sFile').click();
  document.getElementById('sFile').onchange=e=>{ const f=e.target.files[0]; if(!f) return;
    const r=new FileReader(); r.onload=()=>{ try{ const d=JSON.parse(r.result);
      state={goals:d.goals||[],habits:d.habits||[],journal:d.journal||[],name:d.name||'Young'};
      save(); closeSheet(); render(); toast('✅ Данные восстановлены'); }catch(err){ toast('Ошибка файла'); } };
    r.readAsText(f); };
}

render();
if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js').catch(()=>{}); }
