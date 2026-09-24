const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const pool = require('../../backend/dist/config/co-so-du-lieu');
const trangThai = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../trang-thai-chuyen-doi.json'), 'utf8'),
);
const nguon = trangThai.backup;
const dich = process.argv.includes('--chinh-thuc') ? 'doan4_daugia' : 'doan4_daugia_thiet_ke_19';
assert(/^[a-z0-9_]+$/.test(nguon));
const json = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

async function main() {
  const c = await pool.getConnection();
  let soNhom = 0;

  try {
    await c.query("SET time_zone='+07:00'");

    async function doiChieu(ten, sqlCu, sqlMoi, bienDoi = (x) => x) {
      const [cu] = await c.query(sqlCu);
      const [moi] = await c.query(sqlMoi);

      assert.deepEqual(bienDoi(moi), cu, 'Sai đối chiếu nhóm ' + ten);
      soNhom++;
      console.log('Đạt: ' + ten + ' (' + cu.length + ' bản ghi)');
    }

    await doiChieu(
      'ảnh sản phẩm',
      `SELECT id,san_pham_id,duong_dan_anh,la_anh_chinh,thu_tu,ngay_tao FROM ${nguon}.hinh_anh_san_pham ORDER BY id`,
      `SELECT id,san_pham_id,duong_dan_tep AS duong_dan_anh,la_anh_chinh,thu_tu,ngay_tao FROM ${dich}.tep_dinh_kem WHERE loai_tep='ANH_SAN_PHAM' ORDER BY id`,
    );

    const bu = trangThai.anh_id_bang_chung_cong_them;

    assert(/^\d+$/.test(bu));
    await doiChieu(
      'bằng chứng riêng tư',
      `SELECT CAST(id AS CHAR) AS id,tranh_chap_id,nguoi_tai_len_id,duong_dan_tep,loai_bang_chung,mo_ta,ngay_tao FROM ${nguon}.bang_chung_tranh_chap ORDER BY id`,
      `SELECT CAST(id-${bu} AS CHAR) AS id,tranh_chap_id,nguoi_tai_len_id,duong_dan_tep,loai_noi_dung AS loai_bang_chung,mo_ta,ngay_tao FROM ${dich}.tep_dinh_kem WHERE loai_tep='BANG_CHUNG_TRANH_CHAP' ORDER BY id`,
    );
    await doiChieu(
      'theo dõi',
      `SELECT phien_dau_gia_id,nguoi_dung_id,ngay_tao FROM ${nguon}.danh_sach_theo_doi ORDER BY phien_dau_gia_id,nguoi_dung_id`,
      `SELECT phien_dau_gia_id,nguoi_dung_id,ngay_theo_doi AS ngay_tao FROM ${dich}.tham_gia_phien WHERE dang_theo_doi=1 ORDER BY phien_dau_gia_id,nguoi_dung_id`,
    );
    await doiChieu(
      'cam kết và ưu tiên (không xuất giá trị)',
      `SELECT id,phien_dau_gia_id,nguoi_tra_gia_id,gia_toi_da,thoi_gian_dat_gia_toi_da,ngay_tao,ngay_cap_nhat FROM ${nguon}.muc_gia_toi_da ORDER BY id`,
      `SELECT id,phien_dau_gia_id,nguoi_dung_id AS nguoi_tra_gia_id,gia_toi_da,thoi_gian_dat_gia_toi_da,ngay_tao,ngay_cap_nhat FROM ${dich}.tham_gia_phien WHERE gia_toi_da IS NOT NULL ORDER BY id`,
    );
    await doiChieu(
      'vận chuyển',
      `SELECT * FROM ${nguon}.van_chuyen ORDER BY id`,
      `SELECT van_chuyen_id_cu AS id,id AS don_hang_id,don_vi_van_chuyen,ma_van_don,trang_thai_van_chuyen AS trang_thai,ngay_gui_hang,ngay_giao_van_chuyen AS ngay_giao_hang,van_chuyen_ngay_tao AS ngay_tao,van_chuyen_ngay_cap_nhat AS ngay_cap_nhat FROM ${dich}.don_hang WHERE van_chuyen_id_cu IS NOT NULL ORDER BY van_chuyen_id_cu`,
    );
    await doiChieu(
      'giữ tiền',
      `SELECT * FROM ${nguon}.giu_tien_trung_gian ORDER BY id`,
      `SELECT giu_tien_id_cu AS id,id AS don_hang_id,so_tien_da_thu AS so_tien,trang_thai_giu_tien AS trang_thai,ngay_bat_dau_giu,ngay_giai_ngan,ngay_hoan_tien,ghi_chu_giu_tien AS ghi_chu,giu_tien_ngay_tao AS ngay_tao,giu_tien_ngay_cap_nhat AS ngay_cap_nhat FROM ${dich}.don_hang WHERE giu_tien_id_cu IS NOT NULL ORDER BY giu_tien_id_cu`,
    );
    await doiChieu(
      'yêu cầu hủy',
      `SELECT * FROM ${nguon}.yeu_cau_huy_phien ORDER BY id`,
      `SELECT id,phien_dau_gia_id,nguoi_yeu_cau_id,ly_do,trang_thai,nguoi_duyet_id,ghi_chu_duyet,ngay_duyet,ngay_tao FROM ${dich}.yeu_cau_xu_ly WHERE loai_yeu_cau='HUY_PHIEN' ORDER BY id`,
    );
    for (const [bangCu, bangMoi, cot] of [
      ['thuoc_tinh_danh_muc', 'danh_muc', 'cau_hinh_thuoc_tinh'],
      ['gia_tri_thuoc_tinh_san_pham', 'san_pham', 'thuoc_tinh_json'],
    ]) {
      const [cu] = await c.query(`SELECT * FROM ${nguon}.${bangCu} ORDER BY id`);
      const [moi] = await c.query(`SELECT ${cot} AS du_lieu FROM ${dich}.${bangMoi} ORDER BY id`);
      const tatCa = moi.flatMap((r) => Object.values(json(r.du_lieu) || {}));

      assert.equal(tatCa.length, cu.length);
      for (const ban of cu) {
        const m = tatCa.find((x) => String(x.id) === String(ban.id));

        assert(m);
        for (const khoa of Object.keys(ban)) {
          assert.deepEqual(
            khoa === 'lua_chon_json' ? json(m[khoa]) : m[khoa],
            khoa === 'lua_chon_json' ? json(ban[khoa]) : ban[khoa],
          );
        }
      }
      soNhom++;
      console.log('Đạt: ' + bangCu + ' trong JSON (' + cu.length + ' bản ghi)');
    }
    await doiChieu(
      'bước giá',
      `SELECT * FROM ${nguon}.buoc_gia ORDER BY gia_tu,id`,
      `SELECT gia_tri_cau_hinh FROM ${dich}.cau_hinh_he_thong WHERE khoa_cau_hinh='BUOC_GIA'`,
      (rows) => json(rows[0].gia_tri_cau_hinh),
    );

    const [cu] = await c.query(`SELECT * FROM ${nguon}.gia_han_phien_dau_gia ORDER BY id`);
    const [moi] = await c.query(
      `SELECT * FROM ${dich}.nhat_ky_hoat_dong WHERE hanh_dong='GIA_HAN_PHIEN' ORDER BY id`,
    );

    assert.equal(moi.length, cu.length);
    for (const ban of cu) {
      const m = moi.find((x) => String(json(x.du_lieu_moi).gia_han_id_cu) === String(ban.id));

      assert(m);

      const j = json(m.du_lieu_moi);

      assert.equal(String(m.phien_dau_gia_id), String(ban.phien_dau_gia_id));
      assert.equal(String(m.luot_tra_gia_id), String(ban.luot_tra_gia_kich_hoat_id));
      assert.equal(m.ngay_tao, ban.ngay_tao);
      for (const cot of ['thoi_gian_ket_thuc_cu', 'thoi_gian_ket_thuc_moi']) {
        assert.equal(j[cot].replace(/\.0+$/, ''), ban[cot].replace(/\.0+$/, ''));
      }
      assert.equal(Number(j.so_giay_them), Number(ban.so_giay_them));
    }
    soNhom++;
    console.log('Đạt: lịch sử gia hạn (' + cu.length + ' bản ghi)');
    console.log('Đối chiếu đủ ' + soNhom + ' nhóm dữ liệu gộp.');
  } finally {
    c.release();
  }
}

main()
  .catch((e) => {
    console.error('Đối chiếu thất bại:', e.code || e.name);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
