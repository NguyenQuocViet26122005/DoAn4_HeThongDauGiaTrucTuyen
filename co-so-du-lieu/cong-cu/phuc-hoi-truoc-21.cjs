// Kiểm chứng bản sao 19 bảng bằng một CSDL mới; không ghi đè dữ liệu đang dùng.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const pool = require('../../backend/dist/config/co-so-du-lieu');
const { luuBanSao, docBanSao, doiChieuCotCu, tenSQL } = require('./ban-sao-csdl.cjs');
const thuMuc = path.resolve(__dirname, '..');
const tep = path.join(thuMuc, 'ban-sao-rieng/doan4_daugia-truoc-21.json');
const dich = 'doan4_daugia_phuc_hoi_19';

async function main() {
  const c = await pool.getConnection();

  try {
    await c.query("SET time_zone = '+07:00'");

    const banSao = fs.existsSync(tep) ? docBanSao(tep) : await luuBanSao(c, 'doan4_daugia', tep);

    assert.equal(banSao.database, 'doan4_daugia');
    assert.equal(banSao.bang.length, 19);

    const [co] = await c.execute(
      'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?',
      [dich],
    );

    assert.equal(co.length, 0, 'CSDL phục hồi đã tồn tại; không ghi đè.');

    await c.query(
      `CREATE DATABASE ${tenSQL(dich)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await c.query('USE ' + tenSQL(dich));

    const doiSchema = (ddl) =>
      ddl
        .replace(/DEFINER=`[^`]*`@`[^`]*`\s*/g, '')
        .replaceAll('`' + banSao.database + '`.', '`' + dich + '`.');

    // DDL bản sao có khóa ngoại vòng; chỉ tạm tắt trong kết nối phục hồi CSDL mới.
    await c.query('SET FOREIGN_KEY_CHECKS=0');
    try {
      for (const bang of banSao.bang) {
        await c.query(doiSchema(bang.ddl));
      }
      await c.beginTransaction();
      try {
        for (const bang of banSao.bang) {
          const cot = bang.cot.map((x) => tenSQL(x.COLUMN_NAME));

          for (const dong of bang.dong) {
            const giaTri = bang.cot.map((x) => {
              const giaTriCot = dong[x.COLUMN_NAME];

              return giaTriCot == null
                ? null
                : x.DATA_TYPE === 'json' && typeof giaTriCot !== 'string'
                  ? JSON.stringify(giaTriCot)
                  : giaTriCot;
            });

            await c.execute(
              `INSERT INTO ${tenSQL(bang.ten)} (${cot.join(',')}) VALUES (${cot.map(() => '?').join(',')})`,
              giaTri,
            );
          }
        }
        await c.commit();
      } catch (loi) {
        await c.rollback();
        throw loi;
      }
    } finally {
      await c.query('SET FOREIGN_KEY_CHECKS=1');
    }

    for (const ddl of [...banSao.views, ...banSao.triggers]) {
      await c.query(doiSchema(ddl));
    }
    await doiChieuCotCu(c, dich, banSao);

    const [khoaNgoai] = await c.execute(
      `SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
       FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND REFERENCED_TABLE_NAME IS NOT NULL`,
      [dich],
    );

    for (const fk of khoaNgoai) {
      const [[kq]] = await c.query(
        `SELECT COUNT(*) n FROM ${tenSQL(fk.TABLE_NAME)} a LEFT JOIN ${tenSQL(fk.REFERENCED_TABLE_NAME)} b ON a.${tenSQL(fk.COLUMN_NAME)}=b.${tenSQL(fk.REFERENCED_COLUMN_NAME)} WHERE a.${tenSQL(fk.COLUMN_NAME)} IS NOT NULL AND b.${tenSQL(fk.REFERENCED_COLUMN_NAME)} IS NULL`,
      );

      assert.equal(Number(kq.n), 0, 'Phát hiện khóa ngoại mồ côi.');
    }
    fs.writeFileSync(
      path.join(thuMuc, 'kiem-tra-phuc-hoi-19.json'),
      JSON.stringify(
        {
          database: dich,
          so_bang: 19,
          doi_chieu: 'KHOP_BAN_GOC',
          khoa_ngoai_hop_le: khoaNgoai.length,
          thoi_gian: new Date().toISOString(),
        },
        null,
        2,
      ) + '\n',
    );
    console.log(
      'Bản sao 19 bảng đã phục hồi và đối chiếu thành công; dữ liệu CSDL chính không thay đổi.',
    );
  } finally {
    c.release();
  }
}

main()
  .catch((loi) => {
    console.error('Phục hồi chưa hoàn tất:', loi.code || loi.name);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
