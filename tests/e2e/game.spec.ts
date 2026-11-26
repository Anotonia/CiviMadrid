import { test, expect } from '@playwright/test';

test('3D world accepts a legal build action and advances the deterministic quarter', async ({page}) => {
  const pageErrors:string[]=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'CiviMadrid'})).toBeVisible();
  await expect(page.getByText('SYNTHETIC TERRAIN & GAME ECONOMY')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(1);
  const supported=await page.locator('canvas').evaluate(canvas=>{
    const gl=(canvas as HTMLCanvasElement).getContext('webgl2');
    return Boolean(gl && gl.getParameter(gl.VERSION));
  });
  expect(supported,'WebGL2 required for the 3D terrain acceptance test').toBe(true);
  await page.getByRole('button',{name:'Select buildable site'}).click();
  await expect(page.getByText('SELECTED TERRITORY')).toBeVisible();
  await page.getByRole('button',{name:'Build Solar field'}).click();
  await expect(page.locator('.game-stat').first()).toContainText('920');
  await expect(page.locator('.event-panel')).toContainText('solar queued');
  await page.getByRole('button',{name:/ADVANCE QUARTER/}).click();
  await expect(page.locator('.game-hud-title')).toContainText('QUARTER 1 OF 12');
  await expect(page.locator('.event-panel')).toContainText('Quarter advanced');
  await expect(page.locator('.game-stat').nth(2)).toContainText('155');
  await page.screenshot({path:'test-results/game-after-turn.png',fullPage:true});
  expect(pageErrors).toEqual([]);
});

test('rejects duplicate construction and preserves treasury',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Select buildable site'}).click();
  await page.getByRole('button',{name:'Build Water recovery'}).click();
  await expect(page.locator('.game-stat').first()).toContainText('900');
  await expect(page.getByRole('button',{name:'Build Solar field'})).toBeDisabled();
  await expect(page.locator('.game-stat').first()).toContainText('900');
});

test('12 quarter loss is visible and prevents any further actions',async({page})=>{
  await page.goto('/');
  for(let turn=0;turn<12;turn++){
    await page.getByRole('button',{name:/ADVANCE QUARTER/}).click();
  }
  await expect(page.locator('.game-hud-title')).toContainText('QUARTER 12 OF 12');
  await expect(page.locator('.campaign-result')).toContainText('CAMPAIGN STATUS: LOST');
  await expect(page.locator('.campaign-result')).toContainText('housing goal');
  await expect(page.getByRole('button',{name:'CAMPAIGN ENDED'})).toBeDisabled();
  await page.getByRole('button',{name:'Select buildable site'}).click();
  await expect(page.getByRole('button',{name:'Build Solar field'})).toBeDisabled();
});

test('exported replay restores authoritative world and refuses tampered checksum',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Select buildable site'}).click();
  await page.getByRole('button',{name:'Build Solar field'}).click();
  await page.getByRole('button',{name:/ADVANCE QUARTER/}).click();
  await page.getByRole('button',{name:'Export replay'}).click();
  const textarea=page.getByRole('textbox',{name:'Replay JSON'});
  const data=JSON.parse(await textarea.inputValue());
  expect(data.commands).toHaveLength(2);
  expect(data.finalStateHash).toMatch(/^[a-f0-9]{8}$/);
  await page.getByRole('button',{name:'Restart scenario'}).click();
  await expect(page.locator('.game-hud-title')).toContainText('QUARTER 0 OF 12');
  await page.getByRole('button',{name:'Show replay input'}).click();
  await textarea.fill(JSON.stringify(data));
  await page.getByRole('button',{name:'Load replay'}).click();
  await expect(page.locator('.game-hud-title')).toContainText('QUARTER 1 OF 12');
  await expect(page.locator('.event-panel')).toContainText('Replay restored and verified');
  await expect(page.locator('.game-stat').first()).toContainText('920');
  await textarea.fill(JSON.stringify({...data,finalStateHash:'00000000'}));
  await page.getByRole('button',{name:'Load replay'}).click();
  await expect(page.locator('.event-panel')).toContainText('Replay rejected: Replay checksum mismatch');
  await expect(page.locator('.game-hud-title')).toContainText('QUARTER 1 OF 12');
});

test('strategy works across three distinct sites and wins at turn 12',async({page})=>{
  await page.goto('/');
  const next=page.getByRole('button',{name:'Next buildable site'});
  await next.click();
  await page.getByRole('button',{name:'Build Water recovery'}).click();
  await next.click();
  await page.getByRole('button',{name:'Build Solar field'}).click();
  await next.click();
  await page.getByRole('button',{name:'Build New housing'}).click();
  await expect(page.locator('.game-stat').first()).toContainText('700');
  for(let turn=0;turn<12;turn++){
    await page.getByRole('button',{name:/ADVANCE QUARTER/}).click();
  }
  await expect(page.locator('.campaign-result')).toContainText('CAMPAIGN STATUS: WON');
  await expect(page.locator('.campaign-result')).toContainText('Serviced homes 60/40');
  await expect(page.getByRole('button',{name:'CAMPAIGN ENDED'})).toBeDisabled();
});
