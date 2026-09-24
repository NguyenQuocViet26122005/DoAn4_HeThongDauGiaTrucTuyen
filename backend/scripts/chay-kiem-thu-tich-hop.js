const { spawnSync } = require('node:child_process');
const path = require('node:path');
// Cố định database kiểm thử; không để npm test:integration quét dữ liệu chính.
const tep = process.argv.includes('--api')
  ? 'tests/integration/api-day-du.test.js'
  : 'tests/integration/*.test.js';
const ketQua = spawnSync(process.execPath, ['--test', '--test-isolation=none', tep], {
  cwd: path.resolve(__dirname, '..'),
  env: {
    ...process.env,
    DB_NAME: 'doan4_daugia_kiem_thu_19',
    JOBS_ENABLED: 'false',
  },
  stdio: 'inherit',
  windowsHide: true,
});
if (ketQua.error) {
  console.error('Không chạy được kiểm thử:', ketQua.error.code);
}
process.exitCode = ketQua.status ?? 1;
