const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function runtimeVersion() {
  const hash = createHash('sha256');
  for (const file of [
    'package.json',
    'package-lock.json',
    'app.json',
    'app.config.js',
    'update-certificate.crt',
  ]) {
    hash.update(file).update(fs.readFileSync(path.join(root, file)));
  }
  for (const file of fs.readdirSync(path.join(root, 'assets/images')).sort()) {
    hash.update(file).update(fs.readFileSync(path.join(root, 'assets/images', file)));
  }
  return 'vietbid-android-' + hash.digest('hex').slice(0, 32);
}

if (require.main === module) console.log(runtimeVersion());
module.exports = { runtimeVersion };
