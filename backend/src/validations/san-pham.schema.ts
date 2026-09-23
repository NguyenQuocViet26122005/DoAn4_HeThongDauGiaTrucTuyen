import { z } from 'zod';
import { dinhDanh, vanBan, vanBanTuyChon } from './schema-chung';

export const sanPhamSchema = z.strictObject({
  danh_muc_id:dinhDanh,
  tieu_de:vanBan(200,'Tiêu đề'),
  mo_ta:vanBan(20000,'Mô tả'),
  tinh_trang_san_pham:z.enum(['MOI','NHU_MOI','DA_QUA_SU_DUNG_TOT','DA_QUA_SU_DUNG','LAY_LINH_KIEN']),
  thuong_hieu:vanBanTuyChon(100),
  thuoc_tinh:z.array(z.strictObject({thuoc_tinh_id:dinhDanh,gia_tri:z.union([z.string(),z.number(),z.boolean()])})).max(100).optional(),
});
export type DuLieuSanPham = z.infer<typeof sanPhamSchema>;
