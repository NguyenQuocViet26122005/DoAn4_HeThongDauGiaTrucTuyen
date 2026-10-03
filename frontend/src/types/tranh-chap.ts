import type { HoSoKiemDinh } from './kiem-dinh';

export interface BangChung {
  id: string;
  nguoi_tai_len_id: string;
  duong_dan_tep: string;
  loai_bang_chung: string;
  mo_ta: string | null;
  ngay_tao: string;
}

export interface TranhChap {
  id: string;
  don_hang_id: string;
  nguoi_mo_id: string;
  ly_do: string;
  mo_ta: string;
  trang_thai: string;
  phan_hoi_nguoi_ban: string | null;
  ket_qua_xu_ly: string | null;
  so_tien_hoan: string | null;
  ngay_tao: string;
  ngay_giai_quyet: string | null;
}

export interface ChiTietTranhChap extends TranhChap {
  bang_chung: BangChung[];
  ho_so_kiem_dinh: HoSoKiemDinh | null;
}
