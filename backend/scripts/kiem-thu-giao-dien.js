const http = require('node:http');
const { randomBytes: taoNgauNhien } = require('node:crypto');
const tepTin = require('node:fs/promises');
const duongDan = require('node:path');

process.env.DB_NAME = 'doan4_daugia_kiem_thu';
process.env.JWT_SECRET = taoNgauNhien(48).toString('hex');
process.env.JOBS_ENABLED = 'false';
process.env.FRONTEND_URL = 'http://localhost:5174';

const { taoDuLieuKiemThu, phienDauGia, hoanTac } = require('../tests/helpers/du-lieu-mau');
const khoBanGhi = require('../dist/repositories/ban-ghi');
const dichVu = require('../dist/services/danh-muc-san-pham');
const { cauHinh } = require('../dist/config/moi-truong');
cauHinh.uploadRoot = duongDan.join(__dirname, '../uploads-kiem-thu');
const cacChuTep = [];

async function chay() {
  await hoanTac(async () => {
    const duLieu = await taoDuLieuKiemThu();
    const matKhauThu = 'KiemThuVietBid123!';

    for (const vaiTro of ['admin', 'seller', 'a', 'b']) {
      cacChuTep.push(String(duLieu[vaiTro].id));

      await khoBanGhi.capNhat('nguoi_dung', duLieu[vaiTro].id, {
        ho_ten:
          vaiTro === 'admin'
            ? 'Admin kiểm thử'
            : vaiTro === 'seller'
              ? 'Người bán kiểm thử'
              : 'Người mua kiểm thử',
        email: `${vaiTro}-giao-dien@example.invalid`,
        mat_khau_bam: await require('bcrypt').hash(matKhauThu, 4),
      });
    }

    await khoBanGhi.capNhat('danh_muc', duLieu.categoryId, { ten: 'Danh mục kiểm thử giao diện' });

    for (const [khoa, loai] of [
      ['serial', 'VAN_BAN'],
      ['nam', 'SO'],
      ['mau', 'LUA_CHON'],
      ['hop', 'DUNG_SAI'],
      ['ngay', 'NGAY'],
    ]) {
      await dichVu.luuThuocTinh(duLieu.admin, duLieu.categoryId, null, {
        ten_thuoc_tinh: khoa,
        khoa_thuoc_tinh: khoa,
        kieu_nhap: loai,
        bat_buoc: true,
        ...(loai === 'LUA_CHON' ? { lua_chon_json: ['Vàng', 'Bạc'] } : {}),
      });
    }

    const thuocTinh = await require('../dist/repositories/danh-muc-san-pham').danhSachThuocTinh(
      duLieu.categoryId,
    );
    const giaTri = {
      serial: 'TEST-001',
      nam: '2024',
      mau: 'Vàng',
      hop: 'false',
      ngay: '2024-06-01',
    };
    const tenAnh = require('node:crypto').randomUUID() + '.png';
    const thuMucAnh = duongDan.join(cauHinh.uploadRoot, 'product', String(duLieu.seller.id));

    await tepTin.mkdir(thuMucAnh, { recursive: true });
    await tepTin.copyFile(
      duongDan.join(__dirname, '../../frontend/src/assets/khong-gian-dau-gia.png'),
      duongDan.join(thuMucAnh, tenAnh),
    );

    for (const batBuoc of [false, true]) {
      await khoBanGhi.capNhat('danh_muc', duLieu.categoryId, {
        yeu_cau_kiem_dinh: batBuoc ? 1 : 0,
      });

      const sp = await dichVu.luuSanPham(duLieu.seller, null, {
        danh_muc_id: duLieu.categoryId,
        tieu_de: batBuoc ? 'Đồng hồ kiểm thử cần kiểm định' : 'Sản phẩm kiểm thử duyệt trực tiếp',
        mo_ta:
          'Dữ liệu kiểm thử riêng, được hoàn tác khi dừng máy chủ. Ảnh minh họa chỉ dùng thử giao diện.',
        tinh_trang_san_pham: 'MOI',
        thuoc_tinh: thuocTinh.map((muc) => ({
          thuoc_tinh_id: muc.id,
          gia_tri: giaTri[muc.khoa_thuoc_tinh],
        })),
      });

      await dichVu.themAnh(duLieu.seller, sp.id, {
        duong_dan_anh: '/api/uploads/files/product/' + duLieu.seller.id + '/' + tenAnh,
      });
      await dichVu.guiDuyet(duLieu.seller, sp.id);

      if (process.argv.includes('--phien') && !batBuoc) {
        await dichVu.duyet(duLieu.admin, sp.id, { trang_thai_duyet: 'DA_DUYET' });
      }
    }

    if (process.argv.includes('--nguoi-mua')) {
      for (const [ten, cauHinhPhien] of [
        [
          'Phiên kiểm thử có cọc và Mua ngay',
          {
            yeu_cau_dat_coc: 1,
            so_tien_dat_coc: '1800000',
            gia_san: '24000000',
            gia_mua_ngay: '25000000',
            cho_phep_mua_ngay: 1,
          },
        ],
        ['Phiên kiểm thử không cọc', { gia_mua_ngay: '25000000', cho_phep_mua_ngay: 1 }],
        ['Phiên kiểm thử cọc không Mua ngay', { yeu_cau_dat_coc: 1, so_tien_dat_coc: '1800000' }],
      ]) {
        const id = await phienDauGia(duLieu, { ...cauHinhPhien, phi_van_chuyen: '50000' });
        const phien = await khoBanGhi.layTheoId('phien_dau_gia', id);

        await khoBanGhi.capNhat('san_pham', phien.san_pham_id, { tieu_de: ten });
        await khoBanGhi.them('tep_dinh_kem', {
          loai_tep: 'ANH_SAN_PHAM',
          nguoi_tai_len_id: duLieu.seller.id,
          san_pham_id: phien.san_pham_id,
          duong_dan_tep: '/api/uploads/files/product/' + duLieu.seller.id + '/' + tenAnh,
          la_anh_chinh: 1,
        });

        console.log(`${ten}: http://localhost:5174/phien/${id}`);
      }
      // Người mua B bắt đầu chưa có địa chỉ để kiểm tra luồng bổ sung trên web.
      await require('../dist/repositories/ket-noi').truyVan(
        'DELETE FROM dia_chi_nguoi_dung WHERE nguoi_dung_id = ?',
        [duLieu.b.id],
      );
    }

    if (process.argv.includes('--don-hang')) {
      await require('./du-lieu-don-giao-dien')(duLieu);
    }

    const ungDung = require('../dist/ung-dung');
    let daGiaLapMatPhanHoi = false;
    const mayChu = http.createServer((yeuCau, phanHoi) => {
      if (
        process.argv.includes('--mat-phan-hoi') &&
        yeuCau.method === 'POST' &&
        (yeuCau.url.endsWith('/buy-now') || yeuCau.url.endsWith('/payments/simulate'))
      ) {
        const ketThuc = phanHoi.end;

        phanHoi.end = function (...thamSo) {
          if (!daGiaLapMatPhanHoi && phanHoi.statusCode === 200) {
            daGiaLapMatPhanHoi = true;
            // Gửi một phần nội dung để trình duyệt không tự gửi lại trước khi UI nhận lỗi.
            phanHoi.flushHeaders();
            phanHoi.write('{');
            setImmediate(() => phanHoi.destroy());
            console.log(
              'Đã mô phỏng mất một phản hồi thanh toán; lần gửi lại nhận kết quả đã xử lý.',
            );

            return phanHoi;
          }

          return ketThuc.apply(phanHoi, thamSo);
        };
      }

      ungDung(yeuCau, phanHoi);
    });

    await new Promise((xong) => mayChu.listen(5001, '127.0.0.1', xong));
    console.log(
      'API kiểm thử giao diện: http://127.0.0.1:5001; dữ liệu riêng sẽ rollback khi dừng.',
    );
    console.log(
      'Tài khoản thử: admin-giao-dien@example.invalid / seller-giao-dien@example.invalid / a-giao-dien@example.invalid / b-giao-dien@example.invalid',
    );
    console.log('Mật khẩu tài khoản thử: KiemThuVietBid123!');
    console.log('Nhấn Enter để dừng, hoàn tác dữ liệu và dọn ảnh kiểm thử.');

    await new Promise((xong) => {
      process.once('SIGINT', xong);
      process.once('SIGTERM', xong);
      process.stdin.resume();
      process.stdin.once('data', xong);
    });
    process.stdin.pause();
    await new Promise((xong) => mayChu.close(xong));
  });
}

chay()
  .catch((loi) => {
    console.error(loi.code || loi.name);
    console.error(
      String(loi.stack)
        .split('\n')
        .filter((dong) => /^\s+at /.test(dong))
        .slice(0, 4)
        .join('\n'),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    for (const nhom of ['product', 'inspection', 'evidence', 'verification', 'avatar']) {
      for (const chuTep of cacChuTep) {
        const thuMuc = duongDan.resolve(cauHinh.uploadRoot, nhom, chuTep);
        const goc = duongDan.resolve(__dirname, '../uploads-kiem-thu');

        if (!thuMuc.startsWith(goc + duongDan.sep)) {
          throw new Error('Thư mục dọn tệp nằm ngoài vùng kiểm thử');
        }

        const cacTep = await tepTin.readdir(thuMuc).catch(() => []);

        for (const ten of cacTep) {
          await tepTin.unlink(duongDan.join(thuMuc, ten));
        }
        await tepTin.rmdir(thuMuc).catch(() => {});
      }
    }
    await require('../dist/repositories/ket-noi').nhomKetNoi.end();
  });
