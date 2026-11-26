import http = require('node:http');
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import express = require('express');
import { Server as MayChuSocket } from 'socket.io';
import { cauHinh, kiemTraMoiTruong } from './config/moi-truong';
import ungDung = require('./ung-dung');
import coSoDuLieu = require('./repositories/ket-noi');
import cacSuKien = require('./sockets/su-kien');

async function khoiDongMayChu(diaChiLangNghe?: string) {
  kiemTraMoiTruong();
  await coSoDuLieu.layMot('SELECT 1 AS ok');

  ungDung.set('trust proxy', cauHinh.trustProxyHops || false);

  const webRoot = cauHinh.webRoot;
  const handler = webRoot ? ungDungKemGiaoDien(webRoot) : ungDung;
  const mayChu = http.createServer(handler);
  const io = new MayChuSocket(mayChu, {
    cors: { origin: cauHinh.origins },
    maxHttpBufferSize: 16384,
  });

  require('./sockets/ket-noi').khoiTao(io);
  await new Promise<void>((giaiQuyet, tuChoi) => {
    mayChu.once('error', tuChoi);
    mayChu.listen(cauHinh.port, diaChiLangNghe, giaiQuyet);
  });
  console.log(`Backend: http://localhost:${cauHinh.port} — MySQL đã kết nối`);

  const dungTacVu = require('./jobs/lich-chay').batDau();
  let dangDung = false;
  const dung = async () => {
    if (dangDung) {
      return;
    }
    dangDung = true;
    await dungTacVu();
    await new Promise<void>((giaiQuyet) => io.close(() => giaiQuyet()));
    if (mayChu.listening) {
      await new Promise<void>((giaiQuyet) => mayChu.close(() => giaiQuyet()));
    }
    await coSoDuLieu.nhomKetNoi.end();
  };

  for (const tinHieu of ['SIGINT', 'SIGTERM']) {
    process.once(tinHieu, () =>
      dung().catch(() => {
        process.exitCode = 1;
      }),
    );
  }

  return {
    server: mayChu,
    io,
    stop: dung,
  };
}

function ungDungKemGiaoDien(webRoot: string) {
  const trangChinh = join(webRoot, 'index.html');

  if (!existsSync(trangChinh)) {
    throw new Error('WEB_DIST thiếu index.html, cần build frontend');
  }

  const web = express();

  web.disable('x-powered-by');
  web.use((req, res, next) => {
    if (/^\/(?:api|api-docs)(?:[/.]|$)/.test(req.path)) {
      return ungDung(req, res, next);
    }

    next();
  });
  web.use(express.static(webRoot, { index: false }));
  web.get('/{*route}', (req, res, next) => {
    if (!req.accepts('html') || /\.[^/]+$/.test(req.path)) {
      return next();
    }

    res.sendFile('index.html', { root: webRoot });
  });

  return web;
}

if (require.main === module) {
  khoiDongMayChu().catch(async (loi) => {
    console.error(
      'Không thể khởi động backend:',
      loi.code ||
        (/^(Thiếu cấu hình|JWT_SECRET|DB_TIMEZONE|PORT|TRUST_PROXY_HOPS|WEB_DIST)/.test(loi.message)
          ? loi.message
          : 'Kiểm tra kết nối và cấu hình máy chủ'),
    );
    await coSoDuLieu.nhomKetNoi.end();
    process.exitCode = 1;
  });
}
export { khoiDongMayChu, ungDungKemGiaoDien };
