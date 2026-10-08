import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium, request } = require('C:/Users/Modern 14/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const thuMuc = path.resolve('bao-cao/tuan-7/anh-giao-dien');
const danhSachCu = JSON.parse(await readFile(path.join(thuMuc, 'danh-sach.json'), 'utf8'));
const taiLieu = await readFile('backend/docs/DU-LIEU-DEMO-VIETBID.md', 'utf8');
const matKhau = taiLieu.match(/Mật khẩu thực hành chung: \*\*([^*]+)\*\*/)[1];
const thuTu = [1,2,3,4,6,5,7,8,9,21,10,11,12,13,14,15,17,18,20,19,16,22,23,24,28,29,25,26,27,30,31,32,33,34,41,35,36,37,38,40,39,42,43,44,45,46,47,48];
const chiChup = process.argv.find((a) => a.startsWith('--only='))?.slice(7).split(',').map(Number);
const cacTrangChup = chiChup ? thuTu.filter((so) => chiChup.includes(so)) : thuTu;

function taiKhoan(so) {
  if (so <= 7) return null;
  if (so === 29) return 'nguoi.ban.07@vietbid.test';
  if (so >= 32) return 'admin@vietbid.test';
  if (so >= 22) return 'hoang@vietbid.test';
  if ([14,15].includes(so)) return 'bao.ngoc@vietbid.test';
  if ([17,18].includes(so)) return 'gia.bao@vietbid.test';
  if (so === 19) return 'hai.nam@vietbid.test';
  return 'duc.anh@vietbid.test';
}

const api = await request.newContext({ baseURL: 'http://localhost:5000/api' });
const phienTheoEmail = new Map();

for (const email of new Set(cacTrangChup.map(taiKhoan).filter(Boolean))) {
  const phanHoi = await api.post('/api/auth/login', { data: { email, mat_khau: matKhau } });
  if (!phanHoi.ok()) throw new Error(`Đăng nhập ${email}: HTTP ${phanHoi.status()}`);
  const duLieu = (await phanHoi.json()).data;
  phienTheoEmail.set(email, duLieu);
}

const trinhDuyet = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});
const tepKetQua = 'bao-cao/tuan-7/.kiem-tra/thu-tu-giao-dien.json';
const ketQua = chiChup ? JSON.parse(await readFile(tepKetQua, 'utf8')).filter((muc) => !chiChup.includes(Number(muc.ten.split('-')[0]))) : [];

try {
  for (const [viTri, soCu] of thuTu.entries()) {
    if (!cacTrangChup.includes(soCu)) { continue; }
    const muc = danhSachCu[soCu - 1];
    const email = taiKhoan(soCu);
    const nguCanh = await trinhDuyet.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      locale: 'vi-VN',
    });
    if (email) {
      await nguCanh.addInitScript((token) => sessionStorage.setItem('lac-viet-token', token), phienTheoEmail.get(email).token);
    }
    const trang = await nguCanh.newPage();
    await trang.goto('http://localhost:5173' + muc.duongDan, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await trang.waitForTimeout(2500);
    await trang.waitForFunction(() => document.querySelectorAll('.ant-skeleton').length === 0, { timeout: 10000 }).catch(() => {});
    const thongTin = await trang.evaluate(() => ({
      duongDan: location.pathname,
      doPhongTo: window.visualViewport.scale,
      tiLeDiemAnh: devicePixelRatio,
      rong: innerWidth,
      cao: innerHeight,
      loi: [...document.querySelectorAll('.ant-result-title, .ant-alert-message, .ant-alert-title')].map((e) => e.textContent),
    }));
    if (thongTin.duongDan !== muc.duongDan) throw new Error(`Chuyển hướng sai: ${muc.ten}: ${thongTin.duongDan}`);
    if (thongTin.doPhongTo !== 1 || thongTin.tiLeDiemAnh !== 1) throw new Error('Thu phóng không phải 100%');
    if (thongTin.loi.some((loi) => /Không tìm thấy|chưa có quyền truy cập|Chưa thể hoàn tất/i.test(loi))) throw new Error(`Trang lỗi: ${muc.ten}`);
    await trang.evaluate(() => window.scrollTo(0, 0));
    const phienCDP = await nguCanh.newCDPSession(trang);
    const anh = await phienCDP.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
    await writeFile(path.join(thuMuc, muc.ten + '.png'), Buffer.from(anh.data, 'base64'));
    ketQua.push({ ...muc, thuTu: viTri + 1, email, vaiTro: email ? phienTheoEmail.get(email).user.vai_tro : 'KHACH', ...thongTin });
    console.log(`Đã chụp ${viTri + 1}/48: ${muc.ten} (${email || 'trang dùng chung'}) — 100%`);
    await nguCanh.close();
  }
} finally {
  await api.dispose();
  await trinhDuyet.close();
}

await mkdir(path.resolve('bao-cao/tuan-7/.kiem-tra'), { recursive: true });
await writeFile(tepKetQua, JSON.stringify(ketQua.sort((a, b) => a.thuTu - b.thuTu), null, 2));
