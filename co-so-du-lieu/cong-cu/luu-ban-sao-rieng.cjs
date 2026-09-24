// Lưu bản sao 27 bảng ra tệp riêng trước khi dọn schema phụ theo yêu cầu người dùng.
// Tệp chứa dữ liệu nghiệp vụ riêng tư; thư mục này được loại khỏi Git.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const pool = require('../../backend/dist/config/co-so-du-lieu');
const thuMuc = path.resolve(__dirname, '..');
const trangThai = JSON.parse(
  fs.readFileSync(path.join(thuMuc, 'trang-thai-chuyen-doi.json'), 'utf8'),
);
const nguon = trangThai.backup;
assert(/^doan4_daugia_sao_luu_\d+$/.test(nguon));
const thuMucRieng = path.join(thuMuc, 'ban-sao-rieng');
const tep = path.join(thuMucRieng, nguon + '.json');
const bam = (s) => crypto.createHash('sha256').update(s).digest('hex');

async function main() {
  const c = await pool.getConnection();

  try {
    await c.query("SET time_zone='+07:00'");

    const banSao = {
      phien_ban: 1,
      database: nguon,
      ngay_luu: new Date().toISOString(),
      bang: [],
      views: [],
      triggers: [],
    };

    for (const ten of trangThai.thu_tu_bang_cu) {
      assert(/^\w+$/.test(ten));

      const [[ddl]] = await c.query(`SHOW CREATE TABLE \`${nguon}\`.\`${ten}\``);
      const [dong] = await c.query(`SELECT * FROM \`${nguon}\`.\`${ten}\` ORDER BY id`);
      const [cot] = await c.query(
        'SELECT COLUMN_NAME,DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? ORDER BY ORDINAL_POSITION',
        [nguon, ten],
      );

      banSao.bang.push({
        ten,
        ddl: ddl['Create Table'],
        cot,
        dong,
      });
    }

    const [views] = await c.query(
      'SELECT TABLE_NAME FROM information_schema.VIEWS WHERE TABLE_SCHEMA=?',
      [nguon],
    );

    for (const v of views) {
      const [[ddl]] = await c.query(`SHOW CREATE VIEW \`${nguon}\`.\`${v.TABLE_NAME}\``);

      banSao.views.push(ddl['Create View']);
    }

    const [triggers] = await c.query(
      'SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA=?',
      [nguon],
    );

    for (const t of triggers) {
      const [[ddl]] = await c.query(`SHOW CREATE TRIGGER \`${nguon}\`.\`${t.TRIGGER_NAME}\``);

      banSao.triggers.push(ddl['SQL Original Statement']);
    }
    assert.equal(banSao.bang.length, 27);
    fs.mkdirSync(thuMucRieng, { recursive: true });

    const noiDung = JSON.stringify(banSao);

    fs.writeFileSync(tep, noiDung, { flag: 'wx' });
    assert.equal(bam(fs.readFileSync(tep)), bam(noiDung));
    fs.writeFileSync(tep + '.sha256', bam(noiDung) + '\n', { flag: 'wx' });
    console.log(
      'Đã lưu 27 bảng, ' +
        views.length +
        ' view, ' +
        triggers.length +
        ' trigger vào bản sao riêng; checksum khớp.',
    );
  } finally {
    c.release();
  }
}

main()
  .catch((e) => {
    console.error('Không lưu được bản sao:', e.code || e.name);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
