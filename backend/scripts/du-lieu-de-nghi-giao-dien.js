const { phienDauGia } = require('../tests/helpers/du-lieu-mau');
const khoBanGhi = require('../dist/repositories/ban-ghi');
const db = require('../dist/repositories/ket-noi');
const dauGia = require('../dist/services/dau-gia');
const datCoc = require('../dist/services/dat-coc');
const donHang = require('../dist/services/don-hang');
const deNghi = require('../dist/services/de-nghi-mua-tiep');
const khoDon = require('../dist/repositories/don-hang');
const thoiGian = require('../dist/utils/thoi-gian');

module.exports = async function taoDeNghiGiaoDien(duLieu) {
  for (const ten of ['khôi phục thanh toán', 'thất bại rồi thử lại', 'từ chối', 'hết hạn']) {
    const id = await phienDauGia(duLieu, {
      phi_van_chuyen: '50000',
      yeu_cau_dat_coc: 1,
      so_tien_dat_coc: '1800000',
    });
    const phien = await khoBanGhi.layTheoId('phien_dau_gia', id);

    await khoBanGhi.capNhat('san_pham', phien.san_pham_id, { tieu_de: `Đề nghị thử ${ten}` });

    for (const nguoi of [duLieu.a, duLieu.b]) {
      await datCoc.dangKy(nguoi, id);
      await datCoc.thanhToan(nguoi, id, {});
    }
    await dauGia.datGia(duLieu.b, id, { gia_toi_da: '21000000' });
    await dauGia.datGia(duLieu.a, id, { gia_toi_da: '25000000' });

    await khoBanGhi.capNhat('phien_dau_gia', id, {
      thoi_gian_ket_thuc: await db.thoiGianHienTai(),
    });

    await dauGia.xuLyDenHan(id);

    const don = await khoDon.donDangXuLyCuaPhien(id);

    await khoBanGhi.capNhat('don_hang', don.id, {
      han_thanh_toan: thoiGian.congGiay(await db.thoiGianHienTai(), -60),
    });

    await donHang.xuLyDenHan(don.id);
    console.log(`${ten}: http://localhost:5174/nguoi-ban/don-hang/${don.id}`);

    if (ten === 'hết hạn') {
      const daTao = await deNghi.tao(duLieu.seller, don.id);

      await khoBanGhi.capNhat('de_nghi_mua_tiep_theo', daTao.id, {
        het_han_luc: thoiGian.congGiay(await db.thoiGianHienTai(), -60),
      });

      console.log(`Đề nghị hết hạn: http://localhost:5174/tai-khoan/de-nghi/${daTao.id}`);
    }
  }
};
