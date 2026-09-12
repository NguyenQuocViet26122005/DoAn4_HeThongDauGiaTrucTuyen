const { ensure } = require('./errors');
const MAX_CENTS = 999999999999999n;
function cents(value, label = 'Số tiền') {
  ensure(['number', 'string'].includes(typeof value), 400, `${label} không hợp lệ`);
  const raw = String(value);
  ensure(/^\d{1,13}(\.\d{1,2})?$/.test(raw), 400, `${label} phải là số không âm, tối đa 2 chữ số thập phân`);
  const [whole, fraction = ''] = raw.split('.');
  const result = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  ensure(result <= MAX_CENTS, 400, `${label} vượt giới hạn`);
  return result;
}
function amount(value) {
  ensure(typeof value === 'bigint' && value >= 0n && value <= MAX_CENTS, 400, 'Số tiền vượt giới hạn');
  return `${value / 100n}.${String(value % 100n).padStart(2, '0')}`;
}
const min = (a, b) => a < b ? a : b;
const max = (a, b) => a > b ? a : b;
module.exports = { cents, amount, min, max, MAX_CENTS };
