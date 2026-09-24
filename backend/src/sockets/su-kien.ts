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


function phienDauGia(banGhi, suKien = 'auction:bid-updated') {
  return phatSuKien(`auction:${banGhi.id}`, suKien, phienCongKhai(banGhi));
}


export {
 ganMayChu, phatSuKien, phienDauGia 
};
