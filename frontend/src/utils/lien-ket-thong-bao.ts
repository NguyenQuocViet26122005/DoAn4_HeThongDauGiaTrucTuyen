// Chỉ chuyển các đích nghiệp vụ đã biết; không điều hướng tới URL tùy ý trong dữ liệu.
// laNguoiBan: người nhận là chủ phiên/đơn (API trả la_nguoi_ban) thì mở khu người bán.
export function lienKetThongBao(
  giaTri: string | null,
  quanTri = false,
  laNguoiBan = false,
): string | null {
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
  const nguoiBan = laNguoiBan && !quanTri;
  const goc = quanTri ? '/quan-tri' : nguoiBan ? '/nguoi-ban' : '/tai-khoan';
  const cacGoc: Record<string, string> = {
    auctions: nguoiBan ? '/nguoi-ban/phien' : '/phien',
    orders: `${goc}/don-hang`,
    disputes: `${goc}/tranh-chap`,
    inspections: `${quanTri ? '/quan-tri' : '/nguoi-ban'}/kiem-dinh`,
    products: `${quanTri ? '/quan-tri' : '/nguoi-ban'}/san-pham`,
    'second-chances': '/tai-khoan/de-nghi',
  };

  return `${cacGoc[loai]}/${id}`;
}

export function noiDungThongBao(giaTri: string) {
  return giaTri.replace(/\s+mô phỏng/gi, '');
}
