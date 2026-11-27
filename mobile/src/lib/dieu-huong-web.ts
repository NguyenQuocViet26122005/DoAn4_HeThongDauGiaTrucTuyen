// Chỉ trang VietBid được mở trong app. Liên kết ngoài đi qua trình duyệt hệ thống.
export const GOC_WEB = (
  process.env.EXPO_PUBLIC_WEB_URL || 'https://vietbid.alwaysdata.net'
).replace(/\/$/, '');

export function phanLoaiUrl(raw: string, goc = GOC_WEB): 'noi-bo' | 'ngoai' | 'chan' {
  try {
    const url = new URL(raw);
    const base = new URL(goc);

    if (url.username || url.password) {
      return 'chan';
    }
    if (url.origin === base.origin && url.protocol === 'https:') {
      return 'noi-bo';
    }

    return url.protocol === 'https:' ? 'ngoai' : 'chan';
  } catch {
    return 'chan';
  }
}

export function diaChiTrang(duongDan = '/', goc = GOC_WEB) {
  const aliases: Record<string, string> = {
    '/don-hang': '/tai-khoan/don-hang',
    '/thong-bao': '/tai-khoan/thong-bao',
    '/dia-chi': '/tai-khoan/dia-chi',
  };
  const path =
    aliases[duongDan] || (duongDan.startsWith('/don-hang/') ? '/tai-khoan' + duongDan : duongDan);

  if (!path.startsWith('/') || path.startsWith('//')) {
    return goc + '/';
  }

  const url = new URL(path, goc).href;

  return phanLoaiUrl(url, goc) === 'noi-bo' ? url : goc + '/';
}
