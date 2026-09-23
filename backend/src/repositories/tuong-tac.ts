import coSoDuLieu = require('./ket-noi');
import khoBanGhi = require('./ban-ghi');
import cacDonHang = require('./don-hang');
async function khoaTranhChap(id) {
  const banDau = await khoBanGhi.layTheoId('tranh_chap', id);
  if (!banDau) return null;
  const donHang = await cacDonHang.khoaDuLieu(banDau.don_hang_id);
  return { dispute: await khoBanGhi.layTheoId('tranh_chap', id, true), order: donHang };
}
const bangChung = (id) =>
  coSoDuLieu.truyVan(`SELECT id,tranh_chap_id,nguoi_tai_len_id,duong_dan_tep,loai_noi_dung AS loai_bang_chung,mo_ta,ngay_tao FROM tep_dinh_kem WHERE loai_tep='BANG_CHUNG_TRANH_CHAP' AND tranh_chap_id=? ORDER BY id`, [id]);
const cacTranhChap = (nguoiDung, { limit: gioiHan, offset: viTriBatDau }, quanTri = false) =>
  coSoDuLieu.truyVan(
    `SELECT t.* FROM tranh_chap t
     JOIN don_hang d ON d.id=t.don_hang_id
     ${quanTri ? '' : 'WHERE d.nguoi_mua_id=? OR d.nguoi_ban_id=?'}
     ORDER BY t.id DESC
     LIMIT ${gioiHan} OFFSET ${viTriBatDau}`,
    quanTri ? [] : [nguoiDung.id, nguoiDung.id],
  );
const danhGiaCuaDon = (donHangId, nguoiDungId) =>
  coSoDuLieu.layMot('SELECT id FROM danh_gia WHERE don_hang_id=? AND nguoi_danh_gia_id=?', [
    donHangId,
    nguoiDungId,
  ]);
const cacDanhGia = (nguoiDungId, { limit: gioiHan, offset: viTriBatDau }) =>
  coSoDuLieu.truyVan(
    `SELECT d.id, d.don_hang_id, d.nguoi_danh_gia_id, d.nguoi_duoc_danh_gia_id,
            d.so_sao, d.nhan_xet, d.ngay_tao, n.ho_ten AS ten_nguoi_danh_gia
     FROM danh_gia d
     JOIN nguoi_dung n ON n.id=d.nguoi_danh_gia_id
     WHERE d.nguoi_duoc_danh_gia_id=?
     ORDER BY d.id DESC
     LIMIT ${gioiHan} OFFSET ${viTriBatDau}`,
    [nguoiDungId],
  );
const danhSachThongBao = (nguoiDungId, { limit: gioiHan, offset: viTriBatDau }, chuaDoc = false) =>
  coSoDuLieu.truyVan(
    `SELECT * FROM thong_bao WHERE nguoi_dung_id=? ${chuaDoc ? 'AND da_doc=0' : ''} ORDER BY id DESC LIMIT ${gioiHan} OFFSET ${viTriBatDau}`,
    [nguoiDungId],
  );
const demChuaDoc = (nguoiDungId) =>
  coSoDuLieu.layMot(
    'SELECT COUNT(*) AS chua_doc FROM thong_bao WHERE nguoi_dung_id=? AND da_doc=0',
    [nguoiDungId],
  );
const danhDauDaDoc = (nguoiDungId, id) =>
  coSoDuLieu.truyVan(
    `UPDATE thong_bao SET da_doc=1,ngay_doc=COALESCE(ngay_doc,NOW()) WHERE nguoi_dung_id=?${id ? ' AND id=?' : ''}`,
    id ? [nguoiDungId, id] : [nguoiDungId],
  );
const cacViPham = (nguoiDungId, { limit: gioiHan, offset: viTriBatDau }) =>
  coSoDuLieu.truyVan(
    `SELECT * FROM vi_pham ${nguoiDungId ? 'WHERE nguoi_dung_id=?' : ''} ORDER BY id DESC LIMIT ${gioiHan} OFFSET ${viTriBatDau}`,
    nguoiDungId ? [nguoiDungId] : [],
  );
const diemViPham = (nguoiDungId) =>
  coSoDuLieu.layMot(
    "SELECT COALESCE(SUM(diem_vi_pham),0) AS diem FROM vi_pham WHERE nguoi_dung_id=? AND trang_thai='DA_XAC_NHAN'",
    [nguoiDungId],
  );
const nhatKy = ({ limit: gioiHan, offset: viTriBatDau }) =>
  coSoDuLieu.truyVan(
    `SELECT id,nguoi_thuc_hien_id,hanh_dong,loai_doi_tuong,doi_tuong_id,ngay_tao FROM nhat_ky_hoat_dong ORDER BY id DESC LIMIT ${gioiHan} OFFSET ${viTriBatDau}`,
  );
async function thongKe() {
  const [
    cacNguoiDung,
    cacSanPham,
    cacPhienDauGia,
    cacDonHang,
    cacThanhToan,
    tienTrungGian,
    cacTranhChap,
  ] = await Promise.all([
    coSoDuLieu.truyVan(
      'SELECT vai_tro,trang_thai_tai_khoan,COUNT(*) AS so_luong FROM nguoi_dung GROUP BY vai_tro,trang_thai_tai_khoan',
    ),
    coSoDuLieu.truyVan(
      'SELECT trang_thai_duyet,COUNT(*) AS so_luong FROM san_pham GROUP BY trang_thai_duyet',
    ),
    coSoDuLieu.truyVan(
      'SELECT trang_thai,COUNT(*) AS so_luong FROM phien_dau_gia GROUP BY trang_thai',
    ),
    coSoDuLieu.truyVan(
      'SELECT trang_thai,COUNT(*) AS so_luong,COALESCE(SUM(tong_tien),0) AS tong_gia_tri FROM don_hang GROUP BY trang_thai',
    ),
    coSoDuLieu.truyVan(
      'SELECT trang_thai,COUNT(*) AS so_luong,COALESCE(SUM(so_tien),0) AS tong_tien FROM thanh_toan GROUP BY trang_thai',
    ),
    coSoDuLieu.truyVan(
      'SELECT trang_thai_giu_tien AS trang_thai,COALESCE(SUM(so_tien_da_thu),0) AS tong_tien,COALESCE(SUM(so_tien_dang_giu),0) AS dang_giu FROM don_hang GROUP BY trang_thai_giu_tien',
    ),
    coSoDuLieu.truyVan(
      'SELECT trang_thai,COUNT(*) AS so_luong FROM tranh_chap GROUP BY trang_thai',
    ),
  ]);
  return {
    nguoi_dung: cacNguoiDung,
    san_pham: cacSanPham,
    phien_dau_gia: cacPhienDauGia,
    don_hang: cacDonHang,
    thanh_toan_mo_phong: cacThanhToan,
    giu_tien: tienTrungGian,
    tranh_chap: cacTranhChap,
  };
}
export = {
  khoaTranhChap,
  bangChung,
  cacTranhChap,
  danhGiaCuaDon,
  cacDanhGia,
  danhSachThongBao,
  demChuaDoc,
  danhDauDaDoc,
  cacViPham,
  diemViPham,
  nhatKy,
  thongKe,
};
