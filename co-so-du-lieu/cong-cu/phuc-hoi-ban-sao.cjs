// Khôi phục vào database MỚI, không ghi đè database chính.
// node co-so-du-lieu/cong-cu/phuc-hoi-ban-sao.cjs --kiem-tra
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const pool = require('../../backend/dist/config/co-so-du-lieu');
const thuMuc = path.resolve(__dirname,'..');
const trangThai = JSON.parse(fs.readFileSync(path.join(thuMuc,'trang-thai-chuyen-doi.json'),'utf8'));
const tep = path.join(thuMuc,'ban-sao-rieng',trangThai.backup+'.json');
const dich = 'doan4_daugia_phuc_hoi_27';
async function main() {
  const noiDung = fs.readFileSync(tep);
  assert.equal(crypto.createHash('sha256').update(noiDung).digest('hex'),fs.readFileSync(tep+'.sha256','utf8').trim());
  const banSao = JSON.parse(noiDung);
  assert.equal(banSao.database,trangThai.backup);
  assert.equal(banSao.bang.length,27);
  const c = await pool.getConnection();
  try {
    const [co] = await c.query('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?',[dich]);
    assert.equal(co.length,0,'Database phục hồi đã có; không ghi đè.');
    await c.query(`CREATE DATABASE \`${dich}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await c.query(`USE \`${dich}\``);
    await c.query("SET time_zone='+07:00'");
    const doiSchema = s => s.replaceAll('`'+banSao.database+'`.','`'+dich+'`.');
    for (const b of banSao.bang) await c.query(doiSchema(b.ddl));
    await c.beginTransaction();
    try {
      for (const b of banSao.bang) {
        assert(/^\w+$/.test(b.ten));
        const cot = b.cot.map(x=>x.COLUMN_NAME);
        assert(cot.every(x=>/^\w+$/.test(x)));
        for (const d of b.dong) {
          const giaTri = b.cot.map(x=>d[x.COLUMN_NAME] == null ? null : x.DATA_TYPE==='json' ? (typeof d[x.COLUMN_NAME]==='string'?d[x.COLUMN_NAME]:JSON.stringify(d[x.COLUMN_NAME])) : d[x.COLUMN_NAME]);
          await c.execute(`INSERT INTO \`${b.ten}\` (${cot.map(x=>'`'+x+'`').join(',')}) VALUES (${cot.map(()=>'?').join(',')})`,giaTri);
        }
      }
      await c.commit();
    } catch(e) {await c.rollback();throw e;}
    for (const ddl of banSao.views) await c.query(doiSchema(ddl));
    for (const ddl of banSao.triggers) await c.query(doiSchema(ddl));
    for (const b of banSao.bang) {
      const cot = b.cot.map(x=>'`'+x.COLUMN_NAME+'`').join(',');
      const [dong] = await c.query(`SELECT SHA2(CAST(JSON_ARRAY(${cot}) AS CHAR),256) AS ma FROM \`${b.ten}\` ORDER BY id`);
      const ma = crypto.createHash('sha256').update(JSON.stringify(dong)).digest('hex');
      assert.equal(dong.length,trangThai.dau_van_nguon[b.ten].so_dong);
      assert.equal(ma,trangThai.dau_van_nguon[b.ten].ma);
    }
    const ketQua={database:dich,so_bang:27,doi_chieu:'KHOP_BAN_GOC',thoi_gian:new Date().toISOString()};
    fs.writeFileSync(path.join(thuMuc,'kiem-tra-phuc-hoi.json'),JSON.stringify(ketQua,null,2)+'\n');
    console.log('Phục hồi từ tệp thành công: 27 bảng khớp dấu vân tay bản gốc.');
  } finally {c.release();}
}
main().catch(e=>{console.error('Phục hồi chưa hoàn tất:',e.code||e.name);process.exitCode=1;}).finally(()=>pool.end());
