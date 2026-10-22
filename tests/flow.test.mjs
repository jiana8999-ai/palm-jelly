import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';

test('all shipped application modules parse',()=>{for(const name of ['game','scene','audio','hand','logic']){const r=spawnSync(process.execPath,['--check',`public/${name}.js`],{encoding:'utf8'});assert.equal(r.status,0,r.stderr)}});

test('guided flow requires practice, completes three rings, and cleans up',async()=>{
 const elements=new Map();
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const element=id=>{if(!elements.has(id)){const classes=new Set();elements.set(id,{id,disabled:false,dataset:{},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle(x,v){if(v)classes.add(x);else classes.delete(x)}},setAttribute(){},addEventListener(){},getContext:()=>ctx,showModal(){},close(){}})}return elements.get(id)};
 globalThis.document={getElementById:element,body:{dataset:{}},querySelectorAll:()=>[],addEventListener(){},hidden:false};
 globalThis.localStorage={getItem:()=>null,setItem(){}};globalThis.matchMedia=()=>({matches:true});globalThis.innerWidth=1400;globalThis.innerHeight=900;globalThis.devicePixelRatio=1;globalThis.Path2D=class{};globalThis.addEventListener=()=>{};let frame;globalThis.requestAnimationFrame=fn=>{frame=fn};
 const {game}=await import('../public/game.js');let stops=0;game.setStop(()=>stops++);let time=0;const advance=n=>{for(let i=0;i<n;i++)frame(time+=40)};
 assert.equal(document.body.dataset.screen,'home');element('start').onclick();assert.equal(document.body.dataset.screen,'camera');game.handReady();advance(40);assert.equal(document.body.dataset.screen,'hand');game.setTracking(true,{x:.3,y:.57});advance(30);assert.equal(document.body.dataset.screen,'practice');element('play').onclick();assert.equal(document.body.dataset.screen,'practice');game.setTracking(true,{x:.68,y:.57});advance(90);assert(!element('play').classList.contains('hidden'));element('play').onclick();assert.equal(document.body.dataset.screen,'playing');
 element('pause').onclick();game.setTracking(true,{x:.34,y:.32});advance(90);assert.equal(element('progress').textContent,'0 / 3');element('resume').onclick();advance(90);assert.equal(element('progress').textContent,'1 / 3');
 game.setTracking(false);advance(90);assert.equal(element('progress').textContent,'1 / 3');game.setTracking(true,{x:.57,y:.71});advance(90);assert.equal(element('progress').textContent,'2 / 3');game.setTracking(true,{x:.82,y:.34});advance(110);assert.equal(document.body.dataset.screen,'won');assert(stops>=2);element('back').onclick();assert.equal(document.body.dataset.screen,'home');assert(!game.isPlaying());
});
