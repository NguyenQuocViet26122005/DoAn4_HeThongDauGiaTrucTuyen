import { z } from 'zod';
import { dinhDanh, soTien, vanBan } from './schema-chung';

export const taoPhienSchema = z.strictObject({
  san_pham_id: dinhDanh,
  gia_khoi_diem: soTien,
  gia_san: soTien.nullish(),
  gia_mua_ngay: soTien.nullish(),
  phi_van_chuyen: soTien.optional(),
  thoi_gian_bat_dau: vanBan(40,'Bắt đầu'),
  thoi_gian_ket_thuc: vanBan(40,'Kết thúc'),
});
export const datGiaSchema = z.strictObject({gia_toi_da: soTien});
export const huyPhienSchema = z.strictObject({ly_do: vanBan(1000,'Lý do')});
export const duyetHuySchema = z.strictObject({
  trang_thai: z.enum(['DA_DUYET','TU_CHOI']),
  ghi_chu_duyet: vanBan(1000,'Ghi chú duyệt'),
});
export type DuLieuTaoPhien = z.infer<typeof taoPhienSchema>;
export type DuLieuDatGia = z.infer<typeof datGiaSchema>;
