/* ===== Доп. функции: достижения, аналитика, повторы, PIN, напоминания ===== */
(function(){
const ACHIEVEMENTS=[
  {id:'g1',ic:'🌱',t:'Первый шаг',d:'Создать первую цель',test:s=>s.goals.length>=1},
  {id:'gd1',ic:'✅',t:'Сделано!',d:'Выполнить первую цель',test:s=>s.goals.some(g=>g.done)},
  {id:'gd10',ic:'🏅',t:'Десятка',d:'Выполнить 10 целей',test:s=>s.goals.filter(g=>g.done).length>=10},
  {id:'h1',ic:'🔁',t:'Привычка',d:'Добавить привычку',test:s=>s.habits.length>=1},
  {id:'s7',ic:'🔥',t:'7 дней',d:'Стрик привычки 7 дней',test:()=>bestStreak()>=7},
  {id:'s30',ic:'⚡',t:'30 дней',d:'Стрик привычки 30 дней',test:()=>bestStreak()>=30},
  {id:'s100',ic:'💎',t:'100 дней',d:'Стрик привычки 100 дней',test:()=>bestStreak()>=100},
  {id:'j7',ic:'📔',t:'Летописец',d:'7 записей в дневнике',test:s=>s.journal.length>=7},
  {id:'pd',ic:'🌟',t:'Идеальный день',d:'Отметить все привычки за день',test:()=>{var h=habitsToday();return h.total>0&&h.done===h.total;}}
];
function renderAchievements(){ var el=document.getElementById('achGrid'); if(!el) return;
  var eset={}; var n=0; ACHIEVEMENTS.forEach(function(a){ var ok=false; try{ok=a.test(state);}catch(e){} if(ok){eset[a.id]=1;n++;} });
  var sum=document.getElementById('achSum'); if(sum) sum.textContent=n+'/'+ACHIEVEMENTS.length;
  el.innerHTML=ACHIEVEMENTS.map(function(a){ return '<div class="ach '+(eset[a.id]?'on':'')+'" data-ach="'+a.id+'"><div class="ach-ic">'+a.ic+'</div><div class="ach-t">'+esc(a.t)+'</div></div>'; }).join('');
}
document.body.addEventListener('click',function(e){ var b=e.target.closest&&e.target.closest('[data-ach]'); if(!b) return; var a=ACHIEVEMENTS.filter(function(x){return x.id===b.dataset.ach;})[0]; if(!a) return; var ok=false; try{ok=a.test(state);}catch(e){} toast((ok?'✓ ':'🔒 ')+a.t+' — '+a.d); });

function renderAnalytics(){ var wrap=document.getElementById('analyticsBody'); if(!wrap) return;
  var goals=state.goals; var done=goals.filter(function(g){return g.done;}).length; var total=goals.length; var pct=total?Math.round(done/total*100):0;
  var now=new Date(); var mlabels=[],mvals=[];
  for(var i=5;i>=0;i--){ var d=new Date(now.getFullYear(),now.getMonth()-i,1); var mk=d.toISOString().slice(0,7);
    mlabels.push(MONTHS_N[d.getMonth()].slice(0,3)); mvals.push(goals.filter(function(g){return g.done&&(g.doneAt||'').slice(0,7)===mk;}).length); }
  var gmax=Math.max.apply(null,[1].concat(mvals));
  var wvals=[]; for(var w=7;w>=0;w--){ var ws=weekStart(new Date(now.getFullYear(),now.getMonth(),now.getDate()-w*7)); var nn=0;
    for(var dd=0;dd<7;dd++){ var kk=new Date(ws.getFullYear(),ws.getMonth(),ws.getDate()+dd).toISOString().slice(0,10); nn+=state.habits.filter(function(h){return h.log&&h.log[kk];}).length; } wvals.push(nn); }
  var wmax=Math.max.apply(null,[1].concat(wvals));
  var moods=state.journal.map(function(j){return MOOD_SCORE[j.mood];}).filter(Boolean); var avg=moods.length?moods.reduce(function(a,b){return a+b;},0)/moods.length:0;
  var avgEmoji=avg?MOODS[Math.min(4,Math.max(0,5-Math.round(avg)))]:'—';
  var topH='—',topN=0; state.habits.forEach(function(h){ var c=Object.keys(h.log||{}).length; if(c>topN){topN=c;topH=h.title;} });
  var totalMarks=state.habits.reduce(function(n,h){return n+Object.keys(h.log||{}).length;},0);
  var gsum=mvals.reduce(function(a,b){return a+b;},0); var wsum=wvals.reduce(function(a,b){return a+b;},0);
  function row(l,v){ return '<div class="mrow"><span>'+l+'</span><b>'+v+'</b></div>'; }
  wrap.innerHTML=
    '<div class="hero" style="margin-bottom:16px"><div class="hero-top"><span>Выполнено целей всего</span><span class="hero-pct">'+pct+'%</span></div><div class="track"><span style="width:'+pct+'%"></span></div><div class="hero-sub">'+done+' из '+total+' целей закрыто</div></div>'+
    '<div class="chart" style="margin-bottom:16px"><h3><span>Цели по месяцам</span><span>'+gsum+' за 6 мес</span></h3>'+barChart(mvals,gmax)+'<div class="axis">'+mlabels.map(function(l){return '<span>'+l+'</span>';}).join('')+'</div></div>'+
    '<div class="chart" style="margin-bottom:16px"><h3><span>Привычки по неделям</span><span>'+wsum+' за 8 нед</span></h3>'+barChart(wvals,wmax)+'<div class="chart-cap">Сумма отметок за каждую неделю (старые → новые)</div></div>'+
    '<div class="msum">'+row('Лучший стрик',bestStreak()+' дн.')+row('Всего отметок привычек',totalMarks)+row('Самая частая привычка',esc(topH))+row('Записей в дневнике',state.journal.length)+row('Среднее настроение',avgEmoji)+'</div>';
}

function checkRecurring(){ var changed=false; var now=new Date(); var today=todayISO();
  state.goals.forEach(function(g){ if(!g.repeat||g.repeat==='none'||!g.done||!g.doneAt) return; var dd=g.doneAt.slice(0,10); var reset=false;
    if(g.repeat==='daily') reset=dd<today;
    else if(g.repeat==='weekly') reset=weekStart(new Date(dd+'T00:00')).getTime()<weekStart(now).getTime();
    else if(g.repeat==='monthly') reset=dd.slice(0,7)<today.slice(0,7);
    if(reset){ g.done=false; g.doneAt=null; (g.subtasks||[]).forEach(function(s){s.done=false;}); changed=true; } });
  if(changed){ save(); render(); }
}

function checkItemReminders(){ var s=state.settings; if(!('Notification' in window)||Notification.permission!=='granted') return;
  var now=new Date(); var hh=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0'); var t=todayISO(); s.itemReminded=s.itemReminded||{};
  state.goals.forEach(function(g){ if(g.reminder===hh&&!g.done&&!g.archived){ var key='g'+g.id; if(s.itemReminded[key]!==t){ s.itemReminded[key]=t; save(); try{ new Notification('Цель на сегодня',{body:g.title,icon:'icon.svg'}); }catch(e){} } } });
  state.habits.forEach(function(h){ if(h.reminder===hh){ var k=todayISO(); if(!(h.log&&h.log[k])){ var key='h'+h.id; if(s.itemReminded[key]!==t){ s.itemReminded[key]=t; save(); try{ new Notification('Привычка',{body:'Не забудь: '+h.title,icon:'icon.svg'}); }catch(e){} } } } });
}
setInterval(checkItemReminders,30000);

function pinNeeded(){ return !!state.settings.pin && !window.jUnlocked; }
function openPinGate(cb){ openSheet('<h3>Дневник под защитой</h3><label class="fld"><span class="lt">Введите PIN</span><input type="password" inputmode="numeric" id="pinIn" maxlength="8" /></label><button class="btn" id="pinGo">Открыть</button><button class="btn ghost" onclick="closeSheet()">Отмена</button>');
  var inp=document.getElementById('pinIn'); if(inp) inp.focus();
  function tryPin(){ if(inp.value===state.settings.pin){ window.jUnlocked=true; closeSheet(); cb(); } else { toast('Неверный PIN'); inp.value=''; } }
  document.getElementById('pinGo').onclick=tryPin; inp.onkeydown=function(e){ if(e.key==='Enter') tryPin(); };
}
function injectPinSetting(){ var ref=document.getElementById('sExport'); if(!ref||document.getElementById('pinFld')) return; var has=!!state.settings.pin;
  var html='<label class="fld" id="pinFld"><span class="lt">PIN на дневник</span><div class="rem-row"><input type="password" inputmode="numeric" id="setPin" maxlength="8" placeholder="'+(has?'Новый PIN':'4 цифры')+'" /><button class="btn ghost" id="pinSave" style="width:auto;margin:0;padding:13px 16px;white-space:nowrap">'+(has?'Сменить':'Включить')+'</button></div>'+(has?'<button class="btn ghost" id="pinClear" style="margin-top:8px">Убрать защиту</button>':'')+'<p class="mini" style="text-align:left;margin-top:8px">Дневник открывается по PIN. Код хранится только на этом устройстве — не забывайте его.</p></label>';
  ref.insertAdjacentHTML('beforebegin',html);
  document.getElementById('pinSave').onclick=function(){ var v=(document.getElementById('setPin').value||'').trim(); if(v.length<4){ toast('Минимум 4 символа'); return; } state.settings.pin=v; window.jUnlocked=true; save(); toast('PIN установлен'); closeSheet(); };
  var clr=document.getElementById('pinClear'); if(clr) clr.onclick=function(){ state.settings.pin=''; save(); toast('Защита снята'); closeSheet(); };
}

/* хуки поверх app.js */
var _render=render; render=function(){ _render(); try{ renderAchievements(); if(curTab==='analytics') renderAnalytics(); }catch(e){} };
var _go=go; go=function(tab){ if(tab==='journal'&&pinNeeded()){ openPinGate(function(){ _go('journal'); }); return; } _go(tab); var pt=document.getElementById('pageTitle'); if(tab==='analytics'&&pt) pt.textContent='Аналитика'; var fab=document.getElementById('fab'); if(fab) fab.style.display=(tab==='analytics')?'none':''; };
var _settingsSheet=settingsSheet; settingsSheet=function(){ _settingsSheet(); injectPinSetting(); };
var av=document.getElementById('avatar'); if(av) av.onclick=settingsSheet;

checkRecurring();
checkItemReminders();
try{ renderAchievements(); }catch(e){}
window.renderAnalytics=renderAnalytics;
})();
