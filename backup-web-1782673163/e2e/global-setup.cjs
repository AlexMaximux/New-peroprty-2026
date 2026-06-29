/**
 * Playwright global setup — seeds demo data fresh before every test run.
 * Runs once before all tests, before the webServer entries start.
 */
const { execSync } = require('child_process');
const path = require('path');

async function globalSetup() {
  console.log('\n[global-setup] Seeding demo database...');
  execSync('pnpm --filter @propvest/api db:seed-demo', {
    cwd: path.resolve(__dirname, '..', '..'),
    stdio: 'inherit',
    env: { ...process.env },
  });
  console.log('[global-setup] Database seeded.\n');
}

module.exports = globalSetup;
