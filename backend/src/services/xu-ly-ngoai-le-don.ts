import type { NguoiDungDangNhap } from '../types/nghiep-vu';
import coSoDuLieu = require('../repositories/ket-noi');
import khoBanGhi = require('../repositories/ban-ghi');
import khoDon = require('../repositories/don-hang');
import khoCoc = require('../repositories/dat-coc');
import khoNguoiDung = require('../repositories/nguoi-dung');
import { quyetToanCocSchema, giaiToaDonSchema } from '../validations/don-hang.schema';
import { docSchema, id as kiemTraId } from '../validations/du-lieu-dau-vao';
import { baoDam, batBuocTonTai, cungId } from '../utils/loi';
import { docJSON } from '../utils/du-lieu-json';
import { donViTienNho } from '../utils/tien';
import { ghiNhatKy, taoThongBao } from './nhat-ky-thong-bao';

export async function bienBan(donId, hanhDong) {
  const banGhi = await khoDon.xuLyNgoaiLe(donId, hanhDong);

  return banGhi
    ? {
        ...docJSON(banGhi.du_lieu_moi, {}),
        nguoi_xu_ly_id: banGhi.nguoi_thuc_hien_id,
        ngay_xu_ly: banGhi.ngay_tao,
      }
    : null;
}

export function duocQuyetToanCoc(don) {
  return (
    don.trang_thai === 'DA_HUY' &&
    don.ly_do_huy === 'KHONG_THANH_TOAN' &&
    don.trang_thai_giu_tien === 'DANG_GIU' &&
    donViTienNho(don.tien_coc_da_chuyen) > 0n &&
    donViTienNho(don.so_tien_da_thu) === donViTienNho(don.tien_coc_da_chuyen)
  );
}

function kiemTraQuanTri(nguoiDung: NguoiDungDangNhap) {
  baoDam(nguoiDung.vai_tro === 'QUAN_TRI', 403, 'Chỉ Admin được xử lý ngoại lệ của đơn');
}

async function thongBaoHaiBen(don, loai, tieuDe, noiDung) {
  for (const id of [don.nguoi_mua_id, don.nguoi_ban_id]) {
    await taoThongBao(id, loai, tieuDe, noiDung, `/orders/${don.id}`);
  }
}

export async function quyetToanCoc(nguoiDung: NguoiDungDangNhap, donId, duLieuNhap: unknown) {
  kiemTraQuanTri(nguoiDung);

  const dauVao = docSchema(quyetToanCocSchema, duLieuNhap);

  return coSoDuLieu.giaoDich(async () => {
    const don = batBuocTonTai(await khoDon.khoaDuLieu(kiemTraId(donId)));
    const daXuLy = await bienBan(don.id, 'QUYET_TOAN_COC_BO_THANH_TOAN');

    if (daXuLy) {
      baoDam(daXuLy.ket_qua === dauVao.ket_qua, 409, 'Cọc đã quyết toán theo kết quả khác');

      return require('./don-hang').chiTiet(nguoiDung, don.id);
    }

    baoDam(
      duocQuyetToanCoc(don),
      409,
      'Chỉ quyết toán cọc đang giữ của đơn hủy do không thanh toán',
    );
    baoDam(!(await khoDon.tranhChapDangMo(don.id)), 409, 'Đơn còn tranh chấp đang xử lý');

    const coc = batBuocTonTai(
      await khoCoc.cuaNguoiDung(don.phien_dau_gia_id, don.nguoi_mua_id, true),
    );

    baoDam(
      coc.trang_thai === 'KHONG_HOAN_COC' &&
        cungId(coc.don_hang_id, don.id) &&
        donViTienNho(coc.so_tien) === donViTienNho(don.so_tien_dang_giu),
      409,
      'Khoản cọc và số tiền đang giữ không khớp; cần đối soát dữ liệu',
    );

    const hoanNguoiMua = dauVao.ket_qua === 'HOAN_NGUOI_MUA';

    if (!hoanNguoiMua) {
      const nguoiBan = batBuocTonTai(await khoNguoiDung.layTheoId(don.nguoi_ban_id, true));

      baoDam(
        nguoiBan.trang_thai_tai_khoan === 'HOAT_DONG',
        409,
        'Người bán đang bị hạn chế; chưa bồi hoàn',
      );
    }

    const hienTai = await coSoDuLieu.thoiGianHienTai();

    // Đơn vẫn bị hủy. Quyết toán chỉ xử lý đúng khoản cọc đã thu, không tạo một lần bán thành công.
    await khoBanGhi.capNhat('don_hang', don.id, {
      trang_thai_giu_tien: hoanNguoiMua ? 'DA_HOAN_TIEN' : 'DA_GIAI_NGAN',
      so_tien_da_hoan: hoanNguoiMua ? coc.so_tien : '0.00',
      so_tien_da_giai_ngan: hoanNguoiMua ? '0.00' : coc.so_tien,
      ngay_hoan_tien: hoanNguoiMua ? hienTai : null,
      ngay_giai_ngan: hoanNguoiMua ? null : hienTai,
      can_admin_xu_ly: 0,
      ly_do_can_xu_ly: null,
      ghi_chu_giu_tien: `Quyết toán cọc: ${dauVao.ket_qua}. ${dauVao.ly_do}`.slice(0, 500),
    });
    // Giữ trạng thái/mối liên kết cọc gốc để bảo toàn lịch sử chuyển vào đơn.
    await khoBanGhi.capNhat('dat_coc_dau_gia', coc.id, {
      ngay_hoan: hoanNguoiMua ? hienTai : null,
      ly_do_xu_ly:
        `${hoanNguoiMua ? 'Đã hoàn cọc ngoại lệ cho người mua' : 'Đã bồi hoàn cọc cho người bán'}. ${dauVao.ly_do}`.slice(
          0,
          1000,
        ),
    });

    await ghiNhatKy(nguoiDung.id, 'QUYET_TOAN_COC_BO_THANH_TOAN', 'don_hang', don.id, {
      ...dauVao,
      coc_id: coc.id,
      so_tien: coc.so_tien,
    });

    await thongBaoHaiBen(
      don,
      'QUYET_TOAN_COC',
      'Đã quyết toán cọc của đơn bị hủy',
      hoanNguoiMua
        ? 'Admin đã hoàn lại toàn bộ cọc theo căn cứ ngoại lệ được ghi trong đơn.'
        : 'Admin đã bồi hoàn toàn bộ cọc cho người bán.',
    );

    return require('./don-hang').chiTiet(nguoiDung, don.id);
  });
}

export async function giaiToaCanhBao(nguoiDung: NguoiDungDangNhap, donId, duLieuNhap: unknown) {
  kiemTraQuanTri(nguoiDung);

  const dauVao = docSchema(giaiToaDonSchema, duLieuNhap);

  return coSoDuLieu.giaoDich(async () => {
    const don = batBuocTonTai(await khoDon.khoaDuLieu(kiemTraId(donId)));

    if (!Number(don.can_admin_xu_ly) && (await bienBan(don.id, 'GIAI_TOA_CANH_BAO_DON'))) {
      return require('./don-hang').chiTiet(nguoiDung, don.id);
    }

    const lyDo = await lyDoChuaGiaiToa(don, true);

    baoDam(!lyDo, 409, lyDo);

    await khoBanGhi.capNhat('don_hang', don.id, { can_admin_xu_ly: 0, ly_do_can_xu_ly: null });

    await ghiNhatKy(nguoiDung.id, 'GIAI_TOA_CANH_BAO_DON', 'don_hang', don.id, {
      ...dauVao,
      canh_bao_cu: don.ly_do_can_xu_ly,
    });

    await thongBaoHaiBen(
      don,
      'GIAI_TOA_CANH_BAO',
      'Đơn đã được Admin kiểm tra',
      'Cảnh báo đã được giải tỏa. Tiền vẫn được giữ; đơn tiếp tục theo bước giao hàng và kiểm tra hiện tại.',
    );

    return require('./don-hang').chiTiet(nguoiDung, don.id);
  });
}

export async function lyDoChuaGiaiToa(don, khoa = false): Promise<string | null> {
  if (!Number(don.can_admin_xu_ly)) {
    return 'Đơn không có cảnh báo cần giải tỏa';
  }
  if (!['DA_GUI_HANG', 'DA_GIAO', 'DANG_KIEM_TRA'].includes(don.trang_thai)) {
    return 'Cần ghi nhận đã gửi hàng; đơn hủy hoặc tranh chấp phải xử lý theo luồng riêng';
  }
  if (
    don.trang_thai_giu_tien !== 'DANG_GIU' ||
    donViTienNho(don.so_tien_da_thu) !== donViTienNho(don.tong_tien)
  ) {
    return 'Đơn chưa thu đủ và giữ tiền';
  }
  if (await khoDon.tranhChapDangMo(don.id)) {
    return 'Phải giải quyết tranh chấp trước';
  }

  const hang = require('./hang-hoan').docXuLyHang(don);

  if (hang && hang.trang_thai !== 'DA_DUNG_THU_HOI') {
    return 'Hàng đang được xử lý theo hồ sơ thu hồi';
  }

  const cacId = [don.nguoi_mua_id, don.nguoi_ban_id].sort((a, b) =>
    BigInt(a) < BigInt(b) ? -1 : 1,
  );

  for (const id of cacId) {
    const taiKhoan = batBuocTonTai(await khoNguoiDung.layTheoId(id, khoa));

    if (taiKhoan.trang_thai_tai_khoan !== 'HOAT_DONG') {
      return 'Còn tài khoản bị khóa/tạm ngưng; chưa giải tỏa cảnh báo';
    }
  }

  return null;
}
