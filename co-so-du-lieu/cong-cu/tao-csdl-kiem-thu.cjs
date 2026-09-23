// Database riêng cho API/concurrency: không chạy kiểm thử trên dữ liệu người dùng.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const pool = require('../../backend/dist/config/co-so-du-lieu');
const ten = 'doan4_daugia_kiem_thu_19';
async function main() {
  const c = await pool.getConnection();
  try {
    const [co] = await c.query('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?', [ten]);
    assert.equal(co.length, 0, 'Database kiểm thử đã tồn tại; không ghi đè.');
    const sql = fs.readFileSync(path.join(__dirname, '../01-tao-csdl-19-bang.sql'), 'utf8').replaceAll('doan4_daugia_thiet_ke_19', ten);
    let ngan = ';', khoi = '';
    for (const dong of sql.split(/\r?\n/)) {
      if (dong.trim().startsWith('--')) continue;
      const doi = dong.match(/^DELIMITER\s+(\S+)/i);
      if (doi) { assert.equal(khoi.trim(), ''); ngan = doi[1]; continue; }
      khoi += dong + '\n';
      if (khoi.trimEnd().endsWith(ngan)) {
        const lenh = khoi.trimEnd().slice(0, -ngan.length).trim();
        assert(!/\b(?:DROP|TRUNCATE)\b/i.test(lenh));
        if (lenh) await c.query(lenh);
        khoi = '';
      }
    }
    assert.equal(khoi.trim(), '');
    await c.query(`INSERT INTO ${ten}.cau_hinh_he_thong (khoa_cau_hinh,gia_tri_cau_hinh,kieu_du_lieu,mo_ta) SELECT khoa_cau_hinh,gia_tri_cau_hinh,kieu_du_lieu,mo_ta FROM doan4_daugia_thiet_ke_19.cau_hinh_he_thong`);
    console.log('Đã tạo ' + ten + ': chỉ cấu hình công khai, không sao chép tài khoản.');
  } finally { c.release(); }
}
main().catch(e => { console.error(e.code || e.name); process.exitCode = 1; }).finally(() => pool.end());
