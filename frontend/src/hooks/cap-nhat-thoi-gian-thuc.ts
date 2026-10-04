import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useMatch } from 'react-router-dom';
import { boNho } from '../services/api';
import { usePhienDangNhap } from '../store/phien-dang-nhap';

export function useCapNhatThoiGianThuc() {
  const phienCongKhai = useMatch('/phien/:id')?.params.id;
  const phienNguoiBan = useMatch('/nguoi-ban/phien/:id')?.params.id;
  const phienId = phienCongKhai || (phienNguoiBan !== 'moi' ? phienNguoiBan : undefined);
  const nguoiDungId = usePhienDangNhap((s) => s.nguoiDung?.id);

  useEffect(() => {
    const mayChu = import.meta.env.VITE_API_URL
      ? new URL(import.meta.env.VITE_API_URL, window.location.origin).origin
      : window.location.origin;
    const ketNoi = io(mayChu, {
      auth: nguoiDungId ? { token: sessionStorage.getItem('lac-viet-token') } : {},
      reconnectionDelayMax: 10000,
    });
    let choCapNhat: ReturnType<typeof setTimeout> | undefined;
    let daDong = false;

    function capNhat() {
      if (daDong || choCapNhat) {
        return;
      }

      // Gộp các sự kiện liên tiếp; dữ liệu và quyền luôn được kiểm tra lại qua API.
      choCapNhat = setTimeout(() => {
        choCapNhat = undefined;
        void boNho.invalidateQueries();
      }, 250);
    }

    function vaoPhong() {
      if (phienId) {
        ketNoi.emit('auction:join', { auctionId: phienId }, (ketQua: { success?: boolean }) => {
          if (ketQua?.success) {
            capNhat();
          }
        });
      }

      capNhat();
    }

    ketNoi.on('connect', vaoPhong);
    ketNoi.on('notification:new', capNhat);
    ketNoi.on('auction:bid-updated', capNhat);
    ketNoi.on('auction:started', capNhat);
    ketNoi.on('auction:ended', capNhat);

    return () => {
      daDong = true;
      if (choCapNhat) {
        clearTimeout(choCapNhat);
      }
      if (phienId && ketNoi.connected) {
        ketNoi.emit('auction:leave', { auctionId: phienId });
      }

      ketNoi.removeAllListeners();
      ketNoi.disconnect();
    };
  }, [phienId, nguoiDungId]);
}
