export const JELLY_RADIUS=39;
export const RINGS=[{x:.34,y:.32,r:92},{x:.57,y:.71,r:69},{x:.82,y:.34,r:50}];
export function fitsRing(jelly,ring){return Math.hypot(jelly.x-ring.x,jelly.y-ring.y)+JELLY_RADIUS<=ring.r;}
export function palmPosition(landmarks){const ids=[0,5,9,13,17];let x=0,y=0;for(const i of ids){x+=landmarks[i].x/ids.length;y+=landmarks[i].y/ids.length;}return {x:Math.max(.06,Math.min(.94,(1-x-.13)/.74)),y:Math.max(.13,Math.min(.85,(y-.12)/.72))};}
