const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { taoDuLieuKiemThu, phienDauGia, hoanTac } = require('../helpers/du-lieu-mau');
const records = require('../../dist/repositories/ban-ghi');
const khoPhien = require('../../dist/repositories/dau-gia');
const dauGia = require('../../dist/services/dau-gia');
const donHang = require('../../dist/services/don-hang');
const cauHinh = require('../../dist/services/cau-hinh');
const khoDon = require('../../dist/repositories/don-hang');
const khoTuongTac = require('../../dist/repositories/tuong-tac');
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

    // Cùng liên kết đơn: người bán được đánh dấu la_nguoi_ban để mở khu người bán.
    const coCo = async (nguoiDung) =>
      (await khoTuongTac.danhSachThongBao(nguoiDung.id, { limit: 50, offset: 0 }))
        .filter((x) => x.duong_dan_lien_ket === `/orders/${don.id}`)
        .map((x) => Number(x.la_nguoi_ban));

    assert.deepEqual([...new Set(await coCo(d.seller))], [1]);
    assert.deepEqual([...new Set(await coCo(d.b))], [0]);
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

test('Đọc chi tiết hoặc danh sách tự chốt phiên đã đến hạn, không chờ tác vụ định kỳ', () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const hienTai = await db.thoiGianHienTai();
    const sapMo = await phienDauGia(d, {
      trang_thai: 'DA_LEN_LICH',
      thoi_gian_bat_dau: thoiGian.congGiay(hienTai, -5),
    });

    assert.equal((await dauGia.chiTiet(sapMo)).trang_thai, 'HOAT_DONG');

    const coNguoiThang = await phienDauGia(d);

    await dauGia.datGia(d.a, coNguoiThang, { gia_toi_da: '20000000' });
    await records.capNhat('phien_dau_gia', coNguoiThang, {
      thoi_gian_ket_thuc: thoiGian.congGiay(hienTai, -1),
    });

    const daChot = await dauGia.chiTiet(coNguoiThang);

    assert.equal(daChot.trang_thai, 'DA_KET_THUC');
    assert.ok(await khoDon.donDangXuLyCuaPhien(coNguoiThang));

    const khongAi = await phienDauGia(d, { thoi_gian_ket_thuc: thoiGian.congGiay(hienTai, -1) });

    await dauGia.danhSach(null, { q: d.prefix, limit: 5 });
    assert.equal((await khoPhien.layTheoId(khongAi)).trang_thai, 'THAT_BAI');
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
