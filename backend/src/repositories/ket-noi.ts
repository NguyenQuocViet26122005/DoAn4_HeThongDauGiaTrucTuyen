import type { NguCanhGiaoDich, BanGhiSQL } from '../types/nghiep-vu';
import { AsyncLocalStorage as LuuTruNguCanh } from 'node:async_hooks';
import nhomKetNoi = require('../config/co-so-du-lieu');
import { cauHinh } from '../config/moi-truong';
import { LoiUngDung } from '../utils/loi';
const nguCanh = new LuuTruNguCanh<NguCanhGiaoDich>();

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

async function truyVan<T = BanGhiSQL[]>(sql: string, cacGiaTri: unknown[] = []): Promise<T> {
  const hienTai = nguCanh.getStore();
  const ketNoi = hienTai?.connection || (await layKetNoi());

  try {
    const [cacBanGhi] = await ketNoi.execute(sql, cacGiaTri as import('mysql2').ExecuteValues);

    return cacBanGhi as T;
  } finally {
    if (!hienTai) {
      ketNoi.release();
    }
  }
}

async function layMot<T = BanGhiSQL>(sql: string, cacGiaTri: unknown[] = []): Promise<T | null> {
  return (await truyVan<T[]>(sql, cacGiaTri))[0] || null;
}

async function thoiGianHienTai() {
  // Schema lưu DATETIME theo giây. Không đưa mili giây vào vì MySQL có thể
  // làm tròn sang giây tiếp theo, khiến lượt hợp lệ bị tính là sau khi đóng phiên.
  return (await layMot('SELECT CURRENT_TIMESTAMP AS now')).now;
}

async function giaoDich<T>(congViec: () => Promise<T>): Promise<T> {
  if (nguCanh.getStore()) {
    return congViec();
  }
  // Khi xung đột khóa, chạy lại toàn bộ transaction để giữ các thay đổi nhất quán.
  for (let lanThu = 0; lanThu < 3; lanThu++) {
    const ketNoi = await layKetNoi();
    const trangThaiXuLy: NguCanhGiaoDich = { connection: ketNoi, events: [] };

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
        if (lanThu < 2) {
          continue;
        }
        throw new LoiUngDung(409, 'Dữ liệu đang được xử lý, vui lòng thử lại');
      }
      throw loi;
    } finally {
      ketNoi.release();
    }
  }
}

function sauKhiCommit(congViec: () => unknown | Promise<unknown>) {
  const trangThaiXuLy = nguCanh.getStore();

  if (trangThaiXuLy) {
    trangThaiXuLy.events.push(congViec);
  } else {
    return congViec();
  }
}

export {
  truyVan,
  layMot,
  thoiGianHienTai,
  giaoDich,
  sauKhiCommit,
  nhomKetNoi,
};
