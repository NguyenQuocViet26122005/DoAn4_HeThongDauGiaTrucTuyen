const { LoiUngDung } = require('../utils/loi');
function gioiHanYeuCau({ limit: gioiHan, windowMs: cuaSoMiliGiay }) {
  const cacBoDem = new Map();
  const donDep = setInterval(() => {
    for (const [khoa, giaTri] of cacBoDem) if (giaTri.reset <= Date.now()) cacBoDem.delete(khoa);
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
    tiepTheo();
  };
}
module.exports = gioiHanYeuCau;
