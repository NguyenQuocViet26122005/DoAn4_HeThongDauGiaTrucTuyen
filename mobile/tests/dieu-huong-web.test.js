const assert = require('node:assert/strict');
const test = require('node:test');
const { phanLoaiUrl, diaChiTrang } = require('../src/lib/dieu-huong-web.ts');

test('Các trang nghiệp vụ và liên kết có query vẫn ở trong cùng website', () => {
  for (const path of [
    '/',
    '/dang-nhap',
    '/tai-khoan/don-hang/12',
    '/nguoi-ban/san-pham/moi',
    '/quan-tri',
    '/kham-pha?q=dong%20ho',
  ]) {
    assert.equal(phanLoaiUrl('https://vietbid.alwaysdata.net' + path), 'noi-bo');
  }
});

test('Tên miền gần giống không được coi là website trong app', () => {
  for (const url of [
    'https://vietbid.alwaysdata.net.evil.example/',
    'https://evil.example/?next=https://vietbid.alwaysdata.net',
    'https://vietbid.alwaysdata.net:444/',
    'https://github.com/NguyenQuocViet26122005',
  ]) {
    assert.equal(phanLoaiUrl(url), 'ngoai');
  }
});

test('Chặn URL chứa tài khoản và các giao thức có thể thực thi hoặc đọc tệp', () => {
  for (const url of [
    'javascript:alert(1)',
    'data:text/html,hello',
    'file:///etc/passwd',
    'intent://example',
    'http://vietbid.alwaysdata.net/',
    'https://vietbid.alwaysdata.net@evil.example/',
    'https://user:password@vietbid.alwaysdata.net',
    'not a url',
  ]) {
    assert.equal(phanLoaiUrl(url), 'chan');
  }
});

test('Liên kết từ app cũ đến đúng trang đơn, thông báo và địa chỉ trên web', () => {
  assert.equal(diaChiTrang('/don-hang/12'), 'https://vietbid.alwaysdata.net/tai-khoan/don-hang/12');
  assert.equal(diaChiTrang('/thong-bao'), 'https://vietbid.alwaysdata.net/tai-khoan/thong-bao');
  assert.equal(diaChiTrang('/dia-chi'), 'https://vietbid.alwaysdata.net/tai-khoan/dia-chi');
  assert.equal(diaChiTrang('/phien/12'), 'https://vietbid.alwaysdata.net/phien/12');
});

test('Đường dẫn đầu vào không thể chuyển WebView sang máy chủ khác', () => {
  for (const path of [
    '//evil.example/',
    '/\\evil.example/',
    'https://evil.example/',
    'javascript:alert(1)',
  ]) {
    assert.equal(diaChiTrang(path), 'https://vietbid.alwaysdata.net/');
  }
});
