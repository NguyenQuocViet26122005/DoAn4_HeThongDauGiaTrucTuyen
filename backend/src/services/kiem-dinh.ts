import type { NguoiDungDangNhap } from '../types/nghiep-vu';
import { randomUUID } from 'node:crypto';
import coSoDuLieu = require('../repositories/ket-noi');
import khoBanGhi = require('../repositories/ban-ghi');
import khoKiemDinh = require('../repositories/kiem-dinh');
import kiemTra = require('../validations/du-lieu-dau-vao');
import {
  guiTrungTamSchema,
  tiepNhanSchema,
  ketQuaKiemDinhSchema,
  tepKiemDinhSchema,
  traNguoiBanSchema,
} from '../validations/kiem-dinh.schema';
import { baoDam, batBuocTonTai, cungId } from '../utils/loi';
import { chonTruong } from '../utils/du-lieu-cong-khai';
import { ghiNhatKy, taoThongBao } from './nhat-ky-thong-bao';
import { kiemTraTepSoHuu } from './tai-tep';
import thoiGian = require('../utils/thoi-gian');

function quanTri(nguoiDung: NguoiDungDangNhap) {
  baoDam(nguoiDung.vai_tro === 'QUAN_TRI', 403, 'Chỉ Admin được ghi nhận kiểm định');
}

function danhSach(nguoiDung: NguoiDungDangNhap, truyVan: Record<string, unknown>) {
  const cacTrangThai = [
    'CHO_GUI_TRUNG_TAM',
    'DANG_VAN_CHUYEN_DEN_TRUNG_TAM',
    'DA_NHAN_TAI_TRUNG_TAM',
    'DANG_KIEM_DINH',
    'CAN_BO_SUNG',
    'KIEM_DINH_KHONG_DAT',
    'DA_KIEM_DINH_DAT',
    'DANG_LUU_GIU',
    'DA_TRA_NGUOI_BAN',
  ];

  return khoKiemDinh.danhSach(nguoiDung, kiemTra.phanTrang(truyVan), {
    q: truyVan.q ? kiemTra.chuoi(truyVan.q, 'Tìm kiếm', 100) : undefined,
    trangThai: truyVan.trang_thai
      ? kiemTra.giaTriLuaChon(truyVan.trang_thai, cacTrangThai, 'Trạng thái')
      : undefined,
    sanPhamId: truyVan.san_pham_id ? kiemTra.id(truyVan.san_pham_id) : undefined,
  });
}

async function khoaHoSo(id) {
  const banDau = batBuocTonTai(await khoBanGhi.layTheoId('kiem_dinh_san_pham', kiemTra.id(id)));
  const sanPham = batBuocTonTai(await khoBanGhi.layTheoId('san_pham', banDau.san_pham_id, true));
  const hoSo = batBuocTonTai(await khoBanGhi.layTheoId('kiem_dinh_san_pham', id, true));

  baoDam(
    !(await khoKiemDinh.coGiaoDich(sanPham.id)),
    409,
    'Sản phẩm đang có phiên hoặc nghĩa vụ bán; không sửa hồ sơ kiểm định',
  );

  return { hoSo, sanPham };
}

async function tao(quanTriVien: NguoiDungDangNhap, sanPhamId) {
  quanTri(quanTriVien);

  return coSoDuLieu.giaoDich(async () => {
    const sanPham = batBuocTonTai(
      await khoBanGhi.layTheoId('san_pham', kiemTra.id(sanPhamId), true),
    );

    baoDam(
      sanPham.trang_thai_duyet === 'CHO_XU_LY' && sanPham.bat_buoc_kiem_dinh,
      409,
      'Sản phẩm phải đang chờ duyệt và yêu cầu kiểm định',
    );
    baoDam(!(await khoKiemDinh.coGiaoDich(sanPham.id)), 409, 'Sản phẩm đã có giao dịch');

    const cu = await khoKiemDinh.moiNhat(sanPham.id, true);

    baoDam(
      !cu || cu.trang_thai === 'DA_TRA_NGUOI_BAN',
      409,
      'Hồ sơ kiểm định trước chưa kết thúc việc trả hàng',
    );

    const id = await khoBanGhi.them('kiem_dinh_san_pham', {
      ma_kiem_dinh: `KD-${randomUUID()}`,
      san_pham_id: sanPham.id,
      lan_kiem_dinh: Number(cu?.lan_kiem_dinh ?? 0) + 1,
      nguoi_cap_nhat_id: quanTriVien.id,
    });

    await ghiNhatKy(quanTriVien.id, 'TAO_HO_SO_KIEM_DINH', 'kiem_dinh_san_pham', id);
    await taoThongBao(
      sanPham.nguoi_ban_id,
      'CAN_GUI_KIEM_DINH',
      'Gửi hàng đến trung tâm',
      'Hồ sơ đã được kiểm tra sơ bộ; hãy gửi đúng sản phẩm để kiểm định.',
      `/inspections/${id}`,
    );

    return khoBanGhi.layTheoId('kiem_dinh_san_pham', id);
  });
}

async function guiTrungTam(nguoiDung: NguoiDungDangNhap, id, duLieuNhap: unknown) {
  const dauVao = kiemTra.docSchema(guiTrungTamSchema, duLieuNhap);

  return coSoDuLieu.giaoDich(async () => {
    const { hoSo, sanPham } = await khoaHoSo(id);

    baoDam(
      cungId(sanPham.nguoi_ban_id, nguoiDung.id),
      403,
      'Chỉ người bán của sản phẩm được khai báo gửi',
    );
    baoDam(hoSo.trang_thai === 'CHO_GUI_TRUNG_TAM', 409, 'Hồ sơ không ở bước chờ gửi');

    await khoBanGhi.capNhat('kiem_dinh_san_pham', id, {
      trang_thai: 'DANG_VAN_CHUYEN_DEN_TRUNG_TAM',
      ngay_gui_trung_tam: await coSoDuLieu.thoiGianHienTai(),
      don_vi_gui_trung_tam: dauVao.don_vi_van_chuyen,
      ma_van_don_den_trung_tam: dauVao.ma_van_don,
      nguoi_cap_nhat_id: nguoiDung.id,
    });

    await ghiNhatKy(nguoiDung.id, 'GUI_HANG_KIEM_DINH', 'kiem_dinh_san_pham', id);

    return khoBanGhi.layTheoId('kiem_dinh_san_pham', id);
  });
}

async function nhanHang(nguoiDung: NguoiDungDangNhap, id, duLieuNhap: unknown) {
  quanTri(nguoiDung);

  const dauVao = kiemTra.docSchema(tiepNhanSchema, duLieuNhap);

  return coSoDuLieu.giaoDich(async () => {
    const { hoSo } = await khoaHoSo(id);

    baoDam(
      ['CHO_GUI_TRUNG_TAM', 'DANG_VAN_CHUYEN_DEN_TRUNG_TAM'].includes(hoSo.trang_thai),
      409,
      'Hồ sơ đã được tiếp nhận',
    );

    await khoBanGhi.capNhat('kiem_dinh_san_pham', id, {
      trang_thai: 'DA_NHAN_TAI_TRUNG_TAM',
      ngay_nhan_trung_tam: await coSoDuLieu.thoiGianHienTai(),
      tinh_trang_khi_nhan: dauVao.tinh_trang_khi_nhan,
      serial_khi_nhan: dauVao.serial_khi_nhan ?? null,
      so_kien: dauVao.so_kien,
      ghi_chu_tiep_nhan: dauVao.ghi_chu ?? null,
      nguoi_cap_nhat_id: nguoiDung.id,
    });

    await ghiNhatKy(nguoiDung.id, 'XAC_NHAN_TRUNG_TAM_NHAN_HANG', 'kiem_dinh_san_pham', id);

    return khoBanGhi.layTheoId('kiem_dinh_san_pham', id);
  });
}

async function batDau(nguoiDung: NguoiDungDangNhap, id) {
  quanTri(nguoiDung);

  return coSoDuLieu.giaoDich(async () => {
    const { hoSo } = await khoaHoSo(id);

    baoDam(
      ['DA_NHAN_TAI_TRUNG_TAM', 'CAN_BO_SUNG'].includes(hoSo.trang_thai),
      409,
      'Chưa đủ điều kiện bắt đầu kiểm định',
    );

    await khoBanGhi.capNhat('kiem_dinh_san_pham', id, {
      trang_thai: 'DANG_KIEM_DINH',
      nguoi_cap_nhat_id: nguoiDung.id,
    });

    await ghiNhatKy(nguoiDung.id, 'BAT_DAU_KIEM_DINH', 'kiem_dinh_san_pham', id);

    return khoBanGhi.layTheoId('kiem_dinh_san_pham', id);
  });
}

async function themTep(nguoiDung: NguoiDungDangNhap, id, duLieuNhap: unknown) {
  quanTri(nguoiDung);

  const dauVao = kiemTra.docSchema(tepKiemDinhSchema, duLieuNhap);
  const tep = await kiemTraTepSoHuu(dauVao.duong_dan_tep, 'inspection', nguoiDung.id);

  return coSoDuLieu.giaoDich(async () => {
    const { hoSo } = await khoaHoSo(id);

    baoDam(
      hoSo.ngay_nhan_trung_tam && hoSo.trang_thai !== 'DA_TRA_NGUOI_BAN',
      409,
      'Chỉ thêm hồ sơ khi trung tâm đã nhận hàng',
    );

    // Gắn lại sau mất phản hồi không tạo hai bản ghi cho cùng một tệp.
    const tepDaGan = (await khoKiemDinh.tepDinhKem(id)).find(
      (muc) => muc.duong_dan_tep === tep.url,
    );

    if (tepDaGan) {
      baoDam(tepDaGan.loai_tep === dauVao.loai_tep, 409, 'Tệp đã được gắn với loại hồ sơ khác');

      return tepDaGan;
    }

    const tepId = await khoBanGhi.them('tep_dinh_kem', {
      loai_tep: dauVao.loai_tep,
      kiem_dinh_san_pham_id: id,
      nguoi_tai_len_id: nguoiDung.id,
      duong_dan_tep: tep.url,
      loai_noi_dung: tep.url.endsWith('.pdf') ? 'TAI_LIEU' : 'HINH_ANH',
      mo_ta: dauVao.mo_ta ?? null,
    });

    await ghiNhatKy(nguoiDung.id, 'TAI_BAO_CAO_KIEM_DINH', 'kiem_dinh_san_pham', id, {
      tep_id: tepId,
      loai_tep: dauVao.loai_tep,
    });

    return khoBanGhi.layTheoId('tep_dinh_kem', tepId);
  });
}

async function ghiKetQua(nguoiDung: NguoiDungDangNhap, id, duLieuNhap: unknown) {
  quanTri(nguoiDung);

  const dauVao = kiemTra.docSchema(ketQuaKiemDinhSchema, duLieuNhap);
  const ngayKiemDinh = thoiGian.kiemTraNgayNhap(dauVao.ngay_kiem_dinh, 'Ngày kiểm định');

  return coSoDuLieu.giaoDich(async () => {
    const { hoSo, sanPham } = await khoaHoSo(id);

    baoDam(
      ['DANG_KIEM_DINH', 'CAN_BO_SUNG', 'DANG_LUU_GIU', 'KIEM_DINH_KHONG_DAT'].includes(
        hoSo.trang_thai,
      ),
      409,
      'Hồ sơ chưa ở bước ghi nhận kết quả',
    );
    baoDam(
      thoiGian.doiThanhNgay(ngayKiemDinh) >= thoiGian.doiThanhNgay(hoSo.ngay_nhan_trung_tam) &&
        thoiGian.doiThanhNgay(ngayKiemDinh) <=
          thoiGian.doiThanhNgay(await coSoDuLieu.thoiGianHienTai()),
      400,
      'Ngày kiểm định phải từ lúc tiếp nhận đến hiện tại',
    );
    baoDam(
      (await khoKiemDinh.tepDinhKem(id)).some((t) => t.loai_tep === 'BAO_CAO_KIEM_DINH'),
      409,
      'Phải có báo cáo do chuyên gia/trung tâm cung cấp',
    );

    await khoBanGhi.capNhat('kiem_dinh_san_pham', id, {
      ...dauVao,
      ngay_kiem_dinh: ngayKiemDinh,
      ma_chung_nhan: dauVao.ma_chung_nhan ?? null,
      trang_thai:
        dauVao.ket_qua === 'DAT'
          ? 'DANG_LUU_GIU'
          : dauVao.ket_qua === 'KHONG_DAT'
            ? 'KIEM_DINH_KHONG_DAT'
            : 'CAN_BO_SUNG',
      nguoi_cap_nhat_id: nguoiDung.id,
    });

    // Đổi kết quả trước khi mở phiên cũng phải xét duyệt lại nội dung sản phẩm.
    if (sanPham.trang_thai_duyet === 'DA_DUYET') {
      await khoBanGhi.capNhat('san_pham', sanPham.id, { trang_thai_duyet: 'CHO_XU_LY' });
    }

    await ghiNhatKy(nguoiDung.id, 'CAP_NHAT_KET_QUA_KIEM_DINH', 'kiem_dinh_san_pham', id, {
      ket_qua_cu: hoSo.ket_qua,
      ket_qua_moi: dauVao.ket_qua,
      ten_chuyen_gia: dauVao.ten_chuyen_gia,
      don_vi_kiem_dinh: dauVao.don_vi_kiem_dinh,
      nhan_xet: dauVao.nhan_xet,
    });
    await taoThongBao(
      sanPham.nguoi_ban_id,
      'KET_QUA_KIEM_DINH',
      'Đã ghi nhận kết quả kiểm định',
      dauVao.ket_qua === 'DAT'
        ? 'Trung tâm tiếp tục giữ hàng để chuẩn bị đấu giá.'
        : 'Xem hồ sơ kiểm định để biết bước tiếp theo.',
      `/inspections/${id}`,
    );

    return khoBanGhi.layTheoId('kiem_dinh_san_pham', id);
  });
}

async function traNguoiBan(nguoiDung: NguoiDungDangNhap, id, duLieuNhap: unknown) {
  quanTri(nguoiDung);

  const dauVao = kiemTra.docSchema(traNguoiBanSchema, duLieuNhap);

  return coSoDuLieu.giaoDich(async () => {
    const { hoSo } = await khoaHoSo(id);

    baoDam(
      ['KIEM_DINH_KHONG_DAT', 'CAN_BO_SUNG'].includes(hoSo.trang_thai),
      409,
      'Chỉ trả hàng không đạt hoặc không hoàn tất kiểm định; hàng đạt tiếp tục ở trung tâm',
    );

    await khoBanGhi.capNhat('kiem_dinh_san_pham', id, {
      trang_thai: 'DA_TRA_NGUOI_BAN',
      ngay_tra_nguoi_ban: await coSoDuLieu.thoiGianHienTai(),
      ly_do_tra: dauVao.ly_do,
      nguoi_cap_nhat_id: nguoiDung.id,
    });

    await ghiNhatKy(nguoiDung.id, 'TRA_HANG_KIEM_DINH', 'kiem_dinh_san_pham', id, {
      ly_do: dauVao.ly_do,
    });

    return khoBanGhi.layTheoId('kiem_dinh_san_pham', id);
  });
}

async function kiemTraDuocDauGia(sanPham) {
  if (!sanPham.bat_buoc_kiem_dinh) {
    return null;
  }

  const hoSo = await khoKiemDinh.moiNhat(sanPham.id, true);

  baoDam(
    hoSo?.ket_qua === 'DAT' && hoSo.trang_thai === 'DANG_LUU_GIU' && !hoSo.ngay_roi_trung_tam,
    409,
    'Sản phẩm phải kiểm định đạt và đang được trung tâm giữ',
  );
  baoDam(
    (await khoKiemDinh.tepDinhKem(hoSo.id)).some((t) => t.loai_tep === 'BAO_CAO_KIEM_DINH'),
    409,
    'Thiếu báo cáo kiểm định',
  );

  return hoSo;
}

async function chiTiet(nguoiDung: NguoiDungDangNhap, id) {
  const hoSo = batBuocTonTai(await khoBanGhi.layTheoId('kiem_dinh_san_pham', kiemTra.id(id)));
  const sanPham = batBuocTonTai(await khoBanGhi.layTheoId('san_pham', hoSo.san_pham_id));

  baoDam(
    nguoiDung.vai_tro === 'QUAN_TRI' ||
      cungId(sanPham.nguoi_ban_id, nguoiDung.id) ||
      (await khoKiemDinh.quyenNguoiMua(id, nguoiDung.id)),
    403,
    'Không có quyền xem hồ sơ kiểm định',
  );

  const coGiaoDich = await khoKiemDinh.coGiaoDich(sanPham.id);
  const lyDo = coGiaoDich
    ? 'Sản phẩm đang có phiên hoặc nghĩa vụ bán; hồ sơ chỉ được xem.'
    : hoSo.trang_thai === 'DA_TRA_NGUOI_BAN'
      ? 'Hồ sơ đã trả hàng cho người bán.'
      : null;

  return {
    ...hoSo,
    tieu_de: sanPham.tieu_de,
    nguoi_ban_id: sanPham.nguoi_ban_id,
    co_the_cap_nhat:
      !lyDo && (nguoiDung.vai_tro === 'QUAN_TRI' || cungId(nguoiDung.id, sanPham.nguoi_ban_id)),
    ly_do_khong_the_cap_nhat: lyDo,
    tep_dinh_kem: await khoKiemDinh.tepDinhKem(id),
  };
}

async function congKhai(sanPhamId) {
  const sanPham = batBuocTonTai(await khoBanGhi.layTheoId('san_pham', kiemTra.id(sanPhamId)));

  baoDam(sanPham.trang_thai_duyet === 'DA_DUYET', 404, 'Không tìm thấy sản phẩm');

  const hoSo = await khoKiemDinh.moiNhat(sanPham.id);

  return hoSo
    ? chonTruong(hoSo, [
        'ma_kiem_dinh',
        'ket_qua',
        'ngay_kiem_dinh',
        'ten_chuyen_gia',
        'don_vi_kiem_dinh',
        'ma_chung_nhan',
      ])
    : null;
}

export {
  danhSach,
  tao,
  guiTrungTam,
  nhanHang,
  batDau,
  themTep,
  ghiKetQua,
  traNguoiBan,
  kiemTraDuocDauGia,
  chiTiet,
  congKhai,
};
