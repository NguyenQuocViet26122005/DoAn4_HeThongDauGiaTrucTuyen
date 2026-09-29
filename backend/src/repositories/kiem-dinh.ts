import coSoDuLieu = require('./ket-noi');

const moiNhat = (sanPhamId, khoa = false) =>
  coSoDuLieu.layMot(
    `SELECT * FROM kiem_dinh_san_pham WHERE san_pham_id = ?
     ORDER BY lan_kiem_dinh DESC LIMIT 1${khoa ? ' FOR UPDATE' : ''}`,
    [sanPhamId],
  );

const tepDinhKem = (id) =>
  coSoDuLieu.truyVan('SELECT * FROM tep_dinh_kem WHERE kiem_dinh_san_pham_id = ? ORDER BY id', [
    id,
  ]);

const coGiaoDich = (sanPhamId) =>
  coSoDuLieu.layMot(
    `SELECT a.id FROM phien_dau_gia a WHERE a.san_pham_id = ?
     AND a.trang_thai IN ('DA_LEN_LICH', 'HOAT_DONG', 'DA_KET_THUC') LIMIT 1`,
    [sanPhamId],
  );

const quyenNguoiMua = (id, nguoiDungId) =>
  coSoDuLieu.layMot(
    'SELECT id FROM don_hang WHERE kiem_dinh_san_pham_id = ? AND nguoi_mua_id = ? LIMIT 1',
    [id, nguoiDungId],
  );

function danhSach(
  nguoiDung,
  { limit, offset },
  boLoc: { q?: string; trangThai?: string; sanPhamId?: string } = {},
) {
  const dieuKien: string[] = [];
  const thamSo: unknown[] = [];

  if (nguoiDung.vai_tro !== 'QUAN_TRI') {
    dieuKien.push('s.nguoi_ban_id = ?');
    thamSo.push(nguoiDung.id);
  }
  if (boLoc.q) {
    dieuKien.push('(s.tieu_de LIKE ? OR k.ma_kiem_dinh LIKE ?)');
    thamSo.push(`%${boLoc.q}%`, `%${boLoc.q}%`);
  }
  if (boLoc.trangThai) {
    dieuKien.push('k.trang_thai = ?');
    thamSo.push(boLoc.trangThai);
  }
  if (boLoc.sanPhamId) {
    dieuKien.push('k.san_pham_id = ?');
    thamSo.push(boLoc.sanPhamId);
  }

  return coSoDuLieu.truyVan(
    `SELECT k.*, s.tieu_de FROM kiem_dinh_san_pham k JOIN san_pham s ON s.id = k.san_pham_id
     ${dieuKien.length ? `WHERE ${dieuKien.join(' AND ')}` : ''}
     ORDER BY k.id DESC LIMIT ${limit} OFFSET ${offset}`,
    thamSo,
  );
}

export { moiNhat, tepDinhKem, coGiaoDich, quyenNguoiMua, danhSach };
