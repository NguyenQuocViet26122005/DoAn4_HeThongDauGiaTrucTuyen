const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const pool = require('../../backend/dist/config/co-so-du-lieu');
const { docBanSao, doiChieuCotCu } = require('./ban-sao-csdl.cjs');

const thuMuc = path.resolve(__dirname, '..');
const chinh = 'doan4_daugia';
const phu = [
  'doan4_daugia_thiet_ke_19',
  'doan4_daugia_kiem_thu_19',
  'doan4_daugia_phuc_hoi_27',
  'doan4_daugia_sao_luu_20260923070110',
  'doan4_daugia_phuc_hoi_19',
  'doan4_daugia_kiem_thu',
];
const trangThai = JSON.parse(
  fs.readFileSync(path.join(thuMuc, 'trang-thai-chuyen-doi.json'), 'utf8'),
);
const bam = (noiDung) => crypto.createHash('sha256').update(noiDung).digest('hex');

function tenSQL(ten) {
  assert(/^[a-z0-9_]+$/.test(ten), 'KIEM_TRA: Tên SQL không hợp lệ.');

  return '`' + ten + '`';
}

async function dauVan(ketNoi, schema) {
  const [bang] = await ketNoi.execute(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`,
    [schema],
  );
  const ketQua = {};

  for (const { TABLE_NAME: ten } of bang) {
    const [cot] = await ketNoi.execute(
      `SELECT COLUMN_NAME, EXTRA FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
      [schema, ten],
    );
    const danhSachCot = cot
      .filter((c) => !/(STORED|VIRTUAL) GENERATED/.test(c.EXTRA))
      .map((c) => tenSQL(c.COLUMN_NAME))
      .join(',');
    const [dong] = await ketNoi.query(
      `SELECT SHA2(CAST(JSON_ARRAY(${danhSachCot}) AS CHAR), 256) AS ma
       FROM ${tenSQL(schema)}.${tenSQL(ten)} ORDER BY id`,
    );

    ketQua[ten] = { so_dong: dong.length, ma: bam(JSON.stringify(dong)) };
  }

  return ketQua;
}

function kiemTraTepSaoLuu() {
  assert.equal(trangThai.giai_doan, 'DA_AP_DUNG');
  assert.equal(trangThai.backup, phu[3]);

  const tep = path.join(thuMuc, 'ban-sao-rieng', trangThai.backup + '.json');
  const noiDung = fs.readFileSync(tep);
  const ma = bam(noiDung);
  const banSao = JSON.parse(noiDung);
  const phucHoi = JSON.parse(fs.readFileSync(path.join(thuMuc, 'kiem-tra-phuc-hoi.json'), 'utf8'));

  assert.equal(ma, fs.readFileSync(tep + '.sha256', 'utf8').trim());
  assert.equal(banSao.database, trangThai.backup);
  assert.equal(banSao.bang.length, 27);
  assert.equal(phucHoi.doi_chieu, 'KHOP_BAN_GOC');
  assert.equal(phucHoi.database, phu[2]);

  return ma;
}

async function main() {
  const maBanSao = kiemTraTepSaoLuu();
  const banSao19 = docBanSao(path.join(thuMuc, 'ban-sao-rieng/doan4_daugia-truoc-21.json'));
  const phucHoi19 = JSON.parse(
    fs.readFileSync(path.join(thuMuc, 'kiem-tra-phuc-hoi-19.json'), 'utf8'),
  );

  assert.equal(phucHoi19.doi_chieu, 'KHOP_BAN_GOC');
  assert.equal(banSao19.bang.length, 19);

  const nangCap = JSON.parse(
    fs.readFileSync(path.join(thuMuc, 'nang-cap-21-chinh-thuc.json'), 'utf8'),
  );

  assert.equal(nangCap.trang_thai, 'DA_DOI_CHIEU');

  const ketNoi = await pool.getConnection();
  const daXoa = [];

  try {
    const [[dangDung]] = await ketNoi.query('SELECT DATABASE() AS ten');

    assert.equal(dangDung.ten, chinh, 'KIEM_TRA: Backend phải sử dụng doan4_daugia.');
    await ketNoi.query("SET time_zone = '+07:00'");

    const truoc = await dauVan(ketNoi, chinh);

    assert.equal(Object.keys(truoc).length, 21);
    await doiChieuCotCu(ketNoi, chinh, banSao19);

    const [schema] = await ketNoi.query('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA');
    const tonTai = phu.filter((ten) => schema.some((s) => s.SCHEMA_NAME === ten));
    const [thamChieu] = await ketNoi.execute(
      `SELECT TABLE_SCHEMA FROM information_schema.KEY_COLUMN_USAGE
       WHERE REFERENCED_TABLE_SCHEMA IN (${phu.map(() => '?').join(',')})
         AND TABLE_SCHEMA NOT IN (${phu.map(() => '?').join(',')})`,
      [...phu, ...phu],
    );

    assert.equal(thamChieu.length, 0, 'KIEM_TRA: Có CSDL khác còn tham chiếu CSDL phụ.');

    for (const ten of tonTai) {
      const duLieu = await dauVan(ketNoi, ten);

      if (ten === phu[0]) {
        assert.deepEqual(duLieu, trangThai.dich_sau_chuyen);
      } else if ([phu[1], phu[5]].includes(ten)) {
        for (const [bang, thongTin] of Object.entries(duLieu)) {
          if (!['cau_hinh_he_thong', 'danh_muc'].includes(bang)) {
            assert.equal(thongTin.so_dong, 0, 'KIEM_TRA: CSDL kiểm thử còn dữ liệu chưa dọn.');
          }
        }
      } else if (ten === phu[4]) {
        await doiChieuCotCu(ketNoi, ten, banSao19);
      } else {
        assert.deepEqual(duLieu, trangThai.dau_van_nguon);
      }
    }

    const [tienTrinh] = await ketNoi.query('SHOW PROCESSLIST');

    assert(
      !tienTrinh.some((p) => phu.includes(p.db)),
      'KIEM_TRA: Có tiến trình đang kết nối CSDL phụ; dừng tiến trình trước khi dọn.',
    );

    console.log('Đã kiểm tra bản sao riêng và dữ liệu các CSDL phụ: ' + tonTai.join(', '));
    if (!process.argv.includes('--xoa-csdl-phu')) {
      console.log('Chỉ kiểm tra; chưa xóa CSDL.');

      return;
    }

    // Chỉ danh sách phụ cố định đã được yêu cầu dọn; không nhận tên tùy ý từ CLI.
    for (const ten of tonTai) {
      assert(phu.includes(ten) && ten !== chinh);
      await ketNoi.query('DROP DATABASE ' + tenSQL(ten));
      daXoa.push(ten);
    }

    assert.deepEqual(await dauVan(ketNoi, chinh), truoc);

    const tepKetQua = path.join(thuMuc, 'ket-qua-don-dep.json');
    const lichSu = fs.existsSync(tepKetQua) ? JSON.parse(fs.readFileSync(tepKetQua, 'utf8')) : null;
    const ketQua = {
      thoi_gian: new Date().toISOString(),
      csdl_chinh: chinh,
      so_bang: 21,
      da_xoa: [...new Set([...(lichSu?.da_xoa ?? []), ...daXoa])],
      lan_nay: daXoa,
      lan_truoc: lichSu?.thoi_gian ?? null,
      du_lieu_chinh: 'KHONG_THAY_DOI',
      ban_sao_sha256: maBanSao,
    };

    fs.writeFileSync(
      path.join(thuMuc, 'ket-qua-don-dep.json'),
      JSON.stringify(ketQua, null, 2) + '\n',
    );
    console.log('Đã xóa ' + daXoa.length + ' CSDL phụ; dữ liệu doan4_daugia không thay đổi.');
  } finally {
    ketNoi.release();
  }
}

main()
  .catch((loi) => {
    console.error(
      'Chưa dọn xong:',
      loi.message?.startsWith('KIEM_TRA:') ? loi.message : loi.code || loi.name,
    );
    process.exitCode = 1;
  })
  .finally(() => pool.end());
