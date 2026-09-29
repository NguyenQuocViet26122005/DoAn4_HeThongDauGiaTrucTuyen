import { Router } from 'express';
import dieuKhien = require('../controllers/kiem-dinh-dat-coc');
import { yeuCauDangNhap, quanTri, nguoiBan } from '../middlewares/xac-thuc';

const boDinhTuyen = Router();

boDinhTuyen.get('/products/:id/inspection', dieuKhien.kiemDinhCongKhai);
boDinhTuyen.get('/inspections', yeuCauDangNhap(), dieuKhien.danhSachKiemDinh);
boDinhTuyen.get('/inspections/:id', yeuCauDangNhap(), dieuKhien.chiTietKiemDinh);
boDinhTuyen.post('/inspections/:id/shipping', yeuCauDangNhap(), nguoiBan, dieuKhien.guiTrungTam);
boDinhTuyen.post(
  '/admin/products/:id/inspections',
  yeuCauDangNhap(),
  quanTri,
  dieuKhien.taoKiemDinh,
);
boDinhTuyen.get('/admin/inspections', yeuCauDangNhap(), quanTri, dieuKhien.danhSachKiemDinh);
boDinhTuyen.post('/admin/inspections/:id/received', yeuCauDangNhap(), quanTri, dieuKhien.nhanHang);
boDinhTuyen.post('/admin/inspections/:id/start', yeuCauDangNhap(), quanTri, dieuKhien.batDau);
boDinhTuyen.post('/admin/inspections/:id/files', yeuCauDangNhap(), quanTri, dieuKhien.themTep);
boDinhTuyen.patch('/admin/inspections/:id/result', yeuCauDangNhap(), quanTri, dieuKhien.ketQua);
boDinhTuyen.post('/admin/inspections/:id/return', yeuCauDangNhap(), quanTri, dieuKhien.traHang);

boDinhTuyen.post('/auctions/:id/deposit/register', yeuCauDangNhap(), dieuKhien.dangKyCoc);
boDinhTuyen.get('/auctions/:id/deposit', yeuCauDangNhap(), dieuKhien.cocCuaToi);
boDinhTuyen.post('/auctions/:id/deposit/pay', yeuCauDangNhap(), dieuKhien.thanhToanCoc);
boDinhTuyen.get('/auctions/:id/participants/summary', yeuCauDangNhap(), dieuKhien.thongKeCoc);
boDinhTuyen.get('/admin/deposits', yeuCauDangNhap(), quanTri, dieuKhien.quanLyCoc);

export = boDinhTuyen;
