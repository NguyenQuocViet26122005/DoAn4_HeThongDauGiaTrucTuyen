const coSoDuLieu = require('../repositories/ket-noi');
const khoBanGhi = require('../repositories/ban-ghi');
const khoDuLieu = require('../repositories/he-thong');
const { baoDam } = require('../utils/loi');
const { donViTienNho, GIOI_HAN_TIEN } = require('../utils/tien');
const kiemTra = require('../validators/du-lieu-dau-vao');
const { ghiNhatKy } = require('./nhat-ky-thong-bao');
const giaTriMacDinh = {
  PAYMENT_DEADLINE_HOURS: 48,
  SELLER_SHIP_DEADLINE_DAYS: 3,
  BUYER_INSPECTION_DAYS: 3,
  ANTI_SNIPE_THRESHOLD_SECONDS: 60,
  ANTI_SNIPE_EXTENSION_SECONDS: 90,
  SECOND_CHANCE_EXPIRE_HOURS: 24,
  MAX_CONFIRMED_VIOLATION_POINTS: 3,
};
async function docSoCauHinh(khoa) {
  baoDam(Object.hasOwn(giaTriMacDinh, khoa), 500, 'Cấu hình nghiệp vụ không được hỗ trợ');
  const banGhi = await khoDuLieu.cauHinh(khoa);
  const giaTri = banGhi ? Number(banGhi.gia_tri_cau_hinh) : giaTriMacDinh[khoa];
  baoDam(
    Number.isSafeInteger(giaTri) && giaTri > 0 && giaTri <= 87600,
    500,
    `Cấu hình ${khoa} không hợp lệ`,
  );
  return giaTri;
}
function buocGiaTaiMuc(gia, cacBanGhi) {
  const cacKhoangKhop = cacBanGhi.filter(
    (banGhi) =>
      banGhi.dang_hoat_dong &&
      gia >= donViTienNho(banGhi.gia_tu) &&
      (banGhi.gia_den == null || gia <= donViTienNho(banGhi.gia_den)),
  );
  baoDam(cacKhoangKhop.length === 1, 409, 'Cấu hình bước giá bị thiếu hoặc chồng lấn');
  const buocGia = donViTienNho(cacKhoangKhop[0].muc_tang_gia);
  baoDam(buocGia > 0n, 409, 'Bước giá không hợp lệ');
  return buocGia;
}
async function luu(quanTri, khoa, dauVao) {
  baoDam(Object.hasOwn(giaTriMacDinh, khoa), 400, 'Khóa cấu hình không được hỗ trợ');
  kiemTra.kiemTraNoiDung(dauVao, ['gia_tri_cau_hinh']);
  const giaTri = kiemTra.soNguyen(dauVao.gia_tri_cau_hinh, 'Giá trị cấu hình', 1, 87600);
  return coSoDuLieu.giaoDich(async () => {
    await khoDuLieu.khoaCauHinh();
    let banGhi = await khoDuLieu.cauHinh(khoa);
    const duLieu = {
      gia_tri_cau_hinh: String(giaTri),
      kieu_du_lieu: 'SO',
      nguoi_cap_nhat_id: quanTri.id,
    };
    if (banGhi) await khoBanGhi.capNhat('cau_hinh_he_thong', banGhi.id, duLieu);
    else await khoBanGhi.them('cau_hinh_he_thong', { ...duLieu, khoa_cau_hinh: khoa });
    await ghiNhatKy(quanTri.id, 'DOI_CAU_HINH', 'cau_hinh_he_thong', banGhi?.id, {
      khoa: khoa,
      gia_tri: giaTri,
    });
    return khoDuLieu.cauHinh(khoa);
  });
}
async function thayBoBuocGia(quanTri, dauVao) {
  kiemTra.kiemTraNoiDung(dauVao, ['buoc_gia']);
  baoDam(
    Array.isArray(dauVao.buoc_gia) && dauVao.buoc_gia.length > 0 && dauVao.buoc_gia.length <= 50,
    400,
    'Cần 1–50 khoảng bước giá',
  );
  const duLieu = dauVao.buoc_gia
    .map((x) => {
      kiemTra.kiemTraNoiDung(x, ['gia_tu', 'gia_den', 'muc_tang_gia']);
      return {
        gia_tu: kiemTra.kiemTraTien(x.gia_tu, 'Giá từ'),
        gia_den: x.gia_den == null ? null : kiemTra.kiemTraTien(x.gia_den, 'Giá đến'),
        muc_tang_gia: kiemTra.kiemTraTien(x.muc_tang_gia, 'Bước giá', true),
        dang_hoat_dong: 1,
      };
    })
    .sort((a, b) => (donViTienNho(a.gia_tu) < donViTienNho(b.gia_tu) ? -1 : 1));
  let tiepTheo = 0n;
  for (let chiSo = 0; chiSo < duLieu.length; chiSo++) {
    const banGhi = duLieu[chiSo];
    baoDam(
      donViTienNho(banGhi.gia_tu) === tiepTheo,
      400,
      'Các khoảng phải phủ liên tục từ 0 và không chồng lấn',
    );
    if (banGhi.gia_den == null) {
      baoDam(chiSo === duLieu.length - 1, 400, 'Chỉ khoảng cuối được để giá đến null');
      tiepTheo = GIOI_HAN_TIEN + 1n;
    } else {
      baoDam(
        donViTienNho(banGhi.gia_den) >= tiepTheo,
        400,
        'Giá đến phải lớn hơn hoặc bằng giá từ',
      );
      tiepTheo = donViTienNho(banGhi.gia_den) + 1n;
    }
  }
  baoDam(
    tiepTheo === GIOI_HAN_TIEN + 1n,
    400,
    'Khoảng cuối phải có giá đến null hoặc bao phủ giới hạn tiền',
  );
  return coSoDuLieu.giaoDich(async () => {
    await khoDuLieu.khoaCauHinh();
    await khoDuLieu.tatBuocGiaCu();
    for (const banGhi of duLieu) await khoBanGhi.them('buoc_gia', banGhi);
    await ghiNhatKy(quanTri.id, 'DOI_BUOC_GIA', 'buoc_gia', null, { so_khoang: duLieu.length });
    return khoDuLieu.cacBuocGia();
  });
}
module.exports = { docSoCauHinh, buocGiaTaiMuc, luu, thayBoBuocGia };
