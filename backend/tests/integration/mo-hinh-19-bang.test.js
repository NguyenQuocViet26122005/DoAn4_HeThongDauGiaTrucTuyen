const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const db = require('../../dist/repositories/ket-noi');
const banGhi = require('../../dist/repositories/ban-ghi');
const dauGia = require('../../dist/services/dau-gia');
const donHang = require('../../dist/services/don-hang');
const tranhChap = require('../../dist/services/tranh-chap');
const khoPhien = require('../../dist/repositories/dau-gia');
const khoDon = require('../../dist/repositories/don-hang');
const thoiGian = require('../../dist/utils/thoi-gian');
const { kiemTraDuLieuCongKhai } = require('../../dist/utils/du-lieu-cong-khai');
const { taoDuLieuKiemThu, phienDauGia, hoanTac } = require('../helpers/du-lieu-mau');

test('19 bảng: theo dõi trước không được ưu tiên; bỏ theo dõi giữ nguyên cam kết', async () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const id = await phienDauGia(d);

    await dauGia.theoDoi(d.b, id, true);
    assert.equal((await khoPhien.cacMucToiDa(id)).length, 0);
    assert.equal((await dauGia.danhSach(d.b, {}, 'bids')).length, 0);
    await dauGia.datGia(d.a, id, { gia_toi_da: '22000000' });

    const ketQua = await dauGia.datGia(d.b, id, { gia_toi_da: '22000000' });

    assert.equal(ketQua.nguoi_dan_dau, `ND-${d.a.id}`);

    const truoc = await khoPhien.cacMucToiDa(id);

    await dauGia.theoDoi(d.a, id, true);
    await dauGia.theoDoi(d.a, id, false);
    assert.deepEqual(await khoPhien.cacMucToiDa(id), truoc);
    assert.equal((await dauGia.danhSach(d.a, {}, 'watchlist')).length, 0);

    const ds = await dauGia.danhSach(d.a, {}, 'bids');

    assert.equal(ds.length, 1);
    kiemTraDuLieuCongKhai(ds);
    await assert.rejects(dauGia.datGia(d.a, id, { gia_toi_da: '23000000.01' }), { status: 400 });
  }));

test('19 bảng: thanh toán lỗi không giữ tiền; retry một lần và hoàn cả phí vận chuyển', async () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const id = await phienDauGia(d, {
      gia_mua_ngay: '24000000',
      cho_phep_mua_ngay: 1,
      phi_van_chuyen: '35000',
    });
    const { don_hang: don } = await dauGia.muaNgay(d.a, id);

    assert.equal(don.tong_tien, '24035000.00');

    const loi = { ket_qua_mo_phong: 'THAT_BAI', khoa_yeu_cau: `loi-${id}-test` };

    await donHang.thanhToan(d.a, don.id, loi);
    await donHang.thanhToan(d.a, don.id, loi);
    assert.equal((await khoDon.cacThanhToan(don.id)).length, 1);
    assert.equal((await khoDon.tienTrungGian(don.id)).trang_thai, 'CHO_GIU_TIEN');
    await donHang.thanhToan(d.a, don.id, { khoa_yeu_cau: `dat-${id}-test` });
    await donHang.thanhToan(d.a, don.id, { khoa_yeu_cau: `dat-${id}-test` });
    assert.equal((await khoDon.cacThanhToan(don.id)).length, 2);
    await donHang.guiHang(d.seller, don.id, { don_vi_van_chuyen: 'Kiểm thử', ma_van_don: 'KT-19' });
    await assert.rejects(
      tranhChap.mo(d.a, don.id, { ly_do: 'CHUA_NHAN_HANG', mo_ta: 'Chưa tới mốc 7 ngày' }),
      { status: 409 },
    );
    await banGhi.capNhat('don_hang', don.id, {
      moc_khieu_nai_chua_nhan: thoiGian.congGiay(await db.thoiGianHienTai(), -1),
    });

    const tc = await tranhChap.mo(d.a, don.id, {
      ly_do: 'CHUA_NHAN_HANG',
      mo_ta: 'Đã quá mốc chưa nhận hàng',
    });

    await assert.rejects(
      tranhChap.giaiQuyet(d.admin, tc.id, {
        ket_qua: 'NGUOI_MUA',
        so_tien_hoan: '24000000',
        ket_qua_xu_ly: 'Thiếu phí vận chuyển',
      }),
      { status: 400 },
    );
    await tranhChap.giaiQuyet(d.admin, tc.id, {
      ket_qua: 'NGUOI_MUA',
      ket_qua_xu_ly: 'Hoàn toàn bộ gồm vận chuyển',
    });

    const giu = await khoDon.tienTrungGian(don.id);

    assert.equal(giu.so_tien_da_hoan, '24035000.00');
    assert.equal(giu.so_tien_dang_giu, '0.00');
  }));

test('19 bảng: tài khoản bị khóa không được tự giải ngân khi hết hạn kiểm tra', async () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const id = await phienDauGia(d, { gia_mua_ngay: '24000000', cho_phep_mua_ngay: 1 });
    const { don_hang: don } = await dauGia.muaNgay(d.a, id);

    await donHang.thanhToan(d.a, don.id);
    await donHang.guiHang(d.seller, don.id, {
      don_vi_van_chuyen: 'Kiểm thử',
      ma_van_don: 'KT-KHOA',
    });
    await donHang.xacNhanDaGiao(d.a, don.id);
    await require('../../dist/services/nguoi-dung').doiTrangThaiTaiKhoan(d.admin, d.seller.id, {
      trang_thai_tai_khoan: 'BI_KHOA',
      ly_do: 'Cần kiểm tra',
    });
    await banGhi.capNhat('don_hang', don.id, {
      han_kiem_tra: thoiGian.congGiay(await db.thoiGianHienTai(), -1),
    });
    await donHang.xuLyDenHan(don.id);

    const sau = await donHang.chiTiet(d.a, don.id);

    assert.equal(sau.can_admin_xu_ly, 1);
    assert.equal(sau.giu_tien.trang_thai, 'DANG_GIU');

    const tc = await tranhChap.mo(d.admin, don.id, {
      ly_do: 'KHAC',
      mo_ta: 'Tiếp nhận đơn cần Admin kiểm tra',
    });

    await tranhChap.giaiQuyet(d.admin, tc.id, {
      ket_qua: 'NGUOI_MUA',
      ket_qua_xu_ly: 'Hoàn toàn bộ',
    });
    assert.equal((await khoDon.tienTrungGian(don.id)).trang_thai, 'DA_HOAN_TIEN');
  }));

after(require('../helpers/dong-ket-noi').dongKetNoiMotLan);
