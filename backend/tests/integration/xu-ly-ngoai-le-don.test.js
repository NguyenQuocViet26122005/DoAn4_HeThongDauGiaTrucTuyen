const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const {
  taoDuLieuKiemThu,
  phienDauGia,
  hoanTac,
  thuHoiVaKiemKe,
} = require('../helpers/du-lieu-mau');
const db = require('../../dist/repositories/ket-noi');
const records = require('../../dist/repositories/ban-ghi');
const khoDon = require('../../dist/repositories/don-hang');
const dauGia = require('../../dist/services/dau-gia');
const donHang = require('../../dist/services/don-hang');
const datCoc = require('../../dist/services/dat-coc');
const ngoaiLe = require('../../dist/services/xu-ly-ngoai-le-don');
const hang = require('../../dist/services/hang-hoan');
const tranhChap = require('../../dist/services/tranh-chap');
const kiemDinh = require('../../dist/services/kiem-dinh');
const thoiGian = require('../../dist/utils/thoi-gian');

const lyDo = 'Đã đối chiếu đầy đủ hồ sơ và chứng cứ liên quan đến giao dịch.';
const quyetDinh = (ket_qua) => ({
  ket_qua,
  ly_do: lyDo,
  ...(ket_qua === 'HOAN_NGUOI_MUA'
    ? { loai_ngoai_le: 'LOI_HE_THONG', tham_chieu_bang_chung: 'HO-SO-KIEM-THU-001' }
    : {}),
});

async function donBoThanhToan(d) {
  const p = await phienDauGia(d, { yeu_cau_dat_coc: 1, so_tien_dat_coc: '1800000' });

  await datCoc.dangKy(d.a, p);
  await datCoc.thanhToan(d.a, p, {});
  await dauGia.datGia(d.a, p, { gia_toi_da: '22000000' });
  await records.capNhat('phien_dau_gia', p, { thoi_gian_ket_thuc: await db.thoiGianHienTai() });
  await dauGia.xuLyDenHan(p);

  const don = await khoDon.donDangXuLyCuaPhien(p);

  await records.capNhat('don_hang', don.id, {
    han_thanh_toan: thoiGian.congGiay(await db.thoiGianHienTai(), -60),
  });
  await donHang.xuLyDenHan(don.id);

  return don;
}

async function donMuaNgay(d) {
  const p = await phienDauGia(d, { gia_mua_ngay: '24000000', cho_phep_mua_ngay: 1 });

  return (await dauGia.muaNgay(d.a, p, {})).don_hang;
}

for (const ketQua of ['BOI_HOAN_NGUOI_BAN', 'HOAN_NGUOI_MUA']) {
  test(`Cọc quá hạn: ${ketQua}, quyết toán một lần và giữ đơn hủy cùng lịch sử vi phạm`, () =>
    hoanTac(async () => {
      const d = await taoDuLieuKiemThu();
      const don = await donBoThanhToan(d);
      const nd = quyetDinh(ketQua);

      if (ketQua === 'HOAN_NGUOI_MUA') {
        await assert.rejects(
          ngoaiLe.quyetToanCoc(d.admin, don.id, { ket_qua: ketQua, ly_do: lyDo }),
          { status: 400 },
        );
        await assert.rejects(
          ngoaiLe.quyetToanCoc(d.admin, don.id, { ...nd, loai_ngoai_le: 'DOI_Y' }),
          { status: 400 },
        );
        await assert.rejects(
          ngoaiLe.quyetToanCoc(d.admin, don.id, { ...nd, tham_chieu_bang_chung: '' }),
          { status: 400 },
        );
      }

      await assert.rejects(ngoaiLe.quyetToanCoc(d.a, don.id, nd), { status: 403 });
      await assert.rejects(ngoaiLe.quyetToanCoc(d.seller, don.id, nd), { status: 403 });
      await assert.rejects(ngoaiLe.quyetToanCoc(d.admin, don.id, { ...nd, so_tien: '1' }), {
        status: 400,
      });

      const sau = await ngoaiLe.quyetToanCoc(d.admin, don.id, nd);
      const lap = await ngoaiLe.quyetToanCoc(d.admin, don.id, nd);

      assert.equal(sau.trang_thai, 'DA_HUY');
      assert.equal(sau.ly_do_huy, 'KHONG_THANH_TOAN');
      assert.equal(sau.so_tien_dang_giu, '0.00');
      assert.equal(sau.quyet_toan_coc.so_tien, '1800000.00');
      assert.equal(lap.quyet_toan_coc.ngay_xu_ly, sau.quyet_toan_coc.ngay_xu_ly);
      assert.equal(
        ketQua === 'HOAN_NGUOI_MUA' ? sau.so_tien_da_hoan : sau.so_tien_da_giai_ngan,
        '1800000.00',
      );

      const cocNguoiMua = await datCoc.cuaToi(d.a, don.phien_dau_gia_id);

      assert.equal(
        cocNguoiMua.nhan_quyet_toan,
        ketQua === 'HOAN_NGUOI_MUA'
          ? 'Đã hoàn cọc theo ngoại lệ có căn cứ'
          : 'Đã bồi hoàn cọc cho người bán',
      );
      assert.equal(
        (
          await db.layMot(
            "SELECT COUNT(*) AS n FROM nhat_ky_hoat_dong WHERE doi_tuong_id=? AND hanh_dong='QUYET_TOAN_COC_BO_THANH_TOAN'",
            [don.id],
          )
        ).n,
        '1',
      );
      assert.ok(await khoDon.viPhamCuaDon(don.id, 'KHONG_THANH_TOAN'));
      await assert.rejects(
        ngoaiLe.quyetToanCoc(
          d.admin,
          don.id,
          quyetDinh(ketQua === 'HOAN_NGUOI_MUA' ? 'BOI_HOAN_NGUOI_BAN' : 'HOAN_NGUOI_MUA'),
        ),
        { status: 409 },
      );
      await assert.rejects(donHang.xacNhanHoanThanh(d.a, don.id), { status: 409 });
    }));
}

test('Không quyết toán cọc trước hạn/đã thanh toán đủ; chặn bồi hoàn seller bị khóa', () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const nd = { ket_qua: 'BOI_HOAN_NGUOI_BAN', ly_do: lyDo };
    const daTra = await donMuaNgay(d);

    await assert.rejects(ngoaiLe.quyetToanCoc(d.admin, daTra.id, nd), { status: 409 });

    const don = await donBoThanhToan(d);

    await records.capNhat('nguoi_dung', d.seller.id, { trang_thai_tai_khoan: 'BI_KHOA' });
    await assert.rejects(ngoaiLe.quyetToanCoc(d.admin, don.id, nd), { status: 409 });
    assert.equal((await donHang.chiTiet(d.admin, don.id)).so_tien_dang_giu, '1800000.00');
    await ngoaiLe.quyetToanCoc(d.admin, don.id, quyetDinh('HOAN_NGUOI_MUA'));
  }));

test('Gỡ cờ gửi muộn sau xác minh không giải ngân; tài khoản hạn chế và người ngoài không vượt điều kiện', () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const don = await donMuaNgay(d);
    const nd = { ly_do: lyDo };

    await records.capNhat('don_hang', don.id, {
      han_nguoi_ban_gui_hang: thoiGian.congGiay(await db.thoiGianHienTai(), -60),
    });
    await donHang.xuLyDenHan(don.id);
    await assert.rejects(ngoaiLe.giaiToaCanhBao(d.admin, don.id, nd), { status: 409 });
    assert.ok(!(await khoDon.denHan()).some((x) => String(x.id) === String(don.id)));
    await donHang.guiHang(d.seller, don.id, {
      don_vi_van_chuyen: 'Kiểm thử',
      ma_van_don: 'MUON-01',
    });
    await donHang.xacNhanDaGiao(d.a, don.id);
    await assert.rejects(donHang.xacNhanHoanThanh(d.a, don.id), { status: 409 });
    await assert.rejects(ngoaiLe.giaiToaCanhBao(d.seller, don.id, nd), { status: 403 });

    await records.capNhat('nguoi_dung', d.a.id, { trang_thai_tai_khoan: 'TAM_NGUNG' });
    await assert.rejects(ngoaiLe.giaiToaCanhBao(d.admin, don.id, nd), { status: 409 });
    await records.capNhat('nguoi_dung', d.a.id, { trang_thai_tai_khoan: 'HOAT_DONG' });

    const truoc = await donHang.chiTiet(d.admin, don.id);
    const sau = await ngoaiLe.giaiToaCanhBao(d.admin, don.id, nd);

    assert.equal(sau.han_kiem_tra, truoc.han_kiem_tra);
    assert.equal(sau.trang_thai, 'DANG_KIEM_TRA');
    assert.equal(sau.so_tien_da_giai_ngan, '0.00');
    assert.equal(Number(sau.can_admin_xu_ly), 0);
    await ngoaiLe.giaiToaCanhBao(d.admin, don.id, nd);
    await donHang.xacNhanHoanThanh(d.a, don.id);
    assert.equal((await donHang.chiTiet(d.a, don.id)).trang_thai, 'HOAN_THANH');
  }));

test('Tranh chấp đang mở không được gỡ cờ; giải ngân quyết định seller vẫn kiểm tra tài khoản', () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const don = await donMuaNgay(d);

    await donHang.guiHang(d.seller, don.id, { don_vi_van_chuyen: 'Kiểm thử', ma_van_don: 'TC-01' });
    await donHang.xacNhanDaGiao(d.a, don.id);

    const tc = await tranhChap.mo(d.a, don.id, {
      ly_do: 'KHAC',
      mo_ta: 'Đề nghị đối chiếu hàng thực tế',
    });

    await records.capNhat('don_hang', don.id, {
      can_admin_xu_ly: 1,
      ly_do_can_xu_ly: 'Đang kiểm tra',
    });
    await assert.rejects(ngoaiLe.giaiToaCanhBao(d.admin, don.id, { ly_do: lyDo }), { status: 409 });
    await records.capNhat('nguoi_dung', d.seller.id, { trang_thai_tai_khoan: 'BI_KHOA' });
    await assert.rejects(
      tranhChap.giaiQuyet(d.admin, tc.id, { ket_qua: 'NGUOI_BAN', ket_qua_xu_ly: lyDo }),
      { status: 409 },
    );
    assert.equal((await khoDon.tienTrungGian(don.id)).trang_thai, 'DANG_GIU');
  }));

test('Hàng chưa rời trung tâm: trả seller cập nhật đúng lưu giữ, bảo toàn nội dung kiểm định gốc', () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const p = await phienDauGia(d, { gia_mua_ngay: '24000000', cho_phep_mua_ngay: 1 });
    const phien = await records.layTheoId('phien_dau_gia', p);
    const now = await db.thoiGianHienTai();

    await records.capNhat('san_pham', phien.san_pham_id, { bat_buoc_kiem_dinh: 1 });

    const kd = await records.them('kiem_dinh_san_pham', {
      ma_kiem_dinh: `KD-${d.prefix}`,
      san_pham_id: phien.san_pham_id,
      trang_thai: 'DANG_LUU_GIU',
      ket_qua: 'DAT',
      ngay_nhan_trung_tam: now,
      ngay_kiem_dinh: now,
      ten_chuyen_gia: 'Chuyên gia',
      don_vi_kiem_dinh: 'Trung tâm',
      serial_khi_nhan: 'SERIAL-TAI-KHO',
      nhan_xet: 'Nội dung gốc không được sửa',
    });
    const tep = await records.them('tep_dinh_kem', {
      loai_tep: 'BAO_CAO_KIEM_DINH',
      kiem_dinh_san_pham_id: kd,
      nguoi_tai_len_id: d.admin.id,
      duong_dan_tep: `/api/uploads/files/inspection/${d.admin.id}/kiem-thu.pdf`,
      loai_noi_dung: 'TAI_LIEU',
    });
    const don = (await dauGia.muaNgay(d.a, p, {})).don_hang;
    const tc = await tranhChap.mo(d.a, don.id, {
      ly_do: 'KHAC',
      mo_ta: 'Xin hủy trước khi giao hàng',
      yeu_cau_huy: true,
    });

    await thuHoiVaKiemKe(d, don.id);
    await tranhChap.giaiQuyet(d.admin, tc.id, { ket_qua: 'NGUOI_MUA', ket_qua_xu_ly: lyDo });
    await hang.xuLy(d.admin, don.id, {
      thao_tac: 'TRA_NGUOI_BAN',
      don_vi_van_chuyen: 'Kiểm thử',
      ma_van_don: 'TRA-TU-KHO',
      ghi_chu: lyDo,
    });

    const sau = await records.layTheoId('kiem_dinh_san_pham', kd);

    assert.equal(sau.trang_thai, 'DA_TRA_NGUOI_BAN');
    assert.ok(sau.ngay_roi_trung_tam);
    assert.ok(sau.ngay_tra_nguoi_ban);
    assert.equal(sau.ket_qua, 'DAT');
    assert.equal(sau.nhan_xet, 'Nội dung gốc không được sửa');
    assert.equal(sau.serial_khi_nhan, 'SERIAL-TAI-KHO');
    assert.equal((await records.layTheoId('tep_dinh_kem', tep)).kiem_dinh_san_pham_id, kd);
    assert.equal((await kiemDinh.chiTiet(d.admin, kd)).co_the_cap_nhat, false);
    assert.equal(
      (
        await db.layMot('SELECT COUNT(*) AS n FROM kiem_dinh_san_pham WHERE san_pham_id=?', [
          phien.san_pham_id,
        ])
      ).n,
      '1',
    );
  }));

test('Phí hoàn và bồi thường có biên bản, chứng từ; không đổi escrow hoặc ghi đè quyết định', () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const don = await donMuaNgay(d);

    await tranhChap.mo(d.a, don.id, {
      ly_do: 'KHAC',
      mo_ta: 'Xin hủy và đối soát phí phát sinh',
      yeu_cau_huy: true,
    });
    await hang.xuLy(d.admin, don.id, { thao_tac: 'KHOI_TAO', ghi_chu: lyDo });

    const nd = {
      thao_tac: 'KET_LUAN_TRACH_NHIEM',
      ben_chiu_phi: 'NGUOI_MUA',
      phi_hoan: '100000',
      ben_boi_thuong: 'VAN_CHUYEN',
      nguoi_nhan_boi_thuong: 'NGUOI_BAN',
      tien_boi_thuong: '200000',
      ghi_chu: lyDo,
    };

    await assert.rejects(hang.xuLy(d.a, don.id, nd), { status: 403 });
    await assert.rejects(hang.xuLy(d.admin, don.id, { ...nd, ben_chiu_phi: 'KHONG_PHAT_SINH' }), {
      status: 400,
    });

    const sau = await hang.xuLy(d.admin, don.id, nd);

    assert.equal(sau.xu_ly_hang.trach_nhiem.phi_hoan, '100000.00');
    assert.equal(sau.so_tien_dang_giu, don.tong_tien);

    const lap = await hang.xuLy(d.admin, don.id, nd);

    assert.equal(lap.xu_ly_hang.lich_su.length, sau.xu_ly_hang.lich_su.length);
    await assert.rejects(hang.xuLy(d.admin, don.id, { ...nd, phi_hoan: '999999' }), {
      status: 409,
    });

    const doiSoat = {
      thao_tac: 'DOI_SOAT_CHI_PHI',
      ma_chung_tu: 'BIEN-NHAN-001',
      ghi_chu: lyDo,
    };

    await assert.rejects(hang.xuLy(d.seller, don.id, doiSoat), { status: 403 });
    await hang.xuLy(d.admin, don.id, doiSoat);
    await hang.xuLy(d.admin, don.id, doiSoat);
    assert.equal((await donHang.chiTiet(d.admin, don.id)).so_tien_dang_giu, don.tong_tien);
  }));

after(require('../helpers/dong-ket-noi').dongKetNoiMotLan);
