import { hoSoDuocXem } from './kiem-duyet-tin';
import { giaDaBan } from '../repositories/ho-tro-dang-ban';
import { donViTienNho, chuoiTien } from '../utils/tien';

export function thongKeGia(cacGia: string[]) {
  if (cacGia.length < 5) {
    return null;
  }

  const sapXep = cacGia.map((g) => donViTienNho(g)).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  return {
    so_mau: sapXep.length,
    gia_tu: chuoiTien(sapXep[Math.floor((sapXep.length - 1) * 0.25)]),
    gia_den: chuoiTien(sapXep[Math.ceil((sapXep.length - 1) * 0.75)]),
    pham_vi:
      'Tối đa 200 món cùng danh mục đã hoàn tất, giải ngân trong 12 tháng; khoảng 25%–75% giá bán, không gồm vận chuyển.',
    luu_y:
      'Giá thực bán tham khảo, không phải định giá sản phẩm hay cam kết giá khởi điểm. Tình trạng, mẫu mã và nguồn gốc có thể khác.',
  };
}

export async function thamKhaoGia(user, id: string) {
  const p = await hoSoDuocXem(user, id);

  return thongKeGia((await giaDaBan(p.danh_muc_id, id)).map((d) => d.gia_san_pham));
}
