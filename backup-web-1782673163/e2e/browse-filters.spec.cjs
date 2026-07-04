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

test.describe('Browse filters', () => {
  test('5: Sold/reserved listings excluded from browse', async ({ page }) => {
    await loginApi(page, 'buyer1@demo.test');
    await page.goto('/browse');
    await page.waitForTimeout(3000);
    const text = await page.locator('body').innerText();
    expect(text).not.toContain('City Centre Studio');
    expect(text).not.toContain('Commercial — Shop');
    expect(text).toContain('Whitechapel');
  });
});
