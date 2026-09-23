const { test: kiemThu, after: sauKhi } = require('node:test');
const xacNhan = require('node:assert/strict');
const http = require('node:http');
const { randomUUID: taoMaNgauNhien } = require('node:crypto');
const coSoDuLieu = require('../../dist/repositories/ket-noi');
const khoBanGhi = require('../../dist/repositories/ban-ghi');
const khoPhienDauGia = require('../../dist/repositories/dau-gia');
const khoDonHang = require('../../dist/repositories/don-hang');
const khoTuongTac = require('../../dist/repositories/tuong-tac');
const cacNguoiDung = require('../../dist/services/nguoi-dung');
const danhMucSanPham = require('../../dist/services/danh-muc-san-pham');
const cacPhienDauGia = require('../../dist/services/dau-gia');
const cacDonHang = require('../../dist/services/don-hang');
const cacTranhChap = require('../../dist/services/tranh-chap');
const tuongTac = require('../../dist/services/tuong-tac');
const cacDeNghi = require('../../dist/services/de-nghi-mua-tiep');
const { xacThucToken } = require('../../dist/middlewares/xac-thuc');
const { donViTienNho } = require('../../dist/utils/tien');
const { kiemTraDuLieuCongKhai } = require('../../dist/utils/du-lieu-cong-khai');
const thoiGian = require('../../dist/utils/thoi-gian');
const { taoDuLieuKiemThu, sanPham, phienDauGia, hoanTac } = require('../helpers/du-lieu-mau');

async function nguoiThang(duLieuKiemThu) {
  const id = await phienDauGia(duLieuKiemThu);
  await cacPhienDauGia.datGia(duLieuKiemThu.a, id, { gia_toi_da: '22000000' });
  await khoBanGhi.capNhat('phien_dau_gia', id, {
    thoi_gian_ket_thuc: thoiGian.congGiay(await coSoDuLieu.thoiGianHienTai(), -1),
  });
  await cacPhienDauGia.xuLyDenHan(id);
  return khoDonHang.donDangXuLyCuaPhien(id);
}

kiemThu('MySQL: toàn bộ kiểm thử nghiệp vụ được rollback', async (boKiemThu) => {
  const soLieuBanDau = await coSoDuLieu.layMot(
    "SELECT COUNT(*) AS total FROM nguoi_dung WHERE email LIKE 'test-%@example.invalid'",
  );

  await boKiemThu.test(
    'Đăng ký, bcrypt, JWT, trạng thái khóa và API từ chối người ngoài',
    async () =>
      hoanTac(async () => {
        const duLieuKiemThu = await taoDuLieuKiemThu();
        const daDangKy = await cacNguoiDung.dangKy({
          ho_ten: 'Test đăng ký',
          email: `test-${taoMaNgauNhien()}@example.invalid`,
          mat_khau: duLieuKiemThu.password,
        });
        xacNhan.equal(daDangKy.vai_tro, 'NGUOI_DUNG');
        kiemTraDuLieuCongKhai(daDangKy);
        const dangNhap = await cacNguoiDung.dangNhap({
          email: daDangKy.email,
          mat_khau: duLieuKiemThu.password,
        });
        xacNhan.equal((await xacThucToken(dangNhap.token)).id, daDangKy.id);
        await xacNhan.rejects(
          cacNguoiDung.dangNhap({ email: daDangKy.email, mat_khau: 'wrong-password' }),
          { status: 401 },
        );
        await cacNguoiDung.doiTrangThaiTaiKhoan(duLieuKiemThu.admin, daDangKy.id, {
          trang_thai_tai_khoan: 'BI_KHOA',
          ly_do: 'Kiểm thử',
        });
        await xacNhan.rejects(xacThucToken(dangNhap.token), { status: 403 });
        const donHang = await nguoiThang(duLieuKiemThu);
        await xacNhan.rejects(cacDonHang.chiTiet(duLieuKiemThu.outsider, donHang.id), {
          status: 403,
        });

        const hopLe = await cacNguoiDung.dangNhap({
          email: duLieuKiemThu.a.email,
          mat_khau: duLieuKiemThu.password,
        });
        const mayChu = http.createServer(require('../../dist/ung-dung'));
        await new Promise((giaiQuyet) => mayChu.listen(0, '127.0.0.1', giaiQuyet));
        try {
          const diaChiGoc = `http://127.0.0.1:${mayChu.address().port}/api`;
          const cacTieuDeHTTP = { Authorization: `Bearer ${hopLe.token}` };
          xacNhan.equal(
            (await fetch(`${diaChiGoc}/users/me`, { headers: cacTieuDeHTTP })).status,
            200,
          );
          xacNhan.equal(
            (await fetch(`${diaChiGoc}/admin/users`, { headers: cacTieuDeHTTP })).status,
            403,
          );
          xacNhan.equal(
            (await fetch(`${diaChiGoc}/orders/${donHang.id}`, { headers: cacTieuDeHTTP })).status,
            200,
          );
        } finally {
          await new Promise((giaiQuyet) => mayChu.close(giaiQuyet));
        }
      }),
  );

  await boKiemThu.test(
    'Địa chỉ có ownership và giữ ít nhất một địa chỉ khi đang cam kết',
    async () =>
      hoanTac(async () => {
        const duLieuKiemThu = await taoDuLieuKiemThu();
        const id = await phienDauGia(duLieuKiemThu);
        await cacPhienDauGia.datGia(duLieuKiemThu.a, id, { gia_toi_da: '22000000' });
        const diaChi = await require('../../dist/repositories/nguoi-dung').diaChiMacDinh(
          duLieuKiemThu.a.id,
        );
        await xacNhan.rejects(cacNguoiDung.xoaDiaChi(duLieuKiemThu.b, diaChi.id), { status: 403 });
        await xacNhan.rejects(cacNguoiDung.xoaDiaChi(duLieuKiemThu.a, diaChi.id), { status: 409 });
      }),
  );

  await boKiemThu.test(
    'Thuộc tính đúng danh mục, sản phẩm chưa duyệt không được đấu giá',
    async () =>
      hoanTac(async () => {
        const duLieuKiemThu = await taoDuLieuKiemThu();
        const thuocTinh = await danhMucSanPham.luuThuocTinh(
          duLieuKiemThu.admin,
          duLieuKiemThu.categoryId,
          null,
          { ten_thuoc_tinh: 'RAM', khoa_thuoc_tinh: 'ram', kieu_nhap: 'SO', bat_buoc: true },
        );
        const duLieu = {
          danh_muc_id: duLieuKiemThu.categoryId,
          tieu_de: 'Laptop kiểm thử',
          mo_ta: 'Sản phẩm kiểm thử',
          tinh_trang_san_pham: 'MOI',
          thuoc_tinh: [{ thuoc_tinh_id: thuocTinh.id, gia_tri: '16' }],
        };
        const phanTu = await danhMucSanPham.luuSanPham(duLieuKiemThu.seller, null, duLieu);
        xacNhan.equal(phanTu.thuoc_tinh[0].gia_tri, '16');
        await xacNhan.rejects(danhMucSanPham.luuSanPham(duLieuKiemThu.a, null, duLieu), {
          status: 403,
        });
        await xacNhan.rejects(danhMucSanPham.chiTiet(null, phanTu.id), { status: 404 });
        await xacNhan.rejects(
          danhMucSanPham.kiemTraGiaTriThuocTinh(duLieuKiemThu.categoryId, [], true),
          { status: 400 },
        );
        const thoiGianHienTai = await coSoDuLieu.thoiGianHienTai();
        await xacNhan.rejects(
          cacPhienDauGia.tao(duLieuKiemThu.seller, {
            san_pham_id: phanTu.id,
            gia_khoi_diem: '1000000',
            thoi_gian_bat_dau: thoiGian.doiThanhNgay(thoiGianHienTai).toISOString(),
            thoi_gian_ket_thuc: thoiGian
              .doiThanhNgay(thoiGian.congGiay(thoiGianHienTai, 3600))
              .toISOString(),
          }),
          { status: 409 },
        );
      }),
  );

  await boKiemThu.test(
    'Đấu giá tự động, cấm seller, bí mật đầu ra và gia hạn một lần cho một yêu cầu',
    async () =>
      hoanTac(async () => {
        const duLieuKiemThu = await taoDuLieuKiemThu();
        const ketThuc = thoiGian.congGiay(await coSoDuLieu.thoiGianHienTai(), 30);
        const id = await phienDauGia(duLieuKiemThu, { thoi_gian_ket_thuc: ketThuc });
        await xacNhan.rejects(
          cacPhienDauGia.datGia(duLieuKiemThu.seller, id, { gia_toi_da: '22000000' }),
          { status: 403 },
        );
        const dauTien = await cacPhienDauGia.datGia(duLieuKiemThu.a, id, {
          gia_toi_da: '20000000',
        });
        xacNhan.equal(
          thoiGian.doiThanhNgay(dauTien.thoi_gian_ket_thuc) - thoiGian.doiThanhNgay(ketThuc),
          90000,
        );
        kiemTraDuLieuCongKhai(dauTien);
        const thuHai = await cacPhienDauGia.datGia(duLieuKiemThu.b, id, { gia_toi_da: '22000000' });
        xacNhan.equal(thuHai.gia_hien_tai, '20200000.00');
        xacNhan.equal(thuHai.so_lan_gia_han, 1);
        xacNhan.equal(thuHai.nguoi_dan_dau, `ND-${duLieuKiemThu.b.id}`);
        kiemTraDuLieuCongKhai(await cacPhienDauGia.lichSu(id, {}));
        kiemTraDuLieuCongKhai(await cacPhienDauGia.danhSach(null, {}));
        const truocKhi = await khoPhienDauGia.layTheoId(id);
        await xacNhan.rejects(
          cacPhienDauGia.datGia(duLieuKiemThu.b, id, { gia_toi_da: '21000000' }),
          { status: 409 },
        );
        xacNhan.equal(
          (await khoPhienDauGia.layTheoId(id)).tong_luot_tra_gia,
          truocKhi.tong_luot_tra_gia,
        );
      }),
  );

  await boKiemThu.test(
    'Mua ngay kết thúc phiên, không tạo đơn trùng và chặn trả giá tiếp',
    async () =>
      hoanTac(async () => {
        const duLieuKiemThu = await taoDuLieuKiemThu();
        const id = await phienDauGia(duLieuKiemThu, {
          gia_mua_ngay: '24000000',
          cho_phep_mua_ngay: 1,
        });
        const ketQua = await cacPhienDauGia.muaNgay(duLieuKiemThu.a, id, {});
        xacNhan.equal(ketQua.phien.ly_do_ket_thuc, 'MUA_NGAY');
        xacNhan.equal(ketQua.don_hang.tong_tien, '24000000.00');
        await xacNhan.rejects(cacPhienDauGia.muaNgay(duLieuKiemThu.b, id, {}), { status: 409 });
        await xacNhan.rejects(
          cacPhienDauGia.datGia(duLieuKiemThu.b, id, { gia_toi_da: '25000000' }),
          { status: 409 },
        );
        await cacPhienDauGia.xuLyDenHan(id);
        xacNhan.equal((await khoDonHang.donHangCuaPhien(id)).length, 1);
      }),
  );

  await boKiemThu.test(
    'Mua ngay còn trước giá sàn, tắt khi đã đạt sàn hoặc có bid đầu không sàn',
    async () =>
      hoanTac(async () => {
        const duLieuKiemThu = await taoDuLieuKiemThu();
        const id = await phienDauGia(duLieuKiemThu, {
          gia_san: '23000000',
          gia_mua_ngay: '25000000',
          cho_phep_mua_ngay: 1,
        });
        xacNhan.equal(
          (await cacPhienDauGia.datGia(duLieuKiemThu.a, id, { gia_toi_da: '22000000' }))
            .cho_phep_mua_ngay,
          1,
        );
        xacNhan.equal(
          (await cacPhienDauGia.datGia(duLieuKiemThu.a, id, { gia_toi_da: '24000000' }))
            .cho_phep_mua_ngay,
          0,
        );
        const khongGiaSan = await phienDauGia(duLieuKiemThu, {
          gia_mua_ngay: '25000000',
          cho_phep_mua_ngay: 1,
        });
        await cacPhienDauGia.datGia(duLieuKiemThu.a, khongGiaSan, { gia_toi_da: '22000000' });
        await xacNhan.rejects(cacPhienDauGia.muaNgay(duLieuKiemThu.b, khongGiaSan, {}), {
          status: 409,
        });
      }),
  );

  await boKiemThu.test('Jobs mở phiên, không có bid hoặc chưa đạt sàn thì thất bại', async () =>
    hoanTac(async () => {
      const duLieuKiemThu = await taoDuLieuKiemThu();
      const id = await phienDauGia(duLieuKiemThu, { trang_thai: 'DA_LEN_LICH' });
      xacNhan.equal((await cacPhienDauGia.xuLyDenHan(id)).trang_thai, 'HOAT_DONG');
      await khoBanGhi.capNhat('phien_dau_gia', id, {
        thoi_gian_ket_thuc: thoiGian.congGiay(await coSoDuLieu.thoiGianHienTai(), -1),
      });
      xacNhan.equal((await cacPhienDauGia.xuLyDenHan(id)).ly_do_ket_thuc, 'KHONG_CO_TRA_GIA');
      const chuaDat = await phienDauGia(duLieuKiemThu, { gia_san: '24000000' });
      await cacPhienDauGia.datGia(duLieuKiemThu.a, chuaDat, { gia_toi_da: '22000000' });
      await khoBanGhi.capNhat('phien_dau_gia', chuaDat, {
        thoi_gian_ket_thuc: thoiGian.congGiay(await coSoDuLieu.thoiGianHienTai(), -1),
      });
      xacNhan.equal((await cacPhienDauGia.xuLyDenHan(chuaDat)).ly_do_ket_thuc, 'KHONG_DAT_GIA_SAN');
      xacNhan.equal(await khoDonHang.donDangXuLyCuaPhien(chuaDat), null);
    }),
  );

  await boKiemThu.test(
    'Thanh toán idempotent, gửi hàng, xác nhận và đánh giá hai chiều',
    async () =>
      hoanTac(async () => {
        const duLieuKiemThu = await taoDuLieuKiemThu();
        const donHang = await nguoiThang(duLieuKiemThu);
        await xacNhan.rejects(cacDonHang.thanhToan(duLieuKiemThu.outsider, donHang.id, {}), {
          status: 403,
        });
        await cacDonHang.thanhToan(duLieuKiemThu.a, donHang.id, {});
        await cacDonHang.thanhToan(duLieuKiemThu.a, donHang.id, {});
        xacNhan.equal((await khoDonHang.cacThanhToan(donHang.id)).length, 1);
        xacNhan.equal((await khoDonHang.tienTrungGian(donHang.id)).trang_thai, 'DANG_GIU');
        await cacDonHang.guiHang(duLieuKiemThu.seller, donHang.id, {
          don_vi_van_chuyen: 'Test',
          ma_van_don: 'TEST-1',
        });
        await xacNhan.rejects(cacDonHang.xacNhanDaGiao(duLieuKiemThu.seller, donHang.id), {
          status: 403,
        });
        await cacDonHang.xacNhanDaGiao(duLieuKiemThu.a, donHang.id);
        xacNhan.equal(
          (await cacDonHang.xacNhanHoanThanh(duLieuKiemThu.a, donHang.id)).trang_thai,
          'HOAN_THANH',
        );
        xacNhan.equal((await khoDonHang.tienTrungGian(donHang.id)).trang_thai, 'DA_GIAI_NGAN');
        await tuongTac.danhGiaDonHang(duLieuKiemThu.a, donHang.id, { so_sao: 5 });
        await tuongTac.danhGiaDonHang(duLieuKiemThu.seller, donHang.id, { so_sao: 4 });
        await xacNhan.rejects(tuongTac.danhGiaDonHang(duLieuKiemThu.a, donHang.id, { so_sao: 5 }), {
          status: 409,
        });
      }),
  );

  await boKiemThu.test('Tranh chấp giữ tiền, chặn tự giải ngân và từ chối hoàn một phần và hoàn toàn bộ', async () =>
    hoanTac(async () => {
      const duLieuKiemThu = await taoDuLieuKiemThu();
      const donHang = await nguoiThang(duLieuKiemThu);
      await cacDonHang.thanhToan(duLieuKiemThu.a, donHang.id, {});
      await cacDonHang.guiHang(duLieuKiemThu.seller, donHang.id, {
        don_vi_van_chuyen: 'Test',
        ma_van_don: 'TEST-2',
      });
      await cacDonHang.xacNhanDaGiao(duLieuKiemThu.a, donHang.id);
      const tranhChap = await cacTranhChap.mo(duLieuKiemThu.a, donHang.id, {
        ly_do: 'KHONG_DUNG_MO_TA',
        mo_ta: 'Kiểm thử tranh chấp',
      });
      await xacNhan.rejects(cacDonHang.xacNhanHoanThanh(duLieuKiemThu.a, donHang.id), {
        status: 409,
      });
      await khoBanGhi.capNhat('don_hang', donHang.id, {
        han_kiem_tra: thoiGian.congGiay(await coSoDuLieu.thoiGianHienTai(), -1),
      });
      await cacDonHang.xuLyDenHan(donHang.id);
      xacNhan.equal((await khoDonHang.tienTrungGian(donHang.id)).trang_thai, 'DANG_GIU');
      await cacTranhChap.phanHoiNguoiBan(duLieuKiemThu.seller, tranhChap.id, {
        phan_hoi_nguoi_ban: 'Phản hồi kiểm thử',
      });
      await cacTranhChap.tiepNhan(duLieuKiemThu.admin, tranhChap.id);
      await xacNhan.rejects(cacTranhChap.giaiQuyet(duLieuKiemThu.admin, tranhChap.id, {
        ket_qua: 'NGUOI_MUA', so_tien_hoan: '1000000', ket_qua_xu_ly: 'Không cho phép hoàn một phần',
      }), {status:400});
      await cacTranhChap.giaiQuyet(duLieuKiemThu.admin, tranhChap.id, {
        ket_qua: 'NGUOI_MUA', so_tien_hoan: donHang.tong_tien, ket_qua_xu_ly: 'Hoàn toàn bộ theo kiểm thử',
      });
      xacNhan.equal((await khoDonHang.tienTrungGian(donHang.id)).trang_thai, 'DA_HOAN_TIEN');
      xacNhan.equal((await khoBanGhi.layTheoId('don_hang', donHang.id)).trang_thai, 'DA_HUY');
      await xacNhan.rejects(
        cacTranhChap.giaiQuyet(duLieuKiemThu.admin, tranhChap.id, {
          ket_qua: 'NGUOI_BAN',
          so_tien_hoan: 0,
          ket_qua_xu_ly: 'Xử lý lại',
        }),
        { status: 409 },
      );
    }),
  );

  await boKiemThu.test('Tự hoàn thành khi hết hạn kiểm tra và không có tranh chấp', async () =>
    hoanTac(async () => {
      const duLieuKiemThu = await taoDuLieuKiemThu();
      const donHang = await nguoiThang(duLieuKiemThu);
      await cacDonHang.thanhToan(duLieuKiemThu.a, donHang.id, {});
      await cacDonHang.guiHang(duLieuKiemThu.seller, donHang.id, {
        don_vi_van_chuyen: 'Test',
        ma_van_don: 'TEST-3',
      });
      await cacDonHang.xacNhanDaGiao(duLieuKiemThu.a, donHang.id);
      await khoBanGhi.capNhat('don_hang', donHang.id, {
        han_kiem_tra: thoiGian.congGiay(await coSoDuLieu.thoiGianHienTai(), -1),
      });
      await cacDonHang.xuLyDenHan(donHang.id);
      await cacDonHang.xuLyDenHan(donHang.id);
      xacNhan.equal((await khoDonHang.tienTrungGian(donHang.id)).trang_thai, 'DA_GIAI_NGAN');
      await xacNhan.rejects(
        cacTranhChap.mo(duLieuKiemThu.a, donHang.id, { ly_do: 'KHAC', mo_ta: 'Quá hạn' }),
        { status: 409 },
      );
    }),
  );

  await boKiemThu.test(
    'Second Chance lấy giá công khai, không lấy trần bí mật; xác nhận tạo một đơn',
    async () =>
      hoanTac(async () => {
        const duLieuKiemThu = await taoDuLieuKiemThu();
        const id = await phienDauGia(duLieuKiemThu);
        await cacPhienDauGia.datGia(duLieuKiemThu.a, id, { gia_toi_da: '20000000' });
        await cacPhienDauGia.datGia(duLieuKiemThu.b, id, { gia_toi_da: '22000000' });
        // Tạo lịch sử kiểm thử có giá công khai khác mức tối đa đã lưu.
        const thoiGianHienTai = await coSoDuLieu.thoiGianHienTai();
        await khoBanGhi.them('luot_tra_gia', {
          phien_dau_gia_id: id,
          nguoi_tra_gia_id: duLieuKiemThu.a.id,
          so_tien: '19800000',
          loai_tra_gia: 'TRUC_TIEP',
          ngay_tao: thoiGian.congGiay(thoiGianHienTai, 1),
        });
        await khoBanGhi.capNhat('phien_dau_gia', id, {
          thoi_gian_ket_thuc: thoiGian.congGiay(thoiGianHienTai, 2),
        });
        // Dùng trạng thái chốt đã khóa để kiểm thử, không thay đổi đồng hồ máy chủ.
        await khoBanGhi.capNhat('phien_dau_gia', id, {
          trang_thai: 'DA_KET_THUC',
          ly_do_ket_thuc: 'CO_NGUOI_THANG',
        });
        const donHang = await cacDonHang.taoDonNguoiThang(
          await khoPhienDauGia.layTheoId(id),
          duLieuKiemThu.b.id,
          '20200000',
        );
        await khoBanGhi.capNhat('don_hang', donHang.id, {
          han_thanh_toan: thoiGian.congGiay(thoiGianHienTai, -1),
        });
        await cacDonHang.xuLyDenHan(donHang.id);
        await cacDonHang.xuLyDenHan(donHang.id);
        xacNhan.ok(await khoDonHang.viPhamCuaDon(donHang.id, 'KHONG_THANH_TOAN'));
        xacNhan.equal(await khoDonHang.deNghiDangCho(id), null);
        const deNghi = await cacDeNghi.tao(duLieuKiemThu.seller, donHang.id);
        xacNhan.equal(deNghi.gia_de_nghi, '19800000.00');
        xacNhan.equal(String(deNghi.nguoi_tra_gia_id), duLieuKiemThu.a.id);
        await cacDeNghi.phanHoiDeNghi(duLieuKiemThu.a, deNghi.id, { chap_nhan: true });
        await cacDeNghi.phanHoiDeNghi(duLieuKiemThu.a, deNghi.id, { chap_nhan: true });
        const tatCa = await khoDonHang.donHangCuaPhien(id);
        xacNhan.equal(tatCa.length, 2);
        xacNhan.equal(tatCa[1].nguon_don, 'DE_NGHI_TIEP_THEO');
        xacNhan.equal(tatCa[1].gia_san_pham, deNghi.gia_de_nghi);
      }),
  );

  await boKiemThu.test('Admin duyệt hủy phiên và thông báo không lặp', async () =>
    hoanTac(async () => {
      const duLieuKiemThu = await taoDuLieuKiemThu();
      const id = await phienDauGia(duLieuKiemThu);
      await cacPhienDauGia.datGia(duLieuKiemThu.a, id, { gia_toi_da: '22000000' });
      const yeuCauHuy = await cacPhienDauGia.guiYeuCauHuy(duLieuKiemThu.seller, id, {
        ly_do: 'Kiểm thử hủy',
      });
      await cacPhienDauGia.duyetHuyPhien(duLieuKiemThu.admin, yeuCauHuy.id, {
        trang_thai: 'DA_DUYET',
        ghi_chu_duyet: 'Duyệt hủy theo kiểm thử',
      });
      xacNhan.equal((await khoPhienDauGia.layTheoId(id)).trang_thai, 'DA_HUY');
      const cacThongBao = await khoTuongTac.danhSachThongBao(duLieuKiemThu.a.id, {
        limit: 100,
        offset: 0,
      });
      xacNhan.ok(cacThongBao.some((banGhi) => banGhi.loai === 'HUY_PHIEN'));
      await tuongTac.docThongBao(duLieuKiemThu.a, cacThongBao[0].id);
      await xacNhan.rejects(tuongTac.docThongBao(duLieuKiemThu.b, cacThongBao[0].id), {
        status: 403,
      });
    }),
  );

  xacNhan.equal(
    (
      await coSoDuLieu.layMot(
        "SELECT COUNT(*) AS total FROM nguoi_dung WHERE email LIKE 'test-%@example.invalid'",
      )
    ).total,
    soLieuBanDau.total,
  );
});

sauKhi(require('../helpers/dong-ket-noi').dongKetNoiMotLan);
