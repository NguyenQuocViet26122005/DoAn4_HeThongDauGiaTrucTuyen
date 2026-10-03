// Chỉ chuyển các đích nghiệp vụ đã biết; không điều hướng tới URL tùy ý trong dữ liệu.
export function lienKetThongBao(giaTri: string | null, quanTri = false): string | null {
  if (giaTri === '/seller/verification') {
    return '/tai-khoan/xac-minh';
  }
  if (giaTri === '/profile/violations') {
    return '/tai-khoan/vi-pham';
  }

  const khop =
    /^\/(auctions|orders|disputes|inspections|products|second-chances)\/([1-9]\d*)$/.exec(
      giaTri || '',
    );

  if (!khop) {
    return null;
  }

  const [, loai, id] = khop;
  const goc = quanTri ? '/quan-tri' : '/tai-khoan';
  const cacGoc: Record<string, string> = {
    auctions: '/phien',
    orders: `${goc}/don-hang`,
    disputes: `${goc}/tranh-chap`,
    inspections: `${quanTri ? '/quan-tri' : '/nguoi-ban'}/kiem-dinh`,
    products: `${quanTri ? '/quan-tri' : '/nguoi-ban'}/san-pham`,
  };

  return loai === 'second-chances' ? '/tai-khoan/de-nghi' : `${cacGoc[loai]}/${id}`;
}

export function noiDungThongBao(giaTri: string) {
  return giaTri.replace(/\s+mô phỏng/gi, '');
}
