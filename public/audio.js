// Original interaction sounds plus the complete audio supplied by the user.
const settings={muted:localStorage.getItem('palm-jelly-muted')==='true'};
let ctx,master,motionGain,motionFilter,motionSource,bubbleTimer,lastBubble=0,music=null;
export const audio={
 async unlock(){if(!ctx){ctx=new AudioContext();master=ctx.createGain();master.gain.value=settings.muted?0:.65;master.connect(ctx.destination);const b=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),data=b.getChannelData(0);let last=0;for(let i=0;i<data.length;i++){last=(last+Math.random()*.02-.01)/1.02;data[i]=last*6}motionSource=ctx.createBufferSource();motionSource.buffer=b;motionSource.loop=true;motionFilter=ctx.createBiquadFilter();motionFilter.type='bandpass';motionFilter.frequency.value=700;motionFilter.Q.value=.5;motionGain=ctx.createGain();motionGain.gain.value=0;motionSource.connect(motionFilter).connect(motionGain).connect(master);motionSource.start();bubbleTimer=setInterval(()=>{if(!document.hidden&&!settings.muted&&ctx.state==='running'&&Math.random()<.38)this.bubble(.035)},1700)}if(ctx.state==='suspended')await ctx.resume();},
 tone(freq,at,duration,gain=.12,type='sine'){if(!ctx||settings.muted)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,at);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(gain,at+.012);g.gain.exponentialRampToValueAtTime(.0001,at+duration);o.connect(g).connect(master);o.start(at);o.stop(at+duration+.03)},
 bubble(volume=.08){if(!ctx||settings.muted)return;const o=ctx.createOscillator(),g=ctx.createGain(),at=ctx.currentTime;o.frequency.setValueAtTime(350+Math.random()*200,at);o.frequency.exponentialRampToValueAtTime(900+Math.random()*350,at+.06);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(volume,at+.012);g.gain.exponentialRampToValueAtTime(.0001,at+.12);o.connect(g).connect(master);o.start();o.stop(at+.14)},
 cue(kind,index=0){if(!ctx||settings.muted)return;const now=ctx.currentTime;if(kind==='click'){this.bubble(.09);return}const notes=kind==='win'?[523.25,659.25,783.99,1046.5]:kind==='ring'?[523.25*2**(index/6),783.99*2**(index/6)]:kind==='start'?[392,523.25,659.25]:[659.25,880];notes.forEach((f,i)=>{this.tone(f,now+i*.115,.45,kind==='win'?.12:.09);this.tone(f*2,now+i*.115,.18,.018)})},
 setMotion(value){if(!ctx)return;motionGain.gain.setTargetAtTime(Math.min(.12,value*.11),ctx.currentTime,.22);motionFilter.frequency.setTargetAtTime(400+value*850,ctx.currentTime,.2);if(value>.25&&ctx.currentTime-lastBubble>.5+Math.random()){lastBubble=ctx.currentTime;this.bubble(.025+value*.025)}},
 toggle(){settings.muted=!settings.muted;localStorage.setItem('palm-jelly-muted',String(settings.muted));if(master)master.gain.setTargetAtTime(settings.muted?0:.65,ctx.currentTime,.04);if(music)music.muted=settings.muted;this.updateButton();return settings.muted},
 updateButton(){const b=document.getElementById('sound');b.textContent=settings.muted?'♪̸':'♫';b.setAttribute('aria-label',settings.muted?'Turn sound on / 开启声音':'Turn sound off / 关闭声音');b.setAttribute('aria-pressed',String(!settings.muted));b.title=settings.muted?'Sound off / 声音已关闭':'Sound on / 声音已开启'},
 suspend(){ctx?.suspend();music?.pause()},resume(){if(ctx&&!settings.muted)ctx.resume();if(music&&!settings.muted)music.play().catch(()=>{})},
 playMusic(){if(!music||settings.muted)return Promise.resolve();return music.play().catch(()=>{})},
 async loadMusic(url,{start=0}={}){
  if(!music){music=new Audio();music.preload='auto';music.loop=true;music.volume=.22;music.muted=settings.muted;music.src=url;
   if(start>0)music.addEventListener('loadedmetadata',()=>{music.currentTime=start},{once:true});
   music.load();
  }
  if(!settings.muted)await music.play();
 }
};
document.addEventListener('pointerdown',()=>audio.unlock(),{once:true});document.addEventListener('keydown',()=>audio.unlock(),{once:true});document.addEventListener('click',async event=>{const b=event.target.closest('button');if(!b||b.disabled)return;await audio.unlock();if(b.id==='sound'){audio.toggle();if(!settings.muted){audio.playMusic();audio.cue('click')}}else audio.cue('click')});audio.updateButton();
