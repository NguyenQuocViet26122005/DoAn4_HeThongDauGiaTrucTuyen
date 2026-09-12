const db = require('./db');
// Table names are internal constants, never supplied by HTTP parameters.
const tables = new Set(['nguoi_dung','xac_minh_nguoi_ban','dia_chi_nguoi_dung','danh_muc','thuoc_tinh_danh_muc','san_pham','hinh_anh_san_pham','gia_tri_thuoc_tinh_san_pham','buoc_gia','phien_dau_gia','muc_gia_toi_da','luot_tra_gia','gia_han_phien_dau_gia','yeu_cau_huy_phien','don_hang','thanh_toan','giu_tien_trung_gian','van_chuyen','tranh_chap','bang_chung_tranh_chap','danh_gia','danh_sach_theo_doi','thong_bao','vi_pham','de_nghi_mua_tiep_theo','cau_hinh_he_thong','nhat_ky_hoat_dong']);
function table(name) { if (!tables.has(name)) throw new Error('Unknown repository table'); return `\`${name}\``; }
function columns(data) {
  const keys = Object.keys(data);
  if (!keys.length || keys.some(key => !/^[a-z][a-z0-9_]*$/.test(key))) throw new Error('Invalid repository fields');
  return keys;
}
async function insert(name, data) {
  const keys = columns(data);
  const result = await db.query(`INSERT INTO ${table(name)} (${keys.map(k => `\`${k}\``).join(',')}) VALUES (${keys.map(() => '?').join(',')})`, keys.map(k => data[k]));
  return String(result.insertId);
}
async function update(name, id, data) {
  const keys = columns(data);
  return db.query(`UPDATE ${table(name)} SET ${keys.map(k => `\`${k}\` = ?`).join(',')} WHERE id = ?`, [...keys.map(k => data[k]), id]);
}
const get = (name, id, lock = false) => db.one(`SELECT * FROM ${table(name)} WHERE id = ?${lock ? ' FOR UPDATE' : ''}`, [id]);
const remove = (name, id) => db.query(`DELETE FROM ${table(name)} WHERE id = ?`, [id]);
module.exports = { insert, update, get, remove };
