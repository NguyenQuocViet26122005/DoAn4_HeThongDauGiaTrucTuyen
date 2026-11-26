const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const { randomUUID } = require('node:crypto');
const { taoDuLieuKiemThu, sanPham, hoanTac, phienDauGia } = require('../helpers/du-lieu-mau');
const records = require('../../dist/repositories/ban-ghi');
const dichVu = require('../../dist/services/danh-muc-san-pham');
const { cauHinh } = require('../../dist/config/moi-truong');
const { luuDauVan } = require('../../dist/services/dau-van-anh');
const { raSoat } = require('../../dist/services/kiem-duyet-tin');
const { goiYTuAnh } = require('../../dist/services/dang-ban-tu-anh');
const { giaDaBan } = require('../../dist/repositories/ho-tro-dang-ban');

test('HTTP: hỗ trợ đăng bán kiểm tra quyền, lớp 1 không cần AI, xem trước ảnh cục bộ và xác nhận gợi ý đúng khuôn', async () => {
  const envCu = [process.env.AI_ENABLED, process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL];
  const fetchCu = global.fetch;
  let server;

  try {
    await hoanTac(async () => {
      const d = await taoDuLieuKiemThu();
      const sp = await sanPham(d, { tieu_de: 'Hàng thật 100%', mo_ta: 'Liên hệ Zalo 0903123456' });
      const token = {};

      for (const role of ['a', 'seller', 'admin']) {
        token[role] = (
          await require('../../dist/services/nguoi-dung').dangNhap({
            email: d[role].email,
            mat_khau: d.password,
          })
        ).token;
      }
      server = http.createServer(require('../../dist/ung-dung'));
      await new Promise((ok) => server.listen(0, '127.0.0.1', ok));

      const goc = `http://127.0.0.1:${server.address().port}/api`;

      async function gui(method, url, role, body, status = 200) {
        const form = body instanceof FormData;
        const r = await fetchCu(goc + url, {
          method,
          headers: {
            ...(role ? { Authorization: `Bearer ${token[role]}` } : {}),
            ...(!form && body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          },
          body: body === undefined ? undefined : form ? body : JSON.stringify(body),
        });
        const j = await r.json();

        assert.equal(r.status, status, `${method} ${url}: ${j.message}`);

        return j.data;
      }

      process.env.AI_ENABLED = 'false';
      await gui('GET', '/listing-support/status', null, undefined, 401);
      assert.equal((await gui('GET', '/listing-support/status', 'seller')).ai_san_sang, false);
      await gui('POST', `/listing-support/products/${sp}/review`, 'a', {}, 403);

      const scan = await gui('POST', `/listing-support/products/${sp}/review`, 'seller', {});

      assert.ok(scan.canh_bao.some((x) => x.ma === 'LIEN_HE'));
      assert.ok(
        (await gui('POST', `/listing-support/products/${sp}/review`, 'admin', {})).canh_bao.length,
      );
      assert.equal(await gui('GET', `/listing-support/products/${sp}/prices`, 'seller'), null);
      await gui('GET', `/listing-support/products/${sp}/prices`, 'a', undefined, 403);
      process.env.AI_ENABLED = 'true';
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_MODEL = 'test-model';

      let soLanAI = 0;
      const thuocTinhAI = [];

      for (const [ten, khoa, kieu, giaTri] of [
        ['Có vết xước', 'vet_xuoc', 'DUNG_SAI', '1'],
        ['Có vết nứt', 'vet_nut', 'DUNG_SAI', '0'],
        ['Thời điểm', 'thoi_diem', 'NGAY', '2020-01-01'],
      ]) {
        const t = await dichVu.luuThuocTinh(d.admin, d.categoryId, null, {
          ten_thuoc_tinh: ten,
          khoa_thuoc_tinh: khoa,
          kieu_nhap: kieu,
        });

        thuocTinhAI.push({ thuoc_tinh_id: String(t.id), gia_tri: giaTri });
      }

      let moTaAI = 'Tình trạng: vỏ có vết xước';

      global.fetch = async (_url, opts) => {
        soLanAI++;

        const b = JSON.parse(opts.body);

        assert.equal(b.store, false);
        assert.equal(b.max_output_tokens, 6000);
        assert.equal(JSON.stringify(b.input).includes('0903123456'), false);

        const noiDung = JSON.parse(b.input[0].content[0].text);

        if (noiDung.nhiem_vu.startsWith('Rà soát')) {
          return {
            ok: true,
            json: async () => ({
              status: 'completed',
              output: [
                {
                  type: 'message',
                  content: [
                    {
                      type: 'output_text',
                      text: JSON.stringify({ canh_bao: ['MAU_THUAN_THUOC_TINH'] }),
                    },
                  ],
                },
              ],
            }),
          };
        }

        return {
          ok: true,
          json: async () => ({
            status: 'completed',
            output: [
              {
                type: 'message',
                content: [
                  {
                    type: 'output_text',
                    text: JSON.stringify({
                      danh_muc_id: String(d.categoryId),
                      tieu_de: 'Đồng Hồ Cơ Đường Kính 40mm',
                      mo_ta: moTaAI,
                      tinh_trang_san_pham: null,
                      thuoc_tinh: [
                        { thuoc_tinh_id: 'khong-ton-tai', gia_tri: 'sai' },
                        ...thuocTinhAI,
                      ],
                      can_bo_sung: ['Xác nhận serial và nguồn gốc.'],
                    }),
                  },
                ],
              },
            ],
          }),
        };
      };
      await gui('POST', `/listing-support/products/${sp}/review`, 'seller', { dung_ai: true });
      assert.equal(soLanAI, 0, 'Không gửi tin có liên hệ ra AI');
      await records.capNhat('danh_muc', d.categoryId, { ten: 'Quần áo' });

      const binhThuong = await sanPham(d, {
        tieu_de: "Quần jean Levi's 501",
        mo_ta: 'Tình trạng tốt, đường may đều.',
      });
      const hopLe = await gui('POST', `/listing-support/products/${binhThuong}/review`, 'seller', {
        dung_ai: true,
      });

      assert.equal(soLanAI, 1, 'Tin bình thường thuộc Quần áo phải đến được AI');
      assert.equal(hopLe.canh_bao_ai[0].ma, 'MAU_THUAN_THUOC_TINH');

      const png = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: 'white',
        },
      })
        .png()
        .toBuffer();
      const form = new FormData();

      for (let i = 0; i < 3; i++) {
        form.append('photos', new Blob([png], { type: 'image/png' }), `anh-${i}.png`);
      }

      const preview = await gui('POST', '/listing-support/photos/prepare', 'seller', form);

      assert.equal(soLanAI, 1, 'Xem trước và OCR không gọi AI');
      assert.equal(preview.anh.length, 3);
      await gui(
        'POST',
        '/listing-support/photos/suggest',
        'seller',
        {
          ma: preview.ma,
          ghi_chu: '',
          xac_nhan_anh_an_toan: false,
        },
        400,
      );
      await gui(
        'POST',
        '/listing-support/photos/suggest',
        'seller',
        {
          ma: randomUUID(),
          ghi_chu: '',
          xac_nhan_anh_an_toan: true,
        },
        404,
      );

      const suggest = await gui('POST', '/listing-support/photos/suggest', 'seller', {
        ma: preview.ma,
        ghi_chu: 'Bình gốm, tình trạng tốt, đường kính 40mm',
        xac_nhan_anh_an_toan: true,
      });

      assert.equal(soLanAI, 2);
      assert.equal(suggest.goi_y.danh_muc_id, String(d.categoryId));
      assert.equal(suggest.goi_y.tieu_de, 'Đồng Hồ Cơ Đường Kính 40mm');
      assert.equal(suggest.goi_y.mo_ta, moTaAI);
      assert.deepEqual(
        suggest.goi_y.thuoc_tinh,
        [
          { ...thuocTinhAI[0], gia_tri: 'true' },
          { ...thuocTinhAI[1], gia_tri: 'false' },
        ],
        'Chuẩn hóa đúng/sai, loại thuộc tính ngày và ID không thuộc danh mục',
      );

      const dauVao = {
        ma: preview.ma,
        ghi_chu: '',
        xac_nhan_anh_an_toan: true,
      };

      await assert.rejects(
        goiYTuAnh(d.seller, {
          ...dauVao,
          ghi_chu: 'ghé xem hàng ở đường lê lợi',
        }),
        { status: 400 },
      );
      assert.equal(soLanAI, 2, 'Ghi chú chứa địa chỉ vẫn bị chặn trước khi gửi AI');
      moTaAI = 'Tình trạng: vỏ có vết xước, Gọi 0903 123 456';
      assert.equal((await goiYTuAnh(d.seller, dauVao)).goi_y, null);
      moTaAI = 'a'.repeat(1500);
      assert.equal((await goiYTuAnh(d.seller, dauVao)).goi_y.mo_ta.length, 1500);
      moTaAI = 'a'.repeat(1501);
      assert.equal((await goiYTuAnh(d.seller, dauVao)).goi_y, null);

      const after = await records.layTheoId('san_pham', sp);

      assert.equal(after.tieu_de, 'Hàng thật 100%');
      assert.equal(after.trang_thai_duyet, 'DA_DUYET', 'AI không ghi hồ sơ hoặc tự duyệt');
    });
  } finally {
    if (server) {
      await new Promise((ok) => server.close(ok));
    }
    global.fetch = fetchCu;
    ['AI_ENABLED', 'OPENAI_API_KEY', 'OPENAI_MODEL'].forEach((k, i) => {
      if (envCu[i] === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = envCu[i];
      }
    });
  }
});

test('Ảnh trùng giữa hai người bán là cảnh báo; giá mẫu chỉ lấy hàng đã hoàn tất và giải ngân', async () => {
  const tep = [];

  try {
    await hoanTac(async () => {
      const d = await taoDuLieuKiemThu();
      const p1 = await sanPham(d);
      const p2 = await sanPham(d, { nguoi_ban_id: d.b.id });
      const buffer = await sharp({
        create: {
          width: 32,
          height: 32,
          channels: 3,
          background: 'red',
        },
      })
        .png()
        .toBuffer();

      for (const [sp, owner] of [
        [p1, d.seller.id],
        [p2, d.b.id],
      ]) {
        const name = `${randomUUID()}.png`;
        const url = `/api/uploads/files/product/${owner}/${name}`;
        const local = path.join(cauHinh.uploadRoot, 'product', String(owner), name);

        await fs.mkdir(path.dirname(local), { recursive: true });
        await fs.writeFile(local, buffer);
        tep.push(local, `${local}.fingerprint.json`);
        await luuDauVan(local, buffer);
        await records.them('tep_dinh_kem', {
          loai_tep: 'ANH_SAN_PHAM',
          san_pham_id: sp,
          nguoi_tai_len_id: owner,
          duong_dan_tep: url,
        });
      }
      assert.ok((await raSoat(d.seller, p1, {})).canh_bao.some((c) => c.ma === 'ANH_TRUNG'));

      const p = await phienDauGia(d, { gia_mua_ngay: '20000000', cho_phep_mua_ngay: 1 });
      const don = (await require('../../dist/services/dau-gia').muaNgay(d.a, p, {})).don_hang;

      assert.equal(
        (await giaDaBan(d.categoryId, p1)).length,
        0,
        'Đơn chưa hoàn tất không phải mẫu',
      );
      await require('../../dist/services/don-hang').guiHang(d.seller, don.id, {
        don_vi_van_chuyen: 'Test',
        ma_van_don: 'TEST',
      });
      await require('../../dist/services/don-hang').xacNhanDaGiao(d.a, don.id);
      await require('../../dist/services/don-hang').xacNhanHoanThanh(d.a, don.id);
      assert.equal((await giaDaBan(d.categoryId, p1))[0].gia_san_pham, '20000000.00');

      const phien = await records.layTheoId('phien_dau_gia', p);

      assert.equal(
        (await giaDaBan(d.categoryId, phien.san_pham_id)).length,
        0,
        'Không lấy mẫu từ chính món hàng',
      );
    });
  } finally {
    for (const file of tep) {
      await fs.rm(file, { force: true });
    }
  }
});
after(require('../helpers/dong-ket-noi').dongKetNoiMotLan);
