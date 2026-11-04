const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { taoDuLieuKiemThu, phienDauGia, sanPham, hoanTac } = require('../helpers/du-lieu-mau');
const db = require('../../dist/repositories/ket-noi');
const records = require('../../dist/repositories/ban-ghi');
const khoPhien = require('../../dist/repositories/dau-gia');
const khoDon = require('../../dist/repositories/don-hang');
const dauGia = require('../../dist/services/dau-gia');
const datCoc = require('../../dist/services/dat-coc');
const donHang = require('../../dist/services/don-hang');
const dichVuSanPham = require('../../dist/services/danh-muc-san-pham');
const thoiGian = require('../../dist/utils/thoi-gian');

const hetGio = async (p) =>
  records.capNhat('phien_dau_gia', p, { thoi_gian_ket_thuc: await db.thoiGianHienTai() });
const hetHanThanhToan = async (id) =>
  records.capNhat('don_hang', id, {
    han_thanh_toan: thoiGian.congGiay(await db.thoiGianHienTai(), -1),
  });
const thongBao = (nguoiDungId, loai) =>
  db.truyVan('SELECT * FROM thong_bao WHERE nguoi_dung_id=? AND loai=?', [nguoiDungId, loai]);
const cuaNguoiBan = async (d, id) =>
  (await dichVuSanPham.danhSach(d.seller, { limit: 100 }, 'mine')).find(
    (muc) => String(muc.id) === String(id),
  );

test('Danh sách người bán: bản nháp không được tạo phiên và có lý do; sản phẩm đủ điều kiện thì không', () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const nhap = await cuaNguoiBan(d, await sanPham(d, { trang_thai_duyet: 'BAN_NHAP' }));
    const duoc = await cuaNguoiBan(d, await sanPham(d));

    assert.equal(Number(nhap.co_the_tao_phien), 0);
    assert.match(nhap.ly_do_khong_tao_phien, /bản nháp/);
    assert.equal(Number(duoc.co_the_tao_phien), 1);
    assert.equal(duoc.ly_do_khong_tao_phien, null);
  }));

test('Đơn hoàn tiền chưa thu hồi hàng: giải thích lý do, gắn đơn, chặn tạo phiên và nhắc Admin một lần', () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const p = await phienDauGia(d);

    await dauGia.datGia(d.a, p, { gia_toi_da: '20000000' });
    await hetGio(p);
    await dauGia.xuLyDenHan(p);

    const don = await khoDon.donDangXuLyCuaPhien(p);

    await records.capNhat('don_hang', don.id, {
      trang_thai: 'DA_HUY',
      ly_do_huy: 'HOAN_TIEN_TRANH_CHAP',
    });

    const phien = await khoPhien.layTheoId(p);
    const muc = await cuaNguoiBan(d, phien.san_pham_id);

    assert.equal(Number(muc.co_the_tao_phien), 0);
    assert.match(muc.ly_do_khong_tao_phien, /chưa được thu hồi/);
    assert.equal(String(muc.don_hang_lien_quan_id), String(don.id));

    const bay = thoiGian.congGiay(await db.thoiGianHienTai(), 3600).replace(' ', 'T') + '+07:00';

    await assert.rejects(
      dauGia.tao(d.seller, {
        san_pham_id: phien.san_pham_id,
        gia_khoi_diem: '1000000',
        thoi_gian_bat_dau: bay,
        thoi_gian_ket_thuc:
          thoiGian.congGiay(bay.slice(0, 19).replace('T', ' '), 3600).replace(' ', 'T') + '+07:00',
      }),
      { status: 409, message: /chưa được thu hồi/ },
    );

    assert.ok((await khoDon.donTreoCanAdmin()).some((x) => String(x.id) === String(don.id)));
    await donHang.nhacAdminDonTreo(don.id);
    await donHang.nhacAdminDonTreo(don.id);
    assert.equal((await thongBao(d.admin.id, 'DON_TREO_CAN_ADMIN')).length, 1);
    assert.ok(!(await khoDon.donTreoCanAdmin()).some((x) => String(x.id) === String(don.id)));

    const chiTiet = await dauGia.chiTietCuaToi(d.seller, p);

    assert.equal(String(chiTiet.ket_qua_sau_phien.don_hang.id), String(don.id));
    assert.equal(chiTiet.ket_qua_sau_phien.co_the_dang_lai, false);
  }));

test('Phiên thất bại báo người bán, đóng yêu cầu hủy còn mở và cho đăng lại', () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const p = await phienDauGia(d);

    assert.equal((await dauGia.chiTietCuaToi(d.seller, p)).ket_qua_sau_phien, null);
    await dauGia.guiYeuCauHuy(d.seller, p, { ly_do: 'Cần hủy để kiểm tra lại' });
    await hetGio(p);
    await dauGia.xuLyDenHan(p);

    const chiTiet = await dauGia.chiTietCuaToi(d.seller, p);

    assert.equal((await thongBao(d.seller.id, 'PHIEN_THAT_BAI')).length, 1);
    assert.equal(chiTiet.yeu_cau_huy_moi_nhat.trang_thai, 'TU_CHOI');
    assert.equal(chiTiet.ket_qua_sau_phien.don_hang, null);
    assert.equal(chiTiet.ket_qua_sau_phien.co_the_dang_lai, true);
  }));

async function donCoCoc(d) {
  const p = await phienDauGia(d, { yeu_cau_dat_coc: 1, so_tien_dat_coc: '1000000.00' });

  await datCoc.dangKy(d.a, p);
  await datCoc.thanhToan(d.a, p, { ket_qua_mo_phong: 'THANH_CONG' });
  await dauGia.datGia(d.a, p, { gia_toi_da: '20000000' });

  return p;
}

test('Người thắng bị khóa: đơn cần Admin, hết hạn không tự ghi vi phạm, cọc chờ quyết toán', () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const p = await donCoCoc(d);

    await records.capNhat('nguoi_dung', d.a.id, { trang_thai_tai_khoan: 'BI_KHOA' });
    await hetGio(p);
    await dauGia.xuLyDenHan(p);

    const don = await khoDon.donDangXuLyCuaPhien(p);

    assert.equal(Number(don.can_admin_xu_ly), 1);
    assert.equal((await thongBao(d.admin.id, 'NGUOI_THANG_BI_HAN_CHE')).length, 1);

    await hetHanThanhToan(don.id);
    await donHang.xuLyDenHan(don.id);

    const sau = await records.layTheoId('don_hang', don.id);

    assert.equal(sau.trang_thai, 'DA_HUY');
    assert.equal(await khoDon.viPhamCuaDon(don.id, 'KHONG_THANH_TOAN'), null);
    assert.match(sau.ly_do_can_xu_ly, /không tự phạt/);
    assert.equal((await thongBao(d.admin.id, 'DON_TREO_CAN_ADMIN')).length, 1);
  }));

test('Bỏ thanh toán có cọc: vẫn ghi vi phạm, báo rõ cọc chờ quyết toán cho hai bên', () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const p = await donCoCoc(d);

    await hetGio(p);
    await dauGia.xuLyDenHan(p);

    const don = await khoDon.donDangXuLyCuaPhien(p);

    await hetHanThanhToan(don.id);
    await donHang.xuLyDenHan(don.id);

    assert.ok(await khoDon.viPhamCuaDon(don.id, 'KHONG_THANH_TOAN'));
    assert.match((await thongBao(d.a.id, 'HET_HAN_THANH_TOAN'))[0].noi_dung, /cọc/);
    assert.match((await thongBao(d.seller.id, 'DON_KHONG_THANH_TOAN'))[0].noi_dung, /cọc/);
  }));

after(require('../helpers/dong-ket-noi').dongKetNoiMotLan);
