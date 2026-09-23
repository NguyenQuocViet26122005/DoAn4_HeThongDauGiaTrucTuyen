const { test: kiemThu, after: sauKhi } = require('node:test');
const xacNhan = require('node:assert/strict');
const http = require('node:http');
const { Server: MayChuSocket } = require('socket.io');
const coSoDuLieu = require('../../dist/repositories/ket-noi');
const khoBanGhi = require('../../dist/repositories/ban-ghi');
const khoPhien = require('../../dist/repositories/dau-gia');
const khoDon = require('../../dist/repositories/don-hang');
const dauGia = require('../../dist/services/dau-gia');
const donHang = require('../../dist/services/don-hang');
const tranhChap = require('../../dist/services/tranh-chap');
const thoiGian = require('../../dist/utils/thoi-gian');
const { kiemTraDuLieuCongKhai } = require('../../dist/utils/du-lieu-cong-khai');
const { taoDuLieuKiemThu, phienDauGia } = require('../helpers/du-lieu-mau');

// Kiểm thử đồng thời cần các kết nối nhìn thấy cùng dữ liệu đã commit.
// Hàm dọn chỉ xóa các bản ghi của tài khoản kiểm thử có tiền tố UUID riêng.
async function donDuLieuKiemThu(duLieu) {
  const cacId = ['admin', 'seller', 'a', 'b', 'outsider'].map((vaiTro) => duLieu[vaiTro].id);
  const choTrong = cacId.map(() => '?').join(',');
  await coSoDuLieu.giaoDich(async () => {
    const taiKhoan = await coSoDuLieu.truyVan(
      `SELECT id,email FROM nguoi_dung WHERE id IN (${choTrong})`,
      cacId,
    );
    xacNhan.equal(taiKhoan.length, cacId.length);
    xacNhan.ok(taiKhoan.every((banGhi) => banGhi.email.startsWith(`${duLieu.prefix}-`)));
    const nguoiBanId = duLieu.seller.id;
    const cacPhien = await coSoDuLieu.truyVan(
      'SELECT a.id FROM phien_dau_gia a JOIN san_pham p ON p.id=a.san_pham_id WHERE p.nguoi_ban_id=?',
      [nguoiBanId],
    );
    const cacDon = await coSoDuLieu.truyVan('SELECT id FROM don_hang WHERE nguoi_ban_id=?', [
      nguoiBanId,
    ]);
    for (const banGhi of cacDon) {
      await coSoDuLieu.truyVan(
        'DELETE b FROM tep_dinh_kem b JOIN tranh_chap t ON t.id=b.tranh_chap_id WHERE t.don_hang_id=?',
        [banGhi.id],
      );
      for (const bang of [
        'danh_gia',
        'tranh_chap',
        'thanh_toan',
      ]) {
        await coSoDuLieu.truyVan(`DELETE FROM ${bang} WHERE don_hang_id=?`, [banGhi.id]);
      }
      await coSoDuLieu.truyVan(
        "DELETE FROM nhat_ky_hoat_dong WHERE loai_doi_tuong='don_hang' AND doi_tuong_id=?",
        [banGhi.id],
      );
    }
    await coSoDuLieu.truyVan(`DELETE FROM vi_pham WHERE nguoi_dung_id IN (${choTrong})`, cacId);
    for (const banGhi of cacPhien) {
      await coSoDuLieu.truyVan('DELETE FROM de_nghi_mua_tiep_theo WHERE phien_dau_gia_id=?', [
        banGhi.id,
      ]);
      await coSoDuLieu.truyVan('DELETE FROM don_hang WHERE phien_dau_gia_id=?', [banGhi.id]);
      for (const bang of [
        'yeu_cau_xu_ly',
        'nhat_ky_hoat_dong',
        'luot_tra_gia',
        'tham_gia_phien',
      ]) {
        await coSoDuLieu.truyVan(`DELETE FROM ${bang} WHERE phien_dau_gia_id=?`, [banGhi.id]);
      }
      await coSoDuLieu.truyVan(
        "DELETE FROM nhat_ky_hoat_dong WHERE loai_doi_tuong='phien_dau_gia' AND doi_tuong_id=?",
        [banGhi.id],
      );
      await khoBanGhi.xoa('phien_dau_gia', banGhi.id);
    }
    await coSoDuLieu.truyVan('DELETE FROM san_pham WHERE nguoi_ban_id=?', [nguoiBanId]);
    await khoBanGhi.xoa('danh_muc', duLieu.categoryId);
    await coSoDuLieu.truyVan(
      `DELETE FROM nhat_ky_hoat_dong WHERE nguoi_thuc_hien_id IN (${choTrong})`,
      cacId,
    );
    for (const bang of ['thong_bao', 'dia_chi_nguoi_dung', 'xac_minh_nguoi_ban']) {
      await coSoDuLieu.truyVan(`DELETE FROM ${bang} WHERE nguoi_dung_id IN (${choTrong})`, cacId);
    }
    await coSoDuLieu.truyVan(`DELETE FROM nguoi_dung WHERE id IN (${choTrong})`, cacId);
  });
}

function taoKhachSocket(cong) {
  const ketNoi = new WebSocket(`ws://127.0.0.1:${cong}/socket.io/?EIO=4&transport=websocket`);
  const hangDoi = [];
  ketNoi.addEventListener('message', (suKien) => {
    const noiDung = String(suKien.data);
    if (noiDung === '2') ketNoi.send('3');
    else hangDoi.push(noiDung);
  });
  async function choTin(dieuKien) {
    const han = Date.now() + 5000;
    while (Date.now() < han) {
      const chiSo = hangDoi.findIndex(dieuKien);
      if (chiSo >= 0) return hangDoi.splice(chiSo, 1)[0];
      await new Promise((xong) => setTimeout(xong, 10));
    }
    throw new Error('Hết thời gian chờ sự kiện Socket.IO');
  }
  return { ketNoi, choTin };
}

kiemThu('MySQL nhiều kết nối: khóa đấu giá, chốt đơn, thanh toán và Socket.IO', async () => {
  const duLieu = await coSoDuLieu.giaoDich(taoDuLieuKiemThu);
  const mayChu = http.createServer(require('../../dist/ung-dung'));
  const io = new MayChuSocket(mayChu);
  require('../../dist/sockets/ket-noi').khoiTao(io);
  await new Promise((xong) => mayChu.listen(0, '127.0.0.1', xong));
  let khach;
  try {
    const phienId = await coSoDuLieu.giaoDich(() => phienDauGia(duLieu));
    khach = taoKhachSocket(mayChu.address().port);
    await khach.choTin((tin) => tin.startsWith('0'));
    khach.ketNoi.send('40');
    await khach.choTin((tin) => tin.startsWith('40'));
    khach.ketNoi.send(`421${JSON.stringify(['auction:join', { auctionId: phienId }])}`);
    const xacNhanPhong = JSON.parse((await khach.choTin((tin) => tin.startsWith('431'))).slice(3));
    xacNhan.equal(xacNhanPhong[0].success, true);
    kiemTraDuLieuCongKhai(xacNhanPhong);

    await Promise.all([
      dauGia.datGia(duLieu.a, phienId, { gia_toi_da: '22000000' }),
      dauGia.datGia(duLieu.b, phienId, { gia_toi_da: '22000000' }),
    ]);
    const phien = await khoPhien.layTheoId(phienId);
    const mucDauTien = (
      await coSoDuLieu.truyVan(
        'SELECT nguoi_dung_id AS nguoi_tra_gia_id FROM tham_gia_phien WHERE phien_dau_gia_id=? AND gia_toi_da IS NOT NULL ORDER BY thoi_gian_dat_gia_toi_da,id LIMIT 1',
        [phienId],
      )
    )[0];
    xacNhan.equal(String(phien.nguoi_dan_dau_id), String(mucDauTien.nguoi_tra_gia_id));
    xacNhan.equal(phien.gia_hien_tai, '22000000.00');
    const suKienGia = JSON.parse((await khach.choTin((tin) => tin.startsWith('42'))).slice(2));
    xacNhan.equal(suKienGia[0], 'auction:bid-updated');
    kiemTraDuLieuCongKhai(suKienGia[1]);
    xacNhan.ok(
      Number((await khoPhien.layTheoId(phienId)).gia_hien_tai) >= Number(suKienGia[1].gia_hien_tai),
    );

    await khoBanGhi.capNhat('phien_dau_gia', phienId, {
      thoi_gian_ket_thuc: thoiGian.congGiay(await coSoDuLieu.thoiGianHienTai(), -1),
    });
    await Promise.all([dauGia.xuLyDenHan(phienId), dauGia.xuLyDenHan(phienId)]);
    const cacDon = await khoDon.donHangCuaPhien(phienId);
    xacNhan.equal(cacDon.length, 1);
    const nguoiThang = String(cacDon[0].nguoi_mua_id) === duLieu.a.id ? duLieu.a : duLieu.b;
    await Promise.all([
      donHang.thanhToan(nguoiThang, cacDon[0].id, {}),
      donHang.thanhToan(nguoiThang, cacDon[0].id, {}),
    ]);
    xacNhan.equal((await khoDon.cacThanhToan(cacDon[0].id)).length, 1);

    await donHang.guiHang(duLieu.seller, cacDon[0].id, {
      don_vi_van_chuyen: 'Kiểm thử',
      ma_van_don: 'DONG-THOI',
    });
    await donHang.xacNhanDaGiao(nguoiThang, cacDon[0].id);
    const ketQua = await Promise.allSettled([
      tranhChap.mo(nguoiThang, cacDon[0].id, {
        ly_do: 'KHAC',
        mo_ta: 'Kiểm thử đồng thời với xác nhận hàng tốt',
      }),
      donHang.xacNhanHoanThanh(nguoiThang, cacDon[0].id),
    ]);
    xacNhan.equal(ketQua.filter((muc) => muc.status === 'fulfilled').length, 1);
    const trangThaiDon = (await khoBanGhi.layTheoId('don_hang', cacDon[0].id)).trang_thai;
    const trangThaiTien = (await khoDon.tienTrungGian(cacDon[0].id)).trang_thai;
    xacNhan.equal(trangThaiTien, trangThaiDon === 'DANG_TRANH_CHAP' ? 'DANG_GIU' : 'DA_GIAI_NGAN');

    const phienMuaNgay = await coSoDuLieu.giaoDich(() =>
      phienDauGia(duLieu, { gia_mua_ngay: '24000000', cho_phep_mua_ngay: 1 }),
    );
    const canhTranh = await Promise.allSettled([
      dauGia.datGia(duLieu.a, phienMuaNgay, { gia_toi_da: '22000000' }),
      dauGia.muaNgay(duLieu.b, phienMuaNgay, {}),
    ]);
    xacNhan.equal(canhTranh.filter((muc) => muc.status === 'fulfilled').length, 1);
  } finally {
    khach?.ketNoi.close();
    await new Promise((xong) => io.close(xong));
    await donDuLieuKiemThu(duLieu);
  }
});

sauKhi(require('../helpers/dong-ket-noi').dongKetNoiMotLan);
