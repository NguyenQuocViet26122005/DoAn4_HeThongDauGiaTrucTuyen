import { Router as TaoBoDinhTuyen } from 'express';
import dieuKhien = require('../controllers/tuong-tac');
import { yeuCauDangNhap, quanTri } from '../middlewares/xac-thuc';
const boDinhTuyen = TaoBoDinhTuyen();
boDinhTuyen.get('/users/:id/reviews', dieuKhien.cacDanhGia);
boDinhTuyen.use(
  [
    '/orders/:id/reviews',
    '/orders/:id/disputes',
    '/disputes',
    '/notifications',
    '/violations',
    '/admin/disputes',
    '/admin/violations',
    '/admin/statistics',
    '/admin/activity-logs',
  ],
  yeuCauDangNhap(),
);
boDinhTuyen.post('/orders/:id/reviews', dieuKhien.danhGiaDonHang);
boDinhTuyen.post('/orders/:id/disputes', dieuKhien.tranhChapDangMo);
boDinhTuyen.get('/disputes', dieuKhien.cacTranhChap);
boDinhTuyen.get('/disputes/:id', dieuKhien.chiTietTranhChap);
boDinhTuyen.post('/disputes/:id/response', dieuKhien.phanHoiTranhChap);
boDinhTuyen.post('/disputes/:id/evidence', dieuKhien.bangChung);
boDinhTuyen.get('/notifications', dieuKhien.danhSachThongBao);
boDinhTuyen.get('/notifications/unread-count', dieuKhien.chuaDoc);
boDinhTuyen.patch('/notifications/read-all', dieuKhien.danhDauTatCaDaDoc);
boDinhTuyen.patch('/notifications/:id/read', dieuKhien.danhDauDaDoc);
boDinhTuyen.get('/violations/me', dieuKhien.cacViPham);
boDinhTuyen.get('/admin/disputes', quanTri, dieuKhien.tranhChapQuanTri);
boDinhTuyen.post('/admin/disputes/:id/take', quanTri, dieuKhien.tiepNhanTranhChap);
boDinhTuyen.post('/admin/disputes/:id/resolve', quanTri, dieuKhien.giaiQuyetTranhChap);
boDinhTuyen.get('/admin/violations', quanTri, dieuKhien.viPhamQuanTri);
boDinhTuyen.post('/admin/violations', quanTri, dieuKhien.taoViPham);
boDinhTuyen.patch('/admin/violations/:id/review', quanTri, dieuKhien.duyetViPham);
boDinhTuyen.get('/admin/statistics', quanTri, dieuKhien.thongKe);
boDinhTuyen.get('/admin/activity-logs', quanTri, dieuKhien.nhatKy);
export = boDinhTuyen;
