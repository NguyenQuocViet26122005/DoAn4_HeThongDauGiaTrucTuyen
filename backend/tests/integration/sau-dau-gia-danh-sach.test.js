const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { taoDuLieuKiemThu, phienDauGia, hoanTac } = require('../helpers/du-lieu-mau');
const records = require('../../dist/repositories/ban-ghi');
const khoPhien = require('../../dist/repositories/dau-gia');
const dauGia = require('../../dist/services/dau-gia');
const donHang = require('../../dist/services/don-hang');
const cauHinh = require('../../dist/services/cau-hinh');
const khoDon = require('../../dist/repositories/don-hang');
const db = require('../../dist/repositories/ket-noi');
const thoiGian = require('../../dist/utils/thoi-gian');

test('Phiên cũ vẫn hiện với Admin, người bán và người mua khi sản phẩm quay về chờ xử lý; danh sách công khai thì ẩn', () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const p = await phienDauGia(d);

    await dauGia.datGia(d.a, p, { gia_toi_da: '20000000' });

    const phien = await khoPhien.layTheoId(p);

    await records.capNhat('san_pham', phien.san_pham_id, { trang_thai_duyet: 'CHO_XU_LY' });

    const co = async (nguoiDung, phamVi) =>
      (await dauGia.danhSach(nguoiDung, { q: d.prefix, limit: 100 }, phamVi)).some(
        (x) => String(x.id) === String(p),
      );

    assert.equal(await co(d.admin, 'admin'), true);
    assert.equal(await co(d.seller, 'mine'), true);
    assert.equal(await co(d.a, 'bids'), true);
    assert.equal(await co(null, 'public'), false);
  }));

test('Sau phiên: báo người thắng, đơn có tên sản phẩm, người bán xem trước ứng viên mua tiếp', () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const p = await phienDauGia(d, { gia_san: '19000000.00' });

    await dauGia.datGia(d.a, p, { gia_toi_da: '20000000' });
    await dauGia.datGia(d.b, p, { gia_toi_da: '22000000' });
    // Theo hợp đồng API, giá sàn không được trả ra, kể cả cho người bán.
    assert.equal(Object.hasOwn(await dauGia.chiTietCuaToi(d.seller, p), 'gia_san'), false);

    await records.capNhat('phien_dau_gia', p, { thoi_gian_ket_thuc: await db.thoiGianHienTai() });
    await dauGia.xuLyDenHan(p);

    const don = await khoDon.donDangXuLyCuaPhien(p);
    const thang = await db.truyVan('SELECT * FROM thong_bao WHERE nguoi_dung_id=? AND loai=?', [
      d.b.id,
      'THANG_PHIEN',
    ]);

    assert.equal(thang.length, 1);
    assert.equal(thang[0].duong_dan_lien_ket, `/orders/${don.id}`);
    assert.match((await donHang.chiTiet(d.b, don.id)).tieu_de_san_pham, /Sản phẩm/);

    await records.capNhat('don_hang', don.id, {
      han_thanh_toan: thoiGian.congGiay(await db.thoiGianHienTai(), -1),
    });
    await donHang.xuLyDenHan(don.id);

    const choNguoiBan = await donHang.chiTiet(d.seller, don.id);

    assert.equal(choNguoiBan.ung_vien_de_nghi.ma_cong_khai, `ND-${d.a.id}`);
    assert.equal(choNguoiBan.ung_vien_de_nghi.gia, '20000000.00');
    assert.equal((await donHang.chiTiet(d.b, don.id)).ung_vien_de_nghi, null);
  }));

test('Địa chỉ trung tâm: Admin lưu chuỗi, hồ sơ kiểm định trả về; giá trị quá ngắn bị từ chối', () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();

    await assert.rejects(
      cauHinh.luu(d.admin, 'INSPECTION_CENTER_ADDRESS', { gia_tri_cau_hinh: 'ngắn' }),
      { status: 400 },
    );
    await cauHinh.luu(d.admin, 'INSPECTION_CENTER_ADDRESS', {
      gia_tri_cau_hinh: 'Trung tâm thử nghiệm, 1 Đường Kiểm Định, Quận 1',
    });
    assert.equal(await cauHinh.diaChiTrungTam(), 'Trung tâm thử nghiệm, 1 Đường Kiểm Định, Quận 1');
  }));

after(require('../helpers/dong-ket-noi').dongKetNoiMotLan);
