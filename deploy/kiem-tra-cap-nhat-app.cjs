const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { verify, createHash } = require('node:crypto');
const record = JSON.parse(fs.readFileSync(path.join(process.argv[2], 'manifest.json')));
const manifest = JSON.parse(record.body);
const certificate = fs.readFileSync(path.join(__dirname, '../mobile/update-certificate.crt'));
async function main() {
  let response;
  for (let i = 0; i < 40; i++) {
    response = await fetch('https://vietbid.alwaysdata.net/api/mobile-updates', {
      headers: {
        'expo-protocol-version': '1',
        'expo-platform': 'android',
        'expo-runtime-version': manifest.runtimeVersion,
      },
      signal: AbortSignal.timeout(10000),
    }).catch(() => null);
    if (response?.status === 200) break;
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  assert.equal(response?.status, 200);
  const body = await response.text();
  assert.equal(body, record.body);
  const signature = response.headers.get('expo-signature')?.match(/sig="([A-Za-z0-9+/=]+)"/)?.[1];
  assert(
    signature &&
      verify('RSA-SHA256', Buffer.from(body), certificate, Buffer.from(signature, 'base64')),
  );
  for (const asset of [manifest.launchAsset, ...manifest.assets.slice(0, 1)]) {
    const file = await fetch(asset.url, { signal: AbortSignal.timeout(30000) });
    assert.equal(file.status, 200);
    assert.equal(
      createHash('sha256')
        .update(Buffer.from(await file.arrayBuffer()))
        .digest('base64url'),
      asset.hash,
    );
  }
  console.log('MOBILE_UPDATE_VERIFIED', manifest.id, manifest.runtimeVersion);
}
main().catch(() => {
  console.error('MOBILE_UPDATE_PUBLIC_CHECK_FAILED');
  process.exitCode = 1;
});
