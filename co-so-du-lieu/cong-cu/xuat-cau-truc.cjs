// Chỉ xuất metadata và cấu hình mẫu công khai; không xuất bản ghi người dùng.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const pool = require('../../backend/dist/config/co-so-du-lieu');
const { tenSQL } = require('./ban-sao-csdl.cjs');
const thuMuc = path.resolve(__dirname, '..');
const tepSQL = path.join(thuMuc, '../doan4_daugia_tieng_viet.sql');

function xuongDong(dong) {
  if (dong.length <= 100) {
    return dong;
  }

  // Chỉ chia tại dấu phân cách ngoài literal SQL, không đổi chuỗi/biểu thức.
  let chuoi = false;
  let ketQua = '';

  for (let i = 0; i < dong.length; i++) {
    const kyTu = dong[i];

    if (kyTu === "'" && dong[i - 1] !== '\\') {
      if (chuoi && dong[i + 1] === "'") {
        ketQua += "''";
        i++;
        continue;
      }
      chuoi = !chuoi;
    }
    ketQua += kyTu;
    if (!chuoi && kyTu === ',' && i < dong.length - 1) {
      ketQua += '\n    ';
    }
    if (!chuoi && /^(?: and | or )/i.test(dong.slice(i + 1))) {
      ketQua += '\n   ';
    }
  }

  return ketQua;
}

async function main() {
  const cu = fs.readFileSync(tepSQL, 'utf8');
  const moc = '-- Chỉ dữ liệu cấu hình công khai';

  assert(cu.includes(moc));

  let hatGiong = moc + cu.split(moc)[1];

  if (!hatGiong.includes("'DEPOSIT_POLICY'")) {
    hatGiong +=
      '\nINSERT INTO cau_hinh_he_thong (khoa_cau_hinh, gia_tri_cau_hinh, kieu_du_lieu, mo_ta) VALUES\n' +
      '  (\'DEPOSIT_POLICY\', \'{"bat":false,"kieu":"TY_LE","gia_tri":10}\', \'JSON\', \'Admin cấu hình rồi bật; chỉ áp dụng phiên mới\');\n';
  }

  const nhom = JSON.parse(fs.readFileSync(path.join(thuMuc, 'mo-hinh.json'), 'utf8'));

  for (const [nhomId, ten] of [
    ['02-san-pham', 'kiem_dinh_san_pham'],
    ['03-dau-gia', 'dat_coc_dau_gia'],
  ]) {
    const n = nhom.find((g) => g.id === nhomId);

    if (!n.bang.some((b) => b.ten === ten)) {
      n.bang.push({ ten });
    }
  }

  const c = await pool.getConnection();

  try {
    const [[dangDung]] = await c.query('SELECT DATABASE() ten');

    assert.equal(dangDung.ten, 'doan4_daugia');

    const [cacCot] = await c.execute(
      'SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? ORDER BY ORDINAL_POSITION',
      ['doan4_daugia'],
    );
    const [cacKhoa] = await c.execute(
      'SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND REFERENCED_TABLE_NAME IS NOT NULL',
      ['doan4_daugia'],
    );
    const [cacBang] = await c.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE'",
      ['doan4_daugia'],
    );

    assert.equal(cacBang.length, 21);
    assert.deepEqual(
      nhom.flatMap((n) => n.bang.map((b) => b.ten)).sort(),
      cacBang.map((b) => b.TABLE_NAME).sort(),
    );

    let sql =
      '-- KHỞI TẠO MỚI: 21 bảng, nghiệp vụ 3.0. Chỉ chạy khi doan4_daugia chưa tồn tại.\n' +
      '-- Máy đã nâng cấp không chạy lại tệp này. Không bỏ qua lỗi, không dùng --force.\n' +
      '-- Không chứa tài khoản, mật khẩu hay dữ liệu người dùng mẫu.\n' +
      'CREATE DATABASE doan4_daugia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n' +
      "USE doan4_daugia;\nSET NAMES utf8mb4;\nSET time_zone = '+07:00';\n";
    const khoaNgoai = [];

    for (const n of nhom) {
      sql += `\n-- ${n.ten.toUpperCase()} (${n.bang.length} bảng)\n\n`;
      for (const b of n.bang) {
        const [[ddl]] = await c.query('SHOW CREATE TABLE ' + tenSQL(b.ten));
        const dong = ddl['Create Table'].split('\n');
        const khoa = dong
          .filter((d) => /FOREIGN KEY/.test(d))
          .map((d) => d.trim().replace(/,$/, ''));
        const noiDung = dong
          .slice(1, -1)
          .filter((d) => !/FOREIGN KEY/.test(d))
          .map((d) =>
            d
              .replaceAll(' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci', '')
              .replaceAll(' COLLATE utf8mb4_unicode_ci', ''),
          );

        noiDung[noiDung.length - 1] = noiDung.at(-1).replace(/,$/, '');
        sql += `CREATE TABLE ${tenSQL(b.ten)} (\n${noiDung.map(xuongDong).join('\n')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
        if (khoa.length) {
          khoaNgoai.push(
            `ALTER TABLE ${tenSQL(b.ten)}\n${khoa.map((k) => '  ADD ' + k).join(',\n')};`,
          );
        }
        b.cot = cacCot
          .filter((cot) => cot.TABLE_NAME === b.ten)
          .map((cot) => ({
            ten: cot.COLUMN_NAME,
            kieu: cot.DATA_TYPE.toUpperCase(),
            moTa: cot.COLUMN_TYPE,
          }));
        b.lienKet = cacKhoa
          .filter((k) => k.TABLE_NAME === b.ten)
          .map((k) => ({
            cot: k.COLUMN_NAME,
            bangCha: k.REFERENCED_TABLE_NAME,
            cotCha: k.REFERENCED_COLUMN_NAME,
          }));
      }
    }
    sql +=
      '-- Khai báo quan hệ sau khi đã tạo đủ các bảng. Không tắt kiểm tra khóa ngoại.\n\n' +
      khoaNgoai.join('\n\n') +
      '\n\nDELIMITER $$\n\n';

    const [triggers] = await c.execute(
      'SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA=? ORDER BY TRIGGER_NAME',
      ['doan4_daugia'],
    );

    for (const tr of triggers) {
      const [[ddl]] = await c.query('SHOW CREATE TRIGGER ' + tenSQL(tr.TRIGGER_NAME));

      sql += ddl['SQL Original Statement'].replace(/DEFINER=`[^`]*`@`[^`]*`\s*/g, '') + '$$\n\n';
    }
    sql += 'DELIMITER ;\n\n';
    // Giữ bố cục SELECT dễ đọc của hai view công khai, không xuất thông tin riêng tư.
    for (const view of cu.matchAll(/CREATE VIEW[\s\S]*?;/g)) {
      sql += view[0] + '\n\n';
    }
    sql += hatGiong;
    fs.writeFileSync(tepSQL, sql);
    fs.writeFileSync(path.join(thuMuc, 'mo-hinh.json'), JSON.stringify(nhom, null, 2) + '\n');
    console.log(
      JSON.stringify({
        bang: cacBang.length,
        khoaNgoai: cacKhoa.length,
        trigger: triggers.length,
      }),
    );
  } finally {
    c.release();
  }
}

main()
  .catch((loi) => {
    console.error('Không xuất được cấu trúc:', loi.code || loi.name);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
