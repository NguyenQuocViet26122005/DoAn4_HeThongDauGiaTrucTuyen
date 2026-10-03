const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { taoDuLieuKiemThu, phienDauGia, hoanTac } = require('../helpers/du-lieu-mau');
const dauGia = require('../../dist/services/dau-gia');
const donHang = require('../../dist/services/don-hang');
const tranhChap = require('../../dist/services/tranh-chap');
const taiTep = require('../../dist/services/tai-tep');
const khoDon = require('../../dist/repositories/don-hang');
const { cauHinh } = require('../../dist/config/moi-truong');

test('Lọc đơn mua/bán trước phân trang, không trả đơn của người khác', async () =>
  hoanTac(async () => {
    const d = await taoDuLieuKiemThu();
    const p1 = await phienDauGia(d, { gia_mua_ngay: '24000000', cho_phep_mua_ngay: 1 });
    const p2 = await phienDauGia(d, { gia_mua_ngay: '24000000', cho_phep_mua_ngay: 1 });
    const muaA = (await dauGia.muaNgay(d.a, p1, {})).don_hang;
    const muaB = (await dauGia.muaNgay(d.b, p2, {})).don_hang;
    const trang = { limit: 1, offset: 0 };

    assert.equal(String((await khoDon.danhSach(d.a, trang, 'NGUOI_MUA'))[0].id), String(muaA.id));
    assert.equal((await khoDon.danhSach(d.a, trang, 'NGUOI_BAN')).length, 0);
    assert.equal(
      String((await khoDon.danhSach(d.seller, trang, 'NGUOI_BAN'))[0].id),
      String(muaB.id),
    );
    assert.equal((await khoDon.danhSach(d.outsider, trang, 'NGUOI_MUA')).length, 0);
  }));

test('Bằng chứng gửi lại không trùng; giữ quyền sở hữu và trạng thái kết thúc', async () => {
  const cacTep = [];

  try {
    await hoanTac(async () => {
      const d = await taoDuLieuKiemThu();
      const phien = await phienDauGia(d, { gia_mua_ngay: '24000000', cho_phep_mua_ngay: 1 });
      const don = (await dauGia.muaNgay(d.a, phien, {})).don_hang;

      await donHang.guiHang(d.seller, don.id, { don_vi_van_chuyen: 'Kiểm thử', ma_van_don: 'THU' });
      await donHang.xacNhanDaGiao(d.a, don.id);

      const hoSo = await tranhChap.mo(d.a, don.id, { ly_do: 'KHAC', mo_ta: 'Bằng chứng thử' });
      const buffer = Buffer.from('%PDF-1.4\n%%EOF');
      const tep = await taiTep.luu(d.a, 'evidence', {
        buffer,
        size: buffer.length,
        mimetype: 'application/pdf',
      });
      const viTri = path.resolve(
        cauHinh.uploadRoot,
        tep.duong_dan.replace('/api/uploads/files/', ''),
      );

      assert.ok(viTri.startsWith(path.resolve(cauHinh.uploadRoot) + path.sep));
      cacTep.push(viTri);

      const noiDung = { duong_dan_tep: tep.duong_dan, mo_ta: 'Lần đầu' };
      const lanDau = await tranhChap.themBangChung(d.a, hoSo.id, noiDung);
      const lanSau = await tranhChap.themBangChung(d.a, hoSo.id, {
        ...noiDung,
        mo_ta: 'Không ghi đè khi gửi lại',
      });

      assert.equal(String(lanSau.id), String(lanDau.id));
      assert.equal(lanSau.mo_ta, 'Lần đầu');
      assert.equal((await tranhChap.chiTiet(d.a, hoSo.id)).bang_chung.length, 1);
      await assert.rejects(tranhChap.themBangChung(d.outsider, hoSo.id, noiDung), { status: 403 });
      await assert.rejects(donHang.xacNhanHoanThanh(d.a, don.id), { status: 409 });
      await tranhChap.giaiQuyet(d.admin, hoSo.id, {
        ket_qua: 'NGUOI_MUA',
        ket_qua_xu_ly: 'Hoàn toàn bộ',
      });
      assert.equal(
        String((await tranhChap.themBangChung(d.a, hoSo.id, noiDung)).id),
        String(lanDau.id),
      );
      assert.equal((await donHang.chiTiet(d.a, don.id)).trang_thai_giu_tien, 'DA_HOAN_TIEN');
    });
  } finally {
    for (const tep of cacTep) {
      await fs.unlink(tep);
    }
  }
});
