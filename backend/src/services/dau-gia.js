const coSoDuLieu = require('../repositories/ket-noi');
const khoBanGhi = require('../repositories/ban-ghi');
const khoDuLieu = require('../repositories/dau-gia');
const heThong = require('../repositories/he-thong');
const cacNguoiDung = require('../repositories/nguoi-dung');
const cauHinhNghiepVu = require('./cau-hinh');
const danhMucSanPham = require('./danh-muc-san-pham');
const boTinhGia = require('./tinh-gia-tu-dong');
const { ghiNhatKy, taoThongBao, thongBaoMotLan } = require('./nhat-ky-thong-bao');
const cacSuKien = require('../sockets/su-kien');
const kiemTra = require('../validators/du-lieu-dau-vao');
const { baoDam, batBuocTonTai, cungId } = require('../utils/loi');
const { donViTienNho, chuoiTien } = require('../utils/tien');
const thoiGian = require('../utils/thoi-gian');
const { phienCongKhai } = require('../utils/du-lieu-cong-khai');
async function tao(nguoiDung, dauVao) {
  kiemTra.kiemTraNoiDung(dauVao, [
    'san_pham_id',
    'gia_khoi_diem',
    'gia_san',
    'gia_mua_ngay',
    'thoi_gian_bat_dau',
    'thoi_gian_ket_thuc',
  ]);
  const duLieu = {
    san_pham_id: kiemTra.id(dauVao.san_pham_id),
    gia_khoi_diem: kiemTra.kiemTraTien(dauVao.gia_khoi_diem, 'Giá khởi điểm', true),
    gia_san: dauVao.gia_san == null ? null : kiemTra.kiemTraTien(dauVao.gia_san, 'Giá sàn', true),
    gia_mua_ngay:
      dauVao.gia_mua_ngay == null
        ? null
        : kiemTra.kiemTraTien(dauVao.gia_mua_ngay, 'Giá mua ngay', true),
    thoi_gian_bat_dau: thoiGian.kiemTraNgayNhap(dauVao.thoi_gian_bat_dau, 'Bắt đầu'),
    thoi_gian_ket_thuc: thoiGian.kiemTraNgayNhap(dauVao.thoi_gian_ket_thuc, 'Kết thúc'),
  };
  baoDam(
    duLieu.gia_san == null || donViTienNho(duLieu.gia_san) >= donViTienNho(duLieu.gia_khoi_diem),
    400,
    'Giá sàn không thấp hơn giá khởi điểm',
  );
  baoDam(
    duLieu.gia_mua_ngay == null ||
      donViTienNho(duLieu.gia_mua_ngay) >= donViTienNho(duLieu.gia_san ?? duLieu.gia_khoi_diem),
    400,
    'Giá mua ngay không thấp hơn giá sàn/khởi điểm',
  );
  baoDam(
    thoiGian.doiThanhNgay(duLieu.thoi_gian_ket_thuc) >
      thoiGian.doiThanhNgay(duLieu.thoi_gian_bat_dau),
    400,
    'Kết thúc phải sau bắt đầu',
  );
  return coSoDuLieu.giaoDich(async () => {
    await danhMucSanPham.kiemTraNguoiBan(nguoiDung);
    const sanPham = batBuocTonTai(await khoBanGhi.layTheoId('san_pham', duLieu.san_pham_id, true));
    baoDam(cungId(sanPham.nguoi_ban_id, nguoiDung.id), 403, 'Sản phẩm không thuộc tài khoản');
    baoDam(sanPham.trang_thai_duyet === 'DA_DUYET', 409, 'Sản phẩm chưa được duyệt');
    baoDam(
      !(await khoDuLieu.phienDaCoCuaSanPham(sanPham.id)),
      409,
      'Sản phẩm đã có phiên đang chờ, đang chạy hoặc đã bán',
    );
    const thoiGianHienTai = await coSoDuLieu.thoiGianHienTai();
    baoDam(
      thoiGian.doiThanhNgay(duLieu.thoi_gian_ket_thuc) > thoiGian.doiThanhNgay(thoiGianHienTai),
      400,
      'Thời gian kết thúc đã qua',
    );
    baoDam(
      thoiGian.doiThanhNgay(duLieu.thoi_gian_bat_dau).getTime() >=
        thoiGian.doiThanhNgay(thoiGianHienTai).getTime() - 60000,
      400,
      'Không được lên lịch trong quá khứ',
    );
    cauHinhNghiepVu.buocGiaTaiMuc(donViTienNho(duLieu.gia_khoi_diem), await heThong.cacBuocGia());
    const id = await khoBanGhi.them('phien_dau_gia', {
      ...duLieu,
      gia_hien_tai: duLieu.gia_khoi_diem,
      cho_phep_mua_ngay: duLieu.gia_mua_ngay ? 1 : 0,
      thoi_gian_ket_thuc_goc: duLieu.thoi_gian_ket_thuc,
      trang_thai: thoiGian.daHetHan(duLieu.thoi_gian_bat_dau, thoiGianHienTai)
        ? 'HOAT_DONG'
        : 'DA_LEN_LICH',
      nguong_phut_chot_giay: await cauHinhNghiepVu.docSoCauHinh('ANTI_SNIPE_THRESHOLD_SECONDS'),
      so_giay_gia_han: await cauHinhNghiepVu.docSoCauHinh('ANTI_SNIPE_EXTENSION_SECONDS'),
    });
    await ghiNhatKy(nguoiDung.id, 'TAO_PHIEN', 'phien_dau_gia', id);
    return phienCongKhai(await khoDuLieu.layTheoId(id));
  });
}
async function layPhienDangChay(id) {
  const banGhi = batBuocTonTai(await khoDuLieu.layTheoId(kiemTra.id(id), true));
  const thoiGianHienTai = await coSoDuLieu.thoiGianHienTai();
  if (
    banGhi.trang_thai === 'DA_LEN_LICH' &&
    thoiGian.daHetHan(banGhi.thoi_gian_bat_dau, thoiGianHienTai) &&
    !thoiGian.daHetHan(banGhi.thoi_gian_ket_thuc, thoiGianHienTai)
  ) {
    await khoBanGhi.capNhat('phien_dau_gia', id, { trang_thai: 'HOAT_DONG' });
    banGhi.trang_thai = 'HOAT_DONG';
  }
  baoDam(
    banGhi.trang_thai === 'HOAT_DONG' &&
      thoiGian.daHetHan(banGhi.thoi_gian_bat_dau, thoiGianHienTai) &&
      !thoiGian.daHetHan(banGhi.thoi_gian_ket_thuc, thoiGianHienTai),
    409,
    'Phiên chưa bắt đầu hoặc đã kết thúc',
  );
  baoDam(banGhi.trang_thai_duyet === 'DA_DUYET', 409, 'Sản phẩm không đủ điều kiện đấu giá');
  return { row: banGhi, now: thoiGianHienTai };
}
async function kiemTraNguoiMua(nguoiDung, banGhi) {
  const taiKhoan = batBuocTonTai(await cacNguoiDung.layTheoId(nguoiDung.id, true));
  baoDam(
    taiKhoan.vai_tro === 'NGUOI_DUNG' && taiKhoan.trang_thai_tai_khoan === 'HOAT_DONG',
    403,
    'Tài khoản không được tham gia đấu giá',
  );
  baoDam(
    !cungId(banGhi.nguoi_ban_id, nguoiDung.id),
    403,
    'Người bán không được tự đấu giá hoặc mua sản phẩm',
  );
  const diaChi = await cacNguoiDung.diaChiMacDinh(nguoiDung.id);
  baoDam(diaChi, 409, 'Cần thêm địa chỉ giao hàng trước khi tham gia');
  return diaChi;
}
async function datGia(nguoiDung, id, dauVao) {
  kiemTra.kiemTraNoiDung(dauVao, ['gia_toi_da']);
  const tranGia = kiemTra.kiemTraTien(dauVao.gia_toi_da, 'Mức giá tối đa', true);
  return coSoDuLieu.giaoDich(async () => {
    const { row: banGhi, now: thoiGianHienTai } = await layPhienDangChay(id);
    await kiemTraNguoiMua(nguoiDung, banGhi);
    const cacMucToiDa = await khoDuLieu.cacMucToiDa(id);
    const ketQua = boTinhGia.tinhKetQuaDauGia(
      banGhi,
      cacMucToiDa,
      nguoiDung.id,
      tranGia,
      await heThong.cacBuocGia(),
    );
    const banCu = cacMucToiDa.find((x) => cungId(x.nguoi_tra_gia_id, nguoiDung.id));
    if (banCu)
      await khoBanGhi.capNhat('muc_gia_toi_da', banCu.id, {
        gia_toi_da: tranGia,
        thoi_gian_dat_gia_toi_da: thoiGianHienTai,
      });
    else
      await khoBanGhi.them('muc_gia_toi_da', {
        phien_dau_gia_id: id,
        nguoi_tra_gia_id: nguoiDung.id,
        gia_toi_da: tranGia,
        thoi_gian_dat_gia_toi_da: thoiGianHienTai,
      });
    let luotTraGiaCuoiId = null;
    for (const phanTu of ketQua.publicBids)
      luotTraGiaCuoiId = await khoBanGhi.them('luot_tra_gia', {
        phien_dau_gia_id: id,
        nguoi_tra_gia_id: phanTu.bidderId,
        so_tien: chuoiTien(phanTu.price),
        loai_tra_gia: phanTu.type,
        ngay_tao: thoiGianHienTai,
      });
    const daDatGiaSan = banGhi.gia_san == null || ketQua.price >= donViTienNho(banGhi.gia_san);
    const thayDoi = {
      gia_hien_tai: chuoiTien(ketQua.price),
      nguoi_dan_dau_id: ketQua.winnerId,
      dat_gia_san: daDatGiaSan ? 1 : 0,
      tong_luot_tra_gia: Number(banGhi.tong_luot_tra_gia) + ketQua.publicBids.length,
    };
    if (ketQua.validPublicBid && (banGhi.gia_san == null || daDatGiaSan))
      thayDoi.cho_phep_mua_ngay = 0;
    const conLai =
      thoiGian.doiThanhNgay(banGhi.thoi_gian_ket_thuc).getTime() -
      thoiGian.doiThanhNgay(thoiGianHienTai).getTime();
    if (
      ketQua.validPublicBid &&
      banGhi.bat_chong_phut_chot &&
      conLai > 0 &&
      conLai <= banGhi.nguong_phut_chot_giay * 1000
    ) {
      baoDam(banGhi.so_giay_gia_han > 0, 409, 'Cấu hình gia hạn không hợp lệ');
      thayDoi.thoi_gian_ket_thuc = thoiGian.congGiay(
        banGhi.thoi_gian_ket_thuc,
        banGhi.so_giay_gia_han,
      );
      thayDoi.so_lan_gia_han = Number(banGhi.so_lan_gia_han) + 1;
      await khoBanGhi.them('gia_han_phien_dau_gia', {
        phien_dau_gia_id: id,
        luot_tra_gia_kich_hoat_id: luotTraGiaCuoiId,
        thoi_gian_ket_thuc_cu: banGhi.thoi_gian_ket_thuc,
        thoi_gian_ket_thuc_moi: thayDoi.thoi_gian_ket_thuc,
        so_giay_them: banGhi.so_giay_gia_han,
      });
    }
    await khoBanGhi.capNhat('phien_dau_gia', id, thayDoi);
    await ghiNhatKy(nguoiDung.id, 'DAT_GIA_TOI_DA', 'phien_dau_gia', id); // Không ghi mức tối đa vào nhật ký.
    const lienKet = `/auctions/${id}`;
    if (ketQua.validPublicBid) {
      if (banGhi.nguoi_dan_dau_id && !cungId(banGhi.nguoi_dan_dau_id, ketQua.winnerId))
        await taoThongBao(
          banGhi.nguoi_dan_dau_id,
          'BI_VUOT_GIA',
          'Bạn đã bị vượt giá',
          'Có người đang dẫn đầu phiên đấu giá.',
          lienKet,
        );
      if (!cungId(nguoiDung.id, ketQua.winnerId))
        await taoThongBao(
          nguoiDung.id,
          'BI_VUOT_GIA',
          'Mức đặt chưa dẫn đầu',
          'Hệ thống đã có giá trả hợp lệ cao hơn hoặc được ưu tiên trước.',
          lienKet,
        );
      if (!cungId(banGhi.nguoi_dan_dau_id, ketQua.winnerId))
        await taoThongBao(
          ketQua.winnerId,
          'DANG_DAN_DAU',
          'Bạn đang dẫn đầu',
          'Bạn đang dẫn đầu phiên đấu giá.',
          lienKet,
        );
    }
    const daCapNhat = await khoDuLieu.layTheoId(id);
    if (ketQua.validPublicBid) cacSuKien.phienDauGia(daCapNhat);
    return {
      ...phienCongKhai(daCapNhat),
      ban_dang_dan_dau: cungId(nguoiDung.id, ketQua.winnerId),
      da_ghi_nhan: true,
    };
  });
}
async function muaNgay(nguoiDung, id, dauVao = {}) {
  kiemTra.kiemTraNoiDung(dauVao, []);
  return coSoDuLieu.giaoDich(async () => {
    const { row: banGhi, now: thoiGianHienTai } = await layPhienDangChay(id);
    const diaChi = await kiemTraNguoiMua(nguoiDung, banGhi);
    baoDam(boTinhGia.choPhepMuaNgay(banGhi), 409, 'Mua ngay không còn hiệu lực');
    await khoBanGhi.capNhat('phien_dau_gia', id, {
      trang_thai: 'DA_KET_THUC',
      ly_do_ket_thuc: 'MUA_NGAY',
      nguoi_dan_dau_id: nguoiDung.id,
      gia_hien_tai: banGhi.gia_mua_ngay,
      dat_gia_san: 1,
      cho_phep_mua_ngay: 0,
      thoi_gian_ket_thuc: thoiGian.ngaySQL(thoiGianHienTai),
    });
    const daCapNhat = await khoDuLieu.layTheoId(id);
    const donHang = await require('./don-hang').taoDonNguoiThang(
      daCapNhat,
      nguoiDung.id,
      banGhi.gia_mua_ngay,
      'THANG_DAU_GIA',
      diaChi,
    );
    await thongBaoKetThuc(daCapNhat);
    await ghiNhatKy(nguoiDung.id, 'MUA_NGAY', 'phien_dau_gia', id);
    cacSuKien.phienDauGia(daCapNhat, 'auction:ended');
    return { phien: phienCongKhai(daCapNhat), don_hang: donHang };
  });
}
async function thongBaoKetThuc(banGhi) {
  for (const nguoiNhan of await khoDuLieu.nguoiThamGia(banGhi.id)) {
    if (
      cungId(nguoiNhan.nguoi_tra_gia_id, banGhi.nguoi_dan_dau_id) &&
      banGhi.trang_thai === 'DA_KET_THUC'
    )
      continue;
    await taoThongBao(
      nguoiNhan.nguoi_tra_gia_id,
      'KET_THUC_PHIEN',
      'Phiên đấu giá đã kết thúc',
      banGhi.trang_thai === 'THAT_BAI'
        ? 'Phiên không có giao dịch thành công.'
        : 'Bạn không thắng phiên đấu giá này.',
      `/auctions/${banGhi.id}`,
    );
  }
}
async function xuLyDenHan(id) {
  return coSoDuLieu.giaoDich(async () => {
    const banGhi = batBuocTonTai(await khoDuLieu.layTheoId(kiemTra.id(id), true));
    const thoiGianHienTai = await coSoDuLieu.thoiGianHienTai();
    if (!['DA_LEN_LICH', 'HOAT_DONG'].includes(banGhi.trang_thai)) return phienCongKhai(banGhi);
    if (!thoiGian.daHetHan(banGhi.thoi_gian_bat_dau, thoiGianHienTai)) return phienCongKhai(banGhi);
    if (!thoiGian.daHetHan(banGhi.thoi_gian_ket_thuc, thoiGianHienTai)) {
      if (banGhi.trang_thai === 'DA_LEN_LICH') {
        await khoBanGhi.capNhat('phien_dau_gia', id, { trang_thai: 'HOAT_DONG' });
        banGhi.trang_thai = 'HOAT_DONG';
        cacSuKien.phienDauGia(banGhi, 'auction:started');
        await ghiNhatKy(null, 'MO_PHIEN', 'phien_dau_gia', id);
      }
      return phienCongKhai(banGhi);
    }
    let trangThai = 'DA_KET_THUC',
      lyDo = 'CO_NGUOI_THANG';
    if (!banGhi.nguoi_dan_dau_id || Number(banGhi.tong_luot_tra_gia) === 0) {
      trangThai = 'THAT_BAI';
      lyDo = 'KHONG_CO_TRA_GIA';
    } else if (
      banGhi.gia_san != null &&
      donViTienNho(banGhi.gia_hien_tai) < donViTienNho(banGhi.gia_san)
    ) {
      trangThai = 'THAT_BAI';
      lyDo = 'KHONG_DAT_GIA_SAN';
    }
    await khoBanGhi.capNhat('phien_dau_gia', id, {
      trang_thai: trangThai,
      ly_do_ket_thuc: lyDo,
      cho_phep_mua_ngay: 0,
    });
    const daCapNhat = await khoDuLieu.layTheoId(id);
    if (trangThai === 'DA_KET_THUC')
      await require('./don-hang').taoDonNguoiThang(
        daCapNhat,
        banGhi.nguoi_dan_dau_id,
        banGhi.gia_hien_tai,
      );
    await thongBaoKetThuc(daCapNhat);
    await ghiNhatKy(null, 'KET_THUC_PHIEN', 'phien_dau_gia', id, {
      trang_thai: trangThai,
      ly_do: lyDo,
    });
    cacSuKien.phienDauGia(daCapNhat, 'auction:ended');
    return phienCongKhai(daCapNhat);
  });
}
async function guiYeuCauHuy(nguoiDung, id, dauVao) {
  kiemTra.kiemTraNoiDung(dauVao, ['ly_do']);
  const lyDo = kiemTra.chuoi(dauVao.ly_do, 'Lý do', 1000);
  return coSoDuLieu.giaoDich(async () => {
    const banGhi = batBuocTonTai(await khoDuLieu.layTheoId(kiemTra.id(id), true));
    baoDam(cungId(banGhi.nguoi_ban_id, nguoiDung.id), 403, 'Phiên không thuộc tài khoản');
    baoDam(
      ['DA_LEN_LICH', 'HOAT_DONG'].includes(banGhi.trang_thai) &&
        !thoiGian.daHetHan(banGhi.thoi_gian_ket_thuc, await coSoDuLieu.thoiGianHienTai()),
      409,
      'Phiên đã kết thúc',
    );
    baoDam(!(await khoDuLieu.yeuCauHuyDangCho(id)), 409, 'Đã có yêu cầu hủy đang chờ');
    const yeuCauId = await khoBanGhi.them('yeu_cau_huy_phien', {
      phien_dau_gia_id: id,
      nguoi_yeu_cau_id: nguoiDung.id,
      ly_do: lyDo,
    });
    await ghiNhatKy(nguoiDung.id, 'YEU_CAU_HUY_PHIEN', 'phien_dau_gia', id);
    return khoBanGhi.layTheoId('yeu_cau_huy_phien', yeuCauId);
  });
}
async function duyetHuyPhien(quanTri, yeuCauId, dauVao) {
  kiemTra.kiemTraNoiDung(dauVao, ['trang_thai', 'ghi_chu_duyet']);
  const trangThai = kiemTra.giaTriLuaChon(dauVao.trang_thai, ['DA_DUYET', 'TU_CHOI'], 'Trạng thái');
  const ghiChu = kiemTra.chuoi(dauVao.ghi_chu_duyet, 'Ghi chú duyệt', 1000);
  return coSoDuLieu.giaoDich(async () => {
    const banDau = batBuocTonTai(
      await khoBanGhi.layTheoId('yeu_cau_huy_phien', kiemTra.id(yeuCauId)),
    );
    const banGhi = batBuocTonTai(await khoDuLieu.layTheoId(banDau.phien_dau_gia_id, true));
    const yeuCauHuy = batBuocTonTai(await khoBanGhi.layTheoId('yeu_cau_huy_phien', yeuCauId, true));
    baoDam(yeuCauHuy.trang_thai === 'CHO_XU_LY', 409, 'Yêu cầu đã xử lý');
    if (trangThai === 'DA_DUYET') {
      baoDam(
        ['DA_LEN_LICH', 'HOAT_DONG'].includes(banGhi.trang_thai) &&
          !thoiGian.daHetHan(banGhi.thoi_gian_ket_thuc, await coSoDuLieu.thoiGianHienTai()),
        409,
        'Phiên đã kết thúc',
      );
      await khoBanGhi.capNhat('phien_dau_gia', banGhi.id, {
        trang_thai: 'DA_HUY',
        ly_do_ket_thuc: 'HUY_THEO_YEU_CAU_NGUOI_BAN',
        cho_phep_mua_ngay: 0,
      });
      for (const p of await khoDuLieu.nguoiThamGia(banGhi.id))
        await taoThongBao(
          p.nguoi_tra_gia_id,
          'HUY_PHIEN',
          'Phiên đấu giá đã bị hủy',
          ghiChu,
          `/auctions/${banGhi.id}`,
        );
      cacSuKien.phienDauGia(await khoDuLieu.layTheoId(banGhi.id), 'auction:ended');
    }
    await khoBanGhi.capNhat('yeu_cau_huy_phien', yeuCauId, {
      trang_thai: trangThai,
      nguoi_duyet_id: quanTri.id,
      ghi_chu_duyet: ghiChu,
      ngay_duyet: await coSoDuLieu.thoiGianHienTai(),
    });
    await ghiNhatKy(quanTri.id, 'DUYET_HUY_PHIEN', 'phien_dau_gia', banGhi.id, {
      trang_thai: trangThai,
    });
    await taoThongBao(
      banGhi.nguoi_ban_id,
      'DUYET_HUY_PHIEN',
      'Kết quả yêu cầu hủy',
      ghiChu,
      `/auctions/${banGhi.id}`,
    );
    return khoBanGhi.layTheoId('yeu_cau_huy_phien', yeuCauId);
  });
}
async function danhSach(nguoiDung, truyVan = {}, phamVi = 'public') {
  const boLoc = {
    search: truyVan.q ? kiemTra.chuoi(truyVan.q, 'Tìm kiếm', 100) : undefined,
    status: truyVan.trang_thai
      ? kiemTra.giaTriLuaChon(
          truyVan.trang_thai,
          ['DA_LEN_LICH', 'HOAT_DONG', 'DA_KET_THUC', 'THAT_BAI', 'DA_HUY'],
          'Trạng thái',
        )
      : undefined,
    categoryId: truyVan.danh_muc_id ? kiemTra.id(truyVan.danh_muc_id) : undefined,
  };
  if (phamVi === 'mine') boLoc.sellerId = nguoiDung.id;
  if (phamVi === 'watchlist') boLoc.watcherId = nguoiDung.id;
  if (phamVi === 'bids') boLoc.bidderId = nguoiDung.id;
  return (await khoDuLieu.danhSach(kiemTra.phanTrang(truyVan), boLoc)).map(phienCongKhai);
}
async function chiTiet(id) {
  return phienCongKhai(batBuocTonTai(await khoDuLieu.layTheoId(kiemTra.id(id))));
}
async function lichSu(id, truyVan) {
  batBuocTonTai(await khoDuLieu.layTheoId(kiemTra.id(id)));
  return khoDuLieu.lichSu(id, kiemTra.phanTrang(truyVan));
}
async function theoDoi(nguoiDung, id, bat) {
  batBuocTonTai(await khoDuLieu.layTheoId(kiemTra.id(id)));
  return bat
    ? khoDuLieu.theoDoi(nguoiDung.id, id).then(() => ({ dang_theo_doi: true }))
    : khoDuLieu.boTheoDoi(nguoiDung.id, id).then(() => ({ dang_theo_doi: false }));
}
async function nhacPhienSapKetThuc(id) {
  return coSoDuLieu.giaoDich(async () => {
    const banGhi = await khoDuLieu.layTheoId(id, true);
    const thoiGianHienTai = await coSoDuLieu.thoiGianHienTai();
    if (
      !banGhi ||
      banGhi.trang_thai !== 'HOAT_DONG' ||
      thoiGian.daHetHan(banGhi.thoi_gian_ket_thuc, thoiGianHienTai) ||
      thoiGian.doiThanhNgay(banGhi.thoi_gian_ket_thuc) - thoiGian.doiThanhNgay(thoiGianHienTai) >
        600000
    )
      return;
    const nhungNguoiNhan = new Set([
      ...(await khoDuLieu.nguoiTheoDoi(id)).map((x) => String(x.nguoi_dung_id)),
      ...(await khoDuLieu.nguoiThamGia(id)).map((x) => String(x.nguoi_tra_gia_id)),
    ]);
    for (const nguoiDungId of nhungNguoiNhan)
      await thongBaoMotLan(
        nguoiDungId,
        'PHIEN_SAP_KET_THUC',
        'Phiên sắp kết thúc',
        'Phiên bạn quan tâm sẽ kết thúc trong khoảng 10 phút.',
        `/auctions/${id}`,
      );
  });
}
module.exports = {
  tao,
  datGia,
  muaNgay,
  xuLyDenHan,
  guiYeuCauHuy,
  duyetHuyPhien,
  danhSach,
  chiTiet,
  lichSu,
  theoDoi,
  nhacPhienSapKetThuc,
  kiemTraNguoiMua,
};
