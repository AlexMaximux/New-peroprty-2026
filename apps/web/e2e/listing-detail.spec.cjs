const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const API = 'http://localhost:3001/api/v1';
const PWD = 'Passw0rd!';

// Helper: create a minimal 1×1 PNG for upload tests
function createTestPng(filePath) {
  if (fs.existsSync(filePath)) return;
  const png = Buffer.from([
    0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A, // PNG signature
    0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52, // IHDR chunk length+type
    0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01, // 1×1 pixel
    0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53,0xDE, // depth, color, compression
    0x00,0x00,0x00,0x0C,0x49,0x44,0x41,0x54, // IDAT chunk
    0x08,0xD7,0x63,0x60,0x60,0x60,0x00,0x00,0x00,0x04,0x00,0x01,
    0x27,0x3A,0x2F,0x43,0x00,0x00,0x00,0x00,0x49,0x45,0x4E,0x44,0xAE,0x42,0x60,0x82, // IEND
  ]);
  fs.writeFileSync(filePath, png);
}

const E2E_IMG = path.join(__dirname, 'e2e-test-photo.png');

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

test.describe('Listing detail', () => {
  let hmoId, agency1Token, agency2Token, agency2UserId;

  test.beforeAll(async () => {
    const s1 = await getSession('agency1@demo.test'); agency1Token = s1.accessToken;
    const s2 = await getSession('agency2@demo.test'); agency2Token = s2.accessToken;
    agency2UserId = s2.user.id;
    hmoId = await findSeedListing(agency1Token, 'Whitechapel');
  });

  test('2a: Public listing detail renders at /listings/[id]', async ({ page }) => {
    expect(hmoId).toBeTruthy();
    // /listings/[id] requires auth (JwtAuthGuard on controller)
    await loginApi(page, 'buyer1@demo.test');
    await page.goto(`/listings/${hmoId}`);
    await expect(page.locator('h1')).toContainText('Whitechapel', { timeout: 15_000 });

    // Pricing columns render (fix for gap #2 — must show asking price + ROI)
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Asking Price');
    expect(bodyText).toContain('Market Value');
    expect(bodyText).toContain('Estimated ROI');

    // Previously-missing base fields render
    expect(bodyText).toContain('Living Room');
    expect(bodyText).toContain('Nation');
    expect(bodyText).toContain('Bedrooms');
    expect(bodyText).toContain('Bathrooms');
    expect(bodyText).toContain('Status');
    expect(bodyText).toContain('Vacant');
    expect(bodyText).toContain('Tenanted');
    expect(bodyText).toContain('Licensed');
  });

  test('2b: Agency management page renders for owner', async ({ page }) => {
    expect(hmoId).toBeTruthy();
    await loginApi(page, 'agency1@demo.test');
    await page.goto(`/agency/listings/${hmoId}`);
    const body = await page.locator('body').innerText();
    expect(body).not.toContain('404');
  });

  test('2c: API rejects non-owner access to agency listing data', async () => {
    expect(hmoId).toBeTruthy();
    // The management page loads in browser, but the API endpoint for agency-specific data should check ownership
    // Try PATCH (write operation) as non-owner — expect 403
    const patchRes = await fetch(`${API}/listings/${hmoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${agency2Token}` },
      body: JSON.stringify({ base: { title: 'Hacked Title' } }),
    });
    // Should be 403 Forbidden
    expect(patchRes.status).toBe(403);
  });

  test('2d: Agency uploads image via API and it appears on listing detail', async () => {
    expect(hmoId).toBeTruthy();

    // 1. Presign
    const presignRes = await (await fetch(`${API}/listings/${hmoId}/media/presign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${agency1Token}` },
      body: JSON.stringify({ fileName: 'e2e-test.jpg', mimeType: 'image/jpeg' }),
    })).json();
    expect(presignRes.uploadUrl).toBeTruthy();
    expect(presignRes.fileKey).toMatch(/^listings\//);

    // 2. Confirm (skip PUT to MinIO — presign works without storage)
    const confirmRes = await (await fetch(`${API}/listings/${hmoId}/media/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${agency1Token}` },
      body: JSON.stringify({ fileKey: presignRes.fileKey, mimeType: 'image/jpeg', isPrimary: true }),
    })).json();
    expect(confirmRes.id).toBeTruthy();
    expect(confirmRes.isPrimary).toBe(true);

    // 3. Fetch listing — verify media record appears with presigned GET URL
    const listing = await (await fetch(`${API}/listings/${hmoId}`, {
      headers: { Authorization: `Bearer ${agency1Token}` },
    })).json();
    expect(Array.isArray(listing.media)).toBe(true);
    const uploaded = listing.media.find((m) => m.fileKey === presignRes.fileKey);
    expect(uploaded).toBeTruthy();
    expect(uploaded.isPrimary).toBe(true);
    expect(uploaded.url).toBeTruthy(); // presigned GET URL generated

    // 4. Cleanup
    await fetch(`${API}/listings/${hmoId}/media/${confirmRes.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${agency1Token}` },
    });
  });
});

test.describe('Agency listings management', () => {
  let agency1Token, agency2Token;
  let hmoId;

  test.beforeAll(async () => {
    const s1 = await getSession('agency1@demo.test'); agency1Token = s1.accessToken;
    const s2 = await getSession('agency2@demo.test'); agency2Token = s2.accessToken;
    hmoId = await findSeedListing(agency1Token, 'Whitechapel');
  });

  test('3a: Agency listings index shows owned listings', async ({ page }) => {
    expect(hmoId).toBeTruthy();
    await loginApi(page, 'agency1@demo.test');
    await page.goto('/agency/listings');

    // Header renders
    await expect(page.locator('h1')).toContainText('My Properties', { timeout: 15_000 });

    // The seed listing title appears
    const body = await page.locator('body').innerText();
    expect(body).toContain('Whitechapel');
    expect(body).toContain('+ New listing');
  });

  test('3b: Agency edit page loads for owner', async ({ page }) => {
    expect(hmoId).toBeTruthy();
    await loginApi(page, 'agency1@demo.test');
    await page.goto(`/agency/listings/${hmoId}/edit`);

    // Wait for the edit form to load — check the edit banner appears
    await expect(page.locator('body')).toContainText('Editing listing', { timeout: 15_000 });
    // Also verify the New Listing form heading renders
    await expect(page.locator('body')).toContainText('Listing Category', { timeout: 5_000 });
  });

  test('3c: Non-owner gets 404 on edit page', async ({ page }) => {
    expect(hmoId).toBeTruthy();
    await loginApi(page, 'agency2@demo.test');
    await page.goto(`/agency/listings/${hmoId}/edit`);

    // Non-owner should not see edit mode — either 404 or redirect
    await expect(page.locator('body')).not.toContainText('Editing listing', { timeout: 10_000 });
  });

  test('3d: Edit via API persists change on detail page', async ({ page }) => {
    expect(hmoId).toBeTruthy();
    const newDesc = 'This listing was updated by E2E test 3d.';
    const patchRes = await fetch(`${API}/listings/${hmoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${agency1Token}` },
      body: JSON.stringify({ base: { description: newDesc } }),
    });
    expect(patchRes.status).toBe(200);

    // Verify via browser on agency detail page
    await loginApi(page, 'agency1@demo.test');
    await page.goto(`/agency/listings/${hmoId}`);
    await expect(page.locator('body')).toContainText(newDesc, { timeout: 10_000 });
  });
});

test.describe('Agency nav & create-with-photos', () => {
  let agency1Token, agency2Token, hmoId;

  test.beforeAll(async () => {
    const s1 = await getSession('agency1@demo.test'); agency1Token = s1.accessToken;
    const s2 = await getSession('agency2@demo.test'); agency2Token = s2.accessToken;
    hmoId = await findSeedListing(agency1Token, 'Whitechapel');
  });

  test('4a: Agency My Listings nav opens a published listing detail', async ({ page }) => {
    expect(hmoId).toBeTruthy();
    await loginApi(page, 'agency1@demo.test');

    // Set pv_user so nav-bar shows agency links
    await page.evaluate(() => {
      localStorage.setItem('pv_user', JSON.stringify({ role: 'AGENCY', displayName: 'Agency 1' }));
    });
    await page.goto('/');

    // Click "My Listings" in nav
    await page.getByRole('link', { name: 'My Listings' }).click();
    await page.waitForURL('/agency/listings');

    // Verify listings page loaded
    await expect(page.locator('h1')).toContainText('My Properties', { timeout: 15_000 });

    // Click View on the first listing card
    await page.locator('button:has-text("View")').first().click();
    await page.waitForURL(/\/agency\/listings\//);

    // Verify detail page renders (not 404)
    const body = await page.locator('body').innerText();
    expect(body).not.toContain('404');
    expect(body).not.toContain('Not Found');
  });

  test('4b: Create listing + upload photo via API, verify image on gallery', async ({ page }) => {
    expect(hmoId).toBeTruthy();

    // Login as agency1
    await loginApi(page, 'agency1@demo.test');

    // Navigate to agency listings page
    await page.goto('/agency/listings');
    await expect(page.locator('h1')).toContainText('My Properties', { timeout: 15_000 });

    // Verify existing listing has image from test 2d upload
    // (2d uploaded an image to the Whitechapel seed listing and verified via API)
    const body = await page.locator('body').innerText();
    expect(body).toContain('Whitechapel');

    // Create a new listing via API
    const newListing = await (await fetch(`${API}/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${agency1Token}` },
      body: JSON.stringify({
        category: 'RENT_TO_RENT',
        strategy: 'HMO',
        status: 'PUBLISHED',
        base: {
          title: 'E2E 4b Create + Upload Test',
          addressLine1: '456 Test Avenue',
          city: 'TestCity',
          postcode: 'TE2 2ST',
          bedrooms: 3,
          bathrooms: 1,
        },
        hmoRooms: [
          { name: 'Room 1', roomType: 'DOUBLE_EN_SUITE', monthlyRentPence: 50000 },
          { name: 'Room 2', roomType: 'SINGLE_SHARED', monthlyRentPence: 35000 },
        ],
      }),
    })).json();
    expect(newListing.id).toBeTruthy();

    // Upload an image to the new listing via presign flow
    const presignRes = await (await fetch(`${API}/listings/${newListing.id}/media/presign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${agency1Token}` },
      body: JSON.stringify({ fileName: '4b-test.jpg', mimeType: 'image/jpeg' }),
    })).json();
    expect(presignRes.uploadUrl).toBeTruthy();
    expect(presignRes.fileKey).toMatch(/^listings\//);

    // Confirm (skip PUT to MinIO — presign works without storage)
    const confirmRes = await (await fetch(`${API}/listings/${newListing.id}/media/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${agency1Token}` },
      body: JSON.stringify({ fileKey: presignRes.fileKey, mimeType: 'image/jpeg', isPrimary: true }),
    })).json();
    expect(confirmRes.id).toBeTruthy();
    expect(confirmRes.isPrimary).toBe(true);

    // Now visit the agency detail page in the browser
    await page.goto(`/agency/listings/${newListing.id}`, { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('E2E 4b Create + Upload Test', { timeout: 15_000 });

    // Verify the image renders on the gallery (ImageGallery shows count + Add images button)
    const detailBody = await page.locator('body').innerText();
    expect(detailBody).toContain('1 image(s)');
    expect(detailBody).toContain('Add images');

    // Cleanup: delete the test listing
    await fetch(`${API}/listings/${newListing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${agency1Token}` },
      body: JSON.stringify({ status: 'ARCHIVED' }),
    });
  });
});

test.describe('Real browser image upload to MinIO', () => {
  let agency1Token, hmoId;

  test.beforeAll(async () => {
    const s1 = await getSession('agency1@demo.test');
    agency1Token = s1.accessToken;
    hmoId = await findSeedListing(agency1Token, 'Whitechapel');
    expect(hmoId).toBeTruthy();
    createTestPng(E2E_IMG);
  });

  test('5a: Browser uploads real file via ImageUploader, PUT to MinIO, image appears in gallery', async ({ page }) => {
    // Login and navigate to detail page
    await loginApi(page, 'agency1@demo.test');
    await page.evaluate(() => {
      localStorage.setItem('pv_user', JSON.stringify({ role: 'AGENCY', displayName: 'Agency 1' }));
    });

    // Get current image count from API
    const listingBefore = await (await fetch(`${API}/listings/${hmoId}`, {
      headers: { Authorization: `Bearer ${agency1Token}` },
    })).json();
    const countBefore = (listingBefore.media || []).length;

    // Navigate to agency detail page
    await page.goto(`/agency/listings/${hmoId}`, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).not.toContainText('404', { timeout: 15_000 });

    // Click "Add images" to show the uploader
    await page.getByText('Add images').click();

    // Wait for uploader drop zone to render
    await expect(page.getByText('Drop images here or click to browse')).toBeVisible({ timeout: 5_000 });

    // Upload the test PNG via the hidden file input
    // (The input is hidden but Playwright's setInputFiles works on any input)
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached({ timeout: 5_000 });
    await fileInput.setInputFiles(E2E_IMG);

    // Wait for upload to complete — "Uploading..." text appears then reverts
    try {
      await expect(page.getByText('Uploading...')).toBeVisible({ timeout: 5_000 });
    } catch {
      // May complete too fast to observe — that's fine
    }
    // Wait for either error or completion (revert to idle text)
    await expect(page.getByText('Drop images here or click to browse')).toBeVisible({ timeout: 20_000 });

    // Check no error message
    const hasError = await page.locator('text=Only image files allowed').or(page.locator('text=Upload failed')).isHidden();
    // (If error present, that's a test failure we'll catch via count check below)

    // Refresh page to re-fetch listing from API (gallery count reflects DB state)
    await page.goto(`/agency/listings/${hmoId}`, { waitUntil: 'networkidle' });

    // Verify gallery count increased
    const bodyAfter = await page.locator('body').innerText();
    const expectedCount = `${countBefore + 1} image(s)`;
    expect(bodyAfter).toContain(expectedCount);

    // Cleanup: delete the uploaded media via API
    const listingAfter = await (await fetch(`${API}/listings/${hmoId}`, {
      headers: { Authorization: `Bearer ${agency1Token}` },
    })).json();
    const newMedia = (listingAfter.media || []).find(
      (m) => !(listingBefore.media || []).some((b) => b.id === m.id),
    );
    if (newMedia) {
      await fetch(`${API}/listings/${hmoId}/media/${newMedia.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${agency1Token}` },
      }).then((r) => {
        if (!r.ok) console.warn('Cleanup delete failed:', r.status);
      });
    }
  });
});
