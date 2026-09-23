import xuLyHTTP = require('./xu-ly-http');
import dichVu = require('../services/don-hang');
import khoDuLieu = require('../repositories/don-hang');
import cacDeNghi = require('../services/de-nghi-mua-tiep');
import kiemTra = require('../validations/du-lieu-dau-vao');
export = {
  danhSach: xuLyHTTP((yeuCau) => khoDuLieu.danhSach(yeuCau.user, kiemTra.phanTrang(yeuCau.query))),
  danhSachQuanTri: xuLyHTTP((yeuCau) =>
    khoDuLieu.danhSach(yeuCau.user, kiemTra.phanTrang(yeuCau.query), 'admin'),
  ),
  chiTiet: xuLyHTTP((yeuCau) => dichVu.chiTiet(yeuCau.user, yeuCau.params.id)),
  diaChi: xuLyHTTP((yeuCau) => dichVu.capNhatDiaChi(yeuCau.user, yeuCau.params.id, yeuCau.body)),
  thanhToan: xuLyHTTP((yeuCau) => dichVu.thanhToan(yeuCau.user, yeuCau.params.id, yeuCau.body)),
  guiHang: xuLyHTTP((yeuCau) => dichVu.guiHang(yeuCau.user, yeuCau.params.id, yeuCau.body)),
  xacNhanDaGiao: xuLyHTTP((yeuCau) => dichVu.xacNhanDaGiao(yeuCau.user, yeuCau.params.id)),
  xacNhanHoanThanh: xuLyHTTP((yeuCau) => dichVu.xacNhanHoanThanh(yeuCau.user, yeuCau.params.id)),
  cacDeNghi: xuLyHTTP((yeuCau) =>
    khoDuLieu.cacDeNghi(yeuCau.user, kiemTra.phanTrang(yeuCau.query)),
  ),
  chiTietDeNghi: xuLyHTTP((yeuCau) => cacDeNghi.chiTiet(yeuCau.user, yeuCau.params.id)),
  taoDeNghi: xuLyHTTP((yeuCau) => cacDeNghi.tao(yeuCau.user, yeuCau.params.id), { status: 201 }),
  phanHoiDeNghi: xuLyHTTP((yeuCau) =>
    cacDeNghi.phanHoiDeNghi(yeuCau.user, yeuCau.params.id, yeuCau.body),
  ),
};
