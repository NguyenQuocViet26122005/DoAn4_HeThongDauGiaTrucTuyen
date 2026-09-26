import { useQuery } from '@tanstack/react-query';
import { doc } from '../services/api';

export function useDuLieu<T>(url: string, thamSo?: Record<string, unknown>, bat = true) {
  return useQuery({
    queryKey: [url, thamSo],
    queryFn: () => doc<T>(url, thamSo),
    enabled: bat,
  });
}
