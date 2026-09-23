import { Router as TaoBoDinhTuyen } from 'express';
import dieuKhien = require('../controllers/dau-gia');
import { yeuCauDangNhap, quanTri, nguoiBan } from '../middlewares/xac-thuc';
import gioiHanYeuCau = require('../middlewares/gioi-han-yeu-cau');
const boDinhTuyen = TaoBoDinhTuyen();
const gioiHanDatGia = gioiHanYeuCau({ limit: 60, windowMs: 60000 });
boDinhTuyen.get('/auctions', dieuKhien.danhSach);
boDinhTuyen.get('/auctions/mine', yeuCauDangNhap(), nguoiBan, dieuKhien.cuaToi);
boDinhTuyen.get('/auctions/my-bids', yeuCauDangNhap(), dieuKhien.phienDaThamGia);
boDinhTuyen.get('/auctions/:id', dieuKhien.chiTiet);
boDinhTuyen.get('/auctions/:id/bids', dieuKhien.lichSu);
boDinhTuyen.post('/auctions', yeuCauDangNhap(), nguoiBan, dieuKhien.tao);
boDinhTuyen.post('/auctions/:id/bids', yeuCauDangNhap(), gioiHanDatGia, dieuKhien.datGia);
boDinhTuyen.post('/auctions/:id/buy-now', yeuCauDangNhap(), dieuKhien.muaNgay);
boDinhTuyen.post(
  '/auctions/:id/cancellation-requests',
  yeuCauDangNhap(),
  nguoiBan,
  dieuKhien.yeuCauHuy,
);
boDinhTuyen.get('/bid-increments', dieuKhien.cacBuocGia);
boDinhTuyen.get('/watchlist', yeuCauDangNhap(), dieuKhien.danhSachTheoDoi);
boDinhTuyen.post('/watchlist/:id', yeuCauDangNhap(), dieuKhien.theoDoi);
boDinhTuyen.delete('/watchlist/:id', yeuCauDangNhap(), dieuKhien.boTheoDoi);
boDinhTuyen.get('/admin/auctions', yeuCauDangNhap(), quanTri, dieuKhien.danhSach);
boDinhTuyen.get(
  '/admin/cancellation-requests',
  yeuCauDangNhap(),
  quanTri,
  dieuKhien.hangDoiYeuCauHuy,
);
boDinhTuyen.patch(
  '/admin/cancellation-requests/:id/review',
  yeuCauDangNhap(),
  quanTri,
  dieuKhien.duyetHuyPhien,
);
boDinhTuyen.get('/admin/config', yeuCauDangNhap(), quanTri, dieuKhien.danhSachCauHinh);
boDinhTuyen.put('/admin/config/:key', yeuCauDangNhap(), quanTri, dieuKhien.luuCauHinh);
boDinhTuyen.put('/admin/bid-increments', yeuCauDangNhap(), quanTri, dieuKhien.luuBuocGia);
export = boDinhTuyen;
