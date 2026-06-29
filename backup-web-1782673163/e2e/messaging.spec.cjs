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

test.describe('Messaging', () => {
  let hmoId, agency1Token, buyer1Token, buyer2Token;

  test.beforeAll(async () => {
    const a1 = await getSession('agency1@demo.test'); agency1Token = a1.accessToken;
    const b1 = await getSession('buyer1@demo.test'); buyer1Token = b1.accessToken;
    const b2 = await getSession('buyer2@demo.test'); buyer2Token = b2.accessToken;
    hmoId = await findSeedListing(agency1Token, 'Whitechapel');
  });

  test('7a: Message sent by buyer1 appears in agency conversation', async ({ browser }) => {
    expect(hmoId).toBeTruthy();

    // Create conversation as buyer1
    const conv = await (await fetch(`${API}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
      body: JSON.stringify({ listingId: hmoId }),
    })).json();
    expect(conv.id).toBeTruthy();

    // Send a message as buyer1
    const msgText = `E2E test msg ${Date.now()}`;
    const sentMsg = await (await fetch(`${API}/conversations/${conv.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
      body: JSON.stringify({ body: msgText }),
    })).json();
    expect(sentMsg.message.id).toBeTruthy();

    // Agency navigates to conversation and sees the message
    const ctx = await browser.newContext();
    try {
      const agencyPage = await ctx.newPage();
      await loginApi(agencyPage, 'agency1@demo.test');
      await agencyPage.goto(`/messages/${conv.id}`);
      await agencyPage.waitForTimeout(2000);
      await expect(agencyPage.locator(`text="${msgText}"`).first()).toBeVisible({ timeout: 10_000 });
    } finally {
      await ctx.close();
    }
  });

  test('7b: API blocks cross-user conversation access', async () => {
    // Buyer1 creates/gets their conversations
    const convs = await (await fetch(`${API}/conversations`, {
      headers: { Authorization: `Bearer ${buyer1Token}` },
    })).json();
    // The seed may have existing conversations — find one for our listing
    const conv = convs.find(c => c.listingId === hmoId) || convs[0];
    if (!conv) return; // skip — no conversation exists

    // Buyer2 tries to read messages in buyer1's conversation
    const msgRes = await fetch(`${API}/conversations/${conv.id}/messages`, {
      headers: { Authorization: `Bearer ${buyer2Token}` },
    });
    // Should be 403 Forbidden
    expect(msgRes.status).toBe(403);
  });
});
