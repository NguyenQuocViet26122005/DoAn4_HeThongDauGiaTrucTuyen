import khoBanGhi = require('../repositories/ban-ghi');
import khoDon = require('../repositories/don-hang');
import khoKiemDinh = require('../repositories/kiem-dinh');
import { nghiaVuDangChan } from '../repositories/nghia-vu-san-pham';

type LyDoChan = { ly_do: string; don_hang_id?: string; phien_id?: string };

function lyDoTuDon(don, sanPham): LyDoChan {
  const nhan = `Đơn #${don.id}`;
  const taoLyDo = (ly_do: string) => ({ ly_do, don_hang_id: String(don.id) });

  if (don.trang_thai === 'HOAN_THANH') {
    return taoLyDo(`Sản phẩm đã bán thành công qua ${nhan.toLowerCase()}.`);
  }
  if (don.trang_thai !== 'DA_HUY') {
    return taoLyDo(`${nhan} của sản phẩm vẫn đang được xử lý.`);
  }
  if (!don.trang_thai_hang) {
    return taoLyDo(
      `${nhan} đã hủy nhưng hàng chưa được thu hồi về trung tâm. Admin cần bắt đầu xử lý hàng hoàn; bạn chưa cần thao tác.`,
    );
  }
  if (don.trang_thai_hang === 'DA_TRA_NGUOI_BAN') {
    return taoLyDo(
      sanPham.trang_thai_duyet === 'LUU_TRU'
        ? `Hàng của ${nhan.toLowerCase()} đã trả về bạn. Mở đơn và chọn tạo hồ sơ đăng ký bán lại.`
        : `Hàng của ${nhan.toLowerCase()} đã trả về bạn; hồ sơ này không còn được đăng bán.`,
    );
  }
  if (don.trang_thai_hang === 'DANG_TRA_NGUOI_BAN') {
    return taoLyDo(`Hàng của ${nhan.toLowerCase()} đang trả về bạn. Hãy xác nhận khi đã nhận.`);
  }
  if (don.trang_thai_hang === 'THAT_LAC') {
    return taoLyDo(`Hàng của ${nhan.toLowerCase()} đã ghi nhận thất lạc nên không thể bán lại.`);
  }

  return taoLyDo(
    `Hàng hoàn của ${nhan.toLowerCase()} đang được Admin thu hồi, kiểm kê hoặc xét cho bán lại.`,
  );
}

async function lyDoKiemDinh(sanPham): Promise<string | null> {
  if (!sanPham.bat_buoc_kiem_dinh) {
    return null;
  }

  const hoSo = await khoKiemDinh.moiNhat(sanPham.id);

  if (!hoSo) {
    return 'Sản phẩm cần có hồ sơ kiểm định trước khi tạo phiên.';
  }
  if (hoSo.ngay_roi_trung_tam) {
    return 'Hàng đã rời trung tâm; cần nhận lại và kiểm định lại trước khi tạo phiên.';
  }
  if (hoSo.ket_qua !== 'DAT' || hoSo.trang_thai !== 'DANG_LUU_GIU') {
    return 'Sản phẩm phải kiểm định đạt và đang được trung tâm giữ.';
  }
  if (!(await khoKiemDinh.tepDinhKem(hoSo.id)).some((t) => t.loai_tep === 'BAO_CAO_KIEM_DINH')) {
    return 'Hồ sơ kiểm định còn thiếu báo cáo.';
  }

  return null;
}

// Chỉ giải thích cho người bán; API tạo phiên vẫn kiểm tra lại trong transaction.
export async function lyDoKhongTaoPhien(sanPham): Promise<LyDoChan | null> {
  const chan = await nghiaVuDangChan(sanPham.id);

  if (chan.phien) {
    return { ly_do: `Sản phẩm đang có phiên #${chan.phien.id}.`, phien_id: String(chan.phien.id) };
  }
  if (chan.phienChuaCoDon) {
    return {
      ly_do: `Phiên #${chan.phienChuaCoDon.id} đã có người thắng nhưng chưa tạo được đơn.`,
      phien_id: String(chan.phienChuaCoDon.id),
    };
  }
  if (chan.don) {
    return lyDoTuDon(chan.don, sanPham);
  }
  if (chan.deNghi) {
    return { ly_do: 'Đang có Cơ hội mua tiếp chờ người nhận phản hồi.' };
  }

  const theoTrangThai = {
    BAN_NHAP: 'Sản phẩm còn là bản nháp; hãy hoàn thiện và gửi duyệt.',
    CHO_XU_LY: 'Sản phẩm đang chờ Admin xử lý.',
    TU_CHOI: 'Sản phẩm bị từ chối; hãy chỉnh sửa và gửi duyệt lại.',
    LUU_TRU: 'Sản phẩm đã lưu trữ.',
  }[sanPham.trang_thai_duyet];

  if (theoTrangThai) {
    return { ly_do: theoTrangThai };
  }

  const kiemDinh = await lyDoKiemDinh(sanPham);

  return kiemDinh ? { ly_do: kiemDinh } : null;
}

function buocTheoDon(don): string {
  const trungTam = don.nguon_gui_hang === 'TRUNG_TAM';
  const theoTrangThai = {
    CHO_THANH_TOAN: 'Đang chờ người mua thanh toán trong hạn.',
    DA_THANH_TOAN: trungTam ? 'Trung tâm sẽ gửi hàng cho người mua.' : 'Bạn cần gửi hàng.',
    CHO_GUI_HANG: trungTam ? 'Trung tâm sẽ gửi hàng cho người mua.' : 'Bạn cần gửi hàng.',
    DA_GUI_HANG: 'Hàng đang được giao; chờ người mua xác nhận đã nhận.',
    DA_GIAO: 'Người mua đang kiểm tra hàng; tiền vẫn được giữ.',
    DANG_KIEM_TRA: 'Người mua đang kiểm tra hàng; tiền vẫn được giữ.',
    DANG_TRANH_CHAP: 'Đơn đang tranh chấp; hãy mở đơn để phản hồi và gửi bằng chứng.',
    HOAN_THANH: 'Giao dịch đã hoàn thành và tiền đã giải ngân.',
  }[don.trang_thai];

  if (theoTrangThai) {
    return theoTrangThai;
  }

  return don.ly_do_huy === 'KHONG_THANH_TOAN'
    ? 'Người thắng không thanh toán. Mở đơn để gửi Cơ hội mua tiếp nếu còn người phù hợp, hoặc đăng lại sản phẩm.'
    : 'Đơn đã hủy và hoàn tiền; mở đơn để theo dõi việc xử lý hàng.';
}

export async function ketQuaSauPhien(phien) {
  if (['DA_LEN_LICH', 'HOAT_DONG'].includes(phien.trang_thai)) {
    return null;
  }

  const don = (await khoDon.donHangCuaPhien(phien.id)).at(-1);
  const sanPham = await khoBanGhi.layTheoId('san_pham', phien.san_pham_id);
  const lyDo = sanPham ? await lyDoKhongTaoPhien(sanPham) : { ly_do: 'Không tìm thấy sản phẩm.' };

  return {
    don_hang: don
      ? {
          id: don.id,
          ma_don_hang: don.ma_don_hang,
          trang_thai: don.trang_thai,
        }
      : null,
    buoc_tiep_theo: don ? buocTheoDon(don) : 'Phiên không có giao dịch.',
    co_the_dang_lai: !lyDo,
    ly_do_khong_dang_lai: lyDo?.ly_do ?? null,
  };
}
