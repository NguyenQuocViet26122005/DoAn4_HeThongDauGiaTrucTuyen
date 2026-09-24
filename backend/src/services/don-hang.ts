import type { NguoiDungDangNhap } from '../types/nghiep-vu';
import { thanhToanSchema, guiHangSchema, diaChiDonSchema } from '../validations/don-hang.schema';
import { randomUUID as taoMaNgauNhien } from 'node:crypto';
import coSoDuLieu = require('../repositories/ket-noi');
import khoBanGhi = require('../repositories/ban-ghi');
import khoDuLieu = require('../repositories/don-hang');
import cacPhienDauGia = require('../repositories/dau-gia');
import cacNguoiDung = require('../repositories/nguoi-dung');
import cauHinhNghiepVu = require('./cau-hinh');
import { ghiNhatKy, taoThongBao, thongBaoMotLan } from './nhat-ky-thong-bao';
import kiemTra = require('../validations/du-lieu-dau-vao');
import { baoDam, batBuocTonTai, cungId } from '../utils/loi';
import { donViTienNho, chuoiTien } from '../utils/tien';
import thoiGian = require('../utils/thoi-gian');


function kiemTraQuyen(nguoiDung: NguoiDungDangNhap, banGhi) {
  baoDam(
    nguoiDung.vai_tro === 'QUAN_TRI' ||
      cungId(nguoiDung.id, banGhi.nguoi_mua_id) ||
      cungId(nguoiDung.id, banGhi.nguoi_ban_id),
    403,
    'Không có quyền xem đơn hàng',
  );
}


function nguoiMua(nguoiDung: NguoiDungDangNhap, banGhi) {
  baoDam(cungId(nguoiDung.id, banGhi.nguoi_mua_id), 403, 'Chỉ người mua của đơn được thực hiện');
}


function nguoiBan(nguoiDung: NguoiDungDangNhap, banGhi) {
  baoDam(cungId(nguoiDung.id, banGhi.nguoi_ban_id), 403, 'Chỉ người bán của đơn được thực hiện');
}


function chupDiaChi(diaChi) {
  return {
    ten_nguoi_nhan: diaChi.ten_nguoi_nhan,
    sdt_nguoi_nhan: diaChi.sdt_nguoi_nhan,
    dia_chi_giao_hang: [
      diaChi.dia_chi_chi_tiet,
      diaChi.phuong_xa,
      diaChi.quan_huyen,
      diaChi.tinh_thanh,
    ]
      .join(', ')
      .slice(0, 500),
  };
}


// Nơi gọi phải đang giữ khóa phiên. Cả chốt phiên và đề nghị mua tiếp đều qua đây.
async function taoDonNguoiThang(
  phienDauGia,
  nguoiMuaId,
  gia,
  nguon = 'THANG_DAU_GIA',
  diaChi = undefined,
) {
  const daCo = await khoDuLieu.donDangXuLyCuaPhien(phienDauGia.id);


  if (daCo) {
    baoDam(
      cungId(daCo.nguoi_mua_id, nguoiMuaId) && daCo.nguon_don === nguon,
      409,
      'Phiên đã có đơn hàng đang xử lý',
    );


    return daCo;
  }
  await cacNguoiDung.layTheoId(nguoiMuaId, true);
  diaChi = diaChi || (await cacNguoiDung.diaChiMacDinh(nguoiMuaId));


  baoDam(diaChi, 409, 'Người thắng cần có địa chỉ giao hàng để tạo đơn');


  const thoiGianHienTai = await coSoDuLieu.thoiGianHienTai();


  const id = await khoBanGhi.them('don_hang', {
    ma_don_hang: `DG${taoMaNgauNhien().replaceAll('-', '').slice(0, 26)}`,
    phien_dau_gia_id: phienDauGia.id,
    nguoi_mua_id: nguoiMuaId,
    nguoi_ban_id: phienDauGia.nguoi_ban_id,
    nguon_don: nguon,
    gia_san_pham: gia,
    phi_van_chuyen: phienDauGia.phi_van_chuyen ?? '0.00',
    tong_tien: chuoiTien(donViTienNho(gia) + donViTienNho(phienDauGia.phi_van_chuyen ?? '0.00')),
    han_thanh_toan: thoiGian.congGiay(
      thoiGianHienTai,
      (await cauHinhNghiepVu.docSoCauHinh('PAYMENT_DEADLINE_HOURS')) * 3600,
    ),
    ...chupDiaChi(diaChi),
  });


  await taoThongBao(
    nguoiMuaId,
    'CAN_THANH_TOAN',
    'Bạn có đơn hàng cần thanh toán',
    'Hoàn tất thanh toán mô phỏng trước hạn của đơn.',
    `/orders/${id}`,
  );
  await taoThongBao(
    phienDauGia.nguoi_ban_id,
    'CO_DON_HANG',
    'Phiên đã tạo đơn hàng',
    'Đơn đang chờ người mua thanh toán.',
    `/orders/${id}`,
  );
  await ghiNhatKy(null, 'TAO_DON_HANG', 'don_hang', id, { nguon_don: nguon });


  return khoBanGhi.layTheoId('don_hang', id);
}


async function chiTiet(nguoiDung: NguoiDungDangNhap, id) {
  const banGhi = batBuocTonTai(await khoBanGhi.layTheoId('don_hang', kiemTra.id(id)));


  kiemTraQuyen(nguoiDung, banGhi);


  const phienDauGia = await cacPhienDauGia.layTheoId(banGhi.phien_dau_gia_id);


  return {
    ...banGhi,
    ly_do_ket_thuc_phien: phienDauGia.ly_do_ket_thuc,
    thanh_toan: await khoDuLieu.cacThanhToan(id),
    giu_tien: await khoDuLieu.tienTrungGian(id),
    van_chuyen: await khoDuLieu.vanChuyen(id),
    tranh_chap: await khoDuLieu.cacTranhChap(id),
  };
}


async function capNhatDiaChi(nguoiDung: NguoiDungDangNhap, id, duLieuNhap: unknown) {
  const dauVao = kiemTra.docSchema(diaChiDonSchema, duLieuNhap);


  return coSoDuLieu.giaoDich(async () => {
    const banGhi = batBuocTonTai(await khoDuLieu.khoaDuLieu(kiemTra.id(id)));


    nguoiMua(nguoiDung, banGhi);
    baoDam(
      banGhi.trang_thai === 'CHO_THANH_TOAN' &&
        !thoiGian.daHetHan(banGhi.han_thanh_toan, await coSoDuLieu.thoiGianHienTai()),
      409,
      'Không thể đổi địa chỉ ở trạng thái này',
    );


    const diaChi = batBuocTonTai(
      await khoBanGhi.layTheoId('dia_chi_nguoi_dung', kiemTra.id(dauVao.dia_chi_id)),
    );


    baoDam(cungId(diaChi.nguoi_dung_id, nguoiDung.id), 403, 'Địa chỉ không thuộc tài khoản');


    await khoBanGhi.capNhat('don_hang', id, chupDiaChi(diaChi));


    return chiTiet(nguoiDung, id);
  });
}


async function thanhToan(nguoiDung: NguoiDungDangNhap, id, duLieuNhap: unknown = {}) {
  const dauVao = kiemTra.docSchema(thanhToanSchema, duLieuNhap);
  const ketQua = kiemTra.giaTriLuaChon(
    dauVao.ket_qua_mo_phong ?? 'THANH_CONG',
    ['THANH_CONG', 'THAT_BAI'],
    'Kết quả mô phỏng',
  );
  const khoaYeuCau =
    dauVao.khoa_yeu_cau == null ? null : kiemTra.chuoi(dauVao.khoa_yeu_cau, 'Khóa yêu cầu', 100);


  baoDam(
    khoaYeuCau == null || /^[a-zA-Z0-9_-]{8,100}$/.test(khoaYeuCau),
    400,
    'Khóa yêu cầu cần 8–100 ký tự chữ, số, gạch ngang hoặc gạch dưới',
  );


  return coSoDuLieu.giaoDich(async () => {
    const banGhi = batBuocTonTai(await khoDuLieu.khoaDuLieu(kiemTra.id(id)));


    nguoiMua(nguoiDung, banGhi);


    if (
      [
        'CHO_GUI_HANG',
        'DA_THANH_TOAN',
        'DA_GUI_HANG',
        'DA_GIAO',
        'DANG_KIEM_TRA',
        'DANG_TRANH_CHAP',
        'HOAN_THANH',
      ].includes(banGhi.trang_thai) &&
      (await khoDuLieu.cacThanhToan(id)).some((p) => p.trang_thai === 'DA_THANH_TOAN')
    )
      {
return chiTiet(nguoiDung, id);
}


    const thoiGianHienTai = await coSoDuLieu.thoiGianHienTai();


    baoDam(
      banGhi.trang_thai === 'CHO_THANH_TOAN' &&
        banGhi.han_thanh_toan &&
        !thoiGian.daHetHan(banGhi.han_thanh_toan, thoiGianHienTai),
      409,
      'Đơn không còn trong hạn thanh toán',
    );


    if (khoaYeuCau) {
      const daXuLy = await coSoDuLieu.layMot(
        'SELECT don_hang_id FROM thanh_toan WHERE khoa_yeu_cau=?',
        [khoaYeuCau],
      );


      if (daXuLy) {
        baoDam(cungId(daXuLy.don_hang_id, id), 409, 'Khóa yêu cầu đã được dùng');


        return chiTiet(nguoiDung, id);
      }
    }
    if (ketQua === 'THAT_BAI') {
      await khoBanGhi.them('thanh_toan', {
        don_hang_id: id,
        phuong_thuc_thanh_toan: 'MO_PHONG',
        so_tien: banGhi.tong_tien,
        trang_thai: 'THAT_BAI',
        ma_giao_dich: `SIM-${taoMaNgauNhien()}`,
        khoa_yeu_cau: khoaYeuCau,
        ngay_het_han: banGhi.han_thanh_toan,
      });


      await ghiNhatKy(nguoiDung.id, 'THANH_TOAN_MO_PHONG_THAT_BAI', 'don_hang', id);


      return chiTiet(nguoiDung, id);
    }


    // Số tiền lấy từ đơn đã khóa; phía khách không được tự chọn số tiền thanh toán.
    const cacThanhToan = await khoDuLieu.cacThanhToan(id);
    const dangCho = cacThanhToan.find((p) => p.trang_thai === 'CHO_XU_LY');
    const duLieu = {
      phuong_thuc_thanh_toan: 'MO_PHONG',
      khoa_yeu_cau: khoaYeuCau,
      so_tien: banGhi.tong_tien,
      trang_thai: 'DA_THANH_TOAN',
      ma_giao_dich: `SIM-${taoMaNgauNhien()}`,
      ngay_thanh_toan: thoiGianHienTai,
      ngay_het_han: banGhi.han_thanh_toan,
    };


    if (dangCho) {
await khoBanGhi.capNhat('thanh_toan', dangCho.id, duLieu);
}
    else {
await khoBanGhi.them('thanh_toan', { ...duLieu, don_hang_id: id });
}


    const tienTrungGian = await khoDuLieu.tienTrungGian(id, true);


    baoDam(
      !tienTrungGian || tienTrungGian.trang_thai === 'CHO_GIU_TIEN',
      409,
      'Đơn đã có giao dịch giữ tiền',
    );


    await khoBanGhi.capNhat('don_hang', id, {
      so_tien_da_thu: banGhi.tong_tien,
      trang_thai_giu_tien: 'DANG_GIU',
      ngay_bat_dau_giu: thoiGianHienTai,
      trang_thai: 'CHO_GUI_HANG',
      han_nguoi_ban_gui_hang: thoiGian.congGiay(
        thoiGianHienTai,
        (await cauHinhNghiepVu.docSoCauHinh('SELLER_SHIP_DEADLINE_DAYS')) * 86400,
      ),
    });


    await ghiNhatKy(nguoiDung.id, 'THANH_TOAN_MO_PHONG', 'don_hang', id);
    await taoThongBao(
      banGhi.nguoi_ban_id,
      'CAN_GUI_HANG',
      'Đơn đã thanh toán — cần gửi hàng',
      'Tiền đang được hệ thống giữ trung gian.',
      `/orders/${id}`,
    );
    await taoThongBao(
      nguoiDung.id,
      'DA_THANH_TOAN',
      'Thanh toán mô phỏng thành công',
      'Tiền được giữ đến khi giao dịch hoàn thành.',
      `/orders/${id}`,
    );


    return chiTiet(nguoiDung, id);
  });
}


async function guiHang(nguoiDung: NguoiDungDangNhap, id, duLieuNhap: unknown) {
  const dauVao = kiemTra.docSchema(guiHangSchema, duLieuNhap);
  const donViVanChuyen = kiemTra.chuoi(dauVao.don_vi_van_chuyen, 'Đơn vị vận chuyển', 100);
  const maVanDon = kiemTra.chuoi(dauVao.ma_van_don, 'Mã vận đơn', 100);


  return coSoDuLieu.giaoDich(async () => {
    const banGhi = batBuocTonTai(await khoDuLieu.khoaDuLieu(kiemTra.id(id)));


    nguoiBan(nguoiDung, banGhi);
    baoDam(
      ['CHO_GUI_HANG', 'DA_THANH_TOAN'].includes(banGhi.trang_thai),
      409,
      'Đơn không ở bước gửi hàng',
    );


    const tienDangGiu = await khoDuLieu.tienTrungGian(id, true);


    baoDam(tienDangGiu?.trang_thai === 'DANG_GIU', 409, 'Đơn chưa được giữ tiền');


    const thoiGianHienTai = await coSoDuLieu.thoiGianHienTai();


    if (thoiGian.daHetHan(banGhi.han_nguoi_ban_gui_hang, thoiGianHienTai))
      {
await ghiNhanGiaoMuon(banGhi);
}


    await khoBanGhi.capNhat('don_hang', id, {
      don_vi_van_chuyen: donViVanChuyen,
      ma_van_don: maVanDon,
      trang_thai_van_chuyen: 'DANG_VAN_CHUYEN',
      ngay_gui_hang: thoiGianHienTai,
      moc_khieu_nai_chua_nhan: thoiGian.congGiay(
        thoiGianHienTai,
        (await cauHinhNghiepVu.docSoCauHinh('BUYER_NON_RECEIPT_DAYS')) * 86400,
      ),
      trang_thai: 'DA_GUI_HANG',
    });


    await ghiNhatKy(nguoiDung.id, 'GUI_HANG', 'don_hang', id);
    await taoThongBao(
      banGhi.nguoi_mua_id,
      'DA_GUI_HANG',
      'Đơn hàng đã được gửi',
      `Mã vận đơn: ${maVanDon}`,
      `/orders/${id}`,
    );


    return chiTiet(nguoiDung, id);
  });
}


async function xacNhanDaGiao(nguoiDung: NguoiDungDangNhap, id) {
  return coSoDuLieu.giaoDich(async () => {
    const banGhi = batBuocTonTai(await khoDuLieu.khoaDuLieu(kiemTra.id(id)));


    baoDam(
      nguoiDung.vai_tro === 'QUAN_TRI' || cungId(nguoiDung.id, banGhi.nguoi_mua_id),
      403,
      'Chỉ người mua hoặc Admin xác nhận đã giao',
    );
    baoDam(banGhi.trang_thai === 'DA_GUI_HANG', 409, 'Đơn chưa được gửi hoặc đã xác nhận giao');


    const vanChuyen = batBuocTonTai(await khoDuLieu.vanChuyen(id));
    const thoiGianHienTai = await coSoDuLieu.thoiGianHienTai();


    await khoBanGhi.capNhat('don_hang', id, {
      trang_thai_van_chuyen: 'DA_GIAO',
      ngay_giao_van_chuyen: thoiGianHienTai,
      trang_thai: 'DANG_KIEM_TRA',
      ngay_giao_hang: thoiGianHienTai,
      han_kiem_tra: thoiGian.congGiay(
        thoiGianHienTai,
        (await cauHinhNghiepVu.docSoCauHinh('BUYER_INSPECTION_DAYS')) * 86400,
      ),
    });


    await ghiNhatKy(nguoiDung.id, 'XAC_NHAN_GIAO_HANG', 'don_hang', id);
    await taoThongBao(
      banGhi.nguoi_mua_id,
      'DA_GIAO_HANG',
      'Hàng đã giao — bắt đầu kiểm tra',
      'Bạn có thể xác nhận hàng tốt hoặc mở tranh chấp trước hạn kiểm tra.',
      `/orders/${id}`,
    );


    return chiTiet(nguoiDung, id);
  });
}


async function hoanThanhDonDaKhoa(banGhi, nguoiThucHienId) {
  baoDam(
    ['DA_GIAO', 'DANG_KIEM_TRA'].includes(banGhi.trang_thai),
    409,
    'Đơn chưa ở bước kiểm tra hàng',
  );
  baoDam(!(await khoDuLieu.tranhChapDangMo(banGhi.id)), 409, 'Đơn có tranh chấp chưa xử lý');


  // Khóa tài khoản theo cùng thứ tự để việc khóa và giải ngân không vượt nhau.
  const cacId = [banGhi.nguoi_mua_id, banGhi.nguoi_ban_id].sort((a, b) =>
    BigInt(a) < BigInt(b) ? -1 : 1,
  );
  let biHanChe = false;


  for (const id of cacId) {
    const taiKhoan = batBuocTonTai(await cacNguoiDung.layTheoId(id, true));


    if (taiKhoan.trang_thai_tai_khoan !== 'HOAT_DONG') {
biHanChe = true;
}
  }
  if (biHanChe) {
    await khoBanGhi.capNhat('don_hang', banGhi.id, {
      can_admin_xu_ly: 1,
      ly_do_can_xu_ly:
        'Tài khoản giao dịch bị khóa/tạm ngưng; cần Admin kiểm tra trước khi giải ngân.',
    });


    return;
  }


  const tienDangGiu = batBuocTonTai(
    await khoDuLieu.tienTrungGian(banGhi.id, true),
    'Không tìm thấy tiền trung gian',
  );


  baoDam(tienDangGiu.trang_thai === 'DANG_GIU', 409, 'Tiền trung gian không ở trạng thái giữ');


  const thoiGianHienTai = await coSoDuLieu.thoiGianHienTai();


  await khoBanGhi.capNhat('don_hang', banGhi.id, {
    trang_thai_giu_tien: 'DA_GIAI_NGAN',
    so_tien_da_giai_ngan: banGhi.so_tien_da_thu,
    ngay_giai_ngan: thoiGianHienTai,
    can_admin_xu_ly: 0,
    ly_do_can_xu_ly: null,
    trang_thai: 'HOAN_THANH',
    ngay_hoan_thanh: thoiGianHienTai,
  });


  await ghiNhatKy(nguoiThucHienId, 'HOAN_THANH_GIAI_NGAN', 'don_hang', banGhi.id);


  for (const nguoiDungId of [banGhi.nguoi_mua_id, banGhi.nguoi_ban_id])
    {
await taoThongBao(
      nguoiDungId,
      'HOAN_THANH_DON',
      'Giao dịch đã hoàn thành',
      'Tiền mô phỏng đã được giải ngân cho người bán.',
      `/orders/${banGhi.id}`,
    );
}
}


async function xacNhanHoanThanh(nguoiDung: NguoiDungDangNhap, id) {
  return coSoDuLieu.giaoDich(async () => {
    const banGhi = batBuocTonTai(await khoDuLieu.khoaDuLieu(kiemTra.id(id)));


    nguoiMua(nguoiDung, banGhi);


    if (banGhi.trang_thai === 'HOAN_THANH') {
return chiTiet(nguoiDung, id);
}
    await hoanThanhDonDaKhoa(banGhi, nguoiDung.id);


    return chiTiet(nguoiDung, id);
  });
}


async function ghiNhanGiaoMuon(banGhi) {
  if (await khoDuLieu.viPhamCuaDon(banGhi.id, 'GIAO_HANG_MUON')) {
return;
}


  await khoBanGhi.capNhat('don_hang', banGhi.id, {
    can_admin_xu_ly: 1,
    ly_do_can_xu_ly: 'Người bán quá hạn gửi hàng; cần Admin kiểm tra.',
  });
  await khoBanGhi.them('vi_pham', {
    nguoi_dung_id: banGhi.nguoi_ban_id,
    phien_dau_gia_id: banGhi.phien_dau_gia_id,
    don_hang_id: banGhi.id,
    loai_vi_pham: 'GIAO_HANG_MUON',
    mo_ta: 'Quá hạn người bán gửi hàng.',
    diem_vi_pham: 1,
  });


  await thongBaoMotLan(
    banGhi.nguoi_ban_id,
    'GUI_HANG_QUA_HAN',
    'Đã quá hạn gửi hàng',
    'Vui lòng gửi hàng và liên hệ người mua.',
    `/orders/${banGhi.id}`,
  );
}


async function xuLyDenHan(id) {
  return coSoDuLieu.giaoDich(async () => {
    const banGhi = batBuocTonTai(await khoDuLieu.khoaDuLieu(kiemTra.id(id)));
    const thoiGianHienTai = await coSoDuLieu.thoiGianHienTai();


    if (
      banGhi.trang_thai === 'CHO_THANH_TOAN' &&
      thoiGian.daHetHan(banGhi.han_thanh_toan, thoiGianHienTai)
    ) {
      await khoBanGhi.capNhat('don_hang', id, {
        trang_thai: 'DA_HUY',
        ngay_huy: thoiGianHienTai,
        ly_do_huy: 'KHONG_THANH_TOAN',
      });


      await khoDuLieu.danhDauThanhToanHetHan(id);
      if (!(await khoDuLieu.viPhamCuaDon(id, 'KHONG_THANH_TOAN')))
        {
await khoBanGhi.them('vi_pham', {
          nguoi_dung_id: banGhi.nguoi_mua_id,
          phien_dau_gia_id: banGhi.phien_dau_gia_id,
          don_hang_id: id,
          loai_vi_pham: 'KHONG_THANH_TOAN',
          mo_ta: 'Người thắng không thanh toán đúng hạn.',
          diem_vi_pham: 1,
        });
}


      await taoThongBao(
        banGhi.nguoi_mua_id,
        'HET_HAN_THANH_TOAN',
        'Đơn đã hủy vì quá hạn thanh toán',
        'Hệ thống đã ghi nhận vi phạm để Admin xem xét.',
        `/orders/${id}`,
      );
      await ghiNhatKy(null, 'HUY_DON_QUA_HAN', 'don_hang', id);
      await taoThongBao(
        banGhi.nguoi_ban_id,
        'DON_KHONG_THANH_TOAN',
        'Người thắng không thanh toán',
        'Bạn có thể chủ động tạo đề nghị mua tiếp theo từ đơn này.',
        `/orders/${id}`,
      );
    } else if (
      ['DA_GIAO', 'DANG_KIEM_TRA'].includes(banGhi.trang_thai) &&
      thoiGian.daHetHan(banGhi.han_kiem_tra, thoiGianHienTai) &&
      !(await khoDuLieu.tranhChapDangMo(id))
    )
      {
await hoanThanhDonDaKhoa(banGhi, null);
}
    else if (
      ['CHO_GUI_HANG', 'DA_THANH_TOAN'].includes(banGhi.trang_thai) &&
      thoiGian.daHetHan(banGhi.han_nguoi_ban_gui_hang, thoiGianHienTai)
    )
      {
await ghiNhanGiaoMuon(banGhi);
}
  });
}


async function nhacThanhToan(id) {
  return coSoDuLieu.giaoDich(async () => {
    const banGhi = await khoDuLieu.khoaDuLieu(id);


    if (
      banGhi?.trang_thai === 'CHO_THANH_TOAN' &&
      !thoiGian.daHetHan(banGhi.han_thanh_toan, await coSoDuLieu.thoiGianHienTai())
    )
      {
await thongBaoMotLan(
        banGhi.nguoi_mua_id,
        'SAP_HET_HAN_THANH_TOAN',
        'Sắp hết hạn thanh toán',
        'Hãy hoàn tất thanh toán mô phỏng trước thời hạn.',
        `/orders/${id}`,
      );
}
  });
}


export {
  kiemTraQuyen,
  nguoiMua,
  nguoiBan,
  chupDiaChi,
  taoDonNguoiThang,
  chiTiet,
  capNhatDiaChi,
  thanhToan,
  guiHang,
  xacNhanDaGiao,
  xacNhanHoanThanh,
  hoanThanhDonDaKhoa,
  xuLyDenHan,
  nhacThanhToan,
};
