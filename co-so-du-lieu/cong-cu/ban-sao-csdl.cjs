const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const bam = (noiDung) => crypto.createHash('sha256').update(noiDung).digest('hex');

function tenSQL(ten) {
  assert(/^[a-z0-9_]+$/.test(ten));

  return '`' + ten + '`';
}

async function dauVanBang(ketNoi, schema, ten, cot) {
  const [dong] = await ketNoi.query(
    `SELECT SHA2(CAST(JSON_ARRAY(${cot.map(tenSQL).join(',')}) AS CHAR), 256) AS ma
     FROM ${tenSQL(schema)}.${tenSQL(ten)} ORDER BY id`,
  );

  return { so_dong: dong.length, ma: bam(JSON.stringify(dong)) };
}

async function luuBanSao(ketNoi, schema, tep) {
  const [bang] = await ketNoi.execute(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`,
    [schema],
  );
  const banSao = {
    database: schema,
    ngay_luu: new Date().toISOString(),
    bang: [],
    views: [],
    triggers: [],
  };

  await ketNoi.query("SET time_zone = '+07:00'");
  await ketNoi.query('START TRANSACTION WITH CONSISTENT SNAPSHOT');
  try {
    for (const { TABLE_NAME: ten } of bang) {
      const [[ddl]] = await ketNoi.query(`SHOW CREATE TABLE ${tenSQL(schema)}.${tenSQL(ten)}`);
      const [cacCot] = await ketNoi.execute(
        `SELECT COLUMN_NAME, DATA_TYPE, EXTRA FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
        [schema, ten],
      );
      const cot = cacCot.filter((c) => !/(STORED|VIRTUAL) GENERATED/.test(c.EXTRA));
      const danhSach = cot.map((c) => c.COLUMN_NAME);
      const [dong] = await ketNoi.query(
        `SELECT ${danhSach.map(tenSQL).join(',')} FROM ${tenSQL(schema)}.${tenSQL(ten)} ORDER BY id`,
      );

      banSao.bang.push({
        ten,
        ddl: ddl['Create Table'],
        cot,
        dong,
        dau_van: await dauVanBang(ketNoi, schema, ten, danhSach),
      });
    }

    const [views] = await ketNoi.execute(
      'SELECT TABLE_NAME FROM information_schema.VIEWS WHERE TABLE_SCHEMA = ?',
      [schema],
    );
    const [triggers] = await ketNoi.execute(
      'SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = ?',
      [schema],
    );

    for (const v of views) {
      const [[ddl]] = await ketNoi.query(
        `SHOW CREATE VIEW ${tenSQL(schema)}.${tenSQL(v.TABLE_NAME)}`,
      );

      banSao.views.push(ddl['Create View']);
    }
    for (const t of triggers) {
      const [[ddl]] = await ketNoi.query(
        `SHOW CREATE TRIGGER ${tenSQL(schema)}.${tenSQL(t.TRIGGER_NAME)}`,
      );

      banSao.triggers.push(ddl['SQL Original Statement']);
    }
    await ketNoi.commit();
  } catch (loi) {
    await ketNoi.rollback();
    throw loi;
  }

  fs.mkdirSync(path.dirname(tep), { recursive: true });

  const noiDung = JSON.stringify(banSao);

  fs.writeFileSync(tep, noiDung, { flag: 'wx' });
  fs.writeFileSync(tep + '.sha256', bam(noiDung) + '\n', { flag: 'wx' });

  return banSao;
}

function docBanSao(tep) {
  const noiDung = fs.readFileSync(tep);

  assert.equal(bam(noiDung), fs.readFileSync(tep + '.sha256', 'utf8').trim());

  return JSON.parse(noiDung);
}

async function doiChieuCotCu(ketNoi, schema, banSao) {
  for (const bang of banSao.bang) {
    const cot = bang.cot.map((c) => c.COLUMN_NAME);

    // Khóa cấu hình mới được thêm; đối chiếu tất cả bản ghi cấu hình cũ bằng ID.
    if (bang.ten === 'cau_hinh_he_thong') {
      const ids = bang.dong.map((d) => String(d.id));

      assert(ids.every((id) => /^\d+$/.test(id)));

      const [dong] = await ketNoi.query(
        `SELECT SHA2(CAST(JSON_ARRAY(${cot.map(tenSQL).join(',')}) AS CHAR), 256) AS ma
         FROM ${tenSQL(schema)}.${tenSQL(bang.ten)}
         WHERE id IN (${ids.length ? ids.join(',') : 'NULL'}) ORDER BY id`,
      );

      assert.deepEqual({ so_dong: dong.length, ma: bam(JSON.stringify(dong)) }, bang.dau_van);
    } else {
      assert.deepEqual(await dauVanBang(ketNoi, schema, bang.ten, cot), bang.dau_van);
    }
  }
}

module.exports = {
  luuBanSao,
  docBanSao,
  doiChieuCotCu,
  tenSQL,
};
