import {game} from './game.js';
import {palmPosition} from './logic.js';
const $=id=>document.getElementById(id);let tracker,stream,frame=0,run=0,lastVideo=-1,lastDetect=0,busy=false;
function stop(){run++;cancelAnimationFrame(frame);if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;$('video').srcObject=null;$('camera').classList.add('hidden');game.setTracking(false);busy=false;}
game.setStop(stop);
async function start(){if(busy)return;busy=true;const token=run;$('enable-camera').disabled=true;$('enable-camera').innerHTML='Opening… <span>/ 正在开启</span>';$('camera-error').classList.add('hidden');
try{
if(!navigator.mediaDevices?.getUserMedia)throw Error('HTTPS required');
const newStream=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480,facingMode:'user'},audio:false});
if(token!==run){newStream.getTracks().forEach(t=>t.stop());return}stream=newStream;
$('video').srcObject=stream;await $('video').play();$('enable-camera').innerHTML='Loading… <span>/ 加载手掌识别</span>';
if(!tracker){const {HandLandmarker,FilesetResolver}=await import('./vendor/vision_bundle.mjs');const files=await FilesetResolver.forVisionTasks('./vendor/wasm');tracker=await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'./vendor/hand_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.5,minHandPresenceConfidence:.5,minTrackingConfidence:.5})}
if(token!==run)return;busy=false;lastVideo=-1;let foundAt=0;game.handReady();$('camera').classList.remove('hidden');
function loop(now){if(token!==run||!game.isPlaying())return;const video=$('video');if(video.readyState>=2&&video.currentTime!==lastVideo&&now-lastDetect>55&&!game.isPaused()){lastVideo=video.currentTime;lastDetect=now;try{const result=tracker.detectForVideo(video,now),hand=result.landmarks?.[0];if(hand){foundAt=now;game.setTracking(true,palmPosition(hand));$('camera-label').textContent='Palm found / 手掌已识别'}else if(now-foundAt>350){game.setTracking(false);$('camera-label').textContent='Raise your hand / 举起手掌'}}catch(e){game.setTracking(false);game.status('Tracking paused. Return home to retry. / 识别暂停，请返回首页重试')}}frame=requestAnimationFrame(loop)}frame=requestAnimationFrame(loop);
}catch(e){if(token!==run)return;stop();game.prepare();const denied=['NotAllowedError','PermissionDeniedError'].includes(e.name);$('camera-error').textContent=denied?'Please allow camera access, then try again. / 请在浏览器中允许摄像头，再点击重试。':'Camera unavailable. Check that it is connected and not in use. / 请检查摄像头连接，关闭占用摄像头的软件后重试。';$('camera-error').classList.remove('hidden');console.warn('Camera initialization:',e.name)}}
$('enable-camera').onclick=start;game.setStart(start);
