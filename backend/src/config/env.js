const path = require('node:path');
// Chỉ ứng dụng đọc cấu hình khi chạy; không xuất giá trị bí mật ra log/API.
require('dotenv').config({ path: path.join(__dirname, '../../.env'), quiet: true });
const config = {
  port: Number(process.env.PORT || 5000),
  origins: (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(x => x.trim()),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: '8h',
  dbTimezone: process.env.DB_TIMEZONE || '+07:00',
  jobsEnabled: process.env.JOBS_ENABLED !== 'false',
  jobIntervalMs: 60000,
  uploadRoot: path.join(__dirname, '../../uploads'),
};
function validateEnvironment() {
  const missing = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'].filter(key => !process.env[key]);
  if (missing.length) throw new Error(`Thiếu cấu hình: ${missing.join(', ')}`);
  if (Buffer.byteLength(config.jwtSecret) < 32) throw new Error('JWT_SECRET cần ít nhất 32 byte');
  if (!/^[+-](0\d|1[0-4]):[0-5]\d$/.test(config.dbTimezone)) throw new Error('DB_TIMEZONE phải có dạng +07:00');
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) throw new Error('PORT không hợp lệ');
}
module.exports = { config, validateEnvironment };
