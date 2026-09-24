import coSoDuLieu = require('./ket-noi');
import { docJSON } from '../utils/du-lieu-json';
const cauHinh = (khoa) =>
  coSoDuLieu.layMot('SELECT * FROM cau_hinh_he_thong WHERE khoa_cau_hinh = ?', [khoa]);
const danhSachCauHinh = () => coSoDuLieu.truyVan('SELECT * FROM cau_hinh_he_thong ORDER BY id');
const khoaCauHinh = () =>
  coSoDuLieu.truyVan('SELECT id FROM cau_hinh_he_thong ORDER BY id FOR UPDATE');

async function cacBuocGia() {
  const banGhi = await cauHinh('BUOC_GIA');

  return docJSON(banGhi?.gia_tri_cau_hinh, [])
    .map((b, i) => ({
      ...b,
      id: String(b.id ?? i + 1),
      dang_hoat_dong: b.dang_hoat_dong ?? 1,
    }))
    .filter((b) => b.dang_hoat_dong);
}

const luuBoBuocGia = (duLieu, nguoiCapNhatId) =>
  coSoDuLieu.truyVan(
    `INSERT INTO cau_hinh_he_thong (khoa_cau_hinh,gia_tri_cau_hinh,kieu_du_lieu,nguoi_cap_nhat_id)
   VALUES ('BUOC_GIA',?,'JSON',?) ON DUPLICATE KEY UPDATE gia_tri_cau_hinh=VALUES(gia_tri_cau_hinh),nguoi_cap_nhat_id=VALUES(nguoi_cap_nhat_id)`,
    [JSON.stringify(duLieu), nguoiCapNhatId],
  );
const thongBaoDaCo = (nguoiDungId, loai, lienKet) =>
  coSoDuLieu.layMot(
    'SELECT id FROM thong_bao WHERE nguoi_dung_id = ? AND loai = ? AND duong_dan_lien_ket = ? LIMIT 1',
    [nguoiDungId, loai, lienKet],
  );
const quyenXemBangChung = (duongDan, nguoiDungId) =>
  coSoDuLieu.layMot(
    `SELECT b.id FROM tep_dinh_kem b
     JOIN tranh_chap t ON t.id=b.tranh_chap_id
     JOIN don_hang d ON d.id=t.don_hang_id
     WHERE b.loai_tep='BANG_CHUNG_TRANH_CHAP' AND b.duong_dan_tep=? AND (d.nguoi_mua_id=? OR d.nguoi_ban_id=?)
     LIMIT 1`,
    [duongDan, nguoiDungId, nguoiDungId],
  );
export {
  cauHinh,
  danhSachCauHinh,
  khoaCauHinh,
  cacBuocGia,
  luuBoBuocGia,
  thongBaoDaCo,
  quyenXemBangChung,
};
