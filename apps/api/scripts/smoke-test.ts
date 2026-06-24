/**
 * Smoke test: builds API, starts it, hits GET /health, expects 200 + {"status":"ok"}.
 * Exits 0 on success, 1 on failure.
 *
 * Usage: npx ts-node scripts/smoke-test.ts
 * Or via pnpm: pnpm test:e2e
 */

import { spawn, execSync } from 'child_process';
import http from 'http';
import path from 'path';

const API_DIR = path.resolve(__dirname, '..');
const PORT = 3001;
const HEALTH_URL = `http://localhost:${PORT}/health`;
const BOOT_TIMEOUT_MS = 8000;

async function main(): Promise<void> {
  // 1. Build
  console.log('[smoke] Building API...');
  execSync('npx nest build', { cwd: API_DIR, stdio: 'pipe' });
  console.log('[smoke] Build OK');

  // 2. Start server
  console.log('[smoke] Starting API...');
  const mainJs = path.join(API_DIR, 'dist', 'src', 'main.js');
  const server = spawn('node', [mainJs], {
    cwd: API_DIR,
    stdio: 'pipe',
    env: { ...process.env, PORT: String(PORT) },
  });

  // Collect stderr for debugging
  let stderr = '';
  server.stderr.on('data', (chunk: Buffer) => {
    stderr += chunk.toString();
  });

  // 3. Wait for server to boot, then hit /health

  try {
    await waitForHealth(BOOT_TIMEOUT_MS);

    // Health responded OK
    console.log('[smoke] Health check PASSED: got {"status":"ok"}');
    server.kill();
    process.exit(0);
  } catch (err) {
    console.error('[smoke] Health check FAILED:', (err as Error).message);
    if (stderr) {
      // Print only the error lines from startup
      const errorLines = stderr.split('\n').filter((l) => l.includes('ERROR') || l.includes('Error'));
      for (const line of errorLines) {
        console.error('[smoke]', line);
      }
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
        reject(new Error(`Timed out after ${timeoutMs}ms`));
        return;
      }

      const req = http.get(HEALTH_URL, (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode === 200 && parsed.status === 'ok') {
              resolve();
            } else {
              reject(new Error(`Unexpected response: ${res.statusCode} ${data}`));
            }
          } catch {
            reject(new Error(`Invalid JSON response: ${data}`));
          }
        });
      });

      req.on('error', () => {
        // Server not ready yet, retry
        setTimeout(poll, 300);
      });

      req.end();
    };

    poll();
  });
}

main();