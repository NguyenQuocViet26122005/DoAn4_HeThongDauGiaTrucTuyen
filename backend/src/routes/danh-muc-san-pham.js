const { Router: TaoBoDinhTuyen } = require('express');
const dieuKhien = require('../controllers/danh-muc-san-pham');
const { yeuCauDangNhap, quanTri, nguoiBan } = require('../middlewares/xac-thuc');
const boDinhTuyen = TaoBoDinhTuyen();
boDinhTuyen.get('/categories', dieuKhien.danhSachDanhMuc);
boDinhTuyen.get('/categories/:id/attributes', dieuKhien.danhSachThuocTinh);
boDinhTuyen.get('/products', dieuKhien.cacSanPham);
boDinhTuyen.get('/products/mine', yeuCauDangNhap(), nguoiBan, dieuKhien.cuaToi);
boDinhTuyen.get('/products/:id', yeuCauDangNhap(true), dieuKhien.chiTiet);
boDinhTuyen.post('/products', yeuCauDangNhap(), nguoiBan, dieuKhien.tao);
boDinhTuyen.put('/products/:id', yeuCauDangNhap(), nguoiBan, dieuKhien.capNhat);
boDinhTuyen.post('/products/:id/submit', yeuCauDangNhap(), nguoiBan, dieuKhien.guiDuyet);
boDinhTuyen.post('/products/:id/images', yeuCauDangNhap(), nguoiBan, dieuKhien.themAnh);
boDinhTuyen.delete('/products/:id/images/:imageId', yeuCauDangNhap(), nguoiBan, dieuKhien.xoaAnh);
boDinhTuyen.get('/admin/categories', yeuCauDangNhap(), quanTri, dieuKhien.danhMucQuanTri);
boDinhTuyen.post('/admin/categories', yeuCauDangNhap(), quanTri, dieuKhien.taoDanhMuc);
boDinhTuyen.put('/admin/categories/:id', yeuCauDangNhap(), quanTri, dieuKhien.capNhatDanhMuc);
boDinhTuyen.post(
  '/admin/categories/:id/attributes',
  yeuCauDangNhap(),
  quanTri,
  dieuKhien.taoThuocTinh,
);
boDinhTuyen.put(
  '/admin/categories/:id/attributes/:attributeId',
  yeuCauDangNhap(),
  quanTri,
  dieuKhien.capNhatThuocTinh,
);
boDinhTuyen.get('/admin/products', yeuCauDangNhap(), quanTri, dieuKhien.sanPhamQuanTri);
boDinhTuyen.patch('/admin/products/:id/review', yeuCauDangNhap(), quanTri, dieuKhien.duyet);
module.exports = boDinhTuyen;
