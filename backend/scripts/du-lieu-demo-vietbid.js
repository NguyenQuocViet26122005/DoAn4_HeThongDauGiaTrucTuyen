const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');

require('../dist/config/moi-truong');
const banSao = require('../../co-so-du-lieu/cong-cu/ban-sao-csdl.cjs');
const { danhMuc } = require('./du-lieu-demo/ke-hoach');
const { taoDuLieu } = require('./du-lieu-demo/tao-du-lieu');
const { kiemTra } = require('./du-lieu-demo/kiem-tra');

const thuMucBanSao = path.resolve(__dirname, '../../co-so-du-lieu/ban-sao-rieng');
const marker = 'VIETBID_BO_MOI_V2';
const chinh = 'doan4_daugia';
const clone = 'doan4_daugia_rebuild';

async function ketNoi(ten) {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: ten,
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

async function luuBanSao(c, ten) {
  const tep = path.join(thuMucBanSao, `${ten}_truoc_bo_moi_${Date.now()}.json`);

  await banSao.luuBanSao(c, ten, tep);
  banSao.docBanSao(tep);
  console.log(`Đã sao lưu và kiểm tra checksum: ${path.basename(tep)}`);
}

async function bamBoDuLieu(nguon) {
  const hash = crypto.createHash('sha256').update(JSON.stringify(nguon));

  for (const ten of ['ke-hoach.js', 'tao-du-lieu.js', 'kiem-tra.js']) {
    hash.update(await fs.readFile(path.join(__dirname, 'du-lieu-demo', ten)));
  }
  hash.update(await fs.readFile(path.join(__dirname, '../demo-assets/bo-moi.json')));

  return hash.digest('hex');
}

async function doiChieuCauTruc(c, nguon) {
  const [ds] = await c.query(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE'",
  );

  assert.equal(ds.length, nguon.bang.length, 'Số bảng không khớp nguồn đã sao lưu.');

  const rutGon = (s) =>
    s.replace(/ AUTO_INCREMENT=\d+/g, '').replace(/ CHARACTER SET utf8mb4/g, '');

  for (const bang of nguon.bang) {
    const [[r]] = await c.query('SHOW CREATE TABLE ' + banSao.tenSQL(bang.ten));

    assert(rutGon(r['Create Table']) === rutGon(bang.ddl), `Cấu trúc khác: ${bang.ten}`);
  }
}

async function dung(c, nguon, taiNguyen, dauVan) {
  const sql = async (q, v = []) => (await c.execute(q, v))[0];
  const cot = new Map(nguon.bang.map((t) => [t.ten, t.cot.map((x) => x.COLUMN_NAME)]));
  const goc = (ten) => nguon.bang.find((x) => x.ten === ten).dong;
  const ngay = (soNgay) =>
    new Date(Date.parse(nguon.ngay_luu) + soNgay * 86400000 + 7 * 3600000)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
  const giaTri = (v) => (v != null && typeof v === 'object' ? JSON.stringify(v) : v);

  async function them(ten, duLieu) {
    const khoa = Object.keys(duLieu).filter((k) => cot.get(ten).includes(k));
    const r = await sql(
      `INSERT INTO ${banSao.tenSQL(ten)} (${khoa.map(banSao.tenSQL).join(',')}) VALUES (${khoa.map(() => '?').join(',')})`,
      khoa.map((k) => giaTri(duLieu[k])),
    );

    return r.insertId;
  }

  async function sua(ten, id, duLieu) {
    const khoa = Object.keys(duLieu).filter((k) => k !== 'id' && cot.get(ten).includes(k));

    await sql(
      `UPDATE ${banSao.tenSQL(ten)} SET ${khoa.map((k) => banSao.tenSQL(k) + '=?').join(',')} WHERE id=?`,
      [...khoa.map((k) => giaTri(duLieu[k])), id],
    );
  }

  await c.beginTransaction();
  try {
    // Chỉ tạm ngắt FK khi dọn các quan hệ vòng. Trigger và CHECK vẫn được giữ nguyên.
    await c.query('SET FOREIGN_KEY_CHECKS=0');
    for (const bang of nguon.bang) {
      if (bang.ten !== 'danh_muc') {
        await sql('DELETE FROM ' + banSao.tenSQL(bang.ten));
      }
    }
    await c.query('SET FOREIGN_KEY_CHECKS=1');

    // Bảo toàn danh mục lưu trữ; chỉ 10 danh mục đã chốt được hiển thị.
    for (const d of goc('danh_muc')) {
      const [[co]] = await c.query('SELECT COUNT(*) n FROM danh_muc WHERE id=?', [d.id]);

      if (!Number(co.n)) {
        await them('danh_muc', d);
      }
    }
    await sql('UPDATE danh_muc SET dang_hoat_dong=0');
    for (const [i, [id, ten]] of danhMuc.entries()) {
      await sua('danh_muc', id, {
        ten,
        dang_hoat_dong: 1,
        thu_tu: i + 1,
      });
    }

    await taoDuLieu({
      sql,
      them,
      sua,
      ngay,
      goc,
      tep: taiNguyen.tep,
      anhBoSung: taiNguyen.anh,
    });
    for (const ch of goc('cau_hinh_he_thong')) {
      await them('cau_hinh_he_thong', { ...ch, nguoi_cap_nhat_id: 1001 });
    }
    await them('nhat_ky_hoat_dong', {
      nguoi_thuc_hien_id: 1001,
      hanh_dong: 'TAO_BO_DU_LIEU_THUC_HANH',
      loai_doi_tuong: 'he_thong',
      ma_yeu_cau: marker,
      du_lieu_moi: { dau_van: dauVan, nguon_luu: nguon.ngay_luu },
    });

    const ketQua = await kiemTra(c, nguon);

    await c.commit();

    return ketQua;
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    await c.query('SET FOREIGN_KEY_CHECKS=1');
  }
}

async function chay() {
  const args = process.argv.slice(2);

  assert(
    args.every((a) => /^--(target=|source=|apply$|verify$|dry-run$)/.test(a)),
    'Tham số không hợp lệ.',
  );

  const target = args.find((a) => a.startsWith('--target='))?.slice(9);

  assert(
    [chinh, clone].includes(target),
    'Chỉ chấp nhận --target=doan4_daugia hoặc doan4_daugia_rebuild.',
  );
  assert(args.filter((a) => ['--apply', '--verify', '--dry-run'].includes(a)).length <= 1);

  const c = await ketNoi(target);

  try {
    if (args.includes('--verify')) {
      console.log(JSON.stringify({ database: target, ...(await kiemTra(c)) }, null, 2));

      return;
    }

    const file = args.find((a) => a.startsWith('--source='))?.slice(9);

    assert(file, 'Cần --source=đường_dẫn_bản_sao_riêng đã xác minh.');

    const duongDan = path.resolve(file);

    assert(
      duongDan.startsWith(thuMucBanSao + path.sep),
      'Nguồn phải thuộc thư mục bản sao riêng của project.',
    );

    const nguon = banSao.docBanSao(duongDan);

    assert.equal(nguon.database, chinh);
    await doiChieuCauTruc(c, nguon);
    if (!args.includes('--apply')) {
      console.log(
        JSON.stringify(
          {
            database: target,
            che_do: 'dry-run',
            danh_muc_hien_thi: danhMuc,
            san_pham_giu_lai: nguon.bang.find((t) => t.ten === 'san_pham').dong.length,
            tai_khoan: 16,
            phien: 10,
            don: 7,
          },
          null,
          2,
        ),
      );

      return;
    }

    const taiNguyen = JSON.parse(
      await fs.readFile(path.join(__dirname, '../demo-assets/bo-moi.json'), 'utf8'),
    );
    const dauVan = await bamBoDuLieu(nguon);

    if (target === chinh) {
      await banSao.doiChieuCotCu(c, chinh, nguon);

      const thu = await ketNoi(clone);

      try {
        await kiemTra(thu, nguon);

        const [[row]] = await thu.execute(
          'SELECT du_lieu_moi FROM nhat_ky_hoat_dong WHERE ma_yeu_cau=?',
          [marker],
        );
        const data =
          typeof row?.du_lieu_moi === 'string' ? JSON.parse(row.du_lieu_moi) : row?.du_lieu_moi;

        assert.equal(
          data?.dau_van,
          dauVan,
          'Phải thử lại đúng phiên bản script, tài nguyên và nguồn trên clone.',
        );
      } finally {
        await thu.end();
      }
    }

    const [[khoa]] = await c.query("SELECT GET_LOCK('vietbid_tai_tao_du_lieu', 0) AS ok");

    assert.equal(Number(khoa.ok), 1, 'Có tiến trình dựng dữ liệu khác đang chạy.');
    await luuBanSao(c, target);

    const ketQua = await dung(c, nguon, taiNguyen, dauVan);

    console.log(JSON.stringify({ database: target, ...ketQua }, null, 2));
  } finally {
    await c.query("SELECT RELEASE_LOCK('vietbid_tai_tao_du_lieu')");
    await c.end();
  }
}

chay().catch((e) => {
  console.error('Chưa cập nhật bộ dữ liệu:', e.message);
  process.exitCode = 1;
});
