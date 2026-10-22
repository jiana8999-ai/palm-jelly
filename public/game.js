import {audio} from './audio.js';
const $=id=>document.getElementById(id),ctx=$('ocean').getContext('2d'),sprite=new Image();sprite.src='assets/jelly-sprite.webp';const oceanPlate=new Image();oceanPlate.src='assets/ocean-plate.webp';
let mode='home',paused=false,tracking=false,active=0,hold=0,handHold=0,last=0,t=0,stop=()=>{},start=()=>{},jelly={x:365,y:490},target={...jelly},particles=[];
const goals=[{x:600,y:308,r:138},{x:978,y:600,r:94},{x:1348,y:319,r:84}],practiceGoal={x:1117,y:408,r:115};
function scale(){
 const sx=innerWidth/1672,sy=innerHeight/941;
 $('stage').style.transform=`scale(${sx},${sy})`;
 const dpr=Math.min(globalThis.devicePixelRatio||1,3),canvas=$('ocean');
 canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);
 ctx.setTransform(canvas.width/1672,0,0,canvas.height/941,0,0);
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
}addEventListener('resize',scale);scale();
function hit(id,label,x,y,w,h,fn){const b=document.createElement('button');b.id=id;b.className='hit';b.setAttribute('aria-label',label);Object.assign(b.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});b.onclick=fn;$('ui').append(b);return b}
function copy(html,x,y,w,cls=''){const e=document.createElement('div');e.className='copy '+cls;e.innerHTML=html;Object.assign(e.style,{left:x+'px',top:y+'px',width:w+'px'});$('ui').append(e);return e}
function patch(file,x,y,w,h){const e=document.createElement('div');e.className='patch';Object.assign(e.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px',backgroundImage:`url(assets/storyboards/${file}.webp)`,backgroundPosition:`-${x}px -${y}px`});$('ui').append(e)}
function status(s){$('status').textContent=s;$('status').classList.toggle('hidden',!s)}
function help(){if(['playing','practice'].includes(mode))paused=true;$('help-dialog').showModal()}
function show(m){mode=m;document.body.dataset.screen=m;$('ui').replaceChildren();status('');$('art').src=['playing','practice'].includes(m)?'assets/ocean-plate.webp':`assets/storyboards/${m}.webp`;
if(m==='home'){hit('start','Start / 开始',659,800,356,77,prepare);hit('help','How to play',1473,37,157,49,help)}
if(m==='camera')hit('home','Home / 返回首页',1564,30,75,75,home);
if(m==='hand')hit('home','Home / 返回首页',25,22,260,65,home);
if(m==='won'){hit('again','Play Again / 再玩一次',494,755,365,100,()=>{prepare();start()});hit('back','Home / 返回首页',879,755,296,100,home)}
if(['practice','playing'].includes(m)){
patch(m,20,15,m==='practice'?290:225,85);
if(m==='practice'){patch(m,520,20,630,74);patch(m,440,115,815,138);patch(m,1265,306,205,75);patch(m,968,543,340,82);patch(m,636,806,405,80);patch(m,29,592,312,279)}
else {copy('<span id="progress">0 / 3</span>　<span id="dots">○ ○ ○</span>',270,40,220,'ring-count');hit('pause','Pause / 暂停',1510,30,58,58,()=>pause(true)).textContent='Ⅱ';hit('help','How to play',1588,30,58,58,help).textContent='?';copy('Follow the glowing ring / 跟随发光的光圈',595,839,482,'cream');copy('<span id="track-label">● Hand detected / 已识别</span>',30,827,280,'cream')}
}
}
function home(){stop();paused=false;$('pause-panel').classList.add('hidden');show('home')}
function prepare(){stop();tracking=false;handHold=0;hold=0;paused=false;$('camera-error').classList.add('hidden');$('enable-camera').disabled=false;$('enable-camera').innerHTML='';show('camera')}
function practice(){active=0;hold=0;jelly={x:700,y:540};target={...jelly};show('practice');audio.cue('found')}
function play(){active=0;hold=0;jelly={x:365,y:490};target={...jelly};show('playing');audio.cue('start')}
function pause(v){paused=v;hold=0;$('pause-panel').classList.toggle('hidden',!v);audio.setMotion(0)}
function drawRing(r,i){ctx.save();ctx.strokeStyle=i<active?'#fff3a6':i===active?'#fff9bc':'#dcfcff';ctx.lineWidth=i===active?16:11;ctx.shadowColor='#fff8c0';ctx.shadowBlur=i===active?8:0;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;if(mode==='playing'){ctx.fillStyle=ctx.strokeStyle;ctx.font='bold 38px Trebuchet MS';ctx.fillText(i<active?'✓':`0${i+1}`,r.x-r.r,r.y-r.r-15)}if(i===active&&hold){ctx.strokeStyle='#9c8bff';ctx.lineWidth=7;ctx.beginPath();ctx.arc(r.x,r.y,r.r+15,-Math.PI/2,-Math.PI/2+hold/.7*Math.PI*2);ctx.stroke()}ctx.restore()}
function drawJelly(){if(!sprite.complete||!sprite.naturalWidth)return;const size=mode==='practice'?220:170;ctx.save();ctx.translate(jelly.x,jelly.y);ctx.rotate(Math.sin(t*1.5)*.025);const h=size*1.05,sw=sprite.naturalWidth,sh=sprite.naturalHeight;for(let y=0;y<sh;y+=8){const f=y/sh,dx=f>.48?Math.sin(t*3+f*6)*(f-.48)*15:0;ctx.drawImage(sprite,0,y,sw,Math.min(8,sh-y),-size/2+dx,-h/2+y/sh*h,size,Math.min(8,sh-y)/sh*h+.4)}ctx.restore()}
function tick(ms){const dt=Math.min(.04,(ms-last)/1000)||0;last=ms;t+=dt;ctx.clearRect(0,0,1672,941);
if(mode==='hand'&&tracking){handHold+=dt;if(handHold>1.1)practice()}
if(['practice','playing'].includes(mode)){if(oceanPlate.complete&&oceanPlate.naturalWidth){for(let y=0;y<941;y+=8){const shift=Math.sin(t*.65+y*.012)*1.8;ctx.drawImage(oceanPlate,0,y/941*oceanPlate.naturalHeight,oceanPlate.naturalWidth,Math.min(8,941-y)/941*oceanPlate.naturalHeight,shift-2,y,1676,Math.min(8,941-y)+.2)}}let speed=0;if(tracking&&!paused){const prev={...jelly},b=1-Math.exp(-dt*6);jelly.x+=(target.x-jelly.x)*b;jelly.y+=(target.y-jelly.y)*b;speed=Math.hypot(jelly.x-prev.x,jelly.y-prev.y)/Math.max(dt,.001);const rs=mode==='practice'?[practiceGoal]:goals,r=rs[active];if(r){hold=Math.hypot(jelly.x-r.x,jelly.y-r.y)+(mode==='practice'?94:72)<=r.r?hold+dt:0;if(hold>=.7){active++;hold=0;audio.cue('ring',active-1);if(mode==='practice'){play()}else{if($('progress'))$('progress').textContent=`${active} / 3`;if($('dots'))$('dots').textContent='● '.repeat(active)+'○ '.repeat(3-active);if(active===3){stop();show('won');audio.cue('win')}}}}}audio.setMotion(Math.min(1,speed/500));if(['practice','playing'].includes(mode)){(mode==='practice'?[practiceGoal]:goals).forEach(drawRing);if(mode==='practice'&&!tracking){ctx.save();ctx.setLineDash([17,17]);ctx.strokeStyle='white';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(818,500);ctx.bezierCurveTo(880,465,925,414,979,410);ctx.stroke();ctx.restore()}drawJelly();if(speed>30&&Math.random()<dt*12)particles.push({x:jelly.x+(Math.random()-.5)*95,y:jelly.y+65,r:3+Math.random()*7,life:2})}}
else audio.setMotion(0);
if(Math.random()<dt*2)particles.push({x:150+Math.random()*1370,y:850,r:3+Math.random()*6,life:6});particles=particles.filter(p=>(p.life-=dt)>0);ctx.strokeStyle='#ffffffb0';ctx.lineWidth=2;for(const p of particles){p.y-=dt*35;ctx.beginPath();ctx.arc(p.x+Math.sin(t+p.y)*2,p.y,p.r,0,Math.PI*2);ctx.stroke()}requestAnimationFrame(tick)}
$('resume').onclick=()=>pause(false);$('return').onclick=home;$('close-help').onclick=()=>$('help-dialog').close();$('help-dialog').addEventListener('close',()=>{paused=false});document.addEventListener('visibilitychange',()=>{if(document.hidden){if(['playing','practice'].includes(mode))pause(true);audio.suspend()}else audio.resume()});addEventListener('pagehide',()=>stop());
// Preload and request playback immediately. Browsers may require the first gesture.
audio.loadMusic('assets/music.m4a',{start:0}).catch(()=>{});
for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>audio.playMusic(),{passive:true});
show('home');requestAnimationFrame(tick);
export const game={status,home,prepare,handReady(){show('hand');handHold=0;tracking=false},isPlaying:()=>['hand','practice','playing'].includes(mode),isPaused:()=>paused,setStop(fn){stop=fn},setStart(fn){start=fn},setTracking(found,pos){tracking=found;if($('track-label'))$('track-label').textContent=found?'● Hand detected / 已识别':'○ Raise your hand / 举起手掌';if(!found){handHold=0;hold=0;if(['playing','practice'].includes(mode))status('Raise your palm / 举起手掌，继续游动')}else{status('');if(pos)target={x:Math.max(90,Math.min(1582,pos.x*1672)),y:Math.max(180,Math.min(745,pos.y*941))}}}};
// Local-only storyboard review; never enables camera bypass on the deployed site.
if(['127.0.0.1','localhost'].includes(location.hostname)){const preview=new URLSearchParams(location.search).get('preview');if(['home','camera','hand','practice','playing','won'].includes(preview)){if(preview==='practice')practice();else if(preview==='playing')play();else show(preview)}}
