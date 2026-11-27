const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { join } = require('node:path');
const frontend = createRequire(join(__dirname, '../frontend/package.json'));
const origin = 'https://vietbid.alwaysdata.net';

async function main() {
  const health = await fetch(origin + '/api/health', { signal: AbortSignal.timeout(15000) });
  assert.equal(health.status, 200);
  const body = await health.json();
  assert.equal(body.data.database, 'connected');
  assert.equal(body.data.revision, process.env.EXPECTED_SHA);
  const version = await (
    await fetch(origin + '/version.json', { signal: AbortSignal.timeout(15000) })
  ).json();
  assert.equal(version.sha, process.env.EXPECTED_SHA);
  const login = await fetch(origin + '/dang-nhap', { signal: AbortSignal.timeout(15000) });
  assert.equal(login.status, 200);
  assert.match(await login.text(), /VietBid/);
  const socket = frontend('socket.io-client').io(origin, {
    transports: ['websocket'],
    timeout: 15000,
    reconnection: false,
  });
  try {
    await new Promise((resolve, reject) => {
      socket.once('connect', resolve);
      socket.once('connect_error', reject);
    });
  } finally {
    socket.close();
  }
  console.log('VERIFIED: API, MariaDB, frontend revision, SPA and WSS');
}

main().catch(() => {
  console.error('PUBLIC_DEPLOY_CHECK_FAILED');
  process.exitCode = 1;
});
