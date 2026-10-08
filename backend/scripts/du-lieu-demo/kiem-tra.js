const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const { nhanDangLoaiTep } = require('../../dist/services/tai-tep');
const { danhMuc, taiKhoan } = require('./ke-hoach');

async function kiemTra(c, nguon, { moRong = false } = {}) {
  const sql = async (q, v = []) => (await c.execute(q, v))[0];
  const loi = {};

  async function dem(ten, q) {
    loi[ten] = Number((await sql(q))[0].n);
  }

  const fks = await sql(`SELECT TABLE_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME
    FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL`);

  loi.khoa_ngoai_mo_co = 0;
  for (const f of fks) {
    const [r] =
      await sql(`SELECT COUNT(*) n FROM \`${f.TABLE_NAME}\` c LEFT JOIN \`${f.REFERENCED_TABLE_NAME}\` p
      ON c.\`${f.COLUMN_NAME}\`=p.\`${f.REFERENCED_COLUMN_NAME}\` WHERE c.\`${f.COLUMN_NAME}\` IS NOT NULL AND p.\`${f.REFERENCED_COLUMN_NAME}\` IS NULL`);

    loi.khoa_ngoai_mo_co += Number(r.n);
  }
  await dem(
    'seller_hoac_admin_bid',
    `SELECT COUNT(*) n FROM luot_tra_gia l JOIN phien_dau_gia p ON p.id=l.phien_dau_gia_id
    JOIN san_pham s ON s.id=p.san_pham_id JOIN nguoi_dung n ON n.id=l.nguoi_tra_gia_id
    WHERE s.nguoi_ban_id=l.nguoi_tra_gia_id OR n.vai_tro='QUAN_TRI'`,
  );
  await dem(
    'seller_khong_hop_le',
    `SELECT COUNT(*) n FROM san_pham s LEFT JOIN nguoi_dung n ON n.id=s.nguoi_ban_id
    WHERE n.id IS NULL OR n.vai_tro='QUAN_TRI' OR n.trang_thai_nguoi_ban<>'DA_XAC_MINH'`,
  );
  await dem(
    'timeline_kiem_dinh',
    `SELECT COUNT(*) n FROM kiem_dinh_san_pham k JOIN san_pham s ON s.id=k.san_pham_id
    WHERE k.ngay_tao>k.ngay_gui_trung_tam OR k.ngay_gui_trung_tam>=k.ngay_nhan_trung_tam
    OR k.ngay_nhan_trung_tam>=k.ngay_kiem_dinh OR k.ngay_kiem_dinh>=s.ngay_duyet
    OR (k.ket_qua IN ('DAT','CAN_BO_SUNG','KHONG_DAT') AND (k.ngay_kiem_dinh IS NULL OR NOT EXISTS
      (SELECT 1 FROM tep_dinh_kem t WHERE t.kiem_dinh_san_pham_id=k.id AND t.loai_tep='BAO_CAO_KIEM_DINH')))`,
  );
  await dem(
    'phien_chua_duyet_kiem_dinh',
    `SELECT COUNT(*) n FROM phien_dau_gia p JOIN san_pham s ON s.id=p.san_pham_id
    WHERE s.trang_thai_duyet<>'DA_DUYET' OR s.ngay_duyet>=p.ngay_tao OR NOT EXISTS
    (SELECT 1 FROM kiem_dinh_san_pham k WHERE k.san_pham_id=s.id AND k.ket_qua='DAT')`,
  );
  await dem(
    'phien_sai_thoi_gian',
    `SELECT COUNT(*) n FROM phien_dau_gia WHERE
    (trang_thai='HOAT_DONG' AND (thoi_gian_bat_dau>CURRENT_TIMESTAMP OR thoi_gian_ket_thuc<=CURRENT_TIMESTAMP))
    OR (trang_thai='DA_LEN_LICH' AND thoi_gian_bat_dau<=CURRENT_TIMESTAMP)
    OR (trang_thai IN ('DA_KET_THUC','THAT_BAI') AND thoi_gian_ket_thuc>CURRENT_TIMESTAMP)`,
  );
  await dem(
    'bid_ngoai_phien',
    `SELECT COUNT(*) n FROM luot_tra_gia l JOIN phien_dau_gia p ON p.id=l.phien_dau_gia_id
    WHERE l.ngay_tao<p.thoi_gian_bat_dau OR l.ngay_tao>p.thoi_gian_ket_thuc OR l.so_tien<=0`,
  );
  await dem(
    'tong_bid_sai',
    `SELECT COUNT(*) n FROM phien_dau_gia p WHERE p.tong_luot_tra_gia<>(SELECT COUNT(*) FROM luot_tra_gia l WHERE l.phien_dau_gia_id=p.id)`,
  );
  await dem(
    'gia_va_dan_dau_sai',
    `SELECT COUNT(*) n FROM phien_dau_gia p WHERE p.tong_luot_tra_gia>0 AND
    (p.gia_hien_tai<>(SELECT l.so_tien FROM luot_tra_gia l WHERE l.phien_dau_gia_id=p.id ORDER BY l.ngay_tao DESC,l.id DESC LIMIT 1)
    OR p.nguoi_dan_dau_id<>(SELECT l.nguoi_tra_gia_id FROM luot_tra_gia l WHERE l.phien_dau_gia_id=p.id ORDER BY l.ngay_tao DESC,l.id DESC LIMIT 1))`,
  );
  await dem(
    'bid_chua_coc',
    `SELECT COUNT(*) n FROM luot_tra_gia l JOIN phien_dau_gia p ON p.id=l.phien_dau_gia_id
    WHERE p.yeu_cau_dat_coc=1 AND NOT EXISTS (SELECT 1 FROM dat_coc_dau_gia c
    WHERE c.phien_dau_gia_id=p.id AND c.nguoi_dung_id=l.nguoi_tra_gia_id AND c.ngay_dat_coc<=l.ngay_tao AND c.so_tien=p.so_tien_dat_coc)`,
  );
  await dem(
    'so_tien_don_sai',
    `SELECT COUNT(*) n FROM don_hang WHERE tong_tien<>gia_san_pham+phi_van_chuyen
    OR so_tien_dang_giu<>so_tien_da_thu-so_tien_da_hoan-so_tien_da_giai_ngan OR so_tien_da_thu>tong_tien
    OR so_tien_dang_giu<0 OR so_tien_con_phai_thanh_toan<>tong_tien-so_tien_da_thu`,
  );
  await dem(
    'doi_soat_thanh_toan',
    `SELECT COUNT(*) n FROM don_hang d WHERE d.so_tien_da_thu<>d.tien_coc_da_chuyen+
    COALESCE((SELECT SUM(t.so_tien) FROM thanh_toan t WHERE t.don_hang_id=d.id AND t.trang_thai IN ('DA_THANH_TOAN','DA_HOAN_TIEN')),0)`,
  );
  await dem(
    'doi_soat_coc',
    `SELECT COUNT(*) n FROM don_hang d WHERE d.tien_coc_da_chuyen<>
    COALESCE((SELECT SUM(c.so_tien) FROM dat_coc_dau_gia c WHERE c.don_hang_id=d.id AND c.trang_thai IN ('DA_CHUYEN_VAO_DON','KHONG_HOAN_COC')),0)`,
  );
  await dem(
    'han_thanh_toan_sai',
    `SELECT COUNT(*) n FROM don_hang WHERE han_thanh_toan<ngay_tao
    OR (trang_thai='CHO_THANH_TOAN' AND han_thanh_toan<=CURRENT_TIMESTAMP)
    OR (trang_thai='CHO_GUI_HANG' AND han_nguoi_ban_gui_hang<=CURRENT_TIMESTAMP)`,
  );
  await dem(
    'timeline_giao_hang',
    `SELECT COUNT(*) n FROM don_hang d WHERE d.ngay_gui_hang<d.ngay_bat_dau_giu
    OR d.ngay_giao_hang<d.ngay_gui_hang OR d.ngay_hoan_thanh<d.ngay_giao_hang
    OR (d.ngay_gui_hang IS NOT NULL AND (d.so_tien_da_thu<>d.tong_tien OR d.ma_van_don IS NULL))`,
  );
  await dem(
    'trung_tam_giu_gui_sai',
    `SELECT COUNT(*) n FROM don_hang d JOIN kiem_dinh_san_pham k ON k.id=d.kiem_dinh_san_pham_id
    WHERE d.nguon_gui_hang<>'TRUNG_TAM' OR k.ket_qua<>'DAT'
    OR (d.ngay_gui_hang IS NOT NULL AND NOT (d.ngay_gui_hang<=>k.ngay_roi_trung_tam))
    OR (d.trang_thai IN ('CHO_THANH_TOAN','CHO_GUI_HANG') AND k.ngay_roi_trung_tam IS NOT NULL)`,
  );
  await dem(
    'trang_thai_tien_sai',
    `SELECT COUNT(*) n FROM don_hang WHERE
    (trang_thai='HOAN_THANH' AND (trang_thai_giu_tien<>'DA_GIAI_NGAN' OR so_tien_da_giai_ngan<>tong_tien OR so_tien_dang_giu<>0))
    OR (trang_thai='DANG_TRANH_CHAP' AND (trang_thai_giu_tien<>'DANG_GIU' OR so_tien_dang_giu<>tong_tien))`,
  );
  await dem(
    'second_chance_sai',
    `SELECT COUNT(*) n FROM de_nghi_mua_tiep_theo x
    JOIN luot_tra_gia l ON l.id=x.luot_tra_gia_nguon_id JOIN don_hang d ON d.id=x.don_hang_goc_id
    JOIN phien_dau_gia p ON p.id=x.phien_dau_gia_id WHERE x.gia_de_nghi<>l.so_tien
    OR x.nguoi_tra_gia_id<>l.nguoi_tra_gia_id OR x.phien_dau_gia_id<>l.phien_dau_gia_id
    OR l.ngay_tao<p.thoi_gian_bat_dau OR l.ngay_tao>p.thoi_gian_ket_thuc
    OR d.trang_thai<>'DA_HUY' OR d.ly_do_huy<>'KHONG_THANH_TOAN' OR d.ngay_huy>x.ngay_tao
    OR (x.trang_thai='CHO_XU_LY' AND x.het_han_luc<=CURRENT_TIMESTAMP) OR x.ngay_phan_hoi>x.het_han_luc`,
  );
  await dem(
    'second_chance_chap_nhan_sai',
    `SELECT COUNT(*) n FROM de_nghi_mua_tiep_theo x LEFT JOIN don_hang d ON d.id=x.don_hang_moi_id
    WHERE x.trang_thai='DA_CHAP_NHAN' AND (d.id IS NULL OR d.nguoi_mua_id<>x.nguoi_tra_gia_id
    OR d.gia_san_pham<>x.gia_de_nghi OR d.so_tien_da_thu<>d.tong_tien OR d.ngay_tao<>x.ngay_phan_hoi)`,
  );
  await dem(
    'danh_gia_sai',
    `SELECT COUNT(*) n FROM danh_gia g JOIN don_hang d ON d.id=g.don_hang_id
    WHERE d.trang_thai<>'HOAN_THANH' OR g.ngay_tao<d.ngay_hoan_thanh
    OR NOT ((g.nguoi_danh_gia_id=d.nguoi_mua_id AND g.nguoi_duoc_danh_gia_id=d.nguoi_ban_id)
      OR (g.nguoi_danh_gia_id=d.nguoi_ban_id AND g.nguoi_duoc_danh_gia_id=d.nguoi_mua_id))`,
  );
  await dem(
    'tranh_chap_sai',
    `SELECT COUNT(*) n FROM tranh_chap t JOIN don_hang d ON d.id=t.don_hang_id
    WHERE t.nguoi_mo_id<>d.nguoi_mua_id OR t.ngay_mo<d.ngay_giao_hang OR t.ngay_mo>d.han_kiem_tra
    OR NOT EXISTS (SELECT 1 FROM tep_dinh_kem k WHERE k.tranh_chap_id=t.id)
    OR (t.trang_thai='GIAI_QUYET_CHO_NGUOI_BAN' AND (d.trang_thai<>'HOAN_THANH' OR d.ngay_giai_ngan<t.ngay_giai_quyet))`,
  );
  await dem(
    'anh_chinh_sai',
    `SELECT COUNT(*) n FROM san_pham s WHERE
    (SELECT COUNT(*) FROM tep_dinh_kem t WHERE t.san_pham_id=s.id AND t.la_anh_chinh=1)<>1`,
  );

  if (moRong) {
    await dem(
      'don_khong_khop_san_pham',
      `SELECT COUNT(*) n FROM don_hang d
      JOIN phien_dau_gia p ON p.id=d.phien_dau_gia_id JOIN san_pham s ON s.id=p.san_pham_id
      JOIN kiem_dinh_san_pham k ON k.id=d.kiem_dinh_san_pham_id
      WHERE d.nguoi_ban_id<>s.nguoi_ban_id OR k.san_pham_id<>s.id
      OR d.nguoi_mua_id=d.nguoi_ban_id OR
      (d.nguon_don='THANG_DAU_GIA' AND (d.nguoi_mua_id<>p.nguoi_dan_dau_id OR d.gia_san_pham<>p.gia_hien_tai))`,
    );
    await dem(
      'thanh_toan_sai_chu_so_huu',
      `SELECT COUNT(*) n FROM thanh_toan t JOIN don_hang d ON d.id=t.don_hang_id
      WHERE t.so_tien<=0 OR t.ngay_tao<d.ngay_tao
      OR (t.trang_thai IN ('DA_THANH_TOAN','DA_HOAN_TIEN') AND t.ngay_thanh_toan>d.han_thanh_toan)`,
    );
    await dem(
      'xac_minh_khong_khop',
      `SELECT COUNT(*) n FROM nguoi_dung n WHERE n.trang_thai_nguoi_ban='DA_XAC_MINH'
      AND NOT EXISTS (SELECT 1 FROM xac_minh_nguoi_ban x WHERE x.nguoi_dung_id=n.id AND x.trang_thai='DA_XAC_MINH'
      AND x.ngay_duyet>=x.ngay_tao AND x.ngay_tao>=n.ngay_tao AND x.ngay_duyet<=NOW()
      AND x.anh_mat_truoc IS NOT NULL AND x.anh_selfie IS NOT NULL)`,
    );
    await dem(
      'san_pham_truoc_xac_minh',
      `SELECT COUNT(*) n FROM san_pham s WHERE NOT EXISTS
      (SELECT 1 FROM xac_minh_nguoi_ban x WHERE x.nguoi_dung_id=s.nguoi_ban_id AND x.trang_thai='DA_XAC_MINH' AND x.ngay_duyet<=s.ngay_tao)`,
    );
    await dem(
      'coc_sai_thoi_gian',
      `SELECT COUNT(*) n FROM dat_coc_dau_gia c JOIN phien_dau_gia p ON p.id=c.phien_dau_gia_id
      WHERE c.ngay_tao<c.ngay_dat_coc AND c.ngay_dat_coc>p.thoi_gian_ket_thuc
      OR c.ngay_dat_coc<c.ngay_tao OR c.ngay_hoan<c.ngay_dat_coc OR c.ngay_chuyen_vao_don<c.ngay_dat_coc
      OR c.ngay_khong_hoan<c.ngay_chuyen_vao_don`,
    );
    await dem(
      'hoan_tien_tranh_chap_sai',
      `SELECT COUNT(*) n FROM tranh_chap t JOIN don_hang d ON d.id=t.don_hang_id
      WHERE t.trang_thai='GIAI_QUYET_CHO_NGUOI_MUA' AND (d.trang_thai<>'DA_HUY'
      OR d.ly_do_huy<>'HOAN_TIEN_TRANH_CHAP' OR d.so_tien_da_hoan<>d.tong_tien
      OR t.so_tien_hoan<>d.tong_tien OR d.so_tien_da_giai_ngan<>0 OR d.so_tien_dang_giu<>0)`,
    );
    await dem(
      'tep_sai_chu_so_huu',
      `SELECT COUNT(*) n FROM tep_dinh_kem t WHERE
      CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(t.duong_dan_tep,'/',6),'/',-1) AS UNSIGNED)<>t.nguoi_tai_len_id`,
    );
  }

  const duongDan = [
    ...(await sql('SELECT duong_dan_tep url FROM tep_dinh_kem')),
    ...(await sql(
      'SELECT anh_mat_truoc url FROM xac_minh_nguoi_ban WHERE anh_mat_truoc IS NOT NULL',
    )),
    ...(await sql('SELECT anh_mat_sau url FROM xac_minh_nguoi_ban WHERE anh_mat_sau IS NOT NULL')),
    ...(await sql('SELECT anh_selfie url FROM xac_minh_nguoi_ban WHERE anh_selfie IS NOT NULL')),
  ];

  loi.tep_thieu_hoac_sai_mime = 0;
  for (const t of duongDan) {
    try {
      assert.match(
        t.url,
        /^\/api\/uploads\/files\/(product|inspection|evidence|verification)\/\d+\/[a-f0-9-]{36}\.(jpg|png|webp|pdf)$/,
      );

      const b = await fs.readFile(
        path.resolve(__dirname, '../../uploads', t.url.replace('/api/uploads/files/', '')),
      );
      const loai = nhanDangLoaiTep(b);

      assert(b.length > 100 && loai && t.url.endsWith('.' + loai.ext));
    } catch {
      loi.tep_thieu_hoac_sai_mime++;
    }
  }

  const dm = await sql('SELECT id,ten FROM danh_muc WHERE dang_hoat_dong=1 ORDER BY thu_tu,id');

  assert.deepEqual(
    dm.map((x) => [Number(x.id), x.ten]),
    danhMuc,
    'Phải hiển thị đúng 10 danh mục đã chốt.',
  );

  const sp = await sql(
    'SELECT id,danh_muc_id,tieu_de,duong_dan,mo_ta,tinh_trang_san_pham,thuong_hieu,thuoc_tinh_json FROM san_pham ORDER BY id',
  );

  if (moRong) {
    const dmDayDu = await sql('SELECT id,cau_hinh_thuoc_tinh FROM danh_muc');

    loi.thuoc_tinh_san_pham_sai = 0;

    const doc = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

    for (const p of sp) {
      const cauHinh =
        doc(dmDayDu.find((d) => String(d.id) === String(p.danh_muc_id)).cau_hinh_thuoc_tinh) || [];
      const giaTri = doc(p.thuoc_tinh_json);

      if (
        !cauHinh.every((d) => !d.bat_buoc || giaTri[d.khoa]?.gia_tri != null) ||
        !Object.entries(giaTri).every(([khoa, v]) =>
          cauHinh.some(
            (d) =>
              d.khoa === khoa &&
              String(d.id) === String(v.thuoc_tinh_id) &&
              String(v.san_pham_id) === String(p.id),
          ),
        )
      ) {
        loi.thuoc_tinh_san_pham_sai++;
      }
    }
    assert.equal(sp.length, 50, 'Phải giữ đủ 50 sản phẩm đã thống nhất');
  }

  if (nguon && !moRong) {
    const goc = nguon.bang.find((x) => x.ten === 'san_pham').dong;
    const chon = (x) =>
      Object.fromEntries(
        Object.keys(sp[0]).map((k) => [
          k,
          k === 'thuoc_tinh_json'
            ? JSON.stringify(typeof x[k] === 'string' ? JSON.parse(x[k]) : x[k])
            : String(x[k]),
        ]),
      );

    assert.deepEqual(sp.map(chon), goc.map(chon), 'Không được thay nội dung sản phẩm.');
  }

  const tk = await sql('SELECT id,email FROM nguoi_dung ORDER BY id');

  if (moRong) {
    assert.equal(tk.length, 51, 'Phải giữ 50 tài khoản người dùng và một quản trị');
  }

  if (!moRong) {
    assert.deepEqual(
      tk.map((x) => [Number(x.id), x.email]),
      taiKhoan.map((x) => [x.id, x.email]),
    );
  }

  const soLuong = {};

  for (const { TABLE_NAME: ten } of await sql(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME",
  )) {
    soLuong[ten] = Number((await sql(`SELECT COUNT(*) n FROM \`${ten}\``))[0].n);
  }
  for (const [k, v] of Object.entries(loi)) {
    assert.equal(v, 0, `Kiểm tra ${k}: ${v} lỗi`);
  }
  if (!moRong) {
    assert.equal(soLuong.phien_dau_gia, 10);
    assert.equal(soLuong.don_hang, 7);
    assert.equal(soLuong.luot_tra_gia, 27);
    assert(soLuong.nhat_ky_hoat_dong >= 30 && soLuong.nhat_ky_hoat_dong <= 60);
    assert(soLuong.thong_bao >= 20 && soLuong.thong_bao <= 40);
  }

  const anh = await sql(
    "SELECT san_pham_id,COUNT(*) n FROM tep_dinh_kem WHERE loai_tep='ANH_SAN_PHAM' GROUP BY san_pham_id",
  );

  return {
    ket_qua: 'PASS',
    soLuong,
    danh_muc_hien_thi: dm.length,
    so_anh: anh.reduce((n, a) => n + Number(a.n), 0),
    san_pham_nhieu_anh: anh.filter((a) => Number(a.n) >= 2).length,
    so_tep_da_kiem_tra: duongDan.length,
    loi,
  };
}

module.exports = { kiemTra };
