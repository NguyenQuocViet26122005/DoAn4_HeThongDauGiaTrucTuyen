const fs = require('node:fs');
const path = require('node:path');
process.env.JWT_SECRET ??= require('node:crypto').randomBytes(48).toString('hex');
const pool = require('../../backend/dist/config/co-so-du-lieu');
const { luuBanSao, doiChieuCotCu, tenSQL } = require('./ban-sao-csdl.cjs');

async function nangCap(schema) {
  const c = await pool.getConnection();
  let daKhoa = false;

  try {
    await c.query('USE ' + tenSQL(schema));

    const [[khoa]] = await c.query("SELECT GET_LOCK('vietbid_hang_hoan',0) AS ok");

    if (Number(khoa.ok) !== 1) {
      throw new Error('Đang có tiến trình nâng cấp khác');
    }
    daKhoa = true;

    const [cot] = await c.query(
      `SELECT TABLE_NAME,COLUMN_NAME,DATA_TYPE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA=? AND ((TABLE_NAME='don_hang' AND COLUMN_NAME='xu_ly_hang')
         OR (TABLE_NAME='san_pham' AND COLUMN_NAME='san_pham_goc_id'))`,
      [schema],
    );

    if (cot.length === 2) {
      console.log(schema + ': đã có cấu trúc hàng hoàn.');

      return;
    }

    const tep = path.resolve(
      __dirname,
      '../ban-sao-rieng',
      `${schema}-hang-hoan-${Date.now()}.json`,
    );
    const banSao = await luuBanSao(c, schema, tep);

    if (!cot.some((x) => x.COLUMN_NAME === 'xu_ly_hang')) {
      await c.query('ALTER TABLE don_hang ADD COLUMN xu_ly_hang JSON NULL');
    }
    if (!cot.some((x) => x.COLUMN_NAME === 'san_pham_goc_id')) {
      await c.query(`ALTER TABLE san_pham ADD COLUMN san_pham_goc_id BIGINT UNSIGNED NULL,
        ADD CONSTRAINT fk_san_pham_dang_lai FOREIGN KEY (san_pham_goc_id) REFERENCES san_pham(id)`);
    }
    await doiChieuCotCu(c, schema, banSao);
    console.log(
      schema + ': đã nâng cấp, giữ nguyên 21 bảng và đối chiếu dữ liệu cũ; có bản sao SHA-256.',
    );
  } finally {
    if (daKhoa) {
      await c.query("SELECT RELEASE_LOCK('vietbid_hang_hoan')");
    }
    c.release();
  }
}

async function main() {
  const schema = process.argv.includes('--chinh-thuc') ? 'doan4_daugia' : 'doan4_daugia_kiem_thu';

  await nangCap(schema);
}

main()
  .catch((e) => {
    console.error('Nâng cấp chưa hoàn tất:', e.code || e.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
