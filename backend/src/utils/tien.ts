import { baoDam } from './loi';
const GIOI_HAN_TIEN = 999999999999999n;
function donViTienNho(giaTri: unknown, nhan = 'Số tiền') {
  baoDam(['number', 'string'].includes(typeof giaTri), 400, `${nhan} không hợp lệ`);
  const giaTriTho = String(giaTri);
  baoDam(
    /^\d{1,13}(\.\d{1,2})?$/.test(giaTriTho),
    400,
    `${nhan} phải là số không âm, tối đa 2 chữ số thập phân`,
  );
  const [phanNguyen, phanThapPhan = ''] = giaTriTho.split('.');
  const ketQua = BigInt(phanNguyen) * 100n + BigInt(phanThapPhan.padEnd(2, '0'));
  baoDam(ketQua <= GIOI_HAN_TIEN, 400, `${nhan} vượt giới hạn`);
  return ketQua;
}
function chuoiTien(giaTri: bigint) {
  baoDam(
    typeof giaTri === 'bigint' && giaTri >= 0n && giaTri <= GIOI_HAN_TIEN,
    400,
    'Số tiền vượt giới hạn',
  );
  return `${giaTri / 100n}.${String(giaTri % 100n).padStart(2, '0')}`;
}
const nhoHon = (a: bigint, b: bigint) => (a < b ? a : b);
const lonHon = (a: bigint, b: bigint) => (a > b ? a : b);
export = { donViTienNho, chuoiTien, nhoHon, lonHon, GIOI_HAN_TIEN };
