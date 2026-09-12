const { kiemTraDuLieuCongKhai } = require('../utils/du-lieu-cong-khai');
function xuLyHTTP(congViec, { status: trangThai = 200, message: thongDiep = 'Thành công' } = {}) {
  return async (yeuCau, phanHoi, tiepTheo) => {
    try {
      const duLieu = await congViec(yeuCau);
      kiemTraDuLieuCongKhai(duLieu);
      phanHoi.status(trangThai).json({ success: true, message: thongDiep, data: duLieu ?? null });
    } catch (loi) {
      tiepTheo(loi);
    }
  };
}
module.exports = xuLyHTTP;
