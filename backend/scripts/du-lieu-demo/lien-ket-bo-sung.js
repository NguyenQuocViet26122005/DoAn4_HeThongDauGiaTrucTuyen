const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const db = require('../../dist/repositories/ket-noi');
const banGhi = require('../../dist/repositories/ban-ghi');
const sanPham = require('../../dist/services/danh-muc-san-pham');
const khoSanPham = require('../../dist/repositories/danh-muc-san-pham');
const kiemDinh = require('../../dist/services/kiem-dinh');
const dauGia = require('../../dist/services/dau-gia');
const datCoc = require('../../dist/services/dat-coc');
const donHang = require('../../dist/services/don-hang');
const muaTiep = require('../../dist/services/de-nghi-mua-tiep');
const tranhChap = require('../../dist/services/tranh-chap');
const tuongTac = require('../../dist/services/tuong-tac');
const nguoiDung = require('../../dist/services/nguoi-dung');
const cauHinh = require('../../dist/services/cau-hinh');
const { ghiNhatKy } = require('../../dist/services/nhat-ky-thong-bao');
const { sanPhamBoSung } = require('./san-pham-bo-sung');
const { tepDanhSach, tepCucBo, viTri } = require('./chuan-bi-bo-sung');
const { kiemTra } = require('./kiem-tra');

const dauMoc = 'VIETBID_LIEN_KET_50_V1';
const admin = { id: '1001', vai_tro: 'QUAN_TRI' };
const actor = (id) => ({ id: String(id), vai_tro: 'NGUOI_DUNG' });
const iso = (ngay) => ngay.replace(' ', 'T') + '+07:00';

// Chỉ đổi thời gian của kết nối dựng dữ liệu để chạy nghiệp vụ theo lịch sử.
// Không đổi đồng hồ máy chủ, timestamp toàn cục hoặc kết nối của ứng dụng.
async function luc(ngay, congViec) {
  const giay = Math.floor(new Date(iso(ngay)).getTime() / 1000);

  assert(Number.isSafeInteger(giay));
  await db.truyVan(`SET TIMESTAMP=${giay}`);

  return congViec();
}

async function chuanHoa(manifest) {
  for (const [id, title, attrs] of [
    [109, 'Đồng hồ để bàn Vienna – vỏ kim loại trang trí', ['Chưa xác định', 'Kim loại', false]],
    [
      122,
      'Tháp ngọc Jade Pagoda – tư liệu Jordan Schnitzer Museum',
      ['Chưa xác định', 'Ngọc điêu khắc', false],
    ],
  ]) {
    await banGhi.capNhat('san_pham', id, {
      tieu_de: title,
      mo_ta: `${title}. Ảnh tư liệu đối chiếu hình dáng hiện vật; niên đại và nguồn gốc cần đối chiếu trong hồ sơ tiếp nhận.`,
    });
    await khoSanPham.thayGiaTriThuocTinh(
      id,
      attrs.map((gia_tri, i) => ({ thuoc_tinh_id: String(i + 1), gia_tri: String(gia_tri) })),
    );
  }
  for (const p of sanPhamBoSung) {
    const cu = await banGhi.layTheoId('san_pham', p.id, true);

    assert(
      !(await db.layMot('SELECT id FROM phien_dau_gia WHERE san_pham_id=?', [p.id])),
      `Sản phẩm ${p.id} đã có phiên, không ghi đè`,
    );

    const dinhNghia = await khoSanPham.danhSachThuocTinh(cu.danh_muc_id);
    const cacGiaTri = dinhNghia.flatMap((d, i) =>
      p.giaTri[i] == null ? [] : [{ thuoc_tinh_id: String(d.id), gia_tri: String(p.giaTri[i]) }],
    );
    const hopLe = await sanPham.kiemTraGiaTriThuocTinh(cu.danh_muc_id, cacGiaTri, true);

    await banGhi.capNhat('san_pham', p.id, {
      tieu_de: p.tieuDe,
      duong_dan: `bo-suu-tap-${p.id}`,
      thuong_hieu: p.thuongHieu,
      mo_ta: `${p.tieuDe}. Hồ sơ ghi nhận tình trạng và phụ kiện theo lần tiếp nhận. Người mua cần đọc kết quả kiểm định và ảnh chi tiết trước khi tham gia. Các đặc điểm chưa đủ chứng từ được giữ ở trạng thái chờ đối chiếu.`,
    });
    await khoSanPham.thayGiaTriThuocTinh(p.id, hopLe);

    const anh = manifest.anh.find((a) => a.san_pham_id === p.id);

    assert(anh, `Thiếu ảnh đã chuẩn bị: ${p.id}`);
    await db.truyVan(
      'UPDATE tep_dinh_kem SET duong_dan_tep=?,mo_ta=? WHERE san_pham_id=? AND la_anh_chinh=1',
      [
        anh.duong_dan,
        `Nguồn: ${anh.trang_nguon}; ${anh.giay_phep}; ${anh.tac_gia}`.slice(0, 500),
        p.id,
      ],
    );

    await ghiNhatKy(admin.id, 'CHUAN_HOA_HO_SO_SAN_PHAM', 'san_pham', p.id, {
      anh_nguon: anh.trang_nguon,
    });
  }

  // Đưa ảnh cũ về thư mục chủ sở hữu hiện tại để quy tắc truy cập tệp thống nhất.
  for (const a of await db.truyVan(
    "SELECT t.* FROM tep_dinh_kem t WHERE t.loai_tep='ANH_SAN_PHAM'",
  )) {
    const owner = String(a.nguoi_tai_len_id);

    if (a.duong_dan_tep.split('/')[5] !== owner) {
      const ext = path.extname(a.duong_dan_tep).slice(1);
      const url = viTri('anh-cu-' + a.id, 'product', owner, ext);

      await fs.mkdir(path.dirname(tepCucBo(url)), { recursive: true });
      await fs.copyFile(tepCucBo(a.duong_dan_tep), tepCucBo(url));
      await banGhi.capNhat('tep_dinh_kem', a.id, { duong_dan_tep: url });
      a.duong_dan_tep = url;
    }
    if (a.mo_ta?.includes('https://commons.wikimedia.org/')) {
      continue;
    }

    const duLieuGoc = path.resolve(__dirname, '../../demo-assets');
    const nguonGoc = JSON.parse(await fs.readFile(path.join(duLieuGoc, 'nguon-anh.json'), 'utf8'));
    const hash = crypto
      .createHash('sha256')
      .update(await fs.readFile(tepCucBo(a.duong_dan_tep)))
      .digest('hex');

    for (const nguon of nguonGoc) {
      const noiDung = await fs.readFile(path.join(duLieuGoc, nguon.ten_tap_tin));

      if (crypto.createHash('sha256').update(noiDung).digest('hex') === hash) {
        await banGhi.capNhat('tep_dinh_kem', a.id, {
          mo_ta: `Nguồn: ${nguon.trang_nguon}; ${nguon.giay_phep}; ${nguon.tac_gia}`.slice(0, 500),
        });
        break;
      }
    }
  }
}

async function hoSoNguoiBan(manifest) {
  for (const id of [1101, 1102, 1103, 1104, 1105]) {
    const hoSo = await db.layMot('SELECT id FROM xac_minh_nguoi_ban WHERE nguoi_dung_id=?', [id]);

    await banGhi.capNhat('xac_minh_nguoi_ban', hoSo.id, {
      anh_selfie: manifest.tep[`xac-minh-${id}-selfie`],
    });
  }
  for (const id of Array.from({ length: 15 }, (_, i) => 1106 + i)) {
    const hoSo = await db.layMot('SELECT * FROM xac_minh_nguoi_ban WHERE nguoi_dung_id=?', [id]);

    assert(hoSo?.trang_thai === 'DA_XAC_MINH');
    await banGhi.capNhat('nguoi_dung', id, { ngay_tao: '2026-09-10 09:00:00' });
    await banGhi.capNhat('xac_minh_nguoi_ban', hoSo.id, {
      anh_mat_truoc: manifest.tep[`xac-minh-${id}-mat-truoc`],
      anh_selfie: manifest.tep[`xac-minh-${id}-selfie`],
      ngay_tao: '2026-09-15 09:00:00',
      ngay_duyet: '2026-09-16 09:00:00',
    });
  }
  for (const id of [1219, 1223, 1230]) {
    const user = await banGhi.layTheoId('nguoi_dung', id);
    const hoSo = await luc('2026-10-07 09:00:00', () =>
      nguoiDung.guiXacMinh(actor(id), {
        loai_giay_to: 'KHAC',
        so_giay_to: `VB-HOSO-${id}`,
        anh_mat_truoc: manifest.tep[`xac-minh-${id}-mat-truoc`],
        anh_selfie: manifest.tep[`xac-minh-${id}-selfie`],
        ten_ngan_hang: 'Ngân hàng thực hành VietBid',
        so_tai_khoan: `VB-${id}`,
        chu_tai_khoan: user.ho_ten,
      }),
    );

    if (id === 1223) {
      await luc('2026-10-07 14:00:00', () =>
        nguoiDung.duyetXacMinh(admin, hoSo.id, {
          trang_thai: 'TU_CHOI',
          ly_do_tu_choi: 'Thông tin tài khoản nhận tiền chưa khớp tên chủ hồ sơ; đề nghị bổ sung.',
        }),
      );
    }
  }
}

async function xuLyKiemDinh(manifest, id, muc = 'DAT') {
  const p = await banGhi.layTheoId('san_pham', id, true);
  const seller = actor(p.nguoi_ban_id);
  let hoSo = await db.layMot(
    'SELECT * FROM kiem_dinh_san_pham WHERE san_pham_id=? ORDER BY id DESC LIMIT 1',
    [id],
  );

  if (p.trang_thai_duyet === 'BAN_NHAP') {
    await luc('2026-09-29 08:00:00', () => sanPham.guiDuyet(seller, id));
  }
  if (!hoSo) {
    hoSo = await luc('2026-09-29 08:30:00', () => kiemDinh.tao(admin, id));
  } else {
    assert(hoSo.trang_thai === 'CHO_GUI_TRUNG_TAM' && !hoSo.ngay_gui_trung_tam);
    await banGhi.capNhat('kiem_dinh_san_pham', hoSo.id, { ngay_tao: '2026-09-29 08:30:00' });
    await banGhi.capNhat('san_pham', id, { ngay_chup_chinh_sach_kiem_dinh: '2026-09-29 08:00:00' });
  }
  if (muc === 'CHO') {
    return hoSo;
  }
  await luc('2026-09-29 09:00:00', () =>
    kiemDinh.guiTrungTam(seller, hoSo.id, {
      don_vi_van_chuyen: 'Viettel Post',
      ma_van_don: `VB-IN-${id}`,
    }),
  );
  if (muc === 'GUI') {
    return hoSo;
  }
  await luc('2026-09-29 13:00:00', () =>
    kiemDinh.nhanHang(admin, hoSo.id, {
      tinh_trang_khi_nhan: 'Niêm phong nguyên vẹn; đối chiếu sản phẩm và phụ kiện với hồ sơ.',
      serial_khi_nhan: `VB-KIEN-${id}`,
      so_kien: 1,
    }),
  );
  await luc('2026-09-29 13:05:00', () =>
    kiemDinh.themTep(admin, hoSo.id, {
      loai_tep: 'BIEN_BAN_TIEP_NHAN',
      duong_dan_tep: manifest.tep[`tiep-nhan-${id}`],
      mo_ta: `Biên bản tiếp nhận sản phẩm ${id}`,
    }),
  );
  if (muc === 'NHAN') {
    return hoSo;
  }
  await luc('2026-09-29 14:00:00', () => kiemDinh.batDau(admin, hoSo.id));
  if (muc === 'KIEM') {
    return hoSo;
  }
  await luc('2026-09-29 16:00:00', () =>
    kiemDinh.themTep(admin, hoSo.id, {
      loai_tep: 'BAO_CAO_KIEM_DINH',
      duong_dan_tep: manifest.tep[`kiem-dinh-${id}`],
      mo_ta: `Kết quả đối chiếu hồ sơ sản phẩm ${id}`,
    }),
  );
  await luc('2026-09-29 16:30:00', () =>
    kiemDinh.ghiKetQua(admin, hoSo.id, {
      ket_qua: muc === 'BO_SUNG' ? 'CAN_BO_SUNG' : muc === 'TU_CHOI' ? 'KHONG_DAT' : 'DAT',
      ten_chuyen_gia: 'Nguyễn An Khang',
      don_vi_kiem_dinh: 'Trung tâm VietBid',
      ngay_kiem_dinh: iso('2026-09-29 16:30:00'),
      nhan_xet:
        muc === 'BO_SUNG'
          ? 'Cần thêm hồ sơ nguồn gốc để đối chiếu niên đại.'
          : muc === 'TU_CHOI'
            ? 'Đặc điểm vật liệu không khớp thông tin đăng ký, chưa đủ điều kiện niêm yết.'
            : 'Đã đối chiếu hồ sơ, tình trạng và phụ kiện; đạt điều kiện niêm yết trong hồ sơ thực hành.',
      ma_chung_nhan: `VB-KD-${id}`,
    }),
  );
  if (muc === 'DAT') {
    await luc('2026-09-29 17:00:00', () =>
      sanPham.duyet(admin, id, { trang_thai_duyet: 'DA_DUYET' }),
    );
  } else if (muc === 'TU_CHOI') {
    await luc('2026-09-29 17:00:00', () =>
      sanPham.duyet(admin, id, {
        trang_thai_duyet: 'TU_CHOI',
        ly_do_tu_choi: 'Kiểm định không đạt; trả sản phẩm về người bán.',
      }),
    );
    await luc('2026-09-30 09:00:00', () =>
      kiemDinh.traNguoiBan(admin, hoSo.id, { ly_do: 'Trả nguyên kiện do kiểm định không đạt.' }),
    );
  }

  return hoSo;
}

async function taoPhien(id, gia, batDau, ketThuc, muaNgay = null) {
  const p = await banGhi.layTheoId('san_pham', id);

  return luc('2026-09-30 08:00:00', () =>
    dauGia.tao(actor(p.nguoi_ban_id), {
      san_pham_id: String(id),
      gia_khoi_diem: String(gia),
      phi_van_chuyen: '200000',
      gia_mua_ngay: muaNgay == null ? null : String(muaNgay),
      thoi_gian_bat_dau: iso(batDau),
      thoi_gian_ket_thuc: iso(ketThuc),
    }),
  );
}

async function cocVaBid(phien, bids) {
  for (const [id, gia, ngay] of bids) {
    const user = actor(id);

    await luc(ngay, async () => {
      await datCoc.dangKy(user, phien.id);
      await datCoc.thanhToan(user, phien.id, {
        khoa_yeu_cau: `VB50-COC-${phien.san_pham_id}-${id}`,
      });
      await dauGia.theoDoi(user, phien.id, true);
      await dauGia.datGia(user, phien.id, { gia_toi_da: String(gia) });
    });
  }
}

async function dongPhien(phien, ngay) {
  await luc(ngay, () => dauGia.xuLyDenHan(phien.id));

  const don = await require('../../dist/repositories/don-hang').donDangXuLyCuaPhien(phien.id);

  assert(don, 'Phiên phải có đơn thắng');

  return don;
}

async function giaoVaNhan(don, ngayGui, ngayNhan, ngayHoanThanh = null) {
  const buyer = actor(don.nguoi_mua_id);

  await luc(ngayGui, () =>
    donHang.guiHang(admin, don.id, {
      don_vi_van_chuyen: 'Viettel Post',
      ma_van_don: `VB-OUT-${don.id}`,
    }),
  );
  await luc(ngayNhan, () => donHang.xacNhanDaGiao(buyer, don.id));
  if (ngayHoanThanh) {
    await luc(ngayHoanThanh, () => donHang.xacNhanHoanThanh(buyer, don.id));
    await luc(ngayHoanThanh, () =>
      tuongTac.danhGiaDonHang(buyer, don.id, {
        so_sao: 5,
        nhan_xet: 'Đúng sản phẩm và hồ sơ kiểm định, đóng gói cẩn thận, giao nhận đầy đủ.',
      }),
    );
    await luc(ngayHoanThanh, () =>
      tuongTac.danhGiaDonHang(actor(don.nguoi_ban_id), don.id, {
        so_sao: 5,
        nhan_xet: 'Người mua thanh toán đúng hạn và xác nhận nhận hàng rõ ràng.',
      }),
    );
  }
}

async function cacCauChuyen(manifest) {
  const ketQua = [];
  const p1 = await taoPhien(129, 180000000, '2026-09-30 09:00:00', '2026-10-01 18:00:00');

  await cocVaBid(p1, [
    [1212, 210000000, '2026-09-30 10:00:00'],
    [1213, 225000000, '2026-09-30 11:00:00'],
    [1211, 250000000, '2026-10-01 12:00:00'],
  ]);

  const d1 = await dongPhien(p1, '2026-10-01 18:01:00');

  await luc('2026-10-01 19:00:00', () => donHang.thanhToan(actor(1211), d1.id, {}));
  await giaoVaNhan(d1, '2026-10-02 09:00:00', '2026-10-03 15:00:00', '2026-10-04 09:00:00');
  ketQua.push({
    tinh_huong: 'Đấu giá, cọc, thanh toán, giao hàng, giải ngân, hai chiều đánh giá',
    san_pham: 129,
    phien: p1.id,
    don: d1.id,
  });

  const p2 = await taoPhien(130, 60000000, '2026-09-30 09:00:00', '2026-10-01 12:00:00');

  await cocVaBid(p2, [
    [1216, 68000000, '2026-09-30 10:00:00'],
    [1215, 75000000, '2026-09-30 12:00:00'],
    [1214, 90000000, '2026-10-01 09:00:00'],
  ]);

  const d2 = await dongPhien(p2, '2026-10-01 12:01:00');

  await luc('2026-10-03 13:00:00', () => donHang.xuLyDenHan(d2.id));

  const deNghi = await luc('2026-10-03 14:00:00', () => muaTiep.tao(actor(1113), d2.id));

  assert.equal(Number(deNghi.nguoi_tra_gia_id), 1215);

  const chapNhan = await luc('2026-10-03 15:00:00', () =>
    muaTiep.phanHoiDeNghi(actor(1215), deNghi.id, { chap_nhan: true }),
  );

  await giaoVaNhan(
    chapNhan.don_hang,
    '2026-10-04 09:00:00',
    '2026-10-05 14:00:00',
    '2026-10-06 09:00:00',
  );
  ketQua.push({
    tinh_huong: 'Không thanh toán, cọc không hoàn, vi phạm, Second Chance, hoàn thành',
    san_pham: 130,
    phien: p2.id,
    don_goc: d2.id,
    de_nghi: deNghi.id,
    don: chapNhan.don_hang.id,
  });

  const p3 = await taoPhien(131, 120000000, '2026-09-30 09:00:00', '2026-10-02 12:00:00');

  await cocVaBid(p3, [
    [1218, 135000000, '2026-09-30 12:00:00'],
    [1219, 140000000, '2026-10-01 12:00:00'],
    [1217, 160000000, '2026-10-02 09:00:00'],
  ]);

  const d3 = await dongPhien(p3, '2026-10-02 12:01:00');

  await luc('2026-10-02 13:00:00', () => donHang.thanhToan(actor(1217), d3.id, {}));
  await giaoVaNhan(d3, '2026-10-03 09:00:00', '2026-10-04 14:00:00');

  const tc = await luc('2026-10-04 15:00:00', () =>
    tranhChap.mo(actor(1217), d3.id, {
      ly_do: 'THIEU_PHU_KIEN',
      mo_ta:
        'Phụ kiện trong kiện hàng không đủ so với hồ sơ giao dịch; yêu cầu đối chiếu biên bản trung tâm.',
    }),
  );

  for (const [owner, side] of [
    [1217, 'người mua'],
    [1114, 'người bán'],
  ]) {
    await luc('2026-10-04 16:00:00', () =>
      tranhChap.themBangChung(actor(owner), tc.id, {
        duong_dan_tep: manifest.tep[`tranh-chap-131-${side}`],
        mo_ta: 'Đối chiếu biên bản và phụ kiện lúc giao nhận',
      }),
    );
  }
  await luc('2026-10-04 17:00:00', () =>
    tranhChap.phanHoiNguoiBan(actor(1114), tc.id, {
      phan_hoi_nguoi_ban:
        'Đề nghị trung tâm đối chiếu lại danh sách phụ kiện và kiện giao để giải quyết.',
    }),
  );
  await luc('2026-10-05 09:00:00', () => tranhChap.tiepNhan(admin, tc.id));
  await luc('2026-10-05 15:00:00', () =>
    tranhChap.giaiQuyet(admin, tc.id, {
      ket_qua: 'NGUOI_MUA',
      ket_qua_xu_ly:
        'Hồ sơ giao nhận xác nhận thiếu phụ kiện. Hoàn toàn bộ tiền sản phẩm và phí vận chuyển cho người mua.',
    }),
  );
  ketQua.push({
    tinh_huong: 'Tranh chấp, bằng chứng hai bên, Admin hoàn toàn bộ',
    san_pham: 131,
    phien: p3.id,
    don: d3.id,
    tranh_chap: tc.id,
  });

  const p4 = await taoPhien(133, 40000000, '2026-10-07 09:00:00', '2026-10-12 18:00:00');

  await cocVaBid(p4, [
    [1220, 48000000, '2026-10-07 10:00:00'],
    [1221, 55000000, '2026-10-07 11:00:00'],
    [1222, 55000000, '2026-10-07 12:00:00'],
  ]);

  const row4 = await banGhi.layTheoId('phien_dau_gia', p4.id);

  assert.equal(Number(row4.nguoi_dan_dau_id), 1221, 'Cùng giá tối đa, người đặt trước dẫn đầu');
  ketQua.push({
    tinh_huong: 'Đang đấu giá; hai giá tối đa bằng nhau, ưu tiên người đặt trước',
    san_pham: 133,
    phien: p4.id,
  });

  const p5 = await taoPhien(136, 250000000, '2026-10-10 09:00:00', '2026-10-15 18:00:00');

  for (const id of [1223, 1224, 1230]) {
    await luc('2026-10-07 15:00:00', () => dauGia.theoDoi(actor(id), p5.id, true));
  }
  ketQua.push({
    tinh_huong: 'Phiên đã lên lịch, ba người theo dõi',
    san_pham: 136,
    phien: p5.id,
  });

  const p6 = await taoPhien(
    137,
    1800000000,
    '2026-10-06 09:00:00',
    '2026-10-12 18:00:00',
    2200000000,
  );

  await luc('2026-10-06 10:00:00', () => dauGia.theoDoi(actor(1223), p6.id, true));

  const mua = await luc('2026-10-06 11:00:00', () => dauGia.muaNgay(actor(1224), p6.id, {}));

  await giaoVaNhan(mua.don_hang, '2026-10-06 15:00:00', '2026-10-07 15:00:00');
  ketQua.push({
    tinh_huong: 'Mua ngay thanh toán đủ, trung tâm giao xe, người mua đang kiểm tra',
    san_pham: 137,
    phien: p6.id,
    don: mua.don_hang.id,
  });

  const p7 = await taoPhien(143, 28000000, '2026-10-06 09:00:00', '2026-10-08 09:00:00');

  await cocVaBid(p7, [
    [1225, 34000000, '2026-10-06 12:00:00'],
    [1219, 36000000, '2026-10-07 12:00:00'],
    [1226, 42000000, '2026-10-07 15:00:00'],
  ]);

  const d7 = await dongPhien(p7, '2026-10-08 09:01:00');

  ketQua.push({
    tinh_huong: 'Người thắng có cọc chuyển vào đơn, đang chờ thanh toán phần còn lại',
    san_pham: 143,
    phien: p7.id,
    don: d7.id,
  });

  const p8 = await taoPhien(144, 15000000, '2026-10-07 09:00:00', '2026-10-13 18:00:00');

  await cocVaBid(p8, [
    [1227, 18000000, '2026-10-07 10:00:00'],
    [1228, 20000000, '2026-10-07 11:00:00'],
    [1229, 24000000, '2026-10-07 12:00:00'],
  ]);
  await luc('2026-10-07 15:00:00', () => dauGia.theoDoi(actor(1230), p8.id, true));
  ketQua.push({
    tinh_huong: 'Đang đấu giá, ba người trả giá và một người theo dõi',
    san_pham: 144,
    phien: p8.id,
  });

  return ketQua;
}

async function boSungBaoCaoCu(manifest) {
  const hoSo = await db.layMot(
    "SELECT * FROM kiem_dinh_san_pham WHERE san_pham_id=108 AND ket_qua='CAN_BO_SUNG' ORDER BY id DESC LIMIT 1 FOR UPDATE",
  );

  if (
    !hoSo ||
    (await db.layMot(
      "SELECT id FROM tep_dinh_kem WHERE kiem_dinh_san_pham_id=? AND loai_tep='BAO_CAO_KIEM_DINH'",
      [hoSo.id],
    ))
  ) {
    return;
  }
  await luc('2026-10-05 17:01:12', () =>
    kiemDinh.themTep(admin, hoSo.id, {
      loai_tep: 'BAO_CAO_KIEM_DINH',
      duong_dan_tep: manifest.tep['kiem-dinh-108'],
      mo_ta: 'Kết quả đối chiếu: cần bổ sung hồ sơ nguồn gốc và ảnh dấu đáy bình.',
    }),
  );
}

async function lienKet({ dryRun = false } = {}) {
  assert.equal(process.env.DB_NAME, 'doan4_daugia', 'Backend phải trỏ đúng CSDL chính');

  const manifest = JSON.parse(await fs.readFile(tepDanhSach, 'utf8'));
  const daCo = await db.layMot('SELECT id FROM nhat_ky_hoat_dong WHERE ma_yeu_cau=?', [dauMoc]);
  const rollback = new Error('HOAN_TAC_THU_DU_LIEU');
  let ketQua;

  if (daCo) {
    try {
      await db.giaoDich(async () => {
        try {
          await boSungBaoCaoCu(manifest);
          await db.truyVan('SET TIMESTAMP=DEFAULT');
          ketQua = await kiemTra({ execute: async (q, v) => [await db.truyVan(q, v)] }, null, {
            moRong: true,
          });
          if (dryRun) {
            throw rollback;
          }
        } finally {
          await db.truyVan('SET TIMESTAMP=DEFAULT');
        }
      });
    } catch (loi) {
      if (loi !== rollback) {
        throw loi;
      }
      ketQua.che_do = 'dry-run, đã rollback dữ liệu thử';
    }

    return ketQua;
  }

  try {
    await db.giaoDich(async () => {
      try {
        await chuanHoa(manifest);
        await hoSoNguoiBan(manifest);
        await boSungBaoCaoCu(manifest);
        for (const id of [98, 123, 129, 130, 131, 133, 135, 136, 137, 143, 144]) {
          await xuLyKiemDinh(manifest, id);
        }
        for (const [id, muc] of [
          [124, 'BO_SUNG'],
          [125, 'TU_CHOI'],
          [126, 'NHAN'],
          [127, 'KIEM'],
          [138, 'GUI'],
          [139, 'CHO'],
          [140, 'NHAN'],
        ]) {
          await xuLyKiemDinh(manifest, id, muc);
        }

        const policy = await db.layMot(
          "SELECT gia_tri_cau_hinh FROM cau_hinh_he_thong WHERE khoa_cau_hinh='DEPOSIT_POLICY'",
        );
        const cu =
          typeof policy.gia_tri_cau_hinh === 'string'
            ? JSON.parse(policy.gia_tri_cau_hinh)
            : policy.gia_tri_cau_hinh;

        await luc('2026-09-29 18:00:00', () =>
          cauHinh.luu(admin, 'DEPOSIT_POLICY', {
            gia_tri_cau_hinh: {
              bat: true,
              kieu: 'TY_LE',
              gia_tri: 10,
            },
          }),
        );

        const cauChuyen = await cacCauChuyen(manifest);

        await db.truyVan('SET TIMESTAMP=DEFAULT');
        await cauHinh.luu(admin, 'DEPOSIT_POLICY', { gia_tri_cau_hinh: cu });
        await db.truyVan('SET TIMESTAMP=DEFAULT');

        await ghiNhatKy(admin.id, 'HOAN_THIEN_DU_LIEU_LIEN_KET', 'he_thong', null, {
          cau_chuyen: cauChuyen,
        });

        const nhatKy = await db.layMot(
          "SELECT id FROM nhat_ky_hoat_dong WHERE hanh_dong='HOAN_THIEN_DU_LIEU_LIEN_KET' ORDER BY id DESC LIMIT 1",
        );

        await banGhi.capNhat('nhat_ky_hoat_dong', nhatKy.id, { ma_yeu_cau: dauMoc });
        ketQua = await kiemTra({ execute: async (q, v) => [await db.truyVan(q, v)] }, null, {
          moRong: true,
        });
        ketQua.cau_chuyen_bo_sung = cauChuyen;
        if (dryRun) {
          throw rollback;
        }
      } finally {
        await db.truyVan('SET TIMESTAMP=DEFAULT');
      }
    });
  } catch (loi) {
    if (loi !== rollback) {
      throw loi;
    }
    ketQua.che_do = 'dry-run, đã rollback toàn bộ';
  }

  return ketQua;
}

module.exports = { lienKet, dauMoc };
