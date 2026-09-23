const { test: kiemThu, after: sauKhi } = require('node:test');
const xacNhan = require('node:assert/strict');
const http = require('node:http');
const tepTin = require('node:fs/promises');
const duongDan = require('node:path');
const coSoDuLieu = require('../../dist/repositories/ket-noi');
const nguoiDung = require('../../dist/services/nguoi-dung');
const { cauHinh } = require('../../dist/config/moi-truong');
const { taoDuLieuKiemThu, hoanTac } = require('../helpers/du-lieu-mau');

kiemThu('HTTP và Multer: xác minh, duyệt sản phẩm, tệp riêng tư và tạo phiên', async () => {
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
      const mayChu = http.createServer(require('../../dist/ung-dung'));
      await new Promise((xong) => mayChu.listen(0, '127.0.0.1', xong));
      const diaChi = `http://127.0.0.1:${mayChu.address().port}`;

      async function guiAPI(phuongThuc, duongDanAPI, maTruyCap, noiDung) {
        const phanHoi = await fetch(`${diaChi}/api${duongDanAPI}`, {
          method: phuongThuc,
          headers: { Authorization: `Bearer ${maTruyCap}`, 'Content-Type': 'application/json' },
          body: noiDung == null ? undefined : JSON.stringify(noiDung),
        });
        const ketQua = await phanHoi.json();
        xacNhan.ok(phanHoi.ok, `${duongDanAPI}: ${phanHoi.status} ${ketQua.message}`);
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
      } finally {
        await new Promise((xong) => mayChu.close(xong));
      }
    });
  } finally {
    for (const tep of cacTepDaTao) await tepTin.unlink(tep);
  }
});

sauKhi(require('../helpers/dong-ket-noi').dongKetNoiMotLan);
