class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
function ensure(condition, status, message) {
  if (!condition) throw new AppError(status, message);
}
function found(value, message = 'Không tìm thấy dữ liệu') {
  ensure(value, 404, message);
  return value;
}
const sameId = (a, b) => a != null && b != null && String(a) === String(b);
module.exports = { AppError, ensure, found, sameId };
