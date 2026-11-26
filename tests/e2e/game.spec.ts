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
