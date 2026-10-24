import test from 'node:test';
import assert from 'node:assert/strict';
import { HelioDistance } from 'astronomy-engine';
import { SUN, position, fieldWidth, locationRay, AU_KM } from '../src/astronomy.js';
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
test('surface-normal beams rotate with Earth and opposite sites point in opposite directions',()=>{
  const date=new Date('2026-10-24T12:00:00Z');
  const ray=locationRay(37.4083,-122.179,date);
  const opposite=locationRay(-37.4083,57.821,date);
  assert.ok(Math.abs(Math.hypot(...ray.direction)-1)<1e-12);
  assert.ok(ray.direction.reduce((sum,n,i)=>sum+n*opposite.direction[i],0)<-.999999999);
  const earth=position('Earth',date);
  const radius=Math.hypot(...ray.origin.map((n,i)=>n-earth[i]))*AU_KM;
  assert.ok(radius>6300&&radius<6450);
  const later=locationRay(37.4083,-122.179,new Date(+date+6*3600000));
  assert.ok(Math.hypot(...later.direction.map((n,i)=>n-ray.direction[i]))>.8);
});
