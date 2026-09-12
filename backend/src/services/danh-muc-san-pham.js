const { randomUUID: taoMaNgauNhien } = require('node:crypto');
const coSoDuLieu = require('../repositories/ket-noi');
const khoBanGhi = require('../repositories/ban-ghi');
const khoDuLieu = require('../repositories/danh-muc-san-pham');
const cacNguoiDung = require('../repositories/nguoi-dung');
const kiemTra = require('../validators/du-lieu-dau-vao');
const { baoDam, batBuocTonTai, cungId } = require('../utils/loi');
const { chonTruong } = require('../utils/du-lieu-cong-khai');
const { ghiNhatKy, taoThongBao } = require('./nhat-ky-thong-bao');
const cacTrangThai = ['BAN_NHAP', 'CHO_XU_LY', 'DA_DUYET', 'TU_CHOI', 'LUU_TRU'];
async function luuDanhMuc(quanTri, idCanSua, dauVao) {
  kiemTra.kiemTraNoiDung(dauVao, [
    'danh_muc_cha_id',
    'ten',
    'duong_dan',
    'mo_ta',
    'dang_hoat_dong',
    'thu_tu',
  ]);
  const duLieu = {
    danh_muc_cha_id: dauVao.danh_muc_cha_id == null ? null : kiemTra.id(dauVao.danh_muc_cha_id),
    ten: kiemTra.chuoi(dauVao.ten, 'Tên', 120),
    duong_dan: kiemTra.chuoi(dauVao.duong_dan, 'Đường dẫn', 150),
    mo_ta: dauVao.mo_ta ? kiemTra.chuoi(dauVao.mo_ta, 'Mô tả', 500) : null,
    dang_hoat_dong: kiemTra.giaTriDungSai(dauVao.dang_hoat_dong ?? true, 'Hoạt động'),
    thu_tu: kiemTra.soNguyen(dauVao.thu_tu ?? 0, 'Thứ tự'),
  };
  baoDam(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(duLieu.duong_dan),
    400,
    'Đường dẫn chỉ gồm chữ thường, số và dấu gạch ngang',
  );
  return coSoDuLieu.giaoDich(async () => {
    let id = idCanSua;
    // Khóa các thay đổi cây danh mục để tránh hai yêu cầu cập nhật gây vòng lặp.
    await cacNguoiDung.layTheoId(quanTri.id, true);
    if (id) batBuocTonTai(await khoBanGhi.layTheoId('danh_muc', kiemTra.id(id), true));
    let cha = duLieu.danh_muc_cha_id;
    const daDuyet = new Set();
    while (cha) {
      baoDam(!cungId(cha, id) && !daDuyet.has(String(cha)), 400, 'Danh mục cha tạo thành vòng lặp');
      daDuyet.add(String(cha));
      cha = batBuocTonTai(await khoBanGhi.layTheoId('danh_muc', cha, true)).danh_muc_cha_id;
    }
    if (id) await khoBanGhi.capNhat('danh_muc', id, duLieu);
    else id = await khoBanGhi.them('danh_muc', duLieu);
    await ghiNhatKy(quanTri.id, 'LUU_DANH_MUC', 'danh_muc', id);
    return khoBanGhi.layTheoId('danh_muc', id);
  });
}
async function luuThuocTinh(quanTri, danhMucId, idCanSua, dauVao) {
  danhMucId = kiemTra.id(danhMucId);
  kiemTra.kiemTraNoiDung(dauVao, [
    'ten_thuoc_tinh',
    'khoa_thuoc_tinh',
    'kieu_nhap',
    'don_vi',
    'lua_chon_json',
    'bat_buoc',
    'thu_tu',
  ]);
  const loai = kiemTra.giaTriLuaChon(
    dauVao.kieu_nhap,
    ['VAN_BAN', 'SO', 'LUA_CHON', 'DUNG_SAI', 'NGAY'],
    'Kiểu nhập',
  );
  let tuyChon = null;
  if (loai === 'LUA_CHON') {
    baoDam(
      Array.isArray(dauVao.lua_chon_json) &&
        dauVao.lua_chon_json.length > 0 &&
        dauVao.lua_chon_json.length <= 100,
      400,
      'Cần danh sách lựa chọn',
    );
    tuyChon = JSON.stringify([
      ...new Set(dauVao.lua_chon_json.map((x) => kiemTra.chuoi(x, 'Lựa chọn', 100))),
    ]);
  }
  const duLieu = {
    danh_muc_id: danhMucId,
    ten_thuoc_tinh: kiemTra.chuoi(dauVao.ten_thuoc_tinh, 'Tên thuộc tính', 100),
    khoa_thuoc_tinh: kiemTra.chuoi(dauVao.khoa_thuoc_tinh, 'Khóa thuộc tính', 100),
    kieu_nhap: loai,
    don_vi: dauVao.don_vi ? kiemTra.chuoi(dauVao.don_vi, 'Đơn vị', 30) : null,
    lua_chon_json: tuyChon,
    bat_buoc: kiemTra.giaTriDungSai(dauVao.bat_buoc ?? false, 'Bắt buộc'),
    thu_tu: kiemTra.soNguyen(dauVao.thu_tu ?? 0, 'Thứ tự'),
  };
  baoDam(/^[a-z][a-z0-9_]*$/.test(duLieu.khoa_thuoc_tinh), 400, 'Khóa thuộc tính không hợp lệ');
  return coSoDuLieu.giaoDich(async () => {
    let id = idCanSua;
    batBuocTonTai(await khoBanGhi.layTheoId('danh_muc', danhMucId, true));
    if (id) {
      const banCu = batBuocTonTai(
        await khoBanGhi.layTheoId('thuoc_tinh_danh_muc', kiemTra.id(id), true),
      );
      baoDam(cungId(banCu.danh_muc_id, danhMucId), 404, 'Thuộc tính không thuộc danh mục');
      baoDam(
        !(await khoDuLieu.thuocTinhDaDung(id)) || banCu.kieu_nhap === loai,
        409,
        'Không đổi kiểu thuộc tính đang được dùng',
      );
      await khoBanGhi.capNhat('thuoc_tinh_danh_muc', id, duLieu);
    } else id = await khoBanGhi.them('thuoc_tinh_danh_muc', duLieu);
    await ghiNhatKy(quanTri.id, 'LUU_THUOC_TINH', 'thuoc_tinh_danh_muc', id);
    return khoBanGhi.layTheoId('thuoc_tinh_danh_muc', id);
  });
}
async function kiemTraGiaTriThuocTinh(danhMucId, dauVao = [], batBuocDayDu = false) {
  baoDam(
    Array.isArray(dauVao) && dauVao.length <= 100,
    400,
    'Thuộc tính phải là danh sách, tối đa 100',
  );
  const cacDinhNghia = await khoDuLieu.danhSachThuocTinh(danhMucId);
  const daGap = new Set();
  const ketQua = [];
  for (const muc of dauVao) {
    kiemTra.kiemTraNoiDung(muc, ['thuoc_tinh_id', 'gia_tri']);
    const id = kiemTra.id(muc.thuoc_tinh_id);
    baoDam(!daGap.has(id), 400, 'Thuộc tính bị trùng');
    daGap.add(id);
    const dinhNghia = batBuocTonTai(
      cacDinhNghia.find((x) => cungId(x.id, id)),
      'Thuộc tính không thuộc danh mục',
    );
    const giaTri = kiemTra.chuoi(String(muc.gia_tri ?? ''), 'Giá trị thuộc tính', 500);
    if (dinhNghia.kieu_nhap === 'SO')
      baoDam(
        /^-?\d+(\.\d+)?$/.test(giaTri) && Number.isFinite(Number(giaTri)),
        400,
        'Thuộc tính phải là số',
      );
    if (dinhNghia.kieu_nhap === 'DUNG_SAI')
      kiemTra.giaTriLuaChon(giaTri, ['true', 'false', '0', '1'], 'Giá trị đúng/sai');
    if (dinhNghia.kieu_nhap === 'NGAY')
      baoDam(
        /^\d{4}-\d\d-\d\d$/.test(giaTri) &&
          Number.isFinite(new Date(giaTri).getTime()) &&
          new Date(giaTri).toISOString().slice(0, 10) === giaTri,
        400,
        'Ngày không hợp lệ',
      );
    if (dinhNghia.kieu_nhap === 'LUA_CHON') {
      const cacLuaChon =
        typeof dinhNghia.lua_chon_json === 'string'
          ? JSON.parse(dinhNghia.lua_chon_json)
          : dinhNghia.lua_chon_json;
      baoDam(
        Array.isArray(cacLuaChon) && cacLuaChon.includes(giaTri),
        400,
        'Giá trị không nằm trong lựa chọn',
      );
    }
    ketQua.push({ thuoc_tinh_id: id, gia_tri: giaTri });
  }
  if (batBuocDayDu)
    for (const dinhNghia of cacDinhNghia)
      baoDam(
        !dinhNghia.bat_buoc || daGap.has(String(dinhNghia.id)),
        400,
        `Thiếu thuộc tính bắt buộc: ${dinhNghia.ten_thuoc_tinh}`,
      );
  return ketQua;
}
async function kiemTraNguoiBan(nguoiDung) {
  const banGhi = batBuocTonTai(await cacNguoiDung.layTheoId(nguoiDung.id));
  baoDam(
    banGhi.trang_thai_tai_khoan === 'HOAT_DONG' &&
      banGhi.vai_tro === 'NGUOI_DUNG' &&
      banGhi.trang_thai_nguoi_ban === 'DA_XAC_MINH',
    403,
    'Cần người bán đã xác minh',
  );
}
async function laySanPhamDuocSua(nguoiDung, id) {
  const banGhi = batBuocTonTai(await khoBanGhi.layTheoId('san_pham', kiemTra.id(id), true));
  baoDam(cungId(banGhi.nguoi_ban_id, nguoiDung.id), 403, 'Sản phẩm không thuộc tài khoản');
  baoDam(
    ['BAN_NHAP', 'TU_CHOI'].includes(banGhi.trang_thai_duyet),
    409,
    'Chỉ sửa sản phẩm nháp hoặc bị từ chối',
  );
  baoDam(!(await khoDuLieu.sanPhamDaCoPhien(id)), 409, 'Sản phẩm đã có phiên đấu giá');
  return banGhi;
}
async function luuSanPham(nguoiDung, idCanSua, dauVao) {
  kiemTra.kiemTraNoiDung(dauVao, [
    'danh_muc_id',
    'tieu_de',
    'mo_ta',
    'tinh_trang_san_pham',
    'thuong_hieu',
    'thuoc_tinh',
  ]);
  const duLieu = {
    danh_muc_id: kiemTra.id(dauVao.danh_muc_id),
    tieu_de: kiemTra.chuoi(dauVao.tieu_de, 'Tiêu đề', 200),
    mo_ta: kiemTra.chuoi(dauVao.mo_ta, 'Mô tả', 20000),
    tinh_trang_san_pham: kiemTra.giaTriLuaChon(
      dauVao.tinh_trang_san_pham,
      ['MOI', 'NHU_MOI', 'DA_QUA_SU_DUNG_TOT', 'DA_QUA_SU_DUNG', 'LAY_LINH_KIEN'],
      'Tình trạng',
    ),
    thuong_hieu: dauVao.thuong_hieu ? kiemTra.chuoi(dauVao.thuong_hieu, 'Thương hiệu', 100) : null,
  };
  return coSoDuLieu.giaoDich(async () => {
    let id = idCanSua;
    await kiemTraNguoiBan(nguoiDung);
    if (id) await laySanPhamDuocSua(nguoiDung, id);
    baoDam(
      batBuocTonTai(await khoBanGhi.layTheoId('danh_muc', duLieu.danh_muc_id)).dang_hoat_dong,
      400,
      'Danh mục đã ngừng hoạt động',
    );
    const cacMuc = await kiemTraGiaTriThuocTinh(duLieu.danh_muc_id, dauVao.thuoc_tinh);
    if (id)
      await khoBanGhi.capNhat('san_pham', id, {
        ...duLieu,
        trang_thai_duyet: 'BAN_NHAP',
        ly_do_tu_choi: null,
      });
    else
      id = await khoBanGhi.them('san_pham', {
        ...duLieu,
        nguoi_ban_id: nguoiDung.id,
        duong_dan: `san-pham-${taoMaNgauNhien()}`,
      });
    await khoDuLieu.thayGiaTriThuocTinh(id, cacMuc);
    await ghiNhatKy(nguoiDung.id, 'LUU_SAN_PHAM', 'san_pham', id);
    return chiTiet(nguoiDung, id);
  });
}
async function chiTiet(nguoiDung, id) {
  const banGhi = batBuocTonTai(await khoBanGhi.layTheoId('san_pham', kiemTra.id(id)));
  const coQuyenRieng =
    nguoiDung && (nguoiDung.vai_tro === 'QUAN_TRI' || cungId(nguoiDung.id, banGhi.nguoi_ban_id));
  baoDam(coQuyenRieng || banGhi.trang_thai_duyet === 'DA_DUYET', 404, 'Không tìm thấy sản phẩm');
  const sanPham = coQuyenRieng
    ? banGhi
    : chonTruong(banGhi, [
        'id',
        'nguoi_ban_id',
        'danh_muc_id',
        'tieu_de',
        'duong_dan',
        'mo_ta',
        'tinh_trang_san_pham',
        'thuong_hieu',
        'ngay_tao',
      ]);
  return {
    ...sanPham,
    hinh_anh: await khoDuLieu.danhSachAnh(id),
    thuoc_tinh: await khoDuLieu.cacGiaTri(id),
  };
}
async function guiDuyet(nguoiDung, id) {
  return coSoDuLieu.giaoDich(async () => {
    const banGhi = await laySanPhamDuocSua(nguoiDung, id);
    await kiemTraNguoiBan(nguoiDung);
    baoDam((await khoDuLieu.danhSachAnh(id)).length > 0, 400, 'Cần ít nhất một ảnh sản phẩm');
    await kiemTraGiaTriThuocTinh(
      banGhi.danh_muc_id,
      (await khoDuLieu.cacGiaTri(id)).map((x) => chonTruong(x, ['thuoc_tinh_id', 'gia_tri'])),
      true,
    );
    await khoBanGhi.capNhat('san_pham', id, { trang_thai_duyet: 'CHO_XU_LY', ly_do_tu_choi: null });
    await ghiNhatKy(nguoiDung.id, 'GUI_DUYET_SAN_PHAM', 'san_pham', id);
    return chiTiet(nguoiDung, id);
  });
}
async function duyet(quanTri, id, dauVao) {
  kiemTra.kiemTraNoiDung(dauVao, ['trang_thai_duyet', 'ly_do_tu_choi']);
  const trangThai = kiemTra.giaTriLuaChon(
    dauVao.trang_thai_duyet,
    ['DA_DUYET', 'TU_CHOI'],
    'Trạng thái duyệt',
  );
  const lyDo = trangThai === 'TU_CHOI' ? kiemTra.chuoi(dauVao.ly_do_tu_choi, 'Lý do', 500) : null;
  return coSoDuLieu.giaoDich(async () => {
    const banGhi = batBuocTonTai(await khoBanGhi.layTheoId('san_pham', kiemTra.id(id), true));
    baoDam(banGhi.trang_thai_duyet === 'CHO_XU_LY', 409, 'Sản phẩm không chờ duyệt');
    if (trangThai === 'DA_DUYET') {
      await kiemTraNguoiBan({ id: banGhi.nguoi_ban_id });
      await kiemTraGiaTriThuocTinh(
        banGhi.danh_muc_id,
        (await khoDuLieu.cacGiaTri(id)).map((x) => chonTruong(x, ['thuoc_tinh_id', 'gia_tri'])),
        true,
      );
    }
    await khoBanGhi.capNhat('san_pham', id, {
      trang_thai_duyet: trangThai,
      ly_do_tu_choi: lyDo,
      nguoi_duyet_id: quanTri.id,
      ngay_duyet: await coSoDuLieu.thoiGianHienTai(),
    });
    await ghiNhatKy(quanTri.id, 'DUYET_SAN_PHAM', 'san_pham', id, { trang_thai: trangThai });
    await taoThongBao(
      banGhi.nguoi_ban_id,
      'DUYET_SAN_PHAM',
      'Kết quả duyệt sản phẩm',
      lyDo || 'Sản phẩm đã được duyệt.',
      `/products/${id}`,
    );
    return chiTiet(quanTri, id);
  });
}
async function themAnh(nguoiDung, id, dauVao) {
  kiemTra.kiemTraNoiDung(dauVao, ['duong_dan_anh', 'la_anh_chinh', 'thu_tu']);
  await require('./tai-tep').kiemTraTepSoHuu(dauVao.duong_dan_anh, 'product', nguoiDung.id);
  return coSoDuLieu.giaoDich(async () => {
    await laySanPhamDuocSua(nguoiDung, id);
    const danhSachAnh = await khoDuLieu.danhSachAnh(id);
    baoDam(danhSachAnh.length < 12, 400, 'Tối đa 12 ảnh');
    const chinh = kiemTra.giaTriDungSai(dauVao.la_anh_chinh ?? !danhSachAnh.length, 'Ảnh chính');
    if (chinh) await khoDuLieu.boAnhChinh(id);
    const anhId = await khoBanGhi.them('hinh_anh_san_pham', {
      san_pham_id: id,
      duong_dan_anh: dauVao.duong_dan_anh,
      la_anh_chinh: chinh,
      thu_tu: kiemTra.soNguyen(dauVao.thu_tu ?? danhSachAnh.length, 'Thứ tự'),
    });
    return khoBanGhi.layTheoId('hinh_anh_san_pham', anhId);
  });
}
async function xoaAnh(nguoiDung, id, anhId) {
  return coSoDuLieu.giaoDich(async () => {
    await laySanPhamDuocSua(nguoiDung, id);
    const anh = batBuocTonTai(
      await khoBanGhi.layTheoId('hinh_anh_san_pham', kiemTra.id(anhId), true),
    );
    baoDam(cungId(anh.san_pham_id, id), 404, 'Ảnh không thuộc sản phẩm');
    await khoBanGhi.xoa('hinh_anh_san_pham', anhId);
    const danhSachAnh = await khoDuLieu.danhSachAnh(id);
    if (anh.la_anh_chinh && danhSachAnh.length)
      await khoBanGhi.capNhat('hinh_anh_san_pham', danhSachAnh[0].id, { la_anh_chinh: 1 });
  });
}
function danhSach(nguoiDung, truyVan = {}, phamVi = 'public') {
  const boLoc = {
    search: truyVan.q ? kiemTra.chuoi(truyVan.q, 'Tìm kiếm', 100) : '',
    categoryId: truyVan.danh_muc_id ? kiemTra.id(truyVan.danh_muc_id) : undefined,
  };
  if (phamVi === 'mine') boLoc.sellerId = nguoiDung.id;
  if (phamVi === 'public') boLoc.status = 'DA_DUYET';
  else if (truyVan.trang_thai)
    boLoc.status = kiemTra.giaTriLuaChon(truyVan.trang_thai, cacTrangThai, 'Trạng thái');
  return khoDuLieu.danhSachSanPham(kiemTra.phanTrang(truyVan), boLoc);
}
module.exports = {
  luuDanhMuc,
  luuThuocTinh,
  kiemTraGiaTriThuocTinh,
  kiemTraNguoiBan,
  luuSanPham,
  chiTiet,
  guiDuyet,
  duyet,
  themAnh,
  xoaAnh,
  danhSach,
};
