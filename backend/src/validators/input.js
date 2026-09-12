const { ensure } = require('../utils/errors');
const { cents, amount } = require('../utils/money');
function text(value, label, max = 255, min = 1) {
  ensure(typeof value === 'string', 400, `${label} phải là chuỗi`);
  const result = value.trim();
  ensure(result.length >= min && result.length <= max, 400, `${label} phải dài ${min}–${max} ký tự`);
  return result;
}
function id(value, label = 'ID') {
  ensure((typeof value === 'string' || Number.isSafeInteger(value)) && /^[1-9]\d{0,19}$/.test(String(value)), 400, `${label} không hợp lệ`);
  ensure(BigInt(value) <= 18446744073709551615n, 400, `${label} vượt giới hạn`);
  return String(value);
}
function integer(value, label, min = 0, max = 1000000) {
  ensure((typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) && Number.isSafeInteger(Number(value)), 400, `${label} phải là số nguyên`);
  const n = Number(value);
  ensure(n >= min && n <= max, 400, `${label} ngoài giới hạn`);
  return n;
}
function choice(value, values, label) { ensure(values.includes(value), 400, `${label} không hợp lệ`); return value; }
function bool(value, label) { ensure([true, false, 0, 1].includes(value), 400, `${label} phải là true/false`); return value ? 1 : 0; }
function money(value, label, positive = false) { const n = cents(value, label); ensure(!positive || n > 0n, 400, `${label} phải lớn hơn 0`); return amount(n); }
function body(value, allowed) {
  ensure(value && typeof value === 'object' && !Array.isArray(value), 400, 'Nội dung JSON không hợp lệ');
  ensure(Object.keys(value).every(key => allowed.includes(key)), 400, 'Nội dung có trường không được phép');
  return value;
}
function pagination(query = {}) {
  const page = integer(query.page ?? 1, 'page', 1, 100000);
  const limit = integer(query.limit ?? 20, 'limit', 1, 100);
  return { page, limit, offset: (page - 1) * limit };
}
function email(value) {
  const result = text(value, 'Email', 150).toLowerCase();
  ensure(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result), 400, 'Email không hợp lệ');
  return result;
}
function password(value) {
  ensure(typeof value === 'string' && value.length >= 8 && Buffer.byteLength(value) <= 72, 400, 'Mật khẩu cần ít nhất 8 ký tự và tối đa 72 byte');
  return value;
}
function phone(value) { const result = text(value, 'Số điện thoại', 20); ensure(/^\+?[0-9 ()-]{8,20}$/.test(result), 400, 'Số điện thoại không hợp lệ'); return result; }
module.exports = { text, id, integer, choice, bool, money, body, pagination, email, password, phone };
