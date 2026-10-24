import { test, expect } from '@playwright/test';
test('Stanford Dish defaults to state-level view and space scenes render',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const tile=page.waitForResponse(r=>r.url().includes('World_Imagery/MapServer/tile/')&&r.ok(),{timeout:60000});
  await page.goto('./');
  await expect(page.locator('#go')).toBeEnabled({timeout:60000});
  await expect(page.locator('#location-title')).toHaveText('Stanford Dish');
  await expect(page.locator('#coordinates')).toContainText('37.40830°, -122.17900°');
  const altitude=Number((await page.locator('#distance').textContent()).replace(/[^\d.]/g,''));
  expect(altitude).toBeGreaterThan(1500);expect(altitude).toBeLessThan(2200);
  await tile;
  await page.waitForTimeout(2000);
  await page.screenshot({path:testInfo.outputPath('stanford-california.png')});
  for(const [name,rendering]of [['Milky Way','barred-spiral-galaxy'],['Solar system','shaded-planets-and-orbits'],['Inner planets','shaded-planets-and-orbits']]){
    await page.getByRole('button',{name,exact:true}).click();
    await expect(page.locator('#space')).toHaveAttribute('data-rendering',rendering);
    const lit=await page.locator('#space').evaluate(c=>{const {data}=c.getContext('2d').getImageData(0,0,c.width,c.height);let n=0;for(let i=0;i<data.length;i+=4)if(data[i]>45&&data[i+1]>45&&data[i+2]>45)n++;return n;});
    expect(lit).toBeGreaterThan(name==='Milky Way'?15000:3000);
    await page.screenshot({path:testInfo.outputPath(`${name.toLowerCase().replaceAll(' ','-')}.png`)});
  }
  expect(errors).toEqual([]);
});
test('satellite globe, geolocation, and astronomical scale',async({browser})=>{
  const context=await browser.newContext({baseURL:test.info().project.use.baseURL,permissions:['geolocation'],geolocation:{latitude:37.7749,longitude:-122.4194,accuracy:25}});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const satelliteTile=page.waitForResponse(r=>r.url().includes('World_Imagery/MapServer/tile/')&&r.ok(),{timeout:60000});
  await page.goto('./');
  await expect(page.locator('#locate')).toBeEnabled({timeout:60000});
  await page.waitForFunction(()=>document.querySelectorAll('.cesium-credit-textContainer').length>0);
  await satelliteTile;
  await page.locator('#locate').click();
  await expect(page.locator('#coordinates')).toContainText('37.77490');
  await expect(page.locator('#coordinates')).toContainText('±25 m');
  await page.getByRole('button',{name:'Milky Way',exact:true}).click();
  await expect(page.locator('#space')).toBeVisible();
  await expect(page.locator('#scale-title')).toHaveText('MILKY WAY');
  await page.getByRole('button',{name:'Solar system',exact:true}).click();
  await expect(page.locator('#scale-title')).toHaveText('SOLAR SYSTEM');
  await page.getByRole('button',{name:'Earth',exact:true}).click();
  await page.locator('summary').click();await page.locator('#lat').fill('-33.8688');await page.locator('#lon').fill('151.2093');await page.locator('#go').click();
  await expect(page.locator('#coordinates')).toContainText('-33.86880');
  expect(errors).toEqual([]);await context.close();
});
test('denied geolocation offers manual coordinates',async({page})=>{
  await page.addInitScript(()=>{navigator.geolocation.getCurrentPosition=(_success,error)=>error({code:1});});
  await page.goto('./');await expect(page.locator('#locate')).toBeEnabled({timeout:60000});await page.locator('#locate').click();await expect(page.locator('#status')).toContainText('denied');
});
