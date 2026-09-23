const { test: kiemThu, after: sauKhi } = require('node:test');
const xacNhan = require('node:assert/strict');
const coSoDuLieu = require('../../dist/repositories/ket-noi');
const khoBanGhi = require('../../dist/repositories/ban-ghi');
const khoDonHang = require('../../dist/repositories/don-hang');
const cacPhienDauGia = require('../../dist/services/dau-gia');
const cacDonHang = require('../../dist/services/don-hang');
const cacTranhChap = require('../../dist/services/tranh-chap');
const cacDeNghi = require('../../dist/services/de-nghi-mua-tiep');
const lichChay = require('../../dist/jobs/lich-chay');
const thoiGian = require('../../dist/utils/thoi-gian');
const { taoDuLieuKiemThu, phienDauGia, hoanTac } = require('../helpers/du-lieu-mau');

kiemThu(
  'Tranh chấp: hoàn toàn bộ hoặc giải ngân cho người bán, không xử lý tiền hai lần',
  async () => {
    for (const hoanToanBo of [true, false]) {
      await hoanTac(async () => {
        const duLieu = await taoDuLieuKiemThu();
        const phienId = await phienDauGia(duLieu, {
          gia_mua_ngay: '24000000',
          cho_phep_mua_ngay: 1,
        });
        const { don_hang: donHang } = await cacPhienDauGia.muaNgay(duLieu.a, phienId, {});
        await cacDonHang.thanhToan(duLieu.a, donHang.id, {});
        await cacDonHang.guiHang(duLieu.seller, donHang.id, {
          don_vi_van_chuyen: 'Kiểm thử',
          ma_van_don: 'TEST-TRANH-CHAP',
        });
        await cacDonHang.xacNhanDaGiao(duLieu.a, donHang.id);
        const tranhChap = await cacTranhChap.mo(duLieu.a, donHang.id, {
          ly_do: 'KHAC',
          mo_ta: 'Kiểm thử kết quả xử lý tiền',
        });
        await xacNhan.rejects(
          cacTranhChap.giaiQuyet(duLieu.admin, tranhChap.id, {
            ket_qua: 'NGUOI_MUA',
            so_tien_hoan: '24000000.01',
            ket_qua_xu_ly: 'Không được hoàn vượt số tiền giữ',
          }),
          { status: 400 },
        );
        await cacTranhChap.giaiQuyet(duLieu.admin, tranhChap.id, {
          ket_qua: hoanToanBo ? 'NGUOI_MUA' : 'NGUOI_BAN',
          so_tien_hoan: hoanToanBo ? '24000000' : '0',
          ket_qua_xu_ly: 'Kết quả kiểm thử',
        });
        xacNhan.equal(
          (await khoDonHang.tienTrungGian(donHang.id)).trang_thai,
          hoanToanBo ? 'DA_HOAN_TIEN' : 'DA_GIAI_NGAN',
        );
        xacNhan.equal(
          (await khoBanGhi.layTheoId('don_hang', donHang.id)).trang_thai,
          hoanToanBo ? 'DA_HUY' : 'HOAN_THANH',
        );
        xacNhan.equal(
          (await khoDonHang.cacThanhToan(donHang.id))[0].trang_thai,
          hoanToanBo ? 'DA_HOAN_TIEN' : 'DA_THANH_TOAN',
        );
        await cacDonHang.xuLyDenHan(donHang.id);
        xacNhan.equal(
          (await khoDonHang.tienTrungGian(donHang.id)).trang_thai,
          hoanToanBo ? 'DA_HOAN_TIEN' : 'DA_GIAI_NGAN',
        );
      });
    }
  },
);

kiemThu(
  'Second Chance: bỏ lượt ngoài giờ, người bán chủ động chọn lượt tiếp sau từ chối/hết hạn và giữ giá sàn',
  async () =>
    hoanTac(async () => {
      const duLieu = await taoDuLieuKiemThu();
      const phienId = await phienDauGia(duLieu);
      await cacPhienDauGia.datGia(duLieu.b, phienId, { gia_toi_da: '20000000' });
      await cacPhienDauGia.datGia(duLieu.outsider, phienId, { gia_toi_da: '21000000' });
      await cacPhienDauGia.datGia(duLieu.a, phienId, { gia_toi_da: '22000000' });
      const hienTai = await coSoDuLieu.thoiGianHienTai();
      await khoBanGhi.capNhat('phien_dau_gia', phienId, { thoi_gian_ket_thuc: hienTai });
      await cacPhienDauGia.xuLyDenHan(phienId);
      const donHang = await khoDonHang.donDangXuLyCuaPhien(phienId);
      // Bản ghi nằm ngoài thời gian phiên không được che mất lượt công khai hợp lệ.
      await khoBanGhi.them('luot_tra_gia', {
        phien_dau_gia_id: phienId,
        nguoi_tra_gia_id: duLieu.outsider.id,
        so_tien: '99000000',
        ngay_tao: thoiGian.congGiay(hienTai, 3600),
      });
      await khoBanGhi.capNhat('don_hang', donHang.id, {
        han_thanh_toan: thoiGian.congGiay(hienTai, -1),
      });
      await cacDonHang.xuLyDenHan(donHang.id);
      xacNhan.equal(await khoDonHang.deNghiDangCho(phienId), null);
      await xacNhan.rejects(cacDeNghi.tao(duLieu.admin, donHang.id), {status:403});
      const deNghiDau = await cacDeNghi.tao(duLieu.seller, donHang.id);
      xacNhan.equal(String(deNghiDau.nguoi_tra_gia_id), duLieu.outsider.id);
      xacNhan.equal(deNghiDau.gia_de_nghi, '21000000.00');
      await cacDeNghi.phanHoiDeNghi(duLieu.outsider, deNghiDau.id, { chap_nhan: false });
      xacNhan.equal(await khoDonHang.deNghiDangCho(phienId), null);
      const deNghiSau = await cacDeNghi.tao(duLieu.seller, donHang.id);
      xacNhan.equal(String(deNghiSau.nguoi_tra_gia_id), duLieu.b.id);
      xacNhan.equal(deNghiSau.gia_de_nghi, '20000000.00');
      await khoBanGhi.capNhat('de_nghi_mua_tiep_theo', deNghiSau.id, {
        het_han_luc: thoiGian.congGiay(hienTai, -1),
      });
      await xacNhan.rejects(cacDeNghi.phanHoiDeNghi(duLieu.b, deNghiSau.id, { chap_nhan: true }), {
        status: 409,
      });
      await cacDeNghi.xuLyHetHan(deNghiSau.id);
      await cacDeNghi.xuLyHetHan(deNghiSau.id);
      xacNhan.equal(await khoDonHang.deNghiDangCho(phienId), null);
      xacNhan.equal((await khoDonHang.donHangCuaPhien(phienId)).length, 1);

      const phienCoSan = await phienDauGia(duLieu, { gia_san: '21500000' });
      await cacPhienDauGia.datGia(duLieu.b, phienCoSan, { gia_toi_da: '20000000' });
      await cacPhienDauGia.datGia(duLieu.a, phienCoSan, { gia_toi_da: '22000000' });
      await khoBanGhi.capNhat('phien_dau_gia', phienCoSan, {
        thoi_gian_ket_thuc: await coSoDuLieu.thoiGianHienTai(),
      });
      await cacPhienDauGia.xuLyDenHan(phienCoSan);
      const donCoSan = await khoDonHang.donDangXuLyCuaPhien(phienCoSan);
      await khoBanGhi.capNhat('don_hang', donCoSan.id, {
        han_thanh_toan: thoiGian.congGiay(hienTai, -1),
      });
      await cacDonHang.xuLyDenHan(donCoSan.id);
      await xacNhan.rejects(cacDeNghi.tao(duLieu.seller, donCoSan.id), {status:409});
      xacNhan.equal(await khoDonHang.deNghiDangCho(phienCoSan), null);
    }),
);

kiemThu(
  'Bộ lập lịch quét MySQL, không nhắc nhiều mốc hạn và ghi vi phạm gửi hàng một lần; toàn bộ rollback',
  async () =>
    hoanTac(async () => {
      const duLieu = await taoDuLieuKiemThu();
      const hienTai = await coSoDuLieu.thoiGianHienTai();
      const phienCho = await phienDauGia(duLieu, { trang_thai: 'DA_LEN_LICH' });
      const phienMuon = await phienDauGia(duLieu, {
        gia_mua_ngay: '24000000',
        cho_phep_mua_ngay: 1,
      });
      const { don_hang: donMuon } = await cacPhienDauGia.muaNgay(duLieu.a, phienMuon, {});
      await cacDonHang.thanhToan(duLieu.a, donMuon.id, {});
      await khoBanGhi.capNhat('don_hang', donMuon.id, {
        han_nguoi_ban_gui_hang: thoiGian.congGiay(hienTai, -1),
      });
      const phienNhac = await phienDauGia(duLieu, {
        gia_mua_ngay: '24000000',
        cho_phep_mua_ngay: 1,
      });
      const { don_hang: donNhac } = await cacPhienDauGia.muaNgay(duLieu.b, phienNhac, {});
      await khoBanGhi.capNhat('don_hang', donNhac.id, {
        han_thanh_toan: thoiGian.congGiay(hienTai, 3600),
      });
      for (let lan = 0; lan < 2; lan++) {
        const ketQua = await lichChay.chayMotLuot();
        xacNhan.equal(ketQua.failed, 0, 'Các nhánh truy vấn và xử lý tác vụ phải thành công');
      }
      xacNhan.equal((await khoBanGhi.layTheoId('phien_dau_gia', phienCho)).trang_thai, 'HOAT_DONG');
      xacNhan.equal(
        (
          await coSoDuLieu.layMot(
            "SELECT COUNT(*) AS so_luong FROM vi_pham WHERE don_hang_id=? AND loai_vi_pham='GIAO_HANG_MUON'",
            [donMuon.id],
          )
        ).so_luong,
        '1',
      );
      xacNhan.ok(
        !(await khoDonHang.denHan()).some((banGhi) => String(banGhi.id) === String(donMuon.id)),
      );
      xacNhan.equal(
        (
          await coSoDuLieu.layMot(
            "SELECT COUNT(*) AS so_luong FROM thong_bao WHERE nguoi_dung_id=? AND loai='SAP_HET_HAN_THANH_TOAN'",
            [duLieu.b.id],
          )
        ).so_luong,
        '0',
      );
    }),
);

sauKhi(require('../helpers/dong-ket-noi').dongKetNoiMotLan);
