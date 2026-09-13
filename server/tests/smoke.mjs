#!/usr/bin/env node
/* Smoke-test: starts server on PORT, runs assertions, exits 0/1
   Usage: SMOKE_PORT=3999 node tests/smoke.mjs
 */
import { spawn } from 'child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = parseInt(process.env.SMOKE_PORT, 10) || 3999;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@clubafricain.tn';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';
const DB_PATH = `./smoke-test-${PORT}.db`;
const base = `http://127.0.0.1:${PORT}`;

let serverProc;
let killedByUs = false;
let fail = 0;

function assert(cond, msg) {
  if (!cond) { fail++; console.error('FAIL', msg); }
  else console.log('OK  ', msg);
}

function request(method, urlPath, { body, token } = {}) {
  const url = new URL(urlPath, base);
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d || '{}') }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(new Error('timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  serverProc = spawn(process.execPath, ['index.js'], {
    cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    env: { ...process.env, PORT: String(PORT), DB_PATH, MAILER: 'console', RATE_LIMIT_ENABLED: 'false' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProc.stdout.on('data', (c) => process.stdout.write(c));
  serverProc.stderr.on('data', (c) => process.stderr.write(c));
  serverProc.on('exit', (code) => {
    if (!killedByUs && code !== 0 && !fail) console.error(`server exited with code ${code}`);
  });

  await new Promise((r) => setTimeout(r, 3000));

  try {
    const sports = await request('GET', '/api/sports');
    assert(sports.status === 200 && Array.isArray(sports.body), 'GET /api/sports 200 array');

    const smokemail = `smoke-${Date.now()}@test.tn`;
    const signup = await request('POST', '/auth/signup', { body: { email: smokemail, password: 'Test123456', username: `smoke${Date.now()}` } });
    assert(signup.status === 201 && signup.body.access_token, 'signup 201 token');
    const userToken = signup.body.access_token;

    const bal = await request('GET', '/api/balances', { token: userToken });
    assert(bal.status === 200 && Array.isArray(bal.body) && typeof bal.body[0].cat_coins === 'number', 'GET /api/balances 200 array');

    const weak = await request('POST', '/auth/signup', { body: { email: smokemail, password: 'short', username: 'dup' } });
    assert(weak.status === 400, 'signup weak pw 400');

    const signin = await request('POST', '/auth/signin', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
    assert(signin.status === 200 && signin.body.access_token, 'admin signin 200');
    const adminToken = signin.body.access_token;

    const stats = await request('GET', '/api/admin/stats', { token: adminToken });
    assert(stats.status === 200 && typeof stats.body.users === 'number', 'admin/stats 200');

    const members = await request('GET', '/api/community/members');
    assert(members.status === 200 && Array.isArray(members.body), 'community/members 200');

    const orders = await request('GET', '/api/orders', { token: userToken });
    assert(orders.status === 200 && Array.isArray(orders.body), 'orders 200');

    const forgot = await request('POST', '/auth/forgot-password', { body: { email: smokemail } });
    assert(forgot.status === 200, 'forgot-password 200');

    const pwShort = await request('POST', '/auth/change-password', { body: { current_password: 'Test123456', new_password: 'short' }, token: userToken });
    assert(pwShort.status === 400, 'change pw weak 400');

    const pwGood = await request('POST', '/auth/change-password', { body: { current_password: 'Test123456', new_password: 'NewPass123' }, token: userToken });
    assert(pwGood.status === 200, 'change pw 200');

    const afterPwChange = await request('GET', '/api/balances', { token: userToken });
    assert(afterPwChange.status === 401, 'old session invalid after pw change 401');
  } finally {
    killedByUs = true;
    if (serverProc && !serverProc.killed) serverProc.kill('SIGTERM');
    await new Promise((r) => setTimeout(r, 500));
    try { const fs = await import('node:fs'); fs.unlinkSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', DB_PATH)); } catch {}
    try { const fs = await import('node:fs'); fs.unlinkSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', DB_PATH + '-wal')); } catch {}
    try { const fs = await import('node:fs'); fs.unlinkSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', DB_PATH + '-shm')); } catch {}
  }
}

await run().then(() => {
  console.log(fail ? `\n${fail} check(s) failed` : '\nAll checks passed');
  process.exit(fail ? 1 : 0);
}).catch((e) => {
  console.error('SMOKE ERROR', e);
  process.exit(1);
});