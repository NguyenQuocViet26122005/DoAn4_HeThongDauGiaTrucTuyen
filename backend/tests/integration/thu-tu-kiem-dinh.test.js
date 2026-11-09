const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { taoDuLieuKiemThu, sanPham, hoanTac } = require('../helpers/du-lieu-mau');
const records = require('../../dist/repositories/ban-ghi');
const kiemDinh = require('../../dist/services/kiem-dinh');
const sanPhamDichVu = require('../../dist/services/danh-muc-san-pham');

test('Bị từ chối khi hàng chưa gửi: người bán sửa được, nhưng chưa gửi duyệt lại thì chưa gửi hàng', () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const sp = await sanPham(d, { trang_thai_duyet: 'CHO_XU_LY', bat_buoc_kiem_dinh: 1 });
    const hoSo = await kiemDinh.tao(d.admin, sp);

    await sanPhamDichVu.duyet(d.admin, sp, {
      trang_thai_duyet: 'TU_CHOI',
      ly_do_tu_choi: 'Mô tả chưa rõ',
    });

    // Hàng còn ở tay người bán nên được sửa nội dung.
    const daSua = await sanPhamDichVu.luuSanPham(d.seller, sp, {
      danh_muc_id: d.categoryId,
      tieu_de: 'Tiêu đề đã sửa',
      mo_ta: 'Mô tả bổ sung theo yêu cầu',
      tinh_trang_san_pham: 'MOI',
    });

    assert.equal(daSua.trang_thai_duyet, 'BAN_NHAP');
    await assert.rejects(
      kiemDinh.guiTrungTam(d.seller, hoSo.id, { don_vi_van_chuyen: 'Thử', ma_van_don: 'X1' }),
      { status: 409 },
    );
    assert.equal(
      (await records.layTheoId('kiem_dinh_san_pham', hoSo.id)).trang_thai,
      'CHO_GUI_TRUNG_TAM',
    );
  }));

test('Hàng đã gửi đi: Admin không được từ chối giữa chừng và không tiếp nhận trước khai báo gửi', () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const sp = await sanPham(d, { trang_thai_duyet: 'CHO_XU_LY', bat_buoc_kiem_dinh: 1 });
    const hoSo = await kiemDinh.tao(d.admin, sp);
    const nhan = { tinh_trang_khi_nhan: 'Nguyên niêm phong', so_kien: 1 };

    await assert.rejects(kiemDinh.nhanHang(d.admin, hoSo.id, nhan), {
      status: 409,
      message: /chưa khai báo gửi hàng/,
    });
    await kiemDinh.guiTrungTam(d.seller, hoSo.id, { don_vi_van_chuyen: 'Thử', ma_van_don: 'X2' });
    await assert.rejects(
      sanPhamDichVu.duyet(d.admin, sp, { trang_thai_duyet: 'TU_CHOI', ly_do_tu_choi: 'Thử' }),
      { status: 409 },
    );

    const daNhan = await kiemDinh.nhanHang(d.admin, hoSo.id, {
      ...nhan,
      serial_khi_nhan: '  SN-12345  ',
    });

    // Serial thật được giữ nguyên (đã bỏ khoảng trắng), không bị thay bằng mã tem.
    assert.equal(daNhan.serial_khi_nhan, 'SN-12345');
  }));

after(require('../helpers/dong-ket-noi').dongKetNoiMotLan);
