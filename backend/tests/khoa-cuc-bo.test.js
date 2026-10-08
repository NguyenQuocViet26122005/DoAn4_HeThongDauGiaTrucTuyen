const { test: kiemThu } = require('node:test');
const xacNhan = require('node:assert/strict');
const tepTin = require('node:fs');
const duongDan = require('node:path');
const { tmpdir: thuMucTam } = require('node:os');
const { chuanBiMoiTruongCucBo } = require('../scripts/khoa-cuc-bo');

kiemThu('Khóa cục bộ: bật tác vụ mặc định, giữ tùy chọn tắt và chặn production', () => {
  const thuMuc = tepTin.mkdtempSync(duongDan.join(thuMucTam(), 'vietbid-khoa-'));

  try {
    const lanDau = {};

    chuanBiMoiTruongCucBo(lanDau, thuMuc);
    xacNhan.equal(Buffer.byteLength(lanDau.JWT_SECRET), 96);
    xacNhan.equal(lanDau.JOBS_ENABLED, 'true');

    const lanSau = {};

    chuanBiMoiTruongCucBo(lanSau, thuMuc);
    xacNhan.ok(lanSau.JWT_SECRET === lanDau.JWT_SECRET, 'Phải giữ phiên sau khi khởi động lại');

    const coSan = { JWT_SECRET: 'x'.repeat(40) };
    const tamTatTacVu = { JWT_SECRET: 'x'.repeat(40), JOBS_ENABLED: 'false' };

    chuanBiMoiTruongCucBo(coSan, thuMuc);
    xacNhan.ok(coSan.JWT_SECRET === 'x'.repeat(40));
    chuanBiMoiTruongCucBo(tamTatTacVu, thuMuc);
    xacNhan.equal(tamTatTacVu.JOBS_ENABLED, 'false');
    xacNhan.throws(() => chuanBiMoiTruongCucBo({ JWT_SECRET: 'ngan' }, thuMuc), /32 byte/);
    xacNhan.throws(
      () => chuanBiMoiTruongCucBo({ NODE_ENV: 'production' }, thuMuc),
      /máy phát triển/,
    );
  } finally {
    tepTin.unlinkSync(duongDan.join(thuMuc, 'jwt.key'));
    tepTin.rmdirSync(thuMuc);
  }
});
