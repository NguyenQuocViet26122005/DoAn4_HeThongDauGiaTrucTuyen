const { runtimeVersion } = require('./scripts/runtime.cjs');

module.exports = ({ config }) => ({
  ...config,
  runtimeVersion: runtimeVersion(),
  updates: {
    url: 'https://vietbid.alwaysdata.net/api/mobile-updates',
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
    codeSigningCertificate: './update-certificate.crt',
    codeSigningMetadata: { keyid: 'vietbid', alg: 'rsa-v1_5-sha256' },
  },
  android: {
    ...config.android,
    versionCode: 100000 + Number(process.env.GITHUB_RUN_NUMBER || 0),
  },
});
