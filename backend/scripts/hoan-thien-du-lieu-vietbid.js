const fs = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2/promise');
const assert = require('node:assert/strict');

require('../dist/config/moi-truong');

async function ketNoi() {
  const ketNoi = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'doan4_daugia',
    timezone: '+07:00',
    dateStrings: true,
  });

  await ketNoi.query("SET time_zone='+07:00'");

  return ketNoi;
}

async function raSoat(c) {
  const cacBang = (await c.query('SHOW TABLES'))[0].map((r) => Object.values(r)[0]);
  const soLuong = {};
  const cauTruc = {};

  for (const bang of cacBang) {
    soLuong[bang] = Number((await c.query(`SELECT COUNT(*) AS n FROM \`${bang}\``))[0][0].n);
    cauTruc[bang] = (await c.query(`SHOW CREATE TABLE \`${bang}\``))[0][0]['Create Table'];
  }

  const sanPham = (
    await c.query(`SELECT s.*, n.ho_ten, d.ten AS danh_muc,
    t.duong_dan_tep AS anh_chinh, t.mo_ta AS nguon_anh
    FROM san_pham s JOIN nguoi_dung n ON n.id=s.nguoi_ban_id JOIN danh_muc d ON d.id=s.danh_muc_id
    LEFT JOIN tep_dinh_kem t ON t.san_pham_id=s.id AND t.la_anh_chinh=1 ORDER BY s.id`)
  )[0];
  const cacCotNgay = (
    await c.execute(`SELECT TABLE_NAME,COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA=DATABASE() AND DATA_TYPE IN ('datetime','timestamp')`)
  )[0];
  const ketQua = {
    thoiGian: (await c.query('SELECT NOW() AS n'))[0][0].n,
    soLuong,
    cauTruc,
    sanPham,
    cacCotNgay,
    nguoiDung: (
      await c.query(
        'SELECT id,ho_ten,email,vai_tro,trang_thai_nguoi_ban,ngay_tao FROM nguoi_dung ORDER BY id',
      )
    )[0],
    phien: (await c.query('SELECT * FROM phien_dau_gia ORDER BY id'))[0],
    donHang: (await c.query('SELECT * FROM don_hang ORDER BY id'))[0],
    kiemDinh: (await c.query('SELECT * FROM kiem_dinh_san_pham ORDER BY id'))[0],
    danhMuc: (await c.query('SELECT * FROM danh_muc WHERE dang_hoat_dong=1 ORDER BY id'))[0],
  };
  const thuMuc = path.resolve(__dirname, '../../co-so-du-lieu/ban-sao-rieng');

  await fs.mkdir(thuMuc, { recursive: true });
  await fs.writeFile(
    path.join(thuMuc, 'ra-soat-50-san-pham.json'),
    JSON.stringify(ketQua, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        thoiGian: ketQua.thoiGian,
        soLuong,
        sanPham: sanPham.map((s) => ({
          id: s.id,
          ten: s.tieu_de,
          trangThai: s.trang_thai_duyet,
          thuocTinh: s.thuoc_tinh_json,
          anh: s.nguon_anh,
        })),
        phien: ketQua.phien.map((p) => ({
          id: p.id,
          trangThai: p.trang_thai,
          batDau: p.thoi_gian_bat_dau,
          ketThuc: p.thoi_gian_ket_thuc,
        })),
      },
      null,
      2,
    ),
  );
}

async function chay() {
  const c = await ketNoi();

  try {
    if (process.argv.includes('--verify')) {
      console.log(
        JSON.stringify(
          await require('./du-lieu-demo/kiem-tra').kiemTra(c, null, { moRong: true }),
          null,
          2,
        ),
      );

      return;
    }
    if (process.argv.includes('--dry-run') || process.argv.includes('--apply')) {
      const [[khoa]] = await c.query("SELECT GET_LOCK('vietbid_hoan_thien_50',0) AS ok");

      assert.equal(Number(khoa.ok), 1, 'Đang có tiến trình dựng dữ liệu khác');
      if (process.argv.includes('--apply')) {
        const banSao = require('../../co-so-du-lieu/cong-cu/ban-sao-csdl.cjs');
        const tep = path.resolve(
          __dirname,
          `../../co-so-du-lieu/ban-sao-rieng/doan4_daugia_truoc_hoan_thien_50_${Date.now()}.json`,
        );

        await banSao.luuBanSao(c, 'doan4_daugia', tep);
        banSao.docBanSao(tep);
        console.log('Đã sao lưu đủ bảng, view, trigger và kiểm tra checksum.');
      }
      try {
        console.log(
          JSON.stringify(
            await require('./du-lieu-demo/lien-ket-bo-sung').lienKet({
              dryRun: process.argv.includes('--dry-run'),
            }),
            null,
            2,
          ),
        );
      } finally {
        await require('../dist/repositories/ket-noi').nhomKetNoi.end();
        await c.query("SELECT RELEASE_LOCK('vietbid_hoan_thien_50')");
      }

      return;
    }
    if (process.argv.includes('--prepare')) {
      await require('./du-lieu-demo/chuan-bi-bo-sung').chuanBi(c);
      console.log(
        (
          await c.execute(
            'SELECT khoa_cau_hinh,gia_tri_cau_hinh FROM cau_hinh_he_thong WHERE khoa_cau_hinh=?',
            ['DEPOSIT_POLICY'],
          )
        )[0],
      );

      return;
    }
    await raSoat(c);
  } finally {
    await c.end();
  }
}

chay().catch((loi) => {
  console.error(loi.stack);
  process.exitCode = 1;
});
