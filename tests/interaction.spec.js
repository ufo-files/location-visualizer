import { test, expect } from '@playwright/test';

test.use({browserName:'webkit',launchOptions:{},viewport:{width:1024,height:768},hasTouch:true,isMobile:true});

test('Safari map drags do not select the page and text fields stay editable',async({page})=>{
  const tile=page.waitForResponse(r=>r.url().includes('World_Imagery/MapServer/tile/')&&r.ok(),{timeout:60000});
  await page.goto('./');
  await expect(page.locator('#go')).toBeEnabled({timeout:60000});
  await expect(page.locator('.scale-panel button')).toHaveCount(0);
  await expect(page.locator('.scale-panel')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  await expect(page.locator('.scale-panel')).toHaveCSS('backdrop-filter','none');
  await expect(page.locator('.scale-panel .eyebrow')).toHaveCount(0);
  await tile;
  const map=page.locator('#earth canvas');
  const before=await map.screenshot();
  await page.mouse.move(510,400);await page.mouse.down();
  await page.mouse.move(100,190,{steps:20});await page.mouse.up();
  expect(await page.evaluate(()=>getSelection().toString())).toBe('');
  const after=await map.screenshot();expect(after.equals(before)).toBe(false);
  await page.locator('.beacon-controls summary').click();
  const name=page.locator('#marker-name');await name.fill('Editable beacon');
  await name.selectText();
  expect(await name.evaluate(input=>input.selectionEnd-input.selectionStart)).toBe('Editable beacon'.length);
  await page.keyboard.insertText('My beacon');await expect(name).toHaveValue('My beacon');
  await expect(page.locator('#location-title')).toHaveText('My beacon');
  await page.locator('#scale').fill('1');
  await page.mouse.move(500,400);await page.mouse.down();await page.mouse.move(100,200,{steps:20});await page.mouse.up();
  expect(await page.evaluate(()=>getSelection().toString())).toBe('');
});
