import coSoDuLieu = require('./ket-noi');
import khoBanGhi = require('./ban-ghi');
import cacDonHang = require('./don-hang');

async function khoaTranhChap(id) {
  const banDau = await khoBanGhi.layTheoId('tranh_chap', id);

  if (!banDau) {
    return null;
  }

  const donHang = await cacDonHang.khoaDuLieu(banDau.don_hang_id);

  return { dispute: await khoBanGhi.layTheoId('tranh_chap', id, true), order: donHang };
}

const bangChung = (id) =>
  coSoDuLieu.truyVan(
    `SELECT id, tranh_chap_id, nguoi_tai_len_id, duong_dan_tep,
            loai_noi_dung AS loai_bang_chung, mo_ta, ngay_tao
     FROM tep_dinh_kem
     WHERE loai_tep = 'BANG_CHUNG_TRANH_CHAP' AND tranh_chap_id = ?
     ORDER BY id`,
    [id],
  );
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
  coSoDuLieu.layMot(
    'SELECT id, so_sao, nhan_xet, ngay_tao FROM danh_gia WHERE don_hang_id=? AND nguoi_danh_gia_id=?',
    [donHangId, nguoiDungId],
  );
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
    // la_nguoi_ban: người nhận là chủ phiên/đơn trong liên kết, để giao diện mở đúng khu người bán.
    `SELECT t.*,
       CASE
         WHEN t.duong_dan_lien_ket REGEXP '^/auctions/[0-9]+$' THEN EXISTS(
           SELECT 1 FROM phien_dau_gia p JOIN san_pham s ON s.id=p.san_pham_id
           WHERE p.id=CAST(SUBSTRING(t.duong_dan_lien_ket,11) AS UNSIGNED) AND s.nguoi_ban_id=t.nguoi_dung_id)
         WHEN t.duong_dan_lien_ket REGEXP '^/orders/[0-9]+$' THEN EXISTS(
           SELECT 1 FROM don_hang d
           WHERE d.id=CAST(SUBSTRING(t.duong_dan_lien_ket,9) AS UNSIGNED) AND d.nguoi_ban_id=t.nguoi_dung_id)
         ELSE 0
       END AS la_nguoi_ban
     FROM thong_bao t WHERE t.nguoi_dung_id=? ${chuaDoc ? 'AND t.da_doc=0' : ''} ORDER BY t.id DESC LIMIT ${gioiHan} OFFSET ${viTriBatDau}`,
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

function cacViPham(nguoiDungId, { limit: gioiHan, offset: viTriBatDau }, quanTri = false) {
  if (quanTri) {
    return coSoDuLieu.truyVan(
      `SELECT v.*,p.tieu_de AS tieu_de_san_pham
       FROM vi_pham v
       LEFT JOIN phien_dau_gia a ON a.id=v.phien_dau_gia_id
       LEFT JOIN san_pham p ON p.id=a.san_pham_id
       ${nguoiDungId ? 'WHERE v.nguoi_dung_id=?' : ''}
       ORDER BY v.id DESC LIMIT ${gioiHan} OFFSET ${viTriBatDau}`,
      nguoiDungId ? [nguoiDungId] : [],
    );
  }

  return coSoDuLieu.truyVan(
    `SELECT v.id,v.nguoi_dung_id,v.phien_dau_gia_id,v.don_hang_id,v.loai_vi_pham,
            v.mo_ta,v.diem_vi_pham,v.trang_thai,v.ngay_xac_nhan,v.hinh_thuc_xu_ly,
            v.ly_do_xu_ly,v.ngay_xu_ly,v.ngay_tao,p.tieu_de AS tieu_de_san_pham
     FROM vi_pham v
     LEFT JOIN phien_dau_gia a ON a.id=v.phien_dau_gia_id
     LEFT JOIN san_pham p ON p.id=a.san_pham_id
     WHERE v.nguoi_dung_id=? ORDER BY v.id DESC LIMIT ${gioiHan} OFFSET ${viTriBatDau}`,
    [nguoiDungId],
  );
}

// Xét theo món hàng gốc để hồ sơ đăng lại không mở thêm lượt báo cáo.
const daBaoCaoSanPham = (nguoiDungId, sanPhamId) =>
  coSoDuLieu.layMot(
    `SELECT v.id FROM vi_pham v
     JOIN phien_dau_gia a ON a.id=v.phien_dau_gia_id
     JOIN san_pham s ON s.id=a.san_pham_id
     JOIN san_pham p ON p.id=?
     WHERE v.nguoi_tao_id=? AND COALESCE(s.san_pham_goc_id,s.id)=COALESCE(p.san_pham_goc_id,p.id)
       AND v.mo_ta LIKE '[BAO CAO SAN PHAM]%'
     LIMIT 1`,
    [sanPhamId, nguoiDungId],
  );
const baoCaoSanPhamCuaNguoiDung = (nguoiDungId, { limit: gioiHan, offset: viTriBatDau }) =>
  coSoDuLieu.truyVan(
    `SELECT v.id,v.phien_dau_gia_id,v.loai_vi_pham,v.mo_ta,v.trang_thai,
            v.hinh_thuc_xu_ly,v.ly_do_xu_ly,v.ngay_tao,v.ngay_xu_ly,p.tieu_de AS tieu_de_san_pham
     FROM vi_pham v
     JOIN phien_dau_gia a ON a.id=v.phien_dau_gia_id
     JOIN san_pham p ON p.id=a.san_pham_id
     WHERE v.nguoi_tao_id=? AND v.mo_ta LIKE '[BAO CAO SAN PHAM]%'
     ORDER BY v.id DESC LIMIT ${gioiHan} OFFSET ${viTriBatDau}`,
    [nguoiDungId],
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
      `SELECT trang_thai_giu_tien AS trang_thai,
              COALESCE(SUM(so_tien_da_thu), 0) AS tong_tien,
              COALESCE(SUM(so_tien_dang_giu), 0) AS dang_giu
       FROM don_hang
       GROUP BY trang_thai_giu_tien`,
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

export {
  khoaTranhChap,
  bangChung,
  cacTranhChap,
  danhGiaCuaDon,
  cacDanhGia,
  danhSachThongBao,
  demChuaDoc,
  danhDauDaDoc,
  cacViPham,
  daBaoCaoSanPham,
  baoCaoSanPhamCuaNguoiDung,
  diemViPham,
  nhatKy,
  thongKe,
};
