const { AppError } = require('../utils/errors');
function notFound(req, res, next) { next(new AppError(404, 'API không tồn tại')); }
function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let status = error instanceof AppError ? error.status : 500;
  let message = error instanceof AppError ? error.message : 'Có lỗi máy chủ, vui lòng thử lại';
  if (error.code === 'ER_DUP_ENTRY') { status = 409; message = 'Dữ liệu đã tồn tại'; }
  if (['ER_NO_REFERENCED_ROW_2','ER_ROW_IS_REFERENCED_2','ER_CHECK_CONSTRAINT_VIOLATED','ER_DATA_TOO_LONG','WARN_DATA_TRUNCATED'].includes(error.code)) { status = 400; message = 'Dữ liệu không phù hợp ràng buộc hệ thống'; }
  if (error.type === 'entity.parse.failed') { status = 400; message = 'JSON không hợp lệ'; }
  if (error.type === 'entity.too.large' || error.code === 'LIMIT_FILE_SIZE') { status = 413; message = 'Dữ liệu hoặc tệp quá lớn'; }
  if (error.name === 'MulterError' && status === 500) { status = 400; message = 'Tệp tải lên không hợp lệ'; }
  if (status >= 500) console.error('Request failed', { method: req.method, code: error.code || error.name });
  res.status(status).json({ success: false, message });
}
module.exports = { notFound, errorHandler };
