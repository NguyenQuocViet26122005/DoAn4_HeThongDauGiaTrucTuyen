const { Router: TaoBoDinhTuyen } = require('express');
const multer = require('multer');
const { yeuCauDangNhap } = require('../middlewares/xac-thuc');
const dichVu = require('../services/tai-tep');
const xuLyHTTP = require('../controllers/xu-ly-http');
const gioiHanYeuCau = require('../middlewares/gioi-han-yeu-cau');
const boDinhTuyen = TaoBoDinhTuyen();
const taiLen = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
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
module.exports = boDinhTuyen;
