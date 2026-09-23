const coSoDuLieu = require('./ket-noi');
const khoBanGhi = require('./ban-ghi');
const layTheoId = (id, khoaDuLieu = false) => khoBanGhi.layTheoId('nguoi_dung', id, khoaDuLieu);
const timTheoEmail = (thuDienTu) =>
  coSoDuLieu.layMot('SELECT * FROM nguoi_dung WHERE email = ?', [thuDienTu]);
const danhSachDiaChi = (nguoiDungId) =>
  coSoDuLieu.truyVan(
    'SELECT * FROM dia_chi_nguoi_dung WHERE nguoi_dung_id = ? ORDER BY la_mac_dinh DESC, id',
    [nguoiDungId],
  );
const diaChiMacDinh = (nguoiDungId) =>
  coSoDuLieu.layMot(
    'SELECT * FROM dia_chi_nguoi_dung WHERE nguoi_dung_id = ? ORDER BY la_mac_dinh DESC, id LIMIT 1',
    [nguoiDungId],
  );
const boDiaChiMacDinh = (nguoiDungId) =>
  coSoDuLieu.truyVan('UPDATE dia_chi_nguoi_dung SET la_mac_dinh = 0 WHERE nguoi_dung_id = ?', [
    nguoiDungId,
  ]);
const coCamKet = (nguoiDungId) =>
  coSoDuLieu.layMot(
    `SELECT m.id FROM muc_gia_toi_da m JOIN phien_dau_gia a ON a.id = m.phien_dau_gia_id WHERE m.nguoi_tra_gia_id = ? AND a.trang_thai IN ('DA_LEN_LICH','HOAT_DONG') LIMIT 1`,
    [nguoiDungId],
  );
const cacHoSoXacMinh = (nguoiDungId) =>
  coSoDuLieu.truyVan('SELECT * FROM xac_minh_nguoi_ban WHERE nguoi_dung_id = ? ORDER BY id DESC', [
    nguoiDungId,
  ]);
const danhSach = ({ limit: gioiHan, offset: viTriBatDau }, timKiem = '') =>
  coSoDuLieu.truyVan(
    `SELECT id, ho_ten, email, so_dien_thoai, anh_dai_dien, vai_tro,
            trang_thai_nguoi_ban, trang_thai_tai_khoan, ngay_tao
     FROM nguoi_dung
     WHERE ho_ten LIKE ? OR email LIKE ?
     ORDER BY id DESC
     LIMIT ${gioiHan} OFFSET ${viTriBatDau}`,
    [`%${timKiem}%`, `%${timKiem}%`],
  );
const danhSachChoXacMinh = ({ limit: gioiHan, offset: viTriBatDau }, trangThai) =>
  coSoDuLieu.truyVan(
    `SELECT x.*, n.ho_ten, n.email FROM xac_minh_nguoi_ban x
     JOIN nguoi_dung n ON n.id=x.nguoi_dung_id
     WHERE x.trang_thai=?
     ORDER BY x.id
     LIMIT ${gioiHan} OFFSET ${viTriBatDau}`,
    [trangThai],
  );
module.exports = {
  layTheoId,
  timTheoEmail,
  danhSachDiaChi,
  diaChiMacDinh,
  boDiaChiMacDinh,
  coCamKet,
  cacHoSoXacMinh,
  danhSach,
  danhSachChoXacMinh,
};
