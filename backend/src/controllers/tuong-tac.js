const xuLyHTTP = require('./xu-ly-http');
const dichVu = require('../services/tuong-tac');
const cacTranhChap = require('../services/tranh-chap');
const khoDuLieu = require('../repositories/tuong-tac');
const kiemTra = require('../validators/du-lieu-dau-vao');
module.exports = {
  cacTranhChap: xuLyHTTP((yeuCau) =>
    khoDuLieu.cacTranhChap(yeuCau.user, kiemTra.phanTrang(yeuCau.query)),
  ),
  tranhChapQuanTri: xuLyHTTP((yeuCau) =>
    khoDuLieu.cacTranhChap(yeuCau.user, kiemTra.phanTrang(yeuCau.query), true),
  ),
  chiTietTranhChap: xuLyHTTP((yeuCau) => cacTranhChap.chiTiet(yeuCau.user, yeuCau.params.id)),
  tranhChapDangMo: xuLyHTTP(
    (yeuCau) => cacTranhChap.mo(yeuCau.user, yeuCau.params.id, yeuCau.body),
    { status: 201 },
  ),
  phanHoiTranhChap: xuLyHTTP((yeuCau) =>
    cacTranhChap.phanHoiNguoiBan(yeuCau.user, yeuCau.params.id, yeuCau.body),
  ),
  bangChung: xuLyHTTP(
    (yeuCau) => cacTranhChap.themBangChung(yeuCau.user, yeuCau.params.id, yeuCau.body),
    { status: 201 },
  ),
  tiepNhanTranhChap: xuLyHTTP((yeuCau) => cacTranhChap.tiepNhan(yeuCau.user, yeuCau.params.id)),
  giaiQuyetTranhChap: xuLyHTTP((yeuCau) =>
    cacTranhChap.giaiQuyet(yeuCau.user, yeuCau.params.id, yeuCau.body),
  ),
  danhGiaDonHang: xuLyHTTP(
    (yeuCau) => dichVu.danhGiaDonHang(yeuCau.user, yeuCau.params.id, yeuCau.body),
    {
      status: 201,
    },
  ),
  cacDanhGia: xuLyHTTP((yeuCau) =>
    khoDuLieu.cacDanhGia(kiemTra.id(yeuCau.params.id), kiemTra.phanTrang(yeuCau.query)),
  ),
  danhSachThongBao: xuLyHTTP((yeuCau) =>
    khoDuLieu.danhSachThongBao(
      yeuCau.user.id,
      kiemTra.phanTrang(yeuCau.query),
      yeuCau.query.unread === 'true',
    ),
  ),
  chuaDoc: xuLyHTTP((yeuCau) => khoDuLieu.demChuaDoc(yeuCau.user.id)),
  danhDauDaDoc: xuLyHTTP((yeuCau) => dichVu.docThongBao(yeuCau.user, yeuCau.params.id)),
  danhDauTatCaDaDoc: xuLyHTTP((yeuCau) => dichVu.docThongBao(yeuCau.user)),
  cacViPham: xuLyHTTP((yeuCau) =>
    khoDuLieu.cacViPham(yeuCau.user.id, kiemTra.phanTrang(yeuCau.query)),
  ),
  viPhamQuanTri: xuLyHTTP((yeuCau) =>
    khoDuLieu.cacViPham(
      yeuCau.query.nguoi_dung_id ? kiemTra.id(yeuCau.query.nguoi_dung_id) : null,
      kiemTra.phanTrang(yeuCau.query),
    ),
  ),
  taoViPham: xuLyHTTP((yeuCau) => dichVu.taoViPham(yeuCau.user, yeuCau.body), { status: 201 }),
  duyetViPham: xuLyHTTP((yeuCau) => dichVu.duyetViPham(yeuCau.user, yeuCau.params.id, yeuCau.body)),
  thongKe: xuLyHTTP(() => khoDuLieu.thongKe()),
  nhatKy: xuLyHTTP((yeuCau) => khoDuLieu.nhatKy(kiemTra.phanTrang(yeuCau.query))),
};
