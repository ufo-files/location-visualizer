import { test, expect } from '@playwright/test';

test.use({browserName:'webkit',launchOptions:{},hasTouch:true});

async function exposeViewer(page){
  await page.route('**/Cesium.js',async route=>{
    const response=await route.fetch();
    const script=await response.text();
    await route.fulfill({response,body:script+`;(()=>{const original=Cesium.Camera.prototype.setView;Cesium.Camera.prototype.setView=function(...args){window.testScene=this._scene;return original.apply(this,args);};})();`});
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
    const points=Array.from({length:72},(_,i)=>{
      const angle=i/72*Math.PI*2;
      const point=C.Cartesian3.add(center,C.Cartesian3.add(
        C.Cartesian3.multiplyByScalar(camera.rightWC,Math.cos(angle)*limbRadius,new C.Cartesian3()),
        C.Cartesian3.multiplyByScalar(camera.upWC,Math.sin(angle)*limbRadius,new C.Cartesian3()),new C.Cartesian3()),new C.Cartesian3());
      return C.SceneTransforms.worldToWindowCoordinates(v,point);
    });
    const origin=C.SceneTransforms.worldToWindowCoordinates(v,C.Cartesian3.ZERO);
    return {minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y)),centerX:origin.x,centerY:origin.y,width:v.canvas.clientWidth,height:v.canvas.clientHeight};
  });
}
async function expectWholeGlobe(page){
  await expect.poll(async()=>{
    const b=await globeBounds(page);
    return b.minX>10&&b.minY>10&&b.maxX<b.width-10&&b.maxY<b.height-10&&Math.abs(b.centerX-b.width/2)<2&&Math.abs(b.centerY-b.height/2)<2;
  }).toBe(true);
}
test('whole globe stays centered with slider, mouse zoom, and orientation changes',async({page},testInfo)=>{
  await exposeViewer(page);await page.setViewportSize({width:1024,height:768});
  await page.goto('./');await expect(page.locator('#locate')).toBeEnabled({timeout:60000});
  await page.locator('#scale').fill('2');await expectWholeGlobe(page);
  await page.screenshot({path:testInfo.outputPath('globe-landscape.png')});
  await page.setViewportSize({width:768,height:1024});await expectWholeGlobe(page);
  await page.screenshot({path:testInfo.outputPath('globe-portrait.png')});
  await page.setViewportSize({width:1366,height:640});await expectWholeGlobe(page);
  await page.locator('#scale').fill('2.26');
  await page.mouse.move(500,350);await page.mouse.wheel(0,2500);
  await expectWholeGlobe(page);
});
