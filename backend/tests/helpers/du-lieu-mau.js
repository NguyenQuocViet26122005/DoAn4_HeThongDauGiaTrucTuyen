const { randomUUID: taoMaNgauNhien } = require('node:crypto');
const bcrypt = require('bcrypt');
const coSoDuLieu = require('../../dist/repositories/ket-noi');
const khoBanGhi = require('../../dist/repositories/ban-ghi');
const cacNguoiDung = require('../../dist/repositories/nguoi-dung');
const { nguoiDungAnToan } = require('../../dist/utils/du-lieu-cong-khai');
const thoiGian = require('../../dist/utils/thoi-gian');

if (process.env.DB_NAME !== 'doan4_daugia_kiem_thu') {
  throw new Error('Chỉ được tạo dữ liệu kiểm thử trong doan4_daugia_kiem_thu.');
}

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

  return {
    ...cacTaiKhoan,
    prefix: tienTo,
    password: matKhau,
    categoryId: danhMucId,
  };
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
    if (loi !== tinHieuHoanTac) {
      throw loi;
    }
  }
}

async function thuHoiVaKiemKe(d, donId, ketQua = 'CAN_XU_LY') {
  const hangHoan = require('../../dist/services/hang-hoan');
  const donHang = require('../../dist/services/don-hang');
  const don = await donHang.chiTiet(d.admin, donId);
  const serial = don.kiem_dinh?.serial_khi_nhan || `KT-${donId}`;
  let capNhat = await hangHoan.xuLy(d.admin, donId, {
    thao_tac: 'KHOI_TAO',
    ghi_chu: 'Thu hồi để đối chiếu trong kiểm thử',
  });

  if (capNhat.xu_ly_hang.trang_thai === 'CHO_THU_HOI') {
    await hangHoan.xuLy(d.admin, donId, {
      thao_tac: 'GUI_HOAN',
      don_vi_van_chuyen: 'Vận chuyển kiểm thử',
      ma_van_don: `HOAN-${donId}`,
      ghi_chu: 'Đã bàn giao hàng hoàn',
    });
    await hangHoan.xuLy(d.admin, donId, {
      thao_tac: 'NHAN_LAI',
      serial,
      so_kien: 1,
      ghi_chu: 'Trung tâm thực nhận một kiện',
    });
  }

  return hangHoan.xuLy(d.admin, donId, {
    thao_tac: 'KIEM_KE',
    ket_qua: ketQua,
    serial,
    phu_kien: 'Đã đối chiếu phụ kiện và hồ sơ gốc',
    ghi_chu: 'Biên bản kiểm kê để xử lý giao dịch',
  });
}

module.exports = {
  thuHoiVaKiemKe,
  taoDuLieuKiemThu,
  sanPham,
  phienDauGia,
  hoanTac,
};
