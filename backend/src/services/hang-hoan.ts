import type { NguoiDungDangNhap } from '../types/nghiep-vu';
import { randomUUID } from 'node:crypto';
import coSoDuLieu = require('../repositories/ket-noi');
import khoBanGhi = require('../repositories/ban-ghi');
import khoDon = require('../repositories/don-hang');
import khoPhien = require('../repositories/dau-gia');
import khoKiemDinh = require('../repositories/kiem-dinh');
import { coPhienMoiHon } from '../repositories/nghia-vu-san-pham';
import { xuLyHangSchema } from '../validations/hang-hoan.schema';
import { docSchema, id as kiemTraId, tienVietNam } from '../validations/du-lieu-dau-vao';
import { docJSON } from '../utils/du-lieu-json';
import { baoDam, batBuocTonTai, cungId } from '../utils/loi';
import { ghiNhatKy, taoThongBao } from './nhat-ky-thong-bao';
import { donViTienNho } from '../utils/tien';

export const docXuLyHang = (don) => docJSON(don.xu_ly_hang, null);

function cacThaoTacHang(nguoiDung: NguoiDungDangNhap, don): string[] {
  const hoSo = docXuLyHang(don);
  const trangThai = hoSo?.trang_thai;
  const quanTri = nguoiDung.vai_tro === 'QUAN_TRI';
  const laNguoiBan = cungId(nguoiDung.id, don.nguoi_ban_id);
  const laNguoiMua = cungId(nguoiDung.id, don.nguoi_mua_id);

  if (don.trang_thai === 'HOAN_THANH') {
    return [];
  }
  if (trangThai === 'DA_GUI_LAI_NGUOI_MUA') {
    return quanTri || laNguoiMua ? ['XAC_NHAN_GIAO_LAI'] : [];
  }

  if (quanTri) {
    if (['DA_DUNG_THU_HOI', 'DA_GIAO_LAI_NGUOI_MUA'].includes(trangThai)) {
      return ['KHOI_TAO'];
    }
    if (!hoSo) {
      return don.trang_thai === 'DANG_TRANH_CHAP' ||
        (don.trang_thai === 'DA_HUY' &&
          ['KHONG_THANH_TOAN', 'HOAN_TIEN_TRANH_CHAP'].includes(don.ly_do_huy))
        ? ['KHOI_TAO']
        : [];
    }
    if (trangThai === 'CHO_THU_HOI') {
      return ['GUI_HOAN', 'THAT_LAC', 'DUNG_THU_HOI'];
    }
    if (trangThai === 'DANG_HOAN_VE') {
      return ['NHAN_LAI', 'THAT_LAC'];
    }
    if (trangThai === 'CHO_KIEM_KE') {
      return ['KIEM_KE'];
    }
    if (trangThai === 'KHONG_KHOP') {
      return ['KIEM_KE'];
    }
    if (['DA_KIEM_KE', 'CAN_XU_LY'].includes(trangThai)) {
      if (don.trang_thai !== 'DA_HUY') {
        return trangThai === 'DA_KIEM_KE' ? ['GUI_LAI_NGUOI_MUA'] : ['KIEM_KE'];
      }

      return trangThai === 'DA_KIEM_KE' ? ['CHO_PHEP_BAN_LAI', 'TRA_NGUOI_BAN'] : ['TRA_NGUOI_BAN'];
    }

    return [];
  }
  if (
    trangThai === 'CHO_THU_HOI' &&
    ((don.ngay_gui_hang && laNguoiMua) || (!don.ngay_gui_hang && laNguoiBan))
  ) {
    return ['GUI_HOAN'];
  }
  if (laNguoiBan && trangThai === 'DANG_TRA_NGUOI_BAN') {
    return ['XAC_NHAN_NHAN_LAI'];
  }
  if (laNguoiBan && trangThai === 'DA_TRA_NGUOI_BAN') {
    return hoSo.san_pham_dang_lai_id ? [] : ['DANG_KY_LAI'];
  }

  return [];
}

export function cacThaoTac(nguoiDung: NguoiDungDangNhap, don): string[] {
  const hang = docXuLyHang(don);
  const cacNut = cacThaoTacHang(nguoiDung, don);

  if (nguoiDung.vai_tro === 'QUAN_TRI' && hang) {
    if (!hang.trach_nhiem) {
      cacNut.push('KET_LUAN_TRACH_NHIEM');
    } else if (
      !hang.doi_soat_chi_phi &&
      (donViTienNho(hang.trach_nhiem.phi_hoan) > 0n ||
        donViTienNho(hang.trach_nhiem.tien_boi_thuong) > 0n)
    ) {
      cacNut.push('DOI_SOAT_CHI_PHI');
    }
  }

  return cacNut;
}

function ketLuanTrachNhiem(dauVao) {
  const phi = tienVietNam(dauVao.phi_hoan, 'Phí hoàn');
  const boiThuong = tienVietNam(dauVao.tien_boi_thuong, 'Tiền bồi thường ngoài đơn');

  baoDam(
    (donViTienNho(phi) === 0n) === (dauVao.ben_chiu_phi === 'KHONG_PHAT_SINH'),
    400,
    'Phí bằng 0 phải chọn Không phát sinh; có phí phải ghi bên chịu phí',
  );
  baoDam(
    (donViTienNho(boiThuong) === 0n) ===
      (dauVao.ben_boi_thuong === 'KHONG_PHAT_SINH' &&
        dauVao.nguoi_nhan_boi_thuong === 'KHONG_PHAT_SINH'),
    400,
    'Bồi thường bằng 0 chọn Không phát sinh; có tiền phải ghi đủ bên trả và bên nhận',
  );

  if (donViTienNho(boiThuong) > 0n) {
    baoDam(
      dauVao.ben_boi_thuong !== 'KHONG_PHAT_SINH' &&
        dauVao.nguoi_nhan_boi_thuong !== 'KHONG_PHAT_SINH' &&
        dauVao.ben_boi_thuong !== dauVao.nguoi_nhan_boi_thuong,
      400,
      'Bên trả và nhận bồi thường phải khác nhau',
    );
  }

  return {
    ...dauVao,
    phi_hoan: phi,
    tien_boi_thuong: boiThuong,
  };
}

export function kiemTraHoanTien(don) {
  const hoSo = docXuLyHang(don);

  baoDam(
    hoSo &&
      [
        'DA_KIEM_KE',
        'CAN_XU_LY',
        'DU_DIEU_KIEN_BAN_LAI',
        'THAT_LAC',
        'DANG_TRA_NGUOI_BAN',
        'DA_TRA_NGUOI_BAN',
      ].includes(hoSo.trang_thai),
    409,
    'Cần thu hồi và kiểm kê hàng trước khi hoàn tiền; trường hợp thất lạc phải ghi nhận căn cứ',
  );
}

async function taoLanNhanLai(don, phien, dauVao, hienTai, nguoiDungId) {
  const sanPham = batBuocTonTai(await khoBanGhi.layTheoId('san_pham', phien.san_pham_id, true));
  const cu = await khoKiemDinh.moiNhat(sanPham.id, true);

  const id = await khoBanGhi.them('kiem_dinh_san_pham', {
    ma_kiem_dinh: `KD-${randomUUID()}`,
    san_pham_id: sanPham.id,
    lan_kiem_dinh: Number(cu?.lan_kiem_dinh || 0) + 1,
    trang_thai: 'DA_NHAN_TAI_TRUNG_TAM',
    ngay_nhan_trung_tam: hienTai,
    tinh_trang_khi_nhan: dauVao.ghi_chu,
    serial_khi_nhan: dauVao.serial,
    so_kien: dauVao.so_kien,
    ghi_chu_tiep_nhan: `Hàng hoàn từ đơn #${don.id}; giữ nguyên báo cáo của lần giao trước.`,
    nguoi_cap_nhat_id: nguoiDungId,
  });
  await khoBanGhi.capNhat('san_pham', sanPham.id, {
    trang_thai_duyet: 'CHO_XU_LY',
    bat_buoc_kiem_dinh: 1,
    ngay_chup_chinh_sach_kiem_dinh: sanPham.ngay_chup_chinh_sach_kiem_dinh || hienTai,
  });

  return id;
}

async function dangKyLai(nguoiDung, don, phien, hoSo) {
  if (hoSo.san_pham_dang_lai_id) {
    return;
  }

  const cu = batBuocTonTai(await khoBanGhi.layTheoId('san_pham', phien.san_pham_id, true));

  const id = await khoBanGhi.them('san_pham', {
    nguoi_ban_id: don.nguoi_ban_id,
    san_pham_goc_id: cu.san_pham_goc_id || cu.id,
    danh_muc_id: cu.danh_muc_id,
    tieu_de: cu.tieu_de,
    duong_dan: `san-pham-${randomUUID()}`,
    mo_ta: cu.mo_ta,
    tinh_trang_san_pham: cu.tinh_trang_san_pham,
    thuong_hieu: cu.thuong_hieu,
    // Bản đăng lại vẫn là món cũ: không để việc đổi chính sách danh mục hạ yêu cầu kiểm định.
    bat_buoc_kiem_dinh: cu.bat_buoc_kiem_dinh,
    ngay_chup_chinh_sach_kiem_dinh: cu.ngay_chup_chinh_sach_kiem_dinh,
  });

  const sanPham = require('../repositories/danh-muc-san-pham');

  await sanPham.thayGiaTriThuocTinh(id, await sanPham.cacGiaTri(cu.id));

  const anh = await sanPham.danhSachAnh(cu.id);

  for (const tep of anh) {
    await khoBanGhi.them('tep_dinh_kem', {
      loai_tep: 'ANH_SAN_PHAM',
      san_pham_id: id,
      nguoi_tai_len_id: nguoiDung.id,
      duong_dan_tep: tep.duong_dan_anh,
      la_anh_chinh: tep.la_anh_chinh,
      thu_tu: tep.thu_tu,
      loai_noi_dung: 'HINH_ANH',
    });
  }
  hoSo.san_pham_dang_lai_id = id;
}

async function ghiKiemKe(don, phien, hoSo, dauVao, hienTai) {
  const cu = don.kiem_dinh_san_pham_id
    ? await khoBanGhi.layTheoId('kiem_dinh_san_pham', don.kiem_dinh_san_pham_id)
    : null;
  const khopSerial = !cu?.serial_khi_nhan || cu.serial_khi_nhan.trim() === dauVao.serial.trim();

  baoDam(
    khopSerial || dauVao.ket_qua === 'KHONG_KHOP',
    409,
    'Serial không khớp hồ sơ giao trước; phải ghi nhận không khớp và tiếp tục xác minh',
  );

  const tranhChap = (await khoDon.cacTranhChap(don.id))[0];

  if (
    dauVao.ket_qua === 'NGUYEN_VEN' &&
    tranhChap &&
    !['CHUA_NHAN_HANG', 'KHAC'].includes(tranhChap.ly_do)
  ) {
    baoDam(hoSo.kiem_dinh_moi_id, 409, 'Tranh chấp chất lượng cần báo cáo kiểm định lại');

    await require('./kiem-dinh').kiemTraDuocDauGia(
      await khoBanGhi.layTheoId('san_pham', phien.san_pham_id),
    );
  }

  hoSo.kiem_ke = { ...dauVao, ngay_kiem_ke: hienTai };
  hoSo.trang_thai = dauVao.ket_qua === 'NGUYEN_VEN' ? 'DA_KIEM_KE' : dauVao.ket_qua;
}

async function guiLaiNguoiMua(phien, hoSo, dauVao, hienTai) {
  const sanPham = batBuocTonTai(await khoBanGhi.layTheoId('san_pham', phien.san_pham_id, true));
  const hoSoKiemDinh = await require('./kiem-dinh').kiemTraDuocDauGia(sanPham);

  baoDam(sanPham.trang_thai_duyet === 'DA_DUYET', 409, 'Cần duyệt lại sản phẩm sau kiểm định');

  if (hoSoKiemDinh) {
    await khoBanGhi.capNhat('kiem_dinh_san_pham', hoSoKiemDinh.id, {
      ngay_roi_trung_tam: hienTai,
    });
  }
  hoSo.gui_lai_nguoi_mua = { ...dauVao, ngay_gui: hienTai };
  hoSo.trang_thai = 'DA_GUI_LAI_NGUOI_MUA';
}

async function duyetBanLai(don, phien, hoSo) {
  baoDam(!(await khoDon.tranhChapDangMo(don.id)), 409, 'Tranh chấp chưa kết thúc');

  const sanPham = batBuocTonTai(await khoBanGhi.layTheoId('san_pham', phien.san_pham_id, true));

  await require('./kiem-dinh').kiemTraDuocDauGia(sanPham);

  baoDam(
    sanPham.trang_thai_duyet === 'DA_DUYET',
    409,
    'Cần hoàn tất kiểm định và duyệt lại sản phẩm trước khi cho bán tiếp',
  );

  hoSo.trang_thai = 'DU_DIEU_KIEN_BAN_LAI';
}

async function traNguoiBan(don, phien, hoSo, dauVao, hienTai) {
  baoDam(
    !(await khoDon.tranhChapDangMo(don.id)),
    409,
    'Cần giải quyết tranh chấp trước khi trả hàng',
  );

  hoSo.van_chuyen_tra = { ...dauVao, ngay_gui: hienTai };
  hoSo.trang_thai = 'DANG_TRA_NGUOI_BAN';

  await khoBanGhi.capNhat('san_pham', phien.san_pham_id, { trang_thai_duyet: 'LUU_TRU' });

  const hoSoLuuGiuId = hoSo.kiem_dinh_moi_id || don.kiem_dinh_san_pham_id;

  if (hoSoLuuGiuId) {
    const luuGiu = batBuocTonTai(
      await khoBanGhi.layTheoId('kiem_dinh_san_pham', hoSoLuuGiuId, true),
    );

    baoDam(
      cungId(luuGiu.san_pham_id, phien.san_pham_id) && !luuGiu.ngay_roi_trung_tam,
      409,
      'Hồ sơ lưu giữ không khớp hoặc hàng đã rời trung tâm',
    );

    // Cập nhật bàn giao thực tế; không thay kết quả, báo cáo hoặc thông tin kiểm định đã gắn đơn.
    await khoBanGhi.capNhat('kiem_dinh_san_pham', hoSoLuuGiuId, {
      trang_thai: 'DA_TRA_NGUOI_BAN',
      ngay_tra_nguoi_ban: hienTai,
      ngay_roi_trung_tam: hienTai,
      ly_do_tra: dauVao.ghi_chu,
    });

    hoSo.ho_so_luu_giu_id = hoSoLuuGiuId;
  }
}

export async function xuLy(nguoiDung: NguoiDungDangNhap, donId, duLieuNhap: unknown) {
  const duLieu = docSchema(xuLyHangSchema, duLieuNhap);
  const dauVao = duLieu.thao_tac === 'KET_LUAN_TRACH_NHIEM' ? ketLuanTrachNhiem(duLieu) : duLieu;

  return coSoDuLieu.giaoDich(async () => {
    const don = batBuocTonTai(await khoDon.khoaDuLieu(kiemTraId(donId)));
    const phien = batBuocTonTai(await khoPhien.layTheoId(don.phien_dau_gia_id));
    let hoSo = docXuLyHang(don);

    if (
      dauVao.thao_tac === 'DANG_KY_LAI' &&
      hoSo?.san_pham_dang_lai_id &&
      cungId(nguoiDung.id, don.nguoi_ban_id)
    ) {
      return require('./don-hang').chiTiet(nguoiDung, don.id);
    }

    const xuLyChiPhi = ['KET_LUAN_TRACH_NHIEM', 'DOI_SOAT_CHI_PHI'].includes(dauVao.thao_tac);

    if (xuLyChiPhi) {
      baoDam(nguoiDung.vai_tro === 'QUAN_TRI', 403, 'Chỉ Admin được kết luận và đối soát chi phí');

      const daLuu =
        dauVao.thao_tac === 'KET_LUAN_TRACH_NHIEM' ? hoSo?.trach_nhiem : hoSo?.doi_soat_chi_phi;

      if (daLuu) {
        baoDam(
          Object.entries(dauVao).every(([k, v]) => daLuu[k] === v),
          409,
          'Biên bản đã chốt theo nội dung khác; không ghi đè lịch sử đối soát',
        );

        return require('./don-hang').chiTiet(nguoiDung, don.id);
      }
    }

    if (
      hoSo &&
      !['DA_DUNG_THU_HOI', 'DA_GIAO_LAI_NGUOI_MUA'].includes(hoSo.trang_thai) &&
      dauVao.thao_tac === 'KHOI_TAO' &&
      nguoiDung.vai_tro === 'QUAN_TRI'
    ) {
      return require('./don-hang').chiTiet(nguoiDung, donId);
    }

    baoDam(
      cacThaoTac(nguoiDung, don).includes(dauVao.thao_tac),
      409,
      'Không có quyền hoặc bước xử lý hàng không còn phù hợp; hãy làm mới đơn',
    );
    baoDam(
      xuLyChiPhi || !(await coPhienMoiHon(phien.san_pham_id, phien.id)),
      409,
      'Món hàng đã được đăng sang phiên mới, không xử lý lại từ đơn cũ',
    );

    const hienTai = await coSoDuLieu.thoiGianHienTai();

    if (dauVao.thao_tac === 'KET_LUAN_TRACH_NHIEM') {
      hoSo.trach_nhiem = {
        ...dauVao,
        ngay_ket_luan: hienTai,
        nguoi_xu_ly_id: nguoiDung.id,
      };
    } else if (dauVao.thao_tac === 'DOI_SOAT_CHI_PHI') {
      hoSo.doi_soat_chi_phi = {
        ...dauVao,
        ngay_doi_soat: hienTai,
        nguoi_xu_ly_id: nguoiDung.id,
      };
    } else if (dauVao.thao_tac === 'KHOI_TAO') {
      baoDam(
        !(await khoDon.deNghiDangCho(phien.id)),
        409,
        'Cần kết thúc đề nghị mua tiếp đang chờ trước khi thu hồi hàng',
      );

      const dangTaiTrungTam =
        don.nguon_gui_hang === 'TRUNG_TAM' && !don.ngay_gui_hang && !hoSo?.gui_lai_nguoi_mua;

      hoSo = {
        trang_thai: dangTaiTrungTam ? 'CHO_KIEM_KE' : 'CHO_THU_HOI',
        lich_su: hoSo?.lich_su || [],
        trach_nhiem: hoSo?.trach_nhiem,
        doi_soat_chi_phi: hoSo?.doi_soat_chi_phi,
        giao_hang_ban_dau: {
          don_vi_van_chuyen: don.don_vi_van_chuyen,
          ma_van_don: don.ma_van_don,
          ngay_gui_hang: don.ngay_gui_hang,
          ngay_giao_hang: don.ngay_giao_hang,
        },
      };
    } else if (dauVao.thao_tac === 'GUI_HOAN') {
      hoSo.van_chuyen_hoan = { ...dauVao, ngay_gui: hienTai };
      hoSo.trang_thai = 'DANG_HOAN_VE';
    } else if (dauVao.thao_tac === 'NHAN_LAI') {
      hoSo.tiep_nhan = { ...dauVao, ngay_nhan: hienTai };
      hoSo.kiem_dinh_moi_id = await taoLanNhanLai(don, phien, dauVao, hienTai, nguoiDung.id);
      hoSo.trang_thai = 'CHO_KIEM_KE';
    } else if (dauVao.thao_tac === 'KIEM_KE') {
      await ghiKiemKe(don, phien, hoSo, dauVao, hienTai);
    } else if (dauVao.thao_tac === 'THAT_LAC') {
      hoSo.trang_thai = 'THAT_LAC';
    } else if (dauVao.thao_tac === 'DUNG_THU_HOI') {
      hoSo.trang_thai = 'DA_DUNG_THU_HOI';
    } else if (dauVao.thao_tac === 'GUI_LAI_NGUOI_MUA') {
      await guiLaiNguoiMua(phien, hoSo, dauVao, hienTai);
    } else if (dauVao.thao_tac === 'XAC_NHAN_GIAO_LAI') {
      hoSo.trang_thai = 'DA_GIAO_LAI_NGUOI_MUA';
      hoSo.ngay_giao_lai = hienTai;
    } else if (dauVao.thao_tac === 'CHO_PHEP_BAN_LAI') {
      await duyetBanLai(don, phien, hoSo);
    } else if (dauVao.thao_tac === 'TRA_NGUOI_BAN') {
      await traNguoiBan(don, phien, hoSo, dauVao, hienTai);
    } else if (dauVao.thao_tac === 'XAC_NHAN_NHAN_LAI') {
      hoSo.trang_thai = 'DA_TRA_NGUOI_BAN';
      hoSo.ngay_nguoi_ban_nhan = hienTai;
    } else if (dauVao.thao_tac === 'DANG_KY_LAI') {
      await require('./danh-muc-san-pham').kiemTraNguoiBan(nguoiDung);
      await dangKyLai(nguoiDung, don, phien, hoSo);
    }

    hoSo.lich_su.push({
      ...dauVao,
      nguoi_thuc_hien_id: nguoiDung.id,
      thoi_gian: hienTai,
    });

    await khoBanGhi.capNhat('don_hang', don.id, { xu_ly_hang: JSON.stringify(hoSo) });

    await ghiNhatKy(nguoiDung.id, `HANG_HOAN_${dauVao.thao_tac}`, 'don_hang', don.id);

    for (const id of [don.nguoi_mua_id, don.nguoi_ban_id]) {
      await taoThongBao(
        id,
        'CAP_NHAT_HANG_HOAN',
        'Cập nhật xử lý hàng hoàn',
        'Xem biên bản và bước xử lý tiếp theo trong đơn hàng.',
        `/orders/${don.id}`,
      );
    }

    return require('./don-hang').chiTiet(nguoiDung, don.id);
  });
}
