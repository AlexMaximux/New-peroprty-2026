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

test.describe('Favourites isolation', () => {
  let hmoId, buyer1Token;

  test.beforeAll(async () => {
    const s1 = await getSession('agency1@demo.test');
    hmoId = await findSeedListing(s1.accessToken, 'Whitechapel');
    const b1 = await getSession('buyer1@demo.test');
    buyer1Token = b1.accessToken;
    if (hmoId) {
      await fetch(`${API}/favourites/${hmoId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
      });
    }
  });

  test('6a: Buyer1 sees favourited listing', async ({ page }) => {
    expect(hmoId).toBeTruthy();
    await loginApi(page, 'buyer1@demo.test');
    await page.goto('/favourites');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Whitechapel').first()).toBeVisible({ timeout: 10_000 });
  });

  test('6b: Buyer2 does not see buyer1 favourites', async ({ page }) => {
    expect(hmoId).toBeTruthy();
    await loginApi(page, 'buyer2@demo.test');
    await page.goto('/favourites');
    await page.waitForTimeout(2000);
    const text = await page.locator('body').innerText();
    expect(text).not.toContain('Whitechapel');
  });
});
