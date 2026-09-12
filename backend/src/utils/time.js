const { config } = require('../config/env');
const { ensure } = require('./errors');
function date(value) {
  if (value instanceof Date) return value;
  return new Date(String(value).replace(' ', 'T') + (/Z$|[+-]\d\d:\d\d$/.test(String(value)) ? '' : config.dbTimezone));
}
function sqlDate(value) {
  const d = date(value);
  const sign = config.dbTimezone[0] === '-' ? -1 : 1;
  const minutes = Number(config.dbTimezone.slice(1, 3)) * 60 + Number(config.dbTimezone.slice(4));
  return new Date(d.getTime() + sign * minutes * 60000).toISOString().slice(0, 19).replace('T', ' ');
}
function inputDate(value, label) {
  ensure(typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d(\.\d{1,3})?)?(Z|[+-]\d\d:\d\d)$/.test(value), 400, `${label} phải là thời gian ISO có múi giờ`);
  ensure(Number.isFinite(new Date(value).getTime()), 400, `${label} không hợp lệ`);
  return sqlDate(new Date(value));
}
const addSeconds = (value, seconds) => sqlDate(new Date(date(value).getTime() + seconds * 1000));
const expired = (deadline, now) => deadline != null && date(deadline).getTime() <= date(now).getTime();
module.exports = { date, sqlDate, inputDate, addSeconds, expired };
