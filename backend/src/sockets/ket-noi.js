const { xacThucToken } = require('../middlewares/xac-thuc');
const kiemTra = require('../validators/du-lieu-dau-vao');
const { baoDam } = require('../utils/loi');
const cacPhienDauGia = require('../services/dau-gia');
const cacSuKien = require('./su-kien');
function khoiTao(io) {
  cacSuKien.ganMayChu(io);
  io.use(async (ketNoiSocket, tiepTheo) => {
    try {
      const maTruyCap = ketNoiSocket.handshake.auth?.token;
      if (maTruyCap) {
        ketNoiSocket.data.token = maTruyCap;
        ketNoiSocket.data.user = await xacThucToken(maTruyCap);
      }
      tiepTheo();
    } catch {
      tiepTheo(new Error('Phiên đăng nhập không hợp lệ'));
    }
  });
  io.on('connection', (ketNoiSocket) => {
    if (ketNoiSocket.data.user) ketNoiSocket.join(`user:${ketNoiSocket.data.user.id}`);
    let soYeuCau = 0,
      datLaiLuc = Date.now() + 60000;
    const kiemTraPhien = ketNoiSocket.data.token
      ? setInterval(async () => {
          try {
            await xacThucToken(ketNoiSocket.data.token);
          } catch {
            ketNoiSocket.disconnect(true);
          }
        }, 60000)
      : null;
    kiemTraPhien?.unref();
    ketNoiSocket.on('disconnect', () => {
      if (kiemTraPhien) clearInterval(kiemTraPhien);
    });
    ketNoiSocket.on('auction:join', async (noiDungToken, xacNhanNhan) => {
      try {
        if (Date.now() > datLaiLuc) {
          soYeuCau = 0;
          datLaiLuc = Date.now() + 60000;
        }
        baoDam(++soYeuCau <= 60, 429, 'Quá nhiều yêu cầu');
        const id = kiemTra.id(noiDungToken?.auctionId);
        const phongDauGia = `auction:${id}`;
        const soPhongDauGia = [...ketNoiSocket.rooms].filter((ten) =>
          ten.startsWith('auction:'),
        ).length;
        baoDam(
          ketNoiSocket.rooms.has(phongDauGia) || soPhongDauGia < 20,
          400,
          'Tối đa 20 phòng đấu giá',
        );
        if (ketNoiSocket.data.token) await xacThucToken(ketNoiSocket.data.token);
        const duLieu = await cacPhienDauGia.chiTiet(id);
        await ketNoiSocket.join(phongDauGia);
        if (typeof xacNhanNhan === 'function') xacNhanNhan({ success: true, data: duLieu });
      } catch (loi) {
        if (typeof xacNhanNhan === 'function')
          xacNhanNhan({
            success: false,
            message: loi.status ? loi.message : 'Không thể vào phòng đấu giá',
          });
      }
    });
    ketNoiSocket.on('auction:leave', async (noiDungToken, xacNhanNhan) => {
      try {
        const id = kiemTra.id(noiDungToken?.auctionId);
        await ketNoiSocket.leave(`auction:${id}`);
        if (typeof xacNhanNhan === 'function') xacNhanNhan({ success: true });
      } catch {
        if (typeof xacNhanNhan === 'function')
          xacNhanNhan({ success: false, message: 'ID phiên không hợp lệ' });
      }
    });
  });
}
module.exports = { khoiTao };
