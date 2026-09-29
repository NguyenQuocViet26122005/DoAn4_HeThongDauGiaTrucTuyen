const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const db = require('../../dist/repositories/ket-noi');
const records = require('../../dist/repositories/ban-ghi');
const khoDon = require('../../dist/repositories/don-hang');
const dauGia = require('../../dist/services/dau-gia');
const coc = require('../../dist/services/dat-coc');
const donHang = require('../../dist/services/don-hang');
const deNghi = require('../../dist/services/de-nghi-mua-tiep');
const tranhChap = require('../../dist/services/tranh-chap');
const cauHinh = require('../../dist/services/cau-hinh');
const thoiGian = require('../../dist/utils/thoi-gian');
const { kiemTraDuLieuCongKhai } = require('../../dist/utils/du-lieu-cong-khai');
const { taoDuLieuKiemThu, sanPham, phienDauGia, hoanTac } = require('../helpers/du-lieu-mau');

const phienCoc = (d, ghiDe = {}) =>
  phienDauGia(d, {
    yeu_cau_dat_coc: 1,
    so_tien_dat_coc: '1800000',
    phi_van_chuyen: '35000',
    ...ghiDe,
  });

async function nopCoc(nguoiDung, id) {
  await coc.dangKy(nguoiDung, id);

  return coc.thanhToan(nguoiDung, id, {});
}

async function chot(id) {
  await records.capNhat('phien_dau_gia', id, {
    thoi_gian_ket_thuc: await db.thoiGianHienTai(),
  });
  await dauGia.xuLyDenHan(id);

  return khoDon.donDangXuLyCuaPhien(id);
}

function kiemThu(ten, xuLy) {
  test(`21 bảng: ${ten}`, () => hoanTac(async () => xuLy(await taoDuLieuKiemThu())));
}

kiemThu('Admin bật cọc cho phiên mới; phiên cũ giữ nguyên', async (d) => {
  const idCu = await phienDauGia(d);

  assert.deepEqual(await cauHinh.chupChinhSachCoc('18000000'), {
    yeu_cau_dat_coc: 0,
    so_tien_dat_coc: null,
  });
  await cauHinh.luu(d.admin, 'DEPOSIT_POLICY', {
    gia_tri_cau_hinh: {
      bat: true,
      kieu: 'TY_LE',
      gia_tri: 10,
    },
  });

  const bayGio = await db.thoiGianHienTai();
  const moi = await dauGia.tao(d.seller, {
    san_pham_id: await sanPham(d),
    gia_khoi_diem: '18000000',
    thoi_gian_bat_dau: thoiGian.doiThanhNgay(bayGio).toISOString(),
    thoi_gian_ket_thuc: thoiGian.doiThanhNgay(thoiGian.congGiay(bayGio, 3600)).toISOString(),
  });

  assert.equal(moi.so_tien_dat_coc, '1800000.00');
  await cauHinh.luu(d.admin, 'DEPOSIT_POLICY', {
    gia_tri_cau_hinh: {
      bat: true,
      kieu: 'CO_DINH',
      gia_tri: 500000,
    },
  });
  assert.equal((await records.layTheoId('phien_dau_gia', moi.id)).so_tien_dat_coc, '1800000.00');
  assert.equal((await records.layTheoId('phien_dau_gia', idCu)).yeu_cau_dat_coc, 0);
});

kiemThu('chặn đặt giá thiếu cọc, cọc lỗi và tự tham gia phiên bán', async (d) => {
  const id = await phienCoc(d);

  await assert.rejects(dauGia.datGia(d.a, id, { gia_toi_da: '22000000' }), { status: 409 });
  await assert.rejects(coc.dangKy(d.seller, id), { status: 403 });
  await assert.rejects(coc.dangKy(d.admin, id), { status: 403 });
  await coc.dangKy(d.a, id);
  await coc.thanhToan(d.a, id, { ket_qua_mo_phong: 'THAT_BAI' });
  await assert.rejects(dauGia.datGia(d.a, id, { gia_toi_da: '22000000' }), { status: 409 });
  await coc.thanhToan(d.a, id, {});
  await dauGia.datGia(d.a, id, { gia_toi_da: '22000000' });
});

kiemThu('đăng ký/cọc lặp không thu hai lần; yêu cầu lỗi không biến thành thành công', async (d) => {
  const id = await phienCoc(d);
  const lanDau = await coc.dangKy(d.a, id);

  assert.equal((await coc.dangKy(d.a, id)).id, lanDau.id);

  const loi = { ket_qua_mo_phong: 'THAT_BAI', khoa_yeu_cau: `coc-loi-${id}` };

  await coc.thanhToan(d.a, id, loi);
  assert.equal(
    (await coc.thanhToan(d.a, id, { ...loi, ket_qua_mo_phong: 'THANH_CONG' })).ket_qua_mo_phong,
    'THAT_BAI',
  );

  const dat = await coc.thanhToan(d.a, id, { khoa_yeu_cau: `coc-dat-${id}` });
  const lap = await coc.thanhToan(d.a, id, { khoa_yeu_cau: `coc-dat-${id}` });

  assert.equal(dat.dat_coc.ma_giao_dich, lap.dat_coc.ma_giao_dich);
  assert.equal(
    Number(
      (await db.layMot('SELECT COUNT(*) n FROM dat_coc_dau_gia WHERE phien_dau_gia_id=?', [id])).n,
    ),
    1,
  );
});

kiemThu('thời điểm nộp cọc không quyết định ưu tiên mức giá bằng nhau', async (d) => {
  const id = await phienCoc(d);

  await nopCoc(d.b, id);
  await nopCoc(d.a, id);
  await dauGia.datGia(d.a, id, { gia_toi_da: '22000000' });

  const kq = await dauGia.datGia(d.b, id, { gia_toi_da: '22000000' });

  assert.equal(kq.nguoi_dan_dau, `ND-${d.a.id}`);
  kiemTraDuLieuCongKhai(kq);

  const thongKe = await coc.thongKeNguoiBan(d.seller, id);

  assert.deepEqual(Object.keys(thongKe).sort(), ['da_coc', 'da_dang_ky', 'du_dieu_kien']);
  await assert.rejects(coc.thongKeNguoiBan(d.outsider, id), { status: 403 });
});

kiemThu('chốt phiên chuyển cọc người thắng, hoàn người thua; thu đúng phần còn lại', async (d) => {
  const id = await phienCoc(d);

  await nopCoc(d.a, id);
  await nopCoc(d.b, id);
  await dauGia.datGia(d.a, id, { gia_toi_da: '22000000' });
  await dauGia.datGia(d.b, id, { gia_toi_da: '21000000' });

  const don = await chot(id);

  assert.equal((await coc.cuaToi(d.a, id)).trang_thai, 'DA_CHUYEN_VAO_DON');
  assert.equal((await coc.cuaToi(d.b, id)).trang_thai, 'DA_HOAN_COC');
  assert.equal(don.so_tien_da_thu, '1800000.00');

  const thanhToan = await donHang.thanhToan(d.a, don.id, {});

  assert.equal(thanhToan.thanh_toan[0].so_tien, don.so_tien_con_phai_thanh_toan);
  assert.equal(thanhToan.so_tien_da_thu, thanhToan.tong_tien);
  assert.equal(thanhToan.so_tien_con_phai_thanh_toan, '0.00');
  await dauGia.xuLyDenHan(id);
  assert.equal((await khoDon.donHangCuaPhien(id)).length, 1);
});

kiemThu('quá hạn phần còn lại: giữ cọc chờ Admin, không tự trả người bán', async (d) => {
  const id = await phienCoc(d);

  await nopCoc(d.a, id);
  await dauGia.datGia(d.a, id, { gia_toi_da: '22000000' });

  const don = await chot(id);

  await records.capNhat('don_hang', don.id, {
    han_thanh_toan: thoiGian.congGiay(await db.thoiGianHienTai(), -1),
  });
  await donHang.xuLyDenHan(don.id);

  const sau = await donHang.chiTiet(d.a, don.id);

  assert.equal(sau.trang_thai, 'DA_HUY');
  assert.equal(sau.can_admin_xu_ly, 1);
  assert.equal(sau.giu_tien.so_tien_dang_giu, '1800000.00');
  assert.equal(sau.so_tien_da_giai_ngan, '0.00');
  assert.equal((await coc.cuaToi(d.a, id)).trang_thai, 'KHONG_HOAN_COC');
});

kiemThu('phiên không có người trả giá hoàn cọc và đóng đăng ký chưa thanh toán', async (d) => {
  const id = await phienCoc(d);

  await nopCoc(d.a, id);
  await coc.dangKy(d.b, id);
  assert.equal(await chot(id), null);
  assert.equal((await coc.cuaToi(d.a, id)).trang_thai, 'DA_HOAN_COC');
  assert.equal((await coc.cuaToi(d.b, id)).trang_thai, 'HET_HAN');
});

kiemThu('Admin hủy phiên hoàn cọc; phiên không đạt giá sàn cũng hoàn cọc', async (d) => {
  const id = await phienCoc(d);

  await nopCoc(d.a, id);

  const yc = await dauGia.guiYeuCauHuy(d.seller, id, { ly_do: 'Sản phẩm cần kiểm tra lại' });

  await dauGia.duyetHuyPhien(d.admin, yc.id, {
    trang_thai: 'DA_DUYET',
    ghi_chu_duyet: 'Đồng ý hủy phiên',
  });
  assert.equal((await coc.cuaToi(d.a, id)).trang_thai, 'DA_HOAN_COC');

  const idSan = await phienCoc(d, { gia_san: '30000000' });

  await nopCoc(d.a, idSan);
  await dauGia.datGia(d.a, idSan, { gia_toi_da: '22000000' });
  assert.equal(await chot(idSan), null);
  assert.equal((await coc.cuaToi(d.a, idSan)).trang_thai, 'DA_HOAN_COC');
});

kiemThu(
  'Mua ngay thất bại giữ phiên và cọc, không tạo đơn; retry thành công chỉ một đơn',
  async (d) => {
    const id = await phienCoc(d, { gia_mua_ngay: '24000000', cho_phep_mua_ngay: 1 });

    await nopCoc(d.a, id);
    await nopCoc(d.b, id);

    const loi = { ket_qua_mo_phong: 'THAT_BAI', khoa_yeu_cau: `mua-loi-${id}` };

    assert.equal((await dauGia.muaNgay(d.a, id, loi)).don_hang, null);
    assert.equal(
      (await dauGia.muaNgay(d.a, id, { ...loi, ket_qua_mo_phong: 'THANH_CONG' })).don_hang,
      null,
    );
    assert.equal((await records.layTheoId('phien_dau_gia', id)).trang_thai, 'HOAT_DONG');
    assert.equal((await coc.cuaToi(d.a, id)).trang_thai, 'DA_DAT_COC');
    assert.equal((await khoDon.donHangCuaPhien(id)).length, 0);

    const { don_hang: don } = await dauGia.muaNgay(d.a, id, { khoa_yeu_cau: `mua-dat-${id}` });

    assert.equal(don.trang_thai, 'CHO_GUI_HANG');
    assert.equal(don.so_tien_da_thu, '24035000.00');
    assert.equal(don.thanh_toan[0].so_tien, '22235000.00');
    assert.equal((await coc.cuaToi(d.b, id)).trang_thai, 'DA_HOAN_COC');
    await dauGia.muaNgay(d.a, id, { khoa_yeu_cau: `mua-dat-${id}` });
    assert.equal((await khoDon.donHangCuaPhien(id)).length, 1);
    assert.equal((await khoDon.cacThanhToan(don.id)).length, 1);
  },
);

kiemThu('Mua ngay không yêu cầu cọc riêng, vẫn phải trả toàn bộ', async (d) => {
  const id = await phienCoc(d, { gia_mua_ngay: '24000000', cho_phep_mua_ngay: 1 });
  const { don_hang: don } = await dauGia.muaNgay(d.a, id, {});

  assert.equal(don.tien_coc_da_chuyen, '0.00');
  assert.equal(don.so_tien_da_thu, '24035000.00');
  assert.equal(await coc.cuaToi(d.a, id), null);
});

kiemThu('cọc bằng toàn bộ đơn không thu thêm; thao tác thanh toán lặp an toàn', async (d) => {
  const id = await phienCoc(d, { so_tien_dat_coc: '18000000', phi_van_chuyen: '0' });

  await nopCoc(d.a, id);
  await dauGia.datGia(d.a, id, { gia_toi_da: '18000000' });

  const don = await chot(id);

  assert.equal(don.trang_thai, 'CHO_GUI_HANG');
  assert.equal(don.so_tien_con_phai_thanh_toan, '0.00');

  const truoc = await khoDon.cacThanhToan(don.id);

  await donHang.thanhToan(d.a, don.id, {});
  assert.deepEqual(await khoDon.cacThanhToan(don.id), truoc);
});

kiemThu(
  'Second Chance lấy giá công khai; lỗi không nhận đề nghị, thành công thu đủ không cọc lại',
  async (d) => {
    const id = await phienCoc(d);

    await nopCoc(d.a, id);
    await nopCoc(d.b, id);
    await dauGia.datGia(d.b, id, { gia_toi_da: '21000000' });
    await dauGia.datGia(d.a, id, { gia_toi_da: '25000000' });

    const don = await chot(id);

    await records.capNhat('don_hang', don.id, {
      han_thanh_toan: thoiGian.congGiay(await db.thoiGianHienTai(), -1),
    });
    await donHang.xuLyDenHan(don.id);
    assert.equal(await khoDon.deNghiDangCho(id), null);

    const dn = await deNghi.tao(d.seller, don.id);

    assert.equal(dn.gia_de_nghi, (await khoDon.giaCongKhaiCuoi(id, d.b.id)).so_tien);
    await assert.rejects(deNghi.tao(d.seller, don.id), { status: 409 });

    const loi = {
      chap_nhan: true,
      ket_qua_mo_phong: 'THAT_BAI',
      khoa_yeu_cau: `sc-loi-${id}`,
    };
    const thatBai = await deNghi.phanHoiDeNghi(d.b, dn.id, loi);

    assert.equal(thatBai.don_hang, null);
    assert.equal(thatBai.de_nghi.trang_thai, 'CHO_XU_LY');

    const dat = await deNghi.phanHoiDeNghi(d.b, dn.id, {
      chap_nhan: true,
      khoa_yeu_cau: `sc-dat-${id}`,
    });

    assert.equal(dat.don_hang.trang_thai, 'CHO_GUI_HANG');
    assert.equal(dat.don_hang.tien_coc_da_chuyen, '0.00');
    assert.equal(dat.don_hang.so_tien_da_thu, dat.don_hang.tong_tien);
    assert.equal((await coc.cuaToi(d.b, id)).trang_thai, 'DA_HOAN_COC');
    await deNghi.phanHoiDeNghi(d.b, dn.id, { chap_nhan: true, khoa_yeu_cau: `sc-dat-${id}` });
    assert.equal((await khoDon.cacThanhToan(dat.don_hang.id)).length, 1);
  },
);

kiemThu('tranh chấp hoàn đủ cọc, phần trả thêm và phí vận chuyển', async (d) => {
  const id = await phienCoc(d, { gia_mua_ngay: '24000000', cho_phep_mua_ngay: 1 });

  await nopCoc(d.a, id);

  const { don_hang: don } = await dauGia.muaNgay(d.a, id, {});

  await donHang.guiHang(d.seller, don.id, {
    don_vi_van_chuyen: 'Kiểm thử',
    ma_van_don: 'COC-HOAN',
  });
  await donHang.xacNhanDaGiao(d.a, don.id);
  assert.equal((await khoDon.tienTrungGian(don.id)).trang_thai, 'DANG_GIU');
  await assert.rejects(tranhChap.mo(d.a, don.id, { ly_do: 'HANG_GIA', mo_ta: 'Lý do cũ' }), {
    status: 400,
  });

  const tc = await tranhChap.mo(d.a, don.id, {
    ly_do: 'NGHI_NGO_TINH_XAC_THUC',
    mo_ta: 'Đề nghị đối chiếu hồ sơ',
  });

  await assert.rejects(donHang.xacNhanHoanThanh(d.a, don.id), { status: 409 });
  await tranhChap.giaiQuyet(d.admin, tc.id, {
    ket_qua: 'NGUOI_MUA',
    ket_qua_xu_ly: 'Đã kiểm tra đầy đủ hồ sơ',
  });

  const giu = await khoDon.tienTrungGian(don.id);

  assert.equal(giu.so_tien_da_hoan, '24035000.00');
  assert.equal(giu.so_tien_dang_giu, '0.00');
});

kiemThu('cờ Admin ngăn cả hoàn thành chủ động lẫn tự giải ngân', async (d) => {
  const id = await phienCoc(d, { gia_mua_ngay: '24000000', cho_phep_mua_ngay: 1 });
  const { don_hang: don } = await dauGia.muaNgay(d.a, id, {});

  await donHang.guiHang(d.seller, don.id, {
    don_vi_van_chuyen: 'Kiểm thử',
    ma_van_don: 'COC-ADMIN',
  });
  await donHang.xacNhanDaGiao(d.a, don.id);
  await records.capNhat('don_hang', don.id, {
    can_admin_xu_ly: 1,
    han_kiem_tra: thoiGian.congGiay(await db.thoiGianHienTai(), -1),
  });
  await assert.rejects(donHang.xacNhanHoanThanh(d.a, don.id), { status: 409 });
  await donHang.xuLyDenHan(don.id);
  assert.equal((await khoDon.tienTrungGian(don.id)).trang_thai, 'DANG_GIU');
});

kiemThu('MySQL tự chặn cọc sai tiền, người bán tự cọc và cam kết thiếu cọc', async (d) => {
  const id = await phienCoc(d);

  await assert.rejects(
    records.them('dat_coc_dau_gia', {
      phien_dau_gia_id: id,
      nguoi_dung_id: d.seller.id,
      so_tien: '1800000',
    }),
    { code: 'ER_SIGNAL_EXCEPTION' },
  );
  await assert.rejects(
    records.them('dat_coc_dau_gia', {
      phien_dau_gia_id: id,
      nguoi_dung_id: d.a.id,
      so_tien: '1',
    }),
    { code: 'ER_SIGNAL_EXCEPTION' },
  );
  await assert.rejects(
    records.them('tham_gia_phien', {
      phien_dau_gia_id: id,
      nguoi_dung_id: d.a.id,
      gia_toi_da: '22000000',
      thoi_gian_dat_gia_toi_da: await db.thoiGianHienTai(),
    }),
    { code: 'ER_SIGNAL_EXCEPTION' },
  );
  await nopCoc(d.a, id);
  await dauGia.datGia(d.a, id, { gia_toi_da: '22000000' });

  const don = await chot(id);

  await assert.rejects(records.capNhat('don_hang', don.id, { so_tien_da_thu: '999999999' }), {
    code: 'ER_CHECK_CONSTRAINT_VIOLATED',
  });
});

kiemThu('MySQL tự chặn mở phiên cho sản phẩm thiếu kiểm định đạt', async (d) => {
  const id = await phienDauGia(d, { trang_thai: 'THAT_BAI', ly_do_ket_thuc: 'KHONG_CO_TRA_GIA' });
  const phien = await records.layTheoId('phien_dau_gia', id);

  await records.capNhat('san_pham', phien.san_pham_id, { bat_buoc_kiem_dinh: 1 });
  await assert.rejects(records.capNhat('phien_dau_gia', id, { trang_thai: 'HOAT_DONG' }), {
    code: 'ER_SIGNAL_EXCEPTION',
  });
});

after(require('../helpers/dong-ket-noi').dongKetNoiMotLan);
