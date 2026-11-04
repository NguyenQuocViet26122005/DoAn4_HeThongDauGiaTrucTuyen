import coSoDuLieu = require('./ket-noi');
import khoBanGhi = require('./ban-ghi');
import { batBuocTonTai } from '../utils/loi';

export async function khoaSanPham(id: string | number) {
  const banDau = batBuocTonTai(await khoBanGhi.layTheoId('san_pham', id));

  await khoBanGhi.layTheoId('san_pham', banDau.san_pham_goc_id || id, true);

  return batBuocTonTai(await khoBanGhi.layTheoId('san_pham', id, true));
}

const cungMonVoi = (maBang) =>
  `COALESCE(s.san_pham_goc_id,s.id)=COALESCE(${maBang}.san_pham_goc_id,${maBang}.id)`;
const PHIEN_CON_HIEU_LUC = "a.trang_thai IN ('DA_LEN_LICH','HOAT_DONG')";
const PHIEN_THANG_CHUA_CO_DON = `a.trang_thai='DA_KET_THUC'
        AND a.ly_do_ket_thuc IN ('CO_NGUOI_THANG','MUA_NGAY')
        AND NOT EXISTS (SELECT 1 FROM don_hang d WHERE d.phien_dau_gia_id=a.id)`;

const donConNghiaVu = (maBang) => `(
        d.trang_thai<>'DA_HUY'
        OR NOT (
          (COALESCE(d.ly_do_huy,'')='KHONG_THANH_TOAN' AND
            (d.xu_ly_hang IS NULL OR COALESCE(JSON_UNQUOTE(JSON_EXTRACT(d.xu_ly_hang,'$.trang_thai')),'')='DA_DUNG_THU_HOI'))
          OR COALESCE(JSON_UNQUOTE(JSON_EXTRACT(d.xu_ly_hang,'$.trang_thai')),'')='DU_DIEU_KIEN_BAN_LAI'
          OR (COALESCE(JSON_UNQUOTE(JSON_EXTRACT(d.xu_ly_hang,'$.trang_thai')),'')='DA_TRA_NGUOI_BAN'
              AND s.id<>${maBang}.id)
        )
      )`;

// Nghĩa vụ được xét trên cùng món hàng, kể cả hồ sơ đăng bán lại.
export function dieuKienKhongConNghiaVu(maBang = 'p') {
  const cungMon = cungMonVoi(maBang);

  return `
    NOT EXISTS (
      SELECT 1 FROM phien_dau_gia a JOIN san_pham s ON s.id=a.san_pham_id
      WHERE ${cungMon} AND ${PHIEN_CON_HIEU_LUC}
    )
    AND NOT EXISTS (
      SELECT 1 FROM phien_dau_gia a JOIN san_pham s ON s.id=a.san_pham_id
      WHERE ${cungMon} AND ${PHIEN_THANG_CHUA_CO_DON}
    )
    AND NOT EXISTS (
      SELECT 1 FROM don_hang d
      JOIN phien_dau_gia a ON a.id=d.phien_dau_gia_id
      JOIN san_pham s ON s.id=a.san_pham_id
      WHERE ${cungMon} AND ${donConNghiaVu(maBang)}
    )
    AND NOT EXISTS (
      SELECT 1 FROM de_nghi_mua_tiep_theo n
      JOIN phien_dau_gia a ON a.id=n.phien_dau_gia_id
      JOIN san_pham s ON s.id=a.san_pham_id
      WHERE ${cungMon} AND n.trang_thai='CHO_XU_LY'
    )`;
}

// Cùng các điều kiện trên, nhưng trả về đối tượng đang chặn để giải thích cho người bán.
export async function nghiaVuDangChan(sanPhamId) {
  const tu = `FROM san_pham p JOIN san_pham s ON ${cungMonVoi('p')}
     JOIN phien_dau_gia a ON a.san_pham_id=s.id`;

  return {
    phien: await coSoDuLieu.layMot(
      `SELECT a.id ${tu} WHERE p.id=? AND ${PHIEN_CON_HIEU_LUC} ORDER BY a.id DESC LIMIT 1`,
      [sanPhamId],
    ),
    phienChuaCoDon: await coSoDuLieu.layMot(
      `SELECT a.id ${tu} WHERE p.id=? AND ${PHIEN_THANG_CHUA_CO_DON} ORDER BY a.id DESC LIMIT 1`,
      [sanPhamId],
    ),
    don: await coSoDuLieu.layMot(
      `SELECT d.id,d.trang_thai,d.ly_do_huy,
        JSON_UNQUOTE(JSON_EXTRACT(d.xu_ly_hang,'$.trang_thai')) AS trang_thai_hang
       ${tu} JOIN don_hang d ON d.phien_dau_gia_id=a.id
       WHERE p.id=? AND ${donConNghiaVu('p')} ORDER BY d.id DESC LIMIT 1`,
      [sanPhamId],
    ),
    deNghi: await coSoDuLieu.layMot(
      `SELECT n.id ${tu} JOIN de_nghi_mua_tiep_theo n ON n.phien_dau_gia_id=a.id
       WHERE p.id=? AND n.trang_thai='CHO_XU_LY' ORDER BY n.id DESC LIMIT 1`,
      [sanPhamId],
    ),
  };
}

export async function coPhienMoiHon(sanPhamId, phienId) {
  return coSoDuLieu.layMot(
    `SELECT a.id FROM phien_dau_gia a JOIN san_pham s ON s.id=a.san_pham_id
     JOIN san_pham p ON p.id=?
     WHERE COALESCE(s.san_pham_goc_id,s.id)=COALESCE(p.san_pham_goc_id,p.id)
       AND a.id>? LIMIT 1`,
    [sanPhamId, phienId],
  );
}
