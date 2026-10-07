import { useQuery } from '@tanstack/react-query';
import { doc, http } from '../services/api';

export function useDuLieu<T>(
  url: string,
  thamSo?: Record<string, unknown>,
  bat = true,
  chuKy: number | false = false,
) {
  return useQuery({
    queryKey: [url, thamSo],
    queryFn: () => doc<T>(url, thamSo),
    enabled: bat,
    refetchInterval: chuKy,
  });
}

export function useDanhSachDuLieu<T extends unknown[]>(
  url: string,
  thamSo?: Record<string, unknown>,
  bat = true,
  chuKy: number | false = false,
) {
  const truyVan = useQuery({
    queryKey: [url, thamSo, 'phan-trang'],
    queryFn: async () => {
      const phanHoi = await http.get<{
        data: T;
        pagination?: { page: number; limit: number; has_more: boolean };
      }>(url, { params: { ...thamSo, ...(thamSo?.page != null ? { phan_trang: true } : {}) } });

      return phanHoi.data;
    },
    enabled: bat,
    refetchInterval: chuKy,
  });

  return {
    ...truyVan,
    data: truyVan.data?.data,
    coTrangSau: truyVan.data?.pagination?.has_more ?? false,
  };
}
