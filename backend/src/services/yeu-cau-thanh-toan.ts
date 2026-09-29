import { randomUUID } from 'node:crypto';
import coSoDuLieu = require('../repositories/ket-noi');
import khoBanGhi = require('../repositories/ban-ghi');
import { baoDam, cungId } from '../utils/loi';
import { docJSON } from '../utils/du-lieu-json';

function taoKhoaYeuCau(dauVao: { khoa_yeu_cau?: string | null }) {
  return dauVao.khoa_yeu_cau || randomUUID();
}

async function ketQuaDaXuLy(loai: string, khoa: string, nguoiDungId, doiTuongId) {
  const banGhi = await coSoDuLieu.layMot(
    'SELECT nguoi_thuc_hien_id, doi_tuong_id, du_lieu_moi FROM nhat_ky_hoat_dong WHERE ma_yeu_cau = ?',
    [`${loai}:${khoa}`],
  );

  if (!banGhi) {
    return null;
  }

  baoDam(
    cungId(banGhi.nguoi_thuc_hien_id, nguoiDungId) && cungId(banGhi.doi_tuong_id, doiTuongId),
    409,
    'Khóa yêu cầu đã được dùng cho giao dịch khác',
  );

  return docJSON(banGhi.du_lieu_moi, {});
}

async function luuKetQua(loai: string, khoa: string, nguoiDungId, doiTuongId, ketQua) {
  await khoBanGhi.them('nhat_ky_hoat_dong', {
    ma_yeu_cau: `${loai}:${khoa}`,
    nguoi_thuc_hien_id: nguoiDungId,
    hanh_dong: loai,
    loai_doi_tuong: loai === 'SECOND_CHANCE_THANH_TOAN' ? 'de_nghi_mua_tiep_theo' : 'phien_dau_gia',
    doi_tuong_id: doiTuongId,
    du_lieu_moi: JSON.stringify(ketQua),
  });
}

export { taoKhoaYeuCau, ketQuaDaXuLy, luuKetQua };
