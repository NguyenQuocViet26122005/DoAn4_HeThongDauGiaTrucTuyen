import type { Request, RequestHandler } from 'express';
import { kiemTraDuLieuCongKhai } from '../utils/du-lieu-cong-khai';
import { soNguyen } from '../validations/du-lieu-dau-vao';

function xuLyHTTP(
  congViec: (yeuCau: Request) => unknown | Promise<unknown>,
  { status: trangThai = 200, message: thongDiep = 'Thành công' } = {},
): RequestHandler {
  return async (yeuCau, phanHoi, tiepTheo) => {
    try {
      const duLieu = await congViec(yeuCau);

      kiemTraDuLieuCongKhai(duLieu);

      const phanTrang =
        yeuCau.method === 'GET' && yeuCau.query.phan_trang === 'true' && Array.isArray(duLieu)
          ? {
              page: soNguyen(yeuCau.query.page ?? 1, 'page', 1, 100000),
              limit: soNguyen(yeuCau.query.limit ?? 20, 'limit', 1, 100),
            }
          : null;

      phanHoi.status(trangThai).json({
        success: true,
        message: thongDiep,
        data:
          phanTrang && Array.isArray(duLieu) ? duLieu.slice(0, phanTrang.limit) : (duLieu ?? null),
        ...(phanTrang && Array.isArray(duLieu)
          ? { pagination: { ...phanTrang, has_more: duLieu.length > phanTrang.limit } }
          : {}),
      });
    } catch (loi) {
      tiepTheo(loi);
    }
  };
}

export = xuLyHTTP;
