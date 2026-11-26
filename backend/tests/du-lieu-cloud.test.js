const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { actors, catalog, makePlan, addMonths } = require('../../deploy/ke-hoach-mau.cjs');
const { samplePdf } = require('../../deploy/du-lieu-mau.cjs');

test('Lịch mẫu phủ liên tục 4 tháng, 6 phiên mở ngay, 16 phiên nối tiếp và đủ 10 danh mục', () => {
  const now = new Date('2026-11-26T15:30:00Z');
  const plan = makePlan(now);

  assert.equal(plan.end, '2027-03-26T15:30:00.000Z');
  assert.equal(plan.auctions.filter((a) => a.batch === 0).length, 6);
  assert.equal(plan.auctions.filter((a) => a.batch > 0).length, 16);
  assert.equal(new Set(plan.auctions.map((a) => a.category)).size, 10);
  for (let instant = now.getTime(); instant < Date.parse(plan.end); instant += 3600000) {
    assert(
      plan.auctions.filter((a) => Date.parse(a.start) <= instant && Date.parse(a.end) > instant)
        .length >= 2,
    );
  }
  for (const a of plan.auctions) {
    assert(Date.parse(a.end) > Date.parse(a.start));
    assert(Date.parse(a.end) <= Date.parse(plan.end));
  }
  assert.equal(new Set(actors.map((a) => a.email)).size, actors.length);
  assert(actors.every((a) => a.email.endsWith('.example')));
  assert.equal(actors.filter((a) => a.role === 'seller').length, 3);
  assert.equal(actors.filter((a) => a.role === 'buyer').length, 2);
});

test('Cộng tháng xử lý cuối tháng; mọi ảnh mẫu có nguồn và giấy phép trong repository', () => {
  assert.equal(
    addMonths(new Date('2026-10-31T09:00:00Z'), 4).toISOString(),
    '2027-02-28T09:00:00.000Z',
  );

  const root = path.resolve(__dirname, '../demo-assets');
  const sources = JSON.parse(fs.readFileSync(path.join(root, 'nguon-anh.json'), 'utf8'));

  for (const item of catalog) {
    assert.equal(path.basename(item.file), item.file);
    assert(fs.statSync(path.join(root, item.file)).isFile());

    const source = sources.find((s) => s.ten_tap_tin === item.file);

    assert(source?.giay_phep && source.trang_nguon);
    assert(Number.isInteger(item.price) && item.price > 0);
    assert(Object.keys(item.attributes).length >= 3);
  }

  const pdf = samplePdf().toString();

  assert.match(pdf, /DEMO ONLY/);

  const offset = Number(pdf.match(/startxref\n(\d+)/)[1]);

  assert.equal(pdf.slice(offset, offset + 4), 'xref');
});
