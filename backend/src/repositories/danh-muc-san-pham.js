const coSoDuLieu = require('./ket-noi');
const khoBanGhi = require('./ban-ghi');
const danhSachDanhMuc = (tatCa = false) =>
  coSoDuLieu.truyVan(
    `SELECT * FROM danh_muc ${tatCa ? '' : 'WHERE dang_hoat_dong = 1'} ORDER BY thu_tu,id`,
  );
const danhSachThuocTinh = (id) =>
  coSoDuLieu.truyVan('SELECT * FROM thuoc_tinh_danh_muc WHERE danh_muc_id = ? ORDER BY thu_tu,id', [
    id,
  ]);
const danhSachAnh = (id) =>
  coSoDuLieu.truyVan(
    'SELECT * FROM hinh_anh_san_pham WHERE san_pham_id = ? ORDER BY la_anh_chinh DESC,thu_tu,id',
    [id],
  );
const cacGiaTri = (id) =>
  coSoDuLieu.truyVan(
    `SELECT g.*, t.ten_thuoc_tinh, t.khoa_thuoc_tinh, t.don_vi
     FROM gia_tri_thuoc_tinh_san_pham g
     JOIN thuoc_tinh_danh_muc t ON t.id=g.thuoc_tinh_id
     WHERE g.san_pham_id=?
     ORDER BY t.thu_tu,t.id`,
    [id],
  );
async function thayGiaTriThuocTinh(id, cacMuc) {
  await coSoDuLieu.truyVan('DELETE FROM gia_tri_thuoc_tinh_san_pham WHERE san_pham_id = ?', [id]);
  for (const muc of cacMuc)
    await khoBanGhi.them('gia_tri_thuoc_tinh_san_pham', { san_pham_id: id, ...muc });
}
const sanPhamDaCoPhien = (id) =>
  coSoDuLieu.layMot(`SELECT id FROM phien_dau_gia WHERE san_pham_id = ? LIMIT 1`, [id]);
const danhSachSanPham = (
  { limit: gioiHan, offset: viTriBatDau },
  { sellerId: nguoiBanId, status: trangThai, categoryId: danhMucId, search: timKiem = '' },
) => {
  const dieuKienLoc = ['p.tieu_de LIKE ?'];
  const thamSo = [`%${timKiem}%`];
  if (nguoiBanId) {
    dieuKienLoc.push('p.nguoi_ban_id = ?');
    thamSo.push(nguoiBanId);
  }
  if (trangThai) {
    dieuKienLoc.push('p.trang_thai_duyet = ?');
    thamSo.push(trangThai);
  }
  if (danhMucId) {
    dieuKienLoc.push('p.danh_muc_id = ?');
    thamSo.push(danhMucId);
  }
  return coSoDuLieu.truyVan(
    `SELECT p.id, p.nguoi_ban_id, p.danh_muc_id, p.tieu_de, p.duong_dan,
            p.tinh_trang_san_pham, p.thuong_hieu, p.trang_thai_duyet, p.ngay_tao,
            (SELECT h.duong_dan_anh FROM hinh_anh_san_pham h
             WHERE h.san_pham_id=p.id
             ORDER BY h.la_anh_chinh DESC,h.thu_tu,h.id LIMIT 1) AS anh_chinh
     FROM san_pham p
     WHERE ${dieuKienLoc.join(' AND ')}
     ORDER BY p.id DESC
     LIMIT ${gioiHan} OFFSET ${viTriBatDau}`,
    thamSo,
  );
};
const boAnhChinh = (id) =>
  coSoDuLieu.truyVan('UPDATE hinh_anh_san_pham SET la_anh_chinh = 0 WHERE san_pham_id = ?', [id]);
const thuocTinhDaDung = (id) =>
  coSoDuLieu.layMot('SELECT id FROM gia_tri_thuoc_tinh_san_pham WHERE thuoc_tinh_id = ? LIMIT 1', [
    id,
  ]);
module.exports = {
  danhSachDanhMuc,
  danhSachThuocTinh,
  danhSachAnh,
  cacGiaTri,
  thayGiaTriThuocTinh,
  sanPhamDaCoPhien,
  danhSachSanPham,
  boAnhChinh,
  thuocTinhDaDung,
};
