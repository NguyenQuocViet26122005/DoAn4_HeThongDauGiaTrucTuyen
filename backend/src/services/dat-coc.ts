import type { NguoiDungDangNhap } from '../types/nghiep-vu';
import { randomUUID } from 'node:crypto';
import coSoDuLieu = require('../repositories/ket-noi');
import khoBanGhi = require('../repositories/ban-ghi');
import khoCoc = require('../repositories/dat-coc');
import cacPhien = require('../repositories/dau-gia');
import { kiemTraNguoiMua } from './dau-gia';
import { ghiNhatKy, taoThongBao } from './nhat-ky-thong-bao';
import { taoKhoaYeuCau, ketQuaDaXuLy, luuKetQua } from './yeu-cau-thanh-toan';
import { thanhToanSchema } from '../validations/don-hang.schema';
import kiemTra = require('../validations/du-lieu-dau-vao');
import { baoDam, batBuocTonTai, cungId } from '../utils/loi';
import { donViTienNho } from '../utils/tien';
import thoiGian = require('../utils/thoi-gian');

async function kiemTraPhienNhanCoc(nguoiDung: NguoiDungDangNhap, phien) {
  baoDam(
    ['DA_LEN_LICH', 'HOAT_DONG'].includes(phien.trang_thai) &&
      !thoiGian.daHetHan(phien.thoi_gian_ket_thuc, await coSoDuLieu.thoiGianHienTai()),
    409,
    'Phiên không còn nhận đăng ký hoặc tiền cọc',
  );
  baoDam(phien.yeu_cau_dat_coc, 409, 'Phiên này không yêu cầu đặt cọc');

  await kiemTraNguoiMua(nguoiDung, phien);
}

async function dangKy(nguoiDung: NguoiDungDangNhap, phienId) {
  return coSoDuLieu.giaoDich(async () => {
    const phien = batBuocTonTai(await cacPhien.layTheoId(kiemTra.id(phienId), true));

    await kiemTraPhienNhanCoc(nguoiDung, phien);

    const daCo = await khoCoc.cuaNguoiDung(phien.id, nguoiDung.id, true);

    if (daCo) {
      return daCo;
    }

    const id = await khoBanGhi.them('dat_coc_dau_gia', {
      phien_dau_gia_id: phien.id,
      nguoi_dung_id: nguoiDung.id,
      so_tien: phien.so_tien_dat_coc,
    });

    await ghiNhatKy(nguoiDung.id, 'TAO_COC', 'dat_coc_dau_gia', id);

    return khoBanGhi.layTheoId('dat_coc_dau_gia', id);
  });
}

async function thanhToan(nguoiDung: NguoiDungDangNhap, phienId, duLieuNhap: unknown) {
  const dauVao = kiemTra.docSchema(thanhToanSchema, duLieuNhap);
  const khoa = taoKhoaYeuCau(dauVao);

  return coSoDuLieu.giaoDich(async () => {
    const phien = batBuocTonTai(await cacPhien.layTheoId(kiemTra.id(phienId), true));
    const daXuLy = await ketQuaDaXuLy('THANH_TOAN_COC', khoa, nguoiDung.id, phien.id);

    if (daXuLy) {
      return { ...daXuLy, dat_coc: await khoCoc.cuaNguoiDung(phien.id, nguoiDung.id) };
    }

    await kiemTraPhienNhanCoc(nguoiDung, phien);

    const coc = batBuocTonTai(
      await khoCoc.cuaNguoiDung(phien.id, nguoiDung.id, true),
      'Cần đăng ký trước khi thanh toán cọc',
    );

    if (coc.trang_thai === 'DA_DAT_COC') {
      return { ket_qua_mo_phong: 'THANH_CONG', dat_coc: coc };
    }

    baoDam(['CHO_THANH_TOAN', 'THAT_BAI'].includes(coc.trang_thai), 409, 'Khoản cọc đã kết thúc');

    const thanhCong = (dauVao.ket_qua_mo_phong ?? 'THANH_CONG') === 'THANH_CONG';

    await khoBanGhi.capNhat('dat_coc_dau_gia', coc.id, {
      trang_thai: thanhCong ? 'DA_DAT_COC' : 'THAT_BAI',
      khoa_yeu_cau: khoa,
      ma_giao_dich: `COC-${randomUUID()}`,
      ngay_dat_coc: thanhCong ? await coSoDuLieu.thoiGianHienTai() : null,
    });

    const ketQua = { ket_qua_mo_phong: thanhCong ? 'THANH_CONG' : 'THAT_BAI', coc_id: coc.id };

    await luuKetQua('THANH_TOAN_COC', khoa, nguoiDung.id, phien.id, ketQua);

    await ghiNhatKy(
      nguoiDung.id,
      thanhCong ? 'XAC_NHAN_COC' : 'COC_THANH_TOAN_THAT_BAI',
      'dat_coc_dau_gia',
      coc.id,
    );

    if (thanhCong) {
      await taoThongBao(
        nguoiDung.id,
        'DA_DAT_COC',
        'Đặt cọc thành công',
        'Bạn có thể đặt giá khi phiên bắt đầu.',
        `/auctions/${phien.id}`,
      );
    }

    return { ...ketQua, dat_coc: await khoCoc.cuaNguoiDung(phien.id, nguoiDung.id) };
  });
}

async function kiemTraQuyenDatGia(phien, nguoiDungId) {
  if (!phien.yeu_cau_dat_coc) {
    return;
  }

  const coc = await khoCoc.cuaNguoiDung(phien.id, nguoiDungId, true);

  baoDam(
    coc?.trang_thai === 'DA_DAT_COC' &&
      donViTienNho(coc.so_tien) === donViTienNho(phien.so_tien_dat_coc),
    409,
    'Cần thanh toán cọc thành công trước khi đặt giá',
  );
}

async function chuyenVaoDon(phien, donHang, batBuoc) {
  const coc = await khoCoc.cuaNguoiDung(phien.id, donHang.nguoi_mua_id, true);

  if (!coc || coc.trang_thai !== 'DA_DAT_COC') {
    baoDam(!batBuoc, 409, 'Người thắng chưa có khoản cọc hợp lệ');

    return;
  }

  baoDam(
    donViTienNho(coc.so_tien) <= donViTienNho(donHang.gia_san_pham),
    409,
    'Cọc vượt giá sản phẩm',
  );

  const hienTai = await coSoDuLieu.thoiGianHienTai();

  await khoBanGhi.capNhat('dat_coc_dau_gia', coc.id, {
    trang_thai: 'DA_CHUYEN_VAO_DON',
    don_hang_id: donHang.id,
    ngay_chuyen_vao_don: hienTai,
  });
  await khoBanGhi.capNhat('don_hang', donHang.id, {
    tien_coc_da_chuyen: coc.so_tien,
    so_tien_da_thu: coc.so_tien,
    trang_thai_giu_tien: 'DANG_GIU',
    ngay_bat_dau_giu: hienTai,
  });

  await ghiNhatKy(null, 'CHUYEN_COC_VAO_DON', 'dat_coc_dau_gia', coc.id, {
    don_hang_id: donHang.id,
  });
}

async function ketThucPhien(phienId) {
  const hienTai = await coSoDuLieu.thoiGianHienTai();

  for (const coc of await khoCoc.chuaXuLyCuoi(phienId)) {
    const daThu = coc.trang_thai === 'DA_DAT_COC';

    await khoBanGhi.capNhat('dat_coc_dau_gia', coc.id, {
      trang_thai: daThu ? 'DA_HOAN_COC' : 'HET_HAN',
      ngay_hoan: daThu ? hienTai : null,
      ly_do_xu_ly: 'Phiên kết thúc hoặc hủy, không có đơn thắng sử dụng khoản cọc này.',
    });

    await ghiNhatKy(null, daThu ? 'HOAN_COC' : 'HET_HAN_COC', 'dat_coc_dau_gia', coc.id);

    if (daThu) {
      await taoThongBao(
        coc.nguoi_dung_id,
        'HOAN_COC',
        'Đã hoàn cọc mô phỏng',
        'Bạn không có đơn thắng sử dụng khoản cọc này.',
        `/auctions/${phienId}`,
      );
    }
  }
}

async function khongHoanCoc(donHang) {
  const coc = await khoCoc.cuaNguoiDung(donHang.phien_dau_gia_id, donHang.nguoi_mua_id, true);

  if (coc?.trang_thai !== 'DA_CHUYEN_VAO_DON' || !cungId(coc.don_hang_id, donHang.id)) {
    return;
  }

  await khoBanGhi.capNhat('dat_coc_dau_gia', coc.id, {
    trang_thai: 'KHONG_HOAN_COC',
    ngay_khong_hoan: await coSoDuLieu.thoiGianHienTai(),
    ly_do_xu_ly: 'Người thắng không thanh toán phần còn lại đúng hạn.',
  });
  // Tiền đã thuộc đơn vẫn nằm trong khoản đang giữ, không chuyển cho người bán.
  await khoBanGhi.capNhat('don_hang', donHang.id, {
    can_admin_xu_ly: 1,
    ly_do_can_xu_ly: 'Cọc không hoàn do quá hạn thanh toán; vi phạm chờ Admin xét.',
  });

  await ghiNhatKy(null, 'KHONG_HOAN_COC', 'dat_coc_dau_gia', coc.id);
}

async function thongKeNguoiBan(nguoiDung: NguoiDungDangNhap, phienId) {
  const phien = batBuocTonTai(await cacPhien.layTheoId(kiemTra.id(phienId)));

  baoDam(
    nguoiDung.vai_tro === 'QUAN_TRI' || cungId(phien.nguoi_ban_id, nguoiDung.id),
    403,
    'Chỉ chủ phiên được xem thống kê',
  );

  return khoCoc.thongKe(phien.id);
}

async function cuaToi(nguoiDung: NguoiDungDangNhap, phienId) {
  const id = kiemTra.id(phienId);

  batBuocTonTai(await cacPhien.layTheoId(id));

  return khoCoc.cuaNguoiDung(id, nguoiDung.id);
}

export {
  dangKy,
  thanhToan,
  kiemTraQuyenDatGia,
  chuyenVaoDon,
  ketThucPhien,
  khongHoanCoc,
  thongKeNguoiBan,
  cuaToi,
};
