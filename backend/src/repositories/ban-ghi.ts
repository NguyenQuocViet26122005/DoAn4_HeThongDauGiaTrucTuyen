import type { ResultSetHeader } from 'mysql2/promise';
import type { DuLieuGhi, DinhDanh, BanGhiSQL } from '../types/nghiep-vu';
import coSoDuLieu = require('./ket-noi');
// Tên bảng là hằng số nội bộ, không nhận trực tiếp từ tham số HTTP.
const cacBang = new Set([
  'nguoi_dung',
  'xac_minh_nguoi_ban',
  'dia_chi_nguoi_dung',
  'danh_muc',
  'san_pham',
  'tep_dinh_kem',
  'phien_dau_gia',
  'tham_gia_phien',
  'luot_tra_gia',
  'yeu_cau_xu_ly',
  'don_hang',
  'thanh_toan',
  'tranh_chap',
  'danh_gia',
  'thong_bao',
  'vi_pham',
  'de_nghi_mua_tiep_theo',
  'cau_hinh_he_thong',
  'nhat_ky_hoat_dong',
]);

function bang(ten: string) {
  if (!cacBang.has(ten)) {
    throw new Error('Unknown repository table');
  }

  return `\`${ten}\``;
}

function cacCot(duLieu: DuLieuGhi) {
  const cacKhoa = Object.keys(duLieu);

  if (!cacKhoa.length || cacKhoa.some((khoa) => !/^[a-z][a-z0-9_]*$/.test(khoa))) {
    throw new Error('Invalid repository fields');
  }

  return cacKhoa;
}

async function them(ten: string, duLieu: DuLieuGhi) {
  const cacKhoa = cacCot(duLieu);
  const ketQua = await coSoDuLieu.truyVan<ResultSetHeader>(
    `INSERT INTO ${bang(ten)} (${cacKhoa.map((k) => `\`${k}\``).join(',')}) VALUES (${cacKhoa.map(() => '?').join(',')})`,
    cacKhoa.map((k) => duLieu[k]),
  );

  return String(ketQua.insertId);
}

async function capNhat(ten: string, id: DinhDanh, duLieu: DuLieuGhi) {
  const cacKhoa = cacCot(duLieu);

  return coSoDuLieu.truyVan(
    `UPDATE ${bang(ten)} SET ${cacKhoa.map((k) => `\`${k}\` = ?`).join(',')} WHERE id = ?`,
    [...cacKhoa.map((k) => duLieu[k]), id],
  );
}

const layTheoId = <T = BanGhiSQL>(ten: string, id: DinhDanh, khoaDuLieu = false) =>
  coSoDuLieu.layMot<T>(
    `SELECT * FROM ${bang(ten)} WHERE id = ?${khoaDuLieu ? ' FOR UPDATE' : ''}`,
    [id],
  );
const xoa = (ten: string, id: DinhDanh) =>
  coSoDuLieu.truyVan(`DELETE FROM ${bang(ten)} WHERE id = ?`, [id]);
export {
  them,
  capNhat,
  layTheoId,
  xoa,
};
