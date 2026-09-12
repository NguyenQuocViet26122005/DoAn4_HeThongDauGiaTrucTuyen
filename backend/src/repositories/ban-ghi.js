const coSoDuLieu = require('./ket-noi');
// Tên bảng là hằng số nội bộ, không nhận trực tiếp từ tham số HTTP.
const cacBang = new Set([
  'nguoi_dung',
  'xac_minh_nguoi_ban',
  'dia_chi_nguoi_dung',
  'danh_muc',
  'thuoc_tinh_danh_muc',
  'san_pham',
  'hinh_anh_san_pham',
  'gia_tri_thuoc_tinh_san_pham',
  'buoc_gia',
  'phien_dau_gia',
  'muc_gia_toi_da',
  'luot_tra_gia',
  'gia_han_phien_dau_gia',
  'yeu_cau_huy_phien',
  'don_hang',
  'thanh_toan',
  'giu_tien_trung_gian',
  'van_chuyen',
  'tranh_chap',
  'bang_chung_tranh_chap',
  'danh_gia',
  'danh_sach_theo_doi',
  'thong_bao',
  'vi_pham',
  'de_nghi_mua_tiep_theo',
  'cau_hinh_he_thong',
  'nhat_ky_hoat_dong',
]);
function bang(ten) {
  if (!cacBang.has(ten)) throw new Error('Unknown repository table');
  return `\`${ten}\``;
}
function cacCot(duLieu) {
  const cacKhoa = Object.keys(duLieu);
  if (!cacKhoa.length || cacKhoa.some((khoa) => !/^[a-z][a-z0-9_]*$/.test(khoa)))
    throw new Error('Invalid repository fields');
  return cacKhoa;
}
async function them(ten, duLieu) {
  const cacKhoa = cacCot(duLieu);
  const ketQua = await coSoDuLieu.truyVan(
    `INSERT INTO ${bang(ten)} (${cacKhoa.map((k) => `\`${k}\``).join(',')}) VALUES (${cacKhoa.map(() => '?').join(',')})`,
    cacKhoa.map((k) => duLieu[k]),
  );
  return String(ketQua.insertId);
}
async function capNhat(ten, id, duLieu) {
  const cacKhoa = cacCot(duLieu);
  return coSoDuLieu.truyVan(
    `UPDATE ${bang(ten)} SET ${cacKhoa.map((k) => `\`${k}\` = ?`).join(',')} WHERE id = ?`,
    [...cacKhoa.map((k) => duLieu[k]), id],
  );
}
const layTheoId = (ten, id, khoaDuLieu = false) =>
  coSoDuLieu.layMot(`SELECT * FROM ${bang(ten)} WHERE id = ?${khoaDuLieu ? ' FOR UPDATE' : ''}`, [
    id,
  ]);
const xoa = (ten, id) => coSoDuLieu.truyVan(`DELETE FROM ${bang(ten)} WHERE id = ?`, [id]);
module.exports = { them, capNhat, layTheoId, xoa };
