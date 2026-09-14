const { AsyncLocalStorage: LuuTruNguCanh } = require('node:async_hooks');
const nhomKetNoi = require('../config/co-so-du-lieu');
const { cauHinh } = require('../config/moi-truong');
const { LoiUngDung } = require('../utils/loi');
const nguCanh = new LuuTruNguCanh();
async function layKetNoi() {
  const ketNoi = await nhomKetNoi.getConnection();
  try {
    await ketNoi.query('SET time_zone = ?', [cauHinh.dbTimezone]);
    return ketNoi;
  } catch (loi) {
    ketNoi.release();
    throw loi;
  }
}
async function truyVan(sql, cacGiaTri = []) {
  const hienTai = nguCanh.getStore();
  const ketNoi = hienTai?.connection || (await layKetNoi());
  try {
    const [cacBanGhi] = await ketNoi.execute(sql, cacGiaTri);
    return cacBanGhi;
  } finally {
    if (!hienTai) ketNoi.release();
  }
}
async function layMot(sql, cacGiaTri = []) {
  return (await truyVan(sql, cacGiaTri))[0] || null;
}
async function thoiGianHienTai() {
  // Schema lưu DATETIME theo giây. Không đưa mili giây vào vì MySQL có thể
  // làm tròn sang giây tiếp theo, khiến lượt hợp lệ bị tính là sau khi đóng phiên.
  return (await layMot('SELECT CURRENT_TIMESTAMP AS now')).now;
}
async function giaoDich(congViec) {
  if (nguCanh.getStore()) return congViec();
  // Khi xung đột khóa, chạy lại toàn bộ transaction để giữ các thay đổi nhất quán.
  for (let lanThu = 0; lanThu < 3; lanThu++) {
    const ketNoi = await layKetNoi();
    const trangThaiXuLy = { connection: ketNoi, events: [] };
    try {
      await ketNoi.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
      await ketNoi.beginTransaction();
      const ketQua = await nguCanh.run(trangThaiXuLy, congViec);
      await ketNoi.commit();
      for (const suKien of trangThaiXuLy.events) {
        try {
          await suKien();
        } catch {
          console.error('Không gửi được sự kiện realtime sau commit');
        }
      }
      return ketQua;
    } catch (loi) {
      await ketNoi.rollback();
      if (['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'].includes(loi.code)) {
        if (lanThu < 2) continue;
        throw new LoiUngDung(409, 'Dữ liệu đang được xử lý, vui lòng thử lại');
      }
      throw loi;
    } finally {
      ketNoi.release();
    }
  }
}
function sauKhiCommit(congViec) {
  const trangThaiXuLy = nguCanh.getStore();
  if (trangThaiXuLy) trangThaiXuLy.events.push(congViec);
  else return congViec();
}
module.exports = { truyVan, layMot, thoiGianHienTai, giaoDich, sauKhiCommit, nhomKetNoi };
