const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const deploy = join(__dirname, '../../deploy');
const code = readFileSync(join(deploy, 'chay-alwaysdata.cjs'), 'utf8');
const config = Object.fromEntries(
  [
    'NODE_ENV',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'DB_TIMEZONE',
    'FRONTEND_URL',
    'JWT_SECRET',
    'WEB_DIST',
    'UPLOAD_ROOT',
    'JOBS_ENABLED',
    'AI_ENABLED',
    'TRUST_PROXY_HOPS',
  ].map((key) => [key, 'fixture-private-value']),
);

async function run(input, mode = 0o600) {
  let started = false;
  const errors = [];
  const process = {
    platform: 'linux',
    env: { IP: '::1', PORT: '8100' },
    argv: ['node', 'launcher', '--worker'],
  };

  vm.runInNewContext(code, {
    __dirname: deploy,
    process,
    console: { error: (...args) => errors.push(args) },
    require(name) {
      if (name === 'node:fs') {
        return { statSync: () => ({ mode }), readFileSync: () => JSON.stringify(input) };
      }
      if (name === 'node:path') {
        return require('node:path');
      }
      if (name === '../backend/dist/may-chu') {
        return {
          async khoiDongMayChu(host) {
            assert.equal(host, '::1');
            assert.equal(process.env.PORT, '8100');
            assert.equal(process.env.DB_PASSWORD, config.DB_PASSWORD);
            started = true;
          },
        };
      }
      throw new Error('Unexpected dependency');
    },
  });
  await new Promise(setImmediate);

  return {
    started,
    errors,
    process,
  };
}

test('Trình chạy cloud giữ IP/PORT do hosting cấp và nạp cấu hình riêng', async () => {
  assert.equal((await run(config)).started, true);
});

test('Cấu hình cloud sai khuôn bị chặn, lỗi không ghi bí mật ra log', async () => {
  for (const input of [{ ...config, PORT: '5000' }, { ...config, DB_PASSWORD: 123 }, {}, []]) {
    const result = await run(input);

    assert.equal(result.started, false);
    assert.equal(result.process.exitCode, 1);
    assert(!JSON.stringify(result.errors).includes(config.DB_PASSWORD));
  }
});

test('Trình chạy Linux từ chối cấu hình mà người dùng khác có thể đọc', async () => {
  assert.equal((await run(config, 0o644)).started, false);
});
