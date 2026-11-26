const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { createRequire } = require('node:module');

const mysql = existsSync(join(__dirname, 'node_modules/mysql2'))
  ? require('mysql2/promise')
  : createRequire(join(__dirname, '../backend/package.json'))('mysql2/promise');

async function main() {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  assert(DB_HOST && DB_USER && DB_NAME, 'Cần DB_HOST, DB_USER và DB_NAME.');
  assert(/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(DB_NAME), 'Tên CSDL không hợp lệ.');
  assert(DB_NAME !== 'doan4_daugia_kiem_thu', 'Dùng CSDL riêng cho triển khai.');

  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT || 3306),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    charset: 'utf8mb4',
  });

  try {
    const [objects] = await conn.query(
      'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() LIMIT 1',
    );
    assert.equal(objects.length, 0, 'CSDL đã có bảng. Dừng để bảo toàn dữ liệu.');

    const inContainer = join(__dirname, 'schema.sql');
    const schema = existsSync(inContainer)
      ? inContainer
      : join(__dirname, '../doan4_daugia_tieng_viet.sql');
    const sql = readFileSync(schema, 'utf8');
    let delimiter = ';';
    let statement = '';

    for (const raw of sql.split(/\r?\n/)) {
      const line = raw.trim();
      if (line.startsWith('--') || /^(?:CREATE DATABASE |USE )doan4_daugia\b/.test(line)) {
        continue;
      }

      const nextDelimiter = line.match(/^DELIMITER\s+(\S+)$/i);
      if (nextDelimiter) {
        assert.equal(statement.trim(), '');
        delimiter = nextDelimiter[1];
        continue;
      }

      statement += raw + '\n';
      if (!statement.trimEnd().endsWith(delimiter)) {
        continue;
      }

      const query = statement.trimEnd().slice(0, -delimiter.length).trim();
      assert(!/^(?:DROP|TRUNCATE|USE|CREATE DATABASE)\b/i.test(query));
      await conn.query(query);
      statement = '';
    }

    assert.equal(statement.trim(), '');
    const [[result]] = await conn.query(
      "SELECT COUNT(*) AS tables FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE'",
    );
    assert.equal(Number(result.tables), 21, 'Schema cần đủ 21 bảng.');
    console.log('Đã khởi tạo 21 bảng VietBid trên CSDL đã chọn.');
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error(
    error.name === 'AssertionError' ? error.message : error.code || 'Không khởi tạo được schema',
  );
  process.exitCode = 1;
});
