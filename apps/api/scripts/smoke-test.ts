/**
 * Boot smoke test: starts the built API, hits GET /health, expects 200 + {"status":"ok"}.
 * Fails CI if the API crashes at startup (TDZ, missing deps, config errors, etc).
 *
 * Key design choices:
 * - Does NOT rebuild (relies on turbo's `dependsOn: ["build"]`).
 * - Kills any leftover process on PORT before starting.
 * - Shows FULL stderr on failure — not just ERROR-filtered lines.
 * - Exits 0 on success, 1 on failure — simple CI gate.
 *
 * Usage: npx ts-node scripts/smoke-test.ts
 * Or via pnpm: pnpm test:e2e
 */

import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { execSync } from 'child_process';

const API_DIR = path.resolve(__dirname, '..');
const PORT = 3001;
const HEALTH_URL = `http://localhost:${PORT}/health`;
const BOOT_TIMEOUT_MS = 12000;

async function main(): Promise<void> {
  // 0. Free port if something is still running on it
  try {
    execSync(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null`, { stdio: 'pipe' });
  } catch {
    // no existing process — fine
  }

  // 1. Verify dist exists (turbo build should have run first)
  const mainJs = path.join(API_DIR, 'dist', 'src', 'main.js');
  try {
    require.resolve(mainJs);
  } catch {
    console.error(`[smoke] FATAL: dist not found at ${mainJs}. Run 'pnpm build --filter=api' first.`);
    process.exit(1);
  }

  // 2. Start server
  console.log(`[smoke] Starting API from ${mainJs} on port ${PORT}...`);
  const server = spawn('node', [mainJs], {
    cwd: API_DIR,
    stdio: 'pipe',
    env: { ...process.env, PORT: String(PORT) },
  });

  // Collect ALL stdout + stderr
  let stdout = '';
  let stderr = '';
  server.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
  server.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

  // 3. Wait for server to boot, then hit /health
  try {
    await waitForHealth(BOOT_TIMEOUT_MS);
    console.log('[smoke] PASS: /health returned {"status":"ok"}');
    server.kill();
    process.exit(0);
  } catch (err) {
    const msg = (err as Error).message;
    console.error(`[smoke] FAIL: ${msg}`);
    // Print FULL stderr — this catches any startup crash (TDZ, missing deps, etc.)
    if (stderr) {
      console.error('[smoke] --- FULL STDERR ---');
      console.error(stderr);
      console.error('[smoke] --- END STDERR ---');
    }
    if (stdout) {
      console.log('[smoke] --- STDOUT (last 30 lines) ---');
      const lines = stdout.trim().split('\n');
      console.log(lines.slice(-30).join('\n'));
      console.log('[smoke] --- END STDOUT ---');
    }
    server.kill();
    process.exit(1);
  }
}

function waitForHealth(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  return new Promise<void>((resolve, reject) => {
    const poll = () => {
      if (Date.now() > deadline) {
        reject(new Error(`Timed out after ${timeoutMs}ms — server never became ready`));
        return;
      }

      const req = http.get(HEALTH_URL, (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode === 200 && parsed.status === 'ok') {
              resolve();
            } else {
              reject(new Error(`Unexpected response: ${res.statusCode} ${data}`));
            }
          } catch {
            reject(new Error(`Invalid JSON from /health: ${data}`));
          }
        });
      });

      req.on('error', () => {
        // Server not ready yet — retry
        setTimeout(poll, 300);
      });

      req.end();
    };

    poll();
  });
}

main();