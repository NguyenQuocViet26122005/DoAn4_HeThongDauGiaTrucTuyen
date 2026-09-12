class LoiUngDung extends Error {
  constructor(trangThai, thongDiep) {
    super(thongDiep);
    this.status = trangThai;
  }
}
function baoDam(dieuKien, trangThai, thongDiep) {
  if (!dieuKien) throw new LoiUngDung(trangThai, thongDiep);
}
function batBuocTonTai(giaTri, thongDiep = 'Không tìm thấy dữ liệu') {
  baoDam(giaTri, 404, thongDiep);
  return giaTri;
}
const cungId = (a, b) => a != null && b != null && String(a) === String(b);
module.exports = { LoiUngDung, baoDam, batBuocTonTai, cungId };
