const { test: kiemThu, after: sauKhi } = require('node:test');
const xacNhan = require('node:assert/strict');
const http = require('node:http');
const tepTin = require('node:fs/promises');
const duongDan = require('node:path');
const coSoDuLieu = require('../../dist/repositories/ket-noi');
const khoBanGhi = require('../../dist/repositories/ban-ghi');
const khoDonHang = require('../../dist/repositories/don-hang');
const dauGia = require('../../dist/services/dau-gia');
const thoiGian = require('../../dist/utils/thoi-gian');
const { cauHinh } = require('../../dist/config/moi-truong');
const { kiemTraDuLieuCongKhai } = require('../../dist/utils/du-lieu-cong-khai');
const { taoDuLieuKiemThu, hoanTac } = require('../helpers/du-lieu-mau');

// Đối chiếu với route thật để không nhầm số lần gọi HTTP với số API đã kiểm tra.
async function cacRouteHienCo() {
  const thuMuc = duongDan.join(__dirname, '../../src/routes');
  const ketQua = ['GET /health', 'GET /admin/jobs'];

  for (const ten of await tepTin.readdir(thuMuc)) {
    const noiDung = await tepTin.readFile(duongDan.join(thuMuc, ten), 'utf8');

    for (const khop of noiDung.matchAll(
      /boDinhTuyen\.(get|post|put|patch|delete)\(\s*'([^']+)'/g,
    )) {
      ketQua.push(`${khop[1].toUpperCase()} ${khop[2]}`);
    }
  }

  return [...new Set(ketQua)].sort(
    (a, b) => (a.match(/:/g) || []).length - (b.match(/:/g) || []).length,
  );
}

kiemThu(
  'HTTP: tất cả API có kịch bản thành công và kiểm tra quyền; dữ liệu được rollback',
  async (boKiemThu) => {
    const cacRoute = await cacRouteHienCo();
    const daThanhCong = new Set();
    const cacTepDaTao = [];
    let soYeuCau = 0;
    let soLoiMongDoi = 0;
    const demTaiKhoan = async () =>
      (
        await coSoDuLieu.layMot(
          "SELECT COUNT(*) AS so_luong FROM nguoi_dung WHERE email LIKE 'test-%@example.invalid'",
        )
      ).so_luong;
    const soLuongBanDau = await demTaiKhoan();

    try {
      await hoanTac(async () => {
        const duLieu = await taoDuLieuKiemThu();
        const ma = {};
        const mayChu = http.createServer(require('../../dist/ung-dung'));

        await new Promise((xong) => mayChu.listen(0, '127.0.0.1', xong));

        const diaChiGoc = `http://127.0.0.1:${mayChu.address().port}`;

        async function gui(phuongThuc, url, vaiTro, noiDung, trangThai = 200) {
          const bieuMau = noiDung instanceof FormData;
          const phanHoi = await fetch(`${diaChiGoc}/api${url}`, {
            method: phuongThuc,
            headers: {
              ...(vaiTro ? { Authorization: `Bearer ${ma[vaiTro]}` } : {}),
              ...(!bieuMau && noiDung !== undefined ? { 'Content-Type': 'application/json' } : {}),
            },
            body: noiDung === undefined ? undefined : bieuMau ? noiDung : JSON.stringify(noiDung),
            signal: AbortSignal.timeout(10000),
          });

          soYeuCau++;
          // Không in body/token/mật khẩu nếu assertion thất bại.
          xacNhan.equal(phanHoi.status, trangThai, `${phuongThuc} ${url}`);

          const laJSON = phanHoi.headers.get('content-type')?.includes('application/json');
          const ketQua = laJSON ? await phanHoi.json() : await phanHoi.arrayBuffer();

          if (laJSON) {
            xacNhan.equal(ketQua.success, trangThai < 400, `${phuongThuc} ${url}: success`);
            kiemTraDuLieuCongKhai(ketQua);
          }
          if (trangThai < 400) {
            const duongDanAPI = url.split('?')[0];
            const tenRoute = cacRoute.find((route) => {
              const [cach, mau] = route.split(' ');

              return (
                cach === phuongThuc &&
                new RegExp('^' + mau.replace(/:\w+/g, '[^/]+') + '$').test(duongDanAPI)
              );
            });

            xacNhan.ok(tenRoute, `Không tìm thấy route đã gọi: ${phuongThuc} ${duongDanAPI}`);
            daThanhCong.add(tenRoute);
          } else {
            soLoiMongDoi++;
          }

          return laJSON ? ketQua.data : ketQua;
        }

        async function taiAnh(nhom, vaiTro) {
          const anh = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z8f8AAAAASUVORK5CYII=',
            'base64',
          );
          const bieuMau = new FormData();

          bieuMau.set('file', new Blob([anh], { type: 'image/png' }), 'kiem-thu.png');

          const tep = await gui('POST', `/uploads/${nhom}`, vaiTro, bieuMau, 201);
          const tuyetDoi = duongDan.resolve(
            cauHinh.uploadRoot,
            tep.duong_dan.replace('/api/uploads/files/', ''),
          );

          xacNhan.ok(tuyetDoi.startsWith(duongDan.resolve(cauHinh.uploadRoot) + duongDan.sep));
          cacTepDaTao.push(tuyetDoi);

          return tep.duong_dan;
        }

        let danhMuc, thuocTinh, sanPham, phien, don, donTranhChap, anhSanPham, diaChiMoi;
        const noiDungDiaChi = {
          ten_nguoi_nhan: 'Người nhận kiểm thử',
          sdt_nguoi_nhan: '0900000000',
          tinh_thanh: 'Kiểm thử',
          quan_huyen: 'Kiểm thử',
          phuong_xa: 'Kiểm thử',
          dia_chi_chi_tiet: 'Địa chỉ kiểm thử HTTP',
          la_mac_dinh: true,
        };
        const noiDungSanPham = () => ({
          danh_muc_id: danhMuc.id,
          tieu_de: 'Sản phẩm kiểm thử HTTP',
          mo_ta: 'Mô tả kiểm thử',
          tinh_trang_san_pham: 'MOI',
          thuoc_tinh: [{ thuoc_tinh_id: thuocTinh.id, gia_tri: '16' }],
        });

        async function taoPhienMoi() {
          const sp = await gui('POST', '/products', 'seller', noiDungSanPham(), 201);

          await gui(
            'POST',
            `/products/${sp.id}/images`,
            'seller',
            { duong_dan_anh: anhSanPham },
            201,
          );
          await gui('POST', `/products/${sp.id}/submit`, 'seller', {});
          await gui('PATCH', `/admin/products/${sp.id}/review`, 'admin', {
            trang_thai_duyet: 'DA_DUYET',
          });

          return taoPhienChoSanPham(sp.id);
        }

        async function taoPhienChoSanPham(sanPhamId, soGiay = 3600) {
          const hienTai = await coSoDuLieu.thoiGianHienTai();

          return gui(
            'POST',
            '/auctions',
            'seller',
            {
              san_pham_id: sanPhamId,
              gia_khoi_diem: '18000000',
              gia_mua_ngay: '25000000',
              thoi_gian_bat_dau: thoiGian.doiThanhNgay(hienTai).toISOString(),
              thoi_gian_ket_thuc: thoiGian
                .doiThanhNgay(thoiGian.congGiay(hienTai, soGiay))
                .toISOString(),
            },
            201,
          );
        }

        // Chỉ điều chỉnh mốc của dữ liệu kiểm thử để không phải chờ hàng giờ/ngày.
        async function chotPhien(phienId) {
          await khoBanGhi.capNhat('phien_dau_gia', phienId, {
            thoi_gian_ket_thuc: await coSoDuLieu.thoiGianHienTai(),
          });

          await dauGia.xuLyDenHan(phienId);

          return khoDonHang.donDangXuLyCuaPhien(phienId);
        }

        try {
          await boKiemThu.test(
            'Health, đăng ký/đăng nhập, hồ sơ, địa chỉ, token và trạng thái khóa',
            async () => {
              xacNhan.equal((await fetch(diaChiGoc)).status, 200);
              await gui('GET', '/health');
              await gui('GET', '/users/me', null, undefined, 401);
              await gui('POST', '/auth/register', null, { vai_tro: 'QUAN_TRI' }, 400);

              const dangKy = {
                ho_ten: 'Kiểm thử đăng ký API',
                email: `${duLieu.prefix}-http@example.invalid`,
                mat_khau: duLieu.password,
              };
              const daDangKy = await gui('POST', '/auth/register', null, dangKy, 201);

              xacNhan.equal(daDangKy.vai_tro, 'NGUOI_DUNG');
              await gui('POST', '/auth/register', null, dangKy, 409);
              for (const vaiTro of ['admin', 'seller', 'a', 'b', 'outsider']) {
                const ketQua = await gui('POST', '/auth/login', null, {
                  email: duLieu[vaiTro].email,
                  mat_khau: duLieu.password,
                });

                ma[vaiTro] = ketQua.token;
              }
              await gui(
                'POST',
                '/auth/login',
                null,
                { email: duLieu.a.email, mat_khau: 'khong-dung' },
                401,
              );
              await gui('GET', '/admin/users', 'a', undefined, 403);
              await gui('GET', '/admin/users?q=' + encodeURIComponent(duLieu.prefix), 'admin');
              await gui('PATCH', `/admin/users/${duLieu.outsider.id}/status`, 'admin', {
                trang_thai_tai_khoan: 'BI_KHOA',
                ly_do: 'Kiểm thử khóa',
              });
              await gui('GET', '/users/me', 'outsider', undefined, 403);
              await gui('PATCH', `/admin/users/${duLieu.outsider.id}/status`, 'admin', {
                trang_thai_tai_khoan: 'HOAT_DONG',
                ly_do: 'Kết thúc kiểm thử khóa',
              });
              xacNhan.equal((await gui('GET', '/users/me', 'a')).id, duLieu.a.id);

              const avatar = await taiAnh('avatar', 'a');

              await gui('PATCH', '/users/me', 'a', {
                ho_ten: 'Người mua thử API',
                anh_dai_dien: avatar,
              });

              const dc = await gui('POST', '/users/me/addresses', 'a', noiDungDiaChi, 201);

              diaChiMoi = await gui('PUT', `/users/me/addresses/${dc.id}`, 'a', noiDungDiaChi);
              await gui('PUT', `/users/me/addresses/${dc.id}`, 'b', noiDungDiaChi, 403);

              const dcBo = await gui(
                'POST',
                '/users/me/addresses',
                'a',
                { ...noiDungDiaChi, la_mac_dinh: false },
                201,
              );

              await gui('DELETE', `/users/me/addresses/${dcBo.id}`, 'a');

              const cacDiaChi = await gui('GET', '/users/me/addresses', 'a');

              xacNhan.ok(cacDiaChi.some((x) => String(x.id) === String(dc.id)));
            },
          );

          await boKiemThu.test(
            'Xác minh người bán, tải tệp và bảo vệ giấy tờ riêng tư',
            async () => {
              const anh = await taiAnh('verification', 'outsider');

              await gui('GET', anh.replace('/api', ''), null, undefined, 401);
              await gui('GET', anh.replace('/api', ''), 'b', undefined, 403);
              xacNhan.ok((await gui('GET', anh.replace('/api', ''), 'admin')).byteLength > 0);

              const hoSo = await gui(
                'POST',
                '/seller-verifications',
                'outsider',
                {
                  loai_giay_to: 'CCCD',
                  so_giay_to: 'KIEM-THU',
                  anh_mat_truoc: anh,
                  anh_mat_sau: anh,
                  anh_selfie: anh,
                  ten_ngan_hang: 'Kiểm thử',
                  so_tai_khoan: '000000',
                  chu_tai_khoan: 'KIEM THU',
                },
                201,
              );

              await gui('GET', '/seller-verifications/me', 'outsider');
              await gui('GET', '/admin/seller-verifications', 'admin');
              await gui(
                'PATCH',
                `/admin/seller-verifications/${hoSo.id}/review`,
                'a',
                { trang_thai: 'DA_XAC_MINH' },
                403,
              );
              await gui('PATCH', `/admin/seller-verifications/${hoSo.id}/review`, 'admin', {
                trang_thai: 'DA_XAC_MINH',
              });
            },
          );

          await boKiemThu.test(
            'Danh mục, thuộc tính, sản phẩm, ảnh, gửi duyệt và ownership',
            async () => {
              const noiDung = { ten: duLieu.prefix, duong_dan: `${duLieu.prefix}-api` };

              danhMuc = await gui('POST', '/admin/categories', 'admin', noiDung, 201);
              await gui('PUT', `/admin/categories/${danhMuc.id}`, 'admin', {
                ...noiDung,
                mo_ta: 'Cập nhật qua HTTP',
              });
              await gui('GET', '/categories');
              await gui('GET', '/admin/categories', 'admin');

              const ndThuocTinh = {
                ten_thuoc_tinh: 'RAM',
                khoa_thuoc_tinh: 'ram',
                kieu_nhap: 'SO',
                bat_buoc: true,
              };

              thuocTinh = await gui(
                'POST',
                `/admin/categories/${danhMuc.id}/attributes`,
                'admin',
                ndThuocTinh,
                201,
              );
              await gui(
                'PUT',
                `/admin/categories/${danhMuc.id}/attributes/${thuocTinh.id}`,
                'admin',
                { ...ndThuocTinh, don_vi: 'GB' },
              );
              await gui('GET', `/categories/${danhMuc.id}/attributes`);
              await gui('POST', '/products', 'a', noiDungSanPham(), 403);
              sanPham = await gui('POST', '/products', 'seller', noiDungSanPham(), 201);
              await gui('GET', `/products/${sanPham.id}`, null, undefined, 404);
              await gui('PUT', `/products/${sanPham.id}`, 'seller', {
                ...noiDungSanPham(),
                tieu_de: 'Đã sửa qua HTTP',
              });
              await gui('PUT', `/products/${sanPham.id}`, 'outsider', noiDungSanPham(), 403);
              anhSanPham = await taiAnh('product', 'seller');

              const anhBo = await gui(
                'POST',
                `/products/${sanPham.id}/images`,
                'seller',
                { duong_dan_anh: anhSanPham },
                201,
              );

              await gui('DELETE', `/products/${sanPham.id}/images/${anhBo.id}`, 'seller');
              await gui('POST', `/products/${sanPham.id}/submit`, 'seller', {}, 400);
              await gui(
                'POST',
                `/products/${sanPham.id}/images`,
                'seller',
                { duong_dan_anh: anhSanPham },
                201,
              );
              await gui('POST', `/products/${sanPham.id}/submit`, 'seller', {});
              await gui('GET', '/products/mine', 'seller');
              await gui('GET', '/admin/products?trang_thai=CHO_XU_LY', 'admin');
              await gui('PATCH', `/admin/products/${sanPham.id}/review`, 'admin', {
                trang_thai_duyet: 'DA_DUYET',
              });
              await gui('GET', `/products/${sanPham.id}`);
              await gui('GET', `/products?danh_muc_id=${danhMuc.id}`);
            },
          );

          await boKiemThu.test(
            'Đấu giá tự động, gia hạn, theo dõi và Admin duyệt hủy',
            async () => {
              phien = await taoPhienChoSanPham(sanPham.id, 30);
              await gui(
                'POST',
                `/auctions/${phien.id}/bids`,
                'seller',
                { gia_toi_da: '20000000' },
                403,
              );

              const dauTien = await gui('POST', `/auctions/${phien.id}/bids`, 'a', {
                gia_toi_da: '20000000',
              });

              xacNhan.equal(dauTien.so_lan_gia_han, 1);

              const thuHai = await gui('POST', `/auctions/${phien.id}/bids`, 'b', {
                gia_toi_da: '22000000',
              });

              xacNhan.equal(thuHai.gia_hien_tai, '20200000.00');
              await gui('POST', `/auctions/${phien.id}/buy-now`, 'b', {}, 409);
              await gui('GET', `/auctions/${phien.id}/bids`);
              await gui('GET', `/auctions/${phien.id}`);
              await gui('GET', `/auctions?danh_muc_id=${danhMuc.id}`);
              await gui('GET', '/auctions/mine', 'seller');
              await gui('GET', '/auctions/my-bids', 'a');
              await gui('GET', '/admin/auctions', 'admin');
              await gui('GET', '/bid-increments');
              await gui('POST', `/watchlist/${phien.id}`, 'a', {});
              xacNhan.ok(
                (await gui('GET', '/watchlist', 'a')).some(
                  (x) => String(x.id) === String(phien.id),
                ),
              );
              await gui('DELETE', `/watchlist/${phien.id}`, 'a');

              const phienHuy = await taoPhienMoi();
              const yc = await gui(
                'POST',
                `/auctions/${phienHuy.id}/cancellation-requests`,
                'seller',
                { ly_do: 'Kiểm thử hủy' },
                201,
              );

              await gui('GET', '/admin/cancellation-requests', 'admin');
              await gui('PATCH', `/admin/cancellation-requests/${yc.id}/review`, 'admin', {
                trang_thai: 'DA_DUYET',
                ghi_chu_duyet: 'Duyệt hủy kiểm thử',
              });
              xacNhan.equal((await gui('GET', `/auctions/${phienHuy.id}`)).trang_thai, 'DA_HUY');
            },
          );

          await boKiemThu.test(
            'Đơn, thanh toán lặp, vận chuyển, xác nhận và đánh giá hai chiều',
            async () => {
              don = await chotPhien(phien.id);
              await gui('GET', '/orders', 'b');
              await gui('GET', '/admin/orders', 'admin');
              await gui('GET', `/orders/${don.id}`, 'outsider', undefined, 403);

              const dcNguoiThang = (await gui('GET', '/users/me/addresses', 'b'))[0];

              await gui(
                'PATCH',
                `/orders/${don.id}/address`,
                'b',
                { dia_chi_id: diaChiMoi.id },
                403,
              );
              await gui('PATCH', `/orders/${don.id}/address`, 'b', { dia_chi_id: dcNguoiThang.id });
              await gui('POST', `/orders/${don.id}/payments/simulate`, 'a', {}, 403);
              await gui('POST', `/orders/${don.id}/payments/simulate`, 'b', { so_tien: 1 }, 400);
              await gui('POST', `/orders/${don.id}/payments/simulate`, 'b', {});
              await gui('POST', `/orders/${don.id}/payments/simulate`, 'b', {});
              xacNhan.equal((await gui('GET', `/orders/${don.id}`, 'b')).thanh_toan.length, 1);
              await gui('POST', `/orders/${don.id}/shipping`, 'seller', {
                don_vi_van_chuyen: 'Kiểm thử',
                ma_van_don: 'HTTP-1',
              });
              await gui('POST', `/orders/${don.id}/delivered`, 'seller', {}, 403);
              await gui('POST', `/orders/${don.id}/delivered`, 'b', {});
              await gui('POST', `/orders/${don.id}/confirm`, 'b', {});

              const chiTiet = await gui('GET', `/orders/${don.id}`, 'b');

              xacNhan.equal(chiTiet.trang_thai, 'HOAN_THANH');
              xacNhan.equal(chiTiet.giu_tien.trang_thai, 'DA_GIAI_NGAN');
              await gui('POST', `/orders/${don.id}/reviews`, 'b', { so_sao: 5 }, 201);
              await gui('POST', `/orders/${don.id}/reviews`, 'seller', { so_sao: 4 }, 201);
              await gui('POST', `/orders/${don.id}/reviews`, 'b', { so_sao: 5 }, 409);
              xacNhan.ok((await gui('GET', `/users/${duLieu.seller.id}/reviews`)).length > 0);
            },
          );

          await boKiemThu.test(
            'Mua ngay, tranh chấp, bằng chứng riêng tư và hoàn tiền toàn bộ',
            async () => {
              const phienMuaNgay = await taoPhienMoi();

              donTranhChap = (await gui('POST', `/auctions/${phienMuaNgay.id}/buy-now`, 'a', {}))
                .don_hang;
              await gui('POST', `/orders/${donTranhChap.id}/payments/simulate`, 'a', {});
              await gui('POST', `/orders/${donTranhChap.id}/shipping`, 'seller', {
                don_vi_van_chuyen: 'Kiểm thử',
                ma_van_don: 'HTTP-2',
              });
              await gui('POST', `/orders/${donTranhChap.id}/delivered`, 'a', {});

              const tc = await gui(
                'POST',
                `/orders/${donTranhChap.id}/disputes`,
                'a',
                { ly_do: 'KHONG_DUNG_MO_TA', mo_ta: 'Kiểm thử tranh chấp HTTP' },
                201,
              );

              await gui('POST', `/orders/${donTranhChap.id}/confirm`, 'a', {}, 409);
              await gui('GET', '/disputes', 'a');
              await gui('GET', '/admin/disputes', 'admin');
              await gui('GET', `/disputes/${tc.id}`, 'outsider', undefined, 403);

              const bangChung = await taiAnh('evidence', 'a');

              await gui(
                'POST',
                `/disputes/${tc.id}/evidence`,
                'a',
                { duong_dan_tep: bangChung, mo_ta: 'Ảnh kiểm thử' },
                201,
              );
              xacNhan.ok(
                (await gui('GET', bangChung.replace('/api', ''), 'seller')).byteLength > 0,
              );
              await gui('POST', `/disputes/${tc.id}/response`, 'seller', {
                phan_hoi_nguoi_ban: 'Phản hồi kiểm thử',
              });
              await gui('POST', `/admin/disputes/${tc.id}/take`, 'admin', {});

              const nd = {
                ket_qua: 'NGUOI_MUA',
                so_tien_hoan: donTranhChap.tong_tien,
                ket_qua_xu_ly: 'Hoàn toàn bộ',
              };

              await gui('POST', `/admin/disputes/${tc.id}/resolve`, 'a', nd, 403);
              await gui('POST', `/admin/disputes/${tc.id}/resolve`, 'admin', nd);
              await gui('POST', `/admin/disputes/${tc.id}/resolve`, 'admin', nd, 409);
              xacNhan.equal(
                (await gui('GET', `/disputes/${tc.id}`, 'a')).so_tien_hoan,
                donTranhChap.tong_tien,
              );
              xacNhan.equal(
                (await gui('GET', `/orders/${donTranhChap.id}`, 'a')).giu_tien.trang_thai,
                'DA_HOAN_TIEN',
              );
            },
          );

          await boKiemThu.test(
            'Second Chance: tạo, xem, chấp nhận bằng giá công khai',
            async () => {
              const phienTiep = await taoPhienMoi();

              await gui('POST', `/auctions/${phienTiep.id}/bids`, 'a', { gia_toi_da: '20000000' });
              await gui('POST', `/auctions/${phienTiep.id}/bids`, 'b', { gia_toi_da: '22000000' });

              const donGoc = await chotPhien(phienTiep.id);

              // Tạo trạng thái đầu vào riêng cho API đề nghị; job hủy/vi phạm đã có bài tích hợp khác.
              await khoBanGhi.capNhat('don_hang', donGoc.id, {
                trang_thai: 'DA_HUY',
                ly_do_huy: 'KHONG_THANH_TOAN',
              });

              const deNghi = await gui(
                'POST',
                `/orders/${donGoc.id}/second-chance`,
                'seller',
                {},
                201,
              );

              xacNhan.equal(deNghi.gia_de_nghi, '20000000.00');
              await gui('GET', '/second-chances', 'a');
              await gui('GET', `/second-chances/${deNghi.id}`, 'a');
              await gui(
                'POST',
                `/second-chances/${deNghi.id}/respond`,
                'b',
                { chap_nhan: true },
                403,
              );

              const chapNhan = await gui('POST', `/second-chances/${deNghi.id}/respond`, 'a', {
                chap_nhan: true,
              });

              xacNhan.equal(chapNhan.don_hang.gia_san_pham, deNghi.gia_de_nghi);

              const lapLai = await gui('POST', `/second-chances/${deNghi.id}/respond`, 'a', {
                chap_nhan: true,
              });

              xacNhan.equal(lapLai.don_hang.id, chapNhan.don_hang.id);
            },
          );

          await boKiemThu.test(
            'Thông báo, vi phạm, cấu hình, bước giá, thống kê và trạng thái jobs',
            async () => {
              const thongBao = await gui('GET', '/notifications?unread=true', 'a');

              xacNhan.ok(thongBao.length > 0);
              await gui('GET', '/notifications/unread-count', 'a');
              await gui('PATCH', `/notifications/${thongBao[0].id}/read`, 'b', {}, 403);
              await gui('PATCH', `/notifications/${thongBao[0].id}/read`, 'a', {});
              await gui('PATCH', '/notifications/read-all', 'a', {});
              xacNhan.equal(
                Number((await gui('GET', '/notifications/unread-count', 'a')).chua_doc),
                0,
              );

              const viPham = await gui(
                'POST',
                '/admin/violations',
                'admin',
                {
                  nguoi_dung_id: duLieu.a.id,
                  loai_vi_pham: 'KHAC',
                  mo_ta: 'Vi phạm kiểm thử',
                  diem_vi_pham: 1,
                },
                201,
              );

              await gui('PATCH', `/admin/violations/${viPham.id}/review`, 'admin', {
                trang_thai: 'DA_XAC_NHAN',
              });
              await gui('GET', '/violations/me', 'a');
              await gui('GET', '/admin/violations', 'admin');
              await gui('GET', '/admin/config', 'admin');
              await gui('PUT', '/admin/config/PAYMENT_DEADLINE_HOURS', 'admin', {
                gia_tri_cau_hinh: 48,
              });

              const cacBuoc = await gui('GET', '/bid-increments');
              // Các phiên kiểm thử đã chốt/hủy; chỉ phiên tạo bởi bài này được đóng trước khi đổi cấu hình.
              const dangMo = await coSoDuLieu.truyVan(
                "SELECT a.id FROM phien_dau_gia a JOIN san_pham p ON p.id=a.san_pham_id WHERE p.nguoi_ban_id=? AND a.trang_thai IN ('DA_LEN_LICH','HOAT_DONG')",
                [duLieu.seller.id],
              );

              if (dangMo.length) {
                await gui(
                  'PUT',
                  '/admin/bid-increments',
                  'admin',
                  {
                    buoc_gia: cacBuoc.map(({ gia_tu, gia_den, muc_tang_gia }) => ({
                      gia_tu,
                      gia_den,
                      muc_tang_gia,
                    })),
                  },
                  409,
                );
                for (const p of dangMo) {
                  await chotPhien(p.id);
                }
              }
              await gui('PUT', '/admin/bid-increments', 'admin', {
                buoc_gia: cacBuoc.map(({ gia_tu, gia_den, muc_tang_gia }) => ({
                  gia_tu,
                  gia_den,
                  muc_tang_gia,
                })),
              });
              await gui('GET', '/admin/statistics', 'admin');
              await gui('GET', '/admin/activity-logs', 'admin');
              await gui('GET', '/admin/jobs', 'admin');
            },
          );

          const chuaKiemTra = cacRoute.filter((route) => !daThanhCong.has(route));

          xacNhan.deepEqual(chuaKiemTra, [], 'Mỗi API phải có ít nhất một yêu cầu thành công');
          boKiemThu.diagnostic(
            `${soYeuCau} yêu cầu HTTP; ${daThanhCong.size}/${cacRoute.length} API thành công; ${soLoiMongDoi} phản hồi lỗi được kiểm tra đúng mã.`,
          );
        } finally {
          await new Promise((xong) => mayChu.close(xong));
        }
      });
    } finally {
      for (const tep of cacTepDaTao) {
        await tepTin.unlink(tep);
      }
    }
    xacNhan.equal(await demTaiKhoan(), soLuongBanDau, 'Không để lại tài khoản kiểm thử');
  },
);

sauKhi(require('../helpers/dong-ket-noi').dongKetNoiMotLan);
