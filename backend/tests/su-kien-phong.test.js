const test = require('node:test');
const assert = require('node:assert/strict');
const suKien = require('../dist/sockets/su-kien');

test('Sự kiện phiên phát cho cả phòng phiên và phòng danh sách, không kèm giá sàn', () => {
  const daPhat = [];

  suKien.ganMayChu({
    to: (phong) => ({
      emit: (ten, duLieu) =>
        daPhat.push({
          phong,
          ten,
          duLieu,
        }),
    }),
  });

  // Ngoài transaction nên sự kiện phát ngay, không chờ commit.
  suKien.phienDauGia(
    {
      id: '7',
      trang_thai: 'HOAT_DONG',
      gia_hien_tai: '20000000.00',
      gia_san: '25000000.00',
    },
    'auction:bid-updated',
  );

  assert.equal(daPhat.length, 1);
  assert.deepEqual(daPhat[0].phong, ['auction:7', suKien.PHONG_DANH_SACH]);
  assert.equal(daPhat[0].ten, 'auction:bid-updated');
  assert.equal(daPhat[0].duLieu.gia_hien_tai, '20000000.00');
  assert.equal('gia_san' in daPhat[0].duLieu, false);
});
