// Định dạng giống web: tiền VND, ngày giờ theo múi giờ Việt Nam, nhãn trạng thái tiếng Việt.
export const tien = (giaTri: unknown) =>
  `${Math.round(Number(giaTri || 0)).toLocaleString('vi-VN')} ₫`;

const chuoi = (giaTri: unknown) => (giaTri == null ? '' : String(giaTri));

// CSDL trả giờ Việt Nam không kèm múi giờ; ghép +07:00 để mọi máy hiểu đúng một thời điểm.
export const mocThoiGian = (giaTri: unknown) =>
  new Date(
    chuoi(giaTri).replace(' ', 'T') + (/Z$|[+-]\d\d:\d\d$/.test(chuoi(giaTri)) ? '' : '+07:00'),
  ).getTime();

export const ngayGio = (giaTri: unknown) => {
  if (!giaTri) {
    return 'Chưa cập nhật';
  }

  const d = new Date(mocThoiGian(giaTri) + 7 * 3600_000);
  const hai = (n: number) => String(n).padStart(2, '0');

  return `${hai(d.getUTCHours())}:${hai(d.getUTCMinutes())} ${hai(d.getUTCDate())}/${hai(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
};

export function demNguoc(msConLai: number) {
  if (msConLai <= 0) {
    return 'Đã hết thời gian';
  }

  const giay = Math.floor(msConLai / 1000);
  const ngay = Math.floor(giay / 86400);
  const hai = (n: number) => String(n).padStart(2, '0');
  const phan = `${hai(Math.floor(giay / 3600) % 24)}:${hai(Math.floor(giay / 60) % 60)}:${hai(giay % 60)}`;

  return ngay ? `${ngay} ngày ${phan}` : phan;
}

export function tenGiaPhien(trangThai: string, lyDoKetThuc?: string | null) {
  if (trangThai === 'DA_LEN_LICH') {
    return 'Giá khởi điểm';
  }
  if (trangThai === 'DA_KET_THUC') {
    return lyDoKetThuc === 'MUA_NGAY' ? 'Giá Mua ngay' : 'Giá trúng công khai';
  }
  if (trangThai === 'THAT_BAI') {
    return 'Giá cuối phiên';
  }

  return 'Giá công khai hiện tại';
}

const nhanTrangThai: Record<string, string> = {
  HOAT_DONG: 'Đang diễn ra',
  DA_LEN_LICH: 'Sắp bắt đầu',
  DA_KET_THUC: 'Đã kết thúc',
  THAT_BAI: 'Chưa thành công',
  DA_HUY: 'Đã hủy',
  CHO_THANH_TOAN: 'Chờ thanh toán',
  DA_THANH_TOAN: 'Đã thanh toán',
  CHO_GUI_HANG: 'Chờ gửi hàng',
  DA_GUI_HANG: 'Đang vận chuyển',
  DA_GIAO: 'Đã giao hàng',
  DANG_KIEM_TRA: 'Đang kiểm tra hàng',
  DANG_TRANH_CHAP: 'Đang tranh chấp',
  HOAN_THANH: 'Hoàn thành',
  CHO_XU_LY: 'Chờ xử lý',
  DA_DAT_COC: 'Đã đặt cọc',
  DA_HOAN_COC: 'Đã hoàn cọc',
  DA_CHUYEN_VAO_DON: 'Cọc đã chuyển vào đơn',
  KHONG_HOAN_COC: 'Không hoàn cọc',
  HET_HAN: 'Hết hạn',
  DANG_GIU: 'Đang giữ tiền',
  DA_GIAI_NGAN: 'Đã giải ngân',
  DA_HOAN_TIEN: 'Đã hoàn tiền',
  HOAN_TIEN_MOT_PHAN: 'Hoàn tiền một phần',
  CHUA_THANH_TOAN: 'Chưa thanh toán',
  DANG_MO: 'Đang mở',
  NGUOI_BAN_DA_PHAN_HOI: 'Người bán đã phản hồi',
  QUAN_TRI_DANG_XU_LY: 'Quản trị đang xử lý',
  DA_XAC_MINH: 'Đã xác minh',
  CHUA_DANG_KY: 'Chưa đăng ký',
  MOI: 'Mới',
  NHU_MOI: 'Như mới',
  DA_QUA_SU_DUNG_TOT: 'Đã dùng, còn tốt',
  DA_QUA_SU_DUNG: 'Đã qua sử dụng',
  LAY_LINH_KIEN: 'Lấy linh kiện',
};

export const nhan = (giaTri: unknown) => nhanTrangThai[chuoi(giaTri)] || chuoi(giaTri) || '—';
