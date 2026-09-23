import type { NguoiDungDangNhap } from '../types/nghiep-vu';
import { phanHoiDeNghiSchema } from '../validations/don-hang.schema';
import coSoDuLieu = require('../repositories/ket-noi');
import khoBanGhi = require('../repositories/ban-ghi');
import khoDuLieu = require('../repositories/don-hang');
import cacPhienDauGia = require('../repositories/dau-gia');
import cacNguoiDung = require('../repositories/nguoi-dung');
import cauHinhNghiepVu = require('./cau-hinh');
import cacDonHang = require('./don-hang');
import { ghiNhatKy, taoThongBao } from './nhat-ky-thong-bao';
import kiemTra = require('../validations/du-lieu-dau-vao');
import { baoDam, batBuocTonTai, cungId } from '../utils/loi';
import { donViTienNho } from '../utils/tien';
import thoiGian = require('../utils/thoi-gian');
async function deNghiNguoiTiepTheoDaKhoa(phienDauGia, banGoc, nguoiYeuCauId) {
  if (
    phienDauGia.trang_thai !== 'DA_KET_THUC' ||
    banGoc.trang_thai !== 'DA_HUY' ||
    banGoc.ly_do_huy !== 'KHONG_THANH_TOAN'
  )
    return null;
  if (
    (await khoDuLieu.donDangXuLyCuaPhien(phienDauGia.id)) ||
    (await khoDuLieu.deNghiDangCho(phienDauGia.id))
  )
    return null;
  const nguoiBan = await cacNguoiDung.layTheoId(phienDauGia.nguoi_ban_id);
  if (
    !nguoiBan ||
    nguoiBan.trang_thai_tai_khoan !== 'HOAT_DONG' ||
    nguoiBan.trang_thai_nguoi_ban !== 'DA_XAC_MINH'
  )
    return null;
  const cacUngVien = await khoDuLieu.ungVienTiepTheo(phienDauGia.id);
  const ungVien = cacUngVien.find(
    (x) =>
      phienDauGia.gia_san == null || donViTienNho(x.so_tien) >= donViTienNho(phienDauGia.gia_san),
  );
  if (!ungVien) return null;
  const id = await khoBanGhi.them('de_nghi_mua_tiep_theo', {
    phien_dau_gia_id: phienDauGia.id,
    don_hang_goc_id: banGoc.id,
    nguoi_tra_gia_id: ungVien.nguoi_tra_gia_id,
    gia_de_nghi: ungVien.so_tien,
    luot_tra_gia_nguon_id: ungVien.id,
    nguoi_yeu_cau_id: nguoiYeuCauId,
    het_han_luc: thoiGian.congGiay(
      await coSoDuLieu.thoiGianHienTai(),
      (await cauHinhNghiepVu.docSoCauHinh('SECOND_CHANCE_EXPIRE_HOURS')) * 3600,
    ),
  });
  await ghiNhatKy(nguoiYeuCauId, 'TAO_SECOND_CHANCE', 'de_nghi_mua_tiep_theo', id, {
    luot_tra_gia_cong_khai_id: ungVien.id,
  });
  await taoThongBao(
    ungVien.nguoi_tra_gia_id,
    'SECOND_CHANCE',
    'Bạn có đề nghị mua tiếp theo',
    'Giá đề nghị dựa trên lượt trả giá công khai hợp lệ của bạn.',
    `/second-chances/${id}`,
  );
  return khoBanGhi.layTheoId('de_nghi_mua_tiep_theo', id);
}
async function tao(nguoiDung: NguoiDungDangNhap, donHangId) {
  return coSoDuLieu.giaoDich(async () => {
    const banGhi = batBuocTonTai(await khoDuLieu.khoaDuLieu(kiemTra.id(donHangId)));
    baoDam(
      cungId(nguoiDung.id, banGhi.nguoi_ban_id),
      403,
      'Chỉ người bán được tạo đề nghị',
    );
    baoDam(
      banGhi.trang_thai === 'DA_HUY' && banGhi.ly_do_huy === 'KHONG_THANH_TOAN',
      409,
      'Chỉ tạo đề nghị khi người thắng không thanh toán',
    );
    const deNghi = await deNghiNguoiTiepTheoDaKhoa(
      await cacPhienDauGia.layTheoId(banGhi.phien_dau_gia_id),
      banGhi,
      nguoiDung.id,
    );
    baoDam(deNghi, 409, 'Không có ứng viên phù hợp hoặc đã có đơn/đề nghị đang xử lý');
    return deNghi;
  });
}
async function chiTiet(nguoiDung: NguoiDungDangNhap, id) {
  const banGhi = batBuocTonTai(await khoBanGhi.layTheoId('de_nghi_mua_tiep_theo', kiemTra.id(id)));
  const phienDauGia = batBuocTonTai(await cacPhienDauGia.layTheoId(banGhi.phien_dau_gia_id));
  baoDam(
    nguoiDung.vai_tro === 'QUAN_TRI' ||
      cungId(nguoiDung.id, banGhi.nguoi_tra_gia_id) ||
      cungId(nguoiDung.id, phienDauGia.nguoi_ban_id),
    403,
    'Không có quyền xem đề nghị',
  );
  return banGhi;
}
async function phanHoiDeNghi(nguoiDung: NguoiDungDangNhap, id, duLieuNhap: unknown) {
  const dauVao = kiemTra.docSchema(phanHoiDeNghiSchema, duLieuNhap);
  const chapNhan = kiemTra.giaTriDungSai(dauVao.chap_nhan, 'Chấp nhận');
  return coSoDuLieu.giaoDich(async () => {
    const banDau = batBuocTonTai(
      await khoBanGhi.layTheoId('de_nghi_mua_tiep_theo', kiemTra.id(id)),
    );
    const phienDauGia = batBuocTonTai(
      await cacPhienDauGia.layTheoId(banDau.phien_dau_gia_id, true),
    );
    const banGhi = batBuocTonTai(await khoBanGhi.layTheoId('de_nghi_mua_tiep_theo', id, true));
    baoDam(cungId(banGhi.nguoi_tra_gia_id, nguoiDung.id), 403, 'Đề nghị không thuộc tài khoản');
    if (chapNhan && banGhi.trang_thai === 'DA_CHAP_NHAN')
      return {
        de_nghi: banGhi,
        don_hang: await cacDonHang.chiTiet(nguoiDung, banGhi.don_hang_moi_id),
      };
    const thoiGianHienTai = await coSoDuLieu.thoiGianHienTai();
    baoDam(
      banGhi.trang_thai === 'CHO_XU_LY' && !thoiGian.daHetHan(banGhi.het_han_luc, thoiGianHienTai),
      409,
      'Đề nghị đã xử lý hoặc hết hạn',
    );
    baoDam(
      !(await khoDuLieu.donDangXuLyCuaPhien(phienDauGia.id)),
      409,
      'Phiên đã có đơn đang xử lý',
    );
    const banGoc = batBuocTonTai(
      await khoBanGhi.layTheoId('don_hang', banGhi.don_hang_goc_id, true),
    );
    baoDam(
      banGoc.trang_thai === 'DA_HUY' && banGoc.ly_do_huy === 'KHONG_THANH_TOAN',
      409,
      'Đơn gốc không đủ điều kiện',
    );
    let donHang = null;
    if (chapNhan) {
      const nguoiBan = batBuocTonTai(await cacNguoiDung.layTheoId(phienDauGia.nguoi_ban_id));
      baoDam(
        nguoiBan.trang_thai_tai_khoan === 'HOAT_DONG' &&
          nguoiBan.trang_thai_nguoi_ban === 'DA_XAC_MINH',
        409,
        'Người bán hiện không đủ điều kiện giao dịch',
      );
      const taiKhoan = batBuocTonTai(await cacNguoiDung.layTheoId(nguoiDung.id, true));
      baoDam(
        taiKhoan.trang_thai_tai_khoan === 'HOAT_DONG' && taiKhoan.vai_tro === 'NGUOI_DUNG',
        403,
        'Tài khoản không đủ điều kiện',
      );
      const luotGiaCongKhai = batBuocTonTai(
        await khoDuLieu.giaCongKhaiCuoi(phienDauGia.id, nguoiDung.id),
        'Không có lượt trả giá công khai',
      );
      baoDam(
        donViTienNho(luotGiaCongKhai.so_tien) === donViTienNho(banGhi.gia_de_nghi),
        409,
        'Giá đề nghị không khớp lượt trả giá công khai cuối cùng',
      );
      baoDam(
        phienDauGia.gia_san == null ||
          donViTienNho(banGhi.gia_de_nghi) >= donViTienNho(phienDauGia.gia_san),
        409,
        'Đề nghị chưa đạt giá sàn',
      );
      donHang = await cacDonHang.taoDonNguoiThang(
        phienDauGia,
        nguoiDung.id,
        banGhi.gia_de_nghi,
        'DE_NGHI_TIEP_THEO',
      );
    }
    await khoBanGhi.capNhat('de_nghi_mua_tiep_theo', id, {
      trang_thai: chapNhan ? 'DA_CHAP_NHAN' : 'TU_CHOI',
      ngay_phan_hoi: thoiGianHienTai,
      don_hang_moi_id: donHang?.id || null,
    });
    await ghiNhatKy(
      nguoiDung.id,
      chapNhan ? 'CHAP_NHAN_SECOND_CHANCE' : 'TU_CHOI_SECOND_CHANCE',
      'de_nghi_mua_tiep_theo',
      id,
    );

    return { de_nghi: await khoBanGhi.layTheoId('de_nghi_mua_tiep_theo', id), don_hang: donHang };
  });
}
async function xuLyHetHan(id) {
  return coSoDuLieu.giaoDich(async () => {
    const banDau = await khoBanGhi.layTheoId('de_nghi_mua_tiep_theo', id);
    if (!banDau) return;
    const phienDauGia = batBuocTonTai(
      await cacPhienDauGia.layTheoId(banDau.phien_dau_gia_id, true),
    );
    const banGhi = batBuocTonTai(await khoBanGhi.layTheoId('de_nghi_mua_tiep_theo', id, true));
    if (
      banGhi.trang_thai !== 'CHO_XU_LY' ||
      !thoiGian.daHetHan(banGhi.het_han_luc, await coSoDuLieu.thoiGianHienTai())
    )
      return;
    await khoBanGhi.capNhat('de_nghi_mua_tiep_theo', id, { trang_thai: 'HET_HAN' });
    await ghiNhatKy(null, 'HET_HAN_SECOND_CHANCE', 'de_nghi_mua_tiep_theo', id);

  });
}
export = { tao, chiTiet, phanHoiDeNghi, xuLyHetHan };
