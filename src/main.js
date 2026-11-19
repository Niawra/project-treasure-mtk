'use strict';
/* ===== utils & save ===== */
const $=i=>document.getElementById(i),RI=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const mul=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
function generateChestLocations(){
 return {
  0: RI(0, 2),
  1: RI(0, 2),
  2: RI(0, 2)
 };
}

const fresh=()=>({
 unlocked: 1,
 done: [],
 frags: [],
 run: { t: 0, h: 0 },
 puzzles: generateAllGamePuzzles(),
 chestLocations: generateChestLocations()
});
let SV=fresh();
try{
 const loaded=JSON.parse(localStorage.getItem('ptlc')||'{}');
 SV=Object.assign(fresh(),loaded);
 if(!SV.puzzles||!SV.puzzles[0]||!SV.puzzles[1]||!SV.puzzles[2]){
  SV.puzzles=generateAllGamePuzzles();
  save();
 }
 if(!SV.chestLocations||SV.chestLocations[0]===undefined||SV.chestLocations[1]===undefined||SV.chestLocations[2]===undefined){
  SV.chestLocations=generateChestLocations();
  save();
 }
}catch(e){
 SV=fresh();
}
const save=()=>{try{localStorage.setItem('ptlc',JSON.stringify(SV))}catch(e){}};
const KEY_SVG='<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>';

/* ===== math / puzzles ===== */
const F=(n,a,b)=>({
 n,a,b,
 ap:x=>a*x+b,
 inv:y=>(y-b)/a,
 rhs:`${a==1?'':a}x ${b<0?'− '+(-b):'+ '+b}`,
 txt:`${n}(x) = ${a==1?'':a}x ${b<0?'− '+(-b):'+ '+b}`,
 sub:v=>`${a==1?v:a+'('+v+')'} ${b<0?'− '+(-b):'+ '+b}`,
 invTxt:a==1?`${n}⁻¹(x) = x ${b<0?'+ '+(-b):'− '+b}`:`${n}⁻¹(x) = (x ${b<0?'+ '+(-b):'− '+b}) / ${a}`,
 invSub:v=>a==1?`${v} ${b<0?'+ '+(-b):'− '+b}`:`(${v} ${b<0?'+ '+(-b):'− '+b}) / ${a}`
});

const LV_TIMES=[600,720,900]; // Level countdown timers: 10m, 12m, 15m

const LV=[
 {
  n:'The Forgotten Forest',d:'Easy',kn:'Forest Key',kc:0xffd24c,
  fs:[F('f',2,3)],compX:5,guardX:4,chestY:13,
  bg:'linear-gradient(#7fb069,#1f3a2b)'
 },
 {
  n:'The Crystal Cavern',d:'Medium',kn:'Crystal Key',kc:0x7be8ff,
  fs:[F('f',2,3),F('g',1,-1)],compX:4,guardX:6,chestY:9,
  bg:'linear-gradient(#4aa8ff,#0b1230)'
 },
 {
  n:'The Final Vault',d:'Hard',kn:'Vault Key',kc:0xffe066,
  fs:[F('f',2,1),F('g',1,3),F('h',3,-2)],compX:2,guardX:1,chestY:15,
  bg:'linear-gradient(#e0b23c,#2a1c08)'
 }
];

const QD=[
 [
  ['explore','Explore the Forgotten Forest'],
  ['insc','Find the ancient inscription'],
  ['comp','Solve the ancient cipher challenge'],
  ['reveal','Reveal the treasure location'],
  ['travel','Travel to the treasure area'],
  ['guardian','Defeat the forest guardian'],
  ['inverse','Solve the inverse function challenge'],
  ['chest','Open the first treasure chest']
 ],
 [
  ['explore','Explore the Crystal Cavern'],
  ['insc','Find both function inscriptions'],
  ['comp','Solve the crystal cipher challenge'],
  ['reveal','Reveal the treasure location'],
  ['travel','Travel to the treasure area'],
  ['guardian','Defeat the crystal guardian'],
  ['inverse','Solve the inverse function challenge'],
  ['chest','Open the second treasure chest']
 ],
 [
  ['explore','Explore the Final Vault'],
  ['insc','Find all three function inscriptions'],
  ['comp','Solve the vault cipher challenge'],
  ['reveal','Reveal the final treasure location'],
  ['travel','Travel to the treasure area'],
  ['guardian','Defeat the final guardian'],
  ['inverse','Solve the inverse function challenge'],
  ['chest','Unlock the final treasure chest']
 ]
];

const formatTime=s=>{
 const m=Math.floor(Math.max(0,s)/60),sec=Math.floor(Math.max(0,s)%60);
 return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
};

function formatLinearFn(n,a,b){
 const sign=b>=0?'+':'−',absB=Math.abs(b),aStr=a===1?'':(a===-1?'−':a);
 const rhs=b===0?`${aStr}x`:`${aStr}x ${sign} ${absB}`;
 return `${n}(x) = ${rhs}`;
}

function formatLinearInverse(n,a,b){
 const sign=b>=0?'−':'+',absB=Math.abs(b);
 if(a===1)return b===0?`${n}⁻¹(x) = x`:`${n}⁻¹(x) = x ${sign} ${absB}`;
 const num=b===0?'x':`(x ${sign} ${absB})`;
 return `${n}⁻¹(x) = ${num} / ${a}`;
}

function sanitizeMathExpr(str){
 if(!str || typeof str !== 'string') return '';
 let s = str.trim();
 s = s.replace(/^(?:[fghFGH](?:⁻¹|\^-1|-1|\^\{-1\}|\(-1\))?(?:\([0-9xX+\-*/.]+\))?|[fghFGH]|y|ans)\s*=\s*/i, '');
 s = s.replace(/[−–—]/g, '-');
 s = s.replace(/[×✕*]/g, '*');
 s = s.replace(/[÷:]/g, '/');
 s = s.replace(/,/g, '.');
 s = s.replace(/\[/g, '(').replace(/\]/g, ')');
 s = s.replace(/\{/g, '(').replace(/\}/g, ')');
 s = s.replace(/X/g, 'x');

 for(let iter = 0; iter < 4; iter++){
   s = s.replace(/(\d+(?:\.\d+)?)\s*x/g, '$1*x');
   s = s.replace(/\)\s*x/g, ')*x');
   s = s.replace(/x\s*\(/g, 'x*(');
   s = s.replace(/\)\s*\(/g, ')*(');
   s = s.replace(/(\d+(?:\.\d+)?)\s*\(/g, '$1*(');
   s = s.replace(/\)\s*(\d+(?:\.\d+)?)/g, ')*$1');
   s = s.replace(/x\s*(\d+(?:\.\d+)?)/g, 'x*$1');
 }
 return s.replace(/\s+/g, '');
}

function evaluateMathExpr(exprStr, xVal = 0){
 const s = exprStr;
 let pos = 0;

 function peek(){
  return pos < s.length ? s[pos] : null;
 }

 function getNumber(){
  const start = pos;
  while(pos < s.length && /[0-9.]/.test(s[pos])){
   pos++;
  }
  const sub = s.slice(start, pos);
  const n = parseFloat(sub);
  return isNaN(n) ? NaN : n;
 }

 function parseExpr(){
  let val = parseTerm();
  if(isNaN(val)) return NaN;
  while(pos < s.length){
   const ch = peek();
   if(ch === '+'){
    pos++;
    const r = parseTerm();
    if(isNaN(r)) return NaN;
    val += r;
   }else if(ch === '-'){
    pos++;
    const r = parseTerm();
    if(isNaN(r)) return NaN;
    val -= r;
   }else{
    break;
   }
  }
  return val;
 }

 function parseTerm(){
  let val = parseFactor();
  if(isNaN(val)) return NaN;
  while(pos < s.length){
   const ch = peek();
   if(ch === '*'){
    pos++;
    const r = parseFactor();
    if(isNaN(r)) return NaN;
    val *= r;
   }else if(ch === '/'){
    pos++;
    const r = parseFactor();
    if(isNaN(r) || r === 0) return NaN;
    val /= r;
   }else{
    break;
   }
  }
  return val;
 }

 function parseFactor(){
  let sign = 1;
  while(pos < s.length && (peek() === '+' || peek() === '-')){
   if(peek() === '-') sign = -sign;
   pos++;
  }
  const val = parsePrimary();
  return isNaN(val) ? NaN : sign * val;
 }

 function parsePrimary(){
  const ch = peek();
  if(ch === null) return NaN;
  if(ch === '('){
   pos++;
   const val = parseExpr();
   if(peek() !== ')') return NaN;
   pos++;
   return val;
  }
  if(ch === 'x'){
   pos++;
   return xVal;
  }
  if(/[0-9.]/.test(ch)){
   return getNumber();
  }
  return NaN;
 }

 const result = parseExpr();
 return (pos === s.length) ? result : NaN;
}

function checkInverseEquivalence(userInput, a, b){
 if(!userInput || typeof userInput !== 'string') return false;
 const clean = sanitizeMathExpr(userInput);
 if(!clean || !clean.includes('x')) return false;
 if(!/^[0-9x+\-*/().]+$/.test(clean)) return false;

 const testPoints = [-20, -7, -1, 0, 2, 8, 17, 30];
 for(let i = 0; i < testPoints.length; i++){
  const x = testPoints[i];
  const expected = (x - b) / a;
  const actual = evaluateMathExpr(clean, x);
  if(typeof actual !== 'number' || isNaN(actual) || !isFinite(actual)){
   return false;
  }
  if(Math.abs(actual - expected) > 1e-4){
   return false;
  }
 }
 return true;
}

function checkValueEquivalence(userInput, targetVal){
 if(!userInput || typeof userInput !== 'string') return false;
 const clean = sanitizeMathExpr(userInput);
 if(!clean || clean.includes('x')) return false;
 if(!/^[0-9+\-*/().]+$/.test(clean)) return false;

 const actual = evaluateMathExpr(clean, 0);
 if(typeof actual !== 'number' || isNaN(actual) || !isFinite(actual)){
  return false;
 }
 return Math.abs(actual - targetVal) < 1e-4;
}

// Composition Question Generator:
// Level 0 (Level 1): Komposisi 1 fungsi: f(x)
// Level 1 (Level 2): Komposisi 2 fungsi: f(g(x))
// Level 2 (Level 3): Komposisi 3 fungsi: f(g(h(x)))
function genCompositionQuestion(lvIdx=0,role='guardian'){
 if(lvIdx===0){
  // LEVEL 1: Komposisi 1 fungsi
  const a=RI(2,4);
  const bList=[-5,-4,-3,-2,-1,1,2,3,4,5];
  const b=bList[RI(0,bList.length-1)];
  const x0=RI(2,5);
  const correctVal=a*x0+b;

  const fnTxt=formatLinearFn('f',a,b);
  const signB=b>=0?'+ '+b:'− '+Math.abs(b);
  const knownText=`Diketahui:\n${fnTxt}`;
  const promptText=`Jika x = ${x0}, tentukan nilai f(${x0})!`;
  const inputPrefix=`f(${x0}) =`;
  const correctDisplay=`f(${x0}) = ${correctVal}`;

  const steps=[
   {num:1,title:'Tuliskan Rumus Fungsi',math:`${fnTxt}`,desc:'Gunakan persamaan fungsi f(x) yang diberikan.'},
   {num:2,title:`Substitusikan Nilai x = ${x0}`,math:`f(${x0}) = ${a}(${x0}) ${signB}`,desc:`Gantikan setiap variabel x dengan angka ${x0}.`},
   {num:3,title:'Lakukan Operasi Perkalian',math:`${a} × ${x0} = ${a*x0}`,desc:'Dahulukan operasi perkalian sebelum penjumlahan atau pengurangan.'},
   {num:4,title:'Operasi Penjumlahan / Pengurangan',math:`${a*x0} ${signB} = ${correctVal}`,desc:'Hitung operasi konstanta untuk mendapatkan nilai akhir.'},
   {num:5,title:'Hasil Akhir Nilai Fungsi',math:`f(${x0}) = ${correctVal}`,desc:`Maka nilai f(${x0}) adalah ${correctVal}.`}
  ];

  const hints=[
   'Perhatikan rumus fungsi f(x). Kamu diminta menghitung nilainya pada nilai x yang sudah diberikan.',
   'Gantikan variabel x di dalam rumus dengan angka input yang diberikan.',
   'Dahulukan operasi perkalian koefisien sebelum menjumlahkan atau mengurangkan konstanta.'
  ];

  const titles=role==='guardian'?'Forest Stone Guardian — Function Trial':'Ancient Cipher Altar — Function Evaluation';
  const lore=role==='guardian'?'“Halt, traveler! The sacred glade demands precision. Evaluate the ancient function, or turn back!”':'';

  return{
   type:'composition',
   kind:role,
   ansType:'value',
   compLevel:1,
   x0,
   correctVal,
   fns:[{n:'f',a,b,txt:fnTxt}],
   fnTxt,
   knownText,
   promptText,
   inputPrefix,
   placeholder:'Ketik angka hasil perhitungan',
   correctDisplay,
   steps,
   hints,
   title:titles,
   lore,
   fl:promptText,
   nt:fnTxt,
   hs:0
  };
 }else if(lvIdx===1){
  // LEVEL 2: Komposisi 2 fungsi: f(g(x))
  const a2=RI(1,2);
  const b2=RI(1,4);
  const x0=RI(1,3);
  const v1=a2*x0+b2; // g(x0)

  const a1=RI(2,3);
  const b1=RI(-3,3);
  const v2=a1*v1+b1; // f(g(x0))

  const fTxt=formatLinearFn('f',a1,b1);
  const gTxt=formatLinearFn('g',a2,b2);
  const signB1=b1>=0?'+ '+b1:'− '+Math.abs(b1);
  const signB2=b2>=0?'+ '+b2:'− '+Math.abs(b2);

  const knownText=`Diketahui:\n${fTxt}\n${gTxt}`;
  const promptText=`Jika x = ${x0}, tentukan nilai f(g(${x0}))!`;
  const inputPrefix=`f(g(${x0})) =`;
  const correctDisplay=`f(g(${x0})) = ${v2}`;

  const steps=[
   {num:1,title:'Identifikasi Urutan Komposisi Fungsi',math:`f(g(${x0}))`,desc:'Untuk menyelesaikan komposisi f(g(x)), hitung fungsi bagian dalam g(x) terlebih dahulu.'},
   {num:2,title:`Evaluasi Fungsi Terdalam g(${x0})`,math:`g(${x0}) = ${a2}(${x0}) ${signB2} = ${v1}`,desc:`Substitusikan x = ${x0} ke dalam fungsi g(x) sehingga diperoleh g(${x0}) = ${v1}.`},
   {num:3,title:'Gunakan Hasil g Sebagai Input untuk f',math:`f(g(${x0})) = f(${v1})`,desc:`Masukkan hasil nilai g(${x0}) yaitu ${v1} sebagai input x baru untuk fungsi f(x).`},
   {num:4,title:`Evaluasi Fungsi Luar f(${v1})`,math:`f(${v1}) = ${a1}(${v1}) ${signB1} = ${a1*v1} ${signB1} = ${v2}`,desc:`Hitung operasi aljabar pada fungsi f(${v1}) untuk memperoleh hasil akhir.`},
   {num:5,title:'Hasil Akhir Komposisi Dua Fungsi',math:`f(g(${x0})) = ${v2}`,desc:`Maka nilai dari f(g(${x0})) adalah ${v2}.`}
  ];

  const hints=[
   'Untuk menyelesaikan f(g(x)), kamu harus mencari nilai fungsi terdalam g(x) terlebih dahulu.',
   'Setelah memperoleh hasil angka dari g(x), jadikan angka tersebut sebagai input untuk fungsi f(x).',
   'Dahulukan operasi perkalian sebelum penjumlahan atau pengurangan.'
  ];

  const titles=role==='guardian'?'Crystal Sentinel — 2-Function Composition Trial':'Crystal Cipher Altar — 2-Function Composition';
  const lore=role==='guardian'?'“The crystal harmonics resonate with composed frequencies! Compute f(g(x)), or face expulsion!”':'';

  return{
   type:'composition',
   kind:role,
   ansType:'value',
   compLevel:2,
   x0,
   correctVal:v2,
   fns:[{n:'f',a:a1,b:b1,txt:fTxt},{n:'g',a:a2,b:b2,txt:gTxt}],
   fnTxt:`${fTxt} | ${gTxt}`,
   knownText,
   promptText,
   inputPrefix,
   placeholder:'Ketik angka hasil perhitungan',
   correctDisplay,
   steps,
   hints,
   title:titles,
   lore,
   fl:promptText,
   nt:`${fTxt} | ${gTxt}`,
   hs:0
  };
 }else{
  // LEVEL 3: Komposisi 3 fungsi: f(g(h(x)))
  const a3=RI(1,2);
  const b3=RI(1,3);
  const x0=RI(1,2);
  const v1=a3*x0+b3; // h(x0)

  const a2=RI(1,2);
  const b2=RI(-2,2);
  const v2=a2*v1+b2; // g(h(x0))

  const a1=RI(2,3);
  const b1=RI(-2,3);
  const v3=a1*v2+b1; // f(g(h(x0)))

  const fTxt=formatLinearFn('f',a1,b1);
  const gTxt=formatLinearFn('g',a2,b2);
  const hTxt=formatLinearFn('h',a3,b3);
  const signB1=b1>=0?'+ '+b1:'− '+Math.abs(b1);
  const signB2=b2>=0?'+ '+b2:'− '+Math.abs(b2);
  const signB3=b3>=0?'+ '+b3:'− '+Math.abs(b3);

  const knownText=`Diketahui:\n${fTxt}\n${gTxt}\n${hTxt}`;
  const promptText=`Jika x = ${x0}, tentukan nilai f(g(h(${x0})))!`;
  const inputPrefix=`f(g(h(${x0}))) =`;
  const correctDisplay=`f(g(h(${x0}))) = ${v3}`;

  const steps=[
   {num:1,title:'Identifikasi Urutan Komposisi 3 Fungsi',math:`f(g(h(${x0})))`,desc:'Selesaikan dari fungsi yang paling dalam: h(x), kemudian g(x), lalu fungsi terluar f(x).' },
   {num:2,title:`Hitung Fungsi Paling Dalam h(${x0})`,math:`h(${x0}) = ${a3}(${x0}) ${signB3} = ${v1}`,desc:`Substitusikan x = ${x0} ke dalam fungsi h(x) sehingga diperoleh hasil ${v1}.`},
   {num:3,title:`Masukkan Hasil ke Fungsi Tengah g(${v1})`,math:`g(h(${x0})) = g(${v1}) = ${a2}(${v1}) ${signB2} = ${v2}`,desc:`Gunakan hasil ${v1} sebagai input untuk fungsi tengah g(x) sehingga didapat ${v2}.`},
   {num:4,title:`Masukkan Hasil ke Fungsi Terluar f(${v2})`,math:`f(g(h(${x0}))) = f(${v2}) = ${a1}(${v2}) ${signB1} = ${v3}`,desc:`Gunakan hasil ${v2} sebagai input untuk fungsi terluar f(x) dan hitung hasil akhirnya.`},
   {num:5,title:'Hasil Akhir Komposisi Tiga Fungsi',math:`f(g(h(${x0}))) = ${v3}`,desc:`Maka nilai dari f(g(h(${x0}))) adalah ${v3}.`}
  ];

  const hints=[
   'Kerjakan komposisi 3 fungsi secara bertahap dari bagian yang paling dalam: h(x) lebih dulu.',
   'Setelah mendapat nilai h(x), masukkan ke fungsi tengah g(x).',
   'Terakhir, masukkan hasil dari g(x) ke fungsi terluar f(x) untuk mendapatkan jawaban akhir.'
  ];

  const titles=role==='guardian'?'Imperial Titan Guardian — 3-Function Composition Trial':'Vault Cipher Altar — 3-Function Composition';
  const lore=role==='guardian'?'“By order of the Ancient Architects, compute the triple composition f(g(h(x))) to deactivate the defense matrix!”':'';

  return{
   type:'composition',
   kind:role,
   ansType:'value',
   compLevel:3,
   x0,
   correctVal:v3,
   fns:[{n:'f',a:a1,b:b1,txt:fTxt},{n:'g',a:a2,b:b2,txt:gTxt},{n:'h',a:a3,b:b3,txt:hTxt}],
   fnTxt:`${fTxt} | ${gTxt} | ${hTxt}`,
   knownText,
   promptText,
   inputPrefix,
   placeholder:'Ketik angka hasil perhitungan',
   correctDisplay,
   steps,
   hints,
   title:titles,
   lore,
   fl:promptText,
   nt:`${fTxt} | ${gTxt} | ${hTxt}`,
   hs:0
  };
 }
}

function genChestInverseQuestion(fnName='f',lvIdx=0){
 const aPools=[[2,3],[2,3,4],[2,3,4,5]];
 const aList=aPools[Math.min(lvIdx,2)]||[2,3,4,5];
 const a=aList[RI(0,aList.length-1)];
 const kList=[-5,-4,-3,-2,-1,1,2,3,4,5];
 const k=kList[RI(0,kList.length-1)];
 const b=a*k;

 const fnTxt=formatLinearFn(fnName,a,b);
 const correctFormula=formatLinearInverse(fnName,a,b);
 const signB=b>=0?'+ '+b:'− '+Math.abs(b);
 const oppSignB=b>=0?'− '+b:'+ '+Math.abs(b);
 const aPrefix=a===1?'':`${a}`;

 const promptText=`Tentukan invers dari ${fnName}(x), yaitu ${fnName}⁻¹(x)!`;
 const knownText=`Diketahui:\n${fnTxt}`;
 const inputPrefix=`${fnName}⁻¹(x) =`;
 // SECURITY: Decoupled generic placeholder, never leaks answer!
 const placeholder='Ketik rumus invers, misal: (x - k) / m';

 const steps=[
  {num:1,title:`Ganti ${fnName}(x) dengan Variabel y`,math:`y = ${aPrefix}x ${signB}`,desc:`Tuliskan persamaan fungsi dengan menyatakan output fungsi sebagai variabel y.`},
  {num:2,title:'Tukar Posisi Variabel x dan y',math:`x = ${aPrefix}y ${signB}`,desc:`Sesuai konsep invers, daerah kawan (output y) bertukar peran dengan daerah asal (input x).`},
  {num:3,title:'Pindahkan Konstanta ke Ruas Kiri',math:`x ${oppSignB} = ${aPrefix}y`,desc:`Pindahkan konstanta dengan membalikkan tandanya (${signB} menjadi ${oppSignB}) agar suku bervariabel y berdiri sendiri.`},
  {num:4,title:`Bagi Kedua Ruas dengan Koefisien y (${a})`,math:a===1?`y = x ${oppSignB}`:`y = (x ${oppSignB}) / ${a}`,desc:`Bagi kedua sisi persamaan dengan ${a} sehingga variabel y berdiri sendiri sepenuhnya.`},
  {num:5,title:`Hasil Akhir Rumus Fungsi Invers ${fnName}⁻¹(x)`,math:correctFormula,desc:`Gantikan variabel y dengan lambang invers ${fnName}⁻¹(x). Invers fungsi berhasil ditemukan.`}
 ];

 // SECURITY: Hints teach method, never leak final formula or answer
 const hints=[
  'Ubah notasi fungsi menjadi variabel output y, lalu tukar posisi variabel x dan y.',
  'Pindahkan konstanta ke ruas yang berlawanan dengan membalik tandanya (+ menjadi −, atau sebaliknya).',
  'Bagi seluruh ruas dengan koefisien variabel y agar y berdiri sendiri sebagai rumus invers.'
 ];

 const titles=[
  'Wooden Chest Padlock — Inverse Function Cipher',
  'Crystal Chest Padlock — Inverse Function Cipher',
  'Vault Chest Padlock — Inverse Function Cipher'
 ];

 return{
  type:'inverse',
  kind:'chest',
  ansType:'formula',
  fnName,
  a,b,
  fnTxt,
  knownText,
  promptText,
  inputPrefix,
  placeholder,
  correctFormula,
  correctDisplay:correctFormula,
  steps,
  hints,
  title:titles[lvIdx]||'Wooden Chest Padlock — Inverse Function Cipher',
  fl:promptText,
  nt:fnTxt,
  hs:0
 };
}

function generateAllGamePuzzles(){
 const puzs={};
 for(let lv=0;lv<3;lv++){
  const fnChest=lv===2?'g':'f';
  puzs[lv]={
   altar:genCompositionQuestion(lv,'altar'),
   guardian:genCompositionQuestion(lv,'guardian'),
   chest:genChestInverseQuestion(fnChest,lv)
  };
 }
 return puzs;
}

function mkAltarPuz(lvIdx){
 if(SV.puzzles&&SV.puzzles[lvIdx]&&SV.puzzles[lvIdx].altar)return SV.puzzles[lvIdx].altar;
 return genCompositionQuestion(lvIdx,'altar');
}

function mkGuardianPuz(lvIdx){
 if(SV.puzzles&&SV.puzzles[lvIdx]&&SV.puzzles[lvIdx].guardian)return SV.puzzles[lvIdx].guardian;
 return genCompositionQuestion(lvIdx,'guardian');
}

function mkInversePuz(lvIdx){
 if(SV.puzzles&&SV.puzzles[lvIdx]&&SV.puzzles[lvIdx].chest)return SV.puzzles[lvIdx].chest;
 return genChestInverseQuestion(lvIdx===2?'g':'f',lvIdx);
}

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
 guardianAlert:()=>{tone(220,.35,'sawtooth',.18);tone(330,.45,'sawtooth',.15,.08)},
 guardianDefeat:()=>[440,554,659,880].forEach((f,i)=>tone(f,.45,'triangle',.18,i*.09)),
 damage:()=>{nz(.28,.4,180);tone(110,.25,'sawtooth',.2,0,60)},
 nearChime0:()=>{tone(659,.35,'sine',.06);tone(988,.45,'sine',.05,.08);tone(1318,.55,'sine',.04,.16)},
 nearChime1:()=>{tone(587,.5,'triangle',.05);tone(880,.6,'triangle',.04,.1);tone(1175,.7,'sine',.03,.2)},
 nearChime2:()=>{tone(440,.7,'sine',.07);tone(554,.8,'sine',.06,.12);tone(659,1.0,'sine',.05,.25)}
};
const sfx=n=>{au();SFX[n]&&SFX[n]()};
setInterval(()=>{if(!AC||mute)return;const l=G.on?G.lv:0,sc=[[220,247,277,330,370,440],[196,220,233,294,349,392],[110,131,147,165,196,220]][l],f=sc[RI(0,5)];
 tone(f,2.4,l==2?'sawtooth':'triangle',l==2?.025:.05,0,0,MU);if(Math.random()<.4)tone(f*2,1.6,'sine',.03,.3,0,MU);
 if(G.on&&Math.random()<.3){if(l==0)tone(RI(2000,3000),.12,'sine',.03,0,RI(1500,2400));else if(l==1)tone(1200,.15,'sine',.05,0,600);else nz(2,.05,200)}},900);

/* ===== state / ui ===== */
let G={on:false,lv:0,q:{},insc:new Set(),keys:{},hasKey:false,chestState:'locked',doorState:'locked',solved:false,cine:0,ct:0,keyGranted:false,advancing:false,lives:3,hp:100,maxHp:100,invulnTimer:0,levelTimer:600,levelTimerElapsed:0,chestTimer:180,inChestChallenge:false,chestChallengeStarted:false,altarSolved:false,guardianDefeated:false,guardianAlerted:false,cp:{x:0,z:24,yaw:0}};
let ST='menu',SB='menu',K={},W=null,COL=[],IT=[],ANI=[],yaw=0,pitch=.35,drag=false,lockT=0;
let DOOR=null,GC=null,CHEST=null,PG=null,ORB=null,RELIC=null,GATE_T=0;
let mouseSens=0.0022,camDist=3.8;
let camLookTarget=new THREE.Vector3(0,1.4,24);
let skipMouseMove=0;
const P={x:0,y:0,z:24,vx:0,vz:0,vy:0,g:true,face:Math.PI,sp:0,st:0,act:0};

function updateHeartsHUD(){
 const e=$('hud-hearts');if(!e)return;
 const h=[];
 for(let i=0;i<3;i++){
  const active=i<G.lives;
  h.push(`<span class="heart-icon ${active?'':'lost'}">${active?'❤️':'🖤'}</span>`);
 }
 e.innerHTML=h.join('');
}

function updateHealthHUD(){
 const e=$('hp-val'),f=$('hud-hp-fill');
 if(e)e.textContent=Math.round(G.hp||0);
 if(f){
  const pct=Math.max(0,Math.min(100,((G.hp||0)/(G.maxHp||100))*100));
  f.style.width=pct+'%';
  f.classList.toggle('low',pct<=30);
 }
}

function flashRed(){
 const f=$('flash');if(!f)return;
 f.style.background='#ff3333';
 f.style.transition='none';
 f.style.opacity=.65;
 requestAnimationFrame(()=>{
  f.style.transition='opacity .6s';
  f.style.opacity=0;
  setTimeout(()=>{f.style.background='#fff3c0'},600);
 });
}

function damagePlayer(amount,reason='Guardian attack'){
 if(G.invulnTimer>0||!G.on||G.hp<=0)return;
 G.hp=Math.max(0,G.hp-amount);
 G.invulnTimer=1.2;
 updateHealthHUD();
 sfx('damage');
 flashRed();
 if(G.hp<=0){
  gameOver(reason||'Your vitality was depleted from ancient cipher hazards.');
 }else{
  toast(`Took ${amount} damage! HP: ${G.hp}/100`,'warn');
 }
}

function deductLife(reason='Incorrect calculation'){
 if(G.lives<=0)return;
 G.lives--;
 updateHeartsHUD();
 updateHealthHUD();
 sfx('damage');
 flashRed();
 if(G.lives<=0){
  gameOver(reason);
 }else{
  toast(`Lost 1 Life! (${G.lives}/3 remaining)`,'warn');
 }
}

function gameOver(reason){
 G.on=false;
 ST='game-over';
 if(document.pointerLockElement)document.exitPointerLock();
 $('go-reason').textContent=reason||'Your vitality was depleted from ancient cipher hazards.';
 const qDone=QD[G.lv].filter(([k])=>G.q[k]).length;
 $('go-stats').innerHTML=
  `<b>Level:</b> Level ${G.lv+1} — ${LV[G.lv].n}<br>`+
  `<b>Objectives Completed:</b> ${qDone} / 8<br>`+
  `<b>Level Time Elapsed:</b> ${formatTime(G.levelTimerElapsed)}<br>`+
  `<b>Hint Uses:</b> ${SV.run.h}`;
 sfx('locked');
 ui('game-over');
}

function retryCheckpoint(){
 G.lives=3;
 G.hp=100;
 G.maxHp=100;
 G.invulnTimer=0;
 updateHeartsHUD();
 updateHealthHUD();
 updateHealthHUD();
 G.levelTimer=LV_TIMES[G.lv];
 G.chestTimer=180;
 G.inChestChallenge=false;
 G.chestChallengeStarted=false;
 G.busy=false;
 G.on=true;
 P.x=G.cp.x;P.z=G.cp.z;P.y=0;P.vx=P.vz=P.vy=0;
 yaw=G.cp.yaw;pitch=0.35;
 camDist=3.8;
 camLookTarget.set(P.x,1.4,P.z);
 const cp=Math.cos(pitch);
 cam.position.set(P.x+Math.sin(yaw)*cp*camDist,1.4+Math.sin(pitch)*camDist,P.z+Math.cos(yaw)*cp*camDist);
 cam.lookAt(camLookTarget);
 if(G.guardian&&!G.guardianDefeated){
  G.guardian.group.position.set(G.guardian.homeX,0,G.guardian.homeZ);
  G.guardian.x=G.guardian.homeX;
  G.guardian.z=G.guardian.homeZ;
  G.guardian.state='idle';
  G.guardian.attackCooldown=0;
  G.guardianAlerted=false;
 }
 ui(null);
 try{if(cv)cv.requestPointerLock()}catch(e){}
 toast('Respawned at checkpoint with 100 HP. Continue your quest!','ok');
}

function updateCheckpoint(x,z,y=0){
 G.cp={x,z,yaw:y};
}

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
   a.push({n:'Inscription: '+f.n+'(x)',d:`Ancient cipher inscription: ${f.txt}.`});
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
 updateHeartsHUD();
 updateHealthHUD();
 const ht=$('hud-timer');
 if(ht){
  ht.textContent='⏱️ '+formatTime(G.levelTimer);
  ht.classList.toggle('urgent',G.levelTimer<60);
 }
 $('obj').innerHTML=
  `<b>Level ${G.lv+1} — ${L.n}</b><br>${o?'Objective: '+o[1]:'All objectives complete'}`+
  `<div class="st-row">`+
  `<span class="pill ${G.altarSolved?'ok':'lk'}">Altar: ${G.altarSolved?'Deciphered':'Sealed'}</span>`+
  `<span class="pill ${G.guardianDefeated?'ok':'lk'}">Guardian: ${G.guardianDefeated?'Defeated':'Active'}</span>`+
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
 retry(){retryCheckpoint()},
 replay(){SV.run={t:0,h:0};SV.frags=[];SV.puzzles=generateAllGamePuzzles();SV.chestLocations=generateChestLocations();save();startLevel(0)},
 claim(){claimTreasure()},
 claimAltar(){claimAltar()},
 claimGuardian(){claimGuardian()}
};
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-a]');if(!b)return;au();
 const a=b.dataset.a;
 if(/^lv\d$/.test(a))startLevel(+a[2]);
 else if(/^it\d+$/.test(a))$('idesc').textContent=items()[+a.slice(2)].d;
 else ACT[a]&&ACT[a]();
});
function pause(){if(ST!=='play')return;save();ui('pause')}
function resume(){if(!G.on)return ui('menu');ui(null);try{if(cv)cv.requestPointerLock()}catch(e){}}
$('vm').oninput=e=>{vm=+e.target.value;vol()};
$('vu').oninput=e=>{vu=+e.target.value;vol()};
$('mu').onchange=e=>{mute=e.target.checked;vol()};
const sensIn=$('sens');if(sensIn)sensIn.oninput=e=>{mouseSens=+e.target.value};

/* ===== puzzle ui ===== */
function openPuz(kind){
 if(!SV.puzzles||!SV.puzzles[G.lv]){
  SV.puzzles=SV.puzzles||{};
  SV.puzzles[G.lv]={
   altar:genCompositionQuestion(G.lv,'altar'),
   guardian:genCompositionQuestion(G.lv,'guardian'),
   chest:genChestInverseQuestion(G.lv===2?'g':'f',G.lv)
  };
  save();
 }
 const pz=SV.puzzles[G.lv][kind];
 if(kind==='chest'){
  if(!G.chestChallengeStarted){
   G.inChestChallenge=false;
   G.chestTimer=180;
  }
 }
 G.pz=pz;
 G.busy=false;
 ui('puz');
 drawPuz();
 if(kind!=='chest'||G.chestChallengeStarted){
  setTimeout(()=>$('ans')&&$('ans').focus(),50);
 }
}

function drawPuz(msg,cls,showExplain=false){
 const pz=G.pz;
 let timerHtml='';
 if(pz.kind==='chest'){
  const timeStr=G.chestChallengeStarted ? formatTime(G.chestTimer) : '03:00 (Belum dimulai)';
  timerHtml=`<div class="pz-chest-timer ${G.chestChallengeStarted && G.chestTimer<30?'urgent':''}" id="pz-timer">⏳ ${timeStr}</div>`;
 }
 let guardianHtml='';
 if(pz.kind==='guardian'&&pz.lore){
  guardianHtml=`<div class="pz-guardian-box"><div class="pz-guardian-name">⚔️ ${pz.title}</div><p class="pz-guardian-speech">${pz.lore}</p></div>`;
 }

 // Format known lines cleanly
 const knownLines=(pz.knownText||'Diketahui:\n'+(pz.fnTxt||pz.nt)).split('\n');
 const introLine=knownLines[0]||'Diketahui:';
 const mathLines=knownLines.slice(1).map(l=>`<div class="pz-math-display">${l}</div>`).join('');

 let chestStartCard='';
 const isChestNotStarted = pz.kind==='chest' && !G.chestChallengeStarted;
 if(isChestNotStarted){
  chestStartCard=`
   <div class="pz-explain-card" style="border-color:#ffd24c;text-align:center;margin:12px 0;">
    <div style="color:#ffe494;font-weight:bold;margin-bottom:6px;">⚠️ TANTANGAN PETI HARTA KARUN · WAKTU TEPAT 03:00</div>
    <p style="color:#d8cfb4;font-size:13.5px;line-height:1.5;margin:0 0 10px;">Gembok peti dilindungi kunci invers dengan batas waktu 3 menit. Klik tombol di bawah untuk mengaktifkan timer dan membuka kolom jawaban!</p>
    <button id="btn-start-chest" class="pz-submit-btn" style="background:linear-gradient(#ffe066,#d4a537);color:#1c1505;font-weight:bold;font-size:15px;padding:12px 26px;box-shadow:0 0 20px rgba(255,224,102,.4)">▶ MULAI TANTANGAN (03:00)</button>
   </div>
  `;
 }

 const bodyHtml=
  `<div class="pz-math-card">`+
   `<div class="pz-math-intro">${introLine}</div>`+
   mathLines+
   `<p class="pz-math-prompt">${pz.promptText||pz.fl}</p>`+
  `</div>`+
  chestStartCard+
  (!isChestNotStarted ?
  `<div class="pz-input-row">`+
   `<span class="pz-input-prefix">${pz.inputPrefix||'Jawaban:'}</span>`+
   `<input type="text" id="ans" class="pz-input-field" placeholder="${pz.placeholder||'ketik jawaban'}" autocomplete="off" spellcheck="false" value="${pz.currentInput||''}">`+
  `</div>`+
  `<div style="text-align:center;margin-top:14px">`+
   `<button id="sb" class="pz-submit-btn">SUBMIT ANSWER</button>`+
   `<button id="hb" ${pz.hs>=3?'disabled':''}>Hint (${pz.hs}/3)</button>`+
   `<button id="cb">Close</button>`+
  `</div>` :
  `<div style="text-align:center;margin-top:14px">`+
   `<button id="cb">Close</button>`+
  `</div>`);

 let explainHtml='';
 if(showExplain){
  if(pz.kind==='chest'){
   explainHtml=`
    <div class="pz-explain-card">
     <div class="pz-explain-title">💡 Panduan Konsep Invers Fungsi:</div>
     <ol class="pz-step-list">
      <li><b>Langkah 1:</b> Tuliskan persamaan fungsi dengan menyatakan output sebagai variabel y.</li>
      <li><b>Langkah 2:</b> Tukar peranan variabel x dan y untuk membentuk relasi invers.</li>
      <li><b>Langkah 3:</b> Pindahkan suku konstanta ke ruas yang berlawanan dengan membalik tandanya.</li>
      <li><b>Langkah 4:</b> Bagi kedua ruas dengan angka koefisien variabel y agar y berdiri sendiri.</li>
     </ol>
    </div>
   `;
  }else{
   const compDesc = pz.compLevel === 3
     ? 'Hitung fungsi terdalam h(x) terlebih dahulu, masukkan hasilnya ke g(x), lalu terakhir masukkan ke fungsi terluar f(x).'
     : (pz.compLevel === 2
       ? 'Hitung fungsi terdalam g(x) terlebih dahulu, kemudian masukkan hasil nilainya ke fungsi terluar f(x).'
       : 'Substitusikan nilai x yang diberikan langsung ke dalam rumus fungsi, dahulukan perkalian sebelum penjumlahan.');
   explainHtml=`
    <div class="pz-explain-card">
     <div class="pz-explain-title">💡 Panduan Konsep Komposisi Fungsi:</div>
     <p class="pz-explain-desc" style="color:#d8cfb4;font-size:13px;line-height:1.5;margin:4px 0 8px;">${compDesc}</p>
     <ol class="pz-step-list">
      <li><b>Aturan Operasi:</b> Dahulukan selalu perhitungan fungsi bagian paling dalam.</li>
      <li><b>Prioritas Aljabar:</b> Selesaikan perkalian koefisien sebelum menambah/mengurangi konstanta.</li>
      <li><b>Substitusi Bertahap:</b> Nilai hasil dari fungsi dalam menjadi input untuk fungsi berikutnya.</li>
     </ol>
    </div>
   `;
  }
 }

 const tagLabel=pz.kind==='chest'?'Peti Harta Karun':(pz.kind==='guardian'?'Tantangan Guardian':'Cipher Altar');
 const hintList=typeof pz.hints==='function'?pz.hints():(pz.hints||[]);

 $('pz').innerHTML=
  `<div class="pz-head"><h2>${pz.title}</h2><span class="pz-tag">${tagLabel}</span></div>`+
  timerHtml+
  guardianHtml+
  bodyHtml+
  `<div id="msg" class="${cls||''}">${msg||''}</div>`+
  explainHtml+
  `${hintList.slice(0,pz.hs).map((h,i)=>`<div class="hh">Hint ${i+1}: ${h}</div>`).join('')}`;

 const btnStartChest=$('btn-start-chest');
 if(btnStartChest){
  btnStartChest.onclick=()=>{
   G.chestChallengeStarted=true;
   G.inChestChallenge=true;
   G.chestTimer=180;
   sfx('lockOpen');
   drawPuz();
   setTimeout(()=>$('ans')&&$('ans').focus(),50);
  };
 }

 if($('sb'))$('sb').onclick=submit;
 if($('hb'))$('hb').onclick=()=>{if(pz.hs<3){pz.hs++;SV.run.h++;drawPuz()}};
 $('cb').onclick=()=>{
  if(pz.kind==='chest'){G.inChestChallenge=false}
  ui(null);try{if(cv)cv.requestPointerLock()}catch(e){}
 };
 const ansEl=$('ans');
 if(ansEl){
  ansEl.oninput=()=>{pz.currentInput=ansEl.value};
  ansEl.onkeydown=e=>{if(e.key==='Enter')submit();if(e.key!=='Escape')e.stopPropagation()};
 }
}

function submit(){
 const pz=G.pz;if(G.busy)return;
 const ansEl=$('ans');
 const raw=ansEl?ansEl.value.trim():'';
 if(!raw){
  sfx('bad');drawPuz('Silakan ketik jawaban pada kolom yang tersedia.','no');
  const p=$('pz');p.classList.remove('shake');void p.offsetWidth;p.classList.add('shake');
  setTimeout(()=>$('ans')&&$('ans').focus(),20);return;
 }

 let isCorrect=false;
 if(pz.ansType==='formula'||pz.type==='inverse'){
  isCorrect=checkInverseEquivalence(raw, pz.a, pz.b);
 }else{
  isCorrect=checkValueEquivalence(raw, pz.correctVal);
 }

 if(!isCorrect){
  if(pz.kind==='chest'){
   deductLife('Peti harta karun: Jawaban invers belum tepat.');
   if(G.lives<=0)return;
   drawPuz('Jawaban belum tepat! 1 Nyawa berkurang. Periksa konsep langkah pengerjaan di bawah.','no',true);
  }else if(pz.kind==='guardian'){
   damagePlayer(25,'Guardian struck with warding burst');
   if(G.hp<=0)return;
   drawPuz('Jawaban belum tepat! Cek konsep langkah penyelesaian di bawah (-25 HP).','no',true);
  }else{
   damagePlayer(25,'Incorrect cipher attempt at Altar');
   if(G.hp<=0)return;
   drawPuz('Jawaban belum tepat! Cek konsep langkah penyelesaian di bawah (-25 HP).','no',true);
  }
  const p=$('pz');p.classList.remove('shake');void p.offsetWidth;p.classList.add('shake');
  setTimeout(()=>$('ans')&&$('ans').focus(),20);return;
 }

 G.busy=true;sfx('ok');flash();
 if(pz.kind==='altar'){
  G.altarSolved=true;
  q('comp');
  q('reveal');
  $('msg').className='ok';$('msg').textContent='Correct! Cipher Decrypted. Coordinates Revealed…';
  setTimeout(()=>{
   ui('sol');
   renderSolutionWalkthrough(pz);
   G.busy=false;
  },600);
 }else if(pz.kind==='guardian'){
  G.guardianDefeated=true;
  if(G.guardian){
   G.guardian.state='defeated';
   G.guardian.defeated=true;
   if(G.guardian.col)G.guardian.col.off=true;
  }
  if(G.guardianIt)G.guardianIt.on=false;
  q('guardian');
  $('msg').className='ok';$('msg').textContent='Correct! Guardian Deactivated. Path Opened…';
  setTimeout(()=>{
   ui('sol');
   renderSolutionWalkthrough(pz);
   G.busy=false;
  },600);
 }else{
  G.inChestChallenge=false;
  G.chestChallengeStarted=false;
  q('inverse');
  $('msg').className='ok';$('msg').textContent='Correct! Lock Decrypted. Solution Walkthrough Loading…';
  setTimeout(()=>{
   ui('sol');
   renderSolutionWalkthrough(pz);
   G.busy=false;
  },600);
 }
}

function claimTreasure(){
 ui(null);
 try{if(cv)cv.requestPointerLock()}catch(e){}
 beginChestOpen();
}

function claimAltar(){
 ui(null);
 try{if(cv)cv.requestPointerLock()}catch(e){}
 sfx('ok');
 if(G.altarLight)G.altarLight.intensity=2.8;
 toast('Coordinates Decrypted! Follow the pathway toward the Guardian.','ok');
 if(G.altarPos)updateCheckpoint(G.altarPos[0],G.altarPos[1],0);
 hudUpd();
}

function claimGuardian(){
 ui(null);
 try{if(cv)cv.requestPointerLock()}catch(e){}
 sfx('guardianDefeat');
 if(G.guardian){
  if(G.guardian.col)G.guardian.col.off=true;
  G.guardian.defeated=true;
  G.guardian.state='defeated';
 }
 if(G.guardianIt)G.guardianIt.on=false;
 toast('Guardian Deactivated! The Wooden Treasure Chest is accessible.','ok');
 if(G.guardianPos)updateCheckpoint(G.guardianPos[0],G.guardianPos[1],0);
 hudUpd();
}

function renderSolutionWalkthrough(pz){
 const lvIdx=G.lv,L=LV[lvIdx];
 let subtitle='',actionLabel='',actionAttr='',conceptTitle='',conceptDesc='';

 if(pz.kind==='chest'){
  subtitle=`SOLUTION WALKTHROUGH · INVERSE FUNCTION CIPHER · LEVEL ${lvIdx+1} (${L.n})`;
  actionLabel='CLAIM YOUR TREASURE';
  actionAttr='claim';
  conceptTitle=`Konsep: Menentukan Rumus Invers Fungsi Linear ${pz.fnName}⁻¹(x)`;
  conceptDesc=`Fungsi invers ${pz.fnName}⁻¹(x) membalikkan relasi pemetaan dari output kembali ke input. Untuk fungsi linear ${pz.fnTxt}, proses aljabar dilakukan secara bertahap: (1) ubah notasi fungsi menjadi variabel y, (2) tukar posisi variabel x dan y, (3) pindahkan konstanta ke ruas berlawanan dengan membalik tandanya, dan (4) bagi kedua ruas dengan koefisien variabel y (${pz.a}) sehingga diperoleh rumus fungsi invers ${pz.correctFormula}.`;
 }else if(pz.kind==='guardian'){
  subtitle=`GUARDIAN’S TRIAL PASSED · LEVEL ${lvIdx+1} (${L.n})`;
  actionLabel='APPROACH TREASURE CHEST';
  actionAttr='claimGuardian';
  if(pz.compLevel===1){
   conceptTitle='Konsep: Evaluasi Nilai Fungsi Tunggal f(x)';
   conceptDesc=`Substitusikan nilai x = ${pz.x0} ke dalam fungsi ${pz.nt}. Dahulukan perkalian sebelum penjumlahan/pengurangan untuk memperoleh hasil akhir ${pz.correctVal}.`;
  }else if(pz.compLevel===2){
   conceptTitle='Konsep: Komposisi Dua Fungsi f(g(x))';
   conceptDesc=`Untuk menentukan f(g(${pz.x0})), cari terlebih dahulu nilai fungsi bagian dalam g(${pz.x0}), lalu gunakan hasilnya sebagai input variabel x untuk fungsi luar f(x) hingga diperoleh hasil akhir ${pz.correctVal}.`;
  }else{
   conceptTitle='Konsep: Komposisi Tiga Fungsi f(g(h(x)))';
   conceptDesc=`Komposisi berjenjang diselesaikan dari fungsi paling dalam: hitung h(${pz.x0}), masukkan hasilnya ke g(x), lalu masukkan hasilnya ke fungsi terluar f(x) hingga diperoleh hasil akhir ${pz.correctVal}.`;
  }
 }else{
  subtitle=`CIPHER DECRYPTED · LEVEL ${lvIdx+1} (${L.n})`;
  actionLabel='TRAVEL TO TREASURE AREA';
  actionAttr='claimAltar';
  if(pz.compLevel===1){
   conceptTitle='Konsep: Evaluasi Fungsi Koordinat Altar f(x)';
   conceptDesc=`Mendekripsi altar kuno dilakukan dengan mengevaluasi rumus fungsi linear pada koordinat x = ${pz.x0} hingga menghasilkan nilai ${pz.correctVal}.`;
  }else if(pz.compLevel===2){
   conceptTitle='Konsep: Komposisi Dua Fungsi Koordinat Altar f(g(x))';
   conceptDesc=`Dekripsi koordinat gua kristal dilakukan dengan menghitung fungsi bagian dalam g(${pz.x0}), lalu memasukkannya ke fungsi luar f(x) hingga menghasilkan nilai ${pz.correctVal}.`;
  }else{
   conceptTitle='Konsep: Komposisi Tiga Fungsi Koordinat Vault f(g(h(x)))';
   conceptDesc=`Dekripsi koordinat vault dilakukan secara berjenjang dari fungsi paling dalam h(${pz.x0}), lalu ke g(x), dan terakhir ke fungsi terluar f(x) hingga menghasilkan nilai ${pz.correctVal}.`;
  }
 }

 const steps=pz.steps||[];
 const displayVal=pz.correctDisplay||(pz.ansType==='value'?`${pz.inputPrefix} ${pz.correctVal}`:`${pz.correctFormula}`);

 $('sol-box').innerHTML=
  `<div class="sol-header">`+
   `<span class="sol-tag">Jawaban Terverifikasi Benar</span>`+
   `<h2 class="sol-title">CORRECT ANSWER!</h2>`+
   `<p class="sol-subtitle">${subtitle}</p>`+
  `</div>`+
  `<div class="sol-card">`+
   `<div class="sol-card-title"><span>📐</span> SOAL & RUMUS MATEMATIKA</div>`+
   `<div class="sol-card-text"><b>Soal:</b> ${pz.promptText||pz.fl}</div>`+
   `<div class="sol-fns-grid"><span class="sol-fn-badge">${(pz.knownText||pz.fnTxt||pz.nt).replace(/\n/g,' &nbsp;|&nbsp; ')} &nbsp;➜&nbsp; <b style="color:#a2ff9b">${displayVal}</b></span></div>`+
  `</div>`+
  `<div class="sol-card">`+
   `<div class="sol-card-title"><span>💡</span> ${conceptTitle}</div>`+
   `<p class="sol-card-text">${conceptDesc}</p>`+
  `</div>`+
  `<div class="sol-steps-wrap">`+
   `<div class="sol-steps-title">LANGKAH PENYELESAIAN SISTEMATIS</div>`+
   `${steps.map(st=>`
    <div class="sol-step">
     <div class="sol-step-head"><span class="sol-step-num">Step ${st.num}</span><span class="sol-step-label">${st.label||st.title}</span></div>
     <p class="sol-step-desc">${st.desc}</p>
     <pre class="sol-math-box">${st.math}</pre>
    </div>
   `).join('')}`+
  `</div>`+
  `<div class="sol-result">`+
   `<div class="sol-res-label">Hasil Akhir Perhitungan</div>`+
   `<div class="sol-res-val">${displayVal}</div>`+
  `</div>`+
  `<div class="sol-actions">`+
   `<button class="btn-claim" id="btn-claim" data-a="${actionAttr}">`+
    `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>`+
    ` ${actionLabel}`+
   `</button>`+
  `</div>`;

 const b=$('btn-claim');
 if(b){
  b.onclick=()=>{
   if(actionAttr==='claimAltar')claimAltar();
   else if(actionAttr==='claimGuardian')claimGuardian();
   else claimTreasure();
  };
 }
 setTimeout(()=>{if($('btn-claim'))$('btn-claim').focus()},60);
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
 const sc=[0.58,0.46,0.38][levelIdx];
 const g=new THREE.Group();
 g.position.set(x,0,z);
 W.add(g);

 const boxGroup=new THREE.Group();
 boxGroup.rotation.y=yaw;
 boxGroup.scale.set(sc,sc,sc);
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
 addPart(new THREE.BoxGeometry(2.6,.14,1.7),M([0x667060,0x344664,0x736348][levelIdx]),0,.07,0);

 // hollow chest base (y from 0.14 to 1.02)
 const by=.14;
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

 // subtle glowing lock status light & interior treasure glow light (non-intrusive)
 const lockGlow=new THREE.PointLight(0xffaa33,.45,4.0);
 lockGlow.position.set(0,by+1.0,1.2);boxGroup.add(lockGlow);
 const innerGlow=new THREE.PointLight(LV[levelIdx].kc,0,5.0);
 innerGlow.position.set(0,by+.75,0);boxGroup.add(innerGlow);

 // 3D Key nested inside chest (initially hidden until chest opens)
 const keyMesh=buildKeyMesh(levelIdx);
 keyMesh.position.set(0,(by+.38)*sc,0);
 keyMesh.scale.setScalar(.85*sc);
 keyMesh.visible=false;
 g.add(keyMesh);

 // sparkle particles emitted when chest opens
 const spN=24,spGeo=new THREE.BufferGeometry(),spPos=new Float32Array(spN*3);
 for(let i=0;i<spN;i++){spPos[i*3]=(Math.random()-.5)*1.4;spPos[i*3+1]=by+.3+Math.random()*.5;spPos[i*3+2]=(Math.random()-.5)*.9}
 spGeo.setAttribute('position',new THREE.BufferAttribute(spPos,3));
 const spMat=new THREE.PointsMaterial({color:LV[levelIdx].kc,size:.18*sc,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
 const sparks=new THREE.Points(spGeo,spMat);boxGroup.add(sparks);

 // solid collision box accurately matching scaled chest footprint
 const isTurned=Math.abs(Math.sin(yaw))>0.5;
 const hx=(isTurned?0.95:1.35)*sc, hz=(isTurned?1.35:0.95)*sc;
 box(x,z,hx,hz,1.9*sc);

 return{group:g,boxGroup,x,z,yaw,camOff,lid,padlock,shackle,lockBody,lockGlow,innerGlow,keyMesh,sparks,spMat,spPos,spN,by,sc};
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

const ALTAR_POS=[[-12,8],[0,10],[0,10]],GUARD_POS=[[15.0,-1.0],[14.2,5.0],[-17.0,10.0]];

function buildCipherAltar(levelIdx){
 const g=new THREE.Group();
 const [ax,az]=ALTAR_POS[levelIdx];
 g.position.set(ax,0,az);
 W.add(g);

 const baseMat=M([0x5e6858,0x2b3850,0x5a4832][levelIdx],{roughness:.8});
 const goldMat=M([0x9fa875,0x44c4ff,0xd4a537][levelIdx],{metalness:.85,roughness:.2,emissive:[0x223311,0x0a2a44,0x443311][levelIdx]});
 const runeColor=[0x70ff88,0x44d4ff,0xffbb33][levelIdx];
 const runeMat=new THREE.MeshStandardMaterial({color:runeColor,emissive:runeColor,emissiveIntensity:1.2,metalness:.4,roughness:.2});

 const add=(geo,mat,px,py,pz,rx=0,ry=0,rz=0)=>{
  const m=new THREE.Mesh(geo,mat);
  m.position.set(px,py,pz);m.rotation.set(rx,ry,rz);
  m.castShadow=true;m.receiveShadow=true;
  g.add(m);return m;
 };

 // Octagonal tiered stone dais
 add(new THREE.CylinderGeometry(2.4,2.7,.35,8),baseMat,0,.175,0);
 add(new THREE.CylinderGeometry(1.9,2.2,.35,8),baseMat,0,.45,0);
 add(new THREE.CylinderGeometry(1.4,1.7,.3,8),baseMat,0,.75,0);

 // Central carved cipher pillar
 add(new THREE.CylinderGeometry(.55,.65,1.3,8),baseMat,0,1.55,0);
 add(new THREE.CylinderGeometry(.7,.55,.25,8),goldMat,0,2.3,0);

 // Rotating glyph ring floating around pillar
 const ring=add(new THREE.TorusGeometry(.95,.08,8,24),goldMat,0,1.8,0,Math.PI/2,0,0);

 // Floating rotating polyhedron cipher core
 const polyGeo=[new THREE.OctahedronGeometry(.42,0),new THREE.IcosahedronGeometry(.42,0),new THREE.DodecahedronGeometry(.42,0)][levelIdx];
 const poly=add(polyGeo,runeMat,0,2.75,0);

 // 4 perimeter focus rune obelisks on dais corners
 const obeliskMat=M([0x525c4d,0x222e44,0x4c3c28][levelIdx]);
 for(let k=0;k<4;k++){
  const a=k*Math.PI/2+Math.PI/4;
  const ox=Math.cos(a)*1.6,oz=Math.sin(a)*1.6;
  add(new THREE.BoxGeometry(.32,.9,.32),obeliskMat,ox,.85,oz);
  const gem=add(new THREE.OctahedronGeometry(.12,0),runeMat,ox,1.4,oz);
  ANI.push((t)=>{gem.rotation.y=t*1.5;gem.position.y=1.4+Math.sin(t*3+k)*.06});
 }

 const light=new THREE.PointLight(runeColor,1.4,10);
 light.position.set(0,2.8,0);
 g.add(light);

 circ(ax,az,1.4,3.2);

 ANI.push((t,dt)=>{
  ring.rotation.z+=dt*.8;
  poly.rotation.y+=dt*1.2;
  poly.rotation.x=Math.sin(t*1.5)*.25;
  poly.position.y=2.75+Math.sin(t*2.5)*.12;
  if(G.altarSolved){
   light.intensity=2.4+Math.sin(t*4)*.5;
   poly.material.emissiveIntensity=1.8+Math.sin(t*4)*.4;
  }
 });

 return{group:g,ring,poly,light,x:ax,z:az};
}

function buildGuardian(levelIdx){
 const g=new THREE.Group();
 const [gx,gz]=GUARD_POS[levelIdx];
 g.position.set(gx,0,gz);
 W.add(g);

 const animParts=[];
 let col,coreLight;
 let armL,armR,halberd,torso,head,body,crown,shards;

 if(levelIdx===0){
  // LEVEL 1: Ancient Forest Stone Guardian
  g.rotation.y=-Math.PI*.65;
  const rockMat=M(0x525c4e,{roughness:.9});
  const darkRockMat=M(0x3a4237,{roughness:.95});
  const runeMat=new THREE.MeshStandardMaterial({color:0x44ff88,emissive:0x33ee66,emissiveIntensity:1.5,roughness:.2});

  const mk=(geo,mat,px,py,pz,rx=0,ry=0,rz=0,p=g)=>{
   const m=new THREE.Mesh(geo,mat);
   m.position.set(px,py,pz);m.rotation.set(rx,ry,rz);
   m.castShadow=true;m.receiveShadow=true;
   p.add(m);return m;
  };

  // Base stone pedestal
  mk(new THREE.CylinderGeometry(1.3,1.6,.4,8),darkRockMat,0,.2,0);

  // Guardian Torso (Massive boulder structure)
  torso=new THREE.Group();torso.position.set(0,1.8,0);g.add(torso);
  mk(new THREE.DodecahedronGeometry(.95,0),rockMat,0,0,0,.3,.2,0,torso);
  mk(new THREE.BoxGeometry(1.6,.45,.7),darkRockMat,0,.55,0,0,0,0,torso);

  // Glowing rune chest core
  mk(new THREE.OctahedronGeometry(.28,0),runeMat,0,0,.65,0,0,0,torso);

  // Floating Head
  head=new THREE.Group();head.position.set(0,2.9,0);g.add(head);
  mk(new THREE.BoxGeometry(.7,.8,.7),rockMat,0,0,0,0,0,0,head);
  mk(new THREE.BoxGeometry(.18,.08,.1),runeMat,-.16,.1,.34,0,0,0,head);
  mk(new THREE.BoxGeometry(.18,.08,.1),runeMat,.16,.1,.34,0,0,0,head);

  // Heavy stone arms
  armL=mk(new THREE.BoxGeometry(.45,1.3,.45),rockMat,-1.05,1.4,.1);
  armR=mk(new THREE.BoxGeometry(.45,1.3,.45),rockMat,1.05,1.4,.1);

  // Orbiting rune stones
  const runes=[];
  for(let k=0;k<3;k++){
   runes.push(mk(new THREE.DodecahedronGeometry(.22,0),runeMat,0,0,0));
  }

  coreLight=new THREE.PointLight(0x44ff88,1.4,8);
  coreLight.position.set(0,2.2,.8);
  g.add(coreLight);

  col=circ(gx,gz,1.6,5);

  animParts.push((t,dt)=>{
   if(G.guardianDefeated){
    torso.position.y=Math.max(.7,torso.position.y-dt*.8);
    head.position.y=Math.max(1.3,head.position.y-dt*.9);
    coreLight.intensity=Math.max(0,coreLight.intensity-dt*2);
    runeMat.emissiveIntensity=Math.max(.1,runeMat.emissiveIntensity-dt*2);
    return;
   }
   torso.position.y=1.8+Math.sin(t*1.8)*.08;
   head.position.y=2.9+Math.sin(t*2.2)*.06;
   head.rotation.y=Math.sin(t*.9)*.2;
   if(G.guardian&&G.guardian.state!=='attack'){
    armL.rotation.x=Math.sin(t*1.5)*.15;
    armR.rotation.x=-Math.sin(t*1.5)*.15;
   }
   for(let k=0;k<3;k++){
    const a=t*1.8+k*(Math.PI*2/3);
    runes[k].position.set(Math.cos(a)*1.7,2.0+Math.sin(t*2+k)*.35,Math.sin(a)*1.7);
    runes[k].rotation.y=t*2;
   }
   coreLight.intensity=1.4+Math.sin(t*3)*.3;
  });

 }else if(levelIdx===1){
  // LEVEL 2: Glowing Crystal Sentinel
  g.rotation.y=-Math.PI*.5;
  const crystalMat=M(0x39a7ff,{emissive:0x2288ff,emissiveIntensity:1.1,metalness:.6,roughness:.15});
  const darkCrystalMat=M(0x192a54,{metalness:.8,roughness:.3});
  const coreMat=new THREE.MeshStandardMaterial({color:0x9a5cff,emissive:0xaa44ff,emissiveIntensity:1.6,metalness:.4,roughness:.1});

  const mk=(geo,mat,px,py,pz,rx=0,ry=0,rz=0,p=g)=>{
   const m=new THREE.Mesh(geo,mat);
   m.position.set(px,py,pz);m.rotation.set(rx,ry,rz);
   m.castShadow=true;m.receiveShadow=true;
   p.add(m);return m;
  };

  // Dais base
  mk(new THREE.CylinderGeometry(1.2,1.5,.3,6),darkCrystalMat,0,.15,0);

  // Floating crystalline spire body
  body=new THREE.Group();body.position.set(0,2.2,0);g.add(body);
  mk(new THREE.ConeGeometry(.7,2.2,6),crystalMat,0,.4,0,0,0,0,body);
  mk(new THREE.ConeGeometry(.65,1.6,6),crystalMat,0,-.6,0,Math.PI,0,0,body);

  // Glowing heart core
  const heart=mk(new THREE.OctahedronGeometry(.38,0),coreMat,0,.2,0,0,0,0,body);

  // Floating crystal crown
  crown=new THREE.Group();crown.position.set(0,3.6,0);g.add(crown);
  for(let k=0;k<5;k++){
   const a=k*Math.PI*2/5;
   mk(new THREE.ConeGeometry(.14,.7,5),crystalMat,Math.cos(a)*.45,0,Math.sin(a)*.45,.3,-a,0,crown);
  }

  // Floating orbiting crystal blade shards
  shards=[];
  for(let k=0;k<4;k++){
   const sh=mk(new THREE.ConeGeometry(.18,1.1,4),coreMat,0,0,0);
   sh.rotation.x=Math.PI/2;
   shards.push(sh);
  }

  coreLight=new THREE.PointLight(0x55ccff,1.8,10);
  coreLight.position.set(0,2.5,0);
  g.add(coreLight);

  col=circ(gx,gz,1.6,6);

  animParts.push((t,dt)=>{
   if(G.guardianDefeated){
    body.position.y=Math.max(.6,body.position.y-dt*.9);
    crown.position.y=Math.max(1.1,crown.position.y-dt*1.1);
    coreLight.intensity=Math.max(0,coreLight.intensity-dt*2.5);
    crystalMat.emissiveIntensity=Math.max(.1,crystalMat.emissiveIntensity-dt*2);
    return;
   }
   body.position.y=2.2+Math.sin(t*2.2)*.15;
   if(G.guardian&&G.guardian.state!=='attack')body.rotation.y+=dt*.6;
   crown.position.y=3.6+Math.sin(t*2.2+.5)*.12;
   crown.rotation.y-=dt*.9;
   heart.rotation.x=t*1.5;
   heart.rotation.z=t*1.2;
   for(let k=0;k<4;k++){
    const a=-t*2.2+k*(Math.PI/2);
    shards[k].position.set(Math.cos(a)*1.8,2.2+Math.sin(t*3+k)*.4,Math.sin(a)*1.8);
    shards[k].rotation.y=a+Math.PI/2;
   }
   coreLight.intensity=1.8+Math.sin(t*3.5)*.4;
  });

 }else{
  // LEVEL 3: Imperial Titan Guardian
  g.rotation.y=Math.PI*.5;
  const goldMat=M(0xd4a537,{metalness:.88,roughness:.22,emissive:0x3a2806,emissiveIntensity:.4});
  const darkArmorMat=M(0x28231c,{metalness:.6,roughness:.4});
  const coreMat=new THREE.MeshStandardMaterial({color:0xffa033,emissive:0xff7711,emissiveIntensity:1.8,metalness:.4,roughness:.2});

  const mk=(geo,mat,px,py,pz,rx=0,ry=0,rz=0,p=g)=>{
   const m=new THREE.Mesh(geo,mat);
   m.position.set(px,py,pz);m.rotation.set(rx,ry,rz);
   m.castShadow=true;m.receiveShadow=true;
   p.add(m);return m;
  };

  // Dais base
  mk(new THREE.BoxGeometry(2.4,.3,2.4),darkArmorMat,0,.15,0);
  mk(new THREE.BoxGeometry(2.1,.2,2.1),goldMat,0,.35,0);

  // Titan lower legs
  mk(new THREE.BoxGeometry(.5,1.4,.6),darkArmorMat,-.55,1.0,0);
  mk(new THREE.BoxGeometry(.5,1.4,.6),darkArmorMat,.55,1.0,0);

  // Titan Torso & Chestplate
  torso=new THREE.Group();torso.position.set(0,2.6,0);g.add(torso);
  mk(new THREE.BoxGeometry(1.5,1.4,.9),darkArmorMat,0,0,0,0,0,0,torso);
  mk(new THREE.BoxGeometry(1.6,.7,1.0),goldMat,0,.35,0,0,0,0,torso);
  mk(new THREE.CylinderGeometry(.32,.32,.12,12),coreMat,0,.3,.52,Math.PI/2,0,0,torso);

  // Titan Head & Helm
  head=new THREE.Group();head.position.set(0,3.8,0);g.add(head);
  mk(new THREE.BoxGeometry(.7,.8,.7),darkArmorMat,0,0,0,0,0,0,head);
  mk(new THREE.ConeGeometry(.2,.6,4),goldMat,0,.65,0,0,0,0,head);
  mk(new THREE.BoxGeometry(.5,.12,.1),coreMat,0,.08,.36,0,0,0,head);

  // Heavy Pauldrons
  mk(new THREE.BoxGeometry(.75,.6,.8),goldMat,-1.15,.6,0,0,0,.25,torso);
  mk(new THREE.BoxGeometry(.75,.6,.8),goldMat,1.15,.6,0,0,0,-.25,torso);

  // Titan Arms
  armL=mk(new THREE.BoxGeometry(.45,1.6,.45),darkArmorMat,-1.15,2.2,0);
  armR=mk(new THREE.BoxGeometry(.45,1.6,.45),darkArmorMat,1.15,2.2,0);

  // Imperial Halberd in right hand
  halberd=new THREE.Group();halberd.position.set(1.4,2.2,.4);g.add(halberd);
  mk(new THREE.CylinderGeometry(.06,.06,4.4,8),darkArmorMat,0,.6,0,0,0,0,halberd);
  mk(new THREE.BoxGeometry(.1,.9,.55),goldMat,0,2.6,.25,0,0,0,halberd);
  mk(new THREE.ConeGeometry(.12,.8,4),goldMat,0,3.1,0,0,0,0,halberd);

  // Floating Aureole / Halo Ring behind head
  const halo=mk(new THREE.TorusGeometry(.95,.07,8,24),goldMat,0,3.9,-.45);

  coreLight=new THREE.PointLight(0xffaa33,1.9,10);
  coreLight.position.set(0,3.0,.9);
  g.add(coreLight);

  col=box(gx,gz,1.2,1.8,7);

  animParts.push((t,dt)=>{
   if(G.guardianDefeated){
    torso.position.y=Math.max(1.3,torso.position.y-dt*.9);
    head.position.y=Math.max(2.1,head.position.y-dt*1.1);
    halberd.rotation.z=Math.min(1.2,halberd.rotation.z+dt*1.2);
    coreLight.intensity=Math.max(0,coreLight.intensity-dt*2.5);
    coreMat.emissiveIntensity=Math.max(.1,coreMat.emissiveIntensity-dt*2);
    return;
   }
   torso.position.y=2.6+Math.sin(t*1.6)*.06;
   head.rotation.y=Math.sin(t*.8)*.18;
   halo.rotation.z+=dt*.6;
   if(G.guardian&&G.guardian.state!=='attack'){
    armR.rotation.x=Math.sin(t*1.2)*.1;
    halberd.position.y=2.2+Math.sin(t*1.6)*.06;
   }
   coreLight.intensity=1.9+Math.sin(t*4)*.35;
  });
 }

 ANI.push((t,dt)=>{
  animParts.forEach(fn=>fn(t,dt));
 });

 return{
  group:g,col,coreLight,x:gx,z:gz,
  homeX:gx,homeZ:gz,levelIdx,
  state:'idle',
  speed:[2.2,2.5,2.8][levelIdx],
  attackRange:2.4,detectRange:11.0,
  attackCooldown:0,attackAnimTimer:0,attackHitDone:false,
  armL,armR,halberd,torso,head,body,crown,shards,
  defeated:false
 };
}

function updateGuardianAI(dt){
 const gd=G.guardian;
 if(!gd||gd.defeated||G.guardianDefeated||ST!=='play')return;

 const dist=Math.hypot(P.x-gd.group.position.x,P.z-gd.group.position.z);
 const distHome=Math.hypot(gd.group.position.x-gd.homeX,gd.group.position.z-gd.homeZ);

 if(gd.attackCooldown>0)gd.attackCooldown-=dt;

 if(gd.state==='idle'){
  if(dist<=gd.detectRange){
   gd.state='detect';
   gd.detectTimer=0.35;
   if(!G.guardianAlerted){
    G.guardianAlerted=true;
    sfx('guardianAlert');
    toast(`${LV[G.lv].n} Guardian awakens! Approach to accept its challenge.`,'warn');
   }
  }
 }else if(gd.state==='detect'){
  const targetYaw=Math.atan2(P.x-gd.group.position.x,P.z-gd.group.position.z);
  let dy=targetYaw-gd.group.rotation.y;
  dy=Math.atan2(Math.sin(dy),Math.cos(dy));
  gd.group.rotation.y+=dy*Math.min(1,dt*6);

  gd.detectTimer=(gd.detectTimer||0.35)-dt;
  if(gd.detectTimer<=0){
   gd.state='chase';
  }
 }else if(gd.state==='chase'){
  if(dist>24.0){
   // Return towards home position
   const toHomeYaw=Math.atan2(gd.homeX-gd.group.position.x,gd.homeZ-gd.group.position.z);
   let dy=toHomeYaw-gd.group.rotation.y;
   dy=Math.atan2(Math.sin(dy),Math.cos(dy));
   gd.group.rotation.y+=dy*Math.min(1,dt*4);

   const step=gd.speed*dt;
   gd.group.position.x+=Math.sin(toHomeYaw)*step;
   gd.group.position.z+=Math.cos(toHomeYaw)*step;
   if(distHome<1.5){
    gd.state='idle';
   }
  }else{
   // Turn to face player
   const targetYaw=Math.atan2(P.x-gd.group.position.x,P.z-gd.group.position.z);
   let dy=targetYaw-gd.group.rotation.y;
   dy=Math.atan2(Math.sin(dy),Math.cos(dy));
   gd.group.rotation.y+=dy*Math.min(1,dt*7);

   if(dist<=gd.attackRange&&gd.attackCooldown<=0){
    gd.state='attack';
    gd.attackAnimTimer=0.7;
    gd.attackHitDone=false;
   }else if(dist>gd.attackRange-0.3){
    const step=gd.speed*dt;
    gd.group.position.x+=Math.sin(targetYaw)*step;
    gd.group.position.z+=Math.cos(targetYaw)*step;
   }
  }

  gd.x=gd.group.position.x;
  gd.z=gd.group.position.z;
  if(gd.col){
   gd.col.x=gd.x;
   gd.col.z=gd.z;
  }
  if(G.guardianIt){
   G.guardianIt.x=gd.x;
   G.guardianIt.z=gd.z;
  }
 }else if(gd.state==='attack'){
  gd.attackAnimTimer-=dt;

  if(gd.levelIdx===0){
   if(gd.armL&&gd.armR){
    if(gd.attackAnimTimer>0.35){
     gd.armL.rotation.x=-2.2;gd.armR.rotation.x=-2.2;
    }else{
     gd.armL.rotation.x=1.2;gd.armR.rotation.x=1.2;
    }
   }
  }else if(gd.levelIdx===1){
   if(gd.body){
    gd.body.rotation.y+=dt*18;
   }
  }else{
   if(gd.halberd){
    gd.halberd.rotation.z=-0.8+Math.sin((0.7-gd.attackAnimTimer)/0.7*Math.PI)*2.2;
   }
  }

  if(gd.attackAnimTimer<=0.35&&!gd.attackHitDone){
   gd.attackHitDone=true;
   if(dist<=gd.attackRange+0.6){
    damagePlayer(25,`${LV[G.lv].n} Guardian strike`);
    const kx=Math.sin(gd.group.rotation.y)*1.8;
    const kz=Math.cos(gd.group.rotation.y)*1.8;
    P.x+=kx;P.z+=kz;
   }
  }

  if(gd.attackAnimTimer<=0){
   gd.state='chase';
   gd.attackCooldown=2.2;
   if(gd.armL&&gd.armR){gd.armL.rotation.x=0;gd.armR.rotation.x=0}
  }
 }
}

/* ===== level building ===== */
let r=Math.random;
const KP=[];const free=(x,z,m=5)=>Math.abs(x)>4&&Math.abs(z+10)>3&&KP.every(p=>Math.hypot(x-p[0],z-p[1])>m);
const INS=[[[-15,8]],[[-17,6],[17,-3]],[[-20,-2],[20,-2],[0,16]]];
const CHEST_SPAWNS=[
 [
  {pos:[19.0,-2.4],yaw:-Math.PI*0.45,camOff:new THREE.Vector3(-1.8,1.6,1.4),range:2.8},
  {pos:[14.5,-6.5],yaw:-Math.PI*0.65,camOff:new THREE.Vector3(-1.6,1.5,1.3),range:2.8},
  {pos:[-12.5,3.5],yaw:Math.PI*0.35,camOff:new THREE.Vector3(1.7,1.5,1.2),range:2.8}
 ],
 [
  {pos:[22.0,3.4],yaw:-Math.PI*0.55,camOff:new THREE.Vector3(-1.5,1.4,1.2),range:2.4},
  {pos:[19.8,8.2],yaw:-Math.PI*0.75,camOff:new THREE.Vector3(-1.4,1.3,1.1),range:2.4},
  {pos:[-14.5,-5.5],yaw:Math.PI*0.45,camOff:new THREE.Vector3(1.5,1.4,1.1),range:2.4}
 ],
 [
  {pos:[-23.6,14.5],yaw:Math.PI*0.35,camOff:new THREE.Vector3(1.5,1.3,0.9),range:2.1},
  {pos:[-23.6,5.5],yaw:Math.PI*0.25,camOff:new THREE.Vector3(1.4,1.3,0.9),range:2.1},
  {pos:[-14.5,-2.5],yaw:Math.PI*0.55,camOff:new THREE.Vector3(1.4,1.2,0.9),range:2.1}
 ]
];
const MP=[[19.0,-2.4],[22.0,3.4],[-23.6,14.5]];

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
 INS[i].forEach(p=>KP.push(p));KP.push(MP[i],[0,24],[0,-10],[0,-15],[0,-20],[0,-22],ALTAR_POS[i],GUARD_POS[i]);
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
   if(nw){
    sfx('pickup');
    tm.material.emissiveIntensity=1.4;
    if(G.insc.size===L.fs.length)q('insc');
    hudUpd();
   }
  });
 });

 // Central Cipher Altar (decrypt composition to reveal treasure coordinates)
 G.altar=buildCipherAltar(i);
 G.altarPos=[G.altar.x,G.altar.z];
 G.altarLight=G.altar.light;
 const altarLabels=[
  'Ancient Cipher Altar — Decrypt Forest Coordinates',
  'Crystal Cipher Altar — Decrypt Cavern Coordinates',
  'Vault Cipher Altar — Decrypt Vault Coordinates'
 ];
 const altarIt=inter(G.altar.x,G.altar.z,altarLabels[i],()=>{
  if(G.altarSolved){
   toast('The Cipher Altar has already been decrypted. Follow the revealed path!','ok');
   return;
  }
  openPuz('altar');
 },true,{prompt:'Press E to Decrypt',range:3.6,subCls:'ok'});
 G.altarIt=altarIt;

 // Enemy Guardian (blocks path to treasure chest)
 G.guardian=buildGuardian(i);
 G.guardianPos=[G.guardian.x,G.guardian.z];
 const guardianLabels=[
  'Forest Stone Guardian — Mathematical Trial',
  'Crystal Sentinel — Mathematical Trial',
  'Imperial Titan Guardian — Mathematical Trial'
 ];
 const guardianIt=inter(G.guardian.x,G.guardian.z,guardianLabels[i],()=>{
  if(G.guardianDefeated){
   toast('The Guardian is deactivated. The way to the chest is clear!','ok');
   return;
  }
  openPuz('guardian');
 },true,{prompt:'Press E to Challenge',range:3.8,subCls:'warn'});
 G.guardianIt=guardianIt;

 // wooden treasure chest (hidden in progressive secret locations)
 const spawnList=CHEST_SPAWNS[i];
 const spawnIdx=(SV.chestLocations&&SV.chestLocations[i]!==undefined)?(SV.chestLocations[i]%spawnList.length):0;
 const spawnData=spawnList[spawnIdx];
 const [mx,mz]=spawnData.pos;
 G.chestSpawnIdx=spawnIdx;
 G.chestPos=[mx,mz];
 MP[i]=[mx,mz];
 CHEST=buildTreasureChest(mx,mz,i,spawnData.yaw,spawnData.camOff);
 const chestLabels=[
  'Hidden Forest Chest — Locked (Solve Puzzle)',
  'Hidden Crystal Chest — Locked (Solve Puzzle)',
  'Secret Vault Chest — Locked (Solve Puzzle)'
 ];
 const chestIt=inter(mx,mz,chestLabels[i],()=>{
  if(!G.altarSolved){
   sfx('locked');
   toast('The chest is locked by an ancient cipher. Decrypt the Cipher Altar first!','warn');
   return;
  }
  if(!G.guardianDefeated){
   sfx('locked');
   toast('The Guardian bars your access to the chest! Pass the Guardian’s trial first!','warn');
   return;
  }
  if(G.chestState==='opened'){toast(`Chest already opened — ${L.kn} already obtained.`);return}
  if(G.chestState==='opening')return;
  openPuz('chest');
 },true,{prompt:'Press E to Interact',range:spawnData.range,subCls:'warn'});
 G.chestIt=chestIt;

 // chest subtle ambient pulse while locked
 ANI.push((t)=>{
  if(!CHEST)return;
  if(G.chestState==='locked'){
   CHEST.lockGlow.intensity=(.4+Math.sin(t*3)*.15)*(CHEST.sc||1);
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
 camDist=3.8;
 camLookTarget.set(0,1.4,24);
 const cp=Math.cos(pitch);
 cam.position.set(Math.sin(yaw)*cp*camDist,1.4+Math.sin(pitch)*camDist,24+Math.cos(yaw)*cp*camDist);
 cam.lookAt(camLookTarget);
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
 const alcLight=new THREE.PointLight(0xffdf80,.55,5.5);alcLight.position.set(17.6,1.8,-2.0);W.add(alcLight);
 // Fireflies floating around the alcove
 pts(24,4,0xd4ff60,.14,.4,2.8);

 // Natural concealment: weathered fallen trunk, mossy boulders & wild ferns partially screening the chest
 const log=mesh(new THREE.CylinderGeometry(.2,.26,3.4,7),M(0x4a321e),18.0,.28,-3.4);log.rotation.set(.3,.8,1.35);circ(18.0,-3.4,.4,1.4);
 mesh(new THREE.DodecahedronGeometry(.65,0),mossRock,20.2,.4,-1.6);circ(20.2,-1.6,.55,1.5);
 mesh(new THREE.DodecahedronGeometry(.5,0),mossRock,18.1,.3,-3.6);
 const f1=mesh(new THREE.ConeGeometry(.4,.8,6),M(0x356e30),19.8,.35,-3.0,false);f1.rotation.set(-.3,.5,.2);
 const f2=mesh(new THREE.ConeGeometry(.35,.7,6),M(0x2d5c28),18.4,.3,-1.7,false);f2.rotation.set(.2,-.4,-.1);
 mesh(new THREE.BoxGeometry(1.6,.08,1.2),mossRock,19.0,.04,-2.4,false);
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
 const grottoLight=new THREE.PointLight(0x44c0ff,.85,7.0);grottoLight.position.set(20.5,2.5,5.0);W.add(grottoLight);
 pts(25,4,0x7be8ff,.13,.4,3.5);

 // Natural concealment: staggered crystal spires screening the southeastern recess where chest is tucked
 const spA=mesh(new THREE.ConeGeometry(.5,3.6,6),crMat1,20.4,1.8,3.9);circ(20.4,3.9,.55,4);
 const spB=mesh(new THREE.ConeGeometry(.45,2.6,6),rockWallMat,20.8,1.3,2.3);circ(20.8,2.3,.5,3);
 const spC=mesh(new THREE.ConeGeometry(.35,2.0,5),crMat2,21.3,1.0,4.4);
 // Subtle crystalline geode vein leading to the recess
 [[18.6,5.0],[19.6,4.5],[20.6,4.0],[21.4,3.6]].forEach(([vx,vz],vi)=>{
  const gd=mesh(new THREE.DodecahedronGeometry(.13,0),vi%2?crMat1:crMat2,vx,.07,vz,false);gd.rotation.set(.2,.4,.1);
 });
 mesh(new THREE.BoxGeometry(1.3,.1,1.0),M(0x1d2942),22.0,.05,3.4,false);
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

 // Grand ceremonial plinth in chamber center (visual misdirection / decoy)
 mesh(new THREE.CylinderGeometry(1.3,1.6,.35,8),goldTrimMat,-22,.18,10);
 mesh(new THREE.CylinderGeometry(.7,.9,1.1,8),wallMat,-22,.9,10);
 mesh(new THREE.CylinderGeometry(1.0,.7,.25,8),goldTrimMat,-22,1.55,10);
 const seal=mesh(new THREE.OctahedronGeometry(.4,0),M(0xffe280,{metalness:.9,roughness:.15,emissive:0xffbb33,emissiveIntensity:.8}),-22,2.1,10);
 circ(-22,10,1.3,2.5);
 ANI.push(t=>{seal.rotation.y=t*.8;seal.position.y=2.1+Math.sin(t*2)*.08});

 // Ancient golden urns
 [[-25,4],[-25,16],[-19,4],[-19,16]].forEach(([ux,uz])=>{
  mesh(new THREE.CylinderGeometry(.35,.5,1.2,8),goldTrimMat,ux,.6,uz);
  mesh(new THREE.SphereGeometry(.45,8,8),goldTrimMat,ux,1.2,uz);
  circ(ux,uz,.55,1.8);
 });

 // Natural concealment: northern temple screen wall hiding the petite vault chest
 mesh(new THREE.BoxGeometry(.4,4.5,2.8),wallMat,-20.6,2.25,14.5);
 mesh(new THREE.BoxGeometry(.5,.35,3.0),goldTrimMat,-20.6,4.6,14.5);
 box(-20.6,14.5,.25,1.5,4.5);
 // Flanking ceremonial mini-urns framing the narrow corridor into the alcove
 mesh(new THREE.CylinderGeometry(.22,.3,1.0,8),goldTrimMat,-21.4,.5,12.8);circ(-21.4,12.8,.35,1.2);
 mesh(new THREE.CylinderGeometry(.22,.3,1.0,8),goldTrimMat,-21.4,.5,16.2);circ(-21.4,16.2,.35,1.2);
 // Subtle chevron inlay leading to the hidden niche
 mesh(new THREE.BoxGeometry(1.6,.04,.25),goldTrimMat,-22.4,.04,14.5,false);
 mesh(new THREE.BoxGeometry(1.2,.08,.9),goldTrimMat,-23.6,.04,14.5,false);

 // Sacred treasury ambient illumination (subtle, non-leaking)
 const vaultLight=new THREE.PointLight(0xffd24c,.95,8.0);vaultLight.position.set(-22,3.0,10);W.add(vaultLight);
 pts(20,3.5,0xffd24c,.11,.5,3.0);
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
  if(!SV.puzzles||!SV.puzzles[i]){
   SV.puzzles=SV.puzzles||{};
   SV.puzzles[i]={
    altar:genCompositionQuestion(i,'altar'),
    guardian:genCompositionQuestion(i,'guardian'),
    chest:genChestInverseQuestion(i===2?'g':'f',i)
   };
   save();
  }
  if(!SV.chestLocations||SV.chestLocations[i]===undefined){
   SV.chestLocations=SV.chestLocations||{};
   SV.chestLocations[i]=RI(0,2);
   save();
  }
  const pzSet=SV.puzzles[i];
  if(pzSet.guardian&&pzSet.guardian.fns){
   LV[i].fs=pzSet.guardian.fns.map(f=>F(f.n,f.a,f.b));
  }
  G={
   on:true,lv:i,q:{},insc:new Set(),keys:{},hasKey:false,chestState:'locked',doorState:'locked',solved:false,
   cine:0,ct:0,keyGranted:false,advancing:false,
   lives:3,hp:100,maxHp:100,invulnTimer:0,levelTimer:LV_TIMES[i],levelTimerElapsed:0,
   chestTimer:180,inChestChallenge:false,chestChallengeStarted:false,
   altarSolved:false,guardianDefeated:false,guardianAlerted:false,cp:{x:0,z:24,yaw:0}
  };
  pb.style.width='60%';await fr();
  build(i);pb.style.width='100%';await fr();
  updateHeartsHUD();
 updateHealthHUD();
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
 if(ST==='sol'&&(c==='Enter'||c==='Space')){e.preventDefault();claimTreasure();return}
 if(['inv','quest'].includes(ST)&&(c==='KeyI'||c==='KeyQ')){resume();return}
 if(ST!=='play')return;
 if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','Space'].includes(c)){K[c]=1;e.preventDefault()}
 else if(c==='KeyE'&&!e.repeat)tryInteract();
 else if(c==='KeyI')ui('inv');
 else if(c==='KeyQ')ui('quest');
});
addEventListener('keyup',e=>{delete K[e.code]});
addEventListener('blur',()=>{K={};drag=false});
document.addEventListener('contextmenu',e=>{if(cv&&e.target===cv)e.preventDefault()});
document.addEventListener('pointerlockchange',()=>{
 if(cv&&document.pointerLockElement===cv){
  skipMouseMove=2;
 }else{
  drag=false;
  if(ST==='play'){
   lockT=performance.now();
   pause();
  }
 }
});
addEventListener('mousedown',e=>{
 if(ST==='play'&&cv&&e.target===cv){
  if(document.pointerLockElement!==cv){
   drag=true;
   try{cv.requestPointerLock()}catch(x){}
  }
 }
});
addEventListener('mouseup',()=>drag=false);
addEventListener('mousemove',e=>{
 if(ST!=='play'||G.busy||G.cine)return;
 if(cv&&document.pointerLockElement!==cv&&!drag)return;
 if(skipMouseMove>0){skipMouseMove--;return}

 const dx=Math.max(-80,Math.min(80,e.movementX||0));
 const dy=Math.max(-80,Math.min(80,e.movementY||0));

 yaw-=dx*mouseSens;
 pitch=Math.max(-0.15,Math.min(1.15,pitch+dy*mouseSens));
});

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
 if(G.invulnTimer>0){
  PM.visible=Math.floor(t*18)%2===0;
 }else{
  PM.visible=true;
 }
}

function animChestCine(dt){
 G.ct+=dt;const ct=G.ct;
 const sc=CHEST.sc||1;
 // 0.0 -> 0.45: Padlock unlocks and drops away
 if(ct<.45){
  const u=ct/.45;
  CHEST.shackle.position.y=.13+u*.16;
  CHEST.padlock.rotation.z=Math.sin(u*14)*.15;
  CHEST.padlock.position.y=CHEST.by+.72-u*.18;
  CHEST.lockGlow.intensity=(1.0+u*.8)*sc;
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
  CHEST.innerGlow.intensity=2.2*ease*sc;
  CHEST.spMat.opacity=lu<1?.95:Math.max(0,.95-(ct-1.15)*.6);
  for(let i=0;i<CHEST.spN;i++){
   CHEST.spPos[i*3+1]+=dt*(.6+(i%3)*.3);
   CHEST.spPos[i*3]+=Math.sin(ct*4+i)*dt*.2;
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
   CHEST.keyMesh.position.set(0,(CHEST.by+.38)*sc+ke*1.45*sc,0);
   CHEST.keyMesh.scale.setScalar((.85+ke*.3)*sc);
  }else{
   // 1.75 -> 2.35: Key swoops from chest toward player
   const fu=Math.min(1,(ct-1.75)/.6);
   const fe=fu*fu;
   const dx=P.x-CHEST.x,dz=P.z-CHEST.z,dy=1.45;
   CHEST.keyMesh.position.set(dx*fe,(CHEST.by+1.83)*sc+(dy-(CHEST.by+1.83)*sc)*fe,dz*fe);
   CHEST.keyMesh.scale.setScalar(Math.max(.12,1.15*sc*(1-fe*.75)));
  }
 }
 if(ct>=2.35){finishKeyPickup()}
}

function tick(){
 requestAnimationFrame(tick);if(!renderer)return;
 const dt=Math.min(CL.getDelta(),.05),t=CL.elapsedTime;
 if(G.on){
  if(G.invulnTimer>0)G.invulnTimer=Math.max(0,G.invulnTimer-dt);

  if(ST==='play'||ST==='puz'||G.cine){
   SV.run.t+=dt;
   G.levelTimerElapsed=(G.levelTimerElapsed||0)+dt;
   if(ST==='play'||ST==='puz'){
    G.levelTimer-=dt;
    if(G.levelTimer<=0){
     G.levelTimer=0;
     damagePlayer(25,'Level exploration timer expired!');
     if(G.hp>0){
      G.levelTimer=LV_TIMES[G.lv];
      P.x=G.cp.x;P.z=G.cp.z;P.y=0;yaw=G.cp.yaw;
      toast('Time expired! Respawned at checkpoint (-25 HP).','warn');
     }
    }
   }
  }

  // Chest Challenge 3-minute timer countdown (exact 03:00)
  if(G.inChestChallenge && G.chestChallengeStarted && ST==='puz'){
   G.chestTimer-=dt;
   const pt=$('pz-timer');
   if(pt){
    pt.textContent='⏳ '+formatTime(G.chestTimer);
    pt.classList.toggle('urgent',G.chestTimer<30);
   }
   if(G.chestTimer<=0){
    G.chestTimer=180;
    G.inChestChallenge=false;
    G.chestChallengeStarted=false;
    deductLife('Waktu 03:00 habis! Gembok peti terkunci kembali.');
    if(G.lives>0){
     drawPuz('Waktu 03:00 habis! Satu nyawa berkurang. Silakan tekan tombol Mulai Tantangan untuk mencoba kembali dengan timer baru 03:00.','no');
    }
   }
  }

  // Update HUD timer display
  const ht=$('hud-timer');
  if(ht){
   ht.textContent='⏱️ '+formatTime(G.levelTimer);
   ht.classList.toggle('urgent',G.levelTimer<60);
  }

  // Check travel proximity quest
  if(G.altarSolved&&!G.q.travel&&G.guardianPos){
   if(Math.hypot(P.x-G.guardianPos[0],P.z-G.guardianPos[1])<7.5){
    q('travel');
   }
  }

  if(ST==='play'&&!G.cine&&!G.advancing){
   updateGuardianAI(dt);
   move(dt);
  }
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

  // Subtle ambient proximity chime
  if(CHEST&&G.chestState==='locked'&&ST==='play'){
   const cd=Math.hypot(P.x-CHEST.x,P.z-CHEST.z);
   const discRange=[9.0,8.0,7.0][G.lv];
   if(cd<discRange+3.5){
    if(!G.lastChimeT||t-G.lastChimeT>5.5){
     G.lastChimeT=t;
     sfx('nearChime'+G.lv);
    }
   }
  }

  let tg=new THREE.Vector3(P.x,P.y+1.4,P.z),want;
  if(G.cine&&CHEST){
   tg.set(CHEST.x,1.0*(CHEST.sc||1),CHEST.z);
   const co=CHEST.camOff||new THREE.Vector3(2.0,2.2,2.4);
   want=new THREE.Vector3(CHEST.x+co.x,co.y,CHEST.z+co.z);
   camDist=3.8;
  }else{
   const baseDist=3.8;
   const cp=Math.cos(pitch);
   const dirX=Math.sin(yaw)*cp;
   const dirY=Math.sin(pitch);
   const dirZ=Math.cos(yaw)*cp;

   // Fine-step camera collision sweep against boundary walls, ground, and environment colliders
   let clearDist=baseDist;
   const camRadius=0.28;
   for(let s=0.9;s<=baseDist;s+=0.06){
    const cx=tg.x+dirX*s;
    const cy=tg.y+dirY*s;
    const cz=tg.z+dirZ*s;

    if(Math.abs(cx)>28.5-camRadius||Math.abs(cz)>28.5-camRadius||cy<0.45){
     clearDist=Math.max(0.9,s-0.12);
     break;
    }

    let collides=false;
    for(let i=0;i<COL.length;i++){
     const c=COL[i];
     if(c.off)continue;
     if(cy>=c.h||cy<-0.2)continue;
     if(c.t==='c'){
      if(Math.hypot(cx-c.x,cz-c.z)<c.r+camRadius){collides=true;break}
     }else{
      if(Math.abs(cx-c.x)<c.hx+camRadius&&Math.abs(cz-c.z)<c.hz+camRadius){collides=true;break}
     }
    }
    if(collides){
     clearDist=Math.max(0.9,s-0.12);
     break;
    }
   }

   // Smooth collision zoom:
   // Zooms in quickly on obstacle to avoid clipping, but smoothly (rate 22).
   // Recovers smoothly back to full distance when obstacle clears (rate 7).
   const zoomSpeed=clearDist<camDist?22:7;
   camDist+=(clearDist-camDist)*(1-Math.exp(-zoomSpeed*dt));

   want=new THREE.Vector3(
    tg.x+dirX*camDist,
    Math.max(0.45,tg.y+dirY*camDist),
    tg.z+dirZ*camDist
   );
  }

  cam.position.lerp(want,1-Math.exp(-(G.cine?4:22)*dt));
  camLookTarget.lerp(tg,1-Math.exp(-(G.cine?4:18)*dt));
  cam.lookAt(camLookTarget);

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
