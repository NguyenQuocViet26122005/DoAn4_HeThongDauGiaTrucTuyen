import { LoiUngDung } from '../utils/loi';
function khongTimThay(yeuCau, phanHoi, tiepTheo) {
  tiepTheo(new LoiUngDung(404, 'API không tồn tại'));
}
function xuLyLoi(loi, yeuCau, phanHoi, tiepTheo) {
  if (phanHoi.headersSent) return tiepTheo(loi);
  let trangThai = loi instanceof LoiUngDung ? loi.status : 500;
  let thongDiep = loi instanceof LoiUngDung ? loi.message : 'Có lỗi máy chủ, vui lòng thử lại';
  if (loi.code === 'ER_DUP_ENTRY') {
    trangThai = 409;
    thongDiep = 'Dữ liệu đã tồn tại';
  }
  if (
    [
      'ER_NO_REFERENCED_ROW_2',
      'ER_ROW_IS_REFERENCED_2',
      'ER_CHECK_CONSTRAINT_VIOLATED',
      'ER_DATA_TOO_LONG',
      'WARN_DATA_TRUNCATED',
    ].includes(loi.code)
  ) {
    trangThai = 400;
    thongDiep = 'Dữ liệu không phù hợp ràng buộc hệ thống';
  }
  if (loi.type === 'entity.parse.failed') {
    trangThai = 400;
    thongDiep = 'JSON không hợp lệ';
  }
  if (loi.type === 'entity.too.large' || loi.code === 'LIMIT_FILE_SIZE') {
    trangThai = 413;
    thongDiep = 'Dữ liệu hoặc tệp quá lớn';
  }
  if (loi.name === 'MulterError' && trangThai === 500) {
    trangThai = 400;
    thongDiep = 'Tệp tải lên không hợp lệ';
  }
  if (trangThai >= 500)
    console.error('Request failed', { method: yeuCau.method, code: loi.code || loi.name });
  phanHoi.status(trangThai).json({ success: false, message: thongDiep });
}
export = { khongTimThay, xuLyLoi };
