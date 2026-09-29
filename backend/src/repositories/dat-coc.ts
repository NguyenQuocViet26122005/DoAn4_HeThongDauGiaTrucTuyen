import coSoDuLieu = require('./ket-noi');

const cuaNguoiDung = (phienId, nguoiDungId, khoa = false) =>
  coSoDuLieu.layMot(
    `SELECT * FROM dat_coc_dau_gia WHERE phien_dau_gia_id = ? AND nguoi_dung_id = ?${khoa ? ' FOR UPDATE' : ''}`,
    [phienId, nguoiDungId],
  );

const chuaXuLyCuoi = (phienId) =>
  coSoDuLieu.truyVan(
    `SELECT * FROM dat_coc_dau_gia WHERE phien_dau_gia_id = ?
     AND trang_thai IN ('CHO_THANH_TOAN', 'THAT_BAI', 'DA_DAT_COC') ORDER BY id FOR UPDATE`,
    [phienId],
  );

const thongKe = (phienId) =>
  coSoDuLieu.layMot(
    `SELECT COUNT(*) AS da_dang_ky,
            COALESCE(SUM(c.trang_thai = 'DA_DAT_COC'), 0) AS da_coc,
            COALESCE(SUM(c.trang_thai = 'DA_DAT_COC'
              AND n.trang_thai_tai_khoan = 'HOAT_DONG' AND n.vai_tro = 'NGUOI_DUNG'
              AND EXISTS (SELECT 1 FROM dia_chi_nguoi_dung dc WHERE dc.nguoi_dung_id = n.id)), 0) AS du_dieu_kien
     FROM dat_coc_dau_gia c JOIN nguoi_dung n ON n.id = c.nguoi_dung_id
     WHERE c.phien_dau_gia_id = ?`,
    [phienId],
  );

const danhSach = ({ limit, offset }) =>
  coSoDuLieu.truyVan(
    `SELECT * FROM dat_coc_dau_gia ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`,
  );

export { cuaNguoiDung, chuaXuLyCuoi, thongKe, danhSach };
