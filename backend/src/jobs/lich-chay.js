const cacPhienDauGia = require('../repositories/dau-gia');
const cacDonHang = require('../repositories/don-hang');
const dichVuDauGia = require('../services/dau-gia');
const dichVuDonHang = require('../services/don-hang');
const cacDeNghi = require('../services/de-nghi-mua-tiep');
const { cauHinh } = require('../config/moi-truong');
let dangChay = false;
let lanChayCuoi = null;
async function chayMotLuot() {
  if (dangChay) return { skipped: true };
  dangChay = true;
  let daXuLy = 0,
    thatBai = 0;
  try {
    for (const [timDuLieu, congViec] of [
      [cacPhienDauGia.denHan, dichVuDauGia.xuLyDenHan],
      [cacDonHang.denHan, dichVuDonHang.xuLyDenHan],
      [cacDonHang.deNghiDenHan, cacDeNghi.xuLyHetHan],
      [cacPhienDauGia.sapKetThuc, dichVuDauGia.nhacPhienSapKetThuc],
      [cacDonHang.canNhacNho, dichVuDonHang.nhacThanhToan],
    ]) {
      let cacBanGhi;
      try {
        cacBanGhi = await timDuLieu();
      } catch (loi) {
        thatBai++;
        console.error('Lỗi truy vấn tác vụ:', loi.code || loi.name);
        continue;
      }
      for (const banGhi of cacBanGhi) {
        try {
          await congViec(banGhi.id);
          daXuLy++;
        } catch (loi) {
          thatBai++;
          console.error('Lỗi xử lý tác vụ:', { id: banGhi.id, code: loi.code || loi.name });
        }
      }
    }
    lanChayCuoi = { time: new Date().toISOString(), processed: daXuLy, failed: thatBai };
    return lanChayCuoi;
  } finally {
    dangChay = false;
  }
}
function batDau() {
  if (!cauHinh.jobsEnabled) return async () => {};
  const boHenGio = setInterval(
    () => chayMotLuot().catch(() => console.error('Lỗi chu kỳ tác vụ')),
    cauHinh.jobIntervalMs,
  );
  boHenGio.unref();
  // Chu kỳ đầu bắt đầu sau một khoảng hẹn; không quét dữ liệu ngay khi vừa khởi động.
  return async () => {
    clearInterval(boHenGio);
    while (dangChay) await new Promise((giaiQuyet) => setTimeout(giaiQuyet, 25));
  };
}
const trangThai = () => ({
  enabled: cauHinh.jobsEnabled,
  running: dangChay,
  lastRun: lanChayCuoi,
  interval_ms: cauHinh.jobIntervalMs,
});
module.exports = { batDau, chayMotLuot, trangThai };
