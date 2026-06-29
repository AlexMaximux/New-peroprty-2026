const { test, expect } = require('@playwright/test');
const API = 'http://localhost:3001/api/v1';
const PWD = 'Passw0rd!';

async function loginApi(page, email) {
  const r = await (await fetch(`${API}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PWD }),
  })).json();
  await page.goto('/');
  await page.evaluate(t => { localStorage.setItem('pv_access_token', t.accessToken); localStorage.setItem('pv_refresh_token', t.refreshToken); }, r);
}

async function getSession(email) {
  return (await fetch(`${API}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PWD }),
  })).json();
}

async function findSeedListing(token, sub) {
  const s = await (await fetch(`${API}/listings/search`, { headers: { Authorization: `Bearer ${token}` } })).json();
  const items = s.data || s;
  const f = items.find(l => l.title && l.title.includes(sub));
  return f ? f.id : null;
}

test.describe('HMO calculator', () => {
  let hmoId;

  test.beforeAll(async () => {
    const s = await getSession('agency1@demo.test');
    hmoId = await findSeedListing(s.accessToken, 'Whitechapel');
  });

  test('4: HMO calc shows correct gross monthly income', async ({ page }) => {
    expect(hmoId).toBeTruthy();
    await loginApi(page, 'buyer1@demo.test');
    await page.goto(`/listings/${hmoId}`);
    await expect(page.locator('h1')).toContainText('Whitechapel', { timeout: 15_000 });
    await expect(page.locator('text=Room Configuration (7)')).toBeVisible();
    await expect(page.locator('text=£1,200/mo').first()).toBeVisible();
    await expect(page.locator('text=Total Monthly Income')).toBeVisible();
    await expect(page.locator('text=£7,200/mo')).toBeVisible();
  });
});
