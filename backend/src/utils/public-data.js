const { ensure } = require('./errors');
function pick(source, keys) { return Object.fromEntries(keys.filter(k => source[k] !== undefined).map(k => [k, source[k]])); }
const userFields = ['id','ho_ten','email','so_dien_thoai','anh_dai_dien','vai_tro','trang_thai_nguoi_ban','trang_thai_tai_khoan','ngay_tao'];
const auctionFields = ['id','san_pham_id','gia_khoi_diem','gia_mua_ngay','cho_phep_mua_ngay','gia_hien_tai','thoi_gian_bat_dau','thoi_gian_ket_thuc_goc','thoi_gian_ket_thuc','trang_thai','ly_do_ket_thuc','dat_gia_san','tong_luot_tra_gia','so_lan_gia_han','tieu_de','duong_dan','ten_danh_muc','nguoi_ban_id','anh_chinh'];
function publicUser(row) { return pick(row, userFields); }
function publicAuction(row) {
  return { ...pick(row, auctionFields), nguoi_dan_dau: row.nguoi_dan_dau_id ? `ND-${row.nguoi_dan_dau_id}` : null };
}
// Defense in depth: even a future controller cannot accidentally expose a secret field.
function assertPublic(value) {
  if (Array.isArray(value)) return value.forEach(assertPublic);
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    ensure(!['mat_khau_bam','mat_khau','password','gia_toi_da','jwtSecret','JWT_SECRET','DB_PASSWORD'].includes(key), 500, 'Không thể xuất dữ liệu nhạy cảm');
    assertPublic(item);
  }
}
module.exports = { pick, publicUser, publicAuction, assertPublic };
