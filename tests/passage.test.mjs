import test from 'node:test';
import assert from 'node:assert/strict';
import {alignedWithHoop,passagePose} from '../public/passage.js';
test('small tilted hoop requires precise alignment, not touching its edge',()=>{const r={x:600,y:300,r:84};assert(alignedWithHoop({x:600,y:300},r,60));assert(!alignedWithHoop({x:620,y:300},r,60));assert(!alignedWithHoop({x:600,y:330},r,60))});
test('passage moves through the plane before the jellyfish is drawn in front',()=>{const r={x:600,y:300,r:138},a=passagePose(r,0),mid=passagePose(r,.6),b=passagePose(r,1);assert(a.x<mid.x&&mid.x<b.x);assert.equal(mid.front,false);assert.equal(b.front,true);assert(b.x>r.x+r.r);assert(mid.scale<1);assert.equal(b.scale,1)});
