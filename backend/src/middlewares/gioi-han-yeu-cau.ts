import type { RequestHandler } from 'express';
import { LoiUngDung } from '../utils/loi';

function gioiHanYeuCau({
  limit: gioiHan,
  windowMs: cuaSoMiliGiay,
  chiDemLoi = false,
}: {
  limit: number;
  windowMs: number;
  // Đăng nhập: chỉ tính lần sai để nhiều người dùng chung mạng không bị chặn.
  chiDemLoi?: boolean;
}): RequestHandler {
  const cacBoDem = new Map<string, { count: number; reset: number }>();
  const donDep = setInterval(() => {
    for (const [khoa, giaTri] of cacBoDem)
      if (giaTri.reset <= Date.now()) {
        cacBoDem.delete(khoa);
      }
  }, cuaSoMiliGiay);

  donDep.unref();

  return (yeuCau, phanHoi, tiepTheo) => {
    const khoa = yeuCau.user?.id || yeuCau.ip;
    const thoiGian = Date.now();
    let muc = cacBoDem.get(khoa);

    if (!muc || muc.reset <= thoiGian) {
      muc = { count: 0, reset: thoiGian + cuaSoMiliGiay };
      cacBoDem.set(khoa, muc);
    }
    if (++muc.count > gioiHan) {
      phanHoi.set('Retry-After', String(Math.ceil((muc.reset - thoiGian) / 1000)));

      return tiepTheo(new LoiUngDung(429, 'Quá nhiều yêu cầu, vui lòng thử lại sau'));
    }
    if (chiDemLoi) {
      const dem = muc;

      phanHoi.on('finish', () => {
        if (phanHoi.statusCode < 400 && dem.count > 0) {
          dem.count--;
        }
      });
    }
    tiepTheo();
  };
}

export = gioiHanYeuCau;
