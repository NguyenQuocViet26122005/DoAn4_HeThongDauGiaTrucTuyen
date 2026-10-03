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
    ['Đơn thử người bán gửi hàng', 'CHO_GUI_HANG'],
    ['Đơn thử trung tâm gửi hàng', 'TRUNG_TAM'],
    ['Đơn thử nhận và kiểm tra hàng', 'DA_GUI_HANG'],
    ['Đơn thử cần Admin xử lý', 'CAN_ADMIN'],
    ['Đơn thử tranh chấp hoàn tiền', 'TRANH_CHAP'],
    ['Đơn thử tranh chấp giải ngân', 'TRANH_CHAP_GIAI_NGAN'],
    ['Đơn thử đã hết hạn thanh toán', 'HET_HAN'],
  ]) {
    const don = await taoDon(duLieu, duLieu.a, ten, true);

    if (['CHO_GUI_HANG', 'TRUNG_TAM', 'DA_GUI_HANG', 'CAN_ADMIN', 'TRANH_CHAP', 'TRANH_CHAP_GIAI_NGAN'].includes(trangThai)) {
      await donHang.thanhToan(duLieu.a, don.id, {});
    }
    if (trangThai === 'TRUNG_TAM') {
      const phien = await khoBanGhi.layTheoId('phien_dau_gia', don.phien_dau_gia_id);

      const hoSoId = await khoBanGhi.them('kiem_dinh_san_pham', {
        ma_kiem_dinh: `KD-THU-${don.id}`,
        san_pham_id: phien.san_pham_id,
        lan_kiem_dinh: 1,
        trang_thai: 'DANG_LUU_GIU',
        ket_qua: 'DAT',
        ngay_nhan_trung_tam: await coSoDuLieu.thoiGianHienTai(),
        ngay_kiem_dinh: await coSoDuLieu.thoiGianHienTai(),
        ten_chuyen_gia: 'Chuyên gia kiểm thử',
        don_vi_kiem_dinh: 'Trung tâm kiểm thử',
        nguoi_cap_nhat_id: duLieu.admin.id,
      });

      // Trạng thái trung tâm được chuẩn bị riêng để thử quyền gửi hàng trên web.
      await khoBanGhi.capNhat('don_hang', don.id, {
        nguon_gui_hang: 'TRUNG_TAM',
        kiem_dinh_san_pham_id: hoSoId,
      });
    }
    if (['DA_GUI_HANG', 'CAN_ADMIN', 'TRANH_CHAP', 'TRANH_CHAP_GIAI_NGAN'].includes(trangThai)) {
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
    if (trangThai.startsWith('TRANH_CHAP')) {
      await donHang.xacNhanDaGiao(duLieu.a, don.id);
      const hoSo = await require('../dist/services/tranh-chap').mo(duLieu.a, don.id, {
        ly_do: 'THIEU_PHU_KIEN',
        mo_ta: 'Hồ sơ riêng để kiểm thử quyết định hoàn tiền hoặc giải ngân.',
      });
      console.log(`Hồ sơ ${trangThai}: http://localhost:5174/quan-tri/tranh-chap/${hoSo.id}`);
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
