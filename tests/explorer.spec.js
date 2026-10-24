import { test, expect } from '@playwright/test';
test('satellite globe, geolocation, and astronomical scale',async({browser})=>{
  const context=await browser.newContext({permissions:['geolocation'],geolocation:{latitude:37.7749,longitude:-122.4194,accuracy:25}});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const satelliteTile=page.waitForResponse(r=>r.url().includes('World_Imagery/MapServer/tile/')&&r.ok(),{timeout:60000});
  await page.goto('http://127.0.0.1:5173');
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
  await page.goto('/');await expect(page.locator('#locate')).toBeEnabled({timeout:60000});await page.locator('#locate').click();await expect(page.locator('#status')).toContainText('denied');
});
