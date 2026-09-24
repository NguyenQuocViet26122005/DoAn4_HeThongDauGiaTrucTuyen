import type { Request, RequestHandler } from 'express';
import { kiemTraDuLieuCongKhai } from '../utils/du-lieu-cong-khai';

function xuLyHTTP(
  congViec: (yeuCau: Request) => unknown | Promise<unknown>,
  { status: trangThai = 200, message: thongDiep = 'Thành công' } = {},
): RequestHandler {
  return async (yeuCau, phanHoi, tiepTheo) => {
    try {
      const duLieu = await congViec(yeuCau);

      kiemTraDuLieuCongKhai(duLieu);
      phanHoi.status(trangThai).json({
        success: true,
        message: thongDiep,
        data: duLieu ?? null,
      });
    } catch (loi) {
      tiepTheo(loi);
    }
  };
}

export = xuLyHTTP;
