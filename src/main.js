'use strict';
/* ===== utils & save ===== */
const $=i=>document.getElementById(i),RI=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const mul=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const fresh=()=>({unlocked:1,done:[],frags:[],run:{t:0,h:0}});
let SV=fresh();try{SV=Object.assign(fresh(),JSON.parse(localStorage.getItem('ptlc')||'{}'))}catch(e){}
const save=()=>{try{localStorage.setItem('ptlc',JSON.stringify(SV))}catch(e){}};
const KEY_SVG='<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>';

/* ===== math / puzzles ===== */
const F=(n,a,b)=>({n,a,b,ap:x=>a*x+b,rhs:`${a==1?'':a}x ${b<0?'− '+(-b):'+ '+b}`,txt:`${n}(x) = ${a==1?'':a}x ${b<0?'− '+(-b):'+ '+b}`,sub:v=>`${a==1?v:a+'('+v+')'} ${b<0?'− '+(-b):'+ '+b}`});
const LV=[
 {n:'The Forgotten Forest',d:'Easy',kn:'Forest Key',kc:0xffd24c,fs:[F('f',2,3)],x:5,bg:'linear-gradient(#7fb069,#1f3a2b)'},
 {n:'The Crystal Cavern',d:'Medium',kn:'Crystal Key',kc:0x7be8ff,fs:[F('f',2,3),F('g',1,-1)],x:4,bg:'linear-gradient(#4aa8ff,#0b1230)'},
 {n:'The Final Vault',d:'Hard',kn:'Vault Key',kc:0xffe066,fs:[F('f',2,1),F('g',1,3),F('h',3,-2)],x:2,bg:'linear-gradient(#e0b23c,#2a1c08)'}
];
function mkPuz(fns,x){ // fns listed outermost -> innermost
 let v=x;for(let i=fns.length-1;i>=0;i--)v=fns[i].ap(v);
 const comp=fns.map(f=>f.ap).reduce((a,b)=>y=>a(b(y)));if(comp(x)!==v)throw Error('Puzzle verification failed');
 const nm=fns.map(f=>f.n),nest=nm.reduceRight((a,n)=>n+'('+a+')',x);
 return{fns,x,ans:v,nest,nt:fns.length==1?`f(${x})`:`(${nm.join(' ∘ ')})(${x}) = ${nest}`,hs:0,
  hints:()=>{const i=fns[fns.length-1],o=fns.length>1?fns[fns.length-2]:null;return[
   `Work from the inside out. The innermost function is ${i.n}, so evaluate ${i.n}(${x}) first.`,
   `Substitute x = ${x} into ${i.n}: ${i.n}(${x}) = ${i.sub(x)}. Compute that value.`,
   o?`Now treat your result as the new input for ${o.n}, i.e. ${o.n}(□) = ${o.sub('□')}. Keep moving outward until you finish with ${fns[0].n}.`:`Do the multiplication first, then the addition or subtraction: ${i.sub(x)}.`]}}
}
const QD=[
 [['explore','Explore the Forgotten Forest'],['find','Discover the hidden Forest Chest'],['chest','Unlock the Wooden Treasure Chest'],['key','Obtain the Forest Key'],['door','Unlock the Forest Exit Door'],['next','Enter the exit portal']],
 [['explore','Explore the Crystal Cavern'],['find','Discover the hidden Crystal Grotto'],['chest','Solve the Crystal Chest puzzle'],['key','Obtain the Crystal Key'],['door','Unlock the Cavern Exit Door'],['next','Enter the exit portal']],
 [['explore','Enter the Final Vault'],['find','Uncover the Secret Treasury Vault'],['chest','Solve the Vault Chest 3-function puzzle'],['key','Obtain the Vault Key'],['door','Unlock the Final Vault Door'],['treasure','Claim the Legendary Treasure']]
];

/* ===== audio ===== */
let AC,MG,MU,mute=false,vm=.7,vu=.5;
function au(){try{if(!AC){AC=new(window.AudioContext||window.webkitAudioContext)();MG=AC.createGain();MG.connect(AC.destination);MU=AC.createGain();MU.connect(MG);vol()}if(AC.state!=='running')AC.resume()}catch(e){}}
function vol(){if(!AC)return;MG.gain.value=mute?0:vm;MU.gain.value=vu}
function tone(f,d,ty='sine',v=.15,dl=0,to,dest){if(!AC)return;const t=AC.currentTime+dl,o=AC.createOscillator(),g=AC.createGain();o.type=ty;o.frequency.setValueAtTime(f,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(dest||MG);o.start(t);o.stop(t+d+.05)}
function nz(d,v,fc){if(!AC)return;const n=AC.sampleRate*d|0,b=AC.createBuffer(1,n,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=b;f.type='lowpass';f.frequency.value=fc;g.gain.value=v;s.connect(f);f.connect(g);g.connect(MG);s.start()}
const SFX={
 step:()=>nz(.08,.25,600),
 jump:()=>tone(300,.25,'square',.06,0,700),
 use:()=>tone(520,.12,'triangle',.15),
 pickup:()=>{tone(880,.2,'sine',.15);tone(1320,.3,'sine',.12,.1)},
 ok:()=>[523,659,784,1047].forEach((f,i)=>tone(f,.5,'triangle',.18,i*.1)),
 bad:()=>tone(180,.35,'sawtooth',.12,0,90),
 locked:()=>{tone(140,.14,'square',.1,0,95);tone(110,.18,'square',.1,.11,75)},
 lockOpen:()=>{tone(920,.12,'triangle',.18);tone(1380,.18,'sine',.14,.07)},
 keyGet:()=>[659,880,1047,1319,1568].forEach((f,i)=>tone(f,.42,'sine',.16,i*.07)),
 door:()=>{nz(1.4,.45,320);tone(78,1.4,'sawtooth',.12,0,45)},
 win:()=>[523,659,784,1047,1319,1568].forEach((f,i)=>tone(f,1.2,'triangle',.2,i*.15)),
 chest:()=>{nz(.65,.35,850);tone(190,.85,'sawtooth',.1,0,390)},
 nearChime0:()=>{tone(659,.35,'sine',.06);tone(988,.45,'sine',.05,.08);tone(1318,.55,'sine',.04,.16)},
 nearChime1:()=>{tone(587,.5,'triangle',.05);tone(880,.6,'triangle',.04,.1);tone(1175,.7,'sine',.03,.2)},
 nearChime2:()=>{tone(440,.7,'sine',.07);tone(554,.8,'sine',.06,.12);tone(659,1.0,'sine',.05,.25)}
};
const sfx=n=>{au();SFX[n]&&SFX[n]()};
setInterval(()=>{if(!AC||mute)return;const l=G.on?G.lv:0,sc=[[220,247,277,330,370,440],[196,220,233,294,349,392],[110,131,147,165,196,220]][l],f=sc[RI(0,5)];
 tone(f,2.4,l==2?'sawtooth':'triangle',l==2?.025:.05,0,0,MU);if(Math.random()<.4)tone(f*2,1.6,'sine',.03,.3,0,MU);
 if(G.on&&Math.random()<.3){if(l==0)tone(RI(2000,3000),.12,'sine',.03,0,RI(1500,2400));else if(l==1)tone(1200,.15,'sine',.05,0,600);else nz(2,.05,200)}},900);

/* ===== state / ui ===== */
let G={on:false,lv:0,q:{},insc:new Set(),keys:{},hasKey:false,chestState:'locked',doorState:'locked',solved:false,cine:0};
let ST='menu',SB='menu',K={},W=null,COL=[],IT=[],ANI=[],yaw=0,pitch=.35,drag=false,lockT=0;
let DOOR=null,GC=null,CHEST=null,PG=null,ORB=null,RELIC=null,GATE_T=0;
const P={x:0,y:0,z:24,vx:0,vz:0,vy:0,g:true,face:Math.PI,sp:0,st:0,act:0};

function ui(id){
 ST=id||'play';K={};
 document.querySelectorAll('.ov').forEach(e=>e.classList.toggle('on',e.id===id));
 if(id&&document.pointerLockElement)document.exitPointerLock();
 $('hud').style.display=ST==='play'?'block':'none';
 if(id==='cards'||id==='lvls')renderCards();
 if(id==='quest')renderQ();
 if(id==='inv')renderInv();
 if(id==='menu'){$('bc').disabled=SV.unlocked==1&&!SV.done.length&&!SV.run.t}
}

let tt;
function toast(m,kind=''){
 const e=$('toast');
 e.textContent=m;
 e.className=kind?`on ${kind}`:'on';
 clearTimeout(tt);
 tt=setTimeout(()=>e.classList.remove('on'),3600);
}

let kpt;
function showKeyPop(lvIdx){
 const L=LV[lvIdx],kp=$('key-pop');
 kp.querySelector('.kp-icon').innerHTML=KEY_SVG;
 $('kp-sub').textContent=`${L.kn} (Level ${lvIdx+1}) added to Key Inventory`;
 kp.classList.add('on');
 const kh=$('keyhud');kh.classList.remove('pulse');void kh.offsetWidth;kh.classList.add('pulse');
 clearTimeout(kpt);
 kpt=setTimeout(()=>{kp.classList.remove('on');kh.classList.remove('pulse')},3200);
}

function renderCards(){
 $('cards').innerHTML=LV.map((l,i)=>{
  const dn=SV.done.includes(i+1),lk=i+1>SV.unlocked;
  return`<button class="pn card ${lk?'lk':''}" data-a="lv${i}" ${lk?'disabled':''}><div class="pv" style="background:${l.bg}"></div><div class="b"><h3>Level ${i+1}</h3>${l.n}<br><small>Difficulty: ${l.d}</small><br><b>${dn?'✔ Completed':lk?'Locked':'Available'}</b></div></button>`;
 }).join('');
}

function renderQ(){
 $('ql').innerHTML=QD.map((d,i)=>`<h3>LEVEL ${i+1}</h3>`+d.map(([k,t])=>{
  const dn=SV.done.includes(i+1)||(G.on&&G.lv===i&&G.q[k]);
  return`<div class="q ${dn?'d':''}">${dn?'[✔]':'[ ]'} ${t}</div>`;
 }).join('')).join('');
}

function items(){
 const a=[];
 if(G.on){
  if(G.keys&&G.keys[G.lv]){
   const L=LV[G.lv];
   a.push({n:`${L.kn} (Level ${G.lv+1})`,d:`Obtained from the Wooden Treasure Chest in ${L.n}. Unlocks the Level ${G.lv+1} Exit Door.`});
  }
  [...G.insc].forEach(i=>{
   const f=LV[G.lv].fs[i];
   a.push({n:'Inscription: '+f.n+'(x)',d:`${f.txt}. Evaluate this function whenever it is the innermost step of a composition — the inside function is always applied first.`});
  });
 }
 SV.frags.forEach(i=>a.push({n:'Treasure Fragment '+['I','II','III'][i],d:['A moss-green shard of the map, found beyond the Forest Door.','A glowing blue shard of the map, pulled from the Crystal Cavern.','The final shard.'][i]}));
 return a;
}

function renderInv(){
 const a=items();
 $('il').innerHTML=a.length?a.map((x,i)=>`<button class="it" data-a="it${i}">${x.n}</button>`).join(''):'<p class="hh">Nothing collected yet.</p>';
 $('idesc').textContent='Select an item to inspect it.';
}

function hudUpd(){
 if(!G.on)return;
 const L=LV[G.lv],o=QD[G.lv].find(([k])=>!G.q[k]);
 const chOk=G.chestState==='opened',kyOk=!!(G.hasKey&&G.keys[G.lv]),drOk=G.doorState==='unlocked';
 $('obj').innerHTML=
  `<b>Level ${G.lv+1} — ${L.n}</b><br>${o?'Objective: '+o[1]:'All objectives complete'}`+
  `<div class="st-row">`+
  `<span class="pill ${chOk?'ok':'lk'}">Chest: ${chOk?'Opened':'Locked'}</span>`+
  `<span class="pill ${kyOk?'ok':'lk'}">Key: ${kyOk?'1/1':'0/1'}</span>`+
  `<span class="pill ${drOk?'ok':'lk'}">Door: ${drOk?'Open':'Locked'}</span>`+
  `</div>`;
 const slots=[0,1,2].map(idx=>{
  const got=(G.keys&&G.keys[idx])||SV.done.includes(idx+1);
  return`<span class="kh-slot ${idx===G.lv?'cur':''} ${got?'got':''}" title="Level ${idx+1} Key">K${idx+1}</span>`;
 }).join('');
 $('keyhud').innerHTML=
  `<div class="kh-main"><span class="kh-icon ${kyOk?'has':''}">${KEY_SVG}</span>`+
  `<div class="kh-lbl"><b>${L.kn}</b><span>${kyOk?'Obtained (1/1)':'Locked in Chest (0/1)'}</span></div></div>`+
  `<div class="kh-slots">${slots}</div>`;
 $('ic').textContent='('+items().length+')';
}

function q(k){
 if(G.q[k])return;
 G.q[k]=1;
 const found=QD[G.lv].find(x=>x[0]===k);
 if(found){toast('✔ '+found[1],'ok');sfx('pickup')}
 hudUpd();
}

const ACT={
 new(){au();SV=fresh();save();startLevel(0)},
 cont(){au();startLevel(Math.min(SV.unlocked,3)-1)},
 lvls(){au();ui('lvls')},
 sett(){SB=ST==='pause'?'pause':'menu';ui('sett')},
 sback(){ui(SB)},
 cred(){ui('cred')},
 menu(){save();ui('menu')},
 quest(){ui('quest')},
 inv(){ui('inv')},
 pause(){pause()},
 resume(){resume()},
 restart(){startLevel(G.lv)},
 replay(){SV.run={t:0,h:0};SV.frags=[];startLevel(0)}
};
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-a]');if(!b)return;au();
 const a=b.dataset.a;
 if(/^lv\d$/.test(a))startLevel(+a[2]);
 else if(/^it\d+$/.test(a))$('idesc').textContent=items()[+a.slice(2)].d;
 else ACT[a]&&ACT[a]();
});
function pause(){if(ST!=='play')return;save();ui('pause')}
function resume(){if(!G.on)return ui('menu');ui(null);try{cv.requestPointerLock()}catch(e){}}
$('vm').oninput=e=>{vm=+e.target.value;vol()};
$('vu').oninput=e=>{vu=+e.target.value;vol()};
$('mu').onchange=e=>{mute=e.target.checked;vol()};

/* ===== puzzle ui ===== */
function openPuz(kind){
 const L=LV[G.lv];G.pzs=G.pzs||{};let pz=G.pzs[kind];
 if(!pz){
  pz=G.pzs[kind]=mkPuz(L.fs,L.x);
  pz.kind=kind;
  pz.title=['Wooden Chest Lock — Level 1','Crystal Chest Lock — Level 2','Vault Chest Lock — Level 3'][G.lv];
  pz.fl=[
   'Solve the 1-function formula to unlock the wooden chest and claim the Forest Key.',
   'Compose the two functions from the inside out to unlock the chest and claim the Crystal Key.',
   'Compose all three functions from innermost to outermost to unlock the chest and claim the Vault Key.'
  ][G.lv];
 }
 G.pz=pz;G.busy=false;ui('puz');drawPuz();setTimeout(()=>$('ans').focus(),50);
}

function drawPuz(msg,cls){
 const pz=G.pz,compCount=pz.fns.length;
 $('pz').innerHTML=
  `<div class="pz-head"><h2>${pz.title}</h2><span class="pz-tag">${compCount} Function${compCount>1?'s':''}</span></div>`+
  `<p class="hh">${pz.fl}</p>`+
  `${pz.fns.map(f=>`<div class="fn">${f.txt}</div>`).join('')}`+
  `<p>Given input: <b>x = ${pz.x}</b></p>`+
  `<div class="nt">${pz.nt}</div>`+
  `<div style="text-align:center"><input type="text" id="ans" inputmode="numeric" placeholder="answer" autocomplete="off"><br>`+
  `<button id="sb">Submit</button><button id="hb" ${pz.hs>=3?'disabled':''}>Hint (${pz.hs}/3)</button><button id="cb">Close</button></div>`+
  `<div id="msg" class="${cls||''}">${msg||''}</div>`+
  `${pz.hints().slice(0,pz.hs).map((h,i)=>`<div class="hh">Hint ${i+1}: ${h}</div>`).join('')}`;
 $('sb').onclick=submit;
 $('hb').onclick=()=>{if(pz.hs<3){pz.hs++;SV.run.h++;drawPuz()}};
 $('cb').onclick=()=>{ui(null);try{cv.requestPointerLock()}catch(e){}};
 $('ans').onkeydown=e=>{if(e.key==='Enter')submit();if(e.key!=='Escape')e.stopPropagation()};
}

function submit(){
 const pz=G.pz;if(G.busy)return;
 const s=$('ans').value.trim().replace('−','-');
 if(!/^-?\d+$/.test(s)){
  sfx('bad');drawPuz('Please enter a whole number.','no');
  const p=$('pz');p.classList.remove('shake');void p.offsetWidth;p.classList.add('shake');
  setTimeout(()=>$('ans')&&$('ans').focus(),20);return;
 }
 if(+s!==pz.ans){
  sfx('bad');drawPuz('Incorrect answer! Remember: evaluate the innermost function first, then work outward.','no');
  const p=$('pz');p.classList.remove('shake');void p.offsetWidth;p.classList.add('shake');
  setTimeout(()=>$('ans')&&$('ans').focus(),20);return;
 }
 G.busy=true;sfx('ok');flash();
 $('msg').className='ok';$('msg').textContent='Correct! Unlocking the Wooden Treasure Chest…';
 setTimeout(()=>{ui(null);try{cv.requestPointerLock()}catch(e){}beginChestOpen()},850);
}

function flash(){const f=$('flash');f.style.transition='none';f.style.opacity=.8;requestAnimationFrame(()=>{f.style.transition='opacity .8s';f.style.opacity=0})}

/* ===== three setup & procedural textures ===== */
let renderer,scene,cam,CL,cv,PM;
const M=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,flatShading:true,roughness:.9},o));
const mesh=(geo,mat,x,y,z,sh=true)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=sh;W.add(m);return m};
const circ=(x,z,r,h=6)=>{const c={t:'c',x,z,r,h};COL.push(c);return c};
const box=(x,z,hx,hz,h=5)=>{const c={t:'b',x,z,hx,hz,h};COL.push(c);return c};
const inter=(x,z,label,act,on=true,extra={})=>{const it=Object.assign({x,z,label,act,on,prompt:'Press E to Interact',range:3.4,subCls:''},extra);IT.push(it);return it};

function mkWoodTex(base='#784722',plank='#4b2911',grain='#5c3416'){
 const c=document.createElement('canvas');c.width=256;c.height=256;const g=c.getContext('2d');
 g.fillStyle=base;g.fillRect(0,0,256,256);
 for(let y=0;y<256;y+=4){
  g.fillStyle=y%64<4?plank:(Math.random()<.45?grain:base);
  g.globalAlpha=y%64<4?.85:.28;
  g.fillRect(0,y,256,y%64<4?4:2+Math.random()*2);
 }
 g.globalAlpha=.18;g.strokeStyle='#2c1607';
 for(let i=0;i<36;i++){g.beginPath();const y=Math.random()*256;g.moveTo(0,y);g.bezierCurveTo(85,y+Math.random()*8-4,170,y+Math.random()*8-4,256,y);g.stroke()}
 g.globalAlpha=1;
 const tx=new THREE.CanvasTexture(c);tx.wrapS=tx.wrapT=THREE.RepeatWrapping;return tx;
}

function mkStoneTex(base='#5a6258',seam='#353b34'){
 const c=document.createElement('canvas');c.width=256;c.height=256;const g=c.getContext('2d');
 g.fillStyle=base;g.fillRect(0,0,256,256);
 g.strokeStyle=seam;g.lineWidth=4;
 for(let r=0;r<4;r++){
  const y=r*64;g.beginPath();g.moveTo(0,y);g.lineTo(256,y);g.stroke();
  for(let col=0;col<4;col++){const x=(col*64+(r%2)*32)%256;g.beginPath();g.moveTo(x,y);g.lineTo(x,y+64);g.stroke()}
 }
 for(let i=0;i<180;i++){g.fillStyle=Math.random()<.5?'rgba(255,255,255,.04)':'rgba(0,0,0,.07)';g.fillRect(Math.random()*256,Math.random()*256,4,4)}
 const tx=new THREE.CanvasTexture(c);tx.wrapS=tx.wrapT=THREE.RepeatWrapping;return tx;
}

function initThree(){
 cv=$('c')||document.createElement('canvas');cv.id='c';document.body.prepend(cv);
 renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 scene=new THREE.Scene();cam=new THREE.PerspectiveCamera(60,1,.1,200);CL=new THREE.Clock();
 const rs=()=>{renderer.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()};
 rs();addEventListener('resize',rs);
 PM=mkPlayer();scene.add(PM);
}

function mkPlayer(){
 const g=new THREE.Group(),sk=M(0xe0b48a),cl=M(0x2f6b45),dk=M(0x5a3d26),bl=M(0x2b2f3a);
 const mk=(geo,mat,x,y,z,p)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;(p||g).add(m);return m};
 mk(new THREE.CylinderGeometry(.3,.34,.8,8),cl,0,1.15,0);mk(new THREE.SphereGeometry(.26,10,8),sk,0,1.75,0);
 mk(new THREE.CylinderGeometry(.34,.34,.08,10),dk,0,1.9,0);mk(new THREE.CylinderGeometry(.2,.26,.2,10),dk,0,1.98,0);
 mk(new THREE.BoxGeometry(.4,.5,.2),dk,0,1.2,-.3);
 const lim=(x,y,len,mat)=>{const p=new THREE.Group();p.position.set(x,y,0);g.add(p);mk(new THREE.CylinderGeometry(.09,.09,len,6),mat,0,-len/2,0,p);return p};
 g.u={la:lim(-.42,1.5,.7,sk),ra:lim(.42,1.5,.7,sk),ll:lim(-.17,.78,.78,bl),rl:lim(.17,.78,.78,bl)};
 return g;
}

/* ===== 3D Key, Wooden Treasure Chest & Exit Door ===== */
function buildKeyMesh(levelIdx){
 const kc=LV[levelIdx].kc;
 const g=new THREE.Group();
 const km=new THREE.MeshStandardMaterial({color:kc,metalness:.88,roughness:.18,emissive:kc,emissiveIntensity:.45});
 const gemM=new THREE.MeshStandardMaterial({color:0xffffff,emissive:kc,emissiveIntensity:1.1,metalness:.4,roughness:.1});
 const part=(geo,x,y,z,rx=0,ry=0,rz=0,m=km)=>{const p=new THREE.Mesh(geo,m);p.position.set(x,y,z);p.rotation.set(rx,ry,rz);p.castShadow=true;g.add(p);return p};
 // ornate bow (ring handle)
 part(new THREE.TorusGeometry(.22,.045,10,20),0,.55,0);
 part(new THREE.OctahedronGeometry(.09,0),0,.55,0,0,0,0,gemM);
 // collar + shaft
 part(new THREE.CylinderGeometry(.075,.075,.07,10),0,.31,0);
 part(new THREE.CylinderGeometry(.042,.042,.66,10),0,-.03,0);
 part(new THREE.CylinderGeometry(.068,.068,.05,10),0,-.16,0);
 // key bit / teeth
 part(new THREE.BoxGeometry(.2,.06,.05),.1,-.26,0);
 part(new THREE.BoxGeometry(.15,.055,.05),.075,-.35,0);
 part(new THREE.BoxGeometry(.22,.06,.05),.11,-.44,0);
 const kl=new THREE.PointLight(kc,1.8,9);kl.position.set(0,.1,0);g.add(kl);
 g.kl=kl;
 return g;
}

function buildTreasureChest(x,z,levelIdx,yaw=0,camOff=null){
 const g=new THREE.Group();
 g.position.set(x,0,z);
 W.add(g);

 const boxGroup=new THREE.Group();
 boxGroup.rotation.y=yaw;
 g.add(boxGroup);

 const woodTex=mkWoodTex('#7c4823','#48260e','#613617');
 const darkWoodTex=mkWoodTex('#583115','#341b09','#47260f');
 const woodMat=new THREE.MeshStandardMaterial({map:woodTex,roughness:.76,metalness:.06});
 const darkWoodMat=new THREE.MeshStandardMaterial({map:darkWoodTex,roughness:.84,metalness:.05});
 const brassColor=[0xd2a43b,0xb8cde0,0xe6b83d][levelIdx];
 const ironMat=new THREE.MeshStandardMaterial({color:0x33373d,metalness:.82,roughness:.36});
 const metalMat=new THREE.MeshStandardMaterial({color:brassColor,metalness:.86,roughness:.25,emissive:0x2b1d04,emissiveIntensity:.2});
 const velvetMat=new THREE.MeshStandardMaterial({color:[0x6c1822,0x16395c,0x6e1414][levelIdx],roughness:.95});

 const addPart=(geo,mat,px,py,pz,parent=boxGroup,rx=0,ry=0,rz=0)=>{
  const m=new THREE.Mesh(geo,mat);
  m.position.set(px,py,pz);m.rotation.set(rx,ry,rz);
  m.castShadow=true;m.receiveShadow=true;
  parent.add(m);return m;
 };

 // low stone dais underneath chest
 addPart(new THREE.BoxGeometry(3.2,.18,2.3),M([0x667060,0x344664,0x736348][levelIdx]),0,.09,0);

 // hollow chest base (y from 0.18 to 1.14)
 const by=.18;
 addPart(new THREE.BoxGeometry(2.4,.14,1.5),darkWoodMat,0,by+.07,0); // floor
 addPart(new THREE.BoxGeometry(2.0,.08,1.18),velvetMat,0,by+.16,0); // inner velvet lining
 addPart(new THREE.BoxGeometry(.18,.88,1.5),woodMat,-1.11,by+.52,0); // left wall
 addPart(new THREE.BoxGeometry(.18,.88,1.5),woodMat,1.11,by+.52,0); // right wall
 addPart(new THREE.BoxGeometry(2.04,.88,.18),woodMat,0,by+.52,.66); // front wall
 addPart(new THREE.BoxGeometry(2.04,.88,.18),woodMat,0,by+.52,-.66); // back wall

 // exterior recessed plank detail & brass trim on base
 addPart(new THREE.BoxGeometry(1.7,.6,.04),darkWoodMat,0,by+.5,.76); // front recessed panel
 addPart(new THREE.BoxGeometry(1.7,.6,.04),darkWoodMat,0,by+.5,-.76); // back recessed panel
 [[-1.18,.74],[1.18,.74],[-1.18,-.74],[1.18,-.74]].forEach(([cx,cz])=>{
  addPart(new THREE.BoxGeometry(.18,.98,.18),metalMat,cx,by+.49,cz); // corner brackets
  addPart(new THREE.BoxGeometry(.22,.16,.22),ironMat,cx,by+.08,cz); // feet
 });
 // horizontal metal straps & rivets
 [-.86,0,.86].forEach(bx=>{
  addPart(new THREE.BoxGeometry(.16,.96,1.56),metalMat,bx,by+.48,0);
  [.2,.5,.8].forEach(ry=>{
   addPart(new THREE.SphereGeometry(.036,6,6),ironMat,bx,by+ry,.79);
   addPart(new THREE.SphereGeometry(.036,6,6),ironMat,bx,by+ry,-.79);
  });
 });
 // top rim trim on base
 addPart(new THREE.BoxGeometry(2.48,.09,1.58),metalMat,0,by+.94,0);

 // rear hinges (2 detailed hinges connecting base & lid)
 [-.72,.72].forEach(hx=>{
  addPart(new THREE.BoxGeometry(.24,.32,.07),ironMat,hx,by+.86,-.78);
  addPart(new THREE.CylinderGeometry(.055,.055,.28,10),metalMat,hx,by+.98,-.76,boxGroup,0,0,Math.PI/2);
 });

 // arched barrel lid pivoting at rear hinge (0, by+0.96, -0.75)
 const lid=new THREE.Group();
 lid.position.set(0,by+.96,-.75);
 boxGroup.add(lid);

 // half-cylinder barrel arch centered at (0, 0, +0.75) inside lid group
 const arch=new THREE.Mesh(new THREE.CylinderGeometry(.75,.75,2.38,18,1,false,0,Math.PI),woodMat);
 arch.rotation.z=Math.PI/2;arch.position.set(0,0,.75);arch.castShadow=true;arch.receiveShadow=true;lid.add(arch);
 // flat wooden underside of lid
 addPart(new THREE.BoxGeometry(2.38,.07,1.5),darkWoodMat,0,.02,.75,lid);
 // curved brass bands wrapping over the arched lid + rivets
 [-.86,0,.86].forEach(bx=>{
  const band=new THREE.Mesh(new THREE.TorusGeometry(.76,.048,8,18,Math.PI),metalMat);
  band.rotation.y=Math.PI/2;band.position.set(bx,0,.75);band.castShadow=true;lid.add(band);
  for(let a=.35;a<Math.PI;a+=.62){
   addPart(new THREE.SphereGeometry(.038,6,6),ironMat,bx,Math.sin(a)*.8,0.75+Math.cos(a)*.8,lid);
  }
 });
 // front clasp tongue descending from lid lip
 addPart(new THREE.BoxGeometry(.28,.22,.08),metalMat,0,-.06,1.52,lid);

 // front escutcheon lock plate + 3D Padlock
 addPart(new THREE.BoxGeometry(.44,.42,.07),ironMat,0,by+.76,.78);
 const padlock=new THREE.Group();
 padlock.position.set(0,by+.72,.86);
 boxGroup.add(padlock);
 const shackle=new THREE.Mesh(new THREE.TorusGeometry(.11,.028,8,16,Math.PI),ironMat);
 shackle.position.set(0,.13,0);shackle.castShadow=true;padlock.add(shackle);
 const lockBody=addPart(new THREE.BoxGeometry(.28,.3,.13),metalMat,0,-.04,0,padlock);
 addPart(new THREE.CylinderGeometry(.032,.032,.04,8),ironMat,0,-.02,.065,padlock,Math.PI/2,0,0); // keyhole top
 addPart(new THREE.BoxGeometry(.026,.09,.04),ironMat,0,-.08,.065,padlock); // keyhole slot

 // glowing lock status light & interior treasure glow light
 const lockGlow=new THREE.PointLight(0xffaa33,.9,9);
 lockGlow.position.set(0,by+1.1,1.35);boxGroup.add(lockGlow);
 const innerGlow=new THREE.PointLight(LV[levelIdx].kc,0,10);
 innerGlow.position.set(0,by+.8,0);boxGroup.add(innerGlow);

 // 3D Key nested inside chest (initially hidden until chest opens)
 const keyMesh=buildKeyMesh(levelIdx);
 keyMesh.position.set(0,by+.42,0);
 keyMesh.scale.setScalar(.85);
 keyMesh.visible=false;
 g.add(keyMesh);

 // sparkle particles emitted when chest opens
 const spN=24,spGeo=new THREE.BufferGeometry(),spPos=new Float32Array(spN*3);
 for(let i=0;i<spN;i++){spPos[i*3]=(Math.random()-.5)*1.4;spPos[i*3+1]=by+.3+Math.random()*.5;spPos[i*3+2]=(Math.random()-.5)*.9}
 spGeo.setAttribute('position',new THREE.BufferAttribute(spPos,3));
 const spMat=new THREE.PointsMaterial({color:LV[levelIdx].kc,size:.22,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
 const sparks=new THREE.Points(spGeo,spMat);boxGroup.add(sparks);

 // solid collision box matching chest footprint
 const isTurned=Math.abs(Math.sin(yaw))>0.5;
 box(x,z,isTurned?1.05:1.45,isTurned?1.45:1.05,2.4);

 return{group:g,boxGroup,x,z,yaw,camOff,lid,padlock,shackle,lockBody,lockGlow,innerGlow,keyMesh,sparks,spMat,spPos,spN,by};
}

function buildExitDoor(levelIdx){
 const g=new THREE.Group();
 g.position.set(0,0,-10);
 W.add(g);

 const stoneTex=mkStoneTex(['#5d6b55','#2a4060','#6b5a3a'][levelIdx],['#2f392a','#17253a','#3a2e19'][levelIdx]);
 const frameMat=new THREE.MeshStandardMaterial({map:stoneTex,roughness:.85});
 const woodTex=mkWoodTex(['#4b2e19','#243550','#5a3614'][levelIdx],'#1e130b','#321f11');
 const doorMat=new THREE.MeshStandardMaterial({map:woodTex,roughness:.72,metalness:.12});
 const trimMat=new THREE.MeshStandardMaterial({color:[0x9f8042,0x74a9d8,0xd4a537][levelIdx],metalness:.82,roughness:.28});

 const mk=(geo,mat,x,y,z,p=g)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;p.add(m);return m};

 // stone doorway arch & side pillars
 mk(new THREE.BoxGeometry(1.1,5.6,2.1),frameMat,-4.25,2.8,0);
 mk(new THREE.BoxGeometry(1.1,5.6,2.1),frameMat,4.25,2.8,0);
 mk(new THREE.BoxGeometry(9.8,.95,2.3),frameMat,0,5.55,0);
 mk(new THREE.BoxGeometry(4.2,.5,2.5),trimMat,0,6.15,0); // keystone crown
 circ(-4.25,-10,.7,6);circ(4.25,-10,.7,6);

 // hinged double door leaves
 const leftDoor=new THREE.Group();leftDoor.position.set(-3.7,0,0);g.add(leftDoor);
 mk(new THREE.BoxGeometry(3.68,5.1,.45),doorMat,1.84,2.55,0,leftDoor);
 [1.1,2.6,4.1].forEach(y=>mk(new THREE.BoxGeometry(3.55,.22,.54),trimMat,1.84,y,0,leftDoor));
 mk(new THREE.TorusGeometry(.22,.045,8,14),trimMat,3.1,2.3,.28,leftDoor);

 const rightDoor=new THREE.Group();rightDoor.position.set(3.7,0,0);g.add(rightDoor);
 mk(new THREE.BoxGeometry(3.68,5.1,.45),doorMat,-1.84,2.55,0,rightDoor);
 [1.1,2.6,4.1].forEach(y=>mk(new THREE.BoxGeometry(3.55,.22,.54),trimMat,-1.84,y,0,rightDoor));
 mk(new THREE.TorusGeometry(.22,.045,8,14),trimMat,-3.1,2.3,.28,rightDoor);

 // central lock emblem
 const lockEmblem=new THREE.Group();lockEmblem.position.set(0,2.55,.32);g.add(lockEmblem);
 const sigilMat=new THREE.MeshStandardMaterial({color:0xff4d3b,emissive:0xff3322,emissiveIntensity:1.1,metalness:.5,roughness:.25});
 const sigil=mk(new THREE.CylinderGeometry(.55,.55,.14,12),trimMat,0,0,0,lockEmblem);sigil.rotation.x=Math.PI/2;
 const sigilCore=mk(new THREE.OctahedronGeometry(.28,0),sigilMat,0,0,.1,lockEmblem);
 const sigilLight=new THREE.PointLight(0xff4d3b,1.2,11);sigilLight.position.set(0,2.6,1.2);g.add(sigilLight);

 // solid door collider (stays active until door is unlocked with level key)
 GC=box(0,-10,4,.95,5.8);
 GATE_T=0;

 DOOR={group:g,leftDoor,rightDoor,lockEmblem,sigilMat,sigilCore,sigilLight,shake:0};
}

/* ===== level building ===== */
let r=Math.random;
const KP=[];const free=(x,z,m=5)=>Math.abs(x)>4&&Math.abs(z+10)>3&&KP.every(p=>Math.hypot(x-p[0],z-p[1])>m);
const INS=[[[-15,8]],[[-17,6],[17,-3]],[[-20,-2],[20,-2],[0,16]]],MP=[[18,-2],[21,5],[-22,10]];

function pts(n,sp,c,s,y0,y1){
 const g=new THREE.BufferGeometry(),a=new Float32Array(n*3);
 for(let i=0;i<n;i++){a[i*3]=Math.random()*2*sp-sp;a[i*3+1]=y0+Math.random()*(y1-y0);a[i*3+2]=Math.random()*2*sp-sp}
 g.setAttribute('position',new THREE.BufferAttribute(a,3));
 W.add(new THREE.Points(g,new THREE.PointsMaterial({color:c,size:s,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending})));
 ANI.push((t,dt)=>{for(let i=0;i<n;i++){a[i*3+1]+=dt*.3*(1+i%3);a[i*3]+=Math.sin(t+i)*dt*.3;if(a[i*3+1]>y1)a[i*3+1]=y0}g.attributes.position.needsUpdate=true});
}

function tab(f){
 const c=document.createElement('canvas');c.width=256;c.height=320;const x=c.getContext('2d');
 x.fillStyle='#caa24c';x.fillRect(0,0,256,320);x.strokeStyle='#5a4210';x.lineWidth=8;x.strokeRect(8,8,240,304);
 x.fillStyle='#3a2a08';x.font='bold 40px Georgia';x.textAlign='center';
 x.fillText(f.n+'(x) =',128,140);x.fillText(f.rhs,128,205);
 return new THREE.CanvasTexture(c);
}

const tree=(x,z,s)=>{
 mesh(new THREE.CylinderGeometry(.35*s,.55*s,4*s,6),M(0x5a3d26),x,2*s,z);
 for(let i=0;i<3;i++)mesh(new THREE.ConeGeometry((2.4-i*.5)*s,2.6*s,7),M(i%2?0x2d6a3e:0x245a34),x,(3.6+i*1.5)*s,z);
 circ(x,z,.7*s,8);
};
function pillar(x,z,mat,h=8){mesh(new THREE.BoxGeometry(2.4,.6,2.4),mat,x,.3,z);mesh(new THREE.CylinderGeometry(.8,.9,h,10),mat,x,h/2+.4,z);mesh(new THREE.BoxGeometry(2.4,.6,2.4),mat,x,h+.7,z);circ(x,z,1.1,h)}
function scatter(n,m,fn,ex){for(let c=0,k=0;c<n&&k<n*12;k++){const x=r()*54-27,z=r()*54-27;if(free(x,z,m)&&!(ex&&ex(x,z))){fn(x,z);c++}}}

function build(i){
 const L=LV[i];r=mul(i*77+5);W=new THREE.Group();scene.add(W);COL=[];IT=[];ANI=[];KP.length=0;
 INS[i].forEach(p=>KP.push(p));KP.push(MP[i],[0,24],[0,-10],[0,-15],[0,-20],[0,-22]);
 const pal=[
  {bg:0x9ec4a0,fog:.017,gr:0x3e7a45,sun:0xfff0c0,si:1.1,hi:.7},
  {bg:0x07142b,fog:.02,gr:0x1c2c4a,sun:0x6aa0ff,si:.45,hi:.7},
  {bg:0x1a1008,fog:.016,gr:0x4a3e30,sun:0xffc860,si:.8,hi:.6}
 ][i];
 scene.background=new THREE.Color(pal.bg);scene.fog=new THREE.FogExp2(pal.bg,pal.fog);
 W.add(new THREE.HemisphereLight(i==1?0x4a7ac8:0xfff4d8,pal.gr,pal.hi));
 const sun=new THREE.DirectionalLight(pal.sun,pal.si);sun.position.set(25,40,20);sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-42,right:42,top:42,bottom:-42,far:120});
 sun.shadow.camera.updateProjectionMatrix();W.add(sun);

 const gm=new THREE.Mesh(new THREE.PlaneGeometry(220,220),M(pal.gr));gm.rotation.x=-Math.PI/2;gm.receiveShadow=true;W.add(gm);
 for(let k=0;k<44;k++){
  const e=k%11,s=4+r()*3,side=Math.floor(k/11),t=-31+e*6.2;
  const x=[t,31,-t,-31][side],z=[-31,t,31,-t][side];
  mesh(new THREE.DodecahedronGeometry(s,0),M([0x56604f,0x20304a,0x5a4a34][i]),x,s*.5,z);
 }

 // dividing barrier wall at z = -10 with central exit doorway
 const wm=M([0x5d6b55,0x2a4060,0x6b5a3a][i]);
 [-16.5,16.5].forEach(x=>{mesh(new THREE.BoxGeometry(25,5,1.6),wm,x,2.5,-10);box(x,-10,12.5,.8)});
 buildExitDoor(i);

 // exit door interaction
 const doorIt=inter(0,-10,'Exit Door — Locked',()=>tryDoor(),true,{prompt:'Press E to Unlock',range:4.0,subCls:'warn'});
 G.doorIt=doorIt;

 [d0,d1,d2][i]();

 // ancient function inscriptions (exploration & clues)
 INS[i].forEach(([x,z],k)=>{
  const f=L.fs[k],g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=Math.atan2(-x,24-z);W.add(g);
  const s=new THREE.Mesh(new THREE.BoxGeometry(1.8,2.8,.5),M(0x77806f));s.position.y=1.4;s.castShadow=true;g.add(s);
  const tx=tab(f),tm=new THREE.Mesh(new THREE.PlaneGeometry(1.4,1.75),new THREE.MeshStandardMaterial({map:tx,emissive:0xffaa33,emissiveMap:tx,emissiveIntensity:.6}));
  tm.position.set(0,1.5,.27);g.add(tm);
  const pl=new THREE.PointLight(0xffc060,.8,9);pl.position.set(0,2.2,1.4);g.add(pl);circ(x,z,1.1);
  inter(x,z,`Read Inscription: ${f.n}(x)`,()=>{
   const nw=!G.insc.has(k);G.insc.add(k);
   toast(`Inscription: ${f.txt}`);
   if(nw){sfx('pickup');tm.material.emissiveIntensity=1.4;hudUpd()}
  });
 });

 // wooden treasure chest (hidden in progressive secret locations)
 const [mx,mz]=MP[i];
 const chestYaws=[-Math.PI*0.45,-Math.PI*0.5,Math.PI*0.5];
 const chestCamOffs=[
  new THREE.Vector3(-2.8,2.4,2.0),
  new THREE.Vector3(-2.8,2.4,1.8),
  new THREE.Vector3(3.2,2.6,0.2)
 ];
 CHEST=buildTreasureChest(mx,mz,i,chestYaws[i],chestCamOffs[i]);
 const chestLabels=[
  'Hidden Forest Chest — Locked (Solve Puzzle)',
  'Hidden Crystal Chest — Locked (Solve Puzzle)',
  'Secret Vault Chest — Locked (Solve Puzzle)'
 ];
 const chestIt=inter(mx,mz,chestLabels[i],()=>{
  if(G.chestState==='opened'){toast(`Chest already opened — ${L.kn} already obtained.`);return}
  if(G.chestState==='opening')return;
  openPuz('main');
 },true,{prompt:'Press E to Interact',range:3.5,subCls:'warn'});
 G.chestIt=chestIt;

 // chest subtle ambient pulse while locked
 ANI.push((t)=>{
  if(!CHEST)return;
  if(G.chestState==='locked'){
   CHEST.lockGlow.intensity=.75+Math.sin(t*3)*.25;
  }
 });

 // beyond the exit door
 ORB=null;PG=null;RELIC=null;
 if(i<2){
  PG=new THREE.Group();PG.position.set(0,0,-22);W.add(PG);
  const pc=[0x44ff99,0x44bbff][i];
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.6,.3,10,32),M(pc,{emissive:pc,emissiveIntensity:1.2}));ring.position.y=3;PG.add(ring);
  const dsc=new THREE.Mesh(new THREE.CircleGeometry(2.4,32),new THREE.MeshBasicMaterial({color:pc,transparent:true,opacity:.45,side:2,blending:THREE.AdditiveBlending}));dsc.position.y=3;PG.add(dsc);
  const pl=new THREE.PointLight(pc,1.5,16);pl.position.y=3;PG.add(pl);
  PG.visible=false;
  [-3.6,3.6].forEach(x=>{mesh(new THREE.CylinderGeometry(.6,.7,6,8),wm,x,3,-22);circ(x,-22,.8)});
  ANI.push((t,dt)=>{dsc.rotation.z+=dt});

  ORB=mesh(new THREE.IcosahedronGeometry(.5,0),M(0xffd36a,{emissive:0xffb020,emissiveIntensity:1.5}),0,1.4,-15);
  ORB.visible=false;
  const collectOrb=()=>{
   if(!ORB||!ORB.visible)return;
   ORB.visible=false;if(G.orbIt)G.orbIt.on=false;
   if(!SV.frags.includes(i))SV.frags.push(i);
   sfx('pickup');toast('Treasure Fragment collected!','ok');hudUpd();save();
  };
  G.orbIt=inter(0,-15,'Collect Treasure Fragment',collectOrb,false,{prompt:'Press E to Interact',range:2.8,subCls:'ok'});
  G.collectOrb=collectOrb;

  const pi=inter(0,-22,`Enter Exit Portal → Level ${i+2}`,()=>advanceLevel(i),false,{prompt:'Press E to Enter',range:3.2,subCls:'ok'});
  G.portalIt=pi;
  ANI.push((t)=>{
   if(ORB&&ORB.visible){
    ORB.rotation.y=t*2;ORB.position.y=1.4+Math.sin(t*3)*.25;
    if(G.doorState==='unlocked'&&Math.hypot(P.x,P.z+15)<2.1)collectOrb();
   }
   if(PG&&PG.visible&&G.doorState==='unlocked'&&!G.advancing&&Math.hypot(P.x,P.z+22)<2.2){
    advanceLevel(i);
   }
  });
 }else{
  // Level 3 Final Sanctum beyond the Exit Door: Legendary Lost Cipher Relic
  const rg=new THREE.Group();rg.position.set(0,0,-20);W.add(rg);
  const gold=M(0xd4a537,{metalness:.85,roughness:.2,emissive:0x3a2a05});
  const ped=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.4,1.2,10),gold);ped.position.y=.6;ped.castShadow=ped.receiveShadow=true;rg.add(ped);
  const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.65,0),new THREE.MeshStandardMaterial({color:0xffe46b,metalness:.9,roughness:.12,emissive:0xffb820,emissiveIntensity:1.1}));
  crown.position.y=2.2;crown.castShadow=true;rg.add(crown);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.6,24,16,1,true),new THREE.MeshBasicMaterial({color:0xffe08a,transparent:true,opacity:0,blending:THREE.AdditiveBlending,side:2,depthWrite:false}));
  beam.position.y=12;rg.add(beam);
  const rl=new THREE.PointLight(0xffd24c,0,18);rl.position.y=3;rg.add(rl);
  circ(0,-20,1.2,3);
  RELIC={rg,crown,beam,rl};
  const claim=()=>victory();
  G.relicIt=inter(0,-20,'Claim the Legendary Treasure',claim,false,{prompt:'Press E to Claim',range:3.4,subCls:'ok'});
  ANI.push((t)=>{
   crown.rotation.y=t*1.6;crown.rotation.x=Math.sin(t*1.2)*.2;crown.position.y=2.2+Math.sin(t*2.4)*.2;
   if(G.doorState==='unlocked'){
    beam.material.opacity=.32+Math.sin(t*2)*.06;
    rl.intensity=2.4;
   }
  });
 }

 P.x=0;P.z=24;P.y=0;P.vy=0;P.vx=P.vz=0;yaw=0;pitch=.35;G.sx=0;G.sz=24;
 PM.position.set(0,0,24);PM.rotation.y=Math.PI;
}

function d0(){
 // Scatter trees excluding western waterfall and eastern hidden forest alcove
 scatter(58,5,(x,z)=>tree(x,z,.8+r()*.7),(x,z)=>(x<-20&&Math.abs(z-2)<7)||(x>12&&z>-8&&z<6));
 scatter(15,4,(x,z)=>{const s=.8+r()*1.2,m=mesh(new THREE.DodecahedronGeometry(s,0),M(0x6b7066),x,s*.6,z);m.rotation.set(r()*3,r()*3,0);circ(x,z,s*.85,2)},(x,z)=>(x>12&&z>-8&&z<6));
 scatter(45,2.5,(x,z)=>{const c=r()<.5?0x4de0ff:0xff7ad9,m=mesh(new THREE.ConeGeometry(.25,.9,5),M(c,{emissive:c,emissiveIntensity:1.5}),x,.45,z,false);ANI.push(t=>m.material.emissiveIntensity=1.2+Math.sin(t*2+x)*.6)},(x,z)=>(x>12&&z>-8&&z<6));
 const mo=M(0x5f7a50);[[-18,5,3,.5,2],[-12,11,.5,2.5,1.5],[-18,11,2,.5,2.4]].forEach(([x,z,hx,hz,h])=>{mesh(new THREE.BoxGeometry(hx*2,h,hz*2),mo,x,h/2,z);box(x,z,hx,hz,h)});
 [[11,13],[17,13],[11,19],[17,19]].forEach(([x,z])=>{mesh(new THREE.CylinderGeometry(.6,.7,5,8),mo,x,2.5,z);circ(x,z,.7)});mesh(new THREE.BoxGeometry(8,.6,3),mo,14,5.3,13);mesh(new THREE.BoxGeometry(8,.3,8),M(0x7a8470),14,.15,16);
 for(let z=26;z>-26;z-=2.2)if(Math.abs(z+10)>1.4)mesh(new THREE.BoxGeometry(2.4,.1,1.6),M(0x8a8f80),(r()-.5)*.6,.05,z,false);
 const c=document.createElement('canvas');c.width=64;c.height=128;const x=c.getContext('2d');x.fillStyle='#5bb8e8';x.fillRect(0,0,64,128);x.fillStyle='#fff';for(let i=0;i<30;i++)x.fillRect(Math.random()*64,Math.random()*128,2,10+Math.random()*20);
 const tx=new THREE.CanvasTexture(c);tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(2,3);
 const wf=new THREE.Mesh(new THREE.PlaneGeometry(7,14),new THREE.MeshBasicMaterial({map:tx,transparent:true,opacity:.75}));wf.rotation.y=Math.PI/2;wf.position.set(-28.4,7,2);W.add(wf);ANI.push((t,dt)=>tx.offset.y+=dt*1.2);
 mesh(new THREE.BoxGeometry(3,16,16),M(0x56604f),-30,8,2);
 const pd=new THREE.Mesh(new THREE.CircleGeometry(4.5,24),new THREE.MeshStandardMaterial({color:0x2a8fc0,transparent:true,opacity:.7,metalness:.5,roughness:.2}));pd.rotation.x=-Math.PI/2;pd.position.set(-24,.06,2);W.add(pd);
 pts(90,27,0xd8ff70,.18,.5,6);

 // ===== Hidden Forest Alcove (Easy - Level 1) =====
 const mossRock=M(0x56604f);
 const r1=mesh(new THREE.DodecahedronGeometry(2.4,0),mossRock,18,1.4,2.2);r1.rotation.set(.4,.8,.2);circ(18,2.2,2.0,4);
 const r2=mesh(new THREE.DodecahedronGeometry(2.7,0),mossRock,21.8,1.6,-2);r2.rotation.set(-.3,1.2,.5);circ(21.8,-2,2.3,5);
 const r3=mesh(new THREE.DodecahedronGeometry(2.4,0),mossRock,18.2,1.3,-6.2);r3.rotation.set(.6,-.4,.3);circ(18.2,-6.2,2.0,4);
 const rRoof=mesh(new THREE.BoxGeometry(4.4,.9,5.4),mossRock,19.6,4.0,-2);rRoof.rotation.set(.1,.2,-.15);
 tree(21.2,1.8,1.35);tree(17.2,-7.0,1.3);tree(22.0,-5.8,1.25);
 // Stepping stones trail (clear environmental clue)
 const stepMat=M(0x73796a);
 [[5,4.5],[7.5,3.2],[10.2,2.0],[12.8,0.8],[15.2,-0.4],[17.0,-1.2]].forEach(([sx,sz],idx)=>{
  const st=mesh(new THREE.CylinderGeometry(.68-idx*.03,.75-idx*.03,.1,8),stepMat,sx,.06,sz,false);st.rotation.y=idx*.6;
 });
 // Cairn & glowing lantern at trail split
 const cairnMat=M(0x82887a);
 mesh(new THREE.CylinderGeometry(.38,.45,.35,7),cairnMat,9.8,.2,3.2);mesh(new THREE.CylinderGeometry(.28,.34,.3,7),cairnMat,9.8,.52,3.2);mesh(new THREE.DodecahedronGeometry(.2,0),cairnMat,9.8,.78,3.2);
 const cLight=new THREE.PointLight(0xffe277,.8,7);cLight.position.set(9.8,1.1,3.2);W.add(cLight);
 mesh(new THREE.BoxGeometry(.24,.32,.24),M(0xffdf88,{emissive:0xffaa22,emissiveIntensity:1.3}),9.8,1.05,3.2,false);
 // Soft warm illumination inside the nook
 const alcLight=new THREE.PointLight(0xffdf80,.95,9);alcLight.position.set(17.6,2.0,-2.0);W.add(alcLight);
 // Fireflies floating around the alcove
 pts(36,5,0xd4ff60,.16,.4,3.2);
}

function d1(){
 const cc=[0x39a7ff,0x5fe0ff,0x7a6bff];
 scatter(32,4,(x,z)=>{for(let j=0;j<3;j++){const s=.7+r()*1.5,c=cc[j],m=mesh(new THREE.ConeGeometry(s*.4,s*2.4,6),M(c,{emissive:c,emissiveIntensity:.9,metalness:.4,roughness:.2}),x+r()*1.6-.8,s*1.1,z+r()*1.6-.8);m.rotation.set(r()*.6-.3,0,r()*.6-.3)}circ(x,z,1,3)},(x,z)=>x>12&&z>0&&z<11);
 [[-10,3,10],[12,3,8],[-6,3,-4],[8,3,-20],[0,3,22]].forEach(([x,y,z])=>{const l=new THREE.PointLight(0x4aa8ff,1.6,28);l.position.set(x,y,z);W.add(l)});
 scatter(20,3,(x,z)=>{const s=.6+r()*1.2;mesh(new THREE.ConeGeometry(s,s*3,6),M(0x3a4660),x,s*1.5,z);circ(x,z,s*.8,3)},(x,z)=>x>12&&z>0&&z<11);
 for(let k=0;k<30;k++){const s=.6+r()*1.4;mesh(new THREE.ConeGeometry(s,s*4,6),M(0x2a3550),r()*60-30,19-s*2,r()*60-30,false).rotation.x=Math.PI}
 const cl=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshBasicMaterial({color:0x050a18}));cl.rotation.x=Math.PI/2;cl.position.y=19;W.add(cl);
 const pl=new THREE.Mesh(new THREE.PlaneGeometry(14,9),new THREE.MeshStandardMaterial({color:0x1f6fb5,transparent:true,opacity:.75,metalness:.6,roughness:.1,emissive:0x0a3a66}));pl.rotation.x=-Math.PI/2;pl.position.set(-13,.05,16);W.add(pl);ANI.push(t=>pl.material.emissiveIntensity=.7+Math.sin(t*1.5)*.3);
 for(let x=-19;x<-6;x+=1.8)mesh(new THREE.BoxGeometry(1.6,.25,3.2),M(0x6a7388),x,.25,16);
 [[13,14],[-8,-4],[20,-16]].forEach(([x,z],i)=>{const g=new THREE.Group();g.position.set(x,2.4,z);W.add(g);const tr=new THREE.Mesh(new THREE.TorusGeometry(1.5,.3,8,16),M(0x8a7a5a,{metalness:.6}));g.add(tr);for(let k=0;k<3;k++){const b=new THREE.Mesh(new THREE.BoxGeometry(3,.25,.3),M(0x8a7a5a));b.rotation.z=k*Math.PI/3;g.add(b)}g.castShadow=true;mesh(new THREE.BoxGeometry(1,2.4,1),M(0x4a5068),x,1.2,z);circ(x,z,1);ANI.push((t,dt)=>g.rotation.z+=dt*(i%2?-.6:.6))});
 [-11,11].forEach(x=>{mesh(new THREE.CylinderGeometry(.7,.8,5.5,8),M(0x4a5068),x,2.75,-4);circ(x,-4,.8)});mesh(new THREE.BoxGeometry(24,.8,1.6),M(0x4a5068),0,5.9,-4);
 pts(100,27,0x7ad0ff,.14,0,12);

 // ===== Hidden Crystal Grotto (Medium - Level 2) =====
 const crMat1=M(0x39a7ff,{emissive:0x2070ff,emissiveIntensity:.9,metalness:.5,roughness:.2});
 const crMat2=M(0x9a5cff,{emissive:0x7030e0,emissiveIntensity:.85,metalness:.5,roughness:.2});
 const rockWallMat=M(0x2a3550);
 // Towering crystal columns forming the S-curved fissure entrance
 const colA=mesh(new THREE.ConeGeometry(1.4,7.5,6),crMat1,16.5,3.75,2.2);colA.rotation.set(-.15,.4,.1);circ(16.5,2.2,1.3,8);
 const colB=mesh(new THREE.ConeGeometry(1.5,8.0,6),rockWallMat,16.0,4.0,5.0);colB.rotation.set(.1,-.3,-.1);circ(16.0,5.0,1.4,8);
 const colC=mesh(new THREE.ConeGeometry(1.3,6.8,6),crMat2,17.5,3.4,8.4);colC.rotation.set(.2,.6,-.15);circ(17.5,8.4,1.2,7);
 // Cavern enclosure walls
 mesh(new THREE.BoxGeometry(1.6,8,8),rockWallMat,24.2,4,5);box(24.2,5,.8,4,8);
 mesh(new THREE.BoxGeometry(7,8,1.6),rockWallMat,21,4,1.2);box(21,1.2,3.5,.8,8);
 mesh(new THREE.BoxGeometry(7,8,1.6),rockWallMat,21,4,9.2);box(21,9.2,3.5,.8,8);
 // Distinctive crystal cluster at entrance
 const clu=mesh(new THREE.DodecahedronGeometry(.75,0),crMat1,13.5,.6,8.4);clu.rotation.set(.3,.5,.2);
 // Glowing crystal nodes on cavern floor along the path
 [[12.5,8.4],[14.8,8.0],[17.2,7.2],[19.2,6.0]].forEach(([cx,cz],i)=>{
  const sp=mesh(new THREE.ConeGeometry(.25,.7,5),i%2?crMat1:crMat2,cx,.35,cz,false);sp.rotation.set(i%2?.3:-.2,0,i%2?-.2:.3);
 });
 // Ethereal azure glow inside grotto
 const grottoLight=new THREE.PointLight(0x44c0ff,1.3,9.5);grottoLight.position.set(20.5,2.5,5.0);W.add(grottoLight);
 pts(35,5,0x7be8ff,.15,.5,4.0);
}

function d2(){
 const gold=M(0xd4a537,{metalness:.7,roughness:.3,emissive:0x3a2a05}),st=M(0x6b6252);
 mesh(new THREE.BoxGeometry(4,.06,35),M(0x7a1f1f),0,.04,8.5,false);[-2.15,2.15].forEach(x=>mesh(new THREE.BoxGeometry(.3,.07,35),gold,x,.06,8.5,false));
 const rg=new THREE.Mesh(new THREE.RingGeometry(3,3.4,48),gold);rg.rotation.x=-Math.PI/2;rg.position.set(0,.08,5);W.add(rg);ANI.push((t,dt)=>rg.rotation.z+=dt*.2);
 [-8,8,-16,16].forEach(x=>[20,12,4,-4].forEach(z=>pillar(x,z,st)));
 [[-25,18],[25,18],[-25,2],[25,2]].forEach(([x,z])=>{const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=x<0?Math.PI/2:-Math.PI/2;W.add(g);const a=(geo,mat,y)=>{const m=new THREE.Mesh(geo,mat);m.position.y=y;m.castShadow=true;g.add(m);return m};a(new THREE.BoxGeometry(2,1.2,2),st,.6);a(new THREE.CylinderGeometry(.5,.8,3,8),gold,2.7);a(new THREE.SphereGeometry(.5,10,8),gold,4.5);const ar=a(new THREE.BoxGeometry(.3,1.6,.3),gold,4);ar.position.x=.9;ar.rotation.z=-.5;circ(x,z,1.5)});
 [[-8,12],[8,12],[-8,-4],[8,-4],[-16,20],[16,20]].forEach(([x,z],k)=>{mesh(new THREE.CylinderGeometry(.08,.08,1.8,6),st,x+(x<0?1.2:-1.2),3,z,false);mesh(new THREE.ConeGeometry(.28,.7,6),M(0xff9a30,{emissive:0xff7a10,emissiveIntensity:2}),x+(x<0?1.2:-1.2),4.1,z,false);if(k<4){const l=new THREE.PointLight(0xffa040,1.5,24);l.position.set(x+(x<0?1.2:-1.2),4.6,z);W.add(l);ANI.push(t=>l.intensity=1.3+Math.sin(t*9+k)*.25)}});
 const fc=new THREE.Mesh(new THREE.CircleGeometry(7.5,32),gold);fc.rotation.x=-Math.PI/2;fc.position.set(0,.04,-20);W.add(fc);
 for(let k=0;k<14;k++){const a=k/14*6.28;mesh(new THREE.DodecahedronGeometry(.4+r()*.4,0),gold,Math.cos(a)*6.4,.3,-20+Math.sin(a)*6.4)}
 [[-6,-16],[6,-16],[-6,-24],[6,-24]].forEach(([x,z])=>pillar(x,z,gold,7));
 const cl=new THREE.PointLight(0xffc860,1.4,34);cl.position.set(0,7,-20);W.add(cl);
 pts(80,27,0xffd36a,.12,0,10);

 // ===== Secret Treasury Vault Chamber (Hard - Level 3) =====
 const wallMat=M(0x5a4f42,{roughness:.8});
 const goldTrimMat=M(0xd4a537,{metalness:.85,roughness:.25});
 // Gilded screen partitions along x = -17
 mesh(new THREE.BoxGeometry(1.2,6.5,6.8),wallMat,-17,3.25,4.4);box(-17,4.4,.6,3.4,6.5);
 mesh(new THREE.BoxGeometry(1.2,6.5,6.8),wallMat,-17,3.25,15.6);box(-17,15.6,.6,3.4,6.5);
 mesh(new THREE.BoxGeometry(1.4,.4,6.8),goldTrimMat,-17,6.3,4.4);
 mesh(new THREE.BoxGeometry(1.4,.4,6.8),goldTrimMat,-17,6.3,15.6);
 // North & South enclosure walls for secret treasury
 mesh(new THREE.BoxGeometry(9.5,6.5,1.2),wallMat,-22,3.25,1.0);box(-22,1.0,4.75,.6,6.5);
 mesh(new THREE.BoxGeometry(9.5,6.5,1.2),wallMat,-22,3.25,19.0);box(-22,19.0,4.75,.6,6.5);
 // Doorway header cornice at x = -17, z = 10
 mesh(new THREE.BoxGeometry(1.4,1.2,4.4),goldTrimMat,-17,6.0,10);
 // Royal ceremonial braziers with violet-gold flame (subtle environmental clue)
 [7.6,12.4].forEach((bz,bi)=>{
  mesh(new THREE.CylinderGeometry(.45,.35,1.8,8),goldTrimMat,-17,.9,bz);
  mesh(new THREE.CylinderGeometry(.65,.45,.5,8),goldTrimMat,-17,1.95,bz);
  const fl=mesh(new THREE.ConeGeometry(.3,.8,6),M(0xc07aff,{emissive:0x9933ff,emissiveIntensity:2.2}),-17,2.4,bz,false);
  const bl=new THREE.PointLight(0xb066ff,1.4,9);bl.position.set(-17,2.7,bz);W.add(bl);
  ANI.push(t=>{fl.scale.y=1+Math.sin(t*12+bi)*.15;bl.intensity=1.3+Math.sin(t*8+bi)*.25});
  circ(-17,bz,.65,2.5);
 });
 // Polished gold floor inlay leading from colonnade into the secret chamber
 mesh(new THREE.BoxGeometry(4.2,.05,.8),goldTrimMat,-14.8,.04,10,false);
 const ringMed=new THREE.Mesh(new THREE.RingGeometry(1.2,1.5,32),goldTrimMat);ringMed.rotation.x=-Math.PI/2;ringMed.position.set(-22,.05,10);W.add(ringMed);
 // Ancient golden urns
 [[-25,4],[-25,16],[-19,4],[-19,16]].forEach(([ux,uz])=>{
  mesh(new THREE.CylinderGeometry(.35,.5,1.2,8),goldTrimMat,ux,.6,uz);
  mesh(new THREE.SphereGeometry(.45,8,8),goldTrimMat,ux,1.2,uz);
  circ(ux,uz,.55,1.8);
 });
 // Sacred treasury warm light
 const vaultLight=new THREE.PointLight(0xffd24c,1.3,11);vaultLight.position.set(-22,3.2,10);W.add(vaultLight);
 pts(30,4.5,0xffd24c,.14,.6,3.5);
}

/* ===== game flow ===== */
const fr=()=>new Promise(r=>setTimeout(r,25));

async function startLevel(i){
 if(i+1>SV.unlocked)return;
 $('trans').classList.remove('on');
 $('key-pop').classList.remove('on');
 ui('load');$('lerr').style.display='none';$('lt').textContent='Loading '+LV[i].n+'…';
 const pb=$('pb');pb.style.width='10%';
 try{
  if(!window.THREE)throw Error('Three.js could not be loaded — check your connection.');
  await fr();
  if(!renderer)initThree();pb.style.width='35%';await fr();
  if(W){scene.remove(W);W.traverse(o=>{o.geometry&&o.geometry.dispose();o.material&&[].concat(o.material).forEach(m=>{m.map&&m.map.dispose();m.dispose()})})}
  GATE_T=0;near=null;
  G={on:true,lv:i,q:{},insc:new Set(),keys:{},hasKey:false,chestState:'locked',doorState:'locked',solved:false,cine:0,ct:0,keyGranted:false,advancing:false};
  pb.style.width='60%';await fr();
  build(i);pb.style.width='100%';await fr();
  hudUpd();ui(null);
  const startToasts=[
   'Explore the Forgotten Forest to find the hidden Wooden Treasure Chest!',
   'Search the deep Crystal Cavern to discover the hidden Crystal Grotto!',
   'Uncover the secret chamber hidden within the Final Vault!'
  ];
  toast(startToasts[i]);
  save();
 }catch(e){
  console.error(e);$('lt').textContent='Error: '+e.message;$('lerr').style.display='inline-block';
 }
}

function beginChestOpen(){
 if(G.chestState!=='locked')return;
 G.solved=true;G.chestState='opening';G.cine=1;G.ct=0;
 G.lockPopped=false;G.chestSounded=false;G.keyRevealed=false;G.keyFlying=false;G.keyGranted=false;
 q('chest');
 sfx('lockOpen');
}

function finishKeyPickup(){
 if(G.keyGranted)return;
 G.keyGranted=true;
 CHEST.keyMesh.visible=false;
 G.hasKey=true;
 G.keys[G.lv]=true;
 G.chestState='opened';
 G.cine=0;
 if(G.chestIt){
  G.chestIt.label=`Wooden Treasure Chest — Opened (${LV[G.lv].kn} Obtained)`;
  G.chestIt.subCls='ok';
 }
 if(G.doorIt){
  G.doorIt.label=`Exit Door — Use ${LV[G.lv].kn}`;
  G.doorIt.subCls='ok';
 }
 sfx('keyGet');
 flash();
 q('key');
 showKeyPop(G.lv);
 toast('Key Obtained! Head to the Exit Door.','ok');
 hudUpd();
 save();
}

function tryDoor(){
 if(G.doorState==='opening'||G.doorState==='unlocked')return;
 if(!G.hasKey||!G.keys[G.lv]){
  sfx('locked');
  if(DOOR)DOOR.shake=.45;
  toast('You need a key to unlock this door!','warn');
  return;
 }
 // unlock with matching level key
 G.doorState='opening';
 GATE_T=.0001;
 sfx('lockOpen');
 sfx('door');
 q('door');
 if(DOOR){
  DOOR.sigilMat.color.setHex(0x44ff88);
  DOOR.sigilMat.emissive.setHex(0x33dd77);
  DOOR.sigilLight.color.setHex(0x44ff88);
  DOOR.sigilLight.intensity=2.2;
 }
 if(G.doorIt){G.doorIt.on=false}
 toast(`Door Unlocked with ${LV[G.lv].kn}!`,'ok');
 hudUpd();
}

function doorOpened(){
 G.doorState='unlocked';
 if(GC)GC.off=true;
 if(DOOR){DOOR.lockEmblem.visible=false;DOOR.sigilLight.intensity=.4}
 if(G.lv<2){
  if(ORB)ORB.visible=true;
  if(G.orbIt)G.orbIt.on=true;
  if(PG)PG.visible=true;
  if(G.portalIt)G.portalIt.on=true;
  toast('Proceed through the open doorway to the Exit Portal!','ok');
 }else{
  if(G.relicIt)G.relicIt.on=true;
  toast('The Final Sanctum is open! Claim the Legendary Treasure!','ok');
 }
 hudUpd();
}

function advanceLevel(cur){
 if(G.advancing)return;
 G.advancing=true;
 q('next');
 SV.done.includes(cur+1)||SV.done.push(cur+1);
 SV.unlocked=Math.max(SV.unlocked,Math.min(3,cur+2));
 save();
 sfx('ok');
 $('tr-badge').textContent=`Level ${cur+1} Complete`;
 $('tr-title').textContent=LV[cur+1].n;
 $('tr-sub').textContent=`Advancing to Level ${cur+2} (${LV[cur+1].d})…`;
 $('trans').classList.add('on');
 setTimeout(()=>{startLevel(cur+1)},1500);
}

function victory(){
 if(G.advancing)return;
 G.advancing=true;
 q('treasure');
 if(!SV.done.includes(3))SV.done.push(3);
 SV.unlocked=3;save();G.cine=0;
 const s=Math.max(0,Math.round(6000-SV.run.t*3-SV.run.h*250)),m=Math.floor(SV.run.t/60),sec=Math.floor(SV.run.t%60);
 $('vs').innerHTML=`<p>Total time: <b>${m}m ${sec}s</b><br>Hints used: <b>${SV.run.h}</b><br>Final score: <b style="color:var(--g);font-size:26px">${s}</b></p>`;
 sfx('win');ui('vic');
}

/* ===== input ===== */
addEventListener('keydown',e=>{
 if(e.target.tagName==='INPUT'&&e.key!=='Escape')return;
 const c=e.code;
 if(c==='Escape'){
  if(performance.now()-lockT<300)return;
  if(ST==='play')pause();else if(['puz','inv','quest','pause'].includes(ST))resume();
  return;
 }
 if(['inv','quest'].includes(ST)&&(c==='KeyI'||c==='KeyQ')){resume();return}
 if(ST!=='play')return;
 if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','Space'].includes(c)){K[c]=1;e.preventDefault()}
 else if(c==='KeyE'&&!e.repeat)tryInteract();
 else if(c==='KeyI')ui('inv');
 else if(c==='KeyQ')ui('quest');
});
addEventListener('keyup',e=>{delete K[e.code]});
addEventListener('blur',()=>{K={}});
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&ST==='play'){lockT=performance.now();pause()}});
addEventListener('mousedown',e=>{if(ST==='play'&&e.target===cv){drag=true;try{cv.requestPointerLock()}catch(x){}}});
addEventListener('mouseup',()=>drag=false);
addEventListener('mousemove',e=>{if(ST==='play'&&(document.pointerLockElement||drag)){yaw-=e.movementX*.003;pitch=Math.max(-.15,Math.min(1.2,pitch+e.movementY*.003))}});

let near=null;
function tryInteract(){
 if(!near||G.cine||G.advancing)return;
 P.act=.7;sfx('use');near.act();
}

/* ===== update loop ===== */
function res(){
 for(const c of COL){
  if(c.off)continue;
  if(c.t==='c'){
   const dx=P.x-c.x,dz=P.z-c.z,d=Math.hypot(dx,dz),m=c.r+.45;
   if(d<m){if(d>1e-4){P.x=c.x+dx/d*m;P.z=c.z+dz/d*m}else P.x=c.x+m}
  }else{
   const nx=Math.max(c.x-c.hx,Math.min(P.x,c.x+c.hx)),nz=Math.max(c.z-c.hz,Math.min(P.z,c.z+c.hz));
   const dx=P.x-nx,dz=P.z-nz,d=Math.hypot(dx,dz);
   if(d<.45){
    if(d>1e-4){P.x=nx+dx/d*.45;P.z=nz+dz/d*.45}
    else{const ox=c.hx-Math.abs(P.x-c.x),oz=c.hz-Math.abs(P.z-c.z);if(ox<oz)P.x+=(P.x>c.x?1:-1)*(ox+.45);else P.z+=(P.z>c.z?1:-1)*(oz+.45)}
   }
  }
 }
}
const hit=(x,y,z)=>COL.some(c=>!c.off&&y<c.h&&(c.t==='c'?Math.hypot(x-c.x,z-c.z)<c.r+.2:Math.abs(x-c.x)<c.hx+.2&&Math.abs(z-c.z)<c.hz+.2));

function move(dt){
 const fw=(K.KeyW?1:0)-(K.KeyS?1:0),rt=(K.KeyD?1:0)-(K.KeyA?1:0);
 let dx=-fw*Math.sin(yaw)+rt*Math.cos(yaw),dz=-fw*Math.cos(yaw)-rt*Math.sin(yaw);
 const l=Math.hypot(dx,dz),sp=l?((K.ShiftLeft||K.ShiftRight)?9:5.2):0;
 if(l){dx/=l;dz/=l;P.vx=dx*sp;P.vz=dz*sp;P.face=Math.atan2(dx,dz)}else P.vx=P.vz=0;
 P.sp=sp;
 if(K.Space&&P.g){P.vy=9;P.g=false;sfx('jump')}
 P.vy-=26*dt;P.y+=P.vy*dt;
 if(P.y<=0){P.y=0;P.vy=0;P.g=true}else P.g=false;
 P.x+=P.vx*dt;P.z+=P.vz*dt;res();
 P.x=Math.max(-28.5,Math.min(28.5,P.x));P.z=Math.max(-28.5,Math.min(28.5,P.z));
 if(P.g&&sp){P.st-=dt;if(P.st<=0){sfx('step');P.st=sp>6?.3:.45}}else if(!sp)P.st=0;
 if(!G.q.explore&&Math.hypot(P.x-G.sx,P.z-G.sz)>8)q('explore');
}

function animP(t,dt){
 PM.position.set(P.x,P.y,P.z);
 let d=P.face-PM.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));PM.rotation.y+=d*Math.min(1,dt*14);
 const u=PM.u;P.act=Math.max(0,P.act-dt);
 let la=0,ll=0,ra=0;
 if(!P.g){la=-2.4;ra=-2.4;ll=.5}
 else if(P.sp){const w=Math.sin(t*(P.sp>6?15:10))*(P.sp>6?1:.7);la=w;ra=-w;ll=-w}
 else{la=Math.sin(t*2)*.05;ra=-la}
 if(P.act>0)ra=-1.7+Math.sin(t*14)*.2;
 u.la.rotation.x=la;u.ra.rotation.x=ra;u.ll.rotation.x=ll;u.rl.rotation.x=P.g&&P.sp?-ll:(P.g?0:-.4);
 PM.children[0].position.y=1.15+(P.sp&&P.g?Math.abs(Math.sin(t*10))*.05:0);
}

function animChestCine(dt){
 G.ct+=dt;const ct=G.ct;
 // 0.0 -> 0.45: Padlock unlocks and drops away
 if(ct<.45){
  const u=ct/.45;
  CHEST.shackle.position.y=.13+u*.16;
  CHEST.padlock.rotation.z=Math.sin(u*14)*.15;
  CHEST.padlock.position.y=CHEST.by+.72-u*.18;
  CHEST.lockGlow.intensity=1.6+u*1.2;
 }else{
  CHEST.padlock.visible=false;
  CHEST.lockGlow.intensity=Math.max(0,CHEST.lockGlow.intensity-dt*3);
 }
 // 0.30 -> 1.15: Chest lid swings open + sparkles + sound
 if(ct>=.3){
  if(!G.chestSounded){G.chestSounded=true;sfx('chest');toast('Treasure Chest Opened!','ok')}
  const lu=Math.min(1,(ct-.3)/.85);
  const ease=1-Math.pow(1-lu,3);
  CHEST.lid.rotation.x=-1.78*ease;
  CHEST.innerGlow.intensity=2.4*ease;
  CHEST.spMat.opacity=lu<1?.95:Math.max(0,.95-(ct-1.15)*.6);
  for(let i=0;i<CHEST.spN;i++){
   CHEST.spPos[i*3+1]+=dt*(.7+(i%3)*.35);
   CHEST.spPos[i*3]+=Math.sin(ct*4+i)*dt*.25;
  }
  CHEST.sparks.geometry.attributes.position.needsUpdate=true;
 }
 // 0.85 -> 1.75: Key rises out of chest and rotates
 if(ct>=.85){
  if(!G.keyRevealed){G.keyRevealed=true;CHEST.keyMesh.visible=true}
  CHEST.keyMesh.rotation.y+=dt*4.5;
  if(ct<1.75){
   const ku=(ct-.85)/.9;
   const ke=1-Math.pow(1-ku,2);
   CHEST.keyMesh.position.set(0,CHEST.by+.45+ke*1.65,0);
   CHEST.keyMesh.scale.setScalar(.85+ke*.25);
  }else{
   // 1.75 -> 2.35: Key swoops from chest toward player
   const fu=Math.min(1,(ct-1.75)/.6);
   const fe=fu*fu;
   const dx=P.x-CHEST.x,dz=P.z-CHEST.z,dy=1.45;
   CHEST.keyMesh.position.set(dx*fe,CHEST.by+2.1+(dy-(CHEST.by+2.1))*fe,dz*fe);
   CHEST.keyMesh.scale.setScalar(Math.max(.12,1.1*(1-fe*.82)));
  }
 }
 if(ct>=2.35){finishKeyPickup()}
}

function tick(){
 requestAnimationFrame(tick);if(!renderer)return;
 const dt=Math.min(CL.getDelta(),.05),t=CL.elapsedTime;
 if(G.on){
  if(ST==='play'||ST==='puz'||G.cine)SV.run.t+=dt;
  if(ST==='play'&&!G.cine&&!G.advancing)move(dt);
  ANI.forEach(f=>f(t,dt));
  animP(t,dt);

  if(G.cine&&CHEST)animChestCine(dt);

  // Door shake when locked & swinging open when unlocked
  if(DOOR){
   if(DOOR.shake>0){
    DOOR.shake=Math.max(0,DOOR.shake-dt);
    DOOR.lockEmblem.position.x=Math.sin(t*55)*.12*(DOOR.shake/.45);
   }else DOOR.lockEmblem.position.x=0;
   if(G.doorState==='locked')DOOR.sigilCore.rotation.y=t*1.4;
  }
  if(GATE_T>0&&GATE_T<1&&DOOR){
   GATE_T=Math.min(1,GATE_T+dt/1.35);
   const ease=1-Math.pow(1-GATE_T,3);
   DOOR.leftDoor.rotation.y=-1.65*ease;
   DOOR.rightDoor.rotation.y=1.65*ease;
   DOOR.lockEmblem.scale.setScalar(Math.max(.001,1-GATE_T*1.6));
   if(GATE_T>=1){GATE_T=1;doorOpened()}
  }

  // Hidden chest discovery & ambient proximity chime
  if(CHEST&&G.chestState==='locked'&&ST==='play'){
   const cd=Math.hypot(P.x-CHEST.x,P.z-CHEST.z);
   const discRange=[9.0,8.0,7.0][G.lv];
   if(!G.q.find&&cd<discRange){
    q('find');
    sfx('nearChime'+G.lv);
   }
   if(cd<discRange+3.5){
    if(!G.lastChimeT||t-G.lastChimeT>5.5){
     G.lastChimeT=t;
     sfx('nearChime'+G.lv);
    }
   }
  }

  let tg=new THREE.Vector3(P.x,P.y+1.7,P.z),want;
  if(G.cine&&CHEST){
   tg.set(CHEST.x,1.35,CHEST.z);
   const co=CHEST.camOff||new THREE.Vector3(2.6,3.2,4.8);
   want=new THREE.Vector3(CHEST.x+co.x,co.y,CHEST.z+co.z);
  }else{
   const cp=Math.cos(pitch);let d=7;
   for(;d>1.2;d-=.4){
    const x=tg.x+Math.sin(yaw)*cp*d,z=tg.z+Math.cos(yaw)*cp*d,y=tg.y+Math.sin(pitch)*d;
    if(y>.4&&!hit(x,y,z))break;
   }
   want=new THREE.Vector3(tg.x+Math.sin(yaw)*cp*d,Math.max(.5,tg.y+Math.sin(pitch)*d),tg.z+Math.cos(yaw)*cp*d);
  }
  cam.position.lerp(want,1-Math.exp(-(G.cine?4:14)*dt));
  cam.lookAt(tg);

  near=null;
  if(ST==='play'&&!G.cine&&!G.advancing){
   let best=999;
   for(const it of IT){
    if(!it.on)continue;
    const d=Math.hypot(P.x-it.x,P.z-it.z);
    if(d<(it.range||3.4)&&d<best){best=d;near=it}
   }
  }
  const pr=$('pr');
  if(near){
   pr.style.display='block';
   const h=`<div class="pr-main"><span class="keycap">E</span><b>${near.prompt||'Press E to Interact'}</b></div><span class="pr-sub ${near.subCls||''}">${near.label}</span>`;
   if(pr.dataset.h!==h){pr.innerHTML=h;pr.dataset.h=h}
  }else{pr.style.display='none';pr.dataset.h=''}
 }
 renderer.render(scene,cam);
}

addEventListener('beforeunload',save);
setInterval(()=>{if(G.on&&ST==='play')save()},15000);
ui('menu');tick();
