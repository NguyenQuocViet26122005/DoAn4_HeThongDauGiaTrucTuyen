const coSoDuLieu = require('../repositories/ket-noi');
const { kiemTraDuLieuCongKhai, phienCongKhai } = require('../utils/du-lieu-cong-khai');
let io;
function ganMayChu(mayChu) {
  io = mayChu;
}
function phatSuKien(phong, ten, duLieu) {
  kiemTraDuLieuCongKhai(duLieu);
  return coSoDuLieu.sauKhiCommit(() => io?.to(phong).emit(ten, duLieu));
}
function phienDauGia(banGhi, suKien = 'auction:bid-updated') {
  return phatSuKien(`auction:${banGhi.id}`, suKien, phienCongKhai(banGhi));
}
module.exports = { ganMayChu, phatSuKien, phienDauGia };
