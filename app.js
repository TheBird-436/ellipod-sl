// ═══════════════════════════════════════════════════════
//  CONSTANTS & HELPERS  (defined first — used by everything)
// ═══════════════════════════════════════════════════════
const SK          = 'edupla_v4';
const ACCOUNTS_KEY= 'edupla_accounts';
const DAYS_SHORT  = ['M','T','W','T','F','S','S'];
const MONTHS      = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAYS    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const PLANETS_LIST= ['🌍','🌙','🪐','⭐','🌟','🌌','🪄','🔮'];
const AVATARS     = ['🎓','🧑‍💻','👩‍🎓','🧑‍🔬','👨‍🏫','🦸','🧙','🐉','🦊','🐺','🌟','🔥','🚀','⚡','🎮','🎵','📚','🏆','💡','🌈','⚙'];
const QUOTES      = [
  '"The secret of getting ahead is getting started." — Mark Twain',
  '"Push yourself, because no one else is going to do it for you."',
  '"Great things never come from comfort zones."',
  '"Success is the sum of small efforts, repeated day in and day out."',
  '"When something is important enough, you do it even if the odds are not in your favor."- Elon Musk',
  '"Every expert was once a beginner. Keep going."',
  '"Your future self is watching you right now through memories."',
  '"It always seems impossible until it\'s done." — Nelson Mandela',
];
const MISSION_POOL = [
  { id:'m_open',   text:'Open the app today',        xp:5,  check: ()=>true },
  { id:'m_hw1',    text:'Complete 1 assignment',      xp:20, check: ()=>S.homework.filter(h=>h.done).length>=1 },
  { id:'m_hw2',    text:'Complete 2 assignments',     xp:35, check: ()=>S.homework.filter(h=>h.done).length>=2 },
  { id:'m_focus1', text:'Finish a focus session',     xp:25, check: ()=>S.todaySessions>=1 },
  { id:'m_focus2', text:'Do 2 focus sessions today',  xp:45, check: ()=>S.todaySessions>=2 },
  { id:'m_habit2', text:'Check off 2 habits today',   xp:20, check: ()=>S.habits.filter(h=>h.days[todayDow()]===1).length>=2 },
  { id:'m_habit4', text:'Complete all habits today',  xp:50, check: ()=>S.habits.every(h=>h.days[todayDow()]===1) },
];

function el(id)     { return document.getElementById(id); }
function esc(str)   { return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function uid()      { return Date.now().toString(36)+Math.random().toString(36).slice(2); }
function todayStr() { const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function todayDow() { return (new Date().getDay()+6)%7; }

function simpleHash(str) {
  let h=5381;
  for(let i=0;i<str.length;i++) h=(Math.imul(33,h)+str.charCodeAt(i))|0;
  return Math.abs(h).toString(36);
}

// ═══════════════════════════════════════════════════════
//  ACCOUNTS
// ═══════════════════════════════════════════════════════
function getAccounts() {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)||'{}'); } catch(e) { return {}; }
}
function saveAccounts(accounts) {
  try { localStorage.setItem(ACCOUNTS_KEY,JSON.stringify(accounts)); } catch(e) {}
}

// ═══════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════
function freshState() {
  return {
    name:'', onboarded:false, currentEmail:'',
    xp:0, level:1, streak:0, lastStreakDate:'', lastActiveDate:'',
    weekActivity:[0,0,0,0,0,0,0], weekSessions:0, todaySessions:0,
    homework:[], schedule:[], grades:[],
    habits:[
      {id:1,icon:'💧',name:'Drink 8 glasses of water',streak:0,days:[0,0,0,0,0,0,0]},
      {id:2,icon:'📚',name:'Study 2+ hours',streak:0,days:[0,0,0,0,0,0,0]},
      {id:3,icon:'🏃',name:'Exercise 30 min',streak:0,days:[0,0,0,0,0,0,0]},
      {id:4,icon:'📵',name:'No social media before noon',streak:0,days:[0,0,0,0,0,0,0]},
    ],
    sessions:[], focusDuration:25, planets:['🌍'],
    missions:[], missionDate:'',
    settings:{theme:'dark',accent:'#6c63ff',fontSize:'medium',bg:'default',avatar:'🎓',username:'',privacyProfile:'private',activityStatus:true,leaderboard:false,notifStreak:true,notifMissions:false},
  };
}

function accountKey(email) { return 'edupla_v4_'+simpleHash(email); }

const SESSION_KEY = 'edupla_session';
function getSessionEmail() {
  try { return localStorage.getItem(SESSION_KEY) || ''; } catch(e) { return ''; }
}
function setSessionEmail(email) {
  try { if(email) localStorage.setItem(SESSION_KEY, email); else localStorage.removeItem(SESSION_KEY); } catch(e) {}
}

function loadState(email) {
  try {
    const key = email ? accountKey(email) : SK;
    const raw = localStorage.getItem(key);
    if (!raw) return freshState();
    return Object.assign(freshState(), JSON.parse(raw));
  } catch(e) { return freshState(); }
}

function save() {
  try {
    const key = S.currentEmail ? accountKey(S.currentEmail) : SK;
    localStorage.setItem(key, JSON.stringify(S));
    setSessionEmail(S.currentEmail || '');
  } catch(e) {}
}

const _sessionEmail = getSessionEmail();
let S = loadState(_sessionEmail || undefined);
if (_sessionEmail && !S.currentEmail) S.currentEmail = _sessionEmail;

// ═══════════════════════════════════════════════════════
//  SETTINGS HELPERS
// ═══════════════════════════════════════════════════════
function ss() { return S.settings || (S.settings=freshState().settings); }

function applyAppearance() {
  const s=ss();
  document.body.classList.remove('light');
  if(s.theme==='light') document.body.classList.add('light');
  else if(s.theme==='system'&&window.matchMedia('(prefers-color-scheme: light)').matches) document.body.classList.add('light');
  document.documentElement.style.setProperty('--accent',s.accent||'#6c63ff');
  document.documentElement.setAttribute('data-fontsize', s.fontSize || 'medium');
  document.body.classList.remove('bg-midnight','bg-forest','bg-ocean','bg-rose');
  if(s.bg&&s.bg!=='default') document.body.classList.add('bg-'+s.bg);
}

// ═══════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════
let toastTimer=null;
function toast(msg) {
  const t=el('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),2800);
}

// ═══════════════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════════════
function showPage(id) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  el('page-'+id).classList.add('active');
  const tab=document.querySelector(`.nav-tab[data-page="${id}"]`);
  if(tab) tab.classList.add('active');
  el('navSettingsBtn').classList.remove('active');
}
document.querySelectorAll('.nav-tab').forEach(btn=>{
  btn.addEventListener('click',()=>showPage(btn.dataset.page));
});

// ═══════════════════════════════════════════════════════
//  DAILY RESET
// ═══════════════════════════════════════════════════════
function dailyReset() {
  const today=todayStr();
  if(S.lastActiveDate===today) return;
  if(S.streak>0&&S.lastActiveDate) {
    const diff=Math.round((new Date(today)-new Date(S.lastActiveDate))/86400000);
    if(diff>1){S.streak=0;S.lastStreakDate='';}
  }
  S.todaySessions=0;
  if(todayDow()===0){S.weekActivity=[0,0,0,0,0,0,0];S.weekSessions=0;S.habits.forEach(h=>{h.days=[0,0,0,0,0,0,0];});}
  genMissions();
  S.lastActiveDate=today;
  save();
}

// ═══════════════════════════════════════════════════════
//  STREAK
// ═══════════════════════════════════════════════════════
function markActive() {
  const today=todayStr();
  S.weekActivity[todayDow()]=1;
  if(S.lastStreakDate!==today) {
    if(!S.lastStreakDate){S.streak=1;}
    else{const diff=Math.round((new Date(today)-new Date(S.lastStreakDate))/86400000);if(diff===1)S.streak++;else S.streak=1;}
    S.lastStreakDate=today;
  }
  S.lastActiveDate=today;
  save();
}

// ═══════════════════════════════════════════════════════
//  XP
// ═══════════════════════════════════════════════════════
function addXP(amount) {
  S.xp+=amount;
  while(S.xp>=S.level*100){S.xp-=S.level*100;S.level++;const l=S.level;setTimeout(()=>toast('🚀 LEVEL UP! Level '+l+'!'),300);}
  S.planets=PLANETS_LIST.slice(0,Math.min(S.level,PLANETS_LIST.length));
  renderNav();save();
}

// ═══════════════════════════════════════════════════════
//  MISSIONS
// ═══════════════════════════════════════════════════════
function genMissions() {
  const today=todayStr();
  if(S.missionDate===today&&S.missions&&S.missions.length) return;
  function hash(str,seed){let h=seed;for(let i=0;i<str.length;i++)h=(Math.imul(31,h)+str.charCodeAt(i))|0;return Math.abs(h);}
  const seed=parseInt(today.replace(/-/g,''),10)%99991;
  const sorted=[...MISSION_POOL].sort((a,b)=>hash(a.id,seed)-hash(b.id,seed));
  S.missions=sorted.slice(0,3).map(m=>({id:m.id,done:false}));
  S.missionDate=today;
}

function checkMissions() {
  let changed=false;
  (S.missions||[]).forEach(ms=>{
    if(ms.done) return;
    const def=MISSION_POOL.find(m=>m.id===ms.id);
    if(def&&def.check()){ms.done=true;addXP(def.xp);markActive();toast('✅ Mission done! +'+def.xp+' XP');changed=true;}
  });
  if(changed){renderMissions();renderHook();renderStats();save();}
}

function completeMissionManual(id) {
  const ms=(S.missions||[]).find(m=>m.id===id);
  if(!ms||ms.done) return;
  const def=MISSION_POOL.find(m=>m.id===id);
  if(!def) return;
  ms.done=true;addXP(def.xp);markActive();
  toast('✅ Mission done! +'+def.xp+' XP');
  renderMissions();renderHook();renderStats();save();
}

function renderMissions() {
  const wrap=el('missionsEl');
  if(!wrap||!S.missions||!S.missions.length) return;
  const defs=S.missions.map(ms=>{const def=MISSION_POOL.find(m=>m.id===ms.id);return def?{...def,done:ms.done}:null;}).filter(Boolean);
  const doneCount=defs.filter(d=>d.done).length;
  const xpLeft=defs.filter(d=>!d.done).reduce((a,d)=>a+d.xp,0);
  const pct=Math.round(doneCount/defs.length*100);
  wrap.innerHTML=`
    <div class="missions-hd"><div class="missions-title">🎯 Daily Missions</div><div class="missions-xp">${doneCount}/${defs.length} · +${xpLeft} XP left</div></div>
    <div class="missions-list">${defs.map(d=>`<div class="mission-card ${d.done?'done':''}" data-mid="${d.id}"><div class="mc-box">${d.done?'✓':''}</div><div class="mc-text">${d.text}</div><div class="mc-xp">${d.done?'✓':'+'+d.xp}</div></div>`).join('')}</div>
    <div class="mission-bar-bg"><div class="mission-bar-fill" style="width:${pct}%"></div></div>`;
  wrap.querySelectorAll('.mission-card:not(.done)').forEach(card=>{
    card.addEventListener('click',()=>completeMissionManual(card.dataset.mid));
  });
}

// ═══════════════════════════════════════════════════════
//  HOOK BANNER
// ═══════════════════════════════════════════════════════
function renderHook() {
  const hook=el('hook');if(!hook) return;
  const active=S.weekActivity[todayDow()]===1;
  hook.className='';hook.style.display='none';
  if(active){hook.style.display='flex';hook.classList.add('good');el('hookIcon').textContent='✅';el('hookTitle').textContent='Streak safe — '+S.streak+' day'+(S.streak!==1?'s':'')+' and counting!';el('hookSub').textContent='You\'ve been active today. Keep completing missions for more XP.';}
  else if(S.streak>=1){hook.style.display='flex';hook.classList.add('danger');el('hookIcon').textContent='🔥';el('hookTitle').textContent='Your '+S.streak+'-day streak breaks tonight if you don\'t act.';el('hookSub').textContent='Complete any mission or check off a habit to keep it alive.';}
  else if(S.lastActiveDate&&S.lastActiveDate!==todayStr()){hook.style.display='flex';hook.classList.add('warn');el('hookIcon').textContent='👋';el('hookTitle').textContent='Welcome back! Start a new streak today.';el('hookSub').textContent='Complete a mission to begin your streak.';}
}

// ═══════════════════════════════════════════════════════
//  STATS + NAV
// ═══════════════════════════════════════════════════════
function renderStats() {
  if(el('statDone'))    el('statDone').textContent=S.homework.filter(h=>h.done).length;
  if(el('statPending')) el('statPending').textContent=S.homework.filter(h=>!h.done).length;
  if(el('statStreak'))  el('statStreak').textContent='🔥 '+S.streak;
}

function renderNav() {
  const sb=el('navStreak'),xb=el('navXP');
  if(sb){sb.textContent='🔥 '+S.streak;sb.className='nav-pill pill-streak'+(S.streak>=3?'':' safe');}
  if(xb){xb.textContent='⚡ '+S.xp+' XP · LVL '+S.level;}
}

// ═══════════════════════════════════════════════════════
//  HOMEWORK
// ═══════════════════════════════════════════════════════
function renderHomework() {
  const list=el('hwList');if(!list) return;
  if(!S.homework.length){list.innerHTML='<div class="empty"><div class="empty-icon">📝</div>No assignments yet. Add one above!</div>';if(el('danger-banner'))el('danger-banner').style.display='none';return;}
  list.innerHTML='';
  S.homework.forEach((hw,i)=>{
    const dc=hw.due==='today'?'due-today':hw.due==='tomorrow'?'due-tmr':'due-wk';
    const dt=hw.due==='today'?'Today':hw.due==='tomorrow'?'Tomorrow':'This week';
    const div=document.createElement('div');
    div.className='hw-item'+(hw.done?' done':'');
    div.innerHTML=`<div class="hw-chk ${hw.done?'on':''}"></div><div style="flex:1"><div class="hw-name">${esc(hw.name)}</div><div class="hw-sub-label">${hw.subject}</div></div><div class="hw-due-label ${dc}">${dt}</div><button class="btn-del">✕</button>`;
    div.querySelector('.hw-chk').addEventListener('click',()=>toggleHW(i));
    div.querySelector('.btn-del').addEventListener('click',()=>deleteHW(i));
    list.appendChild(div);
  });
  const urgent=S.homework.filter(h=>!h.done&&h.due==='today');
  const banner=el('danger-banner');
  if(banner) {
    if(urgent.length){banner.style.display='flex';el('dangerText').textContent=urgent.length+' assignment'+(urgent.length>1?'s':'')+' due today not done!';}
    else{banner.style.display='none';}
  }
}
function toggleHW(i){const hw=S.homework[i];if(!hw)return;hw.done=!hw.done;if(hw.done){addXP(10);markActive();}checkMissions();renderHomework();renderStats();save();}
function deleteHW(i){S.homework.splice(i,1);renderHomework();renderStats();save();}

// ═══════════════════════════════════════════════════════
//  SCHEDULE
// ═══════════════════════════════════════════════════════
function renderSchedule() {
  const list=el('schedList');if(!list) return;
  if(!S.schedule||!S.schedule.length){list.innerHTML='<div class="empty"><div class="empty-icon">📅</div>No classes yet. Add one above!</div>';return;}
  const cur=new Date().getHours()+new Date().getMinutes()/60;
  const sorted=[...S.schedule].sort((a,b)=>a.slot-b.slot);
  list.innerHTML='';
  sorted.forEach((s,i)=>{
    const isNow=cur>=s.slot&&cur<s.slot+1,isPast=cur>=s.slot+1;
    const div=document.createElement('div');
    div.className='sched-item'+(isNow?' now':'')+(isPast?' past':'');
    div.innerHTML=`<div class="sched-time">${s.time}</div><div class="sched-name">${esc(s.name)}${isNow?'<span class="now-badge">NOW</span>':''}</div><div class="sched-room">${esc(s.room||'')}</div><button class="btn-del">✕</button>`;
    div.querySelector('.btn-del').addEventListener('click',()=>deleteSchedule(i));
    list.appendChild(div);
  });
}
function deleteSchedule(i){S.schedule.splice(i,1);renderSchedule();save();}

// ═══════════════════════════════════════════════════════
//  GRADES
// ═══════════════════════════════════════════════════════
function renderGrades() {
  const list=el('gradeList');if(!list) return;
  if(!S.grades||!S.grades.length){list.innerHTML='<div class="empty"><div class="empty-icon">📊</div>No grades yet. Add a subject above!</div>';if(el('gradeInsight'))el('gradeInsight').style.display='none';return;}
  list.innerHTML='';
  S.grades.forEach((g,i)=>{
    const cls=g.grade>=90?'gA':g.grade>=80?'gB':g.grade>=70?'gC':'gD';
    const col=g.grade>=90?'var(--accent3)':g.grade>=80?'var(--accent)':g.grade>=70?'var(--accent4)':'var(--danger)';
    const div=document.createElement('div');div.className='grade-row';
    div.innerHTML=`<div class="grade-sub">${esc(g.subject)}</div><div class="grade-bar-bg"><div class="grade-bar-fill ${cls}" style="width:${g.grade}%"></div></div><div class="grade-pct" style="color:${col}">${g.grade}%</div><button class="btn-del">✕</button>`;
    div.querySelector('.btn-del').addEventListener('click',()=>deleteGrade(i));
    list.appendChild(div);
  });
  const worst=[...S.grades].sort((a,b)=>a.grade-b.grade)[0];
  if(el('gradeInsight')) el('gradeInsight').style.display='flex';
  if(el('gradeInsightText')) el('gradeInsightText').textContent=worst.grade<70?`⚠️ ${worst.subject} is at risk (${worst.grade}%). Study this today.`:`You're doing well! ${worst.subject} needs the most attention.`;
}
function deleteGrade(i){S.grades.splice(i,1);renderGrades();save();}

// ═══════════════════════════════════════════════════════
//  FOCUS / TIMER
// ═══════════════════════════════════════════════════════
let timerSecs=25*60,timerRunning=false,timerInterval=null;
function updateTimerDisplay(){const m=String(Math.floor(timerSecs/60)).padStart(2,'0'),s=String(timerSecs%60).padStart(2,'0');if(el('timerDisplay'))el('timerDisplay').textContent=m+':'+s;}
function startTimer(){if(timerRunning)return;timerRunning=true;if(el('timerBtn'))el('timerBtn').textContent='⏸ Pause';if(el('timerLabel'))el('timerLabel').textContent='FOCUS MODE ON 🔥';clearInterval(timerInterval);timerInterval=setInterval(()=>{if(timerSecs<=0){clearInterval(timerInterval);finishSession();return;}timerSecs--;updateTimerDisplay();},1000);}
function pauseTimer(){timerRunning=false;clearInterval(timerInterval);if(el('timerBtn'))el('timerBtn').textContent='▶ Resume';if(el('timerLabel'))el('timerLabel').textContent='PAUSED';}
function resetTimer(){timerRunning=false;clearInterval(timerInterval);timerSecs=S.focusDuration*60;if(el('timerBtn'))el('timerBtn').textContent='▶ Start Focus';if(el('timerLabel'))el('timerLabel').textContent='READY TO FOCUS';updateTimerDisplay();}
function finishSession(){
  timerRunning=false;
  const xp=S.focusDuration>=50?50:S.focusDuration>=25?25:10;
  addXP(xp);S.weekSessions++;S.todaySessions++;
  S.sessions.unshift({time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),duration:S.focusDuration,xp});
  markActive();checkMissions();renderFocus();renderHook();renderStats();save();
  toast('🎉 Session done! +'+xp+' XP');resetTimer();
}
function renderFocus(){
  const needed=S.level*100,pct=Math.min(100,S.xp/needed*100);
  if(el('xpBar'))el('xpBar').style.width=pct+'%';
  if(el('xpCur'))el('xpCur').textContent=S.xp;
  if(el('xpMax'))el('xpMax').textContent=needed;
  if(el('lvlNum'))el('lvlNum').textContent=S.level;
  if(el('planetsRow'))el('planetsRow').textContent=(S.planets||['🌍']).join(' ');
  if(el('focusPlanet'))el('focusPlanet').textContent=(S.planets||['🌍']).slice(-1)[0];
  if(el('weekSessions'))el('weekSessions').textContent=S.weekSessions;
  const sb=el('streakBig');if(sb){sb.textContent=S.streak;sb.className='streak-big '+(S.streak>=7?'hot':S.streak>=3?'warm':'cold');}
  const sp=el('streakPill');if(sp){const a=S.weekActivity[todayDow()]===1;sp.textContent=S.streak===0?'Complete something to start your streak':a?'✓ Streak safe today':'⚠ Do something today to keep your '+S.streak+'-day streak';sp.className='streak-pill '+(a||S.streak===0?'sp-safe':'sp-risk');}
  const wd=el('weekDots');if(wd){const t=todayDow();wd.innerHTML=[0,1,2,3,4,5,6].map(i=>{const isT=i===t,a=S.weekActivity[i]===1,p=i<t;let c=isT?(a?'wd-today wd-done':'wd-today'):p?(a?'wd-done':'wd-miss'):'wd-future';return`<div class="wdot ${c}"><span>${a?'✓':'·'}</span><span class="wdot-lbl">${DAYS_SHORT[i]}</span></div>`;}).join('');}
  const log=el('sessionLog');if(log){if(!S.sessions.length){log.innerHTML='<div class="empty"><div class="empty-icon">⏱</div>Complete a session to see it here</div>';}else{log.innerHTML=S.sessions.slice(0,8).map(s=>`<div class="session-row"><span style="color:var(--muted)">${s.time}</span><span>${s.duration} min</span><span style="color:var(--accent4)">+${s.xp} XP</span></div>`).join('');}}
}

// ═══════════════════════════════════════════════════════
//  HABITS
// ═══════════════════════════════════════════════════════
function renderHabits(){
  const list=el('habitList');if(!list) return;
  const today=todayDow();list.innerHTML='';
  S.habits.forEach((h,hi)=>{
    const div=document.createElement('div');div.className='habit-row';
    const daysHtml=h.days.map((d,i)=>{const iF=i>today,iT=i===today;let c='hday '+(d?'hday-done':'hday-empty')+(iT?' hday-today':'')+(iF?' hday-future':'');return`<div class="${c}" data-hi="${hi}" data-di="${i}">${d?'✓':DAYS_SHORT[i]}</div>`;}).join('');
    div.innerHTML=`<div class="habit-icon">${h.icon}</div><div class="habit-info"><div class="habit-name">${esc(h.name)}</div><div class="habit-streak">Streak: <b>${h.streak}d</b></div></div><div class="hdays">${daysHtml}</div>`;
    div.querySelectorAll('.hday:not(.hday-future)').forEach(cell=>cell.addEventListener('click',()=>toggleHabit(parseInt(cell.dataset.hi),parseInt(cell.dataset.di))));
    list.appendChild(div);
  });
  const total=S.habits.length*7,done=S.habits.reduce((a,h)=>a+h.days.filter(Boolean).length,0);
  if(el('repCompletion'))el('repCompletion').textContent=total?Math.round(done/total*100)+'%':'0%';
  const best=[...S.habits].sort((a,b)=>b.streak-a.streak)[0];
  if(el('repBest'))el('repBest').textContent=best?best.icon:'—';
  if(el('repTopStreak'))el('repTopStreak').textContent=best?best.streak:0;
  const failing=S.habits.filter(h=>h.streak<2);
  if(el('habitInsightText'))el('habitInsightText').textContent=failing.length?'"'+failing[0].name+'" has a low streak. Try doing it right after breakfast.':'All habits on track! Best streak is '+(best?best.streak:0)+' days. 🔥';
}
function toggleHabit(hi,di){
  const h=S.habits[hi];if(!h) return;
  const today=todayDow();if(di>today) return;
  h.days[di]=h.days[di]?0:1;
  let streak=0;for(let i=today;i>=0;i--){if(h.days[i])streak++;else break;}
  h.streak=streak;
  if(h.days[di]&&di===today){addXP(5);markActive();}
  checkMissions();renderHabits();renderHook();save();
}

// ═══════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════
function showAuthError(msg){const e=el('authError');if(e){e.textContent=msg;e.style.display='block';setTimeout(()=>e.style.display='none',4000);}}
function switchAuthPanel(panel){
  ['panelSignup','panelLogin','panelForgot','panelTransfer'].forEach(id=>{const e=el(id);if(e)e.style.display='none';});
  ['tabSignup','tabLogin'].forEach(id=>{if(el(id)) el(id).classList.remove('active');});
  if(el('authError')) el('authError').style.display='none';
  const target=el(panel);if(target)target.style.display='flex';
  if(panel==='panelSignup' && el('tabSignup'))el('tabSignup').classList.add('active');
  if(panel==='panelLogin' && el('tabLogin'))el('tabLogin').classList.add('active');
}

if(el('tabSignup')) el('tabSignup').addEventListener('click',()=>switchAuthPanel('panelSignup'));
if(el('tabLogin')) el('tabLogin').addEventListener('click',()=>switchAuthPanel('panelLogin'));
if(el('goSignup')) el('goSignup').addEventListener('click',()=>switchAuthPanel('panelSignup'));
if(el('forgotLink')) el('forgotLink').addEventListener('click',()=>switchAuthPanel('panelForgot'));
if(el('backToLogin')) el('backToLogin').addEventListener('click',()=>switchAuthPanel('panelLogin'));
if(el('goTransfer')) el('goTransfer').addEventListener('click', () => switchAuthPanel('panelTransfer'));
if(el('backFromTransfer')) el('backFromTransfer').addEventListener('click', () => switchAuthPanel('panelLogin'));

if(el('importFile')) el('importFile').addEventListener('change', () => {
  const f = el('importFile').files[0];
  if (f && el('importLabelText')) el('importLabelText').textContent = '✓ ' + f.name;
});

if(el('importBtn')) el('importBtn').addEventListener('click', () => {
  const file = el('importFile') && el('importFile').files[0];
  if (!file) return showAuthError('Choose an export file first.');
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.__edupla_export || !data.account || !data.state) {
        return showAuthError('Invalid export file. Please use a file exported from Edupla.');
      }
      const { account, state } = data;
      const email = account.email;
      if (!email) return showAuthError('Export file is missing account email.');

      const accounts = getAccounts();
      accounts[email] = {
        name: account.name,
        passwordHash: account.passwordHash,
        createdAt: account.createdAt || new Date().toISOString(),
      };
      saveAccounts(accounts);

      S = Object.assign(freshState(), state);
      S.onboarded = true;
      S.currentEmail = email;
      if (!S.settings) S.settings = freshState().settings;
      S.settings.email = email;
      save();
      setSessionEmail(email);

      if(el('authScreen')) el('authScreen').style.display = 'none';
      boot();
      toast('✅ Account imported! Welcome back, ' + (S.name || 'Student') + '!');
    } catch(err) {
      showAuthError('Could not read file. Make sure it is a valid Edupla export.');
    }
  };
  reader.readAsText(file);
});

if(el('signupBtn')) {
  el('signupBtn').addEventListener('click',()=>{
    const name=el('suName').value.trim(),email=el('suEmail').value.trim().toLowerCase(),pass=el('suPass').value,conf=el('suPassConfirm').value;
    if(!name) return showAuthError('Enter your name.');
    if(!email||!email.includes('@')) return showAuthError('Enter a valid email address.');
    if(pass.length<6) return showAuthError('Password must be at least 6 characters.');
    if(pass!==conf) return showAuthError('Passwords do not match.');
    const accounts=getAccounts();
    if(accounts[email]) return showAuthError('Account already exists. Log in instead.');
    accounts[email]={name,passwordHash:simpleHash(pass),createdAt:new Date().toISOString()};
    saveAccounts(accounts);
    S=freshState();S.name=name;S.onboarded=true;S.currentEmail=email;S.settings.email=email;
    save();if(el('authScreen'))el('authScreen').style.display='none';boot();
  });
}
['suName','suEmail','suPass','suPassConfirm'].forEach(id=>{
  if(el(id)) {
    el(id).addEventListener('keydown',e=>{if(e.key==='Enter' && el('signupBtn'))el('signupBtn').click();});
  }
});

if(el('loginBtn')) {
  el('loginBtn').addEventListener('click',()=>{
    const email=el('liEmail').value.trim().toLowerCase(),pass=el('liPass').value;
    if(!email) return showAuthError('Enter your email.');
    if(!pass) return showAuthError('Enter your password.');
    const accounts=getAccounts(),account=accounts[email];
    if(!account) return showAuthError('No account found. Sign up first.');
    if(account.passwordHash!==simpleHash(pass)) return showAuthError('Incorrect password.');
    S=loadState(email);S.name=account.name;S.onboarded=true;S.currentEmail=email;S.settings=S.settings||freshState().settings;S.settings.email=email;
    save();if(el('authScreen'))el('authScreen').style.display='none';boot();
  });
}
['liEmail','liPass'].forEach(id=>{
  if(el(id)) {
    el(id).addEventListener('keydown',e=>{if(e.key==='Enter' && el('loginBtn'))el('loginBtn').click();});
  }
});

if(el('forgotBtn')) {
  el('forgotBtn').addEventListener('click',()=>{
    const email=el('forgotEmail').value.trim().toLowerCase();
    if(!email||!email.includes('@')) return showAuthError('Enter a valid email.');
    const accounts=getAccounts();
    if(!accounts[email]) return showAuthError('No account found with that email.');
    toast('📧 Reset link sent (demo — nothing actually sent)');
    switchAuthPanel('panelLogin');
  });
}

// ═══════════════════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════════════════

function populateSettings() {
  const s = ss();

  const ni = el('settingName');     if (ni) ni.value = S.name || '';
  const ui = el('settingUsername'); if (ui) ui.value = (s.username || '').replace(/^@/,'');
  const ad = el('avatarDisplay');   if (ad) ad.textContent = s.avatar || '🎓';

  const ag = el('avatarGrid');
  if (ag) {
    ag.innerHTML = AVATARS.map(a =>
      `<div class="av-opt${a === s.avatar ? ' selected' : ''}" data-av="${a}">${a}</div>`
    ).join('');
    ag.querySelectorAll('.av-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        s.avatar = opt.dataset.av;
        ag.querySelectorAll('.av-opt').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        if (ad) ad.textContent = s.avatar;
        save();
        toast('Avatar updated!');
      });
    });
  }

  document.querySelectorAll('.theme-opt').forEach(o => o.classList.toggle('selected', o.dataset.theme === (s.theme || 'dark')));
  document.querySelectorAll('.color-dot').forEach(d => d.classList.toggle('selected', d.dataset.color === (s.accent || '#6c63ff')));
  const currentSize = s.fontSize || 'medium';
  document.querySelectorAll('.fsz-btn').forEach(b => b.classList.toggle('active', b.dataset.size === currentSize));
  document.documentElement.setAttribute('data-fontsize', currentSize);
  document.querySelectorAll('.bg-opt').forEach(o => o.classList.toggle('active', o.dataset.bg === (s.bg || 'default')));

  const pa = el('privacyActivity');    if (pa) pa.checked = s.activityStatus !== false;
  const pl = el('privacyLeaderboard'); if (pl) pl.checked = !!s.leaderboard;
  const pp = el('privacyProfile');     if (pp) pp.value   = s.privacyProfile || 'private';
  const ns = el('notifStreak');        if (ns) ns.checked = s.notifStreak !== false;
  const nm = el('notifMissions');      if (nm) nm.checked = !!s.notifMissions;
}

function wireSettings() {
  const s = ss();

  if (el('saveNameBtn')) {
    el('saveNameBtn').addEventListener('click', () => {
      const v = el('settingName').value.trim();
      if (!v) return toast('⚠ Enter a name');
      S.name = v;
      if (el('heroName')) el('heroName').textContent = v;
      save(); toast('✅ Name saved!');
    });
  }

  if (el('saveUsernameBtn')) {
    el('saveUsernameBtn').addEventListener('click', () => {
      const raw = el('settingUsername').value.trim().replace(/^@/, '');
      if (!raw) return toast('⚠ Enter a username');
      s.username = '@' + raw;
      save(); toast('✅ Username saved!');
    });
  }

  document.querySelectorAll('.theme-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      ss().theme = opt.dataset.theme;
      document.querySelectorAll('.theme-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      applyAppearance(); save(); toast('Theme: ' + opt.dataset.theme);
    });
  });

  document.querySelectorAll('.color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      ss().accent = dot.dataset.color;
      document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
      applyAppearance(); save(); toast('Accent color updated!');
    });
  });

  document.querySelectorAll('.fsz-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      ss().fontSize = btn.dataset.size;
      document.querySelectorAll('.fsz-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.documentElement.setAttribute('data-fontsize', btn.dataset.size);
      save();
      toast('Font size: ' + btn.dataset.size);
    });
  });

  document.querySelectorAll('.bg-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      ss().bg = opt.dataset.bg;
      document.querySelectorAll('.bg-opt').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      applyAppearance(); save(); toast('Background: ' + opt.dataset.bg);
    });
  });

  if (el('privacyProfile')) el('privacyProfile').addEventListener('change', () => { ss().privacyProfile = el('privacyProfile').value; save(); });
  if (el('privacyActivity')) el('privacyActivity').addEventListener('change', () => { ss().activityStatus = el('privacyActivity').checked; save(); });
  if (el('privacyLeaderboard')) el('privacyLeaderboard').addEventListener('change', () => { ss().leaderboard = el('privacyLeaderboard').checked; save(); });

  if (el('notifStreak')) el('notifStreak').addEventListener('change', () => { ss().notifStreak = el('notifStreak').checked; save(); });
  if (el('notifMissions')) el('notifMissions').addEventListener('change', () => { ss().notifMissions = el('notifMissions').checked; save(); });

  if (el('downloadDataBtn')) {
    el('downloadDataBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'edupla-data.json'; a.click();
      URL.revokeObjectURL(url);
      toast('⬇ Download started!');
    });
  }

  document.querySelectorAll('.reset-soft-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.reset;
      if (type === 'appearance') {
        Object.assign(ss(), { theme: 'dark', accent: '#6c63ff', fontSize: 'medium', bg: 'default' });
        applyAppearance(); populateSettings(); save(); toast('🎨 Appearance reset!');
      } else if (type === 'notifications') {
        Object.assign(ss(), { notifStreak: true, notifMissions: false });
        populateSettings(); save(); toast('🔔 Notifications reset!');
      } else if (type === 'dashboard') {
        S.homework = []; S.schedule = []; S.grades = [];
        renderHomework(); renderSchedule(); renderGrades();
        save(); toast('📊 Dashboard cleared!');
      }
    });
  });

  let pendingAction = null;
  const cb = el('confirmBox');

  if (el('resetAllBtn')) {
    el('resetAllBtn').addEventListener('click', () => {
      pendingAction = 'reset';
      el('confirmTitle').textContent = 'Reset everything?';
      el('confirmSub').textContent   = 'All XP, streaks, homework, grades, habits and settings will be wiped.';
      el('confirmInput').value = '';
      if (cb) cb.style.display = 'block';
      el('confirmInput').focus();
    });
  }

  if (el('deleteAccBtn')) {
    el('deleteAccBtn').addEventListener('click', () => {
      pendingAction = 'delete';
      el('confirmTitle').textContent = 'Delete account?';
      el('confirmSub').textContent   = 'Your Edupla account and all data will be permanently deleted.';
      el('confirmInput').value = '';
      if (cb) cb.style.display = 'block';
      el('confirmInput').focus();
    });
  }

  if (el('confirmNoBtn')) el('confirmNoBtn').addEventListener('click', () => { if (cb) cb.style.display = 'none'; pendingAction = null; });

  if (el('confirmYesBtn')) {
    el('confirmYesBtn').addEventListener('click', () => {
      if (el('confirmInput').value.trim().toUpperCase() !== 'RESET') {
        toast('⚠ Type RESET to confirm'); return;
      }
      if (cb) cb.style.display = 'none';
      const email = S.currentEmail || '';
      if (pendingAction === 'delete' && email) {
        const accounts = getAccounts(); delete accounts[email]; saveAccounts(accounts);
      }
      [SK, email ? accountKey(email) : null].filter(Boolean).forEach(k => localStorage.removeItem(k));
      setSessionEmail('');
      toast('💥 All data wiped. Reloading...');
      setTimeout(() => location.reload(), 1500);
      pendingAction = null;
    });
  }

  function refreshAccountCard() {
    const email = S.currentEmail || '';
    const avatar = ss().avatar || '🎓';
    if (el('acctAvatar'))  el('acctAvatar').textContent  = avatar;
    if (el('acctName'))    el('acctName').textContent    = S.name || 'Student';
    if (el('acctEmail'))   el('acctEmail').textContent   = email;
  }
  refreshAccountCard();

  if (el('savePwBtn')) {
    el('savePwBtn').addEventListener('click', () => {
      const cur  = el('settingPwCurrent').value;
      const nw   = el('settingPwNew').value;
      const conf = el('settingPwConfirm').value;
      if (!cur || !nw || !conf) return toast('⚠ Fill all password fields');
      if (nw !== conf)           return toast('⚠ New passwords do not match');
      if (nw.length < 6)         return toast('⚠ Password must be at least 6 characters');
      const email = S.currentEmail || '';
      const accounts = getAccounts();
      if (!accounts[email])                                       return toast('⚠ Account not found');
      if (accounts[email].passwordHash !== simpleHash(cur))       return toast('⚠ Current password is incorrect');
      accounts[email].passwordHash = simpleHash(nw);
      saveAccounts(accounts);
      [el('settingPwCurrent'), el('settingPwNew'), el('settingPwConfirm')].forEach(i => { if (i) i.value = ''; });
      toast('✅ Password updated!');
    });
  }

  if (el('logoutBtn')) {
    el('logoutBtn').addEventListener('click', () => {
      S.onboarded = false;
      setSessionEmail('');
      save();
      toast('👋 Logged out. See you soon!');
      setTimeout(() => location.reload(), 1200);
    });
  }

  if (el('exportAccountBtn')) {
    el('exportAccountBtn').addEventListener('click', () => {
      const email = S.currentEmail || '';
      const accounts = getAccounts();
      const account = accounts[email] || {};
      const exportData = {
        __edupla_export: true,
        version: 1,
        exportedAt: new Date().toISOString(),
        account: { email, ...account },
        state: JSON.parse(JSON.stringify(S))
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'edupla-account-' + (email.split('@')[0] || 'export') + '.json';
      a.click();
      URL.revokeObjectURL(url);
      toast('📦 Account exported! Use this file to log in on another device.');
    });
  }

  document.querySelectorAll('.stab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.stab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.spanel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      if (el('spanel-' + tab.dataset.stab)) el('spanel-' + tab.dataset.stab).classList.add('active');
    });
  });

  if (el('navSettingsBtn')) {
    el('navSettingsBtn').addEventListener('click', () => {
      const isSettings = el('page-settings') && el('page-settings').classList.contains('active');
      if (isSettings) {
        showPage('today');
      } else {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        if (el('page-settings')) el('page-settings').classList.add('active');
        el('navSettingsBtn').classList.add('active');
      }
    });
  }
}

// ═══════════════════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════════════════
function boot(){
  if(el('authScreen')) el('authScreen').style.display='none';
  if(el('mainNav')) el('mainNav').style.display='flex';
  if(el('mainApp')) el('mainApp').style.display='block';
  if(el('heroName')) el('heroName').textContent=S.name||'Student';
  const now=new Date();
  if(el('heroDate')) el('heroDate').textContent=WEEKDAYS[now.getDay()]+', '+MONTHS[now.getMonth()]+' '+now.getDate();

  if(el('hwAddBtn')) {
    el('hwAddBtn').addEventListener('click',()=>{const txt=el('hwText').value.trim();if(!txt){el('hwText').focus();toast('⚠ Enter an assignment name');return;}S.homework.unshift({id:uid(),name:txt,subject:el('hwSubject').value,due:el('hwDue').value,done:false});el('hwText').value='';markActive();checkMissions();renderHomework();renderStats();save();toast('📝 Assignment added!');});
  }
  if(el('hwText')) {
    el('hwText').addEventListener('keydown',e=>{if(e.key==='Enter' && el('hwAddBtn'))el('hwAddBtn').click();});
  }

  if(el('schedAddBtn')) {
    el('schedAddBtn').addEventListener('click',()=>{const time=el('schedTime').value,name=el('schedName').value.trim(),room=el('schedRoom').value.trim();if(!time||!name){toast('⚠ Enter a time and class name');return;}const[h,m]=time.split(':').map(Number);S.schedule.push({id:uid(),time,name,room,slot:h+m/60});el('schedTime').value='';el('schedName').value='';el('schedRoom').value='';renderSchedule();save();toast('📅 Class added!');});
  }
  if(el('schedName')) {
    el('schedName').addEventListener('keydown',e=>{if(e.key==='Enter' && el('schedAddBtn'))el('schedAddBtn').click();});
  }

  if(el('gradeAddBtn')) {
    el('gradeAddBtn').addEventListener('click',()=>{const sub=el('gradeSubject').value.trim(),score=parseFloat(el('gradeScore').value);if(!sub){toast('⚠ Enter a subject name');el('gradeSubject').focus();return;}if(isNaN(score)||score<0||score>100){toast('⚠ Enter a grade 0–100');el('gradeScore').focus();return;}const ex=S.grades.find(g=>g.subject.toLowerCase()===sub.toLowerCase());if(ex){ex.grade=Math.round(score);toast('📊 Grade updated!');}else{S.grades.push({id:uid(),subject:sub,grade:Math.round(score)});toast('📊 Grade added!');}el('gradeSubject').value='';el('gradeScore').value='';renderGrades();save();});
  }
  if(el('gradeScore')) {
    el('gradeScore').addEventListener('keydown',e=>{if(e.key==='Enter' && el('gradeAddBtn'))el('gradeAddBtn').click();});
  }

  if(el('timerBtn')) el('timerBtn').addEventListener('click',()=>{if(timerRunning)pauseTimer();else startTimer();});
  if(el('timerReset')) el('timerReset').addEventListener('click',resetTimer);
  document.querySelectorAll('.dur-btn').forEach(btn=>btn.addEventListener('click',()=>{if(timerRunning) return;document.querySelectorAll('.dur-btn').forEach(b=>b.classList.remove('on'));btn.classList.add('on');S.focusDuration=parseInt(btn.dataset.min);timerSecs=S.focusDuration*60;updateTimerDisplay();if(el('timerLabel'))el('timerLabel').textContent='READY TO FOCUS';}));

  if(el('newQuoteBtn')) {
    el('newQuoteBtn').addEventListener('click',()=>{if(el('motivText'))el('motivText').textContent=QUOTES[Math.floor(Math.random()*QUOTES.length)];});
  }

  applyAppearance();
  genMissions();renderMissions();renderHook();renderHomework();renderStats();renderSchedule();renderGrades();renderFocus();renderHabits();renderNav();
  if(el('motivText'))el('motivText').textContent=QUOTES[Math.floor(Math.random()*QUOTES.length)];
  updateTimerDisplay();
  populateSettings();
  wireSettings();
  markActive();checkMissions();

  setInterval(renderSchedule,60000);
  setInterval(checkMissions,30000);
  setInterval(save,10000);
}

// ═══════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════
(function() {
  const email = getSessionEmail();
  if (email) {
    const accounts = getAccounts();
    if (accounts[email] && S.onboarded) {
      S.name = accounts[email].name || S.name;
      S.currentEmail = email;
      dailyReset();
      applyAppearance();
      if(el('authScreen')) el('authScreen').style.display = 'none';
      boot();
      return;
    }
  }
  dailyReset();
  if(el('authScreen')) el('authScreen').style.display = 'flex';
  setTimeout(() => { if (el('suName')) el('suName').focus(); }, 100);
})();