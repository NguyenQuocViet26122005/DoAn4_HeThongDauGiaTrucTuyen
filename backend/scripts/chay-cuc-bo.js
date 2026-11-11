const duongDan = require('node:path');
const { chuanBiMoiTruongCucBo } = require('./khoa-cuc-bo');

require('dotenv').config({ path: duongDan.join(__dirname, '../.env'), quiet: true });

async function chayCucBo() {
  chuanBiMoiTruongCucBo(process.env, duongDan.join(__dirname, '../.local'));

  const { khoiDongMayChu } = require('../src/may-chu');
  // --lan: nghe trên mọi địa chỉ để app di động VietBid trên điện thoại cùng mạng Wi-Fi gọi được.
  // Mặc định chỉ nghe 127.0.0.1 để máy khác trong mạng không truy cập được.
  const mangLan = process.argv.includes('--lan');

  await khoiDongMayChu(mangLan ? '0.0.0.0' : '127.0.0.1');
  console.log(
    `Chế độ cục bộ: đăng nhập/API đầy đủ, tác vụ tự động ${process.env.JOBS_ENABLED === 'false' ? 'tắt' : 'bật'}.`,
  );
  if (mangLan) {
    const diaChi = Object.values(require('node:os').networkInterfaces())
      .flat()
      .filter((muc) => muc && muc.family === 'IPv4' && !muc.internal)
      .map((muc) => `http://${muc.address}:${process.env.PORT || 5000}/api`);

    console.log(`Mạng LAN: app di động dùng EXPO_PUBLIC_API_URL = ${diaChi.join(' hoặc ')}`);
  }
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
