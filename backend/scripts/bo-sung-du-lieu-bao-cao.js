const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

require('../dist/config/moi-truong');
const banSao = require('../../co-so-du-lieu/cong-cu/ban-sao-csdl.cjs');

const tenCoSoDuLieu = 'doan4_daugia';
const matKhauDemo = 'VietBid@2026';
const dauMoc = 'VIETBID_BAO_CAO_50_V1';
const thuMucTaiLen = path.resolve(__dirname, '../uploads');
const thuMucBanSao = path.resolve(__dirname, '../../co-so-du-lieu/ban-sao-rieng');
const tepNguon = path.resolve(__dirname, '../demo-assets/du-lieu-mo-rong-bao-cao.json');

const ho = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Đinh'];
const tenDem = ['Anh', 'Minh', 'Quang', 'Thu', 'Ngọc', 'Thanh', 'Gia'];
const ten = ['Khang', 'Lan', 'Long', 'Linh', 'Phúc', 'Vy', 'Tuấn', 'Thảo', 'Sơn', 'Trang'];

function taoTaiKhoan() {
  const ketQua = [];

  for (let i = 0; i < 35; i++) {
    const laNguoiBan = i < 15;
    const id = laNguoiBan ? 1106 + i : 1211 + (i - 15);
    const hoTen = `${ho[i % ho.length]} ${tenDem[(i * 3) % tenDem.length]} ${ten[(i * 7) % ten.length]}`;

    ketQua.push({
      id,
      hoTen,
      email: `${laNguoiBan ? 'nguoi.ban' : 'nguoi.mua'}.${String(id).slice(-2)}@vietbid.test`,
      loai: laNguoiBan ? 'NGUOI_BAN' : 'NGUOI_MUA',
      soDienThoai: `099000${id}`,
    });
  }

  return ketQua;
}

const sanPham = [
  [
    123,
    1106,
    64,
    'Bình đồng Đông Sơn thế kỷ XIX',
    'binh-dong-dong-son-the-ky-19',
    'Đồ cổ',
    'bronze vase',
  ],
  [
    124,
    1107,
    64,
    'Hộp sơn mài khảm trai Bắc Bộ',
    'hop-son-mai-kham-trai-bac-bo',
    'Sơn mài',
    'lacquer box mother of pearl',
  ],
  [
    125,
    1108,
    64,
    'Đồng hồ để bàn Pháp thế kỷ XIX',
    'dong-ho-de-ban-phap-the-ky-19',
    'Japy Frères',
    'antique mantel clock',
  ],
  [
    126,
    1109,
    65,
    'Tranh sơn dầu phong cảnh cao nguyên',
    'tranh-son-dau-phong-canh-cao-nguyen',
    'Mỹ thuật Việt Nam',
    'landscape oil painting',
  ],
  [
    127,
    1110,
    65,
    'Bản in đá phố cổ giới hạn 25 bản',
    'ban-in-da-pho-co-gioi-han',
    'Đồ họa',
    'old town lithograph',
  ],
  [
    128,
    1111,
    65,
    'Tượng đồng thiếu nữ đầu thế kỷ XX',
    'tuong-dong-thieu-nu-dau-the-ky-20',
    'Điêu khắc',
    'bronze woman sculpture',
  ],
  [
    129,
    1112,
    66,
    'Rolex GMT Master II Pepsi',
    'rolex-gmt-master-ii-pepsi',
    'Rolex',
    'Rolex GMT watch',
  ],
  [
    130,
    1113,
    66,
    'Cartier Tank Must mặt số đen',
    'cartier-tank-must-mat-so-den',
    'Cartier',
    'Cartier Tank watch',
  ],
  [
    131,
    1114,
    66,
    'Vacheron Constantin Patrimony',
    'vacheron-constantin-patrimony',
    'Vacheron Constantin',
    'Vacheron Constantin watch',
  ],
  [
    132,
    1115,
    67,
    'Nhẫn sapphire Ceylon vàng trắng',
    'nhan-sapphire-ceylon-vang-trang',
    'Trang sức thủ công',
    'sapphire ring',
  ],
  [
    133,
    1116,
    67,
    'Chuỗi ngọc phỉ thúy chạm thủ công',
    'chuoi-ngoc-phi-thuy-cham-thu-cong',
    'Ngọc học',
    'jade necklace',
  ],
  [
    134,
    1117,
    67,
    'Trâm cài Cartier Panthère cổ điển',
    'tram-cai-cartier-panthere-co-dien',
    'Cartier',
    'panther brooch jewelry',
  ],
  [
    135,
    1118,
    68,
    'Rương Louis Vuitton Monogram cổ',
    'ruong-louis-vuitton-monogram-co',
    'Louis Vuitton',
    'Louis Vuitton trunk',
  ],
  [
    136,
    1119,
    68,
    'Túi Hermès Kelly 28 da Epsom',
    'tui-hermes-kelly-28-da-epsom',
    'Hermès',
    'Hermes Kelly handbag',
  ],
  [
    137,
    1120,
    69,
    'Porsche 356 Speedster phục chế',
    'porsche-356-speedster-phuc-che',
    'Porsche',
    'Porsche 356',
  ],
  [
    138,
    1106,
    69,
    'Vespa GS 150 đời 1962',
    'vespa-gs-150-doi-1962',
    'Piaggio',
    'Vespa scooter vintage',
  ],
  [
    139,
    1107,
    70,
    'Bản thảo chữ Nôm đầu thế kỷ XX',
    'ban-thao-chu-nom-dau-the-ky-20',
    'Thư tịch cổ',
    'Vietnamese manuscript',
  ],
  [
    140,
    1108,
    70,
    'Atlas Đông Dương bản in 1930',
    'atlas-dong-duong-ban-in-1930',
    'Imprimerie Extrême-Orient',
    'Indochina atlas',
  ],
  [
    141,
    1109,
    71,
    'Huy chương thể thao Đông Dương',
    'huy-chuong-the-thao-dong-duong',
    'Kỷ vật lịch sử',
    'sports medal antique',
  ],
  [
    142,
    1110,
    72,
    'Gibson Les Paul Standard 1974',
    'gibson-les-paul-standard-1974',
    'Gibson',
    'Gibson Les Paul guitar',
  ],
  [
    143,
    1111,
    73,
    'Hasselblad 500C cùng ống kính Planar',
    'hasselblad-500c-ong-kinh-planar',
    'Hasselblad',
    'Hasselblad 500C',
  ],
  [
    144,
    1112,
    73,
    'Ống nhòm Zeiss Dialyt 8x56 cổ điển',
    'ong-nhom-zeiss-dialyt-8x56',
    'Zeiss',
    'Zeiss binoculars',
  ],
].map(([id, nguoiBanId, danhMucId, tieuDe, duongDan, thuongHieu, tuKhoa], viTri) => ({
  id,
  nguoiBanId,
  danhMucId,
  tieuDe,
  duongDan,
  thuongHieu,
  tuKhoa,
  trangThai: viTri < 12 ? 'BAN_NHAP' : 'CHO_XU_LY',
}));

async function ketNoi() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: tenCoSoDuLieu,
    charset: 'utf8mb4',
    timezone: '+07:00',
    dateStrings: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
    connectTimeout: 10000,
  });

  await c.query("SET time_zone='+07:00'");

  return c;
}

async function thongKe(c) {
  const [[nguoiDung]] = await c.query(
    `SELECT COUNT(*) AS tong,
            SUM(vai_tro='QUAN_TRI') AS quan_tri,
            SUM(vai_tro='NGUOI_DUNG' AND trang_thai_nguoi_ban='DA_XAC_MINH') AS nguoi_ban
     FROM nguoi_dung`,
  );
  const [[sanPham]] = await c.query('SELECT COUNT(*) AS tong FROM san_pham');
  const [[anh]] = await c.query(
    "SELECT COUNT(*) AS tong FROM tep_dinh_kem WHERE loai_tep='ANH_SAN_PHAM' AND la_anh_chinh=1",
  );
  const [[dauMocDaCo]] = await c.query(
    'SELECT COUNT(*) AS tong FROM nhat_ky_hoat_dong WHERE ma_yeu_cau=?',
    [dauMoc],
  );

  return {
    tai_khoan: Number(nguoiDung.tong),
    quan_tri: Number(nguoiDung.quan_tri),
    nguoi_ban_da_xac_minh: Number(nguoiDung.nguoi_ban),
    san_pham: Number(sanPham.tong),
    anh_chinh_san_pham: Number(anh.tong),
    da_bo_sung: Number(dauMocDaCo.tong) > 0,
  };
}

function phanMoRong(mime) {
  if (mime.includes('png')) {
    return '.png';
  }
  if (mime.includes('webp')) {
    return '.webp';
  }

  return '.jpg';
}

function dungDinhDangAnh(duLieu, mime) {
  if (mime.includes('png')) {
    return duLieu.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
  }
  if (mime.includes('webp')) {
    return duLieu.subarray(0, 4).toString() === 'RIFF';
  }

  return duLieu[0] === 0xff && duLieu[1] === 0xd8;
}

function cho(thoiGian) {
  return new Promise((resolve) => setTimeout(resolve, thoiGian));
}

async function goiWikimedia(duongDan) {
  for (let lanThu = 1; lanThu <= 4; lanThu++) {
    try {
      const phanHoi = await fetch(duongDan, {
        headers: { 'User-Agent': 'VietBid-DoAn4/1.0 (academic demo)' },
      });

      if (phanHoi.ok) {
        return phanHoi;
      }
    } catch {
      // Wikimedia đôi khi giới hạn kết nối ngắn hạn; thử lại có khoảng nghỉ.
    }

    await cho(lanThu * 2000);
  }

  return null;
}

async function taiAnh(muc) {
  const cacTu = muc.tuKhoa.split(/\s+/).filter(Boolean);
  const cacTuKhoa = [
    muc.tuKhoa,
    cacTu.slice(1).join(' '),
    cacTu.slice(-2).join(' '),
    cacTu.at(-1),
  ].filter((tuKhoa, viTri, danhSach) => tuKhoa && danhSach.indexOf(tuKhoa) === viTri);

  const cacTrangUngVien = [];
  const cacDuongDanDaCo = new Set();

  for (const tuKhoa of cacTuKhoa) {
    const thamSo = new URLSearchParams({
      action: 'query',
      format: 'json',
      generator: 'search',
      gsrsearch: tuKhoa,
      gsrnamespace: '6',
      gsrlimit: '20',
      prop: 'imageinfo',
      iiprop: 'url|mime|extmetadata',
      iiurlwidth: '1200',
      origin: '*',
    });
    const phanHoi = await goiWikimedia(`https://commons.wikimedia.org/w/api.php?${thamSo}`);

    if (!phanHoi) {
      continue;
    }

    const noiDung = await phanHoi.json();
    const cacTrang = Object.values(noiDung.query?.pages || {});

    for (const trang of cacTrang) {
      const thongTin = trang.imageinfo?.[0];
      const duongDanAnh = thongTin?.thumburl || thongTin?.url;

      if (!duongDanAnh || cacDuongDanDaCo.has(duongDanAnh)) {
        continue;
      }

      cacDuongDanDaCo.add(duongDanAnh);
      cacTrangUngVien.push(trang);
    }

    if (cacTrangUngVien.length > 0) {
      break;
    }
  }

  assert(cacTrangUngVien.length > 0, `Wikimedia Commons không có ảnh phù hợp cho ${muc.tieuDe}`);

  for (const trang of cacTrangUngVien) {
    const thongTin = trang.imageinfo[0];
    const duongDanAnh = thongTin.thumburl || thongTin.url;
    let taiVe;

    try {
      taiVe = await fetch(duongDanAnh, {
        headers: { 'User-Agent': 'VietBid-DoAn4/1.0 (academic demo)' },
      });
    } catch {
      continue;
    }

    if (!taiVe.ok) {
      continue;
    }

    const mimePhanHoi = taiVe.headers.get('content-type') || thongTin.mime || 'image/jpeg';
    const duLieu = Buffer.from(await taiVe.arrayBuffer());

    if (duLieu.length < 10000 || duLieu.length > 8 * 1024 * 1024) {
      continue;
    }

    const mime = mimePhanHoi.split(';')[0].trim().toLowerCase();

    if (!dungDinhDangAnh(duLieu, mime)) {
      continue;
    }

    const thuMuc = path.join(thuMucTaiLen, 'product', String(muc.nguoiBanId));
    const tenTep = `${crypto.randomUUID()}${phanMoRong(mime)}`;
    const tep = path.join(thuMuc, tenTep);

    await fs.mkdir(thuMuc, { recursive: true });
    await fs.writeFile(tep, duLieu, { flag: 'wx' });

    const meta = thongTin.extmetadata || {};

    return {
      tep,
      duong_dan: `/api/uploads/files/product/${muc.nguoiBanId}/${tenTep}`,
      tieu_de_nguon: trang.title,
      trang_nguon: thongTin.descriptionurl,
      tac_gia: meta.Artist?.value?.replace(/<[^>]+>/g, '') || 'Wikimedia Commons',
      giay_phep: meta.LicenseShortName?.value || meta.UsageTerms?.value || 'Xem trang nguồn',
      mime,
      dung_luong: duLieu.length,
      sha256: crypto.createHash('sha256').update(duLieu).digest('hex'),
    };
  }

  throw new Error(`Không tải được ảnh hợp lệ cho ${muc.tieuDe}`);
}

async function taiAnhSanPham() {
  const ketQua = [];

  for (const muc of sanPham) {
    console.log(`Đang lấy ảnh đúng chủ đề: ${muc.tieuDe}`);
    ketQua.push({ san_pham_id: muc.id, ...(await taiAnh(muc)) });
    await cho(1200);
  }

  return ketQua;
}

async function luuBanSao(c) {
  const nhanThoiGian = new Date().toISOString().replace(/[:.]/g, '-');
  const tep = path.join(thuMucBanSao, `${tenCoSoDuLieu}_truoc_mo_rong_50_${nhanThoiGian}.json`);

  await banSao.luuBanSao(c, tenCoSoDuLieu, tep);
  banSao.docBanSao(tep);
  console.log(`Đã sao lưu: ${path.basename(tep)}`);
}

async function chenDuLieu(c, anh) {
  const taiKhoan = taoTaiKhoan();
  const maBam = await bcrypt.hash(matKhauDemo, 12);

  await c.beginTransaction();
  try {
    for (const [viTri, muc] of taiKhoan.entries()) {
      await c.execute(
        `INSERT INTO nguoi_dung
          (id,ho_ten,email,mat_khau_bam,so_dien_thoai,vai_tro,trang_thai_nguoi_ban,ngay_xac_minh_email,ngay_tao)
         VALUES (?,?,?,?,?,'NGUOI_DUNG',?,NOW(),DATE_SUB(NOW(),INTERVAL ? DAY))`,
        [
          muc.id,
          muc.hoTen,
          muc.email,
          maBam,
          muc.soDienThoai,
          muc.loai === 'NGUOI_BAN' ? 'DA_XAC_MINH' : 'CHUA_DANG_KY',
          55 - (viTri % 25),
        ],
      );
      await c.execute(
        `INSERT INTO dia_chi_nguoi_dung
          (nguoi_dung_id,ten_nguoi_nhan,sdt_nguoi_nhan,tinh_thanh,quan_huyen,phuong_xa,dia_chi_chi_tiet,la_mac_dinh)
         VALUES (?,?,?,?,?,?,?,1)`,
        [
          muc.id,
          muc.hoTen,
          muc.soDienThoai,
          viTri % 2 ? 'Hà Nội' : 'TP Hồ Chí Minh',
          viTri % 2 ? 'Hoàn Kiếm' : 'Quận 3',
          viTri % 2 ? 'Hàng Bài' : 'Phường Võ Thị Sáu',
          `${18 + viTri} đường Sưu Tầm, địa chỉ thực hành VietBid`,
        ],
      );

      if (muc.loai === 'NGUOI_BAN') {
        await c.execute(
          `INSERT INTO xac_minh_nguoi_ban
            (nguoi_dung_id,loai_giay_to,so_giay_to,ten_ngan_hang,so_tai_khoan,chu_tai_khoan,trang_thai,ngay_duyet,nguoi_duyet_id)
           VALUES (?,'KHAC',?,?,?,?, 'DA_XAC_MINH',NOW(),1001)`,
          [muc.id, `VB-BC-${muc.id}`, 'Ngân hàng thực hành VietBid', `9000${muc.id}`, muc.hoTen],
        );
      }
    }

    for (const [viTri, muc] of sanPham.entries()) {
      await c.execute(
        `INSERT INTO san_pham
          (id,nguoi_ban_id,danh_muc_id,tieu_de,duong_dan,mo_ta,tinh_trang_san_pham,thuong_hieu,trang_thai_duyet,thuoc_tinh_json,bat_buoc_kiem_dinh,ngay_chup_chinh_sach_kiem_dinh,ngay_tao)
         VALUES (?,?,?,?,?,?,'DA_QUA_SU_DUNG_TOT',?,?,JSON_OBJECT('nguon_goc','Bộ sưu tập tư nhân','nam_uoc_tinh',?),1,NOW(),DATE_SUB(NOW(),INTERVAL ? DAY))`,
        [
          muc.id,
          muc.nguoiBanId,
          muc.danhMucId,
          muc.tieuDe,
          muc.duongDan,
          `${muc.tieuDe} được người bán cung cấp từ bộ sưu tập tư nhân. Hồ sơ mô tả tình trạng, nguồn gốc và ảnh chi tiết để phục vụ quy trình duyệt, kiểm định và đấu giá trên VietBid.`,
          muc.thuongHieu,
          muc.trangThai,
          String(1960 + ((viTri * 3) % 60)),
          20 - (viTri % 12),
        ],
      );

      const nguonAnh = anh.find((item) => item.san_pham_id === muc.id);

      await c.execute(
        `INSERT INTO tep_dinh_kem
          (loai_tep,san_pham_id,nguoi_tai_len_id,duong_dan_tep,loai_noi_dung,la_anh_chinh,thu_tu,mo_ta)
         VALUES ('ANH_SAN_PHAM',?,?,?,'HINH_ANH',1,0,?)`,
        [
          muc.id,
          muc.nguoiBanId,
          nguonAnh.duong_dan,
          `${nguonAnh.tieu_de_nguon} | ${nguonAnh.tac_gia} | ${nguonAnh.giay_phep}`.slice(0, 500),
        ],
      );

      if (muc.trangThai === 'CHO_XU_LY') {
        await c.execute(
          `INSERT INTO kiem_dinh_san_pham
            (ma_kiem_dinh,san_pham_id,trang_thai,ket_qua,nguoi_cap_nhat_id)
           VALUES (?,?,'CHO_GUI_TRUNG_TAM','CHO_KET_QUA',1001)`,
          [`VB-BC-KD-${muc.id}`, muc.id],
        );
      }
    }

    await c.execute(
      `INSERT INTO nhat_ky_hoat_dong
        (nguoi_thuc_hien_id,hanh_dong,loai_doi_tuong,ma_yeu_cau,du_lieu_moi)
       VALUES (1001,'BO_SUNG_DU_LIEU_BAO_CAO','he_thong',?,JSON_OBJECT('nguoi_dung_khong_gom_admin',50,'san_pham',50,'nguoi_ban_da_xac_minh',20))`,
      [dauMoc],
    );

    await c.commit();
  } catch (loi) {
    await c.rollback();
    throw loi;
  }
}

async function kiemTra(c) {
  const ketQua = await thongKe(c);
  const [[quanHe]] = await c.query(
    `SELECT
       SUM(p.nguoi_ban_id IS NULL OR n.id IS NULL OR d.id IS NULL) AS san_pham_loi,
       SUM(t.id IS NULL) AS san_pham_thieu_anh
     FROM san_pham p
     LEFT JOIN nguoi_dung n ON n.id=p.nguoi_ban_id
     LEFT JOIN danh_muc d ON d.id=p.danh_muc_id
     LEFT JOIN tep_dinh_kem t ON t.san_pham_id=p.id AND t.loai_tep='ANH_SAN_PHAM' AND t.la_anh_chinh=1`,
  );
  const [[diaChi]] = await c.query(
    `SELECT COUNT(*) AS tong FROM nguoi_dung n
     WHERE n.vai_tro='NGUOI_DUNG' AND NOT EXISTS (
       SELECT 1 FROM dia_chi_nguoi_dung d WHERE d.nguoi_dung_id=n.id AND d.la_mac_dinh=1
     )`,
  );

  assert.equal(ketQua.tai_khoan, 51, 'Cần 50 người mua/người bán và 1 Admin');
  assert.equal(ketQua.quan_tri, 1);
  assert.equal(ketQua.nguoi_ban_da_xac_minh, 20);
  assert.equal(ketQua.san_pham, 50);
  assert.equal(ketQua.anh_chinh_san_pham, 50);
  assert.equal(Number(quanHe.san_pham_loi), 0);
  assert.equal(Number(quanHe.san_pham_thieu_anh), 0);
  assert.equal(Number(diaChi.tong), 0);

  return ketQua;
}

async function chay() {
  const cheDo = process.argv[2] || '--dry-run';

  assert(
    ['--dry-run', '--apply', '--verify'].includes(cheDo),
    'Chỉ nhận --dry-run, --apply hoặc --verify',
  );

  const c = await ketNoi();
  let tepDaTao = [];

  try {
    const truoc = await thongKe(c);

    if (cheDo === '--verify') {
      console.log(JSON.stringify(await kiemTra(c), null, 2));

      return;
    }

    if (truoc.da_bo_sung) {
      console.log(
        JSON.stringify({ trang_thai: 'Đã bổ sung trước đó', ...(await kiemTra(c)) }, null, 2),
      );

      return;
    }

    assert.deepEqual(
      { tai_khoan: truoc.tai_khoan, san_pham: truoc.san_pham },
      { tai_khoan: 16, san_pham: 28 },
      'Dữ liệu nguồn đã thay đổi; dừng để tránh ghi đè hoặc tạo trùng.',
    );

    if (cheDo === '--dry-run') {
      console.log(
        JSON.stringify(
          {
            database: tenCoSoDuLieu,
            hien_tai: truoc,
            sau_khi_bo_sung: {
              tai_khoan: 51,
              nguoi_mua_va_nguoi_ban: 50,
              nguoi_ban_da_xac_minh: 20,
              nguoi_mua: 30,
              san_pham: 50,
              anh_chinh_san_pham: 50,
            },
          },
          null,
          2,
        ),
      );

      return;
    }

    const anh = await taiAnhSanPham();

    tepDaTao = anh.map((item) => item.tep);
    await luuBanSao(c);
    await chenDuLieu(c, anh);
    await fs.writeFile(
      tepNguon,
      JSON.stringify(
        {
          cap_nhat: new Date().toISOString(),
          mo_ta:
            'Ảnh bổ sung cho bộ dữ liệu báo cáo, lấy từ Wikimedia Commons; xem từng trang nguồn và giấy phép.',
          anh: anh.map(({ tep, ...muc }) => muc),
        },
        null,
        2,
      ) + '\n',
      'utf8',
    );

    console.log(JSON.stringify({ trang_thai: 'Đã bổ sung', ...(await kiemTra(c)) }, null, 2));
  } catch (loi) {
    for (const tep of tepDaTao) {
      await fs.unlink(tep).catch(() => {});
    }
    throw loi;
  } finally {
    await c.end();
  }
}

chay().catch((loi) => {
  console.error(loi.message);
  process.exitCode = 1;
});
