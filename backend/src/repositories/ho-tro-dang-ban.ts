import db = require('./ket-noi');

export const anhNguoiBanKhac = (nguoiBanId) =>
  db.truyVan(
    `SELECT DISTINCT t.duong_dan_tep FROM tep_dinh_kem t JOIN san_pham p ON p.id=t.san_pham_id
   WHERE t.loai_tep='ANH_SAN_PHAM' AND p.nguoi_ban_id<>?`,
    [nguoiBanId],
  );

// Mỗi món hàng gốc góp một mẫu; tiền hàng không bao gồm phí vận chuyển và cọc.
export const giaDaBan = (danhMucId, sanPhamId) =>
  db.truyVan(
    `SELECT d.gia_san_pham FROM don_hang d JOIN phien_dau_gia a ON a.id=d.phien_dau_gia_id
   JOIN san_pham p ON p.id=a.san_pham_id JOIN san_pham g ON g.id=?
   WHERE p.danh_muc_id=? AND d.trang_thai='HOAN_THANH' AND d.trang_thai_giu_tien='DA_GIAI_NGAN'
     AND d.so_tien_da_giai_ngan=d.tong_tien AND d.gia_san_pham>0
     AND d.ngay_hoan_thanh>=DATE_SUB(NOW(),INTERVAL 12 MONTH)
     AND COALESCE(p.san_pham_goc_id,p.id)<>COALESCE(g.san_pham_goc_id,g.id)
     AND NOT EXISTS (SELECT 1 FROM don_hang newer JOIN phien_dau_gia na ON na.id=newer.phien_dau_gia_id
       JOIN san_pham np ON np.id=na.san_pham_id WHERE newer.trang_thai='HOAN_THANH'
       AND newer.trang_thai_giu_tien='DA_GIAI_NGAN' AND newer.id>d.id
       AND COALESCE(np.san_pham_goc_id,np.id)=COALESCE(p.san_pham_goc_id,p.id))
   ORDER BY d.ngay_hoan_thanh DESC,d.id DESC LIMIT 200`,
    [sanPhamId, danhMucId],
  );
