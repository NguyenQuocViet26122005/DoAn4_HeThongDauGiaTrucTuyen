const { readFileSync, statSync } = require('node:fs');
const { join, resolve } = require('node:path');

const cacBien = new Set([
  'NODE_ENV',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'DB_TIMEZONE',
  'FRONTEND_URL',
  'JWT_SECRET',
  'WEB_DIST',
  'UPLOAD_ROOT',
  'JOBS_ENABLED',
  'AI_ENABLED',
  'TRUST_PROXY_HOPS',
]);

async function main() {
  const root = process.env.VIETBID_SHARED_ROOT || resolve(__dirname, '..');
  const tep = join(root, 'backend/.local/alwaysdata.json');
  const thongTin = statSync(tep);
  if (process.platform !== 'win32' && (thongTin.mode & 0o077) !== 0) {
    throw new Error('PRIVATE_CONFIG_PERMISSIONS');
  }
  const cauHinh = JSON.parse(readFileSync(tep, 'utf8'));
  if (!cauHinh || Array.isArray(cauHinh) || Object.keys(cauHinh).length !== cacBien.size) {
    throw new Error('PRIVATE_CONFIG_INVALID');
  }
  for (const [khoa, giaTri] of Object.entries(cauHinh)) {
    if (!cacBien.has(khoa) || typeof giaTri !== 'string') {
      throw new Error('PRIVATE_CONFIG_INVALID');
    }
    process.env[khoa] = giaTri;
  }

  const lenh = process.argv[2];
  if (!lenh) {
    const giamSat = require('./quan-ly-phat-hanh.cjs').giamSat(root);
    for (const tinHieu of ['SIGTERM', 'SIGINT']) {
      process.once(tinHieu, () => giamSat.stop());
    }
    return;
  }
  if (lenh === '--init') {
    require('./khoi-tao-mysql.cjs');
    return;
  }
  if (lenh === '--check-schema') {
    const db = require('../backend/dist/repositories/ket-noi');
    try {
      await require('../backend/scripts/kiem-tra-cau-truc')();
    } finally {
      await db.nhomKetNoi.end();
    }
    return;
  }
  if (lenh === '--admin') {
    await taoQuanTri();
    return;
  }
  if (lenh !== '--worker') {
    throw new Error('UNKNOWN_COMMAND');
  }
  if (process.env.VIETBID_RELEASE_ROOT) {
    process.env.WEB_DIST = join(process.env.VIETBID_RELEASE_ROOT, 'frontend/dist');
  }
  await require('../backend/dist/may-chu').khoiDongMayChu(process.env.IP);
}

async function taoQuanTri() {
  const db = require('../backend/dist/repositories/ket-noi');
  try {
    let duLieu = '';
    for await (const phan of process.stdin) {
      duLieu += phan.toString();
      if (Buffer.byteLength(duLieu) > 1024) {
        throw new Error('ADMIN_INPUT_TOO_LONG');
      }
    }
    const matKhau = require('../backend/dist/validations/du-lieu-dau-vao').matKhau(
      JSON.parse(duLieu),
    );
    const maBam = await require('../backend/node_modules/bcrypt').hash(matKhau, 12);
    await db.giaoDich(async () => {
      const { so_luong } = await db.layMot('SELECT COUNT(*) AS so_luong FROM nguoi_dung');
      if (Number(so_luong) !== 0) {
        throw new Error('ADMIN_REQUIRES_EMPTY_USERS');
      }
      await db.truyVan(
        'INSERT INTO nguoi_dung (ho_ten, email, mat_khau_bam, vai_tro) VALUES (?, ?, ?, ?)',
        ['Quản trị VietBid', 'admin@vietbid.example', maBam, 'QUAN_TRI'],
      );
    });
    console.log('Đã tạo quản trị: admin@vietbid.example');
  } finally {
    await db.nhomKetNoi.end();
  }
}

main().catch((loi) => {
  // Không ghi nội dung cấu hình, mật khẩu hoặc lỗi SQL có thể chứa dữ liệu.
  console.error('ALWAYSDATA_FAILED:', loi.code || loi.name);
  process.exitCode = 1;
});
