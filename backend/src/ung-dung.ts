import express = require('express');
import cors = require('cors');
import { cauHinh } from './config/moi-truong';
import coSoDuLieu = require('./repositories/ket-noi');
import { LoiUngDung } from './utils/loi';
import { khongTimThay, xuLyLoi } from './middlewares/xu-ly-loi';
const ungDung = express();
ungDung.disable('x-powered-by');
ungDung.use(
  cors({
    origin(nguonTruyCap, hoanTat) {
      hoanTat(
        nguonTruyCap && !cauHinh.origins.includes(nguonTruyCap)
          ? new LoiUngDung(403, 'Nguồn truy cập không được phép')
          : null,
        true,
      );
    },
  }),
);
ungDung.use((yeuCau, phanHoi, tiepTheo) => {
  phanHoi.set('X-Content-Type-Options', 'nosniff');
  phanHoi.set('Cache-Control', 'no-store');
  tiepTheo();
});
ungDung.use(express.json({ limit: '128kb' }));
ungDung.get('/', (yeuCau, phanHoi) =>
  phanHoi.json({
    success: true,
    message: 'Backend hệ thống đấu giá trực tuyến đang hoạt động',
    data: { health: '/api/health' },
  }),
);
ungDung.get('/api/health', async (yeuCau, phanHoi, tiepTheo) => {
  try {
    await coSoDuLieu.layMot('SELECT 1 AS ok');
    phanHoi.json({
      success: true,
      message: 'Backend và MySQL hoạt động',
      data: { database: 'connected' },
    });
  } catch (loi) {
    tiepTheo(loi);
  }
});
ungDung.use('/api', require('./routes/nguoi-dung'));
ungDung.use('/api', require('./routes/danh-muc-san-pham'));
ungDung.use('/api', require('./routes/tai-tep'));
ungDung.use('/api', require('./routes/dau-gia'));
ungDung.use('/api', require('./routes/tuong-tac'));
ungDung.use('/api', require('./routes/don-hang'));
ungDung.get(
  '/api/admin/jobs',
  require('./middlewares/xac-thuc').yeuCauDangNhap(),
  require('./middlewares/xac-thuc').quanTri,
  require('./controllers/xu-ly-http')(() => require('./jobs/lich-chay').trangThai()),
);
ungDung.use(khongTimThay);
ungDung.use(xuLyLoi);
export = ungDung;
