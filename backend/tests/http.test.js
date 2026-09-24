const { test: kiemThu, before: truocKhi, after: sauKhi } = require('node:test');
const xacNhan = require('node:assert/strict');
const http = require('node:http');
const ungDung = require('../dist/ung-dung');
const { dongKetNoiMotLan } = require('./helpers/dong-ket-noi');
const { nhanDangLoaiTep } = require('../dist/services/tai-tep');
let mayChu;
let diaChiGoc;

truocKhi(async () => {
  mayChu = http.createServer(ungDung);
  await new Promise((giaiQuyet) => mayChu.listen(0, '127.0.0.1', giaiQuyet));
  diaChiGoc = `http://127.0.0.1:${mayChu.address().port}`;
});

kiemThu('API riêng tư yêu cầu đăng nhập trước khi đọc MySQL', async () => {
  for (const duongDanAPI of [
    '/users/me',
    '/orders',
    '/notifications',
    '/admin/users',
    '/admin/jobs',
  ]) {
    const ketQuaHTTP = await fetch(`${diaChiGoc}/api${duongDanAPI}`);

    xacNhan.equal(ketQuaHTTP.status, 401, duongDanAPI);
    xacNhan.equal((await ketQuaHTTP.json()).success, false);
  }
});

kiemThu('Bearer token giả bị từ chối', async () => {
  const ketQuaHTTP = await fetch(`${diaChiGoc}/api/users/me`, {
    headers: { Authorization: 'Bearer invalid-token' },
  });

  xacNhan.equal(ketQuaHTTP.status, 401);
});

kiemThu('Đăng ký từ chối quyền tự nâng vai trò và JSON không hợp lệ', async () => {
  const yeuCauNangQuyen = await fetch(`${diaChiGoc}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vai_tro: 'QUAN_TRI' }),
  });

  xacNhan.equal(yeuCauNangQuyen.status, 400);

  const saiDinhDang = await fetch(`${diaChiGoc}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{broken',
  });

  xacNhan.equal(saiDinhDang.status, 400);
});

kiemThu('Không có route thì trả 404 và CORS chặn nguồn lạ', async () => {
  xacNhan.equal((await fetch(`${diaChiGoc}/api/not-a-route`)).status, 404);
  xacNhan.equal(
    (await fetch(`${diaChiGoc}/`, { headers: { Origin: 'https://unknown.invalid' } })).status,
    403,
  );
});

kiemThu('Upload kiểm tra dấu hiệu nội dung, không chỉ tin phần mở rộng', () => {
  xacNhan.equal(nhanDangLoaiTep(Buffer.from('<script>bad</script>')), null);
  xacNhan.equal(nhanDangLoaiTep(Buffer.from('%PDF-1.7')).mime, 'application/pdf');
  xacNhan.equal(nhanDangLoaiTep(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])).mime, 'image/png');
});

sauKhi(async () => {
  await new Promise((giaiQuyet) => mayChu.close(giaiQuyet));
  await dongKetNoiMotLan();
});
