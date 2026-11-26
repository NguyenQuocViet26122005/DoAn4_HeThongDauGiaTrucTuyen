import { Router } from 'express';
import multer = require('multer');
import { yeuCauDangNhap, nguoiBan } from '../middlewares/xac-thuc';
import gioiHan = require('../middlewares/gioi-han-yeu-cau');
import xuLyHTTP = require('../controllers/xu-ly-http');
import { id } from '../validations/du-lieu-dau-vao';
import { raSoat } from '../services/kiem-duyet-tin';
import { thamKhaoGia } from '../services/tham-khao-gia';
import { chuanBiAnh, goiYTuAnh } from '../services/dang-ban-tu-anh';
import { aiSanSang } from '../services/ai';

const boDinhTuyen = Router();
boDinhTuyen.use('/listing-support', yeuCauDangNhap(), gioiHan({ limit: 12, windowMs: 60000 }));
boDinhTuyen.get(
  '/listing-support/status',
  xuLyHTTP(() => ({ ai_san_sang: aiSanSang() })),
);
boDinhTuyen.post(
  '/listing-support/products/:id/review',
  xuLyHTTP((r) => raSoat(r.user, id(r.params.id), r.body)),
);
boDinhTuyen.get(
  '/listing-support/products/:id/prices',
  nguoiBan,
  xuLyHTTP((r) => thamKhaoGia(r.user, id(r.params.id))),
);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
    fields: 0,
    parts: 6,
  },
});
boDinhTuyen.post(
  '/listing-support/photos/prepare',
  nguoiBan,
  upload.array('photos', 5),
  xuLyHTTP((r) => chuanBiAnh(r.user, r.files as Express.Multer.File[])),
);
boDinhTuyen.post(
  '/listing-support/photos/suggest',
  nguoiBan,
  xuLyHTTP((r) => goiYTuAnh(r.user, r.body)),
);
export = boDinhTuyen;
