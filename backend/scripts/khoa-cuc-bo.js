const tepTin = require('node:fs');
const duongDan = require('node:path');
const { randomBytes: taoByteNgauNhien } = require('node:crypto');

function chuanBiMoiTruongCucBo(moiTruong, thuMucRieng) {
  if (moiTruong.NODE_ENV === 'production') {
    throw new Error('Chế độ cục bộ chỉ dùng trên máy phát triển');
  }

  if (!moiTruong.JWT_SECRET) {
    tepTin.mkdirSync(thuMucRieng, { recursive: true, mode: 0o700 });

    const tepKhoa = duongDan.join(thuMucRieng, 'jwt.key');

    try {
      tepTin.writeFileSync(tepKhoa, taoByteNgauNhien(48).toString('hex'), {
        flag: 'wx',
        mode: 0o600,
      });
    } catch (loi) {
      if (loi.code !== 'EEXIST') {
        throw loi;
      }
    }

    moiTruong.JWT_SECRET = tepTin.readFileSync(tepKhoa, 'utf8').trim();
  }

  if (Buffer.byteLength(moiTruong.JWT_SECRET) < 32) {
    throw new Error('JWT_SECRET cần ít nhất 32 byte');
  }

  // Chạy nghiệp vụ đúng hạn khi phát triển; có thể tắt bằng JOBS_ENABLED=false.
  moiTruong.JOBS_ENABLED ??= 'true';
}

module.exports = { chuanBiMoiTruongCucBo };
