import http = require('node:http');
import { Server as MayChuSocket } from 'socket.io';
import { cauHinh, kiemTraMoiTruong } from './config/moi-truong';
import ungDung = require('./ung-dung');
import coSoDuLieu = require('./repositories/ket-noi');
import cacSuKien = require('./sockets/su-kien');
async function khoiDongMayChu() {
  kiemTraMoiTruong();
  await coSoDuLieu.layMot('SELECT 1 AS ok');
  const mayChu = http.createServer(ungDung);
  const io = new MayChuSocket(mayChu, {
    cors: { origin: cauHinh.origins },
    maxHttpBufferSize: 16384,
  });
  require('./sockets/ket-noi').khoiTao(io);
  await new Promise<void>((giaiQuyet, tuChoi) => {
    mayChu.once('error', tuChoi);
    mayChu.listen(cauHinh.port, giaiQuyet);
  });
  console.log(`Backend: http://localhost:${cauHinh.port} — MySQL đã kết nối`);
  const dungTacVu = require('./jobs/lich-chay').batDau();
  let dangDung = false;
  const dung = async () => {
    if (dangDung) return;
    dangDung = true;
    await dungTacVu();
    await new Promise<void>((giaiQuyet) => io.close(() => giaiQuyet()));
    if (mayChu.listening) await new Promise<void>((giaiQuyet) => mayChu.close(() => giaiQuyet()));
    await coSoDuLieu.nhomKetNoi.end();
  };
  for (const tinHieu of ['SIGINT', 'SIGTERM'])
    process.once(tinHieu, () =>
      dung().catch(() => {
        process.exitCode = 1;
      }),
    );
  return { server: mayChu, io, stop: dung };
}
if (require.main === module)
  khoiDongMayChu().catch(async (loi) => {
    console.error(
      'Không thể khởi động backend:',
      loi.code ||
        (/^(Thiếu cấu hình|JWT_SECRET|DB_TIMEZONE|PORT)/.test(loi.message)
          ? loi.message
          : 'Kiểm tra kết nối và cấu hình máy chủ'),
    );
    await coSoDuLieu.nhomKetNoi.end();
    process.exitCode = 1;
  });
export = { khoiDongMayChu };
