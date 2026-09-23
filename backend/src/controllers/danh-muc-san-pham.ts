import xuLyHTTP = require('./xu-ly-http');
import dichVu = require('../services/danh-muc-san-pham');
import khoDuLieu = require('../repositories/danh-muc-san-pham');
import kiemTra = require('../validations/du-lieu-dau-vao');
export = {
  danhSachDanhMuc: xuLyHTTP(() => khoDuLieu.danhSachDanhMuc()),
  danhMucQuanTri: xuLyHTTP(() => khoDuLieu.danhSachDanhMuc(true)),
  danhSachThuocTinh: xuLyHTTP((yeuCau) =>
    khoDuLieu.danhSachThuocTinh(kiemTra.id(yeuCau.params.id)),
  ),
  taoDanhMuc: xuLyHTTP((yeuCau) => dichVu.luuDanhMuc(yeuCau.user, null, yeuCau.body), {
    status: 201,
  }),
  capNhatDanhMuc: xuLyHTTP((yeuCau) =>
    dichVu.luuDanhMuc(yeuCau.user, yeuCau.params.id, yeuCau.body),
  ),
  taoThuocTinh: xuLyHTTP(
    (yeuCau) => dichVu.luuThuocTinh(yeuCau.user, yeuCau.params.id, null, yeuCau.body),
    {
      status: 201,
    },
  ),
  capNhatThuocTinh: xuLyHTTP((yeuCau) =>
    dichVu.luuThuocTinh(yeuCau.user, yeuCau.params.id, yeuCau.params.attributeId, yeuCau.body),
  ),
  cacSanPham: xuLyHTTP((yeuCau) => dichVu.danhSach(yeuCau.user, yeuCau.query)),
  cuaToi: xuLyHTTP((yeuCau) => dichVu.danhSach(yeuCau.user, yeuCau.query, 'mine')),
  sanPhamQuanTri: xuLyHTTP((yeuCau) => dichVu.danhSach(yeuCau.user, yeuCau.query, 'admin')),
  chiTiet: xuLyHTTP((yeuCau) => dichVu.chiTiet(yeuCau.user, yeuCau.params.id)),
  tao: xuLyHTTP((yeuCau) => dichVu.luuSanPham(yeuCau.user, null, yeuCau.body), { status: 201 }),
  capNhat: xuLyHTTP((yeuCau) => dichVu.luuSanPham(yeuCau.user, yeuCau.params.id, yeuCau.body)),
  guiDuyet: xuLyHTTP((yeuCau) => dichVu.guiDuyet(yeuCau.user, yeuCau.params.id)),
  duyet: xuLyHTTP((yeuCau) => dichVu.duyet(yeuCau.user, yeuCau.params.id, yeuCau.body)),
  themAnh: xuLyHTTP((yeuCau) => dichVu.themAnh(yeuCau.user, yeuCau.params.id, yeuCau.body), {
    status: 201,
  }),
  xoaAnh: xuLyHTTP((yeuCau) => dichVu.xoaAnh(yeuCau.user, yeuCau.params.id, yeuCau.params.imageId)),
};
