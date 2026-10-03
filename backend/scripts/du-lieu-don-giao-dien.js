const { phienDauGia } = require('../tests/helpers/du-lieu-mau');
const khoBanGhi = require('../dist/repositories/ban-ghi');
const coSoDuLieu = require('../dist/repositories/ket-noi');
const dauGia = require('../dist/services/dau-gia');
const datCoc = require('../dist/services/dat-coc');
const donHang = require('../dist/services/don-hang');
const khoDon = require('../dist/repositories/don-hang');
const thoiGian = require('../dist/utils/thoi-gian');

async function taoDon(duLieu, nguoiMua, ten, coCoc = false) {
  const id = await phienDauGia(duLieu, {
    phi_van_chuyen: '50000',
    yeu_cau_dat_coc: coCoc ? 1 : 0,
    so_tien_dat_coc: coCoc ? '1800000' : null,
  });
  const phien = await khoBanGhi.layTheoId('phien_dau_gia', id);

  await khoBanGhi.capNhat('san_pham', phien.san_pham_id, { tieu_de: ten });

  if (coCoc) {
    await datCoc.dangKy(nguoiMua, id);
    await datCoc.thanhToan(nguoiMua, id, { ket_qua_mo_phong: 'THANH_CONG' });
  }

  await dauGia.datGia(nguoiMua, id, { gia_toi_da: '20000000' });

  // Rút ngắn đồng hồ chỉ trong transaction thử, vẫn chốt bằng nghiệp vụ thật.
  await khoBanGhi.capNhat('phien_dau_gia', id, {
    thoi_gian_ket_thuc: await coSoDuLieu.thoiGianHienTai(),
  });

  await dauGia.xuLyDenHan(id);

  return khoDon.donDangXuLyCuaPhien(id);
}

module.exports = async function taoDonGiaoDien(duLieu) {
  await khoBanGhi.them('dia_chi_nguoi_dung', {
    nguoi_dung_id: duLieu.a.id,
    ten_nguoi_nhan: 'Người nhận địa chỉ thứ hai',
    sdt_nguoi_nhan: '0900000002',
    tinh_thanh: 'Tỉnh kiểm thử',
    quan_huyen: 'Khu vực kiểm thử',
    phuong_xa: 'Phường kiểm thử',
    dia_chi_chi_tiet: 'Đường kiểm thử số 2',
    la_mac_dinh: 0,
  });

  for (const [ten, trangThai] of [
    ['Đơn thử thanh toán có cọc', 'CHO_THANH_TOAN'],
    ['Đơn thử thanh toán thất bại', 'CHO_THANH_TOAN'],
    ['Đơn thử nhận và kiểm tra hàng', 'DA_GUI_HANG'],
    ['Đơn thử cần Admin xử lý', 'CAN_ADMIN'],
    ['Đơn thử đã hết hạn thanh toán', 'HET_HAN'],
  ]) {
    const don = await taoDon(duLieu, duLieu.a, ten, true);

    if (['DA_GUI_HANG', 'CAN_ADMIN'].includes(trangThai)) {
      await donHang.thanhToan(duLieu.a, don.id, {});
      await donHang.guiHang(duLieu.seller, don.id, {
        don_vi_van_chuyen: 'Vận chuyển kiểm thử',
        ma_van_don: `GUI-${don.id}`,
      });
    }
    if (trangThai === 'CAN_ADMIN') {
      await donHang.xacNhanDaGiao(duLieu.a, don.id);

      await khoBanGhi.capNhat('don_hang', don.id, {
        can_admin_xu_ly: 1,
        ly_do_can_xu_ly: 'Tình huống kiểm thử cần Admin xác minh trước khi giải ngân.',
      });
    }
    if (trangThai === 'HET_HAN') {
      await khoBanGhi.capNhat('don_hang', don.id, {
        han_thanh_toan: thoiGian.congGiay(await coSoDuLieu.thoiGianHienTai(), -60),
      });
    }

    console.log(`${ten}: http://localhost:5174/tai-khoan/don-hang/${don.id}`);
  }

  const donKhac = await taoDon(duLieu, duLieu.outsider, 'Đơn của người mua khác');

  console.log(`Đơn kiểm tra chặn truy cập: http://localhost:5174/tai-khoan/don-hang/${donKhac.id}`);
};
