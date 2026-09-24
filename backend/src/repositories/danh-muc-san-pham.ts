import type { BoLocDanhSach, PhanTrang, GiaTriThuocTinh } from '../types/nghiep-vu';
import coSoDuLieu = require('./ket-noi');
import khoBanGhi = require('./ban-ghi');
import { docJSON } from '../utils/du-lieu-json';
import { baoDam, batBuocTonTai, cungId } from '../utils/loi';

const danhSachDanhMuc = (tatCa = false) =>
  coSoDuLieu.truyVan(
    `SELECT * FROM danh_muc ${tatCa ? '' : 'WHERE dang_hoat_dong=1'} ORDER BY thu_tu,id`,
  );

async function danhSachThuocTinh(id) {
  const dm = batBuocTonTai(await khoBanGhi.layTheoId('danh_muc', id));

  return docJSON(dm.cau_hinh_thuoc_tinh, [])
    .map((t, i) => ({
      ...t,
      id: String(t.id ?? i + 1),
      danh_muc_id: String(id),
      ten_thuoc_tinh: t.ten_thuoc_tinh ?? t.ten,
      khoa_thuoc_tinh: t.khoa_thuoc_tinh ?? t.khoa,
      kieu_nhap: t.kieu_nhap ?? t.kieu,
      lua_chon_json: docJSON(t.lua_chon_json ?? t.lua_chon, null),
      thu_tu: t.thu_tu ?? i,
    }))
    .sort((a, b) => a.thu_tu - b.thu_tu);
}

async function luuThuocTinh(danhMucId, id, duLieu) {
  // Khóa danh mục trước khi sửa JSON, tránh ghi đè cập nhật của yêu cầu khác.
  await khoBanGhi.layTheoId('danh_muc', danhMucId, true);

  const ds = await danhSachThuocTinh(danhMucId);

  baoDam(
    !ds.some((t) => t.khoa_thuoc_tinh === duLieu.khoa_thuoc_tinh && !cungId(t.id, id)),
    409,
    'Khóa thuộc tính đã tồn tại',
  );

  if (id) {
    const cu = batBuocTonTai(
      ds.find((t) => cungId(t.id, id)),
      'Thuộc tính không thuộc danh mục',
    );

    if (await thuocTinhDaDung(danhMucId, cu.khoa_thuoc_tinh)) {
      baoDam(
        cu.kieu_nhap === duLieu.kieu_nhap && cu.khoa_thuoc_tinh === duLieu.khoa_thuoc_tinh,
        409,
        'Không đổi khóa hoặc kiểu thuộc tính đã được dùng',
      );
    }
  } else {
    id = String(ds.reduce((max, t) => (BigInt(t.id) > max ? BigInt(t.id) : max), 0n) + 1n);
  }

  const muc = {
    ...duLieu,
    id: String(id),
    lua_chon_json: docJSON(duLieu.lua_chon_json, null),
  };

  await khoBanGhi.capNhat('danh_muc', danhMucId, {
    cau_hinh_thuoc_tinh: JSON.stringify([...ds.filter((t) => !cungId(t.id, id)), muc]),
  });

  return muc;
}

const danhSachAnh = (id) =>
  coSoDuLieu.truyVan(
    `SELECT id,san_pham_id,duong_dan_tep AS duong_dan_anh,la_anh_chinh,thu_tu,ngay_tao
   FROM tep_dinh_kem WHERE loai_tep='ANH_SAN_PHAM' AND san_pham_id=? ORDER BY la_anh_chinh DESC,thu_tu,id`,
    [id],
  );

async function cacGiaTri(id) {
  const p = batBuocTonTai(await khoBanGhi.layTheoId('san_pham', id));

  return Object.values(docJSON(p.thuoc_tinh_json, {}) as Record<string, GiaTriThuocTinh>).sort(
    (a, b) => (a.thu_tu ?? 0) - (b.thu_tu ?? 0),
  );
}

async function thayGiaTriThuocTinh(id, cacMuc) {
  const p = batBuocTonTai(await khoBanGhi.layTheoId('san_pham', id));
  const ds = await danhSachThuocTinh(p.danh_muc_id);
  const cap = cacMuc.map((m) => {
    const d = batBuocTonTai(ds.find((t) => cungId(t.id, m.thuoc_tinh_id)));

    return [
      d.khoa_thuoc_tinh,
      {
        thuoc_tinh_id: String(d.id),
        san_pham_id: String(id),
        gia_tri: m.gia_tri,
        ten_thuoc_tinh: d.ten_thuoc_tinh,
        khoa_thuoc_tinh: d.khoa_thuoc_tinh,
        kieu_nhap: d.kieu_nhap,
        don_vi: d.don_vi ?? null,
        thu_tu: d.thu_tu,
      },
    ];
  });

  await khoBanGhi.capNhat('san_pham', id, {
    thuoc_tinh_json: JSON.stringify(Object.fromEntries(cap)),
  });
}

const sanPhamDaCoPhien = (id) =>
  coSoDuLieu.layMot('SELECT id FROM phien_dau_gia WHERE san_pham_id=? LIMIT 1', [id]);

function danhSachSanPham(
  { limit, offset }: PhanTrang,
  { sellerId, status, categoryId, search = '' }: BoLocDanhSach,
) {
  const dk = ['p.tieu_de LIKE ?'],
    ts: unknown[] = [`%${search}%`];

  if (sellerId) {
    dk.push('p.nguoi_ban_id=?');
    ts.push(sellerId);
  }
  if (status) {
    dk.push('p.trang_thai_duyet=?');
    ts.push(status);
  }
  if (categoryId) {
    dk.push('p.danh_muc_id=?');
    ts.push(categoryId);
  }

  return coSoDuLieu.truyVan(
    `SELECT p.id,p.nguoi_ban_id,p.danh_muc_id,p.tieu_de,p.duong_dan,
    p.tinh_trang_san_pham,p.thuong_hieu,p.trang_thai_duyet,p.ngay_tao,
    (SELECT h.duong_dan_tep FROM tep_dinh_kem h WHERE h.loai_tep='ANH_SAN_PHAM' AND h.san_pham_id=p.id
     ORDER BY h.la_anh_chinh DESC,h.thu_tu,h.id LIMIT 1) AS anh_chinh
    FROM san_pham p WHERE ${dk.join(' AND ')} ORDER BY p.id DESC LIMIT ${limit} OFFSET ${offset}`,
    ts,
  );
}

const boAnhChinh = (id) =>
  coSoDuLieu.truyVan(
    "UPDATE tep_dinh_kem SET la_anh_chinh=0 WHERE loai_tep='ANH_SAN_PHAM' AND san_pham_id=?",
    [id],
  );
const thuocTinhDaDung = (danhMucId, khoa) =>
  coSoDuLieu.layMot(
    "SELECT id FROM san_pham WHERE danh_muc_id=? AND JSON_CONTAINS_PATH(thuoc_tinh_json,'one',?) LIMIT 1",
    [danhMucId, '$."' + khoa + '"'],
  );
export {
  danhSachDanhMuc,
  danhSachThuocTinh,
  luuThuocTinh,
  danhSachAnh,
  cacGiaTri,
  thayGiaTriThuocTinh,
  sanPhamDaCoPhien,
  danhSachSanPham,
  boAnhChinh,
  thuocTinhDaDung,
};
