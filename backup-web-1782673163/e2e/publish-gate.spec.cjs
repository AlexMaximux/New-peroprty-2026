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

test.describe('Publish gate', () => {
  let adminToken, pendingProfileId, agencyToken, agencyUserId;

  test.beforeAll(async () => {
    const admin = await getSession('admin@demo.test'); adminToken = admin.accessToken;
    const a1 = await getSession('agency1@demo.test'); agencyToken = a1.accessToken;
    agencyUserId = a1.user.id;
    const agencies = await (await fetch(`${API}/admin/agencies`, { headers: { Authorization: `Bearer ${adminToken}` } })).json();
    const pending = agencies.find(a => a.verificationStatus === 'PENDING');
    if (pending) pendingProfileId = pending.id;
  });

  test('1a: Pending agency form loads but API blocks creation', async ({ page }) => {
    await loginApi(page, 'pending@demo.test');
    await page.goto('/agency/listings/new');
    await expect(page.locator('h1')).toContainText('New Property Listing');
  });

  test('1b: Admin approves pending agency', async () => {
    expect(pendingProfileId).toBeTruthy();
    const r = await (await fetch(`${API}/admin/agencies/${pendingProfileId}/approve`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ notes: 'e2e' }),
    })).json();
    expect(r.verificationStatus).toBe('APPROVED');
  });

  test('1c: Approved agency creates listing and it appears', async ({ page }) => {
    // After approval, get a fresh token with updated claims
    const freshA1 = await getSession('agency1@demo.test');
    const freshToken = freshA1.accessToken;

    const listing = await (await fetch(`${API}/listings`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${freshToken}` },
      body: JSON.stringify({
        category: 'SELL_PROPERTY',
        strategy: 'SINGLE_LET',
        status: 'PUBLISHED',
        base: {
          title: 'E2E Test Listing - Prime Investment',
          description: 'Created by e2e test',
          propertyType: 'FLAT',
          addressLine1: '1 Test Street',
          city: 'London',
          postcode: 'SW1A 1AA',
          region: 'Greater London',
          bedrooms: 2,
          bathrooms: 1,
          isVacant: true,
          needsRefurb: false,
        },
      }),
    })).json();
    expect(listing.id).toBeTruthy();

    await loginApi(page, 'agency1@demo.test');
    await page.goto('/browse');
    await page.waitForTimeout(3000);
    await expect(page.locator('text=E2E Test Listing').first()).toBeVisible({ timeout: 10_000 });
  });
});
