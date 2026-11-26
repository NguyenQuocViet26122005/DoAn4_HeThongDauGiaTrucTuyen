import { AppState, Platform } from 'react-native';
import { focusManager, QueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { ghiNhanGioMayChu } from './gio-may-chu';

// Bản cài mặc định dùng hosting; có thể đặt EXPO_PUBLIC_API_URL riêng khi phát triển LAN.
export const DIA_CHI_API = (
  process.env.EXPO_PUBLIC_API_URL || 'https://vietbid-qviet2612.alwaysdata.net/api'
).replace(/\/$/, '');
export const GOC_MAY_CHU = DIA_CHI_API.replace(/\/api$/, '');
// HTTPS dùng web cùng hosting; môi trường LAN vẫn suy ra cổng Vite khi không cấu hình riêng.
export const DIA_CHI_WEB = (
  process.env.EXPO_PUBLIC_WEB_URL ||
  (GOC_MAY_CHU.startsWith('https://') ? GOC_MAY_CHU : GOC_MAY_CHU.replace(/:\d+$/, ':5173'))
).replace(/\/$/, '');

let tokenHienTai: string | null = null;
let khiHetPhien: (() => void) | null = null;

export function datToken(token: string | null) {
  tokenHienTai = token;
}

export function khiPhienHetHan(xuLy: (() => void) | null) {
  khiHetPhien = xuLy;
}

export class LoiApi extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function goi<T>(phuongThuc: string, duongDan: string, noiDung?: unknown): Promise<T> {
  let phanHoi: Response;

  try {
    phanHoi = await fetch(DIA_CHI_API + duongDan, {
      method: phuongThuc,
      headers: {
        Accept: 'application/json',
        ...(noiDung !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(tokenHienTai ? { Authorization: `Bearer ${tokenHienTai}` } : {}),
      },
      body: noiDung === undefined ? undefined : JSON.stringify(noiDung),
    });
  } catch {
    throw new LoiApi(0, 'Chưa kết nối được máy chủ. Kiểm tra mạng hoặc địa chỉ API.');
  }

  ghiNhanGioMayChu(phanHoi.headers.get('x-server-time'));

  const duLieu = await phanHoi.json().catch(() => null);

  if (!phanHoi.ok) {
    if (phanHoi.status === 401 && !duongDan.startsWith('/auth/')) {
      khiHetPhien?.();
    }

    throw new LoiApi(
      phanHoi.status,
      phanHoi.status >= 500
        ? 'Máy chủ tạm thời chưa sẵn sàng. Vui lòng thử lại sau.'
        : phanHoi.status === 429
          ? 'Bạn thao tác hơi nhanh. Vui lòng chờ một lát.'
          : duLieu?.message || 'Không thể thực hiện thao tác.',
    );
  }

  return duLieu?.data as T;
}

export const doc = <T>(duongDan: string) => goi<T>('GET', duongDan);
export const gui = <T>(duongDan: string, noiDung: unknown = {}, phuongThuc = 'POST') =>
  goi<T>(phuongThuc, duongDan, noiDung);

export const loiDeDoc = (loi: unknown) =>
  loi instanceof Error ? loi.message : 'Không thể thực hiện thao tác.';

// Khóa chống gửi trùng cho thanh toán mô phỏng, giống web.
export const maNgauNhien = () => Crypto.randomUUID();

// Ảnh trong hệ thống là đường dẫn /api/uploads/...; ghép với gốc máy chủ để tải được trên điện thoại.
export function duongDanAnh(giaTri?: string | null) {
  if (!giaTri) {
    return undefined;
  }
  if (giaTri.startsWith('/api/uploads/files/')) {
    return GOC_MAY_CHU + giaTri;
  }

  return /^https?:\/\//.test(giaTri) ? giaTri : undefined;
}

export const boNho = new QueryClient({
  defaultOptions: { queries: { staleTime: 15_000, retry: 1 } },
});

// Trên điện thoại không có sự kiện "focus cửa sổ": báo cho TanStack Query khi app trở lại
// từ nền để làm mới giá, đơn và thông báo có thể đã đổi lúc người dùng rời đi.
if (Platform.OS !== 'web') {
  focusManager.setEventListener((khiFocus) => {
    const dangKy = AppState.addEventListener('change', (trangThai) =>
      khiFocus(trangThai === 'active'),
    );

    return () => dangKy.remove();
  });
}
