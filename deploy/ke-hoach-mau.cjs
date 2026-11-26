const DAY = 86400000;
const MARKER = 'VIETBID_CLOUD_DEMO_4_MONTHS_V1';
const actors = [
  ['ban.suutam', 'Mẫu · Nhà sưu tầm An', 'seller'],
  ['ban.nghethuat', 'Mẫu · Không gian Mộc', 'seller'],
  ['ban.vintage', 'Mẫu · Vintage Studio', 'seller'],
  ['ban.choxacminh', 'Mẫu · Người bán chờ xác minh', 'pending'],
  ['mua.minh', 'Mẫu · Người mua Minh', 'buyer'],
  ['mua.lan', 'Mẫu · Người mua Lan', 'buyer'],
].map(([name, title, role]) => ({ email: `${name}@demo.vietbid.example`, title, role }));

// Thuộc tính và định danh đều là dữ liệu mô phỏng, không xác nhận món đồ trong ảnh.
const catalog = [
  [
    'rolex-submariner.jpg',
    3,
    'Đồng hồ Rolex Submariner',
    'Rolex',
    28000000,
    {
      dong_san_pham: 'Submariner',
      ma_tham_chieu: 'DEMO-SUB',
      nam_san_xuat: 1998,
      hop_va_chung_tu: true,
    },
  ],
  [
    'binh-su-minh-aberdeen.jpg',
    1,
    'Bình sứ men lam sưu tầm',
    'Bộ sưu tập gốm',
    8500000,
    { nien_dai: 'Niên đại mô phỏng', chat_lieu: 'Gốm sứ', nguon_goc: true },
  ],
  [
    'tranh-son-mai-hoang-tich-chu.webp',
    2,
    'Tranh sơn mài — sắc màu truyền thống',
    'Nghệ thuật Việt',
    12500000,
    {
      tac_gia: 'Tác giả theo nguồn ảnh, hồ sơ mô phỏng',
      chat_lieu: 'Sơn mài',
      kich_thuoc: '60 × 80 cm (mẫu)',
    },
  ],
  [
    'leica-m3.jpg',
    10,
    'Máy ảnh cơ Leica M3',
    'Leica',
    9500000,
    { he_may: 'Máy ảnh phim 35mm', ma_mau: 'M3-DEMO', nam_san_xuat: 1960, ong_kinh_kem_theo: true },
  ],
  [
    'fender-stratocaster.jpg',
    9,
    'Guitar Fender Stratocaster vintage',
    'Fender',
    15000000,
    {
      nha_san_xuat: 'Fender',
      dong_san_pham: 'Stratocaster',
      nam_san_xuat: 1985,
      ma_dinh_danh: 'DEMO-FENDER',
    },
  ],
  [
    'tui-birkin-hong.jpg',
    5,
    'Túi Birkin — bộ sưu tập màu hồng',
    'Hermès',
    18000000,
    { dong_san_pham: 'Birkin', ma_phien_ban: 'DEMO-BAG', phu_kien_chung_tu: true },
  ],
  [
    'sach-pantagruel-ban-in-dau.jpg',
    7,
    'Sách cổ Pantagruel — tư liệu sưu tầm',
    'Tủ sách cổ',
    3500000,
    { tac_gia: 'François Rabelais', nam_xuat_ban: 1532, an_ban: 'Hồ sơ mô phỏng', nguon_goc: true },
  ],
  [
    'dong-piastre-dong-duong-1928.png',
    8,
    'Đồng Piastre Đông Dương 1928',
    'Sưu tầm tiền cổ',
    2500000,
    { su_kien: 'Tiền tệ Đông Dương', thoi_ky: '1928 (mẫu)', nguon_goc: true },
  ],
  [
    'mercedes-280sl-pagode.jpg',
    6,
    'Mercedes 280 SL Pagode sưu tầm',
    'Mercedes-Benz',
    950000000,
    {
      hang_xe: 'Mercedes-Benz',
      dong_xe: '280 SL',
      nam_san_xuat: 1969,
      so_khung: 'DEMO-NOT-A-REAL-VIN',
    },
  ],
  [
    'nhan-sapphire-co.jpg',
    4,
    'Nhẫn sapphire phong cách cổ điển',
    'Trang sức sưu tầm',
    6500000,
    { kim_loai: 'Vàng trắng (mô phỏng)', loai_da: 'Sapphire', trong_luong: 4.2, chung_thu: true },
  ],
  [
    'dong-ho-de-ban-vienna.jpg',
    1,
    'Đồng hồ để bàn Vienna',
    'Vienna',
    4500000,
    { nien_dai: 'Thế kỷ XX (mẫu)', chat_lieu: 'Gỗ và kim loại', nguon_goc: true },
  ],
  [
    'omega-speedmaster-schumacher.jpg',
    3,
    'Omega Speedmaster Schumacher',
    'Omega',
    22000000,
    { dong_san_pham: 'Speedmaster', ma_tham_chieu: 'DEMO-OMEGA', hop_va_chung_tu: true },
  ],
  [
    'binh-phong-son-mai-nguyen-gia-tri.jpg',
    2,
    'Bình phong sơn mài — không gian Việt',
    'Nghệ thuật Việt',
    18000000,
    {
      tac_gia: 'Tác giả theo nguồn ảnh, hồ sơ mô phỏng',
      chat_lieu: 'Sơn mài',
      kich_thuoc: '120 × 180 cm (mẫu)',
    },
  ],
  [
    'gibson-les-paul-1952.jpg',
    9,
    'Guitar Gibson Les Paul 1952',
    'Gibson',
    24000000,
    {
      nha_san_xuat: 'Gibson',
      dong_san_pham: 'Les Paul',
      nam_san_xuat: 1952,
      ma_dinh_danh: 'DEMO-GIBSON',
    },
  ],
  [
    'mau-emerald-tren-da.jpg',
    4,
    'Mẫu emerald trên đá nền',
    'Khoáng vật sưu tầm',
    2800000,
    {
      kim_loai: 'Không áp dụng — khoáng vật',
      loai_da: 'Emerald',
      trong_luong: 26,
      chung_thu: true,
    },
  ],
  [
    'tem-dong-duong-1889.jpg',
    8,
    'Tem Đông Dương 1889',
    'Bộ sưu tập tem',
    1200000,
    { su_kien: 'Bưu chính Đông Dương', thoi_ky: '1889 (mẫu)', nguon_goc: true },
  ],
  [
    'binh-dong-zun.jpg',
    1,
    'Bình đồng Zun — hiện vật tham khảo',
    'Bộ sưu tập đồng',
    7800000,
    { nien_dai: 'Niên đại mô phỏng', chat_lieu: 'Đồng', nguon_goc: true },
  ],
  [
    'dan-violin.jpg',
    9,
    'Violin gỗ — bộ sưu tập vintage',
    'Vintage Strings',
    5500000,
    { nha_san_xuat: 'Xưởng đàn mô phỏng', dong_san_pham: 'Violin', ma_dinh_danh: 'DEMO-VIOLIN' },
  ],
  [
    'rolex-datejust-16013.jpg',
    3,
    'Rolex Datejust 16013 hai tông màu',
    'Rolex',
    25000000,
    { dong_san_pham: 'Datejust', ma_tham_chieu: '16013-DEMO', hop_va_chung_tu: true },
  ],
  [
    'lo-limoges-co.jpg',
    1,
    'Lọ Limoges hoa văn cổ',
    'Limoges',
    3200000,
    { nien_dai: 'Đầu thế kỷ XX (mẫu)', chat_lieu: 'Sứ trang trí', nguon_goc: true },
  ],
  [
    'the-bong-chay-cal-hubbard.jpg',
    8,
    'Thẻ bóng chày Cal Hubbard',
    'Thẻ thể thao',
    1800000,
    { su_kien: 'Cal Hubbard — bóng chày', thoi_ky: 'Thẻ vintage (mẫu)', nguon_goc: true },
  ],
  [
    'nhan-kim-cuong-solitaire.jpg',
    4,
    'Nhẫn solitaire — phong cách tối giản',
    'Trang sức sưu tầm',
    11500000,
    { kim_loai: 'Vàng trắng (mô phỏng)', loai_da: 'Kim cương', trong_luong: 3.8, chung_thu: true },
  ],
].map(([file, category, title, brand, price, attributes]) => ({
  file,
  category,
  title,
  brand,
  price,
  attributes,
}));

function addMonths(date, months) {
  const target = new Date(date);
  const day = target.getUTCDate();
  target.setUTCDate(1);
  target.setUTCMonth(target.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}

function makePlan(now = new Date()) {
  const end = addMonths(now, 4);
  return {
    marker: MARKER,
    start: now.toISOString(),
    end: end.toISOString(),
    auctions: catalog.map((item, index) => {
      const batch = index < 6 ? 0 : 1 + Math.floor((index - 6) / 2);
      return {
        ...item,
        seller: (item.category - 1) % 3,
        batch,
        start: new Date(now.getTime() + batch * 14 * DAY).toISOString(),
        end: new Date(
          Math.min(end.getTime(), now.getTime() + (batch + 1) * 14 * DAY + 3600000),
        ).toISOString(),
      };
    }),
  };
}

module.exports = { MARKER, actors, catalog, makePlan, addMonths };
