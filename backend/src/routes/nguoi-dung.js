const { Router: TaoBoDinhTuyen } = require('express');
const dieuKhien = require('../controllers/nguoi-dung');
const { yeuCauDangNhap, quanTri } = require('../middlewares/xac-thuc');
const gioiHanYeuCau = require('../middlewares/gioi-han-yeu-cau');
const boDinhTuyen = TaoBoDinhTuyen();
const gioiHanDangNhap = gioiHanYeuCau({ limit: 20, windowMs: 15 * 60 * 1000 });
boDinhTuyen.post('/auth/register', gioiHanDangNhap, dieuKhien.dangKy);
boDinhTuyen.post('/auth/login', gioiHanDangNhap, dieuKhien.dangNhap);
boDinhTuyen.get('/users/me', yeuCauDangNhap(), dieuKhien.hoSo);
boDinhTuyen.patch('/users/me', yeuCauDangNhap(), dieuKhien.capNhatHoSo);
boDinhTuyen.get('/users/me/addresses', yeuCauDangNhap(), dieuKhien.danhSachDiaChi);
boDinhTuyen.post('/users/me/addresses', yeuCauDangNhap(), dieuKhien.themDiaChi);
boDinhTuyen.put('/users/me/addresses/:id', yeuCauDangNhap(), dieuKhien.suaDiaChi);
boDinhTuyen.delete('/users/me/addresses/:id', yeuCauDangNhap(), dieuKhien.xoaDiaChi);
boDinhTuyen.get('/seller-verifications/me', yeuCauDangNhap(), dieuKhien.cacHoSoXacMinh);
boDinhTuyen.post('/seller-verifications', yeuCauDangNhap(), dieuKhien.guiXacMinh);
boDinhTuyen.get('/admin/users', yeuCauDangNhap(), quanTri, dieuKhien.cacNguoiDung);
boDinhTuyen.patch(
  '/admin/users/:id/status',
  yeuCauDangNhap(),
  quanTri,
  dieuKhien.doiTrangThaiTaiKhoan,
);
boDinhTuyen.get(
  '/admin/seller-verifications',
  yeuCauDangNhap(),
  quanTri,
  dieuKhien.danhSachChoXacMinh,
);
boDinhTuyen.patch(
  '/admin/seller-verifications/:id/review',
  yeuCauDangNhap(),
  quanTri,
  dieuKhien.duyetXacMinh,
);
module.exports = boDinhTuyen;
