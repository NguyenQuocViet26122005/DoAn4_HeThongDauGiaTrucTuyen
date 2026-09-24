import axios from 'axios';
import { QueryClient } from '@tanstack/react-query';

export const boNho = new QueryClient({ defaultOptions: { queries: {
 staleTime: 20000, retry: 1, refetchOnWindowFocus: true 
} } });
export const http = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 15000 });
http.interceptors.request.use((cauHinh) => {
  const token = sessionStorage.getItem('lac-viet-token');


  if (token) {
cauHinh.headers.Authorization = `Bearer ${token}`;
}


  return cauHinh;
});
http.interceptors.response.use((phanHoi) => phanHoi, (loi) => {
  if (axios.isAxiosError(loi) && loi.response?.status === 401 && !loi.config?.url?.startsWith('/auth/')) {
    sessionStorage.removeItem('lac-viet-token');
    window.dispatchEvent(new Event('het-phien-dang-nhap'));
  }


  return Promise.reject(loi);
});


export async function doc<T>(url: string, thamSo?: Record<string, unknown>): Promise<T> {
  return (await http.get<{data: T}>(url, { params: thamSo })).data.data;
}


export async function gui<T = unknown>(url: string, noiDung: unknown = {}, phuongThuc: 'post' | 'put' | 'patch' | 'delete' = 'post'): Promise<T> {
  return (await http.request<{data: T}>({
 url, method: phuongThuc, data: noiDung 
})).data.data;
}


export async function taiTep(tep: File, nhom: string): Promise<string> {
  const bieuMau = new FormData();


  bieuMau.set('file', tep);


  return (await gui<{duong_dan: string}>(`/uploads/${nhom}`, bieuMau)).duong_dan;
}


export function loiDeDoc(loi: unknown): string {
  if (axios.isAxiosError(loi)) {
return loi.response?.data?.message || 'Chưa kết nối được máy chủ. Vui lòng thử lại.';
}


  return loi instanceof Error ? loi.message : 'Không thể thực hiện thao tác. Vui lòng thử lại.';
}


// Chỉ chấp nhận ảnh HTTP(S) hoặc tệp của hệ thống, không chèn HTML/URL thực thi.
export function duongDanAnh(giaTri?: string | null): string | undefined {
  if (!giaTri || (!giaTri.startsWith('/api/uploads/files/') && !/^https?:\/\//.test(giaTri))) {
return undefined;
}
  if (giaTri.startsWith('/api/') && import.meta.env.VITE_API_URL) {
return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') + giaTri;
}


  return giaTri;
}
