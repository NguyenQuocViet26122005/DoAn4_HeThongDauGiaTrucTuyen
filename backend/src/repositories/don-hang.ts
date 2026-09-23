import type { NguoiDungDangNhap } from '../types/nghiep-vu';
import coSoDuLieu = require('./ket-noi');
import khoBanGhi = require('./ban-ghi');
import cacPhienDauGia = require('./dau-gia');
async function khoaDuLieu(id) {
  const banDau = await khoBanGhi.layTheoId('don_hang', id);
  if (!banDau) return null;
  await cacPhienDauGia.layTheoId(banDau.phien_dau_gia_id, true);
  return khoBanGhi.layTheoId('don_hang', id, true);
}
const donDangXuLyCuaPhien = (id) =>
  coSoDuLieu.layMot(
    "SELECT * FROM don_hang WHERE phien_dau_gia_id=? AND trang_thai<>'DA_HUY' ORDER BY id DESC LIMIT 1",
    [id],
  );
const donHangCuaPhien = (id) =>
  coSoDuLieu.truyVan('SELECT * FROM don_hang WHERE phien_dau_gia_id=? ORDER BY id', [id]);
const cacThanhToan = (id) =>
  coSoDuLieu.truyVan('SELECT * FROM thanh_toan WHERE don_hang_id=? ORDER BY id DESC', [id]);
const tienTrungGian = (id, khoaDuLieu = false) =>
  coSoDuLieu.layMot(
    `SELECT id,id AS don_hang_id,so_tien_da_thu AS so_tien,trang_thai_giu_tien AS trang_thai,so_tien_da_hoan,so_tien_da_giai_ngan,so_tien_dang_giu,ngay_bat_dau_giu,ngay_giai_ngan,ngay_hoan_tien,ghi_chu_giu_tien AS ghi_chu FROM don_hang WHERE id=?${khoaDuLieu ? ' FOR UPDATE' : ''}`,
    [id],
  );
const vanChuyen = (id) => coSoDuLieu.layMot('SELECT id,id AS don_hang_id,don_vi_van_chuyen,ma_van_don,trang_thai_van_chuyen AS trang_thai,ngay_gui_hang,ngay_giao_van_chuyen AS ngay_giao_hang FROM don_hang WHERE id=? AND trang_thai_van_chuyen IS NOT NULL', [id]);
const cacTranhChap = (id) =>
  coSoDuLieu.truyVan('SELECT * FROM tranh_chap WHERE don_hang_id=? ORDER BY id DESC', [id]);
const tranhChapDangMo = (id) =>
  coSoDuLieu.layMot(
    "SELECT id FROM tranh_chap WHERE don_hang_id=? AND trang_thai IN ('DANG_MO','NGUOI_BAN_DA_PHAN_HOI','QUAN_TRI_DANG_XU_LY') LIMIT 1",
    [id],
  );
function danhSach(nguoiDung: NguoiDungDangNhap, { limit: gioiHan, offset: viTriBatDau }, phamVi = 'mine') {
  const dieuKien = phamVi === 'admin' ? '1=1' : '(d.nguoi_mua_id=? OR d.nguoi_ban_id=?)';
  return coSoDuLieu.truyVan(
    `SELECT d.*, p.tieu_de, a.ly_do_ket_thuc
     FROM don_hang d
     JOIN phien_dau_gia a ON a.id=d.phien_dau_gia_id
     JOIN san_pham p ON p.id=a.san_pham_id
     WHERE ${dieuKien}
     ORDER BY d.id DESC
     LIMIT ${gioiHan} OFFSET ${viTriBatDau}`,
    phamVi === 'admin' ? [] : [nguoiDung.id, nguoiDung.id],
  );
}
const denHan = () =>
  coSoDuLieu.truyVan(
    `SELECT d.id FROM don_hang d
     WHERE (d.trang_thai='CHO_THANH_TOAN' AND d.han_thanh_toan<=NOW())
        OR (d.trang_thai IN ('DA_GIAO','DANG_KIEM_TRA') AND d.han_kiem_tra<=NOW() AND d.can_admin_xu_ly=0)
        OR (d.trang_thai IN ('DA_THANH_TOAN','CHO_GUI_HANG')
            AND d.han_nguoi_ban_gui_hang<=NOW()
            AND NOT EXISTS (
              SELECT 1 FROM vi_pham v
              WHERE v.don_hang_id=d.id AND v.loai_vi_pham='GIAO_HANG_MUON'
            ))
     ORDER BY d.id LIMIT 100`,
  );
const canNhacNho = () =>
  coSoDuLieu.truyVan(
    "SELECT id FROM don_hang WHERE trang_thai='CHO_THANH_TOAN' AND han_thanh_toan>NOW() AND han_thanh_toan<=DATE_ADD(NOW(),INTERVAL 6 HOUR) ORDER BY id LIMIT 100",
  );
const viPhamCuaDon = (id, loai) =>
  coSoDuLieu.layMot('SELECT id FROM vi_pham WHERE don_hang_id=? AND loai_vi_pham=? LIMIT 1', [
    id,
    loai,
  ]);
const danhDauThanhToanHetHan = (id) =>
  coSoDuLieu.truyVan(
    "UPDATE thanh_toan SET trang_thai='HET_HAN' WHERE don_hang_id=? AND trang_thai='CHO_XU_LY'",
    [id],
  );
const hoanCacThanhToan = (id) =>
  coSoDuLieu.truyVan(
    "UPDATE thanh_toan SET trang_thai='DA_HOAN_TIEN' WHERE don_hang_id=? AND trang_thai='DA_THANH_TOAN'",
    [id],
  );
// Chỉ lấy lượt trả giá CÔNG KHAI cuối của từng người; không đọc bảng mức tối đa.
const ungVienTiepTheo = (id) =>
  coSoDuLieu.truyVan(
    `SELECT b.nguoi_tra_gia_id, b.so_tien, b.ngay_tao, b.id
     FROM luot_tra_gia b
     JOIN nguoi_dung u ON u.id=b.nguoi_tra_gia_id
     JOIN phien_dau_gia a ON a.id=b.phien_dau_gia_id
     JOIN san_pham p ON p.id=a.san_pham_id
     WHERE b.phien_dau_gia_id=? AND b.so_tien>0
       AND b.ngay_tao>=a.thoi_gian_bat_dau AND b.ngay_tao<=a.thoi_gian_ket_thuc
       AND u.vai_tro='NGUOI_DUNG' AND u.trang_thai_tai_khoan='HOAT_DONG'
       AND u.id<>p.nguoi_ban_id
       AND NOT EXISTS (
         SELECT 1 FROM luot_tra_gia moi
         WHERE moi.phien_dau_gia_id=b.phien_dau_gia_id
           AND moi.nguoi_tra_gia_id=b.nguoi_tra_gia_id AND moi.so_tien>0
           AND moi.ngay_tao>=a.thoi_gian_bat_dau AND moi.ngay_tao<=a.thoi_gian_ket_thuc
           AND (moi.ngay_tao>b.ngay_tao OR (moi.ngay_tao=b.ngay_tao AND moi.id>b.id))
       )
       AND NOT EXISTS (
         SELECT 1 FROM don_hang d
         WHERE d.phien_dau_gia_id=b.phien_dau_gia_id AND d.nguoi_mua_id=b.nguoi_tra_gia_id
       )
       AND NOT EXISTS (
         SELECT 1 FROM de_nghi_mua_tiep_theo o
         WHERE o.phien_dau_gia_id=b.phien_dau_gia_id AND o.nguoi_tra_gia_id=b.nguoi_tra_gia_id
       )
     ORDER BY b.so_tien DESC,b.ngay_tao,b.id`,
    [id],
  );
const deNghiDangCho = (id) =>
  coSoDuLieu.layMot(
    "SELECT * FROM de_nghi_mua_tiep_theo WHERE phien_dau_gia_id=? AND trang_thai='CHO_XU_LY' LIMIT 1",
    [id],
  );
const cacDeNghi = (nguoiDung, { limit: gioiHan, offset: viTriBatDau }) =>
  coSoDuLieu.truyVan(
    `SELECT o.* FROM de_nghi_mua_tiep_theo o
     JOIN phien_dau_gia a ON a.id=o.phien_dau_gia_id
     JOIN san_pham p ON p.id=a.san_pham_id
     WHERE o.nguoi_tra_gia_id=? OR p.nguoi_ban_id=?
     ORDER BY o.id DESC
     LIMIT ${gioiHan} OFFSET ${viTriBatDau}`,
    [nguoiDung.id, nguoiDung.id],
  );
const deNghiDenHan = () =>
  coSoDuLieu.truyVan(
    "SELECT id FROM de_nghi_mua_tiep_theo WHERE trang_thai='CHO_XU_LY' AND het_han_luc<=NOW() ORDER BY id LIMIT 100",
  );
const giaCongKhaiCuoi = (phienDauGiaId, nguoiDungId) =>
  coSoDuLieu.layMot(
    `SELECT b.so_tien,b.id,b.ngay_tao
     FROM luot_tra_gia b JOIN phien_dau_gia a ON a.id=b.phien_dau_gia_id
     WHERE b.phien_dau_gia_id=? AND b.nguoi_tra_gia_id=? AND b.so_tien>0
       AND b.ngay_tao>=a.thoi_gian_bat_dau AND b.ngay_tao<=a.thoi_gian_ket_thuc
     ORDER BY b.ngay_tao DESC,b.id DESC LIMIT 1`,
    [phienDauGiaId, nguoiDungId],
  );
export = {
  khoaDuLieu,
  donDangXuLyCuaPhien,
  donHangCuaPhien,
  cacThanhToan,
  tienTrungGian,
  vanChuyen,
  cacTranhChap,
  tranhChapDangMo,
  danhSach,
  denHan,
  canNhacNho,
  viPhamCuaDon,
  danhDauThanhToanHetHan,
  hoanCacThanhToan,
  ungVienTiepTheo,
  deNghiDangCho,
  cacDeNghi,
  deNghiDenHan,
  giaCongKhaiCuoi,
};
