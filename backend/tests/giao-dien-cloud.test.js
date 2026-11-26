const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { ungDungKemGiaoDien } = require('../dist/may-chu');

test('SPA chạy trong .releases, giữ 404 cho tài nguyên thiếu và tệp ẩn', async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'vietbid-spa-'));
  const web = path.join(temp, '.releases', 'fixture', 'frontend', 'dist');

  fs.mkdirSync(web, { recursive: true });
  fs.writeFileSync(path.join(web, 'index.html'), '<title>VietBid fixture</title>');
  fs.writeFileSync(path.join(web, '.private'), 'must remain hidden');

  const server = http.createServer(ungDungKemGiaoDien(web));

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  const origin = `http://127.0.0.1:${server.address().port}`;

  try {
    for (const route of ['/', '/dang-nhap', '/nguoi-ban/san-pham']) {
      const response = await fetch(origin + route, { headers: { Accept: 'text/html' } });

      assert.equal(response.status, 200);
      assert.match(await response.text(), /VietBid fixture/);
    }
    for (const route of ['/assets/missing.js', '/.private', '/api/missing']) {
      assert.equal((await fetch(origin + route)).status, 404);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
