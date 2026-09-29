const duongDan = require('node:path');
const { chuanBiMoiTruongCucBo } = require('./khoa-cuc-bo');

require('dotenv').config({ path: duongDan.join(__dirname, '../.env'), quiet: true });

async function chayCucBo() {
  chuanBiMoiTruongCucBo(process.env, duongDan.join(__dirname, '../.local'));

  const { khoiDongMayChu } = require('../src/may-chu');

  await khoiDongMayChu('127.0.0.1');
  console.log('Chế độ cục bộ: đăng nhập/API đầy đủ, tác vụ tự động tắt.');
}

chayCucBo().catch(async (loi) => {
  console.error(
    'Không thể chạy cục bộ:',
    /^(Chế độ cục bộ|JWT_SECRET|Thiếu cấu hình|DB_TIMEZONE|PORT)/.test(loi.message)
      ? loi.message
      : loi.code || 'Kiểm tra cấu hình máy chủ',
  );
  await require('../src/repositories/ket-noi').nhomKetNoi.end();
  process.exitCode = 1;
});
