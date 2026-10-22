// A tilted hoop has a far (left) rim and a near (right) rim.
export const HOOP_X=.86;
export const PASS_SECONDS=1.15;
export function alignedWithHoop(jelly,ring,bodyRadius){
 const xClear=ring.r*HOOP_X-bodyRadius,yClear=ring.r-bodyRadius;
 if(xClear<=0||yClear<=0)return false;
 return ((jelly.x-ring.x)/xClear)**2+((jelly.y-ring.y)/yClear)**2<=1;
}
export function passagePose(ring,progress){
 const p=Math.max(0,Math.min(1,progress)),ease=p*p*(3-2*p);
 return {x:ring.x+(-.28+1.55*ease)*ring.r,y:ring.y-Math.sin(p*Math.PI)*ring.r*.12,scale:1-.12*Math.sin(p*Math.PI),front:p>.78};
}
