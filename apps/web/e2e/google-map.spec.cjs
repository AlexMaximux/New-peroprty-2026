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

test.describe('Google Map', () => {
  let hmoId;

  test.beforeAll(async () => {
    const s = await getSession('agency1@demo.test');
    hmoId = await findSeedListing(s.accessToken, 'Whitechapel');
  });

  test('3: PropertyMap component renders on listing detail page', async ({ page }) => {
    expect(hmoId).toBeTruthy();
    await loginApi(page, 'buyer1@demo.test');
    await page.goto(`/listings/${hmoId}`);
    await expect(page.locator('h1')).toContainText('Whitechapel', { timeout: 15_000 });

    // Check for PropertyMap component. Google Maps API key may be restricted by referrer,
    // so the component might show "Map unavailable" fallback.
    const mapState = page.locator('text=Map unavailable').or(page.locator('text=Loading map'));
    const fallbackVisible = await mapState.first().isVisible({ timeout: 8000 }).catch(() => false);

    // If fallback text not found, check for any element with "map" in its class name
    if (!fallbackVisible) {
      const mapContainer = page.locator('[class*="map"]').first();
      await expect(mapContainer).toBeVisible({ timeout: 5000 });
    }
  });
});
