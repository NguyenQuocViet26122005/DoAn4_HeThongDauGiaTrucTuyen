const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const express = require('express');
const test = require('node:test');
const { boDinhTuyenCapNhat } = require('../dist/routes/cap-nhat-mobile');

test('Cập nhật mobile tách runtime, trả chữ ký, giữ 204 khi không có bản mới và không lộ tệp riêng', async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'vietbid-mobile-update-'));
  const root = path.join(temp, '.local', 'updates');

  fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
  fs.mkdirSync(path.join(root, 'runtimes'));

  const runtime = 'vietbid-android-' + 'a'.repeat(32);
  const id = 'f7b53ddb-7930-4b23-9e2a-c193411c83c0';
  const body = JSON.stringify({ id, runtimeVersion: runtime });

  fs.writeFileSync(
    path.join(root, 'runtimes', runtime + '.json'),
    JSON.stringify({ body, signature: 'YWJjZA==' }),
  );

  const key = 'b'.repeat(64);

  fs.writeFileSync(path.join(root, 'assets', key), 'asset bytes');
  fs.writeFileSync(path.join(temp, 'secret'), 'PRIVATE');

  const app = express();

  app.use('/api', boDinhTuyenCapNhat(root));

  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  const origin = `http://127.0.0.1:${server.address().port}/api/mobile-updates`;
  const headers = {
    'expo-protocol-version': '1',
    'expo-platform': 'android',
    'expo-runtime-version': runtime,
  };

  try {
    const response = await fetch(origin, { headers });

    assert.equal(response.status, 200);
    assert.equal(await response.text(), body);
    assert.equal(response.headers.get('expo-signature'), 'sig="YWJjZA==", keyid="vietbid"');
    assert.equal(response.headers.get('expo-protocol-version'), '1');
    assert.equal(
      (await fetch(origin, { headers: { ...headers, 'expo-current-update-id': id } })).status,
      204,
    );
    assert.equal(
      (
        await fetch(origin, {
          headers: { ...headers, 'expo-runtime-version': 'vietbid-android-' + 'c'.repeat(32) },
        })
      ).status,
      204,
    );
    assert.equal(
      (await fetch(origin, { headers: { ...headers, 'expo-platform': 'ios' } })).status,
      400,
    );
    assert.equal((await fetch(origin)).status, 406);

    const asset = await fetch(origin + '/assets/' + key);

    assert.equal(asset.status, 200);
    assert.equal(await asset.text(), 'asset bytes');
    assert.match(asset.headers.get('cache-control'), /immutable/);
    for (const name of ['secret', '..%2Fsecret', 'd'.repeat(64)]) {
      assert.equal((await fetch(origin + '/assets/' + name)).status, 404);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
