const KEY='study-planner-v1';
let S;try{S=JSON.parse(localStorage.getItem(KEY))||{subjects:[]}}catch(e){S={subjects:[]}}
const $=s=>document.querySelector(s);
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const uid=()=>Math.random().toString(36).slice(2,9);
const esc=t=>t.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const elapsed=s=>s.secs+(s.start?Math.floor((Date.now()-s.start)/1000):0);
const fmt=t=>{const h=Math.floor(t/3600),m=Math.floor(t%3600/60),x=t%60;return [h,m,x].map(n=>String(n).padStart(2,'0')).join(':')};

function render(){
  const list=$('#list');
  list.innerHTML=S.subjects.map((s,i)=>{
    const done=s.topics.filter(t=>t.done).length,n=s.topics.length,p=n?Math.round(done/n*100):0;
    return `<article class="subject ${s.start?'running':''}" style="--c:${s.color};--p:${p}%" data-id="${s.id}">
    <div class="top"><h2>${esc(s.name)}</h2><span class="time" data-t="${s.id}">${fmt(elapsed(s))}</span>
    <button class="timerbtn" data-a="timer">${s.start?'Pause':'Start timer'}</button></div>
    <div class="bar"><i></i></div>
    <div class="meta"><span>${done} of ${n} topics done (${p}%)</span>
    <span><button class="ghost" data-a="up" ${i==0?'disabled':''} aria-label="Move up">▲</button><button class="ghost" data-a="down" ${i==S.subjects.length-1?'disabled':''} aria-label="Move down">▼</button><button class="ghost" data-a="rename">Rename</button><button class="ghost" data-a="zero">Reset time</button><button class="ghost" data-a="del">Delete</button></span></div>
    <ul>${s.topics.map(t=>`<li class="${t.done?'done':''}" data-tid="${t.id}"><label><input type="checkbox" data-a="check" ${t.done?'checked':''}><span>${esc(t.name)}</span></label><button class="ghost" data-a="deltopic" aria-label="Remove topic">✕</button></li>`).join('')||'<li><span style="color:var(--mute)">No topics yet. Add the first chapter or topic below.</span></li>'}</ul>
    <form class="add"><input placeholder="Add a topic" maxlength="80" required aria-label="New topic"><button>Add topic</button></form></article>`}).join('');
  const total=S.subjects.reduce((a,s)=>a+elapsed(s),0),topics=S.subjects.flatMap(s=>s.topics),d=topics.filter(t=>t.done).length;
  $('#summary').textContent=S.subjects.length?`${d} of ${topics.length} topics done · ${fmt(total)} studied in total`:'Add your first subject to get started.';
}
function stopAll(except){S.subjects.forEach(s=>{if(s.start&&s.id!==except){s.secs=elapsed(s);s.start=null}})}

$('#addSubject').onsubmit=e=>{e.preventDefault();const n=$('#subName').value.trim();if(!n)return;
  S.subjects.push({id:uid(),name:n,color:$('#subColor').value,secs:0,start:null,topics:[]});$('#subName').value='';save();render()};

$('#list').addEventListener('submit',e=>{e.preventDefault();const a=e.target.closest('.subject'),s=S.subjects.find(x=>x.id===a.dataset.id),v=e.target.querySelector('input').value.trim();
  if(v){s.topics.push({id:uid(),name:v,done:false});save();render();document.querySelector(`[data-id="${s.id}"] .add input`).focus()}});

$('#list').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b||b.tagName==='INPUT')return;
  const a=b.closest('.subject'),i=S.subjects.findIndex(x=>x.id===a.dataset.id),s=S.subjects[i],act=b.dataset.a;
  if(act==='timer'){if(s.start){s.secs=elapsed(s);s.start=null}else{stopAll(s.id);s.start=Date.now()}}
  else if(act==='up'&&i>0)S.subjects.splice(i-1,0,S.subjects.splice(i,1)[0]);
  else if(act==='down'&&i<S.subjects.length-1)S.subjects.splice(i+1,0,S.subjects.splice(i,1)[0]);
  else if(act==='rename'){const n=prompt('New subject name',s.name);if(n&&n.trim())s.name=n.trim()}
  else if(act==='zero'){if(confirm('Reset the timer for this subject?')){s.secs=0;if(s.start)s.start=Date.now()}}
  else if(act==='del'){if(confirm(`Delete ${s.name} and its topics?`))S.subjects.splice(i,1)}
  else if(act==='deltopic'){s.topics=s.topics.filter(t=>t.id!==b.closest('li').dataset.tid)}
  else return;
  save();render()});
$('#list').addEventListener('change',e=>{if(e.target.dataset.a!=='check')return;
  const s=S.subjects.find(x=>x.id===e.target.closest('.subject').dataset.id),t=s.topics.find(x=>x.id===e.target.closest('li').dataset.tid);t.done=e.target.checked;save();render()});

$('#reset').onclick=()=>{if(confirm('Delete all subjects, topics and timers?')){S={subjects:[]};save();render()}};
$('#export').onclick=()=>{const t=S.subjects.map(s=>`${s.name} (${fmt(elapsed(s))})\n`+s.topics.map(x=>`  [${x.done?'x':' '}] ${x.name}`).join('\n')).join('\n\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t||'Nothing yet'],{type:'text/plain'}));a.download='study-progress.txt';a.click()};
$('#theme').onclick=()=>{const r=document.documentElement,d=r.dataset.theme==='dark'?'light':'dark';r.dataset.theme=d;try{localStorage.setItem('sp-theme',d)}catch(e){}};
try{const th=localStorage.getItem('sp-theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.dataset.theme=th}catch(e){}

setInterval(()=>{let tot=0;S.subjects.forEach(s=>{const el=document.querySelector(`[data-t="${s.id}"]`);if(el)el.textContent=fmt(elapsed(s))})},1000);
render();
