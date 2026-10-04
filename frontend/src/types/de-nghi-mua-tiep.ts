import type { DonMua } from './tham-gia-phien';

export interface DeNghiMuaTiep {
  id: string;
  phien_dau_gia_id: string;
  don_hang_goc_id: string;
  nguoi_tra_gia_id: string;
  gia_de_nghi: string;
  trang_thai: string;
  het_han_luc: string;
  ngay_tao: string;
  ngay_phan_hoi: string | null;
  don_hang_moi_id: string | null;
  tieu_de: string;
  nguoi_ban_id: string;
  phi_van_chuyen: string;
}

export interface PhanHoiDeNghi {
  de_nghi: Pick<DeNghiMuaTiep, 'trang_thai' | 'nguoi_tra_gia_id' | 'don_hang_moi_id'>;
  don_hang: DonMua | null;
  ket_qua_mo_phong?: 'THANH_CONG' | 'THAT_BAI';
}
