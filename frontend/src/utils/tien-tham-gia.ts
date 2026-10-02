// Giữ chính xác phần thập phân của dữ liệu lịch sử khi tính phần tiền cần thu.
export function donViNho(giaTri: string | null | undefined): bigint {
  const chuoi = giaTri || '0';

  if (!/^\d+(\.\d{1,2})?$/.test(chuoi)) {
    throw new Error('Số tiền từ máy chủ không hợp lệ. Vui lòng tải lại phiên.');
  }

  const [nguyen, le = ''] = chuoi.split('.');

  return BigInt(nguyen) * 100n + BigInt(le.padEnd(2, '0'));
}

export function soTienMuaNgay(gia: string, phi: string, coc: string) {
  const tong = donViNho(gia) + donViNho(phi);
  const conLai = tong - donViNho(coc);

  if (conLai < 0n) {
    throw new Error('Tiền cọc vượt tổng tiền. Vui lòng tải lại phiên.');
  }

  return {
    tong: `${tong / 100n}.${String(tong % 100n).padStart(2, '0')}`,
    conLai: `${conLai / 100n}.${String(conLai % 100n).padStart(2, '0')}`,
  };
}
