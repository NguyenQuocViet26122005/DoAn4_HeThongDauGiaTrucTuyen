import xuLyHTTP = require('./xu-ly-http');
import kiemDinh = require('../services/kiem-dinh');
import datCoc = require('../services/dat-coc');
import khoCoc = require('../repositories/dat-coc');
import kiemTra = require('../validations/du-lieu-dau-vao');

export = {
  kiemDinhCongKhai: xuLyHTTP((r) => kiemDinh.congKhai(r.params.id)),
  danhSachKiemDinh: xuLyHTTP((r) => kiemDinh.danhSach(r.user, r.query)),
  chiTietKiemDinh: xuLyHTTP((r) => kiemDinh.chiTiet(r.user, r.params.id)),
  taoKiemDinh: xuLyHTTP((r) => kiemDinh.tao(r.user, r.params.id), { status: 201 }),
  guiTrungTam: xuLyHTTP((r) => kiemDinh.guiTrungTam(r.user, r.params.id, r.body)),
  nhanHang: xuLyHTTP((r) => kiemDinh.nhanHang(r.user, r.params.id, r.body)),
  batDau: xuLyHTTP((r) => kiemDinh.batDau(r.user, r.params.id)),
  themTep: xuLyHTTP((r) => kiemDinh.themTep(r.user, r.params.id, r.body), { status: 201 }),
  ketQua: xuLyHTTP((r) => kiemDinh.ghiKetQua(r.user, r.params.id, r.body)),
  traHang: xuLyHTTP((r) => kiemDinh.traNguoiBan(r.user, r.params.id, r.body)),
  dangKyCoc: xuLyHTTP((r) => datCoc.dangKy(r.user, r.params.id), { status: 201 }),
  cocCuaToi: xuLyHTTP((r) => datCoc.cuaToi(r.user, r.params.id)),
  thanhToanCoc: xuLyHTTP((r) => datCoc.thanhToan(r.user, r.params.id, r.body)),
  thongKeCoc: xuLyHTTP((r) => datCoc.thongKeNguoiBan(r.user, r.params.id)),
  quanLyCoc: xuLyHTTP((r) => khoCoc.danhSach(kiemTra.phanTrang(r.query))),
};
