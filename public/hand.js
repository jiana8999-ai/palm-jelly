import { game } from './game.js';
import { palmPosition } from './logic.js';
const $=id=>document.getElementById(id);let tracker,stream,frame=0,run=0,lastVideo=-1,lastDetect=0,busy=false;
function stop(){run++;cancelAnimationFrame(frame);if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;$('video').srcObject=null;$('camera').classList.add('hidden');game.setTracking(false);busy=false;}
game.setStop(stop);
async function start(){if(busy)return;game.begin(false);busy=true;const token=run;game.status('Opening your little ocean… / 正在开启摄像头');
try{
if(!navigator.mediaDevices?.getUserMedia)throw Error('Camera requires HTTPS / 请通过 HTTPS 网址打开');
stream=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480,facingMode:'user'},audio:false});
if(token!==run){stream.getTracks().forEach(t=>t.stop());return;}
$('video').srcObject=stream;await $('video').play();$('camera').classList.remove('hidden');game.status('Loading hand tracking… / 首次加载手掌识别，请稍等');
if(!tracker){const {HandLandmarker,FilesetResolver}=await import('./vendor/vision_bundle.mjs');const files=await FilesetResolver.forVisionTasks('./vendor/wasm');tracker=await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'./vendor/hand_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.5,minHandPresenceConfidence:.5,minTrackingConfidence:.5});}
if(token!==run)return;busy=false;lastVideo=-1;let foundAt=0;
function loop(now){if(token!==run||!game.isPlaying())return;const video=$('video');if(video.readyState>=2&&video.currentTime!==lastVideo&&now-lastDetect>45&&!game.isPaused()){lastVideo=video.currentTime;lastDetect=now;try{const results=tracker.detectForVideo(video,now);const hand=results.landmarks?.[0];if(hand){foundAt=now;game.setTracking(true,palmPosition(hand));$('camera-label').textContent='Palm found / 正在跟随手掌';game.status('');}else if(now-foundAt>400){game.setTracking(false);$('camera-label').textContent='Show your palm / 伸出手掌';game.status('Show one open palm / 请在摄像头前伸出一只手掌');}}catch(e){game.setTracking(false);game.status('Tracking paused. Return home and retry. / 识别暂停，请返回首页重试');}}frame=requestAnimationFrame(loop);}frame=requestAnimationFrame(loop);
}catch(e){if(token!==run)return;stop();game.home();const denied=['NotAllowedError','PermissionDeniedError'].includes(e.name);game.status(denied?'Camera permission is needed. Allow it or try arrow keys. / 请允许摄像头，或选择键盘体验。':'Camera could not start. Try again or use arrow keys. / 摄像头暂时无法开启，可重试或选择键盘体验。');console.warn('Camera:',e.name,e.message);}}
$('start').onclick=start;$('again').onclick=()=>{if($('camera-label').dataset.mode==='keyboard')game.begin(true);else start();};$('demo').onclick=()=>{$('camera-label').dataset.mode='keyboard';game.begin(true)};$('start').addEventListener('click',()=>{$('camera-label').dataset.mode='camera'});addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)game.setTracking(false)});
