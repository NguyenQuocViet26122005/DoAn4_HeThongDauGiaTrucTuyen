const { test: kiemThu, after: sauKhi } = require('node:test');
const xacNhan = require('node:assert/strict');
const http = require('node:http');
const tepTin = require('node:fs/promises');
const duongDan = require('node:path');
const coSoDuLieu = require('../../dist/repositories/ket-noi');
const nguoiDung = require('../../dist/services/nguoi-dung');
const { cauHinh } = require('../../dist/config/moi-truong');
const { taoDuLieuKiemThu, phienDauGia, hoanTac } = require('../helpers/du-lieu-mau');

kiemThu(
  'HTTP: xác minh, bán sản phẩm và mua hàng bằng cùng tài khoản, phân quyền từng đơn',
  async () => {
    const cacTepDaTao = [];

    try {
      await hoanTac(async () => {
        const duLieu = await taoDuLieuKiemThu();
        const maNguoiBan = (
          await nguoiDung.dangNhap({ email: duLieu.a.email, mat_khau: duLieu.password })
        ).token;
        const maNguoiKhac = (
          await nguoiDung.dangNhap({ email: duLieu.b.email, mat_khau: duLieu.password })
        ).token;
        const maQuanTri = (
          await nguoiDung.dangNhap({ email: duLieu.admin.email, mat_khau: duLieu.password })
        ).token;
        const maDoiTac = (
          await nguoiDung.dangNhap({ email: duLieu.seller.email, mat_khau: duLieu.password })
        ).token;
        const mayChu = http.createServer(require('../../dist/ung-dung'));

        await new Promise((xong) => mayChu.listen(0, '127.0.0.1', xong));

        const diaChi = `http://127.0.0.1:${mayChu.address().port}`;

        async function guiAPI(phuongThuc, duongDanAPI, maTruyCap, noiDung, maLoi) {
          const phanHoi = await fetch(`${diaChi}/api${duongDanAPI}`, {
            method: phuongThuc,
            headers: { Authorization: `Bearer ${maTruyCap}`, 'Content-Type': 'application/json' },
            body: noiDung == null ? undefined : JSON.stringify(noiDung),
          });
          const ketQua = await phanHoi.json();

          if (maLoi) {
            xacNhan.equal(phanHoi.status, maLoi, `${duongDanAPI}: ${ketQua.message}`);

            return;
          }
          xacNhan.ok(phanHoi.ok, `${duongDanAPI}: ${phanHoi.status} ${ketQua.message}`);
          require('../../dist/utils/du-lieu-cong-khai').kiemTraDuLieuCongKhai(ketQua);

          return ketQua.data;
        }

        async function taiAnh(nhom) {
          const bieuMau = new FormData();
          const anh = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z8f8AAAAASUVORK5CYII=',
            'base64',
          );

          bieuMau.set('file', new Blob([anh], { type: 'image/png' }), 'anh-kiem-thu.png');

          const phanHoi = await fetch(`${diaChi}/api/uploads/${nhom}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${maNguoiBan}` },
            body: bieuMau,
          });
          const ketQua = await phanHoi.json();

          xacNhan.equal(phanHoi.status, 201, ketQua.message);

          const tep = duongDan.resolve(
            cauHinh.uploadRoot,
            ketQua.data.duong_dan.replace('/api/uploads/files/', ''),
          );

          xacNhan.ok(tep.startsWith(duongDan.resolve(cauHinh.uploadRoot) + duongDan.sep));
          cacTepDaTao.push(tep);

          return ketQua.data.duong_dan;
        }

        try {
          await guiAPI('POST', '/products', maNguoiBan, {}, 403);
          await guiAPI('GET', '/admin/users', maNguoiBan, undefined, 403);

          const anhGiayTo = await taiAnh('verification');
          const hoSo = await guiAPI('POST', '/seller-verifications', maNguoiBan, {
            loai_giay_to: 'CCCD',
            so_giay_to: 'TEST-ONLY',
            anh_mat_truoc: anhGiayTo,
            anh_mat_sau: anhGiayTo,
            anh_selfie: anhGiayTo,
            ten_ngan_hang: 'Ngân hàng kiểm thử',
            so_tai_khoan: '0000000',
            chu_tai_khoan: 'Tài khoản kiểm thử',
          });

          xacNhan.equal((await fetch(`${diaChi}${anhGiayTo}`)).status, 401);
          xacNhan.equal(
            (
              await fetch(`${diaChi}${anhGiayTo}`, {
                headers: { Authorization: `Bearer ${maNguoiKhac}` },
              })
            ).status,
            403,
          );

          const taiTep = await fetch(`${diaChi}${anhGiayTo}`, {
            headers: { Authorization: `Bearer ${maQuanTri}` },
          });

          xacNhan.equal(taiTep.status, 200);
          await taiTep.arrayBuffer();
          await guiAPI('PATCH', `/admin/seller-verifications/${hoSo.id}/review`, maQuanTri, {
            trang_thai: 'DA_XAC_MINH',
          });

          const sanPham = await guiAPI('POST', '/products', maNguoiBan, {
            danh_muc_id: duLieu.categoryId,
            tieu_de: 'Sản phẩm kiểm thử HTTP',
            mo_ta: 'Mô tả sản phẩm',
            tinh_trang_san_pham: 'MOI',
            thuoc_tinh: [],
          });
          const anhSanPham = await taiAnh('product');

          await guiAPI('POST', `/products/${sanPham.id}/images`, maNguoiBan, {
            duong_dan_anh: anhSanPham,
            la_anh_chinh: true,
          });
          await guiAPI('POST', `/products/${sanPham.id}/submit`, maNguoiBan, {});
          await guiAPI('PATCH', `/admin/products/${sanPham.id}/review`, maQuanTri, {
            trang_thai_duyet: 'DA_DUYET',
          });

          const hienTai = Date.now();
          const phien = await guiAPI('POST', '/auctions', maNguoiBan, {
            san_pham_id: sanPham.id,
            gia_khoi_diem: '1000000',
            thoi_gian_bat_dau: new Date(hienTai + 10000).toISOString(),
            thoi_gian_ket_thuc: new Date(hienTai + 3600000).toISOString(),
          });

          xacNhan.equal(phien.trang_thai, 'DA_LEN_LICH');

          const suaLai = await fetch(`${diaChi}/api/products/${sanPham.id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${maNguoiBan}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              danh_muc_id: duLieu.categoryId,
              tieu_de: 'Sửa trái phép',
              mo_ta: 'Kiểm thử',
              tinh_trang_san_pham: 'MOI',
            }),
          });

          xacNhan.equal(suaLai.status, 409);

          // Dùng lại token cấp trước khi xác minh: quyền mới phải lấy từ MySQL.
          const hoSoSauDuyet = await guiAPI('GET', '/users/me', maNguoiBan);

          xacNhan.equal(hoSoSauDuyet.vai_tro, 'NGUOI_DUNG');
          xacNhan.equal(hoSoSauDuyet.trang_thai_nguoi_ban, 'DA_XAC_MINH');

          const dieuKienMua = {
            gia_mua_ngay: '24000000',
            cho_phep_mua_ngay: 1,
            yeu_cau_dat_coc: 1,
            so_tien_dat_coc: '1800000',
          };
          const phienBan = await phienDauGia({ ...duLieu, seller: duLieu.a }, dieuKienMua);
          const phienMua = await phienDauGia(duLieu, dieuKienMua);

          await guiAPI('POST', `/auctions/${phienBan}/deposit/register`, maNguoiBan, {}, 403);
          await guiAPI(
            'POST',
            `/auctions/${phienBan}/bids`,
            maNguoiBan,
            { gia_toi_da: '22000000' },
            403,
          );
          await guiAPI('POST', `/auctions/${phienBan}/buy-now`, maNguoiBan, {}, 403);
          await guiAPI('POST', `/auctions/${phienMua}/buy-now`, maQuanTri, {}, 403);

          const donBan = (await guiAPI('POST', `/auctions/${phienBan}/buy-now`, maNguoiKhac, {}))
            .don_hang;
          const donMua = (await guiAPI('POST', `/auctions/${phienMua}/buy-now`, maNguoiBan, {}))
            .don_hang;

          xacNhan.equal(String(donBan.nguoi_ban_id), String(duLieu.a.id));
          xacNhan.equal(String(donMua.nguoi_mua_id), String(duLieu.a.id));

          for (const [vaiTro, donDung] of [
            ['NGUOI_MUA', donMua],
            ['NGUOI_BAN', donBan],
          ]) {
            const danhSach = await guiAPI('GET', `/orders?vai_tro=${vaiTro}&limit=1`, maNguoiBan);

            xacNhan.deepEqual(
              danhSach.map((don) => String(don.id)),
              [String(donDung.id)],
            );
          }

          const vanDon = {
            don_vi_van_chuyen: 'Kiểm thử hai vai trò',
            ma_van_don: 'TEST-DUAL-ROLE',
          };

          await guiAPI('POST', `/orders/${donMua.id}/shipping`, maNguoiBan, vanDon, 403);
          await guiAPI('POST', `/orders/${donBan.id}/delivered`, maNguoiBan, {}, 403);
          await guiAPI('POST', `/orders/${donBan.id}/confirm`, maNguoiBan, {}, 403);
          await guiAPI('GET', `/orders/${donMua.id}`, maNguoiKhac, undefined, 403);

          for (const [don, maBenBan, maBenMua] of [
            [donBan, maNguoiBan, maNguoiKhac],
            [donMua, maDoiTac, maNguoiBan],
          ]) {
            await guiAPI('POST', `/orders/${don.id}/shipping`, maBenBan, vanDon);
            await guiAPI('POST', `/orders/${don.id}/delivered`, maBenMua, {});

            const dangGiu = await guiAPI('GET', `/orders/${don.id}`, maNguoiBan);

            xacNhan.equal(dangGiu.trang_thai, 'DANG_KIEM_TRA');
            xacNhan.equal(Number(dangGiu.so_tien_dang_giu), 24000000);
            await guiAPI('POST', `/orders/${don.id}/confirm`, maBenMua, {});

            const hoanThanh = await guiAPI('GET', `/orders/${don.id}`, maNguoiBan);

            xacNhan.equal(hoanThanh.trang_thai, 'HOAN_THANH');
            xacNhan.equal(Number(hoanThanh.so_tien_dang_giu), 0);
            xacNhan.equal(Number(hoanThanh.so_tien_da_giai_ngan), 24000000);

            const danhGia = await guiAPI('POST', `/orders/${don.id}/reviews`, maNguoiBan, {
              so_sao: 5,
              nhan_xet: 'Kiểm thử quyền đối tác theo từng giao dịch',
            });

            xacNhan.equal(
              String(danhGia.nguoi_duoc_danh_gia_id),
              String(don.id === donBan.id ? duLieu.b.id : duLieu.seller.id),
            );
            await guiAPI('POST', `/orders/${don.id}/reviews`, maNguoiBan, { so_sao: 5 }, 409);
          }
        } finally {
          await new Promise((xong) => mayChu.close(xong));
        }
      });
    } finally {
      for (const tep of cacTepDaTao) {
        await tepTin.unlink(tep);
      }
    }
  },
);

sauKhi(require('../helpers/dong-ket-noi').dongKetNoiMotLan);
