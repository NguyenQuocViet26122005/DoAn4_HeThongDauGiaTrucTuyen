import type { Phien } from './du-lieu';

export interface DiaChi {
  id: string;
  ten_nguoi_nhan: string;
  sdt_nguoi_nhan: string;
  tinh_thanh: string;
  quan_huyen: string;
  phuong_xa: string;
  dia_chi_chi_tiet: string;
  la_mac_dinh: number | boolean;
}

export type BieuMauDiaChi = Omit<DiaChi, 'id'>;

export interface DatCoc {
  id: string;
  so_tien: string;
  trang_thai: string;
  ngay_dat_coc: string | null;
  ly_do_xu_ly: string | null;
  don_hang_id: string | null;
}

export interface DonMua {
  id: string;
  phien_dau_gia_id: string;
  nguoi_mua_id: string;
  ma_don_hang: string;
  trang_thai: string;
  gia_san_pham: string;
  phi_van_chuyen: string;
  tong_tien: string;
  tien_coc_da_chuyen: string;
  so_tien_da_thu: string;
  trang_thai_giu_tien: string | null;
  ten_nguoi_nhan: string;
  sdt_nguoi_nhan: string;
  dia_chi_giao_hang: string;
}

export interface LanThanhToan {
  khoa_yeu_cau: string;
  ket_qua_mo_phong: 'THANH_CONG' | 'THAT_BAI';
}

export interface KetQuaThanhToan {
  ket_qua_mo_phong: 'THANH_CONG' | 'THAT_BAI';
  dat_coc?: DatCoc;
  phien?: Phien;
  don_hang?: DonMua | null;
}
