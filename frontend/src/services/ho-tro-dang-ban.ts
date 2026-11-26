import { gui, http } from './api';

export interface CanhBaoTin {
  ma: string;
  noi_dung: string;
}
export interface KiemDuyetTin {
  canh_bao: CanhBaoTin[];
  anh_chua_doi_chieu: number;
  canh_bao_ai?: CanhBaoTin[];
  ai_san_sang?: boolean;
  thong_bao?: string | null;
}
export interface GoiYAnh {
  danh_muc_id: string;
  tieu_de: string | null;
  mo_ta: string | null;
  tinh_trang_san_pham: string | null;
  thuoc_tinh: { thuoc_tinh_id: string; gia_tri: string }[];
  can_bo_sung: string[];
}
export interface BanXemAnh {
  ma: string;
  anh: string[];
  thong_bao: string;
}
export const raSoatTin = (id: string, dungAI = false) =>
  gui<KiemDuyetTin>(`/listing-support/products/${id}/review`, { dung_ai: dungAI });

export async function chuanBiAnh(files: File[]) {
  const form = new FormData();

  files.forEach((f) => form.append('photos', f));

  return (
    await http.post<{ data: BanXemAnh }>('/listing-support/photos/prepare', form, {
      timeout: 90000,
    })
  ).data.data;
}

export async function goiYAnh(ma: string, ghiChu: string) {
  return (
    await http.post<{ data: { goi_y: GoiYAnh | null; thong_bao: string } }>(
      '/listing-support/photos/suggest',
      {
        ma,
        ghi_chu: ghiChu,
        xac_nhan_anh_an_toan: true,
      },
      { timeout: 45000 },
    )
  ).data.data;
}
