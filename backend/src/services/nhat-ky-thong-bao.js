const khoBanGhi = require('../repositories/ban-ghi');
const khoDuLieu = require('../repositories/he-thong');
const cacSuKien = require('../sockets/su-kien');
const { kiemTraDuLieuCongKhai } = require('../utils/du-lieu-cong-khai');
async function ghiNhatKy(nguoiThucHienId, hanhDong, doiTuong, doiTuongId, duLieu = null) {
  kiemTraDuLieuCongKhai(duLieu);
  return khoBanGhi.them('nhat_ky_hoat_dong', {
    nguoi_thuc_hien_id: nguoiThucHienId || null,
    hanh_dong: hanhDong,
    loai_doi_tuong: doiTuong,
    doi_tuong_id: doiTuongId || null,
    du_lieu_moi: duLieu == null ? null : JSON.stringify(duLieu),
  });
}
async function taoThongBao(nguoiDungId, loai, tieuDe, noiDung, lienKet = null) {
  const duLieu = {
    nguoi_dung_id: nguoiDungId,
    loai: loai,
    tieu_de: tieuDe,
    noi_dung: noiDung,
    duong_dan_lien_ket: lienKet,
  };
  const id = await khoBanGhi.them('thong_bao', duLieu);
  cacSuKien.phatSuKien(`user:${nguoiDungId}`, 'notification:new', { id, ...duLieu, da_doc: 0 });
  return id;
}
async function thongBaoMotLan(nguoiDungId, loai, tieuDe, noiDung, lienKet) {
  if (await khoDuLieu.thongBaoDaCo(nguoiDungId, loai, lienKet)) return;
  return taoThongBao(nguoiDungId, loai, tieuDe, noiDung, lienKet);
}
module.exports = { ghiNhatKy, taoThongBao, thongBaoMotLan };
