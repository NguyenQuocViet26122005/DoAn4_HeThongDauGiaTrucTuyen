import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useMatch } from 'react-router-dom';
import { boNho, doc } from '../services/api';
import { usePhienDangNhap } from '../store/phien-dang-nhap';
import { useKetNoiThoiGianThuc } from '../store/ket-noi-thoi-gian-thuc';

// Mỗi loại liên kết thông báo chỉ làm mới nhóm dữ liệu liên quan, không tải lại cả trang.
const NHOM_THEO_LIEN_KET: Record<string, string[]> = {
  auctions: ['/auctions', '/watchlist'],
  orders: ['/orders', '/admin/orders', '/second-chances', '/auctions'],
  disputes: ['/disputes', '/admin/disputes', '/orders', '/admin/orders'],
  inspections: ['/inspections', '/admin/inspections', '/products'],
  products: ['/products', '/admin/products'],
  'second-chances': ['/second-chances', '/orders'],
};

export function useCapNhatThoiGianThuc() {
  const phienCongKhai = useMatch('/phien/:id')?.params.id;
  const phienNguoiBan = useMatch('/nguoi-ban/phien/:id')?.params.id;
  const phienId = phienCongKhai || (phienNguoiBan !== 'moi' ? phienNguoiBan : undefined);
  const nguoiDungId = usePhienDangNhap((s) => s.nguoiDung?.id);

  useEffect(() => {
    const mayChu = import.meta.env.VITE_API_URL
      ? new URL(import.meta.env.VITE_API_URL, window.location.origin).origin
      : window.location.origin;
    // Đọc token ở mỗi lần kết nối lại để không giữ token cũ.
    const ketNoi = io(mayChu, {
      auth: (traVe) =>
        traVe(nguoiDungId ? { token: sessionStorage.getItem('lac-viet-token') } : {}),
      reconnectionDelayMax: 10000,
    });
    const cacTienTo = new Set<string>();
    let lamMoiTatCa = false;
    let choCapNhat: ReturnType<typeof setTimeout> | undefined;
    let choKetNoiLai: ReturnType<typeof setTimeout> | undefined;
    let daDong = false;

    function datTrangThai(daKetNoi: boolean) {
      useKetNoiThoiGianThuc.setState({ daKetNoi });
    }

    // Gộp các sự kiện liên tiếp; dữ liệu và quyền luôn được kiểm tra lại qua API.
    function capNhat(tienTo?: string[]) {
      if (daDong) {
        return;
      }
      if (tienTo) {
        tienTo.forEach((muc) => cacTienTo.add(muc));
      } else {
        lamMoiTatCa = true;
      }
      if (choCapNhat) {
        return;
      }

      choCapNhat = setTimeout(() => {
        const tatCa = lamMoiTatCa;
        const nhom = [...cacTienTo];

        choCapNhat = undefined;
        lamMoiTatCa = false;
        cacTienTo.clear();

        void boNho.invalidateQueries(
          tatCa
            ? undefined
            : {
                predicate: ({ queryKey }) =>
                  typeof queryKey[0] === 'string' &&
                  nhom.some((muc) => (queryKey[0] as string).startsWith(muc)),
              },
        );
      }, 250);
    }

    function vaoPhong() {
      datTrangThai(true);

      if (phienId) {
        ketNoi.emit('auction:join', { auctionId: phienId });
      }

      // Có thể đã lỡ sự kiện trong lúc mất kết nối nên làm mới một lần.
      capNhat();
    }

    // Server ngắt hoặc từ chối kết nối thường do token hết hạn: hỏi lại API.
    // 401 thì bộ chặn API tự đăng xuất (effect chạy lại không token); còn hợp lệ thì kết nối lại.
    function kiemTraPhien() {
      datTrangThai(false);

      if (daDong || choKetNoiLai || !nguoiDungId) {
        return;
      }

      choKetNoiLai = setTimeout(() => {
        choKetNoiLai = undefined;
        doc('/users/me')
          .then(() => {
            if (!daDong && !ketNoi.connected) {
              ketNoi.connect();
            }
          })
          .catch(() => undefined);
      }, 3000);
    }

    ketNoi.on('connect', vaoPhong);
    ketNoi.on('disconnect', (lyDo) => {
      if (lyDo === 'io server disconnect') {
        kiemTraPhien();
      } else {
        datTrangThai(false);
      }
    });
    ketNoi.on('connect_error', () => {
      if (!ketNoi.active) {
        kiemTraPhien();
      } else {
        datTrangThai(false);
      }
    });
    ketNoi.on('notification:new', (thongBao?: { duong_dan_lien_ket?: string | null }) => {
      const loai = /^\/([a-z-]+)\/\d+$/.exec(thongBao?.duong_dan_lien_ket || '')?.[1];
      const nhom = loai ? NHOM_THEO_LIEN_KET[loai] : undefined;

      capNhat(nhom ? ['/notifications', '/users/me', ...nhom] : undefined);
    });
    for (const suKien of ['auction:bid-updated', 'auction:started']) {
      ketNoi.on(suKien, () => capNhat(['/auctions', '/watchlist']));
    }
    ketNoi.on('auction:ended', () => capNhat(['/auctions', '/watchlist', '/orders']));

    return () => {
      daDong = true;
      datTrangThai(false);
      if (choCapNhat) {
        clearTimeout(choCapNhat);
      }
      if (choKetNoiLai) {
        clearTimeout(choKetNoiLai);
      }
      if (phienId && ketNoi.connected) {
        ketNoi.emit('auction:leave', { auctionId: phienId });
      }

      ketNoi.removeAllListeners();
      ketNoi.disconnect();
    };
  }, [phienId, nguoiDungId]);
}
