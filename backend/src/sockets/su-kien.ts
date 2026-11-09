import type { Server } from 'socket.io';
import coSoDuLieu = require('../repositories/ket-noi');
import { kiemTraDuLieuCongKhai, phienCongKhai } from '../utils/du-lieu-cong-khai';
let io: Server | undefined;

function ganMayChu(mayChu: Server) {
  io = mayChu;
}

function phatSuKien(phong: string, ten: string, duLieu: unknown) {
  kiemTraDuLieuCongKhai(duLieu);

  return coSoDuLieu.sauKhiCommit(() => io?.to(phong).emit(ten, duLieu));
}

// Phòng chung mọi kết nối đều vào, để trang danh sách cũng thấy giá và trạng thái đổi.
const PHONG_DANH_SACH = 'danh-sach-phien';

function phienDauGia(banGhi, suKien = 'auction:bid-updated') {
  const duLieu = phienCongKhai(banGhi);

  kiemTraDuLieuCongKhai(duLieu);

  // Một socket ở cả hai phòng chỉ nhận một lần.
  return coSoDuLieu.sauKhiCommit(() =>
    io?.to([`auction:${banGhi.id}`, PHONG_DANH_SACH]).emit(suKien, duLieu),
  );
}

export { ganMayChu, phatSuKien, phienDauGia, PHONG_DANH_SACH };
