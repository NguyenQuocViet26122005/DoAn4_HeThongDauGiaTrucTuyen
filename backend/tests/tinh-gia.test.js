const { test: kiemThu, after: sauKhi } = require('node:test');
const xacNhan = require('node:assert/strict');
const { tinhKetQuaDauGia, choPhepMuaNgay } = require('../dist/services/tinh-gia-tu-dong');
const { donViTienNho, chuoiTien } = require('../dist/utils/tien');
const { kiemTraDuLieuCongKhai } = require('../dist/utils/du-lieu-cong-khai');
const { buocGiaTaiMuc } = require('../dist/services/cau-hinh');
const { dongKetNoiMotLan } = require('./helpers/dong-ket-noi');

const cacBuocGia = [
  { gia_tu: '0', gia_den: '999999.99', muc_tang_gia: '50000', dang_hoat_dong: 1 },
  { gia_tu: '1000000', gia_den: '9999999.99', muc_tang_gia: '100000', dang_hoat_dong: 1 },
  { gia_tu: '10000000', gia_den: null, muc_tang_gia: '200000', dang_hoat_dong: 1 },
];
const phienDauGia = {
  gia_khoi_diem: '18000000',
  gia_hien_tai: '18000000',
  gia_san: null,
  nguoi_dan_dau_id: '1',
};
const gioiHan = (id, gia) => ({ nguoi_tra_gia_id: String(id), gia_toi_da: String(gia) });

kiemThu('B vượt A: chỉ hiển thị 20.2 triệu, không nhảy lên trần 22 triệu', () => {
  const ketQua = tinhKetQuaDauGia(phienDauGia, [gioiHan(1, 20000000)], '2', '22000000', cacBuocGia);
  xacNhan.equal(ketQua.winnerId, '2');
  xacNhan.equal(chuoiTien(ketQua.price), '20200000.00');
});

kiemThu('Bằng trần: giữ người dẫn đầu dù ID lớn hơn và cùng giây', () => {
  const hienTai = { ...phienDauGia, nguoi_dan_dau_id: '9' };
  const ketQua = tinhKetQuaDauGia(
    hienTai,
    [gioiHan(1, 19000000), gioiHan(9, 20000000)],
    '1',
    '20000000',
    cacBuocGia,
  );
  xacNhan.equal(ketQua.winnerId, '9');
  xacNhan.equal(chuoiTien(ketQua.price), '20000000.00');
});

kiemThu('Trần người mới thấp hơn: tự động trả cho người dẫn đầu', () => {
  const ketQua = tinhKetQuaDauGia(phienDauGia, [gioiHan(1, 22000000)], '2', '20000000', cacBuocGia);
  xacNhan.equal(ketQua.winnerId, '1');
  xacNhan.equal(chuoiTien(ketQua.price), '20200000.00');
});

kiemThu('Giá cuối bị chặn tại trần, kể cả khi bước giá vượt trần', () => {
  const ketQua = tinhKetQuaDauGia(phienDauGia, [gioiHan(1, 20000000)], '2', '20100000', cacBuocGia);
  xacNhan.equal(chuoiTien(ketQua.price), '20100000.00');
});

kiemThu('Người dẫn đầu nâng trần không tạo giá hoặc gia hạn giả', () => {
  const ketQua = tinhKetQuaDauGia(phienDauGia, [gioiHan(1, 20000000)], '1', '22000000', cacBuocGia);
  xacNhan.equal(ketQua.publicBids.length, 0);
  xacNhan.equal(ketQua.validPublicBid, false);
  xacNhan.equal(ketQua.price, donViTienNho(phienDauGia.gia_hien_tai));
});

kiemThu('Trần được nâng đủ giá sàn: giá đạt sàn nhưng không vượt trần', () => {
  const hienTai = { ...phienDauGia, gia_san: '23000000' };
  const ketQua = tinhKetQuaDauGia(hienTai, [gioiHan(1, 20000000)], '1', '22000000', cacBuocGia);
  xacNhan.equal(ketQua.price, donViTienNho('22000000'));
  xacNhan.equal(ketQua.validPublicBid, true);
});

kiemThu('Không giảm trần và không bỏ qua bước giá tối thiểu', () => {
  xacNhan.throws(
    () => tinhKetQuaDauGia(phienDauGia, [gioiHan(1, 22000000)], '1', '21000000', cacBuocGia),
    { status: 409 },
  );
  xacNhan.throws(
    () => tinhKetQuaDauGia(phienDauGia, [gioiHan(1, 22000000)], '2', '18000001', cacBuocGia),
    { status: 400 },
  );
});

kiemThu('Người đầu tiên trả giá khởi điểm hoặc giá sàn trong khả năng cam kết', () => {
  const rong = { ...phienDauGia, nguoi_dan_dau_id: null };
  xacNhan.equal(
    tinhKetQuaDauGia(rong, [], '1', '22000000', cacBuocGia).price,
    donViTienNho('18000000'),
  );
  xacNhan.equal(
    tinhKetQuaDauGia({ ...rong, gia_san: '20000000' }, [], '1', '22000000', cacBuocGia).price,
    donViTienNho('20000000'),
  );
});

kiemThu('Mua ngay tắt theo giá sàn hoặc lượt trả giá đầu', () => {
  const banDau = {
    cho_phep_mua_ngay: 1,
    gia_mua_ngay: '1000000',
    gia_san: null,
    tong_luot_tra_gia: 0,
  };
  xacNhan.equal(choPhepMuaNgay(banDau), true);
  xacNhan.equal(choPhepMuaNgay({ ...banDau, tong_luot_tra_gia: 1 }), false);
  xacNhan.equal(
    choPhepMuaNgay({ ...banDau, gia_san: '900000', tong_luot_tra_gia: 2, dat_gia_san: 0 }),
    true,
  );
  xacNhan.equal(choPhepMuaNgay({ ...banDau, gia_san: '900000', dat_gia_san: 1 }), false);
});

kiemThu('Tính tiền thập phân chính xác tới giới hạn DECIMAL(15,2)', () => {
  xacNhan.equal(chuoiTien(donViTienNho('0.10') + donViTienNho('0.20')), '0.30');
  xacNhan.equal(chuoiTien(donViTienNho('9999999999999.99')), '9999999999999.99');
  for (const khongHopLe of [-1, NaN, '1e6', '1.001', '10000000000000', {}, null]) {
    xacNhan.throws(() => donViTienNho(khongHopLe), { status: 400 });
  }
});

kiemThu('Khoảng bước giá có thiếu hoặc chồng lấn đều bị chặn', () => {
  xacNhan.equal(buocGiaTaiMuc(donViTienNho('1000000'), cacBuocGia), donViTienNho('100000'));
  xacNhan.throws(() => buocGiaTaiMuc(donViTienNho('1'), []), { status: 409 });
  xacNhan.throws(() => buocGiaTaiMuc(donViTienNho('1'), [cacBuocGia[0], cacBuocGia[0]]), {
    status: 409,
  });
});

kiemThu('Chặn trường nhạy cảm ở mọi cấp JSON, kể cả trong mảng', () => {
  xacNhan.throws(() => kiemTraDuLieuCongKhai({ result: [{ gia_toi_da: '1' }] }), { status: 500 });
  xacNhan.throws(() => kiemTraDuLieuCongKhai({ user: { mat_khau_bam: 'redacted' } }), {
    status: 500,
  });
  xacNhan.doesNotThrow(() =>
    kiemTraDuLieuCongKhai({ gia_hien_tai: '1000000', nguoi_dan_dau: 'ND-1' }),
  );
});

sauKhi(dongKetNoiMotLan);
