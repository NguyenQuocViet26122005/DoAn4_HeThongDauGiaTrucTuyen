const taiKhoan = [
  [1001, 'Quản trị VietBid', 'admin', 'QUAN_TRI'],
  [1101, 'Nguyễn Minh Hoàng', 'hoang', 'NGUOI_BAN'],
  [1102, 'Lê Thu Hà', 'ha', 'NGUOI_BAN'],
  [1103, 'Trần Quốc Vinh', 'vinh', 'NGUOI_BAN'],
  [1104, 'Phạm Ngọc Mai', 'mai', 'NGUOI_BAN'],
  [1105, 'Vũ Quang Minh', 'minh', 'NGUOI_BAN'],
  [1201, 'Trần Đức Anh', 'duc.anh', 'NGUOI_MUA'],
  [1202, 'Nguyễn Bảo Ngọc', 'bao.ngoc', 'NGUOI_MUA'],
  [1203, 'Hoàng Gia Bảo', 'gia.bao', 'NGUOI_MUA'],
  [1204, 'Vũ Hải Nam', 'hai.nam', 'NGUOI_MUA'],
  [1205, 'Đỗ Nhật Minh', 'nhat.minh', 'NGUOI_MUA'],
  [1206, 'Lý Thanh Tâm', 'thanh.tam', 'NGUOI_MUA'],
  [1207, 'Bùi Ngọc Anh', 'ngoc.anh', 'NGUOI_MUA'],
  [1208, 'Cao Thu Hằng', 'thu.hang', 'NGUOI_MUA'],
  [1209, 'Vũ Quỳnh Anh', 'quynh.anh', 'NGUOI_MUA'],
  [1210, 'Phan Minh Tùng', 'minh.tung', 'NGUOI_MUA'],
].map(([id, ten, email, loai]) => ({
  id,
  ten,
  email: `${email}@vietbid.test`,
  loai,
  soDienThoai: `099000${id}`,
}));

const phien = [
  {
    id: 2001,
    sanPham: 95,
    batDau: -24,
    ketThuc: -20,
    gia: 180000000,
    coc: 18000000,
    bids: [
      [1202, 190000000],
      [1203, 200000000],
      [1201, 215000000],
    ],
    ketQua: 'HOAN_THANH',
  },
  {
    id: 2002,
    sanPham: 96,
    batDau: -9,
    ketThuc: -6,
    gia: 60000000,
    coc: 6000000,
    bids: [
      [1205, 65000000],
      [1202, 72000000],
      [1204, 80000000],
    ],
    ketQua: 'SECOND_CHANCE',
  },
  {
    id: 2003,
    sanPham: 107,
    batDau: -15,
    ketThuc: -12,
    gia: 30000000,
    bids: [
      [1206, 34000000],
      [1208, 38000000],
    ],
    ketQua: 'TRANH_CHAP_DA_XU_LY',
  },
  {
    id: 2004,
    sanPham: 105,
    batDau: -8,
    ketThuc: -5,
    gia: 80000000,
    bids: [
      [1209, 86000000],
      [1203, 90000000],
    ],
    ketQua: 'DANG_TRANH_CHAP',
  },
  {
    id: 2005,
    sanPham: 116,
    batDau: -4,
    ketThuc: -2,
    gia: 2400000000,
    muaNgay: 2800000000,
    bids: [],
    nguoiMuaNgay: 1205,
    ketQua: 'MUA_NGAY',
  },
  {
    id: 2006,
    sanPham: 97,
    batDau: -3,
    ketThuc: -0.04,
    gia: 95000000,
    coc: 9500000,
    bids: [
      [1207, 101000000],
      [1206, 110000000],
    ],
    ketQua: 'CHO_THANH_TOAN',
  },
  {
    id: 2007,
    sanPham: 99,
    batDau: -1,
    ketThuc: 4,
    gia: 1800000000,
    coc: 30000000,
    bids: [
      [1206, 1850000000],
      [1207, 1900000000],
    ],
    ketQua: 'HOAT_DONG',
  },
  {
    id: 2008,
    sanPham: 112,
    batDau: -0.8,
    ketThuc: 3,
    gia: 32000000,
    bids: [
      [1209, 36000000],
      [1210, 36000000],
    ],
    ketQua: 'HOAT_DONG',
  },
  {
    id: 2009,
    sanPham: 118,
    batDau: 2,
    ketThuc: 6,
    gia: 85000000,
    muaNgay: 130000000,
    bids: [],
    ketQua: 'DA_LEN_LICH',
  },
  {
    id: 2010,
    sanPham: 119,
    batDau: -7,
    ketThuc: -3,
    gia: 55000000,
    san: 85000000,
    coc: 5500000,
    bids: [
      [1208, 65000000],
      [1210, 70000000],
    ],
    ketQua: 'THAT_BAI',
  },
];

function nguoiBan(danhMuc) {
  if ([66, 67].includes(Number(danhMuc))) {
    return 1101;
  }
  if ([64, 65].includes(Number(danhMuc))) {
    return 1102;
  }
  if (Number(danhMuc) === 68) {
    return 1103;
  }
  if ([69, 72].includes(Number(danhMuc))) {
    return 1104;
  }

  return 1105;
}

const danhMuc = [
  [64, 'Đồ cổ & Cổ vật'],
  [65, 'Nghệ thuật'],
  [66, 'Đồng hồ cao cấp'],
  [67, 'Trang sức & Đá quý'],
  [68, 'Hàng hiệu hiếm / Phiên bản giới hạn'],
  [69, 'Xe cổ & Phương tiện sưu tầm'],
  [70, 'Sách, Bản thảo & Tài liệu quý hiếm'],
  [71, 'Kỷ vật'],
  [72, 'Nhạc cụ Vintage giá trị cao'],
  [73, 'Máy ảnh cổ & Thiết bị quang học sưu tầm'],
];

module.exports = {
  taiKhoan,
  phien,
  nguoiBan,
  danhMuc,
  matKhauDemo: 'VietBid@2026',
};
