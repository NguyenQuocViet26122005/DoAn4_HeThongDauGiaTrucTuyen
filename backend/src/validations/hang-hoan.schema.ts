import { z } from 'zod';
import { soTien, vanBan, vanBanTuyChon } from './schema-chung';

const benLienQuan = z.enum([
  'NGUOI_MUA',
  'NGUOI_BAN',
  'TRUNG_TAM',
  'VAN_CHUYEN',
  'KHONG_PHAT_SINH',
]);

export const xuLyHangSchema = z.discriminatedUnion('thao_tac', [
  z.strictObject({
    thao_tac: z.literal('KET_LUAN_TRACH_NHIEM'),
    ben_chiu_phi: benLienQuan,
    phi_hoan: soTien,
    ben_boi_thuong: benLienQuan,
    nguoi_nhan_boi_thuong: z.enum(['NGUOI_MUA', 'NGUOI_BAN', 'TRUNG_TAM', 'KHONG_PHAT_SINH']),
    tien_boi_thuong: soTien,
    ghi_chu: vanBan(5000, 'Căn cứ trách nhiệm và chi phí').min(30),
  }),
  z.strictObject({
    thao_tac: z.literal('DOI_SOAT_CHI_PHI'),
    ma_chung_tu: vanBan(150, 'Chứng từ đối soát').min(6),
    ghi_chu: vanBan(5000, 'Kết quả đối soát').min(20),
  }),
  z.strictObject({
    thao_tac: z.enum(['KHOI_TAO', 'DUNG_THU_HOI']),
    ghi_chu: vanBan(5000, 'Lý do xử lý'),
  }),
  z.strictObject({
    thao_tac: z.enum(['GUI_HOAN', 'TRA_NGUOI_BAN', 'GUI_LAI_NGUOI_MUA']),
    don_vi_van_chuyen: vanBan(100, 'Đơn vị vận chuyển'),
    ma_van_don: vanBan(100, 'Mã vận đơn'),
    ghi_chu: vanBan(5000, 'Ghi chú'),
  }),
  z.strictObject({
    thao_tac: z.literal('NHAN_LAI'),
    serial: vanBan(150, 'Serial hoặc mã nhận dạng'),
    so_kien: z.number().int().min(1).max(1000),
    ghi_chu: vanBan(5000, 'Tình trạng khi nhận'),
  }),
  z.strictObject({
    thao_tac: z.literal('KIEM_KE'),
    ket_qua: z.enum(['NGUYEN_VEN', 'CAN_XU_LY', 'KHONG_KHOP']),
    serial: vanBan(150, 'Serial hoặc mã nhận dạng'),
    phu_kien: vanBan(5000, 'Đối chiếu phụ kiện'),
    ghi_chu: vanBan(5000, 'Kết quả kiểm kê'),
  }),
  z.strictObject({
    thao_tac: z.literal('THAT_LAC'),
    ghi_chu: vanBan(5000, 'Căn cứ thất lạc').min(30),
  }),
  z.strictObject({
    thao_tac: z.enum(['CHO_PHEP_BAN_LAI', 'XAC_NHAN_NHAN_LAI', 'DANG_KY_LAI', 'XAC_NHAN_GIAO_LAI']),
    ghi_chu: vanBanTuyChon(5000),
  }),
]);
