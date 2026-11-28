import { test, expect } from '@playwright/test';

test('3D world accepts a legal build action and advances the deterministic quarter', async ({page}) => {
  const pageErrors:string[]=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.goto('/');
  await page.getByRole('button',{name:'Play synthetic'}).click();
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
  await page.getByRole('button',{name:'Play synthetic'}).click();
  await page.getByRole('button',{name:'Select buildable site'}).click();
  await page.getByRole('button',{name:'Build Water recovery'}).click();
  await expect(page.locator('.game-stat').first()).toContainText('900');
  await expect(page.getByRole('button',{name:'Build Solar field'})).toBeDisabled();
  await expect(page.locator('.game-stat').first()).toContainText('900');
});

test('12 quarter loss is visible and prevents any further actions',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Play synthetic'}).click();
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
  await page.getByRole('button',{name:'Play synthetic'}).click();
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
  await page.getByRole('button',{name:'Play synthetic'}).click();
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

test('water terrain is excluded from selectable construction and replay cannot bypass the engine',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Play synthetic'}).click();
  const selection=page.getByRole('combobox',{name:'Buildable territory'});
  await expect(selection.locator('option[value="syn-7-7"]')).toHaveCount(0);
  await page.getByRole('button',{name:'Export replay'}).click();
  const textarea=page.getByRole('textbox',{name:'Replay JSON'});
  const data=JSON.parse(await textarea.inputValue());
  data.commands=[{kind:'BUILD_SOLAR',cellId:'syn-7-7'}]; // Procedural water tile.
  await textarea.fill(JSON.stringify(data));
  await page.getByRole('button',{name:'Load replay'}).click();
  await expect(page.locator('.event-panel')).toContainText('Replay rejected: UNBUILDABLE_GEO_CELL');
  await expect(page.locator('.game-stat').first()).toContainText('1,000');
  await expect(page.locator('.game-hud-title')).toContainText('QUARTER 0 OF 12');
});


test('official Madrid Explore renders 21 sourced districts with provenance and no buildability',async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button',{name:'2D DISTRICTS'}).click();
  await expect(page.getByTestId('real-madrid-map')).toBeVisible();
  await expect(page.locator('.real-district')).toHaveCount(21);
  await expect(page.getByText('CONSTRUCTION LOCKED IN REAL EXPLORE')).toBeVisible();
  await expect(page.getByText('district source 900012-3',{exact:false})).toBeVisible();
  await expect(page.getByText('Building eligibility')).toBeVisible();
  await expect(page.getByText('UNVERIFIED · LOCKED')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.screenshot({path:'test-results/real-madrid-explore.png',fullPage:true});
  expect(errors).toEqual([]);
});

test('real district selection is keyboard accessible and does not change synthetic turn state',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'2D DISTRICTS'}).click();
  await page.getByRole('button',{name:'Select Barajas official district'}).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.real-selection h3')).toHaveText('Barajas');
  await expect(page.locator('.real-selection')).toContainText('21');
  await page.getByRole('button',{name:'Play synthetic'}).click();
  await expect(page.locator('.game-hud-title')).toContainText('QUARTER 0 OF 12');
  await page.getByRole('button',{name:'Select buildable site'}).click();
  await page.getByRole('button',{name:'Build Solar field'}).click();
  await expect(page.locator('.game-stat').first()).toContainText('920');
  await page.getByRole('button',{name:'Real Madrid'}).click();
  await expect(page.locator('.real-selection h3')).toHaveText('Barajas');
  await page.getByRole('button',{name:'Play synthetic'}).click();
  await expect(page.locator('.game-stat').first()).toContainText('920');
});


test('sourced Madrid has a real Three.js 3D relief with explicitly schematic heights',async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto('/');
  await expect(page.getByRole('button',{name:'3D GEOGRAPHY'})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByTestId('real-madrid-3d')).toBeVisible();
  const canvas=page.locator('.real-model-wrap canvas');
  await expect(canvas).toBeVisible();
  const webgl=await canvas.evaluate(node=>{
    const c=node as HTMLCanvasElement;
    const gl=c.getContext('webgl2')??c.getContext('webgl');
    return Boolean(gl);
  });
  expect(webgl,'WebGL context must be available to render the district 3D mesh').toBe(true);
  await expect(page.getByText('NO BUILDING MODELS OR OBSERVED HEIGHTS CONNECTED YET')).toBeVisible();
  await expect(page.getByText('SCHEMATIC · NOT OBSERVED')).toBeVisible();
  await page.locator('.real-districts button').filter({hasText:'Barajas'}).click();
  await expect(page.locator('.real-selection h3')).toHaveText('Barajas');
  await page.screenshot({path:'test-results/real-madrid-3d-relief.png',fullPage:true});
  await page.getByRole('button',{name:'2D DISTRICTS'}).click();
  await expect(page.locator('.real-district')).toHaveCount(21);
  await page.getByRole('button',{name:'3D GEOGRAPHY'}).click();
  await expect(canvas).toBeVisible();
  expect(errors).toEqual([]);
});
