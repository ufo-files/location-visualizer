import { test, expect } from '@playwright/test';

test.use({browserName:'webkit',launchOptions:{},hasTouch:true});

async function exposeViewer(page){
  await page.route('**/Cesium.js',async route=>{
    const response=await route.fetch();
    const script=await response.text();
    await route.fulfill({response,body:script+`;(()=>{for(const method of ['setView','lookAt']){const original=Cesium.Camera.prototype[method];Cesium.Camera.prototype[method]=function(...args){window.testScene=this._scene;return original.apply(this,args);};}})();`});
  });
}
async function globeBounds(page){
  return page.evaluate(()=>{
    const C=window.Cesium,v=window.testScene,camera=v.camera;
    const radius=C.Ellipsoid.WGS84.maximumRadius;
    const distance=C.Cartesian3.magnitude(camera.positionWC);
    const normal=C.Cartesian3.normalize(camera.positionWC,new C.Cartesian3());
    const center=C.Cartesian3.multiplyByScalar(normal,radius*radius/distance,new C.Cartesian3());
    const limbRadius=radius*Math.sqrt(1-radius*radius/(distance*distance));
    const side=C.Cartesian3.normalize(C.Cartesian3.cross(normal,C.Cartesian3.UNIT_Z,new C.Cartesian3()),new C.Cartesian3());
    const top=C.Cartesian3.cross(normal,side,new C.Cartesian3());
    const points=Array.from({length:72},(_,i)=>{
      const angle=i/72*Math.PI*2;
      const point=C.Cartesian3.add(center,C.Cartesian3.add(
        C.Cartesian3.multiplyByScalar(side,Math.cos(angle)*limbRadius,new C.Cartesian3()),
        C.Cartesian3.multiplyByScalar(top,Math.sin(angle)*limbRadius,new C.Cartesian3()),new C.Cartesian3()),new C.Cartesian3());
      return C.SceneTransforms.worldToWindowCoordinates(v,point);
    });
    const [lat,lon]=document.getElementById('location-input').value.split(',').map(Number);
    const origin=C.SceneTransforms.worldToWindowCoordinates(v,C.Cartesian3.fromDegrees(lon,lat,5));
    return {minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y)),centerX:origin.x,centerY:origin.y,width:v.canvas.clientWidth,height:v.canvas.clientHeight};
  });
}
async function expectWholeGlobe(page){
  await expect.poll(async()=>{
    const b=await globeBounds(page);
    return Math.max(10-b.minX,10-b.minY,b.maxX-b.width+10,b.maxY-b.height+10,Math.abs(b.centerX-b.width/2),Math.abs(b.centerY-b.height/2));
  }).toBeLessThan(2);
}
test('laser base stays centered with slider, mouse zoom, rotation, and orientation changes',async({page},testInfo)=>{
  await exposeViewer(page);await page.setViewportSize({width:1024,height:768});
  await page.goto('./');await expect(page.locator('#location-input')).toBeEnabled({timeout:60000});
  const startingAngle=await page.evaluate(()=>{
    const c=window.testScene.camera;return {direction:[c.directionWC.x,c.directionWC.y,c.directionWC.z],up:[c.upWC.x,c.upWC.y,c.upWC.z]};
  });
  for(let step=1;step<=20;step++){
    await page.locator('#scale').evaluate((input,value)=>{input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));},(2.26-step*.013).toFixed(3));
    const angle=await page.evaluate(()=>{
      const c=window.testScene.camera;return {direction:[c.directionWC.x,c.directionWC.y,c.directionWC.z],up:[c.upWC.x,c.upWC.y,c.upWC.z]};
    });
    const bounds=await globeBounds(page);
    expect(Math.abs(bounds.centerX-bounds.width/2)).toBeLessThan(2);
    expect(Math.abs(bounds.centerY-bounds.height/2)).toBeLessThan(2);
    for(const axis of ['direction','up']){
      const dot=angle[axis].reduce((sum,v,i)=>sum+v*startingAngle[axis][i],0);
      expect(dot).toBeGreaterThan(1-1e-10);
    }
  }
  await page.locator('#scale').fill('2');await expectWholeGlobe(page);
  await page.screenshot({path:testInfo.outputPath('globe-landscape.png')});
  await page.setViewportSize({width:768,height:1024});await expectWholeGlobe(page);
  await page.screenshot({path:testInfo.outputPath('globe-portrait.png')});
  await page.setViewportSize({width:1366,height:640});await expectWholeGlobe(page);
  await page.locator('#scale').fill('2.26');
  await page.mouse.move(500,350);await page.mouse.wheel(0,2500);
  await expect.poll(()=>page.evaluate(()=>Cesium.Cartesian3.magnitude(window.testScene.camera.positionWC))).toBeGreaterThan(30000000);
  await expectWholeGlobe(page);
  await page.evaluate(()=>{window.testScene.screenSpaceCameraController.inertiaSpin=0;window.testScene.screenSpaceCameraController.inertiaTilt=0;});
  await page.mouse.move(683,320);await page.mouse.down();await page.mouse.move(790,370,{steps:12});await page.mouse.up();
  await page.waitForTimeout(100);
  const rotatedDirection=await page.evaluate(()=>{const d=window.testScene.camera.directionWC;return [d.x,d.y,d.z];});
  await page.locator('#scale').fill('2.05');
  const afterZoom=await page.evaluate(()=>{const d=window.testScene.camera.directionWC;return [d.x,d.y,d.z];});
  expect(afterZoom.reduce((sum,v,i)=>sum+v*rotatedDirection[i],0)).toBeGreaterThan(1-1e-10);
  const base=await globeBounds(page);
  expect(Math.abs(base.centerX-base.width/2)).toBeLessThan(2);
  expect(Math.abs(base.centerY-base.height/2)).toBeLessThan(2);
  await page.evaluate(()=>{
    window.beamOrigins=[];
    const original=CanvasRenderingContext2D.prototype.moveTo;
    CanvasRenderingContext2D.prototype.moveTo=function(x,y){
      if(this.canvas.id==='space'&&this.shadowBlur===22)window.beamOrigins.push([x,y]);
      return original.call(this,x,y);
    };
  });
  for(const zoom of ['1.25','1','0']){
    await page.evaluate(()=>window.beamOrigins=[]);await page.locator('#scale').fill(zoom);
    const origins=await page.evaluate(()=>({points:window.beamOrigins,width:innerWidth,height:innerHeight}));
    expect(origins.points).toHaveLength(3);
    for(const [x,y]of origins.points){expect(x).toBeCloseTo(origins.width/2,4);expect(y).toBeCloseTo(origins.height/2,4);}
  }
});
