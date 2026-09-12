const coSoDuLieu = require('./ket-noi');
const cauHinh = (khoa) =>
  coSoDuLieu.layMot('SELECT * FROM cau_hinh_he_thong WHERE khoa_cau_hinh = ?', [khoa]);
const danhSachCauHinh = () => coSoDuLieu.truyVan('SELECT * FROM cau_hinh_he_thong ORDER BY id');
const khoaCauHinh = () =>
  coSoDuLieu.truyVan('SELECT id FROM cau_hinh_he_thong ORDER BY id FOR UPDATE');
const cacBuocGia = () =>
  coSoDuLieu.truyVan('SELECT * FROM buoc_gia WHERE dang_hoat_dong = 1 ORDER BY gia_tu');
const tatBuocGiaCu = () =>
  coSoDuLieu.truyVan('UPDATE buoc_gia SET dang_hoat_dong = 0 WHERE dang_hoat_dong = 1');
const thongBaoDaCo = (nguoiDungId, loai, lienKet) =>
  coSoDuLieu.layMot(
    'SELECT id FROM thong_bao WHERE nguoi_dung_id = ? AND loai = ? AND duong_dan_lien_ket = ? LIMIT 1',
    [nguoiDungId, loai, lienKet],
  );
const quyenXemBangChung = (duongDan, nguoiDungId) =>
  coSoDuLieu.layMot(
    `SELECT b.id FROM bang_chung_tranh_chap b JOIN tranh_chap t ON t.id=b.tranh_chap_id JOIN don_hang d ON d.id=t.don_hang_id WHERE b.duong_dan_tep=? AND (d.nguoi_mua_id=? OR d.nguoi_ban_id=?) LIMIT 1`,
    [duongDan, nguoiDungId, nguoiDungId],
  );
module.exports = {
  cauHinh,
  danhSachCauHinh,
  khoaCauHinh,
  cacBuocGia,
  tatBuocGiaCu,
  thongBaoDaCo,
  quyenXemBangChung,
};
