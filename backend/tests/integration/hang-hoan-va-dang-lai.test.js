const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {
  taoDuLieuKiemThu,
  phienDauGia,
  hoanTac,
  thuHoiVaKiemKe,
} = require('../helpers/du-lieu-mau');
const db = require('../../dist/repositories/ket-noi');
const records = require('../../dist/repositories/ban-ghi');
const khoPhien = require('../../dist/repositories/dau-gia');
const khoDon = require('../../dist/repositories/don-hang');
const khoSanPham = require('../../dist/repositories/danh-muc-san-pham');
const khoTuongTac = require('../../dist/repositories/tuong-tac');
const dauGia = require('../../dist/services/dau-gia');
const donHang = require('../../dist/services/don-hang');
const tranhChap = require('../../dist/services/tranh-chap');
const hang = require('../../dist/services/hang-hoan');
const deNghi = require('../../dist/services/de-nghi-mua-tiep');
const kiemDinh = require('../../dist/services/kiem-dinh');
const sanPham = require('../../dist/services/danh-muc-san-pham');
const cauHinh = require('../../dist/services/cau-hinh');
const taiTep = require('../../dist/services/tai-tep');
const { cauHinh: moiTruong } = require('../../dist/config/moi-truong');
const thoiGian = require('../../dist/utils/thoi-gian');

async function duLieuPhienMoi(sanPhamId) {
  const now = await db.thoiGianHienTai();
  const iso = (n) => thoiGian.congGiay(now, n).replace(' ', 'T') + '+07:00';

  return {
    san_pham_id: String(sanPhamId),
    gia_khoi_diem: '18000000',
    thoi_gian_bat_dau: iso(120),
    thoi_gian_ket_thuc: iso(7200),
  };
}

async function donDaGui(d, nhanHang = true) {
  const p = await phienDauGia(d, { gia_mua_ngay: '24000000', cho_phep_mua_ngay: 1 });
  const don = (await dauGia.muaNgay(d.a, p, {})).don_hang;

  await donHang.guiHang(d.seller, don.id, {
    don_vi_van_chuyen: 'Kiểm thử',
    ma_van_don: 'GIAO-THU',
  });
  if (nhanHang) {
    await donHang.xacNhanDaGiao(d.a, don.id);
  }

  return don;
}

test('Hủy vì đổi ý trước gửi là yêu cầu xét duyệt; không tự hủy/hoàn và không cho người ngoài thao tác', () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const p = await phienDauGia(d, { gia_mua_ngay: '24000000', cho_phep_mua_ngay: 1 });
    const don = (await dauGia.muaNgay(d.a, p, {})).don_hang;

    await assert.rejects(tranhChap.mo(d.a, don.id, { ly_do: 'KHAC', mo_ta: 'Chưa giao' }), {
      status: 409,
    });

    const tc = await tranhChap.mo(d.a, don.id, {
      ly_do: 'KHAC',
      mo_ta: 'Xin không tiếp tục nhận hàng',
      yeu_cau_huy: true,
    });

    assert.equal((await donHang.chiTiet(d.a, don.id)).so_tien_dang_giu, don.tong_tien);
    await assert.rejects(hang.xuLy(d.a, don.id, { thao_tac: 'KHOI_TAO', ghi_chu: 'Tự hủy' }), {
      status: 409,
    });
    await assert.rejects(
      tranhChap.giaiQuyet(d.admin, tc.id, { ket_qua: 'NGUOI_MUA', ket_qua_xu_ly: 'Chưa kiểm kê' }),
      { status: 409 },
    );
    await assert.rejects(
      tranhChap.giaiQuyet(d.admin, tc.id, { ket_qua: 'NGUOI_BAN', ket_qua_xu_ly: 'Chưa giao' }),
      { status: 409 },
    );
    await hang.xuLy(d.admin, don.id, {
      thao_tac: 'KHOI_TAO',
      ghi_chu: 'Thu hồi hàng từ người bán',
    });
    await assert.rejects(
      hang.xuLy(d.outsider, don.id, {
        thao_tac: 'GUI_HOAN',
        don_vi_van_chuyen: 'THU',
        ma_van_don: 'THU',
        ghi_chu: 'Không phải chủ hàng',
      }),
      { status: 409 },
    );
    await hang.xuLy(d.seller, don.id, {
      thao_tac: 'GUI_HOAN',
      don_vi_van_chuyen: 'THU',
      ma_van_don: 'THU',
      ghi_chu: 'Gửi về trung tâm',
    });
    assert.equal((await donHang.chiTiet(d.admin, don.id)).xu_ly_hang.trang_thai, 'DANG_HOAN_VE');
  }));

test('Hàng lỗi: kiểm kê, hoàn đủ, trả seller, xác nhận nhận và tạo duy nhất hồ sơ bán lại liên kết gốc', () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const don = await donDaGui(d);
    const tc = await tranhChap.mo(d.a, don.id, {
      ly_do: 'THIEU_PHU_KIEN',
      mo_ta: 'Thiếu phụ kiện so với mô tả',
    });

    await assert.rejects(
      tranhChap.giaiQuyet(d.admin, tc.id, { ket_qua: 'NGUOI_MUA', ket_qua_xu_ly: 'Chưa thu hồi' }),
      { status: 409 },
    );

    const sau = await thuHoiVaKiemKe(d, don.id);
    const phien = await khoPhien.layTheoId(don.phien_dau_gia_id);
    const goc = await records.layTheoId('san_pham', phien.san_pham_id);

    assert.equal(sau.xu_ly_hang.trang_thai, 'CAN_XU_LY');
    await assert.rejects(hang.xuLy(d.admin, don.id, { thao_tac: 'CHO_PHEP_BAN_LAI' }), {
      status: 409,
    });
    await tranhChap.giaiQuyet(d.admin, tc.id, {
      ket_qua: 'NGUOI_MUA',
      ket_qua_xu_ly: 'Đã nhận và kiểm kê, hoàn toàn bộ',
    });
    assert.equal(await khoSanPham.sanPhamDuocTaoPhien(goc.id), null);
    await assert.rejects(deNghi.tao(d.seller, don.id), { status: 409 });
    await hang.xuLy(d.admin, don.id, {
      thao_tac: 'TRA_NGUOI_BAN',
      don_vi_van_chuyen: 'THU',
      ma_van_don: 'TRA-THU',
      ghi_chu: 'Trả để bổ sung phụ kiện',
    });
    await assert.rejects(hang.xuLy(d.a, don.id, { thao_tac: 'XAC_NHAN_NHAN_LAI' }), {
      status: 409,
    });
    await hang.xuLy(d.seller, don.id, { thao_tac: 'XAC_NHAN_NHAN_LAI' });

    const moi = await hang.xuLy(d.seller, don.id, { thao_tac: 'DANG_KY_LAI' });
    const lap = await hang.xuLy(d.seller, don.id, { thao_tac: 'DANG_KY_LAI' });
    const pMoi = await records.layTheoId('san_pham', moi.xu_ly_hang.san_pham_dang_lai_id);

    assert.equal(String(pMoi.san_pham_goc_id), String(goc.id));
    assert.equal(pMoi.trang_thai_duyet, 'BAN_NHAP');
    assert.equal(Number(pMoi.bat_buoc_kiem_dinh), 1);
    assert.equal(lap.xu_ly_hang.san_pham_dang_lai_id, moi.xu_ly_hang.san_pham_dang_lai_id);
    assert.equal((await records.layTheoId('san_pham', goc.id)).mo_ta, goc.mo_ta);
    assert.equal((await khoDon.tienTrungGian(don.id)).so_tien_da_hoan, don.tong_tien);
    await assert.rejects(dauGia.tao(d.seller, await duLieuPhienMoi(goc.id)), { status: 409 });
  }));

test('Chưa nhận hàng: hoàn về nguyên vẹn vẫn cần kiểm định mới và duyệt trước mở phiên mới', async () => {
  const cacTep = [];

  try {
    await hoanTac(async () => {
      const d = await taoDuLieuKiemThu();
      const don = await donDaGui(d, false);

      await records.capNhat('don_hang', don.id, {
        moc_khieu_nai_chua_nhan: thoiGian.congGiay(await db.thoiGianHienTai(), -1),
      });

      const tc = await tranhChap.mo(d.a, don.id, {
        ly_do: 'CHUA_NHAN_HANG',
        mo_ta: 'Kiện giao không thành công',
      });
      const sau = await thuHoiVaKiemKe(d, don.id, 'NGUYEN_VEN');
      const kiemDinhMoi = sau.xu_ly_hang.kiem_dinh_moi_id;

      assert.ok(kiemDinhMoi);
      await tranhChap.giaiQuyet(d.admin, tc.id, {
        ket_qua: 'NGUOI_MUA',
        ket_qua_xu_ly: 'Đã đối chiếu nhận lại, hoàn toàn bộ',
      });
      await assert.rejects(hang.xuLy(d.admin, don.id, { thao_tac: 'CHO_PHEP_BAN_LAI' }), {
        status: 409,
      });
      await kiemDinh.batDau(d.admin, kiemDinhMoi);

      const buffer = Buffer.from('%PDF-1.4\n%%EOF');
      const tep = await taiTep.luu(d.admin, 'inspection', {
        buffer,
        size: buffer.length,
        mimetype: 'application/pdf',
      });
      const viTri = path.resolve(
        moiTruong.uploadRoot,
        tep.duong_dan.replace('/api/uploads/files/', ''),
      );

      assert.ok(viTri.startsWith(path.resolve(moiTruong.uploadRoot) + path.sep));
      cacTep.push(viTri);
      await kiemDinh.themTep(d.admin, kiemDinhMoi, {
        loai_tep: 'BAO_CAO_KIEM_DINH',
        duong_dan_tep: tep.duong_dan,
      });
      await kiemDinh.ghiKetQua(d.admin, kiemDinhMoi, {
        ket_qua: 'DAT',
        ten_chuyen_gia: 'Chuyên gia kiểm thử',
        don_vi_kiem_dinh: 'Trung tâm kiểm thử',
        ngay_kiem_dinh: (await db.thoiGianHienTai()).replace(' ', 'T') + '+07:00',
        nhan_xet: 'Đã đối chiếu sau hoàn hàng',
      });
      await sanPham.duyet(d.admin, sau.san_pham_id, { trang_thai_duyet: 'DA_DUYET' });
      await hang.xuLy(d.admin, don.id, { thao_tac: 'CHO_PHEP_BAN_LAI' });

      const phienMoi = await dauGia.tao(d.seller, await duLieuPhienMoi(sau.san_pham_id));

      assert.notEqual(String(phienMoi.id), String(don.phien_dau_gia_id));
      await assert.rejects(dauGia.tao(d.seller, await duLieuPhienMoi(sau.san_pham_id)), {
        status: 409,
      });
      assert.equal((await records.layTheoId('don_hang', don.id)).trang_thai, 'DA_HUY');
    });
  } finally {
    for (const tep of cacTep) {
      await fs.unlink(tep);
    }
  }
});

test('Thất lạc cần căn cứ, không cho kiểm kê giả hoặc bán lại; không khớp kiểm định cần hồ sơ thật', () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const don = await donDaGui(d, false);

    await assert.rejects(
      tranhChap.mo(d.admin, don.id, {
        ly_do: 'KHONG_KHOP_HO_SO_KIEM_DINH',
        mo_ta: 'Đơn không có hồ sơ',
      }),
      { status: 409 },
    );

    const tc = await tranhChap.mo(d.admin, don.id, {
      ly_do: 'KHAC',
      mo_ta: 'Hãng vận chuyển xác minh thất lạc',
    });

    await hang.xuLy(d.admin, don.id, { thao_tac: 'KHOI_TAO', ghi_chu: 'Tìm lại kiện hàng' });
    await assert.rejects(
      hang.xuLy(d.admin, don.id, {
        thao_tac: 'KIEM_KE',
        serial: 'THU',
        ket_qua: 'NGUYEN_VEN',
        phu_kien: 'THU',
        ghi_chu: 'Chưa về',
      }),
      { status: 409 },
    );
    await assert.rejects(hang.xuLy(d.admin, don.id, { thao_tac: 'THAT_LAC', ghi_chu: 'Ngắn' }), {
      status: 400,
    });
    await hang.xuLy(d.admin, don.id, {
      thao_tac: 'THAT_LAC',
      ghi_chu: 'Đã xác minh đơn vị vận chuyển làm thất lạc kiện hàng theo biên bản đối chiếu.',
    });
    await tranhChap.giaiQuyet(d.admin, tc.id, {
      ket_qua: 'NGUOI_MUA',
      ket_qua_xu_ly: 'Hoàn toàn bộ vì mất kiện',
    });

    const sau = await donHang.chiTiet(d.admin, don.id);

    assert.equal(sau.xu_ly_hang.trang_thai, 'THAT_LAC');
    assert.deepEqual(sau.thao_tac_hang, ['KET_LUAN_TRACH_NHIEM']);
    assert.equal(await khoSanPham.sanPhamDuocTaoPhien(sau.san_pham_id), null);
  }));

test('Đã đăng phiên mới thì không gửi Second Chance từ phiên cũ; khóa món hàng xuyên hồ sơ', () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const p = await phienDauGia(d);

    await dauGia.datGia(d.b, p, { gia_toi_da: '20000000' });
    await dauGia.datGia(d.a, p, { gia_toi_da: '22000000' });
    await records.capNhat('phien_dau_gia', p, { thoi_gian_ket_thuc: await db.thoiGianHienTai() });
    await dauGia.xuLyDenHan(p);

    const don = await khoDon.donDangXuLyCuaPhien(p);

    await records.capNhat('don_hang', don.id, {
      han_thanh_toan: thoiGian.congGiay(await db.thoiGianHienTai(), -1),
    });
    await donHang.xuLyDenHan(don.id);

    const phien = await khoPhien.layTheoId(p);
    const moi = await dauGia.tao(d.seller, await duLieuPhienMoi(phien.san_pham_id));

    await assert.rejects(deNghi.tao(d.seller, don.id), { status: 409 });

    const banGoc = await records.layTheoId('san_pham', phien.san_pham_id);
    const lienKet = await records.them('san_pham', {
      nguoi_ban_id: d.seller.id,
      san_pham_goc_id: banGoc.id,
      danh_muc_id: d.categoryId,
      tieu_de: 'Hồ sơ khác cùng món',
      duong_dan: d.prefix + '-lien-ket',
      mo_ta: 'Kiểm thử tránh bán trùng',
      tinh_trang_san_pham: 'MOI',
      trang_thai_duyet: 'DA_DUYET',
    });

    await assert.rejects(dauGia.tao(d.seller, await duLieuPhienMoi(lienKet)), { status: 409 });
    assert.equal((await khoPhien.layTheoId(moi.id)).trang_thai, 'DA_LEN_LICH');

    await records.them('vi_pham', {
      nguoi_dung_id: d.seller.id,
      phien_dau_gia_id: p,
      loai_vi_pham: 'KHAC',
      mo_ta: '[BAO CAO SAN PHAM] Kiểm thử báo cáo trùng trên bản đăng lại',
      diem_vi_pham: 0,
      trang_thai: 'DANG_MO',
      nguoi_tao_id: d.b.id,
      hinh_thuc_xu_ly: 'CHUA_XU_LY',
    });
    assert.ok(await khoTuongTac.daBaoCaoSanPham(d.b.id, lienKet));
    assert.ok(!(await khoTuongTac.daBaoCaoSanPham(d.a.id, lienKet)));
  }));

test('Cọc từng phiên: bắt buộc/tùy chọn/tắt và snapshot không đổi sau cập nhật chính sách', () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const tao = async (bat) => {
      const sp = await require('../helpers/du-lieu-mau').sanPham(d);

      return dauGia.tao(d.seller, { ...(await duLieuPhienMoi(sp)), yeu_cau_dat_coc: bat });
    };
    const luu = (bat, chon) =>
      cauHinh.luu(d.admin, 'DEPOSIT_POLICY', {
        gia_tri_cau_hinh: {
          bat,
          cho_phep_nguoi_ban_chon: chon,
          kieu: 'TY_LE',
          gia_tri: 10,
        },
      });

    await luu(true, false);
    await assert.rejects(tao(false), { status: 409 });
    await luu(true, true);

    const co = await tao(true);
    const khong = await tao(false);

    assert.equal(Number(co.yeu_cau_dat_coc), 1);
    assert.equal(co.so_tien_dat_coc, '1800000.00');
    assert.equal(Number(khong.yeu_cau_dat_coc), 0);
    await luu(false, true);
    await assert.rejects(tao(true), { status: 409 });
    assert.equal((await khoPhien.layTheoId(co.id)).so_tien_dat_coc, '1800000.00');
  }));

test('Khiếu nại không có căn cứ: dừng thu hồi trước gửi và giải ngân khi đã có xác nhận giao', () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const don = await donDaGui(d);
    const tc = await tranhChap.mo(d.a, don.id, {
      ly_do: 'KHAC',
      mo_ta: 'Đề nghị kiểm tra giao dịch',
    });

    await hang.xuLy(d.admin, don.id, {
      thao_tac: 'KHOI_TAO',
      ghi_chu: 'Xác minh yêu cầu trước khi thu hồi',
    });
    await hang.xuLy(d.admin, don.id, {
      thao_tac: 'DUNG_THU_HOI',
      ghi_chu: 'Đã đối chiếu chứng cứ, người mua đang giữ đúng hàng',
    });
    await tranhChap.giaiQuyet(d.admin, tc.id, {
      ket_qua: 'NGUOI_BAN',
      ket_qua_xu_ly: 'Đã giao đúng hàng theo chứng cứ hai bên',
    });
    assert.equal((await khoDon.tienTrungGian(don.id)).so_tien_da_giai_ngan, don.tong_tien);
    assert.equal((await donHang.chiTiet(d.admin, don.id)).trang_thai, 'HOAN_THANH');
  }));

test('Hàng thu hồi hợp lệ gửi lại buyer: chưa xác nhận giao lại không giải ngân và giữ nguyên báo cáo cũ', async () => {
  const cacTep = [];

  try {
    await hoanTac(async () => {
      const d = await taoDuLieuKiemThu();
      const don = await donDaGui(d);
      const tc = await tranhChap.mo(d.a, don.id, {
        ly_do: 'KHAC',
        mo_ta: 'Đề nghị đối chiếu lại sản phẩm',
      });
      const sau = await thuHoiVaKiemKe(d, don.id, 'NGUYEN_VEN');
      const id = sau.xu_ly_hang.kiem_dinh_moi_id;

      await kiemDinh.batDau(d.admin, id);

      const buffer = Buffer.from('%PDF-1.4\n%%EOF');
      const tep = await taiTep.luu(d.admin, 'inspection', {
        buffer,
        size: buffer.length,
        mimetype: 'application/pdf',
      });
      const viTri = path.resolve(
        moiTruong.uploadRoot,
        tep.duong_dan.replace('/api/uploads/files/', ''),
      );

      assert.ok(viTri.startsWith(path.resolve(moiTruong.uploadRoot) + path.sep));
      cacTep.push(viTri);
      await kiemDinh.themTep(d.admin, id, {
        loai_tep: 'BAO_CAO_KIEM_DINH',
        duong_dan_tep: tep.duong_dan,
      });
      await kiemDinh.ghiKetQua(d.admin, id, {
        ket_qua: 'DAT',
        ten_chuyen_gia: 'Chuyên gia kiểm thử',
        don_vi_kiem_dinh: 'Trung tâm kiểm thử',
        ngay_kiem_dinh: (await db.thoiGianHienTai()).replace(' ', 'T') + '+07:00',
        nhan_xet: 'Hàng phù hợp, gửi lại người mua',
      });
      await sanPham.duyet(d.admin, sau.san_pham_id, { trang_thai_duyet: 'DA_DUYET' });
      await hang.xuLy(d.admin, don.id, {
        thao_tac: 'GUI_LAI_NGUOI_MUA',
        don_vi_van_chuyen: 'Kiểm thử',
        ma_van_don: 'GIAO-LAI',
        ghi_chu: 'Gửi lại đúng người mua của đơn',
      });
      await assert.rejects(
        tranhChap.giaiQuyet(d.admin, tc.id, {
          ket_qua: 'NGUOI_BAN',
          ket_qua_xu_ly: 'Chưa xác nhận giao lại',
        }),
        { status: 409 },
      );
      await assert.rejects(hang.xuLy(d.seller, don.id, { thao_tac: 'XAC_NHAN_GIAO_LAI' }), {
        status: 409,
      });
      await hang.xuLy(d.a, don.id, { thao_tac: 'XAC_NHAN_GIAO_LAI' });
      await tranhChap.giaiQuyet(d.admin, tc.id, {
        ket_qua: 'NGUOI_BAN',
        ket_qua_xu_ly: 'Người mua nhận lại đúng hàng, kết thúc tranh chấp',
      });
      assert.equal((await donHang.chiTiet(d.admin, don.id)).trang_thai, 'HOAN_THANH');
      assert.equal((await khoDon.tienTrungGian(don.id)).so_tien_da_giai_ngan, don.tong_tien);
      assert.equal((await records.layTheoId('kiem_dinh_san_pham', id)).ket_qua, 'DAT');
    });
  } finally {
    for (const tep of cacTep) {
      await fs.unlink(tep);
    }
  }
});

after(require('../helpers/dong-ket-noi').dongKetNoiMotLan);
