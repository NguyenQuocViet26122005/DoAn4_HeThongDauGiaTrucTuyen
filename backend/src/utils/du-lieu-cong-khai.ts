import type { NguoiDungDangNhap, BanGhiSQL } from '../types/nghiep-vu';
import { baoDam } from './loi';

function chonTruong(nguon, cacKhoa) {
  return Object.fromEntries(
    cacKhoa.filter((k) => nguon[k] !== undefined).map((k) => [k, nguon[k]]),
  );
}

const truongNguoiDung = [
  'id',
  'ho_ten',
  'email',
  'so_dien_thoai',
  'anh_dai_dien',
  'vai_tro',
  'trang_thai_nguoi_ban',
  'trang_thai_tai_khoan',
  'ngay_tao',
];
const truongPhienCongKhai = [
  'id',
  'san_pham_id',
  'gia_khoi_diem',
  'gia_mua_ngay',
  'phi_van_chuyen',
  'cho_phep_mua_ngay',
  'gia_hien_tai',
  'thoi_gian_bat_dau',
  'thoi_gian_ket_thuc_goc',
  'thoi_gian_ket_thuc',
  'trang_thai',
  'ly_do_ket_thuc',
  'dat_gia_san',
  'tong_luot_tra_gia',
  'so_lan_gia_han',
  'tieu_de',
  'duong_dan',
  'ten_danh_muc',
  'nguoi_ban_id',
  'anh_chinh',
];

function nguoiDungAnToan(banGhi: BanGhiSQL): NguoiDungDangNhap {
  return chonTruong(banGhi, truongNguoiDung) as NguoiDungDangNhap;
}

function phienCongKhai(banGhi) {
  return {
    ...chonTruong(banGhi, truongPhienCongKhai),
    nguoi_dan_dau: banGhi.nguoi_dan_dau_id ? `ND-${banGhi.nguoi_dan_dau_id}` : null,
  };
}

// Lớp bảo vệ đầu ra: chặn trường bí mật kể cả khi controller vô tình trả nhầm.
function kiemTraDuLieuCongKhai(giaTri: unknown): void {
  if (Array.isArray(giaTri)) {
    return giaTri.forEach(kiemTraDuLieuCongKhai);
  }
  if (!giaTri || typeof giaTri !== 'object') {
    return;
  }
  for (const [khoa, phanTu] of Object.entries(giaTri)) {
    baoDam(
      ![
        'mat_khau_bam',
        'mat_khau',
        'password',
        'gia_toi_da',
        'jwtSecret',
        'JWT_SECRET',
        'DB_PASSWORD',
      ].includes(khoa),
      500,
      'Không thể xuất dữ liệu nhạy cảm',
    );

    kiemTraDuLieuCongKhai(phanTu);
  }
}

export {
  chonTruong,
  nguoiDungAnToan,
  phienCongKhai,
  kiemTraDuLieuCongKhai,
};
