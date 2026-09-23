import xuLyHTTP = require('./xu-ly-http');
import dichVu = require('../services/dau-gia');
import khoDuLieu = require('../repositories/dau-gia');
import kiemTra = require('../validations/du-lieu-dau-vao');
import cauHinhNghiepVu = require('../services/cau-hinh');
import heThong = require('../repositories/he-thong');
export = {
  danhSach: xuLyHTTP((yeuCau) => dichVu.danhSach(yeuCau.user, yeuCau.query)),
  cuaToi: xuLyHTTP((yeuCau) => dichVu.danhSach(yeuCau.user, yeuCau.query, 'mine')),
  phienDaThamGia: xuLyHTTP((yeuCau) => dichVu.danhSach(yeuCau.user, yeuCau.query, 'bids')),
  chiTiet: xuLyHTTP((yeuCau) => dichVu.chiTiet(yeuCau.params.id)),
  lichSu: xuLyHTTP((yeuCau) => dichVu.lichSu(yeuCau.params.id, yeuCau.query)),
  tao: xuLyHTTP((yeuCau) => dichVu.tao(yeuCau.user, yeuCau.body), { status: 201 }),
  datGia: xuLyHTTP((yeuCau) => dichVu.datGia(yeuCau.user, yeuCau.params.id, yeuCau.body)),
  muaNgay: xuLyHTTP((yeuCau) => dichVu.muaNgay(yeuCau.user, yeuCau.params.id, yeuCau.body)),
  yeuCauHuy: xuLyHTTP((yeuCau) => dichVu.guiYeuCauHuy(yeuCau.user, yeuCau.params.id, yeuCau.body), {
    status: 201,
  }),
  hangDoiYeuCauHuy: xuLyHTTP((yeuCau) =>
    khoDuLieu.danhSachYeuCauHuy(kiemTra.phanTrang(yeuCau.query)),
  ),
  duyetHuyPhien: xuLyHTTP((yeuCau) =>
    dichVu.duyetHuyPhien(yeuCau.user, yeuCau.params.id, yeuCau.body),
  ),
  danhSachTheoDoi: xuLyHTTP((yeuCau) => dichVu.danhSach(yeuCau.user, yeuCau.query, 'watchlist')),
  theoDoi: xuLyHTTP((yeuCau) => dichVu.theoDoi(yeuCau.user, yeuCau.params.id, true)),
  boTheoDoi: xuLyHTTP((yeuCau) => dichVu.theoDoi(yeuCau.user, yeuCau.params.id, false)),
  cacBuocGia: xuLyHTTP(() => heThong.cacBuocGia()),
  danhSachCauHinh: xuLyHTTP(() => heThong.danhSachCauHinh()),
  luuCauHinh: xuLyHTTP((yeuCau) =>
    cauHinhNghiepVu.luu(yeuCau.user, yeuCau.params.key, yeuCau.body),
  ),
  luuBuocGia: xuLyHTTP((yeuCau) => cauHinhNghiepVu.thayBoBuocGia(yeuCau.user, yeuCau.body)),
};
