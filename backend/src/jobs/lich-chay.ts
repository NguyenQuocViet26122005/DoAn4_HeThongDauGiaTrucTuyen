import cacPhienDauGia = require('../repositories/dau-gia');
import cacDonHang = require('../repositories/don-hang');
import dichVuDauGia = require('../services/dau-gia');
import dichVuDonHang = require('../services/don-hang');
import cacDeNghi = require('../services/de-nghi-mua-tiep');
import { cauHinh } from '../config/moi-truong';
let dangChay = false;
let lanChayCuoi = null;
async function chayMotLuot() {
  if (dangChay) return { skipped: true };
  dangChay = true;
  let daXuLy = 0,
    thatBai = 0;
  try {
    const cacCongViec: Array<[() => Promise<import('../types/nghiep-vu').BanGhiSQL[]>, (id: string) => Promise<unknown>]> = [
      [cacPhienDauGia.denHan, dichVuDauGia.xuLyDenHan],
      [cacDonHang.denHan, dichVuDonHang.xuLyDenHan],
      [cacDonHang.deNghiDenHan, cacDeNghi.xuLyHetHan],
    ];
    for (const [timDuLieu, congViec] of cacCongViec) {
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
export = { batDau, chayMotLuot, trangThai };
