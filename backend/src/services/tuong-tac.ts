import type { NguoiDungDangNhap } from '../types/nghiep-vu';
import { danhGiaSchema, duyetViPhamSchema } from '../validations/tuong-tac.schema';
import coSoDuLieu = require('../repositories/ket-noi');
import khoBanGhi = require('../repositories/ban-ghi');
import khoDuLieu = require('../repositories/tuong-tac');
import cacDonHang = require('../repositories/don-hang');
import cacNguoiDung = require('../repositories/nguoi-dung');
import cacPhienDauGia = require('../repositories/dau-gia');
import { ghiNhatKy, taoThongBao } from './nhat-ky-thong-bao';
import cauHinhNghiepVu = require('./cau-hinh');
import kiemTra = require('../validations/du-lieu-dau-vao');
import { baoDam, batBuocTonTai, cungId } from '../utils/loi';


async function danhGiaDonHang(nguoiDung: NguoiDungDangNhap, donHangId, duLieuNhap: unknown) {
  const dauVao = kiemTra.docSchema(danhGiaSchema, duLieuNhap);
  const soSao = kiemTra.soNguyen(dauVao.so_sao, 'Số sao', 1, 5);
  const nhanXet = dauVao.nhan_xet ? kiemTra.chuoi(dauVao.nhan_xet, 'Nhận xét', 1000) : null;


  return coSoDuLieu.giaoDich(async () => {
    const donHang = batBuocTonTai(await cacDonHang.khoaDuLieu(kiemTra.id(donHangId)));


    baoDam(donHang.trang_thai === 'HOAN_THANH', 409, 'Chỉ đánh giá đơn đã hoàn thành');
    baoDam(
      cungId(nguoiDung.id, donHang.nguoi_mua_id) || cungId(nguoiDung.id, donHang.nguoi_ban_id),
      403,
      'Không phải người tham gia giao dịch',
    );
    baoDam(
      !(await khoDuLieu.danhGiaCuaDon(donHangId, nguoiDung.id)),
      409,
      'Bạn đã đánh giá đơn này',
    );


    const nguoiNhanDanhGia = cungId(nguoiDung.id, donHang.nguoi_mua_id)
      ? donHang.nguoi_ban_id
      : donHang.nguoi_mua_id;


    const id = await khoBanGhi.them('danh_gia', {
      don_hang_id: donHang.id,
      nguoi_danh_gia_id: nguoiDung.id,
      nguoi_duoc_danh_gia_id: nguoiNhanDanhGia,
      so_sao: soSao,
      nhan_xet: nhanXet,
    });


    await ghiNhatKy(nguoiDung.id, 'DANH_GIA', 'danh_gia', id);


    return khoBanGhi.layTheoId('danh_gia', id);
  });
}


async function docThongBao(nguoiDung: NguoiDungDangNhap, id = undefined) {
  if (id) {
    const banGhi = batBuocTonTai(await khoBanGhi.layTheoId('thong_bao', kiemTra.id(id)));


    baoDam(cungId(banGhi.nguoi_dung_id, nguoiDung.id), 403, 'Thông báo không thuộc tài khoản');
  }
  await khoDuLieu.danhDauDaDoc(nguoiDung.id, id);


  return khoDuLieu.demChuaDoc(nguoiDung.id);
}


async function taoViPham(quanTri: NguoiDungDangNhap, dauVao) {
  kiemTra.kiemTraNoiDung(dauVao, [
    'nguoi_dung_id',
    'phien_dau_gia_id',
    'don_hang_id',
    'loai_vi_pham',
    'mo_ta',
    'diem_vi_pham',
  ]);


  const duLieu = {
    nguoi_dung_id: kiemTra.id(dauVao.nguoi_dung_id),
    phien_dau_gia_id: dauVao.phien_dau_gia_id ? kiemTra.id(dauVao.phien_dau_gia_id) : null,
    don_hang_id: dauVao.don_hang_id ? kiemTra.id(dauVao.don_hang_id) : null,
    loai_vi_pham: kiemTra.giaTriLuaChon(
      dauVao.loai_vi_pham,
      ['KHONG_THANH_TOAN', 'GIAO_HANG_MUON', 'TU_DAU_GIA', 'GIAN_LAN', 'LAM_DUNG', 'KHAC'],
      'Loại vi phạm',
    ),
    mo_ta: kiemTra.chuoi(dauVao.mo_ta, 'Mô tả', 1000),
    diem_vi_pham: kiemTra.soNguyen(dauVao.diem_vi_pham ?? 1, 'Điểm', 1, 100),
    nguoi_tao_id: quanTri.id,
  };


  return coSoDuLieu.giaoDich(async () => {
    batBuocTonTai(await cacNguoiDung.layTheoId(duLieu.nguoi_dung_id));


    if (duLieu.phien_dau_gia_id)
      {
batBuocTonTai(await cacPhienDauGia.layTheoId(duLieu.phien_dau_gia_id));
}
    if (duLieu.don_hang_id) {
      const donHang = batBuocTonTai(await khoBanGhi.layTheoId('don_hang', duLieu.don_hang_id));


      baoDam(
        !duLieu.phien_dau_gia_id || cungId(duLieu.phien_dau_gia_id, donHang.phien_dau_gia_id),
        400,
        'Đơn không thuộc phiên đã chọn',
      );
    }


    const id = await khoBanGhi.them('vi_pham', duLieu);


    await ghiNhatKy(quanTri.id, 'TAO_VI_PHAM', 'vi_pham', id);


    return khoBanGhi.layTheoId('vi_pham', id);
  });
}


async function duyetViPham(quanTri: NguoiDungDangNhap, id, duLieuNhap: unknown) {
  const dauVao = kiemTra.docSchema(duyetViPhamSchema, duLieuNhap);
  const trangThai = kiemTra.giaTriLuaChon(
    dauVao.trang_thai,
    ['DA_XAC_NHAN', 'DA_HUY'],
    'Trạng thái',
  );


  return coSoDuLieu.giaoDich(async () => {
    const banDau = batBuocTonTai(await khoBanGhi.layTheoId('vi_pham', kiemTra.id(id)));


    await cacNguoiDung.layTheoId(banDau.nguoi_dung_id, true);


    const banGhi = batBuocTonTai(await khoBanGhi.layTheoId('vi_pham', id, true));


    baoDam(banGhi.hinh_thuc_xu_ly === 'CHUA_XU_LY', 409, 'Vi phạm đã được xử lý');


    const hinhThuc =
      trangThai === 'DA_HUY'
        ? 'KHONG_VI_PHAM'
        : kiemTra.giaTriLuaChon(
            dauVao.hinh_thuc_xu_ly ?? 'CANH_CAO',
            ['CANH_CAO', 'TAM_NGUNG', 'KHOA_TAI_KHOAN'],
            'Hình thức xử lý',
          );
    const lyDo = kiemTra.chuoi(dauVao.ly_do_xu_ly ?? banGhi.mo_ta, 'Lý do xử lý', 1000);


    if (['TAM_NGUNG', 'KHOA_TAI_KHOAN'].includes(hinhThuc))
      {
await require('./nguoi-dung').doiTrangThaiTaiKhoan(quanTri, banGhi.nguoi_dung_id, {
        trang_thai_tai_khoan: hinhThuc === 'TAM_NGUNG' ? 'TAM_NGUNG' : 'BI_KHOA',
        ly_do: lyDo.slice(0, 500),
      });
}


    await khoBanGhi.capNhat('vi_pham', id, {
      hinh_thuc_xu_ly: hinhThuc,
      ly_do_xu_ly: lyDo,
      nguoi_xu_ly_id: quanTri.id,
      ngay_xu_ly: await coSoDuLieu.thoiGianHienTai(),
      trang_thai: trangThai,
      ngay_xac_nhan: trangThai === 'DA_XAC_NHAN' ? await coSoDuLieu.thoiGianHienTai() : null,
    });


    await ghiNhatKy(quanTri.id, 'DUYET_VI_PHAM', 'vi_pham', id, { trang_thai: trangThai });
    await taoThongBao(
      banGhi.nguoi_dung_id,
      'XU_LY_VI_PHAM',
      'Vi phạm đã được xử lý',
      trangThai === 'DA_XAC_NHAN' ? 'Vi phạm đã được quản trị xác nhận.' : 'Vi phạm đã được hủy.',
      '/profile/violations',
    );


    return {
      vi_pham: await khoBanGhi.layTheoId('vi_pham', id),
      hinh_thuc_xu_ly: hinhThuc,
    };
  });
}


export {
 danhGiaDonHang, docThongBao, taoViPham, duyetViPham 
};
