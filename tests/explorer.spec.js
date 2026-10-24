import { test, expect } from '@playwright/test';

test('header coordinates replace the location panel and all scale views render',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const tile=page.waitForResponse(r=>r.url().includes('World_Imagery/MapServer/tile/')&&r.ok(),{timeout:60000});
  await page.goto('./');await expect(page.locator('#location-input')).toBeEnabled({timeout:60000});
  await expect(page.locator('#location-input')).toHaveValue('37.40830, -122.17900');
  await expect(page.locator('aside')).toHaveCount(0);
  await expect(page.locator('header input')).toHaveCount(1);
  await expect(page.locator('header button')).toHaveCount(0);
  await expect(page.locator('.intro, #space-note')).toHaveCount(0);
  await tile;await page.screenshot({path:testInfo.outputPath('header-coordinates.png')});
  for(const [zoom,rendering]of [['0','barred-spiral-galaxy'],['1','shaded-planets-and-orbits'],['1.25','shaded-planets-and-orbits']]){
    await page.locator('#scale').fill(zoom);await expect(page.locator('#space')).toHaveAttribute('data-rendering',rendering);
  }
  expect(errors).toEqual([]);
});

test('coordinate entry moves the laser without changing zoom and rejects invalid coordinates',async({page})=>{
  await page.goto('./');const input=page.getByRole('textbox',{name:'Latitude, longitude'});
  await expect(input).toBeEnabled({timeout:60000});await page.locator('#scale').fill('2');
  await input.fill('-33.8688, 151.2093');await input.press('Enter');
  await expect(input).toHaveValue('-33.86880, 151.20930');await expect(page.locator('#scale')).toHaveValue('2');
  await input.fill('95, 200');await input.press('Enter');
  await expect(page.locator('#status')).toBeVisible();await expect(page.locator('#status')).toContainText('−90 to 90');
  await input.fill('0, 0');await input.press('Enter');await expect(input).toHaveValue('0.00000, 0.00000');
  await page.setViewportSize({width:390,height:844});await expect(input).toBeVisible();
});

test('rendered solar disks use physical radii and grow with distance zoom',async({page})=>{
  await page.goto('./');await expect(page.locator('#location-input')).toBeEnabled({timeout:60000});
  await page.evaluate(()=>{
    window.sphereDraws=[];
    const original=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(...args){
      if(this.canvas.id==='space'&&args.length===9&&args[0].width===160)window.sphereDraws.push(args[7]);
      return original.apply(this,args);
    };
  });
  await page.locator('#scale').fill('1');
  const widths=await page.evaluate(()=>window.sphereDraws);
  expect(widths).toHaveLength(9);
  const px=900/80;
  expect(widths[0]).toBeCloseTo(2*695700/149597870.7*px,10);
  expect(widths[4]/widths[6]).toBeCloseTo(69911/6371.0084,7);
  expect(widths[6]).toBeLessThan(.001);
  await page.evaluate(()=>window.sphereDraws=[]);
  await page.locator('#scale').fill('1.25');
  const innerSun=await page.evaluate(()=>window.sphereDraws[0]);
  // Inner view spans 4 AU rather than 80 AU: every disk must be 20x wider.
  expect(innerSun/widths[0]).toBeCloseTo(20,6);
  await expect(page.locator('#context')).toContainText('True size and distance scale');
});
