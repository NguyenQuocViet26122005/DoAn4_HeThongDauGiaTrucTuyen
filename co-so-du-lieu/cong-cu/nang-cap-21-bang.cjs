const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const pool = require('../../backend/dist/config/co-so-du-lieu');
const { luuBanSao, docBanSao, doiChieuCotCu, tenSQL } = require('./ban-sao-csdl.cjs');

const thuMuc = path.resolve(__dirname, '..');
const chinhThuc = process.argv.includes('--chinh-thuc');
const schema = chinhThuc ? 'doan4_daugia' : 'doan4_daugia_kiem_thu_19';
const tepTrangThai = path.join(thuMuc, `nang-cap-21-${chinhThuc ? 'chinh-thuc' : 'kiem-thu'}.json`);
const tepBanSao = path.join(thuMuc, 'ban-sao-rieng', schema + '-truoc-21.json');

function tachLenh(sql) {
  let ngan = ';';
  let khoi = '';
  const ketQua = [];

  for (const dong of sql.split(/\r?\n/)) {
    if (dong.trim().startsWith('--')) {
      continue;
    }

    const delimiter = dong.match(/^DELIMITER\s+(\S+)/i);

    if (delimiter) {
      assert.equal(khoi.trim(), '');
      ngan = delimiter[1];
      continue;
    }
    khoi += dong + '\n';
    if (khoi.trimEnd().endsWith(ngan)) {
      ketQua.push(khoi.trimEnd().slice(0, -ngan.length).trim());
      khoi = '';
    }
  }
  assert.equal(khoi.trim(), '');

  return ketQua.filter(Boolean);
}

async function main() {
  const ketNoi = await pool.getConnection();

  try {
    await ketNoi.query('USE ' + tenSQL(schema));
    await ketNoi.query("SET time_zone = '+07:00'");

    const [[khoa]] = await ketNoi.query("SELECT GET_LOCK('doan4_migration_21', 0) AS ok");

    assert.equal(Number(khoa.ok), 1, 'KIEM_TRA: Có tiến trình migration khác.');

    if (chinhThuc) {
      const thu = JSON.parse(
        fs.readFileSync(path.join(thuMuc, 'nang-cap-21-kiem-thu.json'), 'utf8'),
      );

      assert.equal(thu.trang_thai, 'DA_DOI_CHIEU');

      const phucHoi = JSON.parse(
        fs.readFileSync(path.join(thuMuc, 'kiem-tra-phuc-hoi-19.json'), 'utf8'),
      );

      assert.equal(phucHoi.doi_chieu, 'KHOP_BAN_GOC');
      assert.equal(phucHoi.so_bang, 19);
    }

    let trangThai;
    let banSao;

    if (fs.existsSync(tepTrangThai)) {
      trangThai = JSON.parse(fs.readFileSync(tepTrangThai, 'utf8'));
      banSao = docBanSao(tepBanSao);
    } else {
      banSao = fs.existsSync(tepBanSao)
        ? docBanSao(tepBanSao)
        : await luuBanSao(ketNoi, schema, tepBanSao);
      assert.equal(banSao.bang.length, 19);
      await doiChieuCotCu(ketNoi, schema, banSao);
      trangThai = {
        schema,
        trang_thai: 'DANG_AP_DUNG',
        buoc_da_chay: 0,
      };
    }

    const cacLenh = ['003-kiem-dinh-va-dat-coc.sql', '004-bao-ve-kiem-dinh-va-coc.sql'].flatMap(
      (tep) => tachLenh(fs.readFileSync(path.join(thuMuc, 'migrations', tep), 'utf8')),
    );

    trangThai.trang_thai = 'DANG_AP_DUNG';
    for (let i = trangThai.buoc_da_chay; i < cacLenh.length; i++) {
      await ketNoi.query(cacLenh[i]);
      trangThai.buoc_da_chay = i + 1;
      fs.writeFileSync(tepTrangThai, JSON.stringify(trangThai, null, 2) + '\n');
    }

    await doiChieuCotCu(ketNoi, schema, banSao);

    const [[dem]] = await ketNoi.execute(
      "SELECT COUNT(*) AS so FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'",
      [schema],
    );

    assert.equal(Number(dem.so), 21);
    Object.assign(trangThai, {
      trang_thai: 'DA_DOI_CHIEU',
      thoi_gian: new Date().toISOString(),
      bang_cu_giu_nguyen: 19,
      so_bang: 21,
      ban_sao: path.relative(thuMuc, tepBanSao),
    });
    fs.writeFileSync(tepTrangThai, JSON.stringify(trangThai, null, 2) + '\n');
    console.log('Đã nâng cấp ' + schema + ' lên 21 bảng; toàn bộ cột/dữ liệu cũ khớp bản sao.');
  } finally {
    await ketNoi.query("SELECT RELEASE_LOCK('doan4_migration_21')");
    ketNoi.release();
  }
}

main()
  .catch((loi) => {
    console.error('Nâng cấp chưa hoàn tất:', loi.code || loi.name);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
