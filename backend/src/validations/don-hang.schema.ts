import { z } from 'zod';
import { dinhDanh, dungSai, vanBan } from './schema-chung';

export const thanhToanSchema = z.strictObject({
  ket_qua_mo_phong: z.enum(['THANH_CONG','THAT_BAI']).optional(),
  khoa_yeu_cau: z.string().regex(/^[a-zA-Z0-9_-]{8,100}$/,'Khóa yêu cầu cần 8–100 ký tự chữ, số, gạch ngang hoặc gạch dưới').nullish(),
});
export const guiHangSchema = z.strictObject({
  don_vi_van_chuyen: vanBan(100,'Đơn vị vận chuyển'),
  ma_van_don: vanBan(100,'Mã vận đơn'),
});
export const diaChiDonSchema = z.strictObject({dia_chi_id:dinhDanh});
export const phanHoiDeNghiSchema = z.strictObject({chap_nhan:dungSai});
export type DuLieuThanhToan = z.infer<typeof thanhToanSchema>;
export type DuLieuGuiHang = z.infer<typeof guiHangSchema>;
