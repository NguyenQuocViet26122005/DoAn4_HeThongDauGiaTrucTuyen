import { Router as TaoBoDinhTuyen } from 'express';
import multer = require('multer');
import { yeuCauDangNhap } from '../middlewares/xac-thuc';
import dichVu = require('../services/tai-tep');
import xuLyHTTP = require('../controllers/xu-ly-http');
import gioiHanYeuCau = require('../middlewares/gioi-han-yeu-cau');
const boDinhTuyen = TaoBoDinhTuyen();
const taiLen = multer({
  storage: multer.memoryStorage(),
  // Busboy phát partsLimit khi chạm ngưỡng; files/fields vẫn khóa đúng một tệp.
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 0, parts: 2 },
});
boDinhTuyen.post(
  '/uploads/:kind',
  yeuCauDangNhap(),
  gioiHanYeuCau({ limit: 30, windowMs: 60000 }),
  taiLen.single('file'),
  xuLyHTTP((yeuCau) => dichVu.luu(yeuCau.user, yeuCau.params.kind, yeuCau.file), { status: 201 }),
);
boDinhTuyen.get(
  '/uploads/files/:kind/:owner/:name',
  yeuCauDangNhap(true),
  async (yeuCau, phanHoi, tiepTheo) => {
    try {
      const dich = await dichVu.taiTep(
        yeuCau.user,
        yeuCau.params.kind,
        yeuCau.params.owner,
        yeuCau.params.name,
      );
      phanHoi.set({
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
        'Cache-Control': 'private, no-store',
      });
      phanHoi.sendFile(dich.absolute, { dotfiles: 'deny' }, (loi) => {
        if (loi) tiepTheo(loi);
      });
    } catch (loi) {
      tiepTheo(loi);
    }
  },
);
export = boDinhTuyen;
