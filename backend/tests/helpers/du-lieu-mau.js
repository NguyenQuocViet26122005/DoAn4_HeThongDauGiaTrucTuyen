const { randomUUID: taoMaNgauNhien } = require('node:crypto');
const bcrypt = require('bcrypt');
const coSoDuLieu = require('../../src/repositories/ket-noi');
const khoBanGhi = require('../../src/repositories/ban-ghi');
const cacNguoiDung = require('../../src/repositories/nguoi-dung');
const { nguoiDungAnToan } = require('../../src/utils/du-lieu-cong-khai');
const thoiGian = require('../../src/utils/thoi-gian');

async function taoDuLieuKiemThu() {
  const tienTo = `test-${taoMaNgauNhien()}`;
  const matKhau = taoMaNgauNhien();
  const maBam = await bcrypt.hash(matKhau, 4);
  const cacTaiKhoan = {};
  for (const vaiTro of ['admin', 'seller', 'a', 'b', 'outsider']) {
    const id = await khoBanGhi.them('nguoi_dung', {
      ho_ten: `${tienTo}-${vaiTro}`,
      email: `${tienTo}-${vaiTro}@example.invalid`,
      mat_khau_bam: maBam,
      vai_tro: vaiTro === 'admin' ? 'QUAN_TRI' : 'NGUOI_DUNG',
      trang_thai_nguoi_ban: vaiTro === 'seller' ? 'DA_XAC_MINH' : 'CHUA_DANG_KY',
    });
    cacTaiKhoan[vaiTro] = nguoiDungAnToan(await cacNguoiDung.layTheoId(id));
    if (vaiTro !== 'admin') {
      await khoBanGhi.them('dia_chi_nguoi_dung', {
        nguoi_dung_id: id,
        ten_nguoi_nhan: `Test ${vaiTro}`,
        sdt_nguoi_nhan: '0900000000',
        tinh_thanh: 'Test',
        quan_huyen: 'Test',
        phuong_xa: 'Test',
        dia_chi_chi_tiet: 'Địa chỉ kiểm thử',
        la_mac_dinh: 1,
      });
    }
  }
  const danhMucId = await khoBanGhi.them('danh_muc', { ten: tienTo, duong_dan: tienTo });
  return { ...cacTaiKhoan, prefix: tienTo, password: matKhau, categoryId: danhMucId };
}

async function sanPham(duLieuKiemThu, ghiDe = {}) {
  return khoBanGhi.them('san_pham', {
    nguoi_ban_id: duLieuKiemThu.seller.id,
    danh_muc_id: duLieuKiemThu.categoryId,
    tieu_de: `Sản phẩm ${duLieuKiemThu.prefix}`,
    duong_dan: `test-product-${taoMaNgauNhien()}`,
    mo_ta: 'Chỉ dùng kiểm thử',
    tinh_trang_san_pham: 'MOI',
    trang_thai_duyet: 'DA_DUYET',
    ...ghiDe,
  });
}

async function phienDauGia(duLieuKiemThu, ghiDe = {}) {
  const thoiGianHienTai = await coSoDuLieu.thoiGianHienTai();
  return khoBanGhi.them('phien_dau_gia', {
    san_pham_id: await sanPham(duLieuKiemThu),
    gia_khoi_diem: '18000000.00',
    gia_hien_tai: '18000000.00',
    thoi_gian_bat_dau: thoiGian.congGiay(thoiGianHienTai, -3600),
    thoi_gian_ket_thuc_goc: thoiGian.congGiay(thoiGianHienTai, 3600),
    thoi_gian_ket_thuc: thoiGian.congGiay(thoiGianHienTai, 3600),
    trang_thai: 'HOAT_DONG',
    ...ghiDe,
  });
}

async function hoanTac(congViec) {
  const tinHieuHoanTac = new Error('ROLLBACK_TEST_DATA');
  try {
    await coSoDuLieu.giaoDich(async () => {
      await congViec();
      throw tinHieuHoanTac;
    });
  } catch (loi) {
    if (loi !== tinHieuHoanTac) throw loi;
  }
}

module.exports = { taoDuLieuKiemThu, sanPham, phienDauGia, hoanTac };
