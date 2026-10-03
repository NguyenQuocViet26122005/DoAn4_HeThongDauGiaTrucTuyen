import test from 'node:test';
import assert from 'node:assert/strict';
import { lienKetThongBao, noiDungThongBao } from '../src/utils/lien-ket-thong-bao.ts';

test('Liên kết thông báo đúng khu vực, chặn URL ngoài và đường dẫn lạ', () => {
  assert.equal(lienKetThongBao('/orders/12'), '/tai-khoan/don-hang/12');
  assert.equal(lienKetThongBao('/disputes/2', true), '/quan-tri/tranh-chap/2');
  assert.equal(lienKetThongBao('/seller/verification'), '/tai-khoan/xac-minh');
  assert.equal(lienKetThongBao('/inspections/8'), '/nguoi-ban/kiem-dinh/8');
  for (const url of ['https://example.com', '//example.com', 'javascript:alert(1)', '/orders/1?x=1', '/admin/config', '/orders/../config']) {
    assert.equal(lienKetThongBao(url), null);
  }
});

test('Nội dung thông báo theo nhãn giao diện, không sửa dữ liệu giao dịch gốc', () => {
  assert.equal(noiDungThongBao('Thanh toán mô phỏng thành công'), 'Thanh toán thành công');
  assert.equal(noiDungThongBao('Tiền được giữ trung gian.'), 'Tiền được giữ trung gian.');
});
