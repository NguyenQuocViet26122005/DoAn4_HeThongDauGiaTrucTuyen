import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { boNho, GOC_MAY_CHU } from './api';
import { docToken } from './luu-tru';

// Nhận sự kiện giá/phiên/thông báo qua Socket.IO rồi làm mới đúng nhóm dữ liệu liên quan,
// giống web. Mọi kết nối tự vào phòng danh sách nên màn hình khám phá cũng cập nhật.
export function useCapNhatThoiGianThuc(nguoiDungId?: string, phienId?: string) {
  useEffect(() => {
    const ketNoi = io(GOC_MAY_CHU, {
      transports: ['websocket'],
      auth: (traVe) => {
        void docToken().then((token) => traVe(nguoiDungId && token ? { token } : {}));
      },
    });
    const lamMoi = (khoa: string[]) =>
      void boNho.invalidateQueries({
        predicate: ({ queryKey }) =>
          typeof queryKey[0] === 'string' &&
          khoa.some((k) => (queryKey[0] as string).startsWith(k)),
      });

    ketNoi.on('connect', () => {
      if (phienId) {
        ketNoi.emit('auction:join', { auctionId: phienId });
      }
    });
    ketNoi.on('auction:bid-updated', () => lamMoi(['/auctions']));
    ketNoi.on('auction:started', () => lamMoi(['/auctions']));
    ketNoi.on('auction:ended', () => lamMoi(['/auctions', '/orders']));
    ketNoi.on('notification:new', () => lamMoi(['/notifications', '/orders', '/auctions']));

    return () => {
      ketNoi.removeAllListeners();
      ketNoi.disconnect();
    };
  }, [nguoiDungId, phienId]);
}
