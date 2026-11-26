const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createRequire } = require('node:module');
const { randomBytes } = require('node:crypto');
const { MARKER, actors, catalog, makePlan } = require('./ke-hoach-mau.cjs');
let stage = 'configuration';

function samplePdf() {
  const content =
    'BT /F1 18 Tf 50 760 Td (VIETBID - DEMO ONLY) Tj 0 -32 Td ' +
    '/F1 12 Tf (Synthetic inspection report. Not a certificate of authenticity.) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((n) => String(n).padStart(10, '0') + ' 00000 n \n')
    .join('');
  return Buffer.from(
    pdf + `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`,
  );
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--plan') {
    console.log(JSON.stringify(makePlan(), null, 2));
    return;
  }
  const mode = args[0];
  assert(['--apply', '--verify'].includes(mode) && args.length === 2, 'INVALID_ARGUMENTS');
  const target = args[1].match(/^--database=([a-zA-Z0-9_-]+)$/)?.[1];
  assert(target, 'DATABASE_CONFIRMATION_REQUIRED');
  process.umask(0o077);
  const root = path.resolve(__dirname, '..');
  const privateDir = path.join(root, 'backend/.local');
  const configFile = path.join(privateDir, 'alwaysdata.json');
  assert.equal((await fs.stat(configFile)).mode & 0o077, 0, 'PRIVATE_CONFIG_PERMISSIONS');
  const config = JSON.parse(await fs.readFile(configFile, 'utf8'));
  const allowed = new Set([
    'NODE_ENV',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'DB_TIMEZONE',
    'FRONTEND_URL',
    'JWT_SECRET',
    'WEB_DIST',
    'UPLOAD_ROOT',
    'JOBS_ENABLED',
    'AI_ENABLED',
    'TRUST_PROXY_HOPS',
  ]);
  assert(Object.keys(config).length === allowed.size, 'INVALID_CONFIG');
  for (const [key, value] of Object.entries(config)) {
    assert(allowed.has(key) && typeof value === 'string', 'INVALID_CONFIG');
    process.env[key] = value;
  }
  assert(config.DB_NAME === target && config.NODE_ENV === 'production', 'WRONG_DATABASE');
  const runtime = require('./quan-ly-phat-hanh.cjs').docBan(root).root;
  const req = createRequire(path.join(runtime, 'backend/package.json'));
  const load = (name) => req(`./dist/${name}`);
  const db = load('repositories/ket-noi');
  try {
    const existing = await db.layMot(
      'SELECT du_lieu_moi FROM nhat_ky_hoat_dong WHERE ma_yeu_cau=?',
      [MARKER],
    );
    if (existing || mode === '--verify') {
      assert(existing, 'DEMO_NOT_CREATED');
      const saved =
        typeof existing.du_lieu_moi === 'string'
          ? JSON.parse(existing.du_lieu_moi)
          : existing.du_lieu_moi;
      await verify(db, saved);
      console.log('DEMO_ALREADY_PRESENT_NO_CHANGES');
      return;
    }
    const meta = JSON.parse(
      await fs.readFile(path.join(root, 'backend/demo-assets/nguon-anh.json'), 'utf8'),
    );
    for (const item of catalog) {
      assert(
        meta.some((m) => m.ten_tap_tin === item.file && m.giay_phep),
        'ASSET_LICENSE_MISSING',
      );
      assert(
        (await fs.stat(path.join(root, 'backend/demo-assets', item.file))).isFile(),
        'ASSET_MISSING',
      );
    }
    // Sao lưu riêng trên hosting; không in nội dung hoặc chuyển bản sao sang GitHub.
    stage = 'backup';
    const backupFile = path.join(privateDir, `backups/before-demo-${Date.now()}.json`);
    const backup = require('../co-so-du-lieu/cong-cu/ban-sao-csdl.cjs');
    const connection = await req('mysql2/promise').createConnection({
      host: config.DB_HOST,
      port: Number(config.DB_PORT),
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      database: config.DB_NAME,
      charset: 'utf8mb4',
      dateStrings: true,
      supportBigNumbers: true,
      bigNumberStrings: true,
    });
    try {
      await backup.luuBanSao(connection, target, backupFile);
      backup.docBanSao(backupFile);
    } finally {
      await connection.end();
    }
    console.log('DEMO_BACKUP_VERIFIED');
    const credentialsFile = path.join(privateDir, 'demo-cloud-accounts.json');
    let credentials;
    try {
      credentials = JSON.parse(await fs.readFile(credentialsFile, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      credentials = actors.map((actor) => ({
        ...actor,
        password: randomBytes(18).toString('base64url') + '!aA7',
      }));
      await fs.writeFile(credentialsFile, JSON.stringify(credentials, null, 2), {
        flag: 'wx',
        mode: 0o600,
      });
    }
    assert.deepEqual(
      credentials.map((x) => x.email),
      actors.map((x) => x.email),
      'INVALID_DEMO_CREDENTIALS',
    );
    const sharp = req('sharp');
    const files = load('services/tai-tep');
    const users = load('services/nguoi-dung');
    const products = load('services/danh-muc-san-pham');
    const inspections = load('services/kiem-dinh');
    const auctions = load('services/dau-gia');
    const orders = load('services/don-hang');
    const categories = load('repositories/danh-muc-san-pham');
    const records = load('repositories/ban-ghi');
    const time = load('utils/thoi-gian');
    const plan = makePlan();
    const banner = Buffer.from(
      '<svg width="1000" height="60"><rect width="1000" height="60" fill="#17211c"/><text x="500" y="38" text-anchor="middle" font-family="sans-serif" font-size="23" fill="white">VIETBID | DEMO - KHONG PHAI HANG BAN THAT</text></svg>',
    );
    const syntheticId = await sharp({
      create: { width: 900, height: 450, channels: 3, background: '#f4f0e5' },
    })
      .composite([
        {
          input: Buffer.from(
            '<svg width="900" height="450"><text x="40" y="150" font-family="sans-serif" font-size="36">VIETBID - HO SO MAU</text><text x="40" y="230" font-family="sans-serif" font-size="24">DU LIEU GIA LAP - KHONG PHAI GIAY TO CA NHAN</text></svg>',
          ),
        },
      ])
      .png()
      .toBuffer();
    const upload = async (actor, group, buffer, mimetype) =>
      (
        await files.luu(actor, group, {
          buffer,
          size: buffer.length,
          mimetype,
        })
      ).duong_dan;

    const result = await db.giaoDich(async () => {
      // Khóa cùng một Admin để hai lần chạy không cùng tạo dữ liệu; không thay đổi Admin.
      const admin = await db.layMot(
        "SELECT * FROM nguoi_dung WHERE vai_tro='QUAN_TRI' AND trang_thai_tai_khoan='HOAT_DONG' ORDER BY id LIMIT 1 FOR UPDATE",
      );
      assert(admin, 'ADMIN_REQUIRED');
      assert(
        !(await db.layMot('SELECT id FROM nhat_ky_hoat_dong WHERE ma_yeu_cau=?', [MARKER])),
        'DEMO_CONCURRENT_RUN',
      );
      const people = [];
      stage = 'actors';
      for (const [index, actor] of credentials.entries()) {
        const person = await users.dangKy({
          ho_ten: actor.title,
          email: actor.email,
          mat_khau: actor.password,
        });
        await users.luuDiaChi(person, null, {
          ten_nguoi_nhan: actor.title,
          sdt_nguoi_nhan: `09990000${String(index + 1).padStart(2, '0')}`,
          tinh_thanh: 'Thành phố mẫu',
          quan_huyen: 'Khu vực thử nghiệm',
          phuong_xa: 'Khu mẫu',
          dia_chi_chi_tiet: 'Địa chỉ mô phỏng VietBid, không giao hàng thực',
          la_mac_dinh: true,
        });
        if (actor.role !== 'buyer') {
          const image = await upload(person, 'verification', syntheticId, 'image/png');
          const verification = await users.guiXacMinh(person, {
            loai_giay_to: 'KHAC',
            so_giay_to: `VIETBID-DEMO-${index + 1}`,
            anh_mat_truoc: image,
            anh_selfie: image,
            ten_ngan_hang: 'Mô phỏng — không thanh toán thật',
            so_tai_khoan: `DEMO-${index + 1}`,
            chu_tai_khoan: actor.title,
          });
          if (actor.role === 'seller')
            await users.duyetXacMinh(admin, verification.id, { trang_thai: 'DA_XAC_MINH' });
        }
        people.push(await users.hoSo(person));
      }
      const summary = {
        marker: MARKER,
        start: plan.start,
        end: plan.end,
        users: people.map((p) => String(p.id)),
        products: [],
        auctions: [],
        orders: [],
        expectedOpen: plan.auctions.length,
      };
      const cachedImages = new Map();
      async function makeProduct(item, state = 'APPROVED') {
        stage = `product-${summary.products.length + 1}-${state}`;
        const seller = people[(item.category - 1) % 3];
        const definition = await categories.danhSachThuocTinh(item.category);
        const attributes = definition
          .filter((d) => Object.hasOwn(item.attributes, d.khoa_thuoc_tinh))
          .map((d) => ({
            thuoc_tinh_id: String(d.id),
            gia_tri: item.attributes[d.khoa_thuoc_tinh],
          }));
        await products.kiemTraGiaTriThuocTinh(item.category, attributes, true);
        const source = meta.find((m) => m.ten_tap_tin === item.file);
        const description =
          `DỮ LIỆU MẪU VIETBID — không phải hàng chào bán thực tế. ${item.title}. ` +
          'Mô phỏng đồ sưu tầm đã qua sử dụng tốt; thông số, giá và chứng từ chỉ dùng thử quy trình. ' +
          'Không chuyển khoản hoặc gửi hàng thật. Ảnh đã thu nhỏ và thêm nhãn DEMO. ' +
          `Nguồn ảnh: ${source.trang_nguon}. Tác giả: ${source.tac_gia || 'Theo trang nguồn'}. Giấy phép: ${source.giay_phep}. ` +
          (source.lien_ket_giay_phep || '');
        const product = await products.luuSanPham(seller, null, {
          danh_muc_id: String(item.category),
          tieu_de: `[Mẫu] ${item.title}`,
          mo_ta: description,
          tinh_trang_san_pham: 'DA_QUA_SU_DUNG_TOT',
          thuong_hieu: item.brand,
          thuoc_tinh: attributes,
        });
        let image = cachedImages.get(item.file);
        if (!image) {
          const buffer = await sharp(path.join(root, 'backend/demo-assets', item.file))
            .rotate()
            .resize(1000, 800, { fit: 'contain', background: '#f4f0e5' })
            .composite([{ input: banner, gravity: 'south' }])
            .jpeg({ quality: 82 })
            .toBuffer();
          image = await upload(seller, 'product', buffer, 'image/jpeg');
          cachedImages.set(item.file, image);
        }
        await products.themAnh(seller, product.id, {
          duong_dan_anh: image,
          la_anh_chinh: true,
          thu_tu: 0,
        });
        summary.products.push(String(product.id));
        if (state === 'DRAFT') return product;
        await products.guiDuyet(seller, product.id);
        if (state === 'PENDING') return product;
        if (state === 'REJECTED') {
          await products.duyet(admin, product.id, {
            trang_thai_duyet: 'TU_CHOI',
            ly_do_tu_choi:
              'Hồ sơ mẫu: cần bổ sung ảnh mặt sau và thông tin tình trạng trước khi gửi lại.',
          });
          return product;
        }
        const inspection = await inspections.tao(admin, product.id);
        if (state === 'WAIT_SEND') return product;
        await inspections.guiTrungTam(seller, inspection.id, {
          don_vi_van_chuyen: 'Vận chuyển mô phỏng VietBid',
          ma_van_don: `DEMO-IN-${product.id}`,
        });
        await inspections.nhanHang(admin, inspection.id, {
          tinh_trang_khi_nhan: 'Kiện hàng mô phỏng, đủ phụ kiện theo hồ sơ mẫu.',
          serial_khi_nhan: `DEMO-SEAL-${product.id}`,
          so_kien: 1,
          ghi_chu: 'Không có hàng thực tại trung tâm.',
        });
        await inspections.batDau(admin, inspection.id);
        if (state === 'INSPECTING') return product;
        const report = await upload(admin, 'inspection', samplePdf(), 'application/pdf');
        await inspections.themTep(admin, inspection.id, {
          loai_tep: 'BAO_CAO_KIEM_DINH',
          duong_dan_tep: report,
          mo_ta: 'Báo cáo mẫu, không có giá trị xác thực hoặc giám định.',
        });
        await inspections.ghiKetQua(admin, inspection.id, {
          ket_qua: 'DAT',
          ten_chuyen_gia: 'Chuyên gia mô phỏng VietBid',
          don_vi_kiem_dinh: 'Trung tâm mẫu — không giám định thực',
          ngay_kiem_dinh: time.doiThanhNgay(await db.thoiGianHienTai()).toISOString(),
          nhan_xet:
            'Kết quả giả lập để thực hành nghiệp vụ. Không xác nhận tính thật giả hay giá trị của vật phẩm trong ảnh.',
          ma_chung_nhan: `DEMO-ONLY-${product.id}`,
        });
        await products.duyet(admin, product.id, { trang_thai_duyet: 'DA_DUYET' });
        return product;
      }
      async function makeAuction(item, product, live = false, buyNow = false) {
        stage = `auction-${summary.auctions.length + 1}`;
        const auction = await auctions.tao(people[(item.category - 1) % 3], {
          san_pham_id: String(product.id),
          gia_khoi_diem: item.price,
          gia_mua_ngay: buyNow ? Math.round(item.price * 1.5) : null,
          phi_van_chuyen: 30000,
          thoi_gian_bat_dau: live ? new Date().toISOString() : item.start,
          thoi_gian_ket_thuc: item.end,
        });
        summary.auctions.push(String(auction.id));
        return auction;
      }
      for (const item of plan.auctions) {
        await makeAuction(item, await makeProduct(item), item.batch === 0);
      }
      for (const [index, state] of [
        'DRAFT',
        'PENDING',
        'WAIT_SEND',
        'INSPECTING',
        'READY',
        'REJECTED',
      ].entries()) {
        await makeProduct(catalog[index + 6], state);
      }
      // Hai đơn mẫu tạo bằng Mua ngay thật của dịch vụ, giữ đúng sổ tiền và hồ sơ hàng.
      for (let i = 0; i < 2; i++) {
        const item = {
          ...plan.auctions[i + 4],
          end: new Date(Date.now() + 14 * 86400000).toISOString(),
        };
        const auction = await makeAuction(item, await makeProduct(item), true, true);
        const buyer = people[i + 4];
        stage = `order-${i + 1}`;
        if (auction.yeu_cau_dat_coc) {
          await load('services/dat-coc').dangKy(buyer, auction.id);
          await load('services/dat-coc').thanhToan(buyer, auction.id, {
            khoa_yeu_cau: `${MARKER}-coc-${i}`,
          });
        }
        const purchase = await auctions.muaNgay(buyer, auction.id, {
          khoa_yeu_cau: `${MARKER}-buy-${i}`,
        });
        summary.orders.push(String(purchase.don_hang.id));
        if (i === 1) {
          await orders.guiHang(admin, purchase.don_hang.id, {
            don_vi_van_chuyen: 'Vận chuyển mô phỏng VietBid',
            ma_van_don: `DEMO-OUT-${auction.id}`,
          });
          await orders.xacNhanDaGiao(buyer, purchase.don_hang.id);
        }
      }
      for (const [index, buyer] of people.slice(4).entries()) {
        stage = 'watchlists';
        for (const auction of summary.auctions.slice(index * 2, index * 2 + 4)) {
          await auctions.theoDoi(buyer, auction, true);
        }
      }
      await records.them('nhat_ky_hoat_dong', {
        nguoi_thuc_hien_id: admin.id,
        hanh_dong: 'TAO_DU_LIEU_MAU_CLOUD',
        loai_doi_tuong: 'he_thong',
        ma_yeu_cau: MARKER,
        du_lieu_moi: JSON.stringify(summary),
      });
      return summary;
    });
    await verify(db, result);
    console.log('DEMO_CREATED');
  } finally {
    await db.nhomKetNoi.end();
  }
}

async function verify(db, summary) {
  const count = async (table, ids) => {
    assert(['nguoi_dung', 'san_pham', 'phien_dau_gia', 'don_hang'].includes(table));
    assert(ids.length && ids.every((id) => /^\d+$/.test(id)), 'INVALID_DEMO_IDS');
    return Number(
      (
        await db.layMot(
          `SELECT COUNT(*) n FROM ${table} WHERE id IN (${ids.map(() => '?').join(',')})`,
          ids,
        )
      ).n,
    );
  };
  for (const [table, key] of [
    ['nguoi_dung', 'users'],
    ['san_pham', 'products'],
    ['phien_dau_gia', 'auctions'],
    ['don_hang', 'orders'],
  ]) {
    assert.equal(await count(table, summary[key]), summary[key].length, 'DEMO_RECORDS_MISSING');
  }
  console.log(
    JSON.stringify({
      status: 'DEMO_VERIFIED',
      accounts: summary.users.length,
      products: summary.products.length,
      auctions: summary.auctions.length,
      orders: summary.orders.length,
      scheduledThrough: summary.end,
    }),
  );
}

if (require.main === module)
  main().catch((error) => {
    // Không in mật khẩu, câu SQL, giá trị tham số hoặc cấu hình kết nối.
    console.error('DEMO_FAILED', stage, error.code || error.name);
    process.exitCode = 1;
  });

module.exports = { samplePdf };
