import { create } from 'zustand';

// Trạng thái socket: khi đang kết nối thì dữ liệu được làm mới theo sự kiện,
// các trang chỉ tự tải lại định kỳ khi mất kết nối.
export const useKetNoiThoiGianThuc = create<{ daKetNoi: boolean }>(() => ({ daKetNoi: false }));

export function useChuKyDuPhong(chuKy: number): number | false {
  return useKetNoiThoiGianThuc((s) => (s.daKetNoi ? false : chuKy));
}
