import xuLyHTTP = require('./xu-ly-http');
import dichVu = require('../services/nguoi-dung');
import khoDuLieu = require('../repositories/nguoi-dung');
import kiemTra = require('../validations/du-lieu-dau-vao');
export = {
  dangKy: xuLyHTTP((yeuCau) => dichVu.dangKy(yeuCau.body), { status: 201 }),
  dangNhap: xuLyHTTP((yeuCau) => dichVu.dangNhap(yeuCau.body)),
  hoSo: xuLyHTTP((yeuCau) => dichVu.hoSo(yeuCau.user)),
  capNhatHoSo: xuLyHTTP((yeuCau) => dichVu.capNhatHoSo(yeuCau.user, yeuCau.body)),
  danhSachDiaChi: xuLyHTTP((yeuCau) => khoDuLieu.danhSachDiaChi(yeuCau.user.id)),
  themDiaChi: xuLyHTTP((yeuCau) => dichVu.luuDiaChi(yeuCau.user, null, yeuCau.body), {
    status: 201,
  }),
  suaDiaChi: xuLyHTTP((yeuCau) => dichVu.luuDiaChi(yeuCau.user, yeuCau.params.id, yeuCau.body)),
  xoaDiaChi: xuLyHTTP((yeuCau) => dichVu.xoaDiaChi(yeuCau.user, yeuCau.params.id)),
  cacHoSoXacMinh: xuLyHTTP((yeuCau) => khoDuLieu.cacHoSoXacMinh(yeuCau.user.id)),
  guiXacMinh: xuLyHTTP((yeuCau) => dichVu.guiXacMinh(yeuCau.user, yeuCau.body), {
    status: 201,
  }),
  cacNguoiDung: xuLyHTTP((yeuCau) =>
    khoDuLieu.danhSach(
      kiemTra.phanTrang(yeuCau.query),
      yeuCau.query.q ? kiemTra.chuoi(yeuCau.query.q, 'Tìm kiếm', 100) : '',
    ),
  ),
  danhSachChoXacMinh: xuLyHTTP((yeuCau) =>
    khoDuLieu.danhSachChoXacMinh(
      kiemTra.phanTrang(yeuCau.query),
      kiemTra.giaTriLuaChon(
        yeuCau.query.trang_thai || 'CHO_XU_LY',
        ['CHO_XU_LY', 'DA_XAC_MINH', 'TU_CHOI'],
        'Trạng thái',
      ),
    ),
  ),
  duyetXacMinh: xuLyHTTP((yeuCau) =>
    dichVu.duyetXacMinh(yeuCau.user, yeuCau.params.id, yeuCau.body),
  ),
  doiTrangThaiTaiKhoan: xuLyHTTP((yeuCau) =>
    dichVu.doiTrangThaiTaiKhoan(yeuCau.user, yeuCau.params.id, yeuCau.body),
  ),
};
