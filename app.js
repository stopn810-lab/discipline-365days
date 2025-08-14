// 365 Discipline core
const MUST_DO = [
  {id:'water', label:'Drink 2L water'},
  {id:'workout', label:'Exercise / full-body workout'},
  {id:'vocab', label:'Read 20 vocabulary words'},
  {id:'pharma', label:'Study Pharmacy – 5 hours'},
  {id:'homework', label:'Homework/College work – 2 hours'},
  {id:'english', label:'Practice 10-min English speaking'},
  {id:'care', label:'Skincare + Haircare + Hygiene'},
  {id:'mind', label:'Read about mental toughness & enduring pain'}
];

const MUST_NOT = [
  {id:'porn', label:'No porn / masturbation'},
  {id:'sugar', label:'No sugar / excessive salt'},
  {id:'junk', label:'No junk / processed food'},
  {id:'social', label:'No social media (YouTube, Instagram, etc.)'},
  {id:'music', label:'No music/songs/videos'},
  {id:'pop', label:'No pop culture/superhero content'}
];

const CAN_DO = [
  {id:'skill', label:'Improve or learn a new skill'}
];

const ONE_DAY_MS = 24*60*60*1000;

const $ = (id)=>document.getElementById(id);
const state = {
  started: JSON.parse(localStorage.getItem('d365_started')||'false'),
  day: parseInt(localStorage.getItem('d365_day')||'1',10),
  startTime: parseInt(localStorage.getItem('d365_startTime')||'0',10),
  history: JSON.parse(localStorage.getItem('d365_history')||'[]'), // {day, completed:true/false, ts, reason?}
  current: JSON.parse(localStorage.getItem('d365_current')||'{}'), // {mustDo:{id:true}, mustNot:{id:false}, canDo:{id:true}}
};

function save(){
  localStorage.setItem('d365_started', JSON.stringify(state.started));
  localStorage.setItem('d365_day', String(state.day));
  localStorage.setItem('d365_startTime', String(state.startTime));
  localStorage.setItem('d365_history', JSON.stringify(state.history));
  localStorage.setItem('d365_current', JSON.stringify(state.current));
}

function resetAll(reason='Manual reset'){
  if(state.started){
    state.history.push({day: state.day, completed:false, ts: Date.now(), reason});
  }
  state.started = false;
  state.day = 1;
  state.startTime = 0;
  state.current = {mustDo:{}, mustNot:{}, canDo:{}};
  save();
  render();
  alert('Challenge reset. Reason: '+reason);
}

function startChallenge(){
  if(state.started) return;
  state.started = true;
  state.day = 1;
  state.startTime = Date.now();
  state.current = {mustDo:{}, mustNot:{}, canDo:{}};
  save();
  render();
}

function nextDay(){
  // Log completion
  state.history.push({day: state.day, completed:true, ts: Date.now()});
  // Advance
  if(state.day>=365){
    alert('Congratulations! You completed 365 days.');
    state.started = false;
  } else {
    state.day += 1;
    state.startTime = Date.now();
    state.current = {mustDo:{}, mustNot:{}, canDo:{}};
  }
  save();
  render();
}

function toggle(id, kind){
  state.current[kind] = state.current[kind] || {};
  // For mustNot: toggle true means "violated" (danger)
  const prev = !!state.current[kind][id];
  state.current[kind][id] = !prev;
  save();
  render();

  if(kind==='mustNot' && state.current.mustNot[id]===true){
    // Immediate reset on violation
    resetAll('Must-Not-Do violated: '+id);
  }
}

function allMustDoDone(){
  return MUST_DO.every(x => state.current.mustDo && state.current.mustDo[x.id]);
}
function anyMustNotViolated(){
  return MUST_NOT.some(x => state.current.mustNot && state.current.mustNot[x.id]===true);
}

function finishDay(){
  if(!state.started) return;
  if(anyMustNotViolated()){
    resetAll('Must-Not-Do violated');
    return;
  }
  if(!allMustDoDone()){
    alert('Finish all Must-Do items before completing the day.');
    return;
  }
  nextDay();
}

function countdownTick(){
  if(!state.started || !state.startTime){ $('countdown').textContent='--:--:--'; return; }
  const now = Date.now();
  const end = state.startTime + ONE_DAY_MS;
  const remain = end - now;
  if(remain <= 0){
    resetAll('24 hours expired before completing the day');
    return;
  }
  const h = Math.floor(remain/3600000);
  const m = Math.floor((remain%3600000)/60000);
  const s = Math.floor((remain%60000)/1000);
  $('countdown').textContent = 
    String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}

function renderLists(){
  const mustDoList = $('mustDoList'); mustDoList.innerHTML='';
  MUST_DO.forEach(item=>{
    const done = !!(state.current.mustDo && state.current.mustDo[item.id]);
    const div = document.createElement('div');
    div.className='item';
    div.innerHTML = `<div class="left"><input type="checkbox" ${done?'checked':''} data-kind="mustDo" data-id="${item.id}"><div class="title">${item.label}</div></div>
      <span class="pill">${done?'Done ✓':'Pending'}</span>`;
    mustDoList.appendChild(div);
  });
  const mustNotList = $('mustNotList'); mustNotList.innerHTML='';
  MUST_NOT.forEach(item=>{
    const violated = !!(state.current.mustNot && state.current.mustNot[item.id]);
    const div = document.createElement('div');
    div.className='item';
    div.innerHTML = `<div class="left"><input type="checkbox" ${violated?'checked':''} data-kind="mustNot" data-id="${item.id}"><div class="title">${item.label}</div></div>
      <span class="pill" style="background:${violated?'#1a0b0b':'#0b1020'};color:${violated?'#ef4444':'#e5e7eb'}">${violated?'Violated ✗':'No violation'}</span>`;
    mustNotList.appendChild(div);
  });
  const canDoList = $('canDoList'); canDoList.innerHTML='';
  CAN_DO.forEach(item=>{
    const did = !!(state.current.canDo && state.current.canDo[item.id]);
    const div = document.createElement('div');
    div.className='item';
    div.innerHTML = `<div class="left"><input type="checkbox" ${did?'checked':''} data-kind="canDo" data-id="${item.id}"><div class="title">${item.label}</div></div>
      <span class="pill">${did?'Completed ✓':'Optional'}</span>`;
    canDoList.appendChild(div);
  });
}

function renderHeader(){
  $('dayLabel').textContent = 'Day ' + (state.started ? state.day : 0);
  $('status').textContent = state.started ? 'Active' : 'Not started';
  $('completedDays').textContent = state.history.filter(h=>h.completed).length;
  $('startBtn').style.display = state.started ? 'none' : 'inline-flex';
}

function renderChart(){
  const chart = $('chart'); chart.innerHTML='';
  const total = 365;
  const completedSet = new Set(state.history.filter(h=>h.completed).map(h=>h.day));
  const failedDays = new Set(state.history.filter(h=>!h.completed).map(h=>h.day));
  for(let i=1;i<=total;i++){
    const div = document.createElement('div');
    div.className = 'dot';
    if(completedSet.has(i)) div.classList.add('done');
    if(failedDays.has(i)) div.classList.add('reset');
    if(state.started && i===state.day) div.classList.add('current');
    chart.appendChild(div);
  }
}

function render(){
  renderHeader();
  renderLists();
  renderChart();
  countdownTick();
}

document.addEventListener('click', (e)=>{
  const t = e.target;
  if(t.matches('input[type="checkbox"][data-id]')){
    const id = t.getAttribute('data-id');
    const kind = t.getAttribute('data-kind');
    toggle(id, kind);
  }
});
$('startBtn').addEventListener('click', startChallenge);
$('finishDayBtn').addEventListener('click', finishDay);
$('resetBtn').addEventListener('click', ()=>resetAll('Hard reset button'));
$('exportBtn').addEventListener('click', ()=>{
  const data = {
    state,
    config: {MUST_DO, MUST_NOT, CAN_DO},
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'discipline_365_export.json';
  a.click();
  URL.revokeObjectURL(url);
});

// Install prompt
let deferredPrompt=null;
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault(); deferredPrompt = e; $('installBtn').hidden=false;
});
$('installBtn').addEventListener('click', async ()=>{ if(deferredPrompt){ deferredPrompt.prompt(); deferredPrompt=null; }});

// Service worker
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>navigator.serviceWorker.register('sw.js'));
}

// Tick countdown every second
setInterval(countdownTick, 1000);
render();
