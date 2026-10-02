import type { DiaChi } from '../types/tham-gia-phien';

export function noiDungDiaChi(diaChi: DiaChi) {
  return [diaChi.dia_chi_chi_tiet, diaChi.phuong_xa, diaChi.quan_huyen, diaChi.tinh_thanh].join(', ');
}
