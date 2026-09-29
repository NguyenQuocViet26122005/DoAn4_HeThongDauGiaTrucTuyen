import { z } from 'zod';
import { vanBan, vanBanTuyChon } from './schema-chung';

export const guiTrungTamSchema = z.strictObject({
  don_vi_van_chuyen: vanBan(100, 'Đơn vị vận chuyển'),
  ma_van_don: vanBan(100, 'Mã vận đơn'),
});

export const tiepNhanSchema = z.strictObject({
  tinh_trang_khi_nhan: vanBan(5000, 'Tình trạng khi nhận'),
  serial_khi_nhan: vanBanTuyChon(150),
  so_kien: z.number().int().min(1).max(1000),
  ghi_chu: vanBanTuyChon(5000),
});

export const ketQuaKiemDinhSchema = z.strictObject({
  ket_qua: z.enum(['DAT', 'KHONG_DAT', 'CAN_BO_SUNG']),
  ten_chuyen_gia: vanBan(150, 'Tên chuyên gia'),
  don_vi_kiem_dinh: vanBan(200, 'Đơn vị kiểm định'),
  ngay_kiem_dinh: vanBan(40, 'Ngày kiểm định'),
  nhan_xet: vanBan(10000, 'Nhận xét'),
  ma_chung_nhan: vanBanTuyChon(150),
});

export const tepKiemDinhSchema = z.strictObject({
  loai_tep: z.enum(['BIEN_BAN_TIEP_NHAN', 'BAO_CAO_KIEM_DINH', 'CHUNG_NHAN_KIEM_DINH']),
  duong_dan_tep: vanBan(255, 'Đường dẫn tệp'),
  mo_ta: vanBanTuyChon(500),
});

export const traNguoiBanSchema = z.strictObject({ ly_do: vanBan(1000, 'Lý do trả hàng') });

export const chinhSachCocSchema = z
  .strictObject({
    bat: z.boolean(),
    kieu: z.enum(['TY_LE', 'CO_DINH']),
    gia_tri: z.number().int().positive().max(9999999999999),
  })
  .refine((d) => d.kieu !== 'TY_LE' || d.gia_tri <= 100, 'Tỷ lệ cọc phải từ 1 đến 100 phần trăm');
