const { test } = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const { z } = require('zod');
const { canhBaoVanBan, coDuLieuRiengTu, coLienHe } = require('../dist/services/kiem-duyet-tin');
const { thongKeGia } = require('../dist/services/tham-khao-gia');
const { tinhDauVan, anhGiongNhau } = require('../dist/services/dau-van-anh');
const { taoNoiDung, khuonGuiAI } = require('../dist/services/ai');
const { cheChu } = require('../dist/services/dang-ban-tu-anh');

test('Cảnh báo liên hệ, cam kết; không phản chiếu dữ liệu riêng tư ra cảnh báo', () => {
  const ds = canhBaoVanBan('Hàng thật 100%', 'Zalo 0903.123.456 a@example.com https://shop.test');

  assert.deepEqual(
    new Set(ds.map((x) => x.ma)),
    new Set(['LIEN_HE', 'EMAIL', 'LIEN_KET', 'CAM_KET']),
  );
  assert.equal(JSON.stringify(ds).includes('0903'), false);
  assert.equal(coDuLieuRiengTu('không chín không ba một hai ba bốn năm sáu'), true);
  assert.equal(coDuLieuRiengTu('Địa chỉ: 12 Nguyễn Trãi'), true);
  assert.equal(coDuLieuRiengTu('Bình gốm có vết xước nhỏ'), false);
  assert.deepEqual(canhBaoVanBan('Bình gốm', 'Đã sử dụng, có vết xước nhỏ'), []);
});

test('Khoảng giá chỉ hiện khi đủ 5 mẫu, tính DECIMAL bằng BigInt', () => {
  assert.equal(thongKeGia(['100', '200', '300', '400']), null);

  const q = thongKeGia(['500.05', '200.02', '400.04', '100.01', '300.03']);

  assert.equal(q.so_mau, 5);
  assert.equal(q.gia_tu, '200.02');
  assert.equal(q.gia_den, '400.04');
});

test('Bộ lọc không nhầm mô tả hàng hóa với địa chỉ nhưng vẫn chặn thông tin giao nhận', () => {
  for (const text of [
    'Đồng Hồ Nam Đường Kính 40mm',
    'Áo Sơ Mi Kẻ Đường Sọc',
    'Túi Da Đường Khâu Tay',
    'Quần Jean Xanh Size 32',
    'Danh mục: Quần áo / Đồng hồ',
    'Đường may chắc chắn, đường chỉ đều',
    'Đường may chắc chắn',
    'Sách khoa học xã hội',
    'Máy ảnh mua năm 2019',
    'Đồng hồ cơ, tình trạng tốt, còn hộp',
    "Quần jean Levi's 501",
    'Đường kính mặt 40mm',
    'Áo khoác xa xỉ',
    'Áo sơ mi kẻ đường sọc xanh',
    'Túi da có đường khâu tay',
    'Tỉnh táo khi chọn size',
    'tình trạng tốt',
    'đường kính 40mm',
    'đường may',
    'xa xỉ',
    'Quần áo',
    'Đường may đều, đường nét mềm mại, đường vân gỗ rõ',
    'Dong ho co, tinh trang tot, duong kinh 40mm',
    JSON.stringify({
      danh_muc: 'Quần áo',
      tinh_trang: 'Tình trạng tốt',
      thuoc_tinh: [{ ten: 'Đường kính', gia_tri: '40mm' }],
    }),
  ]) {
    assert.equal(coDuLieuRiengTu(text), false, text);
  }
  for (const text of [
    'ghé xem hàng ở đường lê lợi',
    'nhà mình ở phường bến nghé',
    'xem hàng tại quận bình thạnh',
    'Gọi 0903 123 456',
    'Zalo: 0912345678',
    'shop@example.com',
    'https://shop.test',
    'Địa chỉ: 12 Nguyễn Trãi',
    'dia chi: 12 Nguyen Trai',
    'Giao tại 12 Nguyễn Trãi',
    'Phường Bến Nghé, Quận 1',
    'phuong 5, quan 3',
    'Xã Tân Phú, tỉnh Đồng Nai',
    'Đường Nguyễn Trãi, Hà Nội',
    'đường Nguyễn Huệ, quận 1',
    'Quận 1, TP.HCM',
    'phuong 7 quan 3',
    'Giao hàng tại 25 Lê Lợi, phường Bến Nghé',
    'Ghé xem hàng tại 25 Lê Lợi',
    'Số nhà 45 ngõ 12',
    '0903 123 456',
    '84903123456',
    'Liên hệ Zalo',
    'a@example.com',
    'https://example.com',
    'không chín không ba một hai ba bốn năm sáu',
    JSON.stringify({ danh_muc: 'Quần áo', mo_ta: 'Địa chỉ: 12 Nguyễn Trãi' }),
  ]) {
    assert.equal(coDuLieuRiengTu(text), true, text);
  }
});

test('Ngoại lệ cụm sản phẩm áp dụng cả Title Case và không dấu; không bỏ lọt địa chỉ sau ngoại lệ', () => {
  for (const tu of 'kính may chỉ sọc khâu viền nét vân cong thẳng kẻ gân truyền mòn chéo cắt ray ống rãnh'.split(
    ' ',
  )) {
    assert.equal(coDuLieuRiengTu(`ĐƯỜNG ${tu.toUpperCase()}`), false, tu);

    const khongDau = tu.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    assert.equal(coDuLieuRiengTu(`DUONG ${khongDau.toUpperCase()}`), false, tu);
  }
  assert.equal(coDuLieuRiengTu('tỉnh táo, nhận hàng ở tỉnh đồng nai'), true);
  assert.equal(coDuLieuRiengTu('đường may đẹp, ghé đường lê lợi'), true);
  assert.equal(coDuLieuRiengTu('xã hội, ở xã tân phú'), true);
});

test('Đầu ra gợi ý chỉ dò liên hệ trong từng giá trị chuỗi, không dò địa chỉ', () => {
  const goiY = {
    tieu_de: 'Đồng Hồ Cơ Đường Kính 40mm',
    mo_ta: 'Tình trạng: vỏ có vết xước',
  };

  assert.equal(coLienHe(JSON.stringify(goiY)), false);
  assert.equal(coLienHe(JSON.stringify({ ...goiY, mo_ta: 'phường bến nghé' })), false);
  for (const moTa of [
    'Gọi 0903 123 456',
    'không chín không ba một hai ba bốn năm sáu',
    'shop@example.com',
    'https://shop.test',
  ]) {
    assert.equal(coLienHe(JSON.stringify({ ...goiY, mo_ta: moTa })), true, moTa);
  }
  assert.equal(
    coLienHe(JSON.stringify({ khong: 'không chín không', chinh: 'ba một hai ba' })),
    false,
  );
});

test('Khuôn gửi AI tối giản giữ required, enum, null, additionalProperties và giới hạn Zod cục bộ', () => {
  const schema = z.strictObject({
    tieu_de: z.string().min(2).max(10).describe('Tên sản phẩm').nullable(),
    thuoc_tinh: z
      .array(z.strictObject({ gia_tri: z.string().max(5), loai: z.enum(['SO', 'CHU']) }))
      .min(1)
      .max(2),
    maxLength: z.string().max(10),
    mo_ta: z.string().max(200),
  });
  const wire = khuonGuiAI(schema);

  assert.equal(wire.$schema, undefined);
  assert.equal(wire.additionalProperties, false);
  assert.deepEqual(wire.required, ['tieu_de', 'thuoc_tinh', 'maxLength', 'mo_ta']);

  const chuoiTieuDe = wire.properties.tieu_de.anyOf.find((nut) => nut.type === 'string');

  assert.ok(wire.properties.tieu_de.anyOf.some((nut) => nut.type === 'null'));
  assert.equal(chuoiTieuDe.maxLength, undefined);
  assert.equal(chuoiTieuDe.minLength, undefined);
  assert.match(chuoiTieuDe.description, /Tên sản phẩm/);
  assert.match(chuoiTieuDe.description, /Tối thiểu 2 ký tự/);
  assert.match(chuoiTieuDe.description, /Tối đa 10 ký tự/);
  assert.equal(wire.properties.mo_ta.description, 'Tối đa 200 ký tự');
  assert.equal(wire.properties.mo_ta.maxLength, undefined);
  assert.equal(wire.properties.thuoc_tinh.minItems, 1);
  assert.equal(wire.properties.thuoc_tinh.maxItems, 2);
  assert.equal(wire.properties.thuoc_tinh.items.properties.gia_tri.maxLength, undefined);
  assert.equal(wire.properties.thuoc_tinh.items.properties.gia_tri.description, 'Tối đa 5 ký tự');
  assert.deepEqual(wire.properties.thuoc_tinh.items.properties.loai.enum, ['SO', 'CHU']);
  assert.equal(wire.properties.thuoc_tinh.items.additionalProperties, false);
  assert.equal(
    wire.properties.maxLength.type,
    'string',
    'Không xóa thuộc tính chỉ vì trùng tên từ khóa',
  );
  assert.equal(
    schema.safeParse({
      tieu_de: 'hợp lệ',
      thuoc_tinh: [{ gia_tri: '1', loai: 'SO' }],
      maxLength: 'hop le',
      mo_ta: 'mo ta',
    }).success,
    true,
  );
  assert.equal(
    schema.safeParse({
      tieu_de: 'x'.repeat(11),
      thuoc_tinh: [{ gia_tri: '1', loai: 'SO' }],
      maxLength: 'hop le',
      mo_ta: 'mo ta',
    }).success,
    false,
  );
  assert.equal(
    schema.safeParse({
      tieu_de: null,
      thuoc_tinh: Array(3).fill({ gia_tri: '1', loai: 'SO' }),
      maxLength: 'hop le',
      mo_ta: 'mo ta',
    }).success,
    false,
  );
});

test('Dấu vân tay nhận ảnh nén lại; ảnh phẳng khác nhau không bị coi là trùng', async () => {
  const raw = Buffer.alloc(128 * 128 * 3);

  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      raw.fill((x * 2 + y) % 256, (y * 128 + x) * 3, (y * 128 + x) * 3 + 3);
    }
  }

  const png = await sharp(raw, {
    raw: {
      width: 128,
      height: 128,
      channels: 3,
    },
  })
    .png()
    .toBuffer();
  const jpg = await sharp(png).resize(256).jpeg({ quality: 80 }).toBuffer();

  assert.equal(anhGiongNhau(await tinhDauVan(png), await tinhDauVan(jpg)), true);

  const trang = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 3,
      background: 'white',
    },
  })
    .png()
    .toBuffer();
  const den = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 3,
      background: 'black',
    },
  })
    .png()
    .toBuffer();

  assert.equal(anhGiongNhau(await tinhDauVan(trang), await tinhDauVan(den)), false);
});

test('Che chữ theo tọa độ OCR, bỏ metadata; thiếu tọa độ thì chặn', async () => {
  const png = await sharp({
    create: {
      width: 200,
      height: 100,
      channels: 3,
      background: 'white',
    },
  })
    .png()
    .toBuffer();
  const worker = {
    recognize: async () => ({
      data: {
        text: 'private@example.com',
        blocks: [
          {
            paragraphs: [
              {
                lines: [
                  {
                    bbox: {
                      x0: 10,
                      y0: 10,
                      x1: 100,
                      y1: 30,
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    }),
  };
  const url = await cheChu(png, worker);
  const out = Buffer.from(url.split(',')[1], 'base64');
  const meta = await sharp(out).metadata();

  assert.equal(meta.exif, undefined);

  const pixel = await sharp(out)
    .extract({
      left: 20,
      top: 20,
      width: 1,
      height: 1,
    })
    .raw()
    .toBuffer();

  assert.ok(pixel[0] < 150);
  await assert.rejects(cheChu(png, { recognize: async () => ({ data: { text: 'contact' } }) }), {
    status: 422,
  });
});

test('AI trả lỗi được ghi mã lỗi; không ghi prompt hoặc bí mật; dữ liệu đầu ra sai bị bỏ', async () => {
  const cu = {
    fetch: global.fetch,
    warn: console.warn,
    env: [process.env.AI_ENABLED, process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL],
  };
  const logs = [];

  console.warn = (...s) => logs.push(s);

  const schema = z.strictObject({ canh_bao: z.array(z.string().max(5)).max(1) });

  try {
    process.env.AI_ENABLED = 'false';
    global.fetch = async () => {
      throw new Error('Không được gọi khi tắt');
    };
    assert.equal(await taoNoiDung(schema, {}), null);
    process.env.AI_ENABLED = 'true';
    process.env.OPENAI_API_KEY = 'key-test';
    process.env.OPENAI_MODEL = 'model-test';
    global.fetch = async (_url, opts) => {
      const b = JSON.parse(opts.body);

      assert.equal(b.store, false);
      assert.equal(b.max_output_tokens, 6000);
      assert.equal(b.text.format.strict, true);
      assert.equal(b.text.format.schema.properties.canh_bao.maxItems, 1);
      assert.equal(b.text.format.schema.$schema, undefined);
      assert.equal(b.text.format.schema.properties.canh_bao.items.maxLength, undefined);
      assert.equal(b.text.format.schema.properties.canh_bao.items.description, 'Tối đa 5 ký tự');

      return { ok: false, status: 429 };
    };
    assert.equal(await taoNoiDung(schema, { secret: 'private-test' }), null);
    assert.equal(logs[0][1].status, 429);
    assert.equal(JSON.stringify(logs).includes('private-test'), false);
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        status: 'completed',
        output: [
          { type: 'message', content: [{ type: 'output_text', text: '{"auto_approve":true}' }] },
        ],
      }),
    });
    assert.equal(await taoNoiDung(schema, {}), null);
    assert.equal(logs[1][1].loai, 'schema');
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        status: 'completed',
        output: [
          {
            type: 'message',
            content: [
              { type: 'output_text', text: JSON.stringify({ canh_bao: ['noi dung qua dai'] }) },
            ],
          },
        ],
      }),
    });
    assert.equal(
      await taoNoiDung(schema, {}),
      null,
      'Kết quả vượt giới hạn vẫn bị Zod gốc từ chối',
    );
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        status: 'completed',
        output: [
          {
            type: 'message',
            content: [{ type: 'output_text', text: JSON.stringify({ canh_bao: ['A', 'B'] }) }],
          },
        ],
      }),
    });
    assert.equal(await taoNoiDung(schema, {}), null, 'Không chấp nhận số phần tử vượt giới hạn');
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        status: 'incomplete',
        incomplete_details: { reason: 'max_output_tokens' },
      }),
    });
    assert.equal(await taoNoiDung(schema, {}), null);
    assert.deepEqual(logs.at(-1), [
      'AI_FAILED',
      {
        tac_vu: 'ho_tro',
        loai: 'incomplete',
        ly_do: 'max_output_tokens',
      },
    ]);
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        status: 'incomplete',
      }),
    });
    assert.equal(await taoNoiDung(schema, {}), null);
    assert.deepEqual(logs.at(-1), ['AI_FAILED', { tac_vu: 'ho_tro', loai: 'incomplete' }]);
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        status: 'completed',
        output: [
          {
            type: 'message',
            content: [
              { type: 'refusal', refusal: 'private-refusal-test' },
              { type: 'output_text', text: '{"canh_bao":[]}' },
            ],
          },
        ],
      }),
    });
    assert.equal(await taoNoiDung(schema, {}), null);
    assert.deepEqual(logs.at(-1), ['AI_FAILED', { tac_vu: 'ho_tro', loai: 'refusal' }]);
    for (const biMat of ['key-test', 'private-test', 'private-refusal-test']) {
      assert.equal(JSON.stringify(logs).includes(biMat), false);
    }
  } finally {
    global.fetch = cu.fetch;
    console.warn = cu.warn;
    ['AI_ENABLED', 'OPENAI_API_KEY', 'OPENAI_MODEL'].forEach((k, i) => {
      if (cu.env[i] === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = cu.env[i];
      }
    });
  }
});
