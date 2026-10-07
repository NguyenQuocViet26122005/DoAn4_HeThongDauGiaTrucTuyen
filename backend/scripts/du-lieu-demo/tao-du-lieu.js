const bcrypt = require('bcrypt');
const { taiKhoan, phien: kichBan, nguoiBan, matKhauDemo } = require('./ke-hoach');
const { tinhKetQuaDauGia } = require('../../dist/services/tinh-gia-tu-dong');
const { chuoiTien } = require('../../dist/utils/tien');

async function taoDuLieu(ctx) {
  const { them, sua, ngay, goc, tep } = ctx;
  const sanPham = goc('san_pham');
  const nguoi = new Map(taiKhoan.map((n) => [n.id, n]));
  const nhatKy = [];
  const thongBao = [];
  const ghi = (id, hanhDong, bang, doiTuong, luc, duLieu = null) => {
    nhatKy.push({
      nguoi_thuc_hien_id: id,
      hanh_dong: hanhDong,
      loai_doi_tuong: bang,
      doi_tuong_id: doiTuong,
      ngay_tao: luc,
      du_lieu_moi: duLieu,
    });
  };
  const bao = (id, loai, tieuDe, noiDung, link, luc) => {
    thongBao.push({
      nguoi_dung_id: id,
      loai,
      tieu_de: tieuDe,
      noi_dung: noiDung,
      duong_dan_lien_ket: link,
      ngay_tao: luc,
    });
  };

  for (const n of taiKhoan) {
    const ban = n.loai === 'NGUOI_BAN';

    await them('nguoi_dung', {
      id: n.id,
      ho_ten: n.ten,
      email: n.email,
      mat_khau_bam: await bcrypt.hash(matKhauDemo, 12),
      so_dien_thoai: n.soDienThoai,
      vai_tro: n.loai === 'QUAN_TRI' ? 'QUAN_TRI' : 'NGUOI_DUNG',
      trang_thai_nguoi_ban: ban ? 'DA_XAC_MINH' : 'CHUA_DANG_KY',
      ngay_tao: ngay(-90),
      ngay_cap_nhat: ngay(-60),
    });

    if (n.loai === 'QUAN_TRI') {
      continue;
    }

    await them('dia_chi_nguoi_dung', {
      id: n.id,
      nguoi_dung_id: n.id,
      ten_nguoi_nhan: n.ten,
      sdt_nguoi_nhan: n.soDienThoai,
      tinh_thanh: 'TP Hồ Chí Minh',
      quan_huyen: 'Bình Thạnh',
      phuong_xa: 'Phường 25',
      dia_chi_chi_tiet: `Căn ${n.id}, khu nhà mẫu VietBid`,
      la_mac_dinh: 1,
      ngay_tao: ngay(-85),
      ngay_cap_nhat: ngay(-85),
    });

    if (ban) {
      await them('xac_minh_nguoi_ban', {
        id: n.id,
        nguoi_dung_id: n.id,
        loai_giay_to: 'KHAC',
        so_giay_to: `VB-HOSO-${n.id}`,
        anh_mat_truoc: tep[`xac-minh-${n.id}`],
        ten_ngan_hang: 'Ngân hàng thử nghiệm VietBid',
        so_tai_khoan: `000000${n.id}`,
        chu_tai_khoan: n.ten,
        trang_thai: 'DA_XAC_MINH',
        ngay_gui_ho_so: ngay(-70),
        ngay_duyet: ngay(-60),
        nguoi_duyet_id: 1001,
        ngay_tao: ngay(-70),
        ngay_cap_nhat: ngay(-60),
      });
      ghi(1001, 'DUYET_XAC_MINH', 'xac_minh_nguoi_ban', n.id, ngay(-60));
      bao(
        n.id,
        'XAC_MINH_NGUOI_BAN',
        'Hồ sơ người bán được xác minh',
        'Bạn đã có thể gửi sản phẩm để kiểm định và xét duyệt.',
        '/seller/verification',
        ngay(-60),
      );
    }
  }

  for (const s of sanPham) {
    const p = kichBan.find((x) => x.sanPham === Number(s.id));
    const ngayDuyet = p ? ngay(Math.min(p.batDau - 2, -2)) : null;

    await them('san_pham', {
      ...s,
      nguoi_ban_id: nguoiBan(s.danh_muc_id),
      trang_thai_duyet: p ? 'DA_DUYET' : 'BAN_NHAP',
      nguoi_duyet_id: p ? 1001 : null,
      ngay_duyet: ngayDuyet,
      ly_do_tu_choi: null,
      ngay_tao: ngay(-55),
      ngay_cap_nhat: ngayDuyet || ngay(-1),
      bat_buoc_kiem_dinh: 1,
      ngay_chup_chinh_sach_kiem_dinh: ngay(-50),
    });
  }

  for (const a of goc('tep_dinh_kem').filter((x) => x.loai_tep === 'ANH_SAN_PHAM')) {
    const s = sanPham.find((x) => String(x.id) === String(a.san_pham_id));

    await them('tep_dinh_kem', {
      ...a,
      nguoi_tai_len_id: nguoiBan(s.danh_muc_id),
      ngay_tao: ngay(-54),
    });
  }
  for (const a of ctx.anhBoSung) {
    if (a.thayAnhChinh) {
      await ctx.sql('DELETE FROM tep_dinh_kem WHERE san_pham_id=? AND la_anh_chinh=1', [a.sanPham]);
    }
    await them('tep_dinh_kem', {
      loai_tep: 'ANH_SAN_PHAM',
      san_pham_id: a.sanPham,
      nguoi_tai_len_id: nguoiBan(sanPham.find((s) => Number(s.id) === a.sanPham).danh_muc_id),
      duong_dan_tep: a.duongDan,
      loai_noi_dung: 'HINH_ANH',
      la_anh_chinh: a.thayAnhChinh ? 1 : 0,
      thu_tu: a.thayAnhChinh ? 0 : 1,
      mo_ta: `${a.tieuDe} | ${a.tacGia} | ${a.giayPhep}`.slice(0, 500),
      ngay_tao: ngay(-53),
    });
  }

  const hoSo = new Map();

  for (const p of kichBan) {
    const kd = 4000 + p.sanPham;
    const moc = Math.min(p.batDau, 0);

    await them('kiem_dinh_san_pham', {
      id: kd,
      ma_kiem_dinh: `VB-KD-${p.sanPham}`,
      san_pham_id: p.sanPham,
      trang_thai: 'DANG_LUU_GIU',
      ket_qua: 'DAT',
      ngay_gui_trung_tam: ngay(moc - 8),
      don_vi_gui_trung_tam: 'Vận chuyển VietBid',
      ma_van_don_den_trung_tam: `VB-IN-${p.sanPham}`,
      ngay_nhan_trung_tam: ngay(moc - 7),
      tinh_trang_khi_nhan: 'Niêm phong nguyên vẹn; kiểm tra đủ phụ kiện trong hồ sơ.',
      serial_khi_nhan: `VB-SP-${p.sanPham}`,
      so_kien: 1,
      ten_chuyen_gia: 'Nguyễn An Khang',
      don_vi_kiem_dinh: 'Trung tâm thẩm định mẫu VietBid',
      ngay_kiem_dinh: ngay(moc - 5),
      nhan_xet:
        'Đạt yêu cầu theo hồ sơ thực hành; nội dung này không thay chứng thư thẩm định thật.',
      ma_chung_nhan: `VB-CN-${p.sanPham}`,
      nguoi_cap_nhat_id: 1001,
      ngay_tao: ngay(moc - 9),
      ngay_cap_nhat: ngay(moc - 5),
    });
    for (const [loai, khoa] of [
      ['BIEN_BAN_TIEP_NHAN', 'tiep-nhan'],
      ['BAO_CAO_KIEM_DINH', 'kiem-dinh'],
    ]) {
      await them('tep_dinh_kem', {
        loai_tep: loai,
        kiem_dinh_san_pham_id: kd,
        nguoi_tai_len_id: 1001,
        duong_dan_tep: tep[`${khoa}-${p.sanPham}`],
        loai_noi_dung: 'TAI_LIEU',
        ngay_tao: ngay(moc - (khoa === 'tiep-nhan' ? 7 : 5)),
      });
    }
    hoSo.set(p.sanPham, kd);
    ghi(1001, 'KET_QUA_KIEM_DINH', 'kiem_dinh_san_pham', kd, ngay(moc - 5), { ket_qua: 'DAT' });
  }

  for (const [id, trangThai, ketQua] of [
    [104, 'DANG_KIEM_DINH', 'CHO_KET_QUA'],
    [108, 'CAN_BO_SUNG', 'CAN_BO_SUNG'],
  ]) {
    await sua('san_pham', id, { trang_thai_duyet: 'CHO_XU_LY' });
    await them('kiem_dinh_san_pham', {
      id: 4000 + id,
      ma_kiem_dinh: `VB-KD-${id}`,
      san_pham_id: id,
      trang_thai: trangThai,
      ket_qua: ketQua,
      ngay_gui_trung_tam: ngay(-5),
      ngay_nhan_trung_tam: ngay(-4),
      tinh_trang_khi_nhan: 'Đã nhận hàng và đối chiếu hồ sơ tiếp nhận.',
      so_kien: 1,
      ngay_kiem_dinh: id === 108 ? ngay(-2) : null,
      ten_chuyen_gia: id === 108 ? 'Nguyễn An Khang' : null,
      don_vi_kiem_dinh: 'Trung tâm thẩm định mẫu VietBid',
      nhan_xet: id === 108 ? 'Cần bổ sung hồ sơ nguồn gốc và ảnh dấu đáy bình.' : null,
      nguoi_cap_nhat_id: 1001,
      ngay_tao: ngay(-6),
      ngay_cap_nhat: ngay(-1),
    });
    await them('tep_dinh_kem', {
      loai_tep: 'BIEN_BAN_TIEP_NHAN',
      kiem_dinh_san_pham_id: 4000 + id,
      nguoi_tai_len_id: 1001,
      duong_dan_tep: tep[`tiep-nhan-${id}`],
      loai_noi_dung: 'TAI_LIEU',
      ngay_tao: ngay(-4),
    });
    bao(
      1102,
      'KIEM_DINH',
      id === 108 ? 'Cần bổ sung hồ sơ nguồn gốc' : 'Sản phẩm đang được kiểm định',
      'Xem hồ sơ và thực hiện bước tiếp theo.',
      `/inspections/${4000 + id}`,
      ngay(-1),
    );
  }

  const buocGia = JSON.parse(
    goc('cau_hinh_he_thong').find((x) => x.khoa_cau_hinh === 'BUOC_GIA').gia_tri_cau_hinh,
  );
  const ketQuaPhien = new Map();

  for (const p of kichBan) {
    const s = sanPham.find((x) => Number(x.id) === p.sanPham);
    const ban = nguoiBan(s.danh_muc_id);
    const dong = {
      id: p.id,
      san_pham_id: p.sanPham,
      gia_khoi_diem: String(p.gia),
      gia_hien_tai: String(p.gia),
      gia_san: p.san ? String(p.san) : null,
      gia_mua_ngay: p.muaNgay ? String(p.muaNgay) : null,
      cho_phep_mua_ngay: p.muaNgay ? 1 : 0,
      nguoi_dan_dau_id: null,
      thoi_gian_bat_dau: ngay(p.batDau),
      thoi_gian_ket_thuc_goc: ngay(p.ketThuc),
      thoi_gian_ket_thuc: ngay(p.ketThuc),
      trang_thai: 'HOAT_DONG',
      phi_van_chuyen: p.sanPham === 116 ? '3000000' : '150000',
      yeu_cau_dat_coc: p.coc ? 1 : 0,
      so_tien_dat_coc: p.coc ? String(p.coc) : null,
      ngay_tao: ngay(Math.min(p.batDau - 1, -1)),
      ngay_cap_nhat: ngay(Math.min(p.batDau, 0)),
      tong_luot_tra_gia: 0,
      dat_gia_san: 0,
    };

    await them('phien_dau_gia', dong);
    ghi(ban, 'TAO_PHIEN', 'phien_dau_gia', p.id, dong.ngay_tao);

    const camKet = [];
    let luotCuoi;

    for (let i = 0; i < p.bids.length; i++) {
      const [bidder, tran] = p.bids[i];
      const mocBid = p.batDau + (i + 1) / 48;

      if (p.coc) {
        await them('dat_coc_dau_gia', {
          phien_dau_gia_id: p.id,
          nguoi_dung_id: bidder,
          so_tien: p.coc,
          trang_thai: 'DA_DAT_COC',
          ma_giao_dich: `VB-COC-${p.id}-${bidder}`,
          khoa_yeu_cau: `vb-coc-${p.id}-${bidder}`,
          ngay_dat_coc: ngay(mocBid - 0.01),
          ngay_tao: ngay(mocBid - 0.02),
          ngay_cap_nhat: ngay(mocBid - 0.01),
        });
      }

      const tinh = tinhKetQuaDauGia(dong, camKet, String(bidder), String(tran), buocGia);

      await them('tham_gia_phien', {
        phien_dau_gia_id: p.id,
        nguoi_dung_id: bidder,
        gia_toi_da: tran,
        thoi_gian_dat_gia_toi_da: ngay(mocBid),
        dang_theo_doi: 1,
        ngay_theo_doi: ngay(mocBid - 0.02),
        ngay_tao: ngay(mocBid - 0.02),
        ngay_cap_nhat: ngay(mocBid),
      });
      camKet.push({ nguoi_tra_gia_id: String(bidder), gia_toi_da: String(tran) });
      for (const l of tinh.publicBids) {
        luotCuoi = await them('luot_tra_gia', {
          phien_dau_gia_id: p.id,
          nguoi_tra_gia_id: l.bidderId,
          so_tien: chuoiTien(l.price),
          loai_tra_gia: l.type,
          ngay_tao: ngay(mocBid),
        });
      }
      dong.nguoi_dan_dau_id = tinh.winnerId;
      dong.gia_hien_tai = chuoiTien(tinh.price);
      dong.tong_luot_tra_gia += tinh.publicBids.length;
      dong.dat_gia_san = p.san == null || Number(dong.gia_hien_tai) >= p.san ? 1 : 0;
    }

    if (p.nguoiMuaNgay) {
      dong.nguoi_dan_dau_id = String(p.nguoiMuaNgay);
      dong.gia_hien_tai = String(p.muaNgay);
      dong.dat_gia_san = 1;
    }
    dong.trang_thai = ['HOAT_DONG', 'DA_LEN_LICH', 'THAT_BAI'].includes(p.ketQua)
      ? p.ketQua
      : 'DA_KET_THUC';
    dong.ly_do_ket_thuc =
      dong.trang_thai === 'DA_KET_THUC'
        ? p.nguoiMuaNgay
          ? 'MUA_NGAY'
          : 'CO_NGUOI_THANG'
        : p.ketQua === 'THAT_BAI'
          ? 'KHONG_DAT_GIA_SAN'
          : null;
    dong.cho_phep_mua_ngay = p.ketQua === 'DA_LEN_LICH' && p.muaNgay ? 1 : 0;
    dong.ngay_cap_nhat = ngay(Math.min(p.ketThuc, -0.1));
    await sua('phien_dau_gia', p.id, dong);
    ketQuaPhien.set(p.id, {
      ...dong,
      ban,
      p,
    });

    if (p.ketQua === 'THAT_BAI') {
      await ctx.sql(
        "UPDATE dat_coc_dau_gia SET trang_thai='DA_HOAN_COC',ngay_hoan=?,ly_do_xu_ly='Phiên không đạt giá sàn',ngay_cap_nhat=? WHERE phien_dau_gia_id=?",
        [ngay(p.ketThuc), ngay(p.ketThuc), p.id],
      );
    }
    if (dong.trang_thai === 'HOAT_DONG') {
      bao(
        Number(dong.nguoi_dan_dau_id),
        'DANG_DAN_DAU',
        'Bạn đang dẫn đầu phiên đấu giá',
        'Theo dõi giá công khai và thời gian còn lại của phiên.',
        `/auctions/${p.id}`,
        ngay(-0.1),
      );
    } else if (dong.trang_thai !== 'DA_LEN_LICH') {
      ghi(null, 'KET_THUC_PHIEN', 'phien_dau_gia', p.id, ngay(p.ketThuc), {
        trang_thai: dong.trang_thai,
      });
    }
  }

  // Giao dịch đi qua các mốc cố định theo thời điểm dựng, không sinh trạng thái ngẫu nhiên.
  async function don(id, phienId, trangThai, moc, tuyChon = {}) {
    const a = ketQuaPhien.get(phienId);
    const mua = tuyChon.mua || Number(a.nguoi_dan_dau_id);
    const gia = tuyChon.gia || Number(a.gia_hien_tai);
    const coc = tuyChon.second ? 0 : a.p.coc || 0;
    const tong = gia + Number(a.phi_van_chuyen);
    const chuaTra = ['DA_HUY', 'CHO_THANH_TOAN'].includes(trangThai);
    const daGiao = ['HOAN_THANH', 'DANG_TRANH_CHAP'].includes(trangThai);
    const daGui = daGiao || trangThai === 'DA_GUI_HANG';
    const ngayTra = moc + (tuyChon.second || a.p.nguoiMuaNgay ? 0 : 0.1);
    const gui = moc + (trangThai === 'DA_GUI_HANG' ? 0.5 : 1);
    const giao = moc + 2;
    const xong = moc + 3;
    const n = nguoi.get(mua);
    const d = {
      id,
      ma_don_hang: `VB-${id}`,
      phien_dau_gia_id: phienId,
      nguoi_mua_id: mua,
      nguoi_ban_id: a.ban,
      nguon_don: tuyChon.second ? 'DE_NGHI_TIEP_THEO' : 'THANG_DAU_GIA',
      nguon_gui_hang: 'TRUNG_TAM',
      kiem_dinh_san_pham_id: hoSo.get(a.p.sanPham),
      gia_san_pham: gia,
      phi_van_chuyen: a.phi_van_chuyen,
      tong_tien: tong,
      trang_thai: trangThai,
      han_thanh_toan: ngay(moc + 2),
      han_nguoi_ban_gui_hang: chuaTra ? null : ngay(ngayTra + 3),
      ten_nguoi_nhan: n.ten,
      sdt_nguoi_nhan: n.soDienThoai,
      dia_chi_giao_hang: `Căn ${mua}, khu nhà mẫu VietBid, Phường 25, Bình Thạnh, TP Hồ Chí Minh`,
      tien_coc_da_chuyen: coc,
      so_tien_da_thu: chuaTra ? coc : tong,
      so_tien_da_giai_ngan: trangThai === 'HOAN_THANH' ? tong : 0,
      trang_thai_giu_tien:
        trangThai === 'HOAN_THANH' ? 'DA_GIAI_NGAN' : coc || !chuaTra ? 'DANG_GIU' : 'CHO_GIU_TIEN',
      ngay_bat_dau_giu: coc ? ngay(moc) : !chuaTra ? ngay(ngayTra) : null,
      ngay_giai_ngan: trangThai === 'HOAN_THANH' ? ngay(xong) : null,
      ngay_hoan_thanh: trangThai === 'HOAN_THANH' ? ngay(xong) : null,
      ngay_gui_hang: daGui ? ngay(gui) : null,
      ngay_giao_hang: daGiao ? ngay(giao) : null,
      ngay_giao_van_chuyen: daGiao ? ngay(giao) : null,
      han_kiem_tra: daGiao ? ngay(giao + 3) : null,
      moc_khieu_nai_chua_nhan: daGui ? ngay(gui + 7) : null,
      don_vi_van_chuyen: daGui ? 'Trung tâm VietBid' : null,
      ma_van_don: daGui ? `VB-OUT-${id}` : null,
      trang_thai_van_chuyen: daGiao ? 'DA_GIAO' : daGui ? 'DANG_VAN_CHUYEN' : null,
      ngay_huy: trangThai === 'DA_HUY' ? ngay(moc + 2) : null,
      ly_do_huy: trangThai === 'DA_HUY' ? 'KHONG_THANH_TOAN' : null,
      can_admin_xu_ly: trangThai === 'DA_HUY' ? 1 : 0,
      ly_do_can_xu_ly:
        trangThai === 'DA_HUY' ? 'Cọc không hoàn do quá hạn, chờ Admin xử lý theo quy định.' : null,
      ngay_tao: ngay(moc),
      ngay_cap_nhat: ngay(Math.min(xong, 0)),
    };

    await them('don_hang', d);

    if (coc) {
      await ctx.sql(
        'UPDATE dat_coc_dau_gia SET trang_thai=?,don_hang_id=?,ngay_chuyen_vao_don=?,ngay_khong_hoan=?,ly_do_xu_ly=?,ngay_cap_nhat=? WHERE phien_dau_gia_id=? AND nguoi_dung_id=?',
        [
          trangThai === 'DA_HUY' ? 'KHONG_HOAN_COC' : 'DA_CHUYEN_VAO_DON',
          id,
          ngay(moc),
          trangThai === 'DA_HUY' ? ngay(moc + 2) : null,
          trangThai === 'DA_HUY'
            ? 'Người thắng không thanh toán đúng hạn'
            : 'Trừ cọc vào tổng tiền đơn',
          ngay(moc),
          phienId,
          mua,
        ],
      );
      await ctx.sql(
        "UPDATE dat_coc_dau_gia SET trang_thai='DA_HOAN_COC',ngay_hoan=?,ly_do_xu_ly='Không thắng phiên',ngay_cap_nhat=? WHERE phien_dau_gia_id=? AND nguoi_dung_id<>?",
        [ngay(moc), ngay(moc), phienId, mua],
      );
    }
    if (!chuaTra) {
      await them('thanh_toan', {
        don_hang_id: id,
        phuong_thuc_thanh_toan: 'MO_PHONG',
        so_tien: tong - coc,
        trang_thai: 'DA_THANH_TOAN',
        ma_giao_dich: `VB-TT-${id}`,
        khoa_yeu_cau: `vb-tt-${id}`,
        ngay_thanh_toan: ngay(ngayTra),
        ngay_het_han: ngay(moc + 2),
        ngay_tao: ngay(ngayTra),
        ngay_cap_nhat: ngay(ngayTra),
      });
    }
    if (daGui) {
      await sua('kiem_dinh_san_pham', hoSo.get(a.p.sanPham), {
        ngay_roi_trung_tam: ngay(gui),
        ngay_cap_nhat: ngay(gui),
      });
    }
    ghi(mua, 'TAO_DON_HANG', 'don_hang', id, ngay(moc));
    if (!chuaTra) {
      ghi(mua, 'THANH_TOAN_DON', 'don_hang', id, ngay(ngayTra));
    }
    if (daGui) {
      ghi(1001, 'TRUNG_TAM_GUI_HANG', 'don_hang', id, ngay(gui));
    }
    bao(
      mua,
      'CAP_NHAT_DON',
      `Đơn VB-${id}`,
      `Đơn ${a.p.sanPham}: ${trangThai}. Xem chi tiết và bước tiếp theo.`,
      `/orders/${id}`,
      ngay(Math.min(xong, 0)),
    );
    bao(
      a.ban,
      'CAP_NHAT_DON',
      `Giao dịch VB-${id}`,
      `Đơn hàng hiện ở trạng thái ${trangThai}.`,
      `/orders/${id}`,
      ngay(Math.min(xong, 0)),
    );

    return d;
  }

  const rolex = await don(3001, 2001, 'HOAN_THANH', -20);
  const huy = await don(3002, 2002, 'DA_HUY', -6);
  const [luotNguon] = await ctx.sql(
    'SELECT * FROM luot_tra_gia WHERE phien_dau_gia_id=2002 AND nguoi_tra_gia_id=1202 ORDER BY ngay_tao DESC,id DESC LIMIT 1',
  );
  const sc = await don(3003, 2002, 'CHO_GUI_HANG', -0.5, {
    mua: 1202,
    gia: Number(luotNguon.so_tien),
    second: true,
  });

  await them('de_nghi_mua_tiep_theo', {
    id: 5001,
    phien_dau_gia_id: 2002,
    don_hang_goc_id: 3002,
    nguoi_tra_gia_id: 1202,
    gia_de_nghi: luotNguon.so_tien,
    luot_tra_gia_nguon_id: luotNguon.id,
    nguoi_yeu_cau_id: sc.nguoi_ban_id,
    trang_thai: 'DA_CHAP_NHAN',
    het_han_luc: ngay(0.25),
    ngay_phan_hoi: ngay(-0.5),
    don_hang_moi_id: 3003,
    ngay_tao: ngay(-0.75),
  });
  ghi(sc.nguoi_ban_id, 'TAO_DE_NGHI_MUA_TIEP', 'de_nghi_mua_tiep_theo', 5001, ngay(-0.75), {
    luot_tra_gia_nguon_id: luotNguon.id,
  });
  bao(
    1202,
    'SECOND_CHANCE',
    'Đề nghị mua Omega đã được chấp nhận',
    'Đã thanh toán theo lượt giá công khai của bạn. Trung tâm đang chuẩn bị gửi hàng.',
    '/second-chances/5001',
    ngay(-0.5),
  );
  await them('vi_pham', {
    id: 6001,
    nguoi_dung_id: 1204,
    phien_dau_gia_id: 2002,
    don_hang_id: huy.id,
    loai_vi_pham: 'KHONG_THANH_TOAN',
    mo_ta: 'Không thanh toán phần còn lại của đơn Omega trong 48 giờ.',
    ngay_tao: ngay(-4),
    trang_thai: 'DANG_MO',
  });
  bao(
    1001,
    'VI_PHAM',
    'Cần xử lý cọc không hoàn',
    'Đơn VB-3002 quá hạn thanh toán; xem khoản cọc và vi phạm liên quan.',
    '/orders/3002',
    ngay(-4),
  );

  const limoges = await don(3004, 2003, 'HOAN_THANH', -12);
  const tranhChap = await don(3005, 2004, 'DANG_TRANH_CHAP', -5);

  await don(3006, 2005, 'DA_GUI_HANG', -2);
  await don(3007, 2006, 'CHO_THANH_TOAN', -0.04);

  for (const [id, d, daXuLy, moc] of [
    [7001, limoges, true, -9.5],
    [7002, tranhChap, false, -2.5],
  ]) {
    await them('tranh_chap', {
      id,
      don_hang_id: d.id,
      nguoi_mo_id: d.nguoi_mua_id,
      ly_do: 'KHONG_KHOP_HO_SO_KIEM_DINH',
      mo_ta: daXuLy
        ? 'Cần đối chiếu vết men với ảnh lúc kiểm định bộ bình Limoges.'
        : 'Bề mặt bình phong khi mở kiện có điểm khác với biên bản bàn giao.',
      trang_thai: daXuLy ? 'GIAI_QUYET_CHO_NGUOI_BAN' : 'QUAN_TRI_DANG_XU_LY',
      phan_hoi_nguoi_ban: daXuLy
        ? 'Vết men đã ghi trong hồ sơ và ảnh trước khi gửi. Đề nghị trung tâm đối chiếu.'
        : 'Đã cung cấp biên bản đóng gói và đề nghị kiểm tra lại khi giao nhận.',
      nguoi_xu_ly_id: 1001,
      ngay_mo: ngay(moc),
      ngay_giai_quyet: daXuLy ? ngay(-9) : null,
      ket_qua_xu_ly: daXuLy
        ? 'Đối chiếu hồ sơ cho thấy đúng tình trạng đã công bố. Giải ngân toàn bộ cho người bán.'
        : null,
      ngay_tao: ngay(moc),
      ngay_cap_nhat: ngay(daXuLy ? -9 : -1),
    });
    for (const [vai, chu] of [
      ['mua', d.nguoi_mua_id],
      ['ban', d.nguoi_ban_id],
    ]) {
      await them('tep_dinh_kem', {
        loai_tep: 'BANG_CHUNG_TRANH_CHAP',
        tranh_chap_id: id,
        nguoi_tai_len_id: chu,
        duong_dan_tep: tep[`tranh-chap-${id}-${vai}`],
        loai_noi_dung: 'TAI_LIEU',
        mo_ta: vai === 'mua' ? 'Biên bản đối chiếu khi nhận hàng' : 'Phản hồi và hồ sơ đóng gói',
        ngay_tao: ngay(moc + 0.1),
      });
    }
    ghi(d.nguoi_mua_id, 'MO_TRANH_CHAP', 'tranh_chap', id, ngay(moc));
    ghi(
      1001,
      daXuLy ? 'GIAI_QUYET_TRANH_CHAP' : 'TIEP_NHAN_TRANH_CHAP',
      'tranh_chap',
      id,
      ngay(daXuLy ? -9 : -1),
    );
    bao(
      1001,
      'TRANH_CHAP',
      daXuLy ? 'Tranh chấp đã giải quyết' : 'Tranh chấp cần giải quyết',
      `Hồ sơ gắn với đơn VB-${d.id}.`,
      `/disputes/${id}`,
      ngay(daXuLy ? -9 : -1),
    );
  }

  for (const [d, moc, muaNhanXet, banNhanXet] of [
    [
      rolex,
      -16,
      'Đồng hồ đúng mô tả, đóng gói cẩn thận và nhận đủ hồ sơ.',
      'Người mua thanh toán đúng hạn, trao đổi rõ ràng.',
    ],
    [
      limoges,
      -8,
      'Trung tâm đã đối chiếu hồ sơ rõ ràng, tôi nhận đủ bộ bình.',
      'Hai bên đã thống nhất sau khi xem lại hồ sơ tình trạng.',
    ],
  ]) {
    for (const [tu, den, sao, noiDung] of [
      [d.nguoi_mua_id, d.nguoi_ban_id, d.id === 3001 ? 5 : 4, muaNhanXet],
      [d.nguoi_ban_id, d.nguoi_mua_id, 5, banNhanXet],
    ]) {
      await them('danh_gia', {
        don_hang_id: d.id,
        nguoi_danh_gia_id: tu,
        nguoi_duoc_danh_gia_id: den,
        so_sao: sao,
        nhan_xet: noiDung,
        ngay_tao: ngay(moc),
      });
    }
    ghi(1001, 'HOAN_THANH_DON', 'don_hang', d.id, d.ngay_hoan_thanh);
  }

  await them('tham_gia_phien', {
    phien_dau_gia_id: 2009,
    nguoi_dung_id: 1201,
    dang_theo_doi: 1,
    ngay_theo_doi: ngay(-0.2),
    ngay_tao: ngay(-0.2),
  });
  await them('yeu_cau_xu_ly', {
    id: 8001,
    loai_yeu_cau: 'HUY_PHIEN',
    phien_dau_gia_id: 2009,
    nguoi_yeu_cau_id: 1104,
    ly_do: 'Cần bổ sung bản ghi kiểm tra âm thanh trước khi mở phiên violin.',
    ngay_tao: ngay(-0.1),
  });
  await them('yeu_cau_xu_ly', {
    id: 8002,
    loai_yeu_cau: 'BAO_CAO_SAN_PHAM',
    san_pham_id: 112,
    nguoi_yeu_cau_id: 1208,
    ma_ly_do: 'KHAC',
    ly_do: 'Đề nghị bổ sung thông tin năm bảo dưỡng gần nhất của máy ảnh.',
    ngay_tao: ngay(-0.1),
  });
  bao(
    1001,
    'YEU_CAU_HUY_PHIEN',
    'Người bán đề nghị hủy phiên violin',
    'Phiên chưa mở; cần xem lý do trước khi quyết định.',
    '/auctions/2009',
    ngay(-0.1),
  );
  bao(
    1001,
    'BAO_CAO_SAN_PHAM',
    'Có báo cáo về máy ảnh Leica',
    'Người mua cần làm rõ hồ sơ bảo dưỡng sản phẩm.',
    '/auctions/2008',
    ngay(-0.1),
  );
  for (const x of nhatKy) {
    await them('nhat_ky_hoat_dong', x);
  }
  for (const [i, x] of thongBao.entries()) {
    await them('thong_bao', {
      ...x,
      khoa_su_kien: `vb-moi-${i + 1}`,
      da_doc: i < 5 ? 1 : 0,
      ngay_doc: i < 5 ? ngay(-59) : null,
    });
  }
}

module.exports = { taoDuLieu };
