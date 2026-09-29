const tepTin = require('node:fs');
const duongDan = require('node:path');
const coSoDuLieu = require('../dist/repositories/ket-noi');

async function kiemTraCauTruc() {
  const sql = tepTin.readFileSync(
    duongDan.join(__dirname, '../../doan4_daugia_tieng_viet.sql'),
    'utf8',
  );
  const mongDoi = new Map();

  for (const ketQuaKhop of sql.matchAll(
    /CREATE TABLE `?(\w+)`? \(([\s\S]*?)\) ENGINE=InnoDB[^;]*;/gi,
  )) {
    const cacCot = [
      ...ketQuaKhop[2].matchAll(
        /^\s+`?(\w+)`?\s+(?:BIGINT|VARCHAR|ENUM|DATETIME|TIMESTAMP|TINYINT|INT|DECIMAL|JSON|TEXT)\b/gim,
      ),
    ].map((cot) => cot[1]);

    if (!cacCot.length) {
      throw new Error('Không đọc được cột từ SQL chuẩn');
    }
    mongDoi.set(ketQuaKhop[1], cacCot);
  }

  if (mongDoi.size !== 21) {
    throw new Error('SQL chuẩn phải có 21 bảng');
  }

  const thucTe = await coSoDuLieu.truyVan(`
    SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
  `);
  const conThieu = [];

  for (const [bang, cacCot] of mongDoi) {
    for (const cot of cacCot) {
      if (!thucTe.some((banGhi) => banGhi.table_name === bang && banGhi.column_name === cot)) {
        conThieu.push(`${bang}.${cot}`);
      }
    }
  }

  const thongTinBoMay = await coSoDuLieu.truyVan(`
    SELECT TABLE_NAME AS table_name, ENGINE AS engine
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
  `);
  const bangDu = thongTinBoMay.filter((b) => !mongDoi.has(b.table_name));
  const boMayKhongHoTro = thongTinBoMay.filter(
    (banGhi) => mongDoi.has(banGhi.table_name) && banGhi.engine !== 'InnoDB',
  );

  console.log(
    JSON.stringify(
      {
        expectedTables: mongDoi.size,
        actualTables: thongTinBoMay.length,
        checkedColumns: [...mongDoi.values()].reduce((tong, cot) => tong + cot.length, 0),
        extraTables: bangDu,
        missingColumns: conThieu,
        unsafeEngines: boMayKhongHoTro,
      },
      null,
      2,
    ),
  );
  if (conThieu.length || boMayKhongHoTro.length || bangDu.length || thongTinBoMay.length !== 21) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  kiemTraCauTruc()
    .catch((loi) => {
      console.error('Không kiểm tra được schema:', loi.code || loi.name);
      process.exitCode = 1;
    })
    .finally(() => coSoDuLieu.nhomKetNoi.end());
}

module.exports = kiemTraCauTruc;
