import test from 'node:test';
import assert from 'node:assert/strict';
import { HelioDistance } from 'astronomy-engine';
import { SUN, position, fieldWidth } from '../src/astronomy.js';
test('Galactic rotation and translation preserve heliocentric distances',()=>{
  const date=new Date('2026-10-24T12:00:00Z');
  for(const body of ['Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune']){
    const p=position(body,date);
    assert.ok(Math.abs(Math.hypot(...p.map((v,i)=>v-SUN[i]))-HelioDistance(body,date))<1e-6);
  }
});
test('field width decreases continuously across the logarithmic solar-system boundary',()=>{
  for(let level=0;level<1.99;level+=.01)assert.ok(fieldWidth(level)>fieldWidth(level+.01));
  assert.ok(Math.abs(fieldWidth(1)-80)<1e-10);
  assert.ok(Math.abs(fieldWidth(1-1e-9)-fieldWidth(1+1e-9))<.001);
});
