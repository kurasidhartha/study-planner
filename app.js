
const KEY='study-planner-v1';
let S;try{S=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){S={}}
S.subjects=S.subjects||[];S.log=S.log||{};
const $=s=>document.querySelector(s);
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const uid=()=>Math.random().toString(36).slice(2,9);
const esc=t=>t.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const dkey=d=>new Date(d).toLocaleDateString('en-CA');
const run=s=>s.start?Math.floor((Date.now()-s.start)/1000):0;
const elapsed=s=>s.secs+run(s);
const fmt=t=>[Math.floor(t/3600),Math.floor(t%3600/60),t%60].map(n=>String(n).padStart(2,'0')).join(':');
const short=t=>t>=3600?`${Math.floor(t/3600)}h ${Math.floor(t%3600/60)}m`:`${Math.floor(t/60)}m`;
function commit(s){if(!s.start)return;const d=run(s),k=dkey(Date.now());s.secs+=d;S.log[k]=(S.log[k]||0)+d;s.start=null}
const dayTotal=k=>(S.log[k]||0)+S.subjects.reduce((a,s)=>a+(dkey(Date.now())===k?run(s):0),0);
function streak(){let n=0,t=Date.now();if(dayTotal(dkey(t))<60)t-=864e5;while(dayTotal(dkey(t))>=60){n++;t-=864e5}return n}

function stats(){
  const days=[...Array(7)].map((_,i)=>Date.now()-(6-i)*864e5),vals=days.map(d=>dayTotal(dkey(d))),max=Math.max(...vals,1);
  const tp=S.subjects.flatMap(s=>s.topics),dn=tp.filter(t=>t.done).length;
  $('#stats').innerHTML=`<div class="stat"><b>${short(vals[6])}</b><span>studied today</span></div>
  <div class="stat"><b>${streak()}🔥</b><span>day streak</span></div>
  <div class="stat"><b>${dn}/${tp.length}</b><span>topics done</span></div>
  <div class="week" aria-label="Last 7 days of study time">${days.map((d,i)=>`<div class="${i==6?'today':''}" title="${short(vals[i])}"><i style="height:${Math.max(6,vals[i]/max*100)*.7}%"></i>${new Date(d).toLocaleDateString('en',{weekday:'narrow'})}</div>`).join('')}</div>`;
}
function ring(s){const g=(s.goal||0)*60;return g?Math.min(1,elapsed(s)/g):Math.min(1,s.topics.length?s.topics.filter(t=>t.done).length/s.topics.length:0)}
function render(){
  $('#list').innerHTML=S.subjects.map((s,i)=>{
    const done=s.topics.filter(t=>t.done).length,n=s.topics.length,p=n?Math.round(done/n*100):0;
    return `<article class="subject ${s.start?'running':''}" style="--c:${s.color};--p:${p}%" data-id="${s.id}">
    <div class="top"><span class="grip" draggable="true" title="Drag to reorder" aria-hidden="true">⠿</span>
    <div class="ring"><svg viewBox="0 0 64 64"><circle class="bg" cx="32" cy="32" r="26"/><circle class="fg" data-r="${s.id}" cx="32" cy="32" r="26" style="stroke-dashoffset:${163.4*(1-ring(s))}"/></svg>${s.emoji||'📘'}</div>
    <div class="name"><h2>${esc(s.name)}</h2><small>${s.goal?`Goal: ${s.goal} min`:'No time goal set'}</small></div>
    <span class="time" data-t="${s.id}">${fmt(elapsed(s))}</span>
    <button class="timerbtn" data-a="timer">${s.start?'Pause':'Start timer'}</button></div>
    <div class="bar"><i></i></div>
    <div class="meta"><span>${done} of ${n} topics done · ${p}%</span>
    <span><button class="ghost" data-a="up" ${i==0?'disabled':''} aria-label="Move up">▲</button><button class="ghost" data-a="down" ${i==S.subjects.length-1?'disabled':''} aria-label="Move down">▼</button><button class="ghost" data-a="goal">Set goal</button><button class="ghost" data-a="rename">Rename</button><button class="ghost" data-a="zero">Reset time</button><button class="ghost" data-a="del">Delete</button></span></div>
    <ul>${s.topics.map(t=>`<li class="${t.done?'done':''}" data-tid="${t.id}"><label><input type="checkbox" data-a="check" ${t.done?'checked':''}><span>${esc(t.name)}</span></label><button class="ghost" data-a="deltopic" aria-label="Remove topic">✕</button></li>`).join('')||'<li class="empty">No topics yet. Add your first chapter below.</li>'}</ul>
    <form class="add"><input placeholder="Add a topic" maxlength="80" required aria-label="New topic"><button>Add topic</button></form></article>`}).join('')
    ||'<p class="empty" style="text-align:center;padding:30px">Nothing here yet. Add a subject above to start planning.</p>';
  stats();
}
function confetti(){const c=$('#fx'),x=c.getContext('2d');c.width=innerWidth;c.height=innerHeight;if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  const P=[...Array(120)].map(()=>({x:innerWidth/2,y:innerHeight/3,vx:(Math.random()-.5)*14,vy:Math.random()*-12-2,c:`hsl(${Math.random()*360},90%,65%)`,s:4+Math.random()*5}));
  let f=0;(function a(){x.clearRect(0,0,c.width,c.height);P.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.35;x.fillStyle=p.c;x.fillRect(p.x,p.y,p.s,p.s)});if(++f<110)requestAnimationFrame(a);else x.clearRect(0,0,c.width,c.height)})()}

$('#addSubject').onsubmit=e=>{e.preventDefault();const n=$('#subName').value.trim();if(!n)return;
  S.subjects.push({id:uid(),name:n,color:$('#subColor').value,emoji:$('#subEmoji').value,goal:0,secs:0,start:null,topics:[]});$('#subName').value='';save();render()};
$('#list').addEventListener('submit',e=>{e.preventDefault();const s=S.subjects.find(x=>x.id===e.target.closest('.subject').dataset.id),v=e.target.querySelector('input').value.trim();
  if(v){s.topics.push({id:uid(),name:v,done:false});save();render();document.querySelector(`[data-id="${s.id}"] .add input`).focus()}});
$('#list').addEventListener('click',e=>{const b=e.target.closest('button[data-a]');if(!b)return;
  const i=S.subjects.findIndex(x=>x.id===b.closest('.subject').dataset.id),s=S.subjects[i],act=b.dataset.a;
  if(act==='timer'){if(s.start)commit(s);else{S.subjects.forEach(commit);s.start=Date.now()}}
  else if(act==='up'&&i>0)S.subjects.splice(i-1,0,S.subjects.splice(i,1)[0]);
  else if(act==='down'&&i<S.subjects.length-1)S.subjects.splice(i+1,0,S.subjects.splice(i,1)[0]);
  else if(act==='goal'){const g=prompt('Study goal in minutes (0 to remove)',s.goal||60);if(g!==null&&!isNaN(+g))s.goal=Math.max(0,Math.round(+g))}
  else if(act==='rename'){const n=prompt('New subject name',s.name);if(n&&n.trim())s.name=n.trim()}
  else if(act==='zero'){if(confirm('Reset the timer for this subject?')){commit(s);s.secs=0}}
  else if(act==='del'){if(confirm(`Delete ${s.name} and its topics?`)){commit(s);S.subjects.splice(i,1)}}
  else if(act==='deltopic'){s.topics=s.topics.filter(t=>t.id!==b.closest('li').dataset.tid)}
  else return;
  save();render()});
$('#list').addEventListener('change',e=>{if(e.target.dataset.a!=='check')return;
  const s=S.subjects.find(x=>x.id===e.target.closest('.subject').dataset.id),t=s.topics.find(x=>x.id===e.target.closest('li').dataset.tid);t.done=e.target.checked;
  save();render();if(t.done&&s.topics.every(x=>x.done))confetti()});

let drag=null;
$('#list').addEventListener('dragstart',e=>{const a=e.target.closest('.subject');if(!a||!e.target.classList.contains('grip'))return;drag=a.dataset.id;e.dataTransfer.effectAllowed='move';e.dataTransfer.setDragImage(a,20,20)});
$('#list').addEventListener('dragover',e=>{const a=e.target.closest('.subject');if(!a||!drag)return;e.preventDefault();document.querySelectorAll('.dragover').forEach(x=>x.classList.remove('dragover'));a.classList.add('dragover')});
$('#list').addEventListener('drop',e=>{const a=e.target.closest('.subject');if(!a||!drag)return;e.preventDefault();
  const from=S.subjects.findIndex(x=>x.id===drag),to=S.subjects.findIndex(x=>x.id===a.dataset.id);S.subjects.splice(to,0,S.subjects.splice(from,1)[0]);drag=null;save();render()});
$('#list').addEventListener('dragend',()=>{drag=null;document.querySelectorAll('.dragover').forEach(x=>x.classList.remove('dragover'))});

$('#reset').onclick=()=>{if(confirm('Delete all subjects, topics, timers and history?')){S={subjects:[],log:{}};save();render()}};
$('#export').onclick=()=>{const t=S.subjects.map(s=>`${s.name} (${fmt(elapsed(s))})\n`+s.topics.map(x=>`  [${x.done?'x':' '}] ${x.name}`).join('\n')).join('\n\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t||'Nothing yet'],{type:'text/plain'}));a.download='study-progress.txt';a.click()};
$('#theme').onclick=()=>{const r=document.documentElement,d=r.dataset.theme==='dark'?'light':'dark';r.dataset.theme=d;try{localStorage.setItem('sp-theme',d)}catch(e){}};
try{document.documentElement.dataset.theme=localStorage.getItem('sp-theme')||'dark'}catch(e){}

setInterval(()=>{S.subjects.forEach(s=>{const t=document.querySelector(`[data-t="${s.id}"]`);if(t)t.textContent=fmt(elapsed(s));const r=document.querySelector(`[data-r="${s.id}"]`);if(r)r.style.strokeDashoffset=163.4*(1-ring(s))});stats()},1000);
render();
