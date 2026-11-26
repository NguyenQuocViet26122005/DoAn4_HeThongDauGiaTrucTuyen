import type { NguoiDungDangNhap } from '../types/nghiep-vu';
import { baoDam, batBuocTonTai, cungId } from '../utils/loi';
import { docSchema } from '../validations/du-lieu-dau-vao';
import kho = require('../repositories/ban-ghi');
import sanPham = require('../repositories/danh-muc-san-pham');
import hoTro = require('../repositories/ho-tro-dang-ban');
import { anhGiongNhau, docDauVan } from './dau-van-anh';
import { z } from 'zod';
import { taoNoiDung, aiSanSang } from './ai';

export function khongDau(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export function canhBaoVanBan(tieuDe: string, moTa: string) {
  const text = khongDau(`${tieuDe}\n${moTa}`);
  const ds: { ma: string; noi_dung: string }[] = [];

  if (/(?:\+?84|0)(?:[\s().-]*\d){8,10}(?!\d)/.test(text) || /\bzalo\b|\blien\s*he\b/.test(text)) {
    ds.push({
      ma: 'LIEN_HE',
      noi_dung: 'Có dấu hiệu số điện thoại hoặc liên hệ ngoài sàn. Hãy bỏ thông tin liên hệ.',
    });
  }
  if (/[\w.+-]+\s*@\s*[\w.-]+\.[a-z]{2,}/.test(text)) {
    ds.push({
      ma: 'EMAIL',
      noi_dung: 'Có địa chỉ email trong tin đăng. Hãy bỏ email khỏi nội dung công khai.',
    });
  }
  if (/(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|vn|net|org|me|io)(?:\/|\b)/.test(text)) {
    ds.push({
      ma: 'LIEN_KET',
      noi_dung: 'Có liên kết ngoài trong tin đăng. Kiểm tra và bỏ đường dẫn giao dịch ngoài sàn.',
    });
  }
  if (
    /(?:100\s*%\s*(?:hang\s*)?(?:that|chinh hang|auth)|(?:hang that|chinh hang|authentic|auth|zin)\s*100\s*%|cam ket tuyet doi)/.test(
      text,
    )
  ) {
    ds.push({
      ma: 'CAM_KET',
      noi_dung:
        'Có cam kết tính xác thực tuyệt đối. Mô tả chứng cứ hiện có; kết quả kiểm định do đơn vị kiểm định xác nhận.',
    });
  }

  return ds;
}

export async function hoSoDuocXem(user: NguoiDungDangNhap, id: string) {
  const p = batBuocTonTai(await kho.layTheoId('san_pham', id));

  baoDam(
    user.vai_tro === 'QUAN_TRI' || cungId(user.id, p.nguoi_ban_id),
    403,
    'Không có quyền rà soát hồ sơ này',
  );

  return p;
}

export async function canhBaoCoBan(p) {
  const canhBao = canhBaoVanBan(p.tieu_de, p.mo_ta);
  const anh = await sanPham.danhSachAnh(p.id);
  const dauVan = (await Promise.all(anh.map((a) => docDauVan(a.duong_dan_anh)))).filter(Boolean);
  let khongDocDuoc = anh.length - dauVan.length;
  let trung = false;

  if (dauVan.length) {
    for (const a of await hoTro.anhNguoiBanKhac(p.nguoi_ban_id)) {
      const dv = await docDauVan(a.duong_dan_tep);

      if (!dv) {
        khongDocDuoc++;
      } else if (dauVan.some((x) => anhGiongNhau(x, dv))) {
        trung = true;
        break;
      }
    }
  }
  if (trung) {
    canhBao.push({
      ma: 'ANH_TRUNG',
      noi_dung:
        'Có ảnh trùng hoặc gần giống ảnh của người bán khác. Cần xác minh nguồn ảnh; đây không phải kết luận gian lận.',
    });
  }

  return { canh_bao: canhBao, anh_chua_doi_chieu: khongDocDuoc };
}

function coDiaChi(s: string) {
  const text = s.normalize('NFC').toLowerCase();
  const bien = '(?<![\\p{L}\\p{N}])';
  const nhanDiaChi = new RegExp(
    `${bien}(?:địa chỉ|dia chi|đ/c|d/c|số nhà|so nha)\\s*(?::\\s*[\\p{L}\\p{N}]|\\d)`,
    'u',
  );
  const donVi = new RegExp(
    `${bien}(phường|quận|huyện|thôn|ngõ|hẻm|xã|tỉnh|thành phố)\\s+([\\p{L}\\p{N}]+)`,
    'gu',
  );
  const duong = new RegExp(`${bien}(?:đường|duong)\\s+([\\p{L}\\p{N}]+)`, 'gu');
  const tuSanPham = new Set(
    'kính may chỉ sọc khâu viền nét vân cong thẳng kẻ gân truyền mòn chéo cắt ray ống rãnh'
      .split(' ')
      .map(khongDau),
  );
  // Các đơn vị viết không dấu cần số hoặc ngữ cảnh giao nhận; không dò từ rời.
  const khongDauCoSo = new RegExp(
    `${bien}(?:phuong|quan|huyen|thon|ngo|hem|xa|tinh|thanh pho)\\s+\\d`,
    'u',
  );
  const giaoNhan = new RegExp(
    `${bien}(?:giao(?: hàng| hang)?|nhận(?: hàng| hang)?|nhan(?: hang)?|ở|o|tại|tai)\\s+(?:tại\\s+|tai\\s+)?(?:số\\s+|so\\s+)?\\d{1,4}[a-z]?(?:[/.-]\\d+)?\\s+[\\p{L}]+`,
    'u',
  );
  const donViCoDiaDanh = [...text.matchAll(donVi)].some(
    ([, donVi, tuSau]) =>
      !(donVi === 'tỉnh' && tuSau === 'táo') && !(donVi === 'xã' && tuSau === 'hội'),
  );
  const duongCoDiaDanh = [...text.matchAll(duong)].some(
    ([, tuSau]) => !tuSanPham.has(khongDau(tuSau)),
  );

  return (
    nhanDiaChi.test(text) ||
    donViCoDiaDanh ||
    duongCoDiaDanh ||
    khongDauCoSo.test(text) ||
    giaoNhan.test(text)
  );
}

// Xét từng giá trị, tránh ghép hai trường JSON thành một chuỗi liên hệ giả.
function cacDoanVanBan(s: string): string[] {
  try {
    const doc = (v: unknown): string[] => {
      if (typeof v === 'string') {
        return [v];
      }
      if (Array.isArray(v)) {
        return v.flatMap(doc);
      }
      if (v && typeof v === 'object') {
        return Object.values(v).flatMap(doc);
      }

      return [];
    };
    const duLieu = JSON.parse(s);

    return duLieu && typeof duLieu === 'object' ? doc(duLieu) : [s];
  } catch {
    return [s];
  }
}

export function coLienHe(s: string) {
  return cacDoanVanBan(s).some((doan) => {
    const text = khongDau(doan);

    return (
      canhBaoVanBan('', doan).some((x) => ['LIEN_HE', 'EMAIL', 'LIEN_KET'].includes(x.ma)) ||
      /\b(?:khong|mot|hai|ba|bon|nam|sau|bay|tam|chin)(?:[\s,.-]+(?:khong|mot|hai|ba|bon|nam|sau|bay|tam|chin)){5,}\b/.test(
        text,
      )
    );
  });
}

// Đầu vào gửi AI phải loại cả liên hệ lẫn địa chỉ; đầu ra gợi ý chỉ dò liên hệ.
export function coDuLieuRiengTu(s: string) {
  return coLienHe(s) || cacDoanVanBan(s).some(coDiaChi);
}

const danhGiaSchema = z.strictObject({
  canh_bao: z
    .array(z.enum(['SO_LIEN_HE_VIET_LACH', 'MAU_THUAN_THUOC_TINH', 'SAI_DANH_MUC']))
    .max(3),
});
const nhanAI = {
  SO_LIEN_HE_VIET_LACH: 'Có dấu hiệu liên hệ được viết lách. Admin cần đọc và kiểm tra lại.',
  MAU_THUAN_THUOC_TINH: 'Mô tả có thể mâu thuẫn thuộc tính. Đối chiếu lại trước khi duyệt.',
  SAI_DANH_MUC: 'Sản phẩm có thể sai danh mục. Đối chiếu đặc điểm sản phẩm với danh mục đã chọn.',
};

export async function raSoat(user: NguoiDungDangNhap, id: string, body: unknown) {
  const { dung_ai } = docSchema(z.strictObject({ dung_ai: z.boolean().default(false) }), body);
  const p = await hoSoDuocXem(user, id);
  const coBan = await canhBaoCoBan(p);
  const dm = batBuocTonTai(await kho.layTheoId('danh_muc', p.danh_muc_id));
  const thuocTinh = (await sanPham.cacGiaTri(id)).map((t) => ({
    ten: t.ten_thuoc_tinh,
    gia_tri: t.gia_tri,
  }));
  const input = {
    tieu_de: p.tieu_de,
    mo_ta: p.mo_ta,
    danh_muc: dm.ten,
    thuoc_tinh: thuocTinh,
  };
  const riengTu = coDuLieuRiengTu(JSON.stringify(input));
  const ai =
    dung_ai && !riengTu
      ? await taoNoiDung(
          danhGiaSchema,
          {
            nhiem_vu:
              'Rà soát liên hệ viết lách, mâu thuẫn mô tả với thuộc tính và sai danh mục. Trả mã có dấu hiệu, không kết luận gian lận.',
            du_lieu: input,
          },
          'kiem_duyet',
        )
      : null;

  return {
    ...coBan,
    canh_bao_ai: [...new Set(ai?.canh_bao ?? [])].map((ma) => ({ ma, noi_dung: nhanAI[ma] })),
    ai_san_sang: aiSanSang(),
    thong_bao: dung_ai
      ? riengTu
        ? 'Nội dung có thể chứa thông tin riêng tư hoặc liên hệ. Bỏ thông tin này trước khi yêu cầu AI.'
        : !ai
          ? 'Chưa nhận được đánh giá AI. Cảnh báo cơ bản vẫn sử dụng được.'
          : null
      : null,
  };
}
