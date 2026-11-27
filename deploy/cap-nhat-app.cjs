const fs = require('node:fs');
const path = require('node:path');
const { createHash, randomUUID, sign, verify } = require('node:crypto');
const assert = require('node:assert/strict');
const { runtimeVersion } = require('../mobile/scripts/runtime.cjs');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'mobile/dist-update');
const output = process.argv[2];
assert(output, 'OUTPUT_REQUIRED');
const destination = path.resolve(output);
fs.mkdirSync(path.join(destination, 'assets'), { recursive: true });
const metadata = JSON.parse(fs.readFileSync(path.join(source, 'metadata.json'))).fileMetadata
  .android;
function asset(file, ext, launch = false) {
  const resolved = path.resolve(source, file);
  assert(resolved.startsWith(source + path.sep), 'INVALID_ASSET_PATH');
  const bytes = fs.readFileSync(resolved);
  const hex = createHash('sha256').update(bytes).digest('hex');
  const hash = createHash('sha256').update(bytes).digest('base64url');
  fs.writeFileSync(path.join(destination, 'assets', hex), bytes);
  const types = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    ttf: 'font/ttf',
    otf: 'font/otf',
    json: 'application/json',
    mp3: 'audio/mpeg',
  };
  return {
    key: hex,
    hash,
    fileExtension: launch ? '.bundle' : '.' + ext,
    contentType: launch ? 'application/javascript' : types[ext] || 'application/octet-stream',
    url: 'https://vietbid.alwaysdata.net/api/mobile-updates/assets/' + hex,
  };
}
const config = JSON.parse(fs.readFileSync(path.join(source, 'expo-config.json')));
const manifest = {
  id: randomUUID(),
  createdAt: new Date().toISOString(),
  runtimeVersion: runtimeVersion(),
  launchAsset: asset(metadata.bundle, null, true),
  assets: metadata.assets.map((a) => asset(a.path, a.ext)),
  metadata: {},
  extra: { expoClient: config, revision: process.env.GITHUB_SHA },
};
const body = JSON.stringify(manifest);
const signature = sign('RSA-SHA256', Buffer.from(body), process.env.MOBILE_UPDATE_PRIVATE_KEY);
assert(
  verify(
    'RSA-SHA256',
    Buffer.from(body),
    fs.readFileSync(path.join(root, 'mobile/update-certificate.crt')),
    signature,
  ),
  'SIGNATURE_MISMATCH',
);
fs.writeFileSync(
  path.join(destination, 'manifest.json'),
  JSON.stringify({ body, signature: signature.toString('base64') }),
);
console.log('SIGNED_MOBILE_UPDATE', manifest.runtimeVersion, manifest.id, manifest.assets.length);
