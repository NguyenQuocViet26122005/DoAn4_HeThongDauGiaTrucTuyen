import type { BoLocDanhSach, PhanTrang, PhienDauGia, MucCamKet } from '../types/nghiep-vu';
import coSoDuLieu = require('./ket-noi');
const layTheoId = (id, khoaDuLieu = false) =>
  coSoDuLieu.layMot<PhienDauGia>(
    `SELECT a.*, p.nguoi_ban_id, p.tieu_de, p.duong_dan, p.danh_muc_id, p.trang_thai_duyet
     FROM phien_dau_gia a
     JOIN san_pham p ON p.id=a.san_pham_id
     WHERE a.id=?${khoaDuLieu ? ' FOR UPDATE' : ''}`,
    [id],
  );
const cacMucToiDa = (id) =>
  coSoDuLieu.truyVan<MucCamKet[]>(
    `SELECT id,phien_dau_gia_id,nguoi_dung_id AS nguoi_tra_gia_id,gia_toi_da,thoi_gian_dat_gia_toi_da
     FROM tham_gia_phien WHERE phien_dau_gia_id=? AND gia_toi_da IS NOT NULL
     ORDER BY gia_toi_da DESC,thoi_gian_dat_gia_toi_da,id`,
    [id],
  );
const lichSu = (id, { limit: gioiHan, offset: viTriBatDau }) =>
  coSoDuLieu.truyVan(
    `SELECT id, phien_dau_gia_id, CONCAT('ND-',nguoi_tra_gia_id) AS nguoi_tra_gia,
            so_tien, loai_tra_gia, ngay_tao
     FROM luot_tra_gia
     WHERE phien_dau_gia_id=?
     ORDER BY ngay_tao DESC,id DESC
     LIMIT ${gioiHan} OFFSET ${viTriBatDau}`,
    [id],
  );
const nguoiThamGia = (id) =>
  coSoDuLieu.truyVan(
    'SELECT nguoi_dung_id AS nguoi_tra_gia_id FROM tham_gia_phien WHERE phien_dau_gia_id=? AND gia_toi_da IS NOT NULL',
    [id],
  );
const nguoiTheoDoi = (id) =>
  coSoDuLieu.truyVan('SELECT nguoi_dung_id FROM tham_gia_phien WHERE phien_dau_gia_id=? AND dang_theo_doi=1', [id]);
const phienDaCoCuaSanPham = (id) =>
  coSoDuLieu.layMot(
    `SELECT id FROM phien_dau_gia WHERE san_pham_id=? AND trang_thai IN ('DA_LEN_LICH','HOAT_DONG','DA_KET_THUC') LIMIT 1`,
    [id],
  );
const yeuCauHuyDangCho = (id) =>
  coSoDuLieu.layMot(
    "SELECT id FROM yeu_cau_xu_ly WHERE loai_yeu_cau='HUY_PHIEN' AND phien_dau_gia_id=? AND trang_thai IN ('CHO_XU_LY','DANG_XU_LY') LIMIT 1",
    [id],
  );
function danhSach({ limit: gioiHan, offset: viTriBatDau }: PhanTrang, boLoc: BoLocDanhSach = {}) {
  const dieuKienLoc = ['p.trang_thai_duyet = ?'];
  const thamSo: unknown[] = ['DA_DUYET'];
  if (boLoc.status) {
    dieuKienLoc.push('a.trang_thai=?');
    thamSo.push(boLoc.status);
  }
  if (boLoc.sellerId) {
    dieuKienLoc.push('p.nguoi_ban_id=?');
    thamSo.push(boLoc.sellerId);
  }
  if (boLoc.categoryId) {
    dieuKienLoc.push('p.danh_muc_id=?');
    thamSo.push(boLoc.categoryId);
  }
  if (boLoc.search) {
    dieuKienLoc.push('p.tieu_de LIKE ?');
    thamSo.push(`%${boLoc.search}%`);
  }
  if (boLoc.watcherId) {
    dieuKienLoc.push(
      'EXISTS (SELECT 1 FROM tham_gia_phien w WHERE w.phien_dau_gia_id=a.id AND w.nguoi_dung_id=? AND w.dang_theo_doi=1)',
    );
    thamSo.push(boLoc.watcherId);
  }
  if (boLoc.bidderId) {
    dieuKienLoc.push(
      'EXISTS (SELECT 1 FROM tham_gia_phien m WHERE m.phien_dau_gia_id=a.id AND m.nguoi_dung_id=? AND m.gia_toi_da IS NOT NULL)',
    );
    thamSo.push(boLoc.bidderId);
  }
  return coSoDuLieu.truyVan(
    `SELECT a.*, p.tieu_de, p.duong_dan, p.nguoi_ban_id, c.ten AS ten_danh_muc,
            (SELECT h.duong_dan_tep FROM tep_dinh_kem h
             WHERE h.loai_tep='ANH_SAN_PHAM' AND h.san_pham_id=p.id
             ORDER BY h.la_anh_chinh DESC,h.thu_tu,h.id LIMIT 1) AS anh_chinh
     FROM phien_dau_gia a
     JOIN san_pham p ON p.id=a.san_pham_id
     JOIN danh_muc c ON c.id=p.danh_muc_id
     WHERE ${dieuKienLoc.join(' AND ')}
     ORDER BY a.id DESC
     LIMIT ${gioiHan} OFFSET ${viTriBatDau}`,
    thamSo,
  );
}
const theoDoi = (nguoiDungId, id) =>
  coSoDuLieu.truyVan(
    `INSERT INTO tham_gia_phien (nguoi_dung_id,phien_dau_gia_id,dang_theo_doi,ngay_theo_doi) VALUES (?,?,1,NOW())
     ON DUPLICATE KEY UPDATE ngay_theo_doi=IF(dang_theo_doi=0,NOW(),ngay_theo_doi),dang_theo_doi=1`,
    [nguoiDungId, id],
  );
const boTheoDoi = (nguoiDungId, id) =>
  coSoDuLieu.truyVan(
    'UPDATE tham_gia_phien SET dang_theo_doi=0,ngay_theo_doi=NULL WHERE nguoi_dung_id=? AND phien_dau_gia_id=?',
    [nguoiDungId, id],
  );
const denHan = () =>
  coSoDuLieu.truyVan(
    `SELECT id FROM phien_dau_gia
     WHERE (trang_thai='DA_LEN_LICH' AND thoi_gian_bat_dau<=NOW())
        OR (trang_thai='HOAT_DONG' AND thoi_gian_ket_thuc<=NOW())
     ORDER BY thoi_gian_ket_thuc LIMIT 100`,
  );
const sapKetThuc = () =>
  coSoDuLieu.truyVan(
    `SELECT id FROM phien_dau_gia
     WHERE trang_thai='HOAT_DONG' AND thoi_gian_ket_thuc>NOW()
       AND thoi_gian_ket_thuc<=DATE_ADD(NOW(),INTERVAL 10 MINUTE)
     ORDER BY thoi_gian_ket_thuc LIMIT 100`,
  );
const danhSachYeuCauHuy = ({ limit: gioiHan, offset: viTriBatDau }) =>
  coSoDuLieu.truyVan(
    `SELECT y.*, p.tieu_de FROM yeu_cau_xu_ly y
     JOIN phien_dau_gia a ON a.id=y.phien_dau_gia_id
     JOIN san_pham p ON p.id=a.san_pham_id
     WHERE y.loai_yeu_cau='HUY_PHIEN'
     ORDER BY y.id DESC
     LIMIT ${gioiHan} OFFSET ${viTriBatDau}`,
  );
export = {
  layTheoId,
  cacMucToiDa,
  lichSu,
  nguoiThamGia,
  nguoiTheoDoi,
  phienDaCoCuaSanPham,
  yeuCauHuyDangCho,
  danhSach,
  theoDoi,
  boTheoDoi,
  denHan,
  sapKetThuc,
  danhSachYeuCauHuy,
};
