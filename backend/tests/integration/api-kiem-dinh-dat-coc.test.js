const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const db = require('../../dist/repositories/ket-noi');
const records = require('../../dist/repositories/ban-ghi');
const dauGia = require('../../dist/services/dau-gia');
const sanPhamDichVu = require('../../dist/services/danh-muc-san-pham');
const donHang = require('../../dist/services/don-hang');
const kiemDinh = require('../../dist/services/kiem-dinh');
const thoiGian = require('../../dist/utils/thoi-gian');
const { cauHinh } = require('../../dist/config/moi-truong');
const { kiemTraDuLieuCongKhai } = require('../../dist/utils/du-lieu-cong-khai');
const { taoDuLieuKiemThu, sanPham, phienDauGia, hoanTac } = require('../helpers/du-lieu-mau');

test('HTTP: đủ 16 API kiểm định/cọc mới và quyền truy cập hồ sơ', async (t) => {
  const route = await fs.readFile(
    path.join(__dirname, '../../src/routes/kiem-dinh-dat-coc.ts'),
    'utf8',
  );
  const cacRoute = [...route.matchAll(/boDinhTuyen\.(get|post|patch)\(\s*'([^']+)'/g)].map(
    (m) => `${m[1].toUpperCase()} ${m[2]}`,
  );
  const daKiemTra = new Set();
  const tepDaTao = [];

  try {
    await hoanTac(async () => {
      const d = await taoDuLieuKiemThu();
      const token = {};

      for (const vaiTro of ['admin', 'seller', 'a', 'b', 'outsider']) {
        token[vaiTro] = (
          await require('../../dist/services/nguoi-dung').dangNhap({
            email: d[vaiTro].email,
            mat_khau: d.password,
          })
        ).token;
      }

      const mayChu = http.createServer(require('../../dist/ung-dung'));

      await new Promise((xong) => mayChu.listen(0, '127.0.0.1', xong));

      const goc = `http://127.0.0.1:${mayChu.address().port}`;

      async function gui(cach, url, vaiTro, noiDung, ma = 200) {
        const form = noiDung instanceof FormData;
        const phanHoi = await fetch(`${goc}/api${url}`, {
          method: cach,
          headers: {
            ...(vaiTro ? { Authorization: `Bearer ${token[vaiTro]}` } : {}),
            ...(noiDung !== undefined && !form ? { 'Content-Type': 'application/json' } : {}),
          },
          body: noiDung === undefined ? undefined : form ? noiDung : JSON.stringify(noiDung),
          signal: AbortSignal.timeout(10000),
        });

        assert.equal(phanHoi.status, ma, `${cach} ${url}`);
        if (!phanHoi.headers.get('content-type')?.includes('application/json')) {
          return phanHoi.arrayBuffer();
        }

        const ketQua = await phanHoi.json();

        kiemTraDuLieuCongKhai(ketQua);
        if (ma < 400) {
          const khop = cacRoute.find((r) => {
            const [c, mau] = r.split(' ');

            return c === cach && new RegExp(`^${mau.replace(/:\w+/g, '[^/]+')}$`).test(url);
          });

          if (khop) {
            daKiemTra.add(khop);
          }
        }

        return ketQua.data;
      }

      async function taiBaoCao() {
        const bieuMau = new FormData();

        bieuMau.set(
          'file',
          new Blob(['%PDF-1.4\nHo so kiem thu\n%%EOF'], { type: 'application/pdf' }),
          'bao-cao.pdf',
        );

        const tep = await gui('POST', '/uploads/inspection', 'admin', bieuMau, 201);
        const tuyetDoi = path.resolve(
          cauHinh.uploadRoot,
          tep.duong_dan.replace('/api/uploads/files/', ''),
        );

        assert.ok(tuyetDoi.startsWith(path.resolve(cauHinh.uploadRoot) + path.sep));
        tepDaTao.push(tuyetDoi);

        return tep.duong_dan;
      }

      let sp, hoSo, phien, don, baoCao;
      const nhan = {
        tinh_trang_khi_nhan: 'Nguyên niêm phong',
        serial_khi_nhan: 'SERIAL-RIENG',
        so_kien: 1,
        ghi_chu: 'Ảnh biên bản lưu trong hồ sơ',
      };
      const ketQua = async (giaTri) => ({
        ket_qua: giaTri,
        ten_chuyen_gia: 'Chuyên gia kiểm thử',
        don_vi_kiem_dinh: 'Trung tâm kiểm thử',
        ngay_kiem_dinh: thoiGian.doiThanhNgay(await db.thoiGianHienTai()).toISOString(),
        nhan_xet: 'Ghi nhận đúng báo cáo chuyên môn đã nhận',
        ma_chung_nhan: 'TEST-CERT',
      });

      try {
        await t.test('chụp yêu cầu kiểm định theo danh mục lúc gửi duyệt', async () => {
          await records.capNhat('danh_muc', d.categoryId, { yeu_cau_kiem_dinh: 1 });
          sp = await sanPham(d, { trang_thai_duyet: 'BAN_NHAP' });
          await records.them('tep_dinh_kem', {
            loai_tep: 'ANH_SAN_PHAM',
            san_pham_id: sp,
            nguoi_tai_len_id: d.seller.id,
            duong_dan_tep: '/test/anh.png',
            loai_noi_dung: 'HINH_ANH',
          });
          await sanPhamDichVu.guiDuyet(d.seller, sp);
          await records.capNhat('danh_muc', d.categoryId, { yeu_cau_kiem_dinh: 0 });
          assert.equal((await records.layTheoId('san_pham', sp)).bat_buoc_kiem_dinh, 1);
        });

        await t.test('chưa kiểm định không được duyệt; chỉ Admin tạo và nhận hồ sơ', async () => {
          await gui(
            'PATCH',
            `/admin/products/${sp}/review`,
            'admin',
            { trang_thai_duyet: 'DA_DUYET' },
            409,
          );
          await gui('POST', `/admin/products/${sp}/inspections`, 'seller', {}, 403);
          hoSo = await gui('POST', `/admin/products/${sp}/inspections`, 'admin', {}, 201);
          await gui('POST', `/admin/products/${sp}/inspections`, 'admin', {}, 409);
          await gui('POST', `/inspections/${hoSo.id}/shipping`, 'seller', {
            don_vi_van_chuyen: 'Kiểm thử',
            ma_van_don: 'KD-DEN',
          });
          await gui('POST', `/admin/inspections/${hoSo.id}/received`, 'seller', nhan, 403);
          await gui('POST', `/admin/inspections/${hoSo.id}/received`, 'admin', nhan);
          await gui('POST', `/admin/inspections/${hoSo.id}/start`, 'admin', {});
          await gui('GET', '/inspections', 'seller');
          await gui('GET', '/admin/inspections', 'admin');
          await gui('GET', `/inspections/${hoSo.id}`, 'seller');
          await gui('GET', `/inspections/${hoSo.id}`, 'outsider', undefined, 403);

          const rieng = await gui('GET', `/products/${sp}`, 'admin');
          assert.equal(String(rieng.kiem_dinh_moi_nhat.id), String(hoSo.id));
          const loc = await gui('GET', `/admin/inspections?san_pham_id=${sp}&trang_thai=DANG_KIEM_DINH&q=${hoSo.ma_kiem_dinh}`, 'admin');
          assert.equal(loc.length, 1);
          assert.equal((await gui('GET', `/inspections?san_pham_id=${sp}`, 'outsider')).length, 0);
          assert.equal((await gui('GET', `/admin/inspections?san_pham_id=${sp}&trang_thai=CHO_GUI_TRUNG_TAM`, 'admin')).length, 0);
          await gui('GET', '/admin/inspections?trang_thai=SAI', 'admin', undefined, 400);
          await gui('GET', '/admin/inspections?san_pham_id=abc', 'admin', undefined, 400);
          assert.equal((await gui('GET', `/inspections/${hoSo.id}`, 'seller')).co_the_cap_nhat, true);

        });

        await t.test(
          'phải có báo cáo; ghi đạt không tự duyệt hoặc trả hàng về người bán',
          async () => {
            await gui(
              'PATCH',
              `/admin/inspections/${hoSo.id}/result`,
              'admin',
              await ketQua('DAT'),
              409,
            );
            baoCao = await taiBaoCao();
            await gui(
              'POST',
              `/admin/inspections/${hoSo.id}/files`,
              'admin',
              { loai_tep: 'BAO_CAO_KIEM_DINH', duong_dan_tep: baoCao },
              201,
            );
            await gui(
              'PATCH',
              `/admin/inspections/${hoSo.id}/result`,
              'admin',
              await ketQua('DAT'),
            );
            assert.equal((await records.layTheoId('san_pham', sp)).trang_thai_duyet, 'CHO_XU_LY');
            await gui(
              'POST',
              `/admin/inspections/${hoSo.id}/return`,
              'admin',
              { ly_do: 'Không được trả hàng đạt' },
              409,
            );
            await gui('PATCH', `/admin/products/${sp}/review`, 'admin', {
              trang_thai_duyet: 'DA_DUYET',
            });

            const congKhai = await gui('GET', `/products/${sp}/inspection`);

            assert.equal(congKhai.ket_qua, 'DAT');
            assert.equal(congKhai.serial_khi_nhan, undefined);
            assert.equal(congKhai.tep_dinh_kem, undefined);

            assert.equal((await gui('GET', `/products/${sp}`)).kiem_dinh_moi_nhat, undefined);
            assert.equal((await gui('GET', `/products/${sp}`, 'admin')).kiem_dinh_moi_nhat.co_bao_cao, true);
            const ganLai = await gui('POST', `/admin/inspections/${hoSo.id}/files`, 'admin', { loai_tep: 'BAO_CAO_KIEM_DINH', duong_dan_tep: baoCao }, 201);
            const chiTiet = await gui('GET', `/inspections/${hoSo.id}`, 'admin');
            assert.equal(chiTiet.tep_dinh_kem.length, 1);
            assert.equal(String(chiTiet.tep_dinh_kem[0].id), String(ganLai.id));
            await gui('POST', `/admin/inspections/${hoSo.id}/files`, 'admin', { loai_tep: 'CHUNG_NHAN_KIEM_DINH', duong_dan_tep: baoCao }, 409);

            await gui('GET', baoCao.slice(4), undefined, undefined, 401);
            await gui('GET', baoCao.slice(4), 'outsider', undefined, 403);
            await gui('GET', baoCao.slice(4), 'seller');
          },
        );

        await t.test('đã mở phiên không sửa hồ sơ đạt hoặc hàng đang lưu giữ', async () => {
          const now = await db.thoiGianHienTai();

          phien = await dauGia.tao(d.seller, {
            san_pham_id: sp,
            gia_khoi_diem: '18000000',
            gia_mua_ngay: '24000000',
            thoi_gian_bat_dau: thoiGian.doiThanhNgay(now).toISOString(),
            thoi_gian_ket_thuc: thoiGian.doiThanhNgay(thoiGian.congGiay(now, 3600)).toISOString(),
          });
          await gui(
            'PATCH',
            `/admin/inspections/${hoSo.id}/result`,
            'admin',
            await ketQua('KHONG_DAT'),
            409,
          );
          const biKhoa = await gui('GET', `/inspections/${hoSo.id}`, 'admin');
          assert.equal(biKhoa.co_the_cap_nhat, false);
          assert.match(biKhoa.ly_do_khong_the_cap_nhat, /nghĩa vụ bán/);
          await assert.rejects(
            sanPhamDichVu.luuSanPham(d.seller, sp, {
              danh_muc_id: d.categoryId,
              tieu_de: 'Đổi hàng',
              mo_ta: 'Không được thay',
              tinh_trang_san_pham: 'MOI',
            }),
            { status: 409 },
          );
        });

        await t.test(
          'đơn đã kiểm định do trung tâm gửi; người mua được xem hồ sơ, nhận hàng chưa giải ngân',
          async () => {
            don = (await dauGia.muaNgay(d.a, phien.id, {})).don_hang;
            assert.equal(don.nguon_gui_hang, 'TRUNG_TAM');
            await gui('GET', `/inspections/${hoSo.id}`, 'a');
            await gui('GET', baoCao.slice(4), 'a');
            await assert.rejects(
              donHang.guiHang(d.seller, don.id, {
                don_vi_van_chuyen: 'Kiểm thử',
                ma_van_don: 'KD-RA',
              }),
              { status: 403 },
            );
            await donHang.guiHang(d.admin, don.id, {
              don_vi_van_chuyen: 'Kiểm thử',
              ma_van_don: 'KD-RA',
            });
            assert.ok((await kiemDinh.chiTiet(d.admin, hoSo.id)).ngay_roi_trung_tam);
            await donHang.xacNhanDaGiao(d.a, don.id);
            assert.equal((await donHang.chiTiet(d.a, don.id)).giu_tien.trang_thai, 'DANG_GIU');
            await donHang.xacNhanHoanThanh(d.a, don.id);
            assert.equal((await donHang.chiTiet(d.a, don.id)).giu_tien.trang_thai, 'DA_GIAI_NGAN');
          },
        );

        await t.test(
          'không đạt: chặn duyệt, trả có lý do rồi mới mở lần kiểm định mới',
          async () => {
            const sp2 = await sanPham(d, { trang_thai_duyet: 'CHO_XU_LY', bat_buoc_kiem_dinh: 1 });
            const hs2 = await gui('POST', `/admin/products/${sp2}/inspections`, 'admin', {}, 201);

            await gui('POST', `/admin/inspections/${hs2.id}/received`, 'admin', nhan);
            await gui('POST', `/admin/inspections/${hs2.id}/start`, 'admin', {});
            await gui(
              'POST',
              `/admin/inspections/${hs2.id}/files`,
              'admin',
              { loai_tep: 'BAO_CAO_KIEM_DINH', duong_dan_tep: baoCao },
              201,
            );
            await gui(
              'PATCH',
              `/admin/inspections/${hs2.id}/result`,
              'admin',
              await ketQua('KHONG_DAT'),
            );
            await gui(
              'PATCH',
              `/admin/products/${sp2}/review`,
              'admin',
              { trang_thai_duyet: 'DA_DUYET' },
              409,
            );
            await gui('POST', `/admin/inspections/${hs2.id}/return`, 'admin', {
              ly_do: 'Theo báo cáo không đạt',
            });

            const lan2 = await gui('POST', `/admin/products/${sp2}/inspections`, 'admin', {}, 201);

            assert.equal(lan2.lan_kiem_dinh, 2);
          },
        );

        await t.test(
          'API cọc: chính chủ, chống sửa số tiền, không lộ thông tin người tham gia',
          async () => {
            const id = await phienDauGia(d, { yeu_cau_dat_coc: 1, so_tien_dat_coc: '1800000' });

            await gui('POST', `/auctions/${id}/deposit/register`, undefined, {}, 401);
            await gui('POST', `/auctions/${id}/deposit/register`, 'a', {}, 201);
            await gui('POST', `/auctions/${id}/deposit/pay`, 'a', { so_tien: 1 }, 400);
            await gui('POST', `/auctions/${id}/deposit/pay`, 'a', {
              khoa_yeu_cau: `http-coc-${id}`,
            });
            assert.equal(
              (await gui('GET', `/auctions/${id}/deposit`, 'a')).trang_thai,
              'DA_DAT_COC',
            );
            assert.equal(await gui('GET', `/auctions/${id}/deposit`, 'b'), null);

            const tk = await gui('GET', `/auctions/${id}/participants/summary`, 'seller');

            assert.deepEqual(Object.keys(tk).sort(), ['da_coc', 'da_dang_ky', 'du_dieu_kien']);
            await gui('GET', `/auctions/${id}/participants/summary`, 'outsider', undefined, 403);
            await gui('GET', '/admin/deposits', 'admin');
            await gui('GET', '/admin/deposits', 'seller', undefined, 403);
          },
        );
      } finally {
        await new Promise((xong) => mayChu.close(xong));
      }
    });
    assert.deepEqual([...daKiemTra].sort(), cacRoute.sort());
  } finally {
    for (const tep of tepDaTao) {
      await fs.unlink(tep);
    }
  }
});

after(require('../helpers/dong-ket-noi').dongKetNoiMotLan);
