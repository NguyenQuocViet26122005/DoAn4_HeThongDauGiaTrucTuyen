const tepTin = require('node:fs/promises');
const duongDan = require('node:path');
const { randomUUID } = require('node:crypto');
const { cauHinh } = require('../dist/config/moi-truong');
const coSoDuLieu = require('../dist/repositories/ket-noi');
const khoDanhMucSanPham = require('../dist/repositories/danh-muc-san-pham');
const nguoiDungService = require('../dist/services/nguoi-dung');
const danhMucSanPhamService = require('../dist/services/danh-muc-san-pham');
const kiemDinhService = require('../dist/services/kiem-dinh');
const dauGiaService = require('../dist/services/dau-gia');
const datCocService = require('../dist/services/dat-coc');
const donHangService = require('../dist/services/don-hang');
const deNghiService = require('../dist/services/de-nghi-mua-tiep');
const tranhChapService = require('../dist/services/tranh-chap');
const tuongTacService = require('../dist/services/tuong-tac');
const cauHinhService = require('../dist/services/cau-hinh');

const TEN_CSDL = 'doan4_daugia';
const MA_DAU_HIEU = 'SEED_VIETBID_DEMO_V1';
const MAT_KHAU_DEMO = 'VietBidDemo2026!';
const THU_MUC_ANH = duongDan.join(__dirname, '..', 'demo-assets');
const cacTepDaTao = [];

const cacBangCanCo = [
  'cau_hinh_he_thong',
  'danh_gia',
  'danh_muc',
  'dat_coc_dau_gia',
  'de_nghi_mua_tiep_theo',
  'dia_chi_nguoi_dung',
  'don_hang',
  'kiem_dinh_san_pham',
  'luot_tra_gia',
  'nguoi_dung',
  'nhat_ky_hoat_dong',
  'phien_dau_gia',
  'san_pham',
  'tep_dinh_kem',
  'tham_gia_phien',
  'thanh_toan',
  'thong_bao',
  'tranh_chap',
  'vi_pham',
  'xac_minh_nguoi_ban',
  'yeu_cau_xu_ly',
];

const nguoiBanMau = [
  { ten: 'Nguyễn Minh Hoàng', email: 'seller.hoang@demo.vietbid.test' },
  { ten: 'Lê Thu Hà', email: 'seller.ha@demo.vietbid.test' },
  { ten: 'Trần Quốc Vinh', email: 'seller.vinh@demo.vietbid.test' },
  { ten: 'Phạm Ngọc Mai', email: 'seller.mai@demo.vietbid.test' },
  { ten: 'Vũ Quang Minh', email: 'seller.minh@demo.vietbid.test' },
  { ten: 'Đặng Thu Trang', email: 'seller.trang@demo.vietbid.test' },
];

const nguoiMuaMau = [
  { ten: 'Trần Đức Anh', email: 'buyer.duc.anh@demo.vietbid.test' },
  { ten: 'Nguyễn Bảo Ngọc', email: 'buyer.bao.ngoc@demo.vietbid.test' },
  { ten: 'Hoàng Gia Bảo', email: 'buyer.gia.bao@demo.vietbid.test' },
  { ten: 'Phạm Minh Châu', email: 'buyer.minh.chau@demo.vietbid.test' },
  { ten: 'Vũ Hải Nam', email: 'buyer.hai.nam@demo.vietbid.test' },
  { ten: 'Lê Tuấn Kiệt', email: 'buyer.tuan.kiet@demo.vietbid.test' },
  { ten: 'Nguyễn Phương Thảo', email: 'buyer.phuong.thao@demo.vietbid.test' },
  { ten: 'Đỗ Nhật Minh', email: 'buyer.nhat.minh@demo.vietbid.test' },
  { ten: 'Lý Thanh Tâm', email: 'buyer.thanh.tam@demo.vietbid.test' },
  { ten: 'Bùi Ngọc Anh', email: 'buyer.ngoc.anh@demo.vietbid.test' },
  { ten: 'Đặng Quốc Huy', email: 'buyer.quoc.huy@demo.vietbid.test' },
  { ten: 'Cao Thu Hằng', email: 'buyer.thu.hang@demo.vietbid.test' },
  { ten: 'Vũ Quỳnh Anh', email: 'buyer.quynh.anh@demo.vietbid.test' },
  { ten: 'Phan Minh Tùng', email: 'buyer.minh.tung@demo.vietbid.test' },
];

const cacDanhMuc = [
  {
    ten: 'Đồ cổ và cổ vật',
    duongDan: 'do-co-co-vat',
    moTa: 'Cổ vật, đồ cổ có giá trị sưu tầm và hồ sơ nguồn gốc.',
    thuTu: 1,
    thuocTinh: [
      ['nien_dai', 'Niên đại hoặc thời kỳ', 'VAN_BAN', true],
      ['chat_lieu', 'Chất liệu', 'VAN_BAN', true],
      ['nguon_goc', 'Có hồ sơ nguồn gốc', 'DUNG_SAI', true],
    ],
  },
  {
    ten: 'Tranh và tác phẩm nghệ thuật',
    duongDan: 'tranh-tac-pham-nghe-thuat',
    moTa: 'Tác phẩm nguyên bản, có giá trị nghệ thuật hoặc sưu tầm.',
    thuTu: 2,
    thuocTinh: [
      ['tac_gia', 'Tác giả hoặc nghệ sĩ', 'VAN_BAN', true],
      ['chat_lieu', 'Chất liệu và kỹ thuật', 'VAN_BAN', true],
      ['kich_thuoc', 'Kích thước', 'VAN_BAN', true],
      ['nam_sang_tac', 'Năm sáng tác', 'SO', false],
    ],
  },
  {
    ten: 'Đồng hồ cao cấp',
    duongDan: 'dong-ho-cao-cap',
    moTa: 'Đồng hồ cơ hoặc đồng hồ xa xỉ có giá trị sưu tầm.',
    thuTu: 3,
    thuocTinh: [
      ['dong_san_pham', 'Dòng sản phẩm', 'VAN_BAN', true],
      ['ma_tham_chieu', 'Mã tham chiếu', 'VAN_BAN', true],
      ['nam_san_xuat', 'Năm sản xuất', 'SO', false],
      ['hop_va_chung_tu', 'Có hộp và chứng từ', 'DUNG_SAI', true],
    ],
  },
  {
    ten: 'Trang sức và đá quý',
    duongDan: 'trang-suc-da-quy',
    moTa: 'Trang sức, kim cương hoặc đá quý có hồ sơ và giá trị sưu tầm.',
    thuTu: 4,
    thuocTinh: [
      ['kim_loai', 'Kim loại quý', 'VAN_BAN', true],
      ['loai_da', 'Loại đá quý', 'VAN_BAN', true],
      ['trong_luong', 'Trọng lượng', 'SO', true],
      ['chung_thu', 'Có chứng thư giám định', 'DUNG_SAI', true],
    ],
  },
  {
    ten: 'Hàng hiệu hiếm và phiên bản giới hạn',
    duongDan: 'hang-hieu-hiem-phien-ban-gioi-han',
    moTa: 'Túi và phụ kiện xa xỉ hiếm, có dấu hiệu nhận diện nguồn gốc.',
    thuTu: 5,
    thuocTinh: [
      ['dong_san_pham', 'Dòng sản phẩm', 'VAN_BAN', true],
      ['ma_phien_ban', 'Mã hoặc số phiên bản', 'VAN_BAN', false],
      ['nam_phat_hanh', 'Năm phát hành', 'SO', false],
      ['phu_kien_chung_tu', 'Có phụ kiện và chứng từ', 'DUNG_SAI', true],
    ],
  },
  {
    ten: 'Xe cổ và phương tiện sưu tầm',
    duongDan: 'xe-co-phuong-tien-suu-tam',
    moTa: 'Xe cổ, xe giới hạn hoặc phương tiện có giá trị lịch sử.',
    thuTu: 6,
    thuocTinh: [
      ['hang_xe', 'Hãng xe', 'VAN_BAN', true],
      ['dong_xe', 'Dòng xe', 'VAN_BAN', true],
      ['nam_san_xuat', 'Năm sản xuất', 'SO', true],
      ['so_khung', 'Số khung', 'VAN_BAN', true],
    ],
  },
  {
    ten: 'Sách hiếm, bản thảo và tài liệu lịch sử',
    duongDan: 'sach-hiem-ban-thao-tai-lieu-lich-su',
    moTa: 'Ấn bản hiếm, bản thảo hoặc tư liệu có giá trị lịch sử.',
    thuTu: 7,
    thuocTinh: [
      ['tac_gia', 'Tác giả hoặc đơn vị phát hành', 'VAN_BAN', true],
      ['nam_xuat_ban', 'Năm xuất bản hoặc sáng tác', 'SO', true],
      ['an_ban', 'Lần in hoặc ấn bản', 'VAN_BAN', false],
      ['nguon_goc', 'Có hồ sơ nguồn gốc', 'DUNG_SAI', true],
    ],
  },
  {
    ten: 'Kỷ vật và hiện vật sưu tầm',
    duongDan: 'ky-vat-hien-vat-suu-tam',
    moTa: 'Kỷ vật văn hóa, thể thao hoặc lịch sử có nguồn gốc.',
    thuTu: 8,
    thuocTinh: [
      ['su_kien', 'Sự kiện hoặc nhân vật liên quan', 'VAN_BAN', true],
      ['thoi_ky', 'Thời kỳ', 'VAN_BAN', true],
      ['nguon_goc', 'Có hồ sơ nguồn gốc', 'DUNG_SAI', true],
    ],
  },
  {
    ten: 'Nhạc cụ vintage giá trị cao',
    duongDan: 'nhac-cu-vintage-gia-tri-cao',
    moTa: 'Nhạc cụ vintage, phiên bản giới hạn hoặc có giá trị lịch sử.',
    thuTu: 9,
    thuocTinh: [
      ['nha_san_xuat', 'Nhà sản xuất', 'VAN_BAN', true],
      ['dong_san_pham', 'Dòng sản phẩm', 'VAN_BAN', true],
      ['nam_san_xuat', 'Năm sản xuất', 'SO', false],
      ['ma_dinh_danh', 'Mã định danh hoặc số seri', 'VAN_BAN', false],
    ],
  },
  {
    ten: 'Máy ảnh cổ và thiết bị quang học',
    duongDan: 'may-anh-co-thiet-bi-quang-hoc',
    moTa: 'Máy ảnh cơ, ống kính cổ và thiết bị quang học sưu tầm.',
    thuTu: 10,
    thuocTinh: [
      ['he_may', 'Hệ máy', 'VAN_BAN', true],
      ['ma_mau', 'Mã mẫu', 'VAN_BAN', true],
      ['nam_san_xuat', 'Năm sản xuất', 'SO', false],
      ['ong_kinh_kem_theo', 'Có ống kính đi kèm', 'DUNG_SAI', true],
    ],
  },
];

const sanPhamMau = [
  {
    tieuDe: 'Rolex Submariner – hồ sơ sưu tầm 14060M',
    thuongHieu: 'Rolex',
    danhMuc: 'dong-ho-cao-cap',
    nguoiBan: 0,
    anh: 'rolex-submariner.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 280000000,
    giaSan: 320000000,
    giaMuaNgay: 420000000,
    phiVanChuyen: 1500000,
    thuocTinh: {
      dong_san_pham: 'Submariner',
      ma_tham_chieu: '14060M',
      nam_san_xuat: 2007,
      hop_va_chung_tu: true,
    },
    moTa: 'Bản ghi hồ sơ sưu tầm đồng hồ lặn Rolex Submariner ref. 14060M, thép không gỉ, máy cơ tự động. Dữ liệu và tình trạng là dữ liệu học tập VietBid; ảnh tham khảo cùng dòng sản phẩm, không phải ảnh chụp món hàng được rao.',
  },
  {
    tieuDe: 'Omega Speedmaster Schumacher Edition',
    thuongHieu: 'Omega',
    danhMuc: 'dong-ho-cao-cap',
    nguoiBan: 1,
    anh: 'omega-speedmaster-schumacher.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 72000000,
    giaSan: 85000000,
    giaMuaNgay: 108000000,
    phiVanChuyen: 650000,
    thuocTinh: {
      dong_san_pham: 'Speedmaster Schumacher Edition',
      ma_tham_chieu: '3510.61',
      nam_san_xuat: 1996,
      hop_va_chung_tu: true,
    },
    moTa: 'Phiên bản Speedmaster gắn với Michael Schumacher, mặt số đỏ và bộ máy chronograph cơ. Hồ sơ demo ghi nhận có bộ hộp và giấy tờ sưu tầm; ảnh tham khảo cùng phiên bản.',
  },
  {
    tieuDe: 'Rolex Datejust 16013 – thép và vàng vàng',
    thuongHieu: 'Rolex',
    danhMuc: 'dong-ho-cao-cap',
    nguoiBan: 0,
    anh: 'rolex-datejust-16013.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 80000000,
    giaSan: 100000000,
    giaMuaNgay: 125000000,
    phiVanChuyen: 600000,
    thuocTinh: {
      dong_san_pham: 'Datejust',
      ma_tham_chieu: '16013',
      nam_san_xuat: 1984,
      hop_va_chung_tu: true,
    },
    moTa: 'Datejust cổ điển phối thép không gỉ và vàng vàng, vành khía và lịch ngày. Ảnh Wikimedia Commons là ảnh tham khảo mẫu; số liệu còn lại thuộc bản ghi demo.',
  },
  {
    tieuDe: 'Audemars Piguet Royal Oak Offshore',
    thuongHieu: 'Audemars Piguet',
    danhMuc: 'dong-ho-cao-cap',
    nguoiBan: 2,
    anh: 'audemars-piguet-royal-oak.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 480000000,
    giaSan: 540000000,
    giaMuaNgay: 650000000,
    phiVanChuyen: 900000,
    thuocTinh: {
      dong_san_pham: 'Royal Oak Offshore',
      ma_tham_chieu: '25721ST',
      nam_san_xuat: 2004,
      hop_va_chung_tu: true,
    },
    moTa: 'Đồng hồ thể thao cao cấp với vành bát giác, ốc lộ và dây cao su. Ảnh chỉ minh họa dòng Royal Oak Offshore, không xác nhận tình trạng một chiếc đồng hồ cụ thể.',
  },
  {
    tieuDe: 'Patek Philippe Nautilus 5711/1A',
    thuongHieu: 'Patek Philippe',
    danhMuc: 'dong-ho-cao-cap',
    nguoiBan: 3,
    anh: 'patek-philippe-nautilus-5711.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 760000000,
    giaSan: 850000000,
    giaMuaNgay: 1050000000,
    phiVanChuyen: 1000000,
    thuocTinh: {
      dong_san_pham: 'Nautilus',
      ma_tham_chieu: '5711/1A',
      nam_san_xuat: 2019,
      hop_va_chung_tu: true,
    },
    moTa: 'Nautilus 5711/1A với vỏ thép và mặt số xanh. Nguồn ảnh Commons là bản minh họa kỹ thuật của mẫu; thông tin giao dịch là bản ghi học tập, không phải xác nhận tài sản thật.',
  },
  {
    tieuDe: 'Nhẫn kim cương solitaire – vàng trắng 18K',
    thuongHieu: 'Trang sức sưu tầm',
    danhMuc: 'trang-suc-da-quy',
    nguoiBan: 4,
    anh: 'nhan-kim-cuong-solitaire.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 60000000,
    giaSan: 75000000,
    phiVanChuyen: 350000,
    thuocTinh: {
      kim_loai: 'Vàng trắng 18K',
      loai_da: 'Kim cương solitaire',
      trong_luong: 1.2,
      chung_thu: true,
    },
    moTa: 'Nhẫn solitaire vàng trắng, thiết kế tập trung vào viên kim cương chủ. Hồ sơ mẫu yêu cầu chứng thư giám định; ảnh Commons minh họa kiểu nhẫn, không đại diện viên đá cụ thể.',
  },
  {
    tieuDe: 'Nhẫn sapphire cổ khoảng năm 1940',
    thuongHieu: 'Trang sức sưu tầm',
    danhMuc: 'trang-suc-da-quy',
    nguoiBan: 4,
    anh: 'nhan-sapphire-co.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 95000000,
    giaSan: 120000000,
    phiVanChuyen: 350000,
    thuocTinh: {
      kim_loai: 'Vàng',
      loai_da: 'Sapphire xanh',
      trong_luong: 4.1,
      chung_thu: true,
    },
    moTa: 'Nhẫn sapphire cổ với viên đá xanh cắt oval, ảnh tham khảo do Stanislav Doronenko cung cấp. Thông tin trọng lượng và giấy tờ chỉ thuộc bản ghi demo.',
  },
  {
    tieuDe: 'Tinh thể ruby thô – mẫu sưu tầm khoáng vật',
    thuongHieu: 'Khoáng vật sưu tầm',
    danhMuc: 'trang-suc-da-quy',
    nguoiBan: 5,
    anh: 'mau-ruby-tho.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 50000000,
    giaSan: 65000000,
    phiVanChuyen: 300000,
    thuocTinh: {
      kim_loai: 'Khoáng vật tự nhiên',
      loai_da: 'Ruby tinh thể',
      trong_luong: 82.5,
      chung_thu: true,
    },
    moTa: 'Mẫu ruby tinh thể thô dành cho người sưu tầm khoáng vật. Cân nặng và hồ sơ nguồn gốc là dữ liệu ví dụ; ảnh chỉ minh họa tinh thể ruby.',
  },
  {
    tieuDe: 'Tinh thể emerald trên nền đá mẹ Muzo',
    thuongHieu: 'Khoáng vật sưu tầm',
    danhMuc: 'trang-suc-da-quy',
    nguoiBan: 5,
    anh: 'mau-emerald-tren-da.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 70000000,
    giaSan: 95000000,
    phiVanChuyen: 300000,
    thuocTinh: {
      kim_loai: 'Khoáng vật tự nhiên',
      loai_da: 'Emerald trên đá mẹ',
      trong_luong: 116.0,
      chung_thu: true,
    },
    moTa: 'Tinh thể emerald trên nền đá mẹ, hình ảnh nguồn Commons được gắn CC0. Thông tin mẫu không thay cho kết quả giám định đá quý.',
  },
  {
    tieuDe: 'Tranh sơn mài “Phong cảnh Việt Nam” – Hoàng Tích Chù',
    thuongHieu: 'Mỹ thuật Việt Nam',
    danhMuc: 'tranh-tac-pham-nghe-thuat',
    nguoiBan: 3,
    anh: 'tranh-son-mai-hoang-tich-chu.webp',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 250000000,
    giaSan: 300000000,
    phiVanChuyen: 1800000,
    thuocTinh: {
      tac_gia: 'Hoàng Tích Chù',
      chat_lieu: 'Sơn mài trên vóc',
      kich_thuoc: 'Ảnh tham khảo 1920 × 2536 px',
      nam_sang_tac: 1955,
    },
    moTa: 'Tác phẩm sơn mài Việt Nam năm 1955 của họa sĩ Hoàng Tích Chù. Ảnh Commons thuộc phạm vi công cộng; tiêu đề và giao dịch trong hệ thống chỉ là dữ liệu trình bày.',
  },
  {
    tieuDe: 'Bình phong sơn mài “Thiếu nữ và phong cảnh”',
    thuongHieu: 'Mỹ thuật Việt Nam',
    danhMuc: 'tranh-tac-pham-nghe-thuat',
    nguoiBan: 3,
    anh: 'binh-phong-son-mai-nguyen-gia-tri.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 950000000,
    giaSan: 1150000000,
    phiVanChuyen: 2500000,
    thuocTinh: {
      tac_gia: 'Nguyễn Gia Trí',
      chat_lieu: 'Bình phong sơn mài',
      kich_thuoc: 'Bình phong nhiều tấm',
      nam_sang_tac: 1940,
    },
    moTa: 'Bình phong sơn mài gắn với họa sĩ Nguyễn Gia Trí, một dòng tác phẩm có giá trị lịch sử mỹ thuật. Ảnh front-side trên Commons là ảnh tham khảo; hồ sơ demo trình bày cả luồng tranh chấp sau giao hàng.',
  },
  {
    tieuDe: 'Tượng đồng “Victorious Youth” – ảnh tư liệu Getty',
    thuongHieu: 'Cổ vật Hy Lạp',
    danhMuc: 'do-co-co-vat',
    nguoiBan: 1,
    anh: 'tuong-victorious-youth-getty.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 500000000,
    giaSan: 600000000,
    phiVanChuyen: 2200000,
    thuocTinh: {
      nien_dai: 'Hy Lạp cổ đại, khoảng thế kỷ IV TCN',
      chat_lieu: 'Đồng',
      nguon_goc: true,
    },
    moTa: 'Ảnh tư liệu của tượng Victorious Youth trong bộ sưu tập J. Paul Getty Museum, được phát hành CC0. Không phải hiện vật Getty đang được rao trên VietBid.',
  },
  {
    tieuDe: 'Bộ bình sứ Limoges – bộ sưu tập tư nhân',
    thuongHieu: 'Limoges',
    danhMuc: 'do-co-co-vat',
    nguoiBan: 2,
    anh: 'lo-limoges-co.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 42000000,
    giaSan: 55000000,
    phiVanChuyen: 450000,
    thuocTinh: {
      nien_dai: 'Cuối thế kỷ XIX – đầu thế kỷ XX',
      chat_lieu: 'Sứ Limoges',
      nguon_goc: true,
    },
    moTa: 'Bộ bình sứ Limoges được dùng trong câu chuyện xử lý tranh chấp hàng dễ vỡ. Ảnh do Rabbi Mendl chia sẻ theo CC BY-SA 4.0, chỉ minh họa nhóm hiện vật.',
  },
  {
    tieuDe: 'Bình sứ xanh trắng thời Minh – tư liệu bảo tàng',
    thuongHieu: 'Gốm sứ sưu tầm',
    danhMuc: 'do-co-co-vat',
    nguoiBan: 5,
    anh: 'binh-su-minh-aberdeen.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 220000000,
    giaSan: 260000000,
    phiVanChuyen: 1800000,
    thuocTinh: {
      nien_dai: 'Thời Minh, đầu thế kỷ XV',
      chat_lieu: 'Sứ men xanh trắng',
      nguon_goc: true,
    },
    moTa: 'Ảnh tư liệu bình sứ trong bộ sưu tập Aberdeen City Council Museums, phát hành phạm vi công cộng. Mẫu vật và giá trị ghi trong VietBid là dữ liệu minh họa.',
  },
  {
    tieuDe: 'Đồng hồ để bàn Vienna – vỏ gỗ chạm',
    thuongHieu: 'Vienna',
    danhMuc: 'do-co-co-vat',
    nguoiBan: 1,
    anh: 'dong-ho-de-ban-vienna.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 50000000,
    giaSan: 65000000,
    phiVanChuyen: 600000,
    thuocTinh: {
      nien_dai: 'Đầu thế kỷ XX',
      chat_lieu: 'Gỗ và kim loại',
      nguon_goc: true,
    },
    moTa: 'Đồng hồ để bàn phong cách Vienna với vỏ gỗ và mặt số cổ điển. Ảnh được Jorge Royan cấp phép CC BY-SA 3.0, dùng làm tư liệu tham khảo.',
  },
  {
    tieuDe: 'Bình đồng Zun – đồ đồng thời Thương cuối',
    thuongHieu: 'Đồ đồng cổ',
    danhMuc: 'do-co-co-vat',
    nguoiBan: 2,
    anh: 'binh-dong-zun.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 620000000,
    giaSan: 750000000,
    phiVanChuyen: 1800000,
    thuocTinh: {
      nien_dai: 'Cuối thời Thương – đầu Tây Chu, khoảng thế kỷ XI TCN',
      chat_lieu: 'Đồng đúc',
      nguon_goc: true,
    },
    moTa: 'Ảnh tư liệu bình đồng Zun thời Thương – Chu do Gary Todd chụp, giấy phép CC0. Ảnh không phải hiện vật cụ thể được bán trong bản demo.',
  },
  {
    tieuDe: 'Máy đánh chữ cơ cổ – sưu tầm văn phòng phẩm',
    thuongHieu: 'Máy cơ sưu tầm',
    danhMuc: 'ky-vat-hien-vat-suu-tam',
    nguoiBan: 2,
    anh: 'may-danh-chu-co.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 12000000,
    giaSan: 18000000,
    phiVanChuyen: 450000,
    thuocTinh: {
      su_kien: 'Lịch sử văn phòng và xuất bản',
      thoi_ky: 'Giữa thế kỷ XX',
      nguon_goc: true,
    },
    moTa: 'Máy đánh chữ cơ làm ví dụ cho hiện vật văn phòng có giá trị lịch sử. Ảnh do Kjoonlee chia sẻ theo CC BY 4.0; cấu hình và giao dịch là dữ liệu demo.',
  },
  {
    tieuDe: 'Leica M3 – máy ảnh rangefinder sưu tầm',
    thuongHieu: 'Leica',
    danhMuc: 'may-anh-co-thiet-bi-quang-hoc',
    nguoiBan: 2,
    anh: 'leica-m3.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 45000000,
    giaSan: 60000000,
    phiVanChuyen: 550000,
    thuocTinh: {
      he_may: 'Leica M',
      ma_mau: 'M3',
      nam_san_xuat: 1957,
      ong_kinh_kem_theo: true,
    },
    moTa: 'Leica M3 là máy ảnh rangefinder cơ được giới sưu tầm quan tâm. Ảnh của Rama theo CC BY-SA 2.0 France, chỉ minh họa kiểu máy.',
  },
  {
    tieuDe: 'Đồng bạc 1 Piastre Đông Dương năm 1928',
    thuongHieu: 'Tiền cổ Đông Dương',
    danhMuc: 'ky-vat-hien-vat-suu-tam',
    nguoiBan: 0,
    anh: 'dong-piastre-dong-duong-1928.png',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 6000000,
    giaSan: 8000000,
    phiVanChuyen: 250000,
    thuocTinh: {
      su_kien: 'Phát hành tiền tệ Đông Dương thuộc Pháp',
      thoi_ky: '1928',
      nguon_goc: true,
    },
    moTa: 'Đồng bạc piastre phát hành tại Đông Dương năm 1928, thuộc nhóm tiền tệ thuộc địa được người chơi tiền cổ sưu tầm. Hình Commons minh họa mặt xu.',
  },
  {
    tieuDe: 'Tem Đông Dương 5 cent năm 1889',
    thuongHieu: 'Tem bưu chính Đông Dương',
    danhMuc: 'ky-vat-hien-vat-suu-tam',
    nguoiBan: 5,
    anh: 'tem-dong-duong-1889.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 2000000,
    giaSan: 3000000,
    phiVanChuyen: 150000,
    thuocTinh: {
      su_kien: 'Bưu chính Pháp tại Đông Dương',
      thoi_ky: '1889',
      nguon_goc: true,
    },
    moTa: 'Ảnh scan tem 5 cent Đông Dương năm 1889, tác giả bản scan chưa xác định, nguồn Wikimedia Commons ghi phạm vi công cộng. Bản ghi dùng để minh họa lịch sử đấu giá.',
  },
  {
    tieuDe: 'Thẻ bóng chày Cal Hubbard – Bowman',
    thuongHieu: 'Bowman',
    danhMuc: 'ky-vat-hien-vat-suu-tam',
    nguoiBan: 4,
    anh: 'the-bong-chay-cal-hubbard.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 8000000,
    giaSan: 12000000,
    phiVanChuyen: 250000,
    thuocTinh: {
      su_kien: 'Bộ thẻ thể thao Bowman',
      thoi_ky: 'Thế kỷ XX',
      nguon_goc: true,
    },
    moTa: 'Thẻ thể thao Bowman gắn với Cal Hubbard, ảnh nguồn được đánh dấu phạm vi công cộng. Mô tả và tình trạng thẻ là dữ liệu của hồ sơ trình diễn.',
  },
  {
    tieuDe: 'Mercedes-Benz 280 SL “Pagoda”',
    thuongHieu: 'Mercedes-Benz',
    danhMuc: 'xe-co-phuong-tien-suu-tam',
    nguoiBan: 5,
    anh: 'mercedes-280sl-pagode.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 2200000000,
    giaSan: 2600000000,
    giaMuaNgay: 3100000000,
    phiVanChuyen: 12000000,
    thuocTinh: {
      hang_xe: 'Mercedes-Benz',
      dong_xe: '280 SL Pagoda',
      nam_san_xuat: 1969,
      so_khung: 'DEMO-W113-1969-001',
    },
    moTa: 'Mercedes-Benz 280 SL W113 “Pagoda”, dòng roadster sưu tầm của thập niên 1960. Ảnh do Clemens Vasters chia sẻ theo CC BY 2.0; đây không phải chiếc xe đang được rao thực tế.',
  },
  {
    tieuDe: 'Túi Hermès Birkin màu hồng – ảnh bộ sưu tập',
    thuongHieu: 'Hermès',
    danhMuc: 'hang-hieu-hiem-phien-ban-gioi-han',
    nguoiBan: 1,
    anh: 'tui-birkin-hong.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 420000000,
    giaSan: 480000000,
    giaMuaNgay: 590000000,
    phiVanChuyen: 1000000,
    thuocTinh: {
      dong_san_pham: 'Birkin',
      ma_phien_ban: 'Demo-Birkin-30-Pink',
      nam_phat_hanh: 2018,
      phu_kien_chung_tu: true,
    },
    moTa: 'Túi Birkin màu hồng trong ảnh tư liệu của Yvette Religioso-Ilagan, giấy phép CC BY 2.0. Ảnh chỉ dùng tham khảo kiểu dáng, không xác nhận nguồn gốc một chiếc túi cụ thể.',
  },
  {
    tieuDe: 'Đàn violin cổ điển – bộ sưu tập nhạc cụ',
    thuongHieu: 'Nhạc cụ dây',
    danhMuc: 'nhac-cu-vintage-gia-tri-cao',
    nguoiBan: 4,
    anh: 'dan-violin.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 120000000,
    giaSan: 150000000,
    phiVanChuyen: 850000,
    thuocTinh: {
      nha_san_xuat: 'Xưởng thủ công châu Âu (bản ghi demo)',
      dong_san_pham: 'Violin cổ điển',
      nam_san_xuat: 1920,
      ma_dinh_danh: 'DEMO-VIOLIN-1920-01',
    },
    moTa: 'Nhạc cụ violin minh họa cho phân khúc nhạc cụ vintage; ảnh do Marko Milivojevic phát hành CC0. Nguồn gốc và năm sản xuất trong hồ sơ không đại diện hiện vật thật.',
  },
  {
    tieuDe: 'Fender Stratocaster – cây đàn vintage sưu tầm',
    thuongHieu: 'Fender',
    danhMuc: 'nhac-cu-vintage-gia-tri-cao',
    nguoiBan: 0,
    anh: 'fender-stratocaster.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 100000000,
    giaSan: 130000000,
    phiVanChuyen: 700000,
    thuocTinh: {
      nha_san_xuat: 'Fender',
      dong_san_pham: 'Stratocaster',
      nam_san_xuat: 1965,
      ma_dinh_danh: 'DEMO-FENDER-1965-01',
    },
    moTa: 'Fender Stratocaster thuộc nhóm guitar điện có lịch sử lâu đời. Tư liệu ảnh Commons được đánh dấu phạm vi công cộng; số sê-ri và tình trạng là ví dụ.',
  },
  {
    tieuDe: 'Gibson Les Paul 1952 – ảnh nhạc cụ sưu tầm',
    thuongHieu: 'Gibson',
    danhMuc: 'nhac-cu-vintage-gia-tri-cao',
    nguoiBan: 2,
    anh: 'gibson-les-paul-1952.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 1350000000,
    giaSan: 1600000000,
    phiVanChuyen: 1800000,
    thuocTinh: {
      nha_san_xuat: 'Gibson',
      dong_san_pham: 'Les Paul',
      nam_san_xuat: 1952,
      ma_dinh_danh: 'DEMO-LES-PAUL-1952-01',
    },
    moTa: 'Guitar Gibson Les Paul 1952 trong ảnh của John Seb Barber, cấp phép CC BY 2.0. Hồ sơ demo không đại diện cây đàn thật trong ảnh.',
  },
  {
    tieuDe: 'Sách Pantagruel – bản in đầu thế kỷ XVI',
    thuongHieu: 'Sách cổ',
    danhMuc: 'sach-hiem-ban-thao-tai-lieu-lich-su',
    nguoiBan: 1,
    anh: 'sach-pantagruel-ban-in-dau.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 18000000,
    giaSan: 25000000,
    phiVanChuyen: 300000,
    thuocTinh: {
      tac_gia: 'François Rabelais',
      nam_xuat_ban: 1548,
      an_ban: 'Bản số hóa trang đầu của ấn bản cổ',
      nguon_goc: true,
    },
    moTa: 'Ảnh trang đầu từ bản số hóa sách cổ về Pantagruel, tác phẩm François Rabelais. Ảnh trang được trích từ bản PDF lưu trữ; không phải cuốn sách vật lý đang được bán.',
  },
  {
    tieuDe: 'Bình phong chạm ngọc – tư liệu Jordan Schnitzer Museum',
    thuongHieu: 'Ngọc điêu khắc',
    danhMuc: 'do-co-co-vat',
    nguoiBan: 3,
    anh: 'thap-ngoc-jade-pagoda.jpg',
    tinhTrang: 'DA_QUA_SU_DUNG_TOT',
    giaKhoiDiem: 900000000,
    giaSan: 1100000000,
    phiVanChuyen: 2200000,
    thuocTinh: {
      nien_dai: 'Khoảng năm 1711',
      chat_lieu: 'Ngọc điêu khắc',
      nguon_goc: true,
    },
    moTa: 'Ảnh tháp ngọc trưng bày tại Jordan Schnitzer Museum of Art, nguồn Commons ghi phạm vi công cộng. Hiện vật bảo tàng không thuộc lô hàng VietBid.',
  },
];

const vitriDanhMuc = new Map([
  ['do-co-co-vat', 'nien_dai'],
  ['tranh-tac-pham-nghe-thuat', 'tac_gia'],
  ['dong-ho-cao-cap', 'dong_san_pham'],
  ['trang-suc-da-quy', 'kim_loai'],
  ['hang-hieu-hiem-phien-ban-gioi-han', 'dong_san_pham'],
  ['xe-co-phuong-tien-suu-tam', 'hang_xe'],
  ['sach-hiem-ban-thao-tai-lieu-lich-su', 'tac_gia'],
  ['ky-vat-hien-vat-suu-tam', 'su_kien'],
  ['nhac-cu-vintage-gia-tri-cao', 'nha_san_xuat'],
  ['may-anh-co-thiet-bi-quang-hoc', 'he_may'],
]);

function taoNguoiDungDangNhap(id, vaiTro = 'NGUOI_DUNG') {
  return {
    id: String(id),
    vai_tro: vaiTro,
    trang_thai_nguoi_ban: vaiTro === 'NGUOI_DUNG' ? 'DA_XAC_MINH' : 'CHUA_DANG_KY',
    trang_thai_tai_khoan: 'HOAT_DONG',
  };
}

function soTien(gia) {
  return `${gia}.00`;
}

function moTaSanPhamDemo(moTa) {
  const ghiChu =
    'Dữ liệu học tập VietBid; ảnh Wikimedia Commons chỉ để tham khảo, không phải ảnh chụp lô hàng đang rao.';

  return `${moTa}\n\n${ghiChu}`;
}

function maHoaPDF(chuoi) {
  return chuoi
    .replaceAll('đ', 'd')
    .replaceAll('Đ', 'D')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)');
}

function taoPDFMinhHoa(tieuDe, maHoSo) {
  const cacDong = [
    'VIETBID - TAI LIEU KIEM DINH DEMO',
    'TAI LIEU MAU, KHONG PHAI CHUNG NHAN THUC TE.',
    'Khong xac nhan nguon goc hoac tinh trang mot tai san ngoai doi.',
    '',
    `San pham minh hoa: ${tieuDe}`,
    `Ma ho so: ${maHoSo}`,
    'Muc dich: trinh dien luong tiep nhan, kiem tra, luu giu tren VietBid.',
    'Ket qua trong CSDL la du lieu demo de xem quy trinh giao dich.',
  ];
  const noiDung = [
    'BT',
    '/F1 16 Tf',
    '50 780 Td',
    ...cacDong.flatMap((dong, chiSo) => [
      ...(chiSo ? ['0 -24 Td'] : []),
      `/F1 ${chiSo < 2 ? 12 : 11} Tf`,
      `(${maHoaPDF(dong)}) Tj`,
    ]),
    'ET',
  ].join('\n');
  const cacDoiTuong = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(noiDung, 'ascii')} >>\nstream\n${noiDung}\nendstream`,
  ];
  let noiDungPDF = '%PDF-1.4\n';
  const cacViTri = [0];

  for (const [chiSo, doiTuong] of cacDoiTuong.entries()) {
    cacViTri.push(Buffer.byteLength(noiDungPDF, 'ascii'));
    noiDungPDF += `${chiSo + 1} 0 obj\n${doiTuong}\nendobj\n`;
  }

  const viTriBangXref = Buffer.byteLength(noiDungPDF, 'ascii');

  noiDungPDF += `xref\n0 ${cacViTri.length}\n0000000000 65535 f \n`;
  for (const viTri of cacViTri.slice(1)) {
    noiDungPDF += `${String(viTri).padStart(10, '0')} 00000 n \n`;
  }
  noiDungPDF += `trailer\n<< /Size ${cacViTri.length} /Root 1 0 R >>\nstartxref\n${viTriBangXref}\n%%EOF`;

  return Buffer.from(noiDungPDF, 'ascii');
}

async function luuTepTaiLen(nhom, chuSoHuu, noiDung, phanMoRong) {
  const ten = `${randomUUID()}.${phanMoRong}`;
  const thuMuc = duongDan.join(cauHinh.uploadRoot, nhom, String(chuSoHuu));
  const dich = duongDan.join(thuMuc, ten);

  await tepTin.mkdir(thuMuc, { recursive: true });
  if (Buffer.isBuffer(noiDung)) {
    await tepTin.writeFile(dich, noiDung, { flag: 'wx' });
  } else {
    await tepTin.copyFile(noiDung, dich);
  }
  cacTepDaTao.push(dich);

  return `/api/uploads/files/${nhom}/${chuSoHuu}/${ten}`;
}

async function thoiGianSQL(soGiayTuBayGio) {
  const dong = await coSoDuLieu.layMot(
    "SELECT DATE_FORMAT(DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? SECOND), '%Y-%m-%d %H:%i:%s') AS thoi_gian",
    [soGiayTuBayGio],
  );

  return `${dong.thoi_gian.replace(' ', 'T')}${cauHinh.dbTimezone}`;
}

async function kiemTraMoiTruong() {
  if (process.env.DB_NAME !== TEN_CSDL) {
    throw new Error('Chỉ cho phép chạy seed trên CSDL doan4_daugia.');
  }

  const coSoDuLieuDangDung = await coSoDuLieu.layMot('SELECT DATABASE() AS ten');

  if (coSoDuLieuDangDung?.ten !== TEN_CSDL) {
    throw new Error('Kết nối hiện tại không trỏ tới CSDL doan4_daugia.');
  }

  const cacBang = await coSoDuLieu.truyVan(
    "SELECT table_name FROM information_schema.tables WHERE table_schema=DATABASE() AND table_type='BASE TABLE' ORDER BY table_name",
  );
  const danhSachBang = cacBang.map((bang) => bang.TABLE_NAME || bang.table_name).sort();

  if (
    danhSachBang.length !== cacBangCanCo.length ||
    danhSachBang.some((ten, chiSo) => ten !== [...cacBangCanCo].sort()[chiSo])
  ) {
    throw new Error('CSDL không khớp bộ 21 bảng VietBid đã kiểm tra; dừng để tránh ghi nhầm.');
  }

  const daTungChay = await coSoDuLieu.layMot(
    'SELECT id FROM nhat_ky_hoat_dong WHERE ma_yeu_cau=?',
    [MA_DAU_HIEU],
  );

  if (daTungChay) {
    return { daTungChay: true };
  }

  const cacEmail = [...nguoiBanMau, ...nguoiMuaMau].map((nguoi) => nguoi.email);
  const daTonTaiEmail = await coSoDuLieu.layMot(
    `SELECT email FROM nguoi_dung WHERE email IN (${cacEmail.map(() => '?').join(',')}) LIMIT 1`,
    cacEmail,
  );

  if (daTonTaiEmail) {
    throw new Error('Đã có email demo trong CSDL nhưng chưa có dấu hoàn tất; không tự ghi đè.');
  }

  const cacSoDienThoai = [
    ...nguoiBanMau.map((_, chiSo) => `0987${String(100000 + chiSo).slice(-6)}`),
    ...nguoiMuaMau.map((_, chiSo) => `0987${String(100100 + chiSo).slice(-6)}`),
  ];
  const soDienThoaiDaTonTai = await coSoDuLieu.layMot(
    `SELECT COUNT(*) AS so_luong FROM nguoi_dung
     WHERE so_dien_thoai IN (${cacSoDienThoai.map(() => '?').join(',')})`,
    cacSoDienThoai,
  );

  if (Number(soDienThoaiDaTonTai.so_luong) > 0) {
    throw new Error('Một số số điện thoại demo đã được dùng; không tự sửa hồ sơ hiện có.');
  }

  const quanTri = await coSoDuLieu.layMot(
    "SELECT id FROM nguoi_dung WHERE vai_tro='QUAN_TRI' LIMIT 1",
  );

  if (!quanTri) {
    throw new Error('CSDL không có tài khoản Admin để duyệt dữ liệu demo.');
  }

  const chinhSachCoc = await coSoDuLieu.layMot(
    "SELECT gia_tri_cau_hinh FROM cau_hinh_he_thong WHERE khoa_cau_hinh='DEPOSIT_POLICY'",
  );

  if (!chinhSachCoc) {
    throw new Error('Thiếu cấu hình DEPOSIT_POLICY trong CSDL; không tự tạo cấu hình mới.');
  }

  try {
    JSON.parse(chinhSachCoc.gia_tri_cau_hinh);
  } catch {
    throw new Error('Cấu hình DEPOSIT_POLICY không phải JSON hợp lệ; dừng trước khi ghi dữ liệu.');
  }

  const cacDanhMucDaCo = await coSoDuLieu.truyVan(
    `SELECT duong_dan,ten,mo_ta,dang_hoat_dong,thu_tu,cau_hinh_thuoc_tinh,yeu_cau_kiem_dinh
     FROM danh_muc
     WHERE duong_dan IN (${cacDanhMuc.map(() => '?').join(',')})`,
    cacDanhMuc.map((danhMuc) => danhMuc.duongDan),
  );

  for (const danhMucHienCo of cacDanhMucDaCo) {
    const danhMucMau = cacDanhMuc.find((danhMuc) => danhMuc.duongDan === danhMucHienCo.duong_dan);
    const cauHinhHienTai =
      typeof danhMucHienCo.cau_hinh_thuoc_tinh === 'string'
        ? JSON.parse(danhMucHienCo.cau_hinh_thuoc_tinh)
        : danhMucHienCo.cau_hinh_thuoc_tinh;
    const cauHinhPhuHop =
      danhMucHienCo.ten === danhMucMau.ten &&
      danhMucHienCo.mo_ta === danhMucMau.moTa &&
      Number(danhMucHienCo.dang_hoat_dong) === 1 &&
      Number(danhMucHienCo.thu_tu) === danhMucMau.thuTu &&
      Number(danhMucHienCo.yeu_cau_kiem_dinh) === 1 &&
      JSON.stringify(cauHinhHienTai) === JSON.stringify(taoCauHinhThuocTinh(danhMucMau.thuocTinh));

    if (!cauHinhPhuHop) {
      throw new Error(
        `Danh mục "${danhMucMau.duongDan}" đã tồn tại với cấu hình khác; seed không tự sửa danh mục đang dùng.`,
      );
    }
  }

  for (const sanPham of sanPhamMau) {
    await tepTin.access(duongDan.join(THU_MUC_ANH, sanPham.anh));
  }
  await tepTin.access(duongDan.join(THU_MUC_ANH, 'anh-minh-hoa-buu-kien-hu-hong.jpg'));

  return { daTungChay: false };
}

async function taoTaiKhoanMau(danhSach, laNguoiBan, quanTri) {
  const ketQua = [];
  const maDauSo = laNguoiBan ? 0 : 100;

  for (const [chiSo, nguoi] of danhSach.entries()) {
    const soDienThoai = `0987${String(100000 + maDauSo + chiSo).slice(-6)}`;
    const duLieu = await nguoiDungService.dangKy({
      ho_ten: nguoi.ten,
      email: nguoi.email,
      mat_khau: MAT_KHAU_DEMO,
      so_dien_thoai: soDienThoai,
    });
    const id = String(duLieu.id);
    const taiKhoan = taoNguoiDungDangNhap(id);

    await nguoiDungService.luuDiaChi(taiKhoan, null, {
      ten_nguoi_nhan: nguoi.ten,
      sdt_nguoi_nhan: soDienThoai,
      tinh_thanh: nguoi.tinhThanh || ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Huế'][chiSo % 4],
      quan_huyen: ['Ba Đình', 'Cầu Giấy', 'Hải Châu', 'Quận 3'][chiSo % 4],
      phuong_xa: ['Phường 1', 'Phường 5', 'Phường 7', 'Phường An Hải'][chiSo % 4],
      dia_chi_chi_tiet: `${12 + chiSo} ${['Trần Hưng Đạo', 'Lê Lợi', 'Nguyễn Huệ', 'Phan Đình Phùng'][chiSo % 4]}`,
      la_mac_dinh: true,
    });

    if (laNguoiBan) {
      const hoSoId = await coSoDuLieu.truyVan(
        `INSERT INTO xac_minh_nguoi_ban
          (nguoi_dung_id,loai_giay_to,so_giay_to,ten_ngan_hang,so_tai_khoan,chu_tai_khoan,trang_thai)
         VALUES (?,'KHAC',?,'VietBid Demo',?,?, 'CHO_XU_LY')`,
        [
          id,
          `DEMO-VB-${String(chiSo + 1).padStart(3, '0')}`,
          `DEMO-${String(chiSo + 1).padStart(6, '0')}`,
          nguoi.ten,
        ],
      );

      await nguoiDungService.duyetXacMinh(quanTri, String(hoSoId.insertId), {
        trang_thai: 'DA_XAC_MINH',
      });
      await coSoDuLieu.truyVan(
        `UPDATE nguoi_dung
         SET ngay_xac_minh_email=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 90 DAY),
             ngay_tao=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 110 DAY),
             ngay_cap_nhat=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 80 DAY)
         WHERE id=?`,
        [id],
      );
      await coSoDuLieu.truyVan(
        `UPDATE xac_minh_nguoi_ban
         SET ngay_gui_ho_so=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 100 DAY),
             ngay_duyet=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 98 DAY)
         WHERE id=?`,
        [hoSoId.insertId],
      );
    } else {
      await coSoDuLieu.truyVan(
        `UPDATE nguoi_dung
         SET ngay_xac_minh_email=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 75 DAY),
             ngay_tao=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 85 DAY),
             ngay_cap_nhat=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 70 DAY)
         WHERE id=?`,
        [id],
      );
    }

    ketQua.push({
      ...nguoi,
      id,
      taiKhoan,
    });
  }

  return ketQua;
}

function taoCauHinhThuocTinh(cacThuocTinh) {
  return cacThuocTinh.map(([khoa, ten, kieu, batBuoc], thuTu) => ({
    id: thuTu + 1,
    ten,
    khoa,
    kieu,
    bat_buoc: batBuoc,
    thu_tu: thuTu,
  }));
}

async function taoDanhMuc() {
  for (const danhMuc of cacDanhMuc) {
    const danhMucHienCo = await coSoDuLieu.layMot(
      `SELECT id,ten,mo_ta,dang_hoat_dong,thu_tu,cau_hinh_thuoc_tinh,yeu_cau_kiem_dinh
       FROM danh_muc
       WHERE duong_dan=?`,
      [danhMuc.duongDan],
    );
    const cauHinhThuocTinh = taoCauHinhThuocTinh(danhMuc.thuocTinh);

    if (danhMucHienCo) {
      const cauHinhHienTai =
        typeof danhMucHienCo.cau_hinh_thuoc_tinh === 'string'
          ? JSON.parse(danhMucHienCo.cau_hinh_thuoc_tinh)
          : danhMucHienCo.cau_hinh_thuoc_tinh;
      const cauHinhPhuHop =
        danhMucHienCo.ten === danhMuc.ten &&
        danhMucHienCo.mo_ta === danhMuc.moTa &&
        Number(danhMucHienCo.dang_hoat_dong) === 1 &&
        Number(danhMucHienCo.thu_tu) === danhMuc.thuTu &&
        Number(danhMucHienCo.yeu_cau_kiem_dinh) === 1 &&
        JSON.stringify(cauHinhHienTai) === JSON.stringify(cauHinhThuocTinh);

      if (!cauHinhPhuHop) {
        throw new Error(
          `Danh mục "${danhMuc.duongDan}" đã tồn tại với cấu hình khác; seed không tự sửa danh mục đang dùng.`,
        );
      }

      continue;
    }

    await coSoDuLieu.truyVan(
      `INSERT INTO danh_muc
        (danh_muc_cha_id,ten,duong_dan,mo_ta,dang_hoat_dong,thu_tu,cau_hinh_thuoc_tinh,yeu_cau_kiem_dinh)
       VALUES (NULL,?,?,?,1,?,?,1)`,
      [
        danhMuc.ten,
        danhMuc.duongDan,
        danhMuc.moTa,
        danhMuc.thuTu,
        JSON.stringify(cauHinhThuocTinh),
      ],
    );
  }

  const cacHang = await coSoDuLieu.truyVan(
    `SELECT id,duong_dan FROM danh_muc WHERE duong_dan IN (${cacDanhMuc.map(() => '?').join(',')})`,
    cacDanhMuc.map((danhMuc) => danhMuc.duongDan),
  );

  return new Map(cacHang.map((hang) => [hang.duong_dan, String(hang.id)]));
}

async function taoHoSoKiemDinh(quanTri, nguoiBan, sanPham, chiSo) {
  const hoSo = await kiemDinhService.tao(quanTri, sanPham.id);

  await kiemDinhService.guiTrungTam(nguoiBan, hoSo.id, {
    don_vi_van_chuyen: 'VietBid Demo Logistics',
    ma_van_don: `KD-DEMO-${String(chiSo + 1).padStart(3, '0')}`,
  });
  await kiemDinhService.nhanHang(quanTri, hoSo.id, {
    tinh_trang_khi_nhan: 'Hồ sơ minh họa: kiện hàng nguyên vẹn khi tiếp nhận.',
    serial_khi_nhan: `DEMO-${sanPham.id}`,
    so_kien: 1,
    ghi_chu: 'Dữ liệu học tập; không xác nhận sản phẩm ngoài đời.',
  });
  await kiemDinhService.batDau(quanTri, hoSo.id);

  const duongDanBaoCao = await luuTepTaiLen(
    'inspection',
    quanTri.id,
    taoPDFMinhHoa(sanPham.tieu_de, hoSo.ma_kiem_dinh),
    'pdf',
  );

  await kiemDinhService.themTep(quanTri, hoSo.id, {
    loai_tep: 'BAO_CAO_KIEM_DINH',
    duong_dan_tep: duongDanBaoCao,
    mo_ta: 'Tài liệu mẫu cho quy trình demo; không phải chứng nhận kiểm định thực tế.',
  });

  const ngayKiemDinh = new Date().toISOString();
  const ketQua = await kiemDinhService.ghiKetQua(quanTri, hoSo.id, {
    ket_qua: 'DAT',
    ten_chuyen_gia: 'Chuyên viên minh họa VietBid',
    don_vi_kiem_dinh: 'Trung tâm VietBid Demo',
    ngay_kiem_dinh: ngayKiemDinh,
    nhan_xet: 'Kết quả mẫu dùng để trình bày luồng nghiệp vụ kiểm định trong đồ án.',
  });

  await danhMucSanPhamService.duyet(quanTri, sanPham.id, {
    trang_thai_duyet: 'DA_DUYET',
  });

  return ketQua;
}

async function taoSanPhamDemo(taiKhoanNguoiBan, quanTri, cacDanhMucId) {
  const cacSanPhamDaTao = [];

  for (const [chiSo, sanPhamMauHienTai] of sanPhamMau.entries()) {
    const nguoiBan = taoNguoiDungDangNhap(taiKhoanNguoiBan[sanPhamMauHienTai.nguoiBan].id);
    const danhMucId = cacDanhMucId.get(sanPhamMauHienTai.danhMuc);
    const thuocTinhDanhMuc = await khoDanhMucSanPham.danhSachThuocTinh(danhMucId);
    const giaTriThuocTinh = thuocTinhDanhMuc
      .filter((thuocTinh) => Object.hasOwn(sanPhamMauHienTai.thuocTinh, thuocTinh.khoa_thuoc_tinh))
      .map((thuocTinh) => ({
        thuoc_tinh_id: thuocTinh.id,
        gia_tri: String(sanPhamMauHienTai.thuocTinh[thuocTinh.khoa_thuoc_tinh]),
      }));

    for (const thuocTinh of thuocTinhDanhMuc) {
      if (
        thuocTinh.bat_buoc &&
        !Object.hasOwn(sanPhamMauHienTai.thuocTinh, thuocTinh.khoa_thuoc_tinh)
      ) {
        throw new Error(
          `Thiếu thuộc tính ${thuocTinh.khoa_thuoc_tinh} cho ${sanPhamMauHienTai.tieuDe}.`,
        );
      }
    }

    const sanPham = await danhMucSanPhamService.luuSanPham(nguoiBan, null, {
      danh_muc_id: danhMucId,
      tieu_de: sanPhamMauHienTai.tieuDe,
      mo_ta: moTaSanPhamDemo(sanPhamMauHienTai.moTa),
      tinh_trang_san_pham: sanPhamMauHienTai.tinhTrang,
      thuong_hieu: sanPhamMauHienTai.thuongHieu,
      thuoc_tinh: giaTriThuocTinh,
    });
    const duongDanAnh = await luuTepTaiLen(
      'product',
      nguoiBan.id,
      duongDan.join(THU_MUC_ANH, sanPhamMauHienTai.anh),
      duongDan.extname(sanPhamMauHienTai.anh).slice(1),
    );

    await danhMucSanPhamService.themAnh(nguoiBan, sanPham.id, {
      duong_dan_anh: duongDanAnh,
      la_anh_chinh: true,
      thu_tu: 0,
    });
    await danhMucSanPhamService.guiDuyet(nguoiBan, sanPham.id);

    const hoSoKiemDinh = await taoHoSoKiemDinh(quanTri, nguoiBan, sanPham, chiSo);

    const ngayTaoCachDay = 78 - (chiSo % 12) * 2;

    await coSoDuLieu.truyVan(
      `UPDATE san_pham
       SET ngay_tao=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ${ngayTaoCachDay} DAY),
           ngay_cap_nhat=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ${ngayTaoCachDay - 8} DAY),
           ngay_duyet=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ${ngayTaoCachDay - 7} DAY)
       WHERE id=?`,
      [sanPham.id],
    );
    await coSoDuLieu.truyVan(
      `UPDATE kiem_dinh_san_pham
       SET ngay_tao=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ${ngayTaoCachDay - 2} DAY),
           ngay_cap_nhat=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ${ngayTaoCachDay - 4} DAY),
           ngay_gui_trung_tam=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ${ngayTaoCachDay - 3} DAY),
           ngay_nhan_trung_tam=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ${ngayTaoCachDay - 2} DAY),
           ngay_kiem_dinh=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ${ngayTaoCachDay - 1} DAY)
       WHERE id=?`,
      [hoSoKiemDinh.id],
    );
    await coSoDuLieu.truyVan(
      `UPDATE tep_dinh_kem
       SET ngay_tao=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ${ngayTaoCachDay - 1} DAY)
       WHERE kiem_dinh_san_pham_id=?`,
      [hoSoKiemDinh.id],
    );

    cacSanPhamDaTao.push({
      ...sanPhamMauHienTai,
      id: String(sanPham.id),
      kiemDinhId: String(hoSoKiemDinh.id),
      nguoiBanId: String(nguoiBan.id),
    });
  }

  return cacSanPhamDaTao;
}

let cacTaiKhoanNguoiBan = [];

async function batChinhSachCocTamThoi(quanTri) {
  const banGhi = await coSoDuLieu.layMot(
    "SELECT id,gia_tri_cau_hinh FROM cau_hinh_he_thong WHERE khoa_cau_hinh='DEPOSIT_POLICY' FOR UPDATE",
  );

  if (!banGhi) {
    throw new Error('Thiếu cấu hình DEPOSIT_POLICY trong CSDL; không tự tạo cấu hình mới.');
  }

  const chinhSachCu = JSON.parse(banGhi.gia_tri_cau_hinh);
  const chinhSachDemo = {
    bat: true,
    kieu: 'TY_LE',
    gia_tri: 10,
  };
  const canBatTam =
    chinhSachCu.bat !== chinhSachDemo.bat ||
    chinhSachCu.kieu !== chinhSachDemo.kieu ||
    Number(chinhSachCu.gia_tri) !== chinhSachDemo.gia_tri;

  if (canBatTam) {
    await cauHinhService.luu(quanTri, 'DEPOSIT_POLICY', {
      gia_tri_cau_hinh: chinhSachDemo,
    });
  }

  return async () => {
    if (canBatTam) {
      await cauHinhService.luu(quanTri, 'DEPOSIT_POLICY', {
        gia_tri_cau_hinh: chinhSachCu,
      });
    }
  };
}

async function taoPhien(nguoiBan, sanPham, soGiayBatDau, giaMuaNgay = null) {
  const batDau = await thoiGianSQL(soGiayBatDau);
  const ketThuc = await thoiGianSQL(soGiayBatDau + 30 * 86400);
  const ketQua = await dauGiaService.tao(nguoiBan, {
    san_pham_id: sanPham.id,
    gia_khoi_diem: soTien(sanPham.giaKhoiDiem),
    gia_san: sanPham.giaSan == null ? null : soTien(sanPham.giaSan),
    gia_mua_ngay: giaMuaNgay == null ? null : soTien(giaMuaNgay),
    phi_van_chuyen: soTien(sanPham.phiVanChuyen || 0),
    thoi_gian_bat_dau: batDau,
    thoi_gian_ket_thuc: ketThuc,
  });

  return {
    id: String(ketQua.id),
    batDau,
    ketThuc,
  };
}

async function dangKyVaDatCoc(phienId, nguoiMua) {
  const taiKhoan = nguoiMua.taiKhoan || taoNguoiDungDangNhap(nguoiMua.id);
  const khoa = `DEMO_COC_${phienId}_${nguoiMua.id}`;

  await datCocService.dangKy(taiKhoan, phienId);
  await datCocService.thanhToan(taiKhoan, phienId, {
    ket_qua_mo_phong: 'THANH_CONG',
    khoa_yeu_cau: khoa,
  });
}

async function datCacMucGia(phienId, cacMuc) {
  for (const muc of cacMuc) {
    await dauGiaService.datGia(taoNguoiDungDangNhap(muc.nguoiMua.id), phienId, {
      gia_toi_da: soTien(muc.giaToiDa),
    });
  }
}

async function ketThucPhien(phienId) {
  await coSoDuLieu.truyVan(
    `UPDATE phien_dau_gia
     SET thoi_gian_ket_thuc=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 SECOND)
     WHERE id=? AND trang_thai='HOAT_DONG'`,
    [phienId],
  );

  return dauGiaService.xuLyDenHan(phienId);
}

async function datLaiThoiGianPhien(phienId, soNgayKetThucTruocDay) {
  const soNgayBatDauTruocDay = soNgayKetThucTruocDay + 2;

  await coSoDuLieu.truyVan(
    `UPDATE phien_dau_gia
     SET thoi_gian_bat_dau=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ${soNgayBatDauTruocDay} DAY),
         thoi_gian_ket_thuc_goc=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ${soNgayKetThucTruocDay} DAY),
         thoi_gian_ket_thuc=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ${soNgayKetThucTruocDay} DAY),
         ngay_tao=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ${soNgayBatDauTruocDay + 1} DAY),
         ngay_cap_nhat=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ${soNgayKetThucTruocDay} DAY)
     WHERE id=?`,
    [phienId],
  );
  await coSoDuLieu.truyVan(
    `UPDATE luot_tra_gia b
     JOIN (SELECT MIN(id) AS id_dau FROM luot_tra_gia WHERE phien_dau_gia_id=?) dau
     JOIN phien_dau_gia a ON a.id=b.phien_dau_gia_id
     SET b.ngay_tao=DATE_ADD(a.thoi_gian_bat_dau, INTERVAL (b.id-dau.id_dau+60) SECOND)
     WHERE b.phien_dau_gia_id=?`,
    [phienId, phienId],
  );
  await coSoDuLieu.truyVan(
    `UPDATE tham_gia_phien p
     JOIN (SELECT MIN(id) AS id_dau FROM tham_gia_phien WHERE phien_dau_gia_id=?) dau
     JOIN phien_dau_gia a ON a.id=p.phien_dau_gia_id
     SET p.ngay_tao=DATE_SUB(a.thoi_gian_bat_dau, INTERVAL 1 DAY),
         p.thoi_gian_dat_gia_toi_da=IF(p.gia_toi_da IS NULL,NULL,
           DATE_ADD(a.thoi_gian_bat_dau, INTERVAL (p.id-dau.id_dau+30) SECOND))
     WHERE p.phien_dau_gia_id=?`,
    [phienId, phienId],
  );
  await coSoDuLieu.truyVan(
    `UPDATE dat_coc_dau_gia c
     JOIN phien_dau_gia a ON a.id=c.phien_dau_gia_id
     SET c.ngay_tao=DATE_SUB(a.thoi_gian_bat_dau, INTERVAL 1 DAY),
         c.ngay_dat_coc=IF(c.trang_thai IN ('DA_HOAN_COC','DA_CHUYEN_VAO_DON','KHONG_HOAN_COC'),
           DATE_SUB(a.thoi_gian_bat_dau, INTERVAL 2 HOUR),c.ngay_dat_coc),
         c.ngay_hoan=IF(c.trang_thai='DA_HOAN_COC',DATE_ADD(a.thoi_gian_ket_thuc, INTERVAL 30 MINUTE),c.ngay_hoan),
         c.ngay_chuyen_vao_don=IF(c.trang_thai IN ('DA_CHUYEN_VAO_DON','KHONG_HOAN_COC'),
           DATE_ADD(a.thoi_gian_ket_thuc, INTERVAL 30 MINUTE),c.ngay_chuyen_vao_don),
         c.ngay_khong_hoan=IF(c.trang_thai='KHONG_HOAN_COC',DATE_ADD(a.thoi_gian_ket_thuc, INTERVAL 3 DAY),c.ngay_khong_hoan)
     WHERE c.phien_dau_gia_id=?`,
    [phienId],
  );
  await coSoDuLieu.truyVan(
    `UPDATE nhat_ky_hoat_dong
     SET ngay_tao=DATE_ADD((SELECT thoi_gian_bat_dau FROM phien_dau_gia WHERE id=?), INTERVAL 1 HOUR)
     WHERE phien_dau_gia_id=?`,
    [phienId, phienId],
  );
}

async function datLaiThoiGianDonHang(donHangId, cauHinhThoiGian = {}) {
  const {
    gioTao = 1,
    gioThanhToan = 2,
    gioGuiHang = 24,
    gioNhanHang = 72,
    gioXuLy = 96,
    gioHoanTat = 120,
  } = cauHinhThoiGian;

  await coSoDuLieu.truyVan(
    `UPDATE don_hang d
     JOIN phien_dau_gia a ON a.id=d.phien_dau_gia_id
     SET d.ngay_tao=DATE_ADD(a.thoi_gian_ket_thuc, INTERVAL ${gioTao} HOUR),
         d.han_thanh_toan=DATE_ADD(a.thoi_gian_ket_thuc, INTERVAL 49 HOUR),
         d.ngay_bat_dau_giu=IF(d.ngay_bat_dau_giu IS NULL,NULL,DATE_ADD(a.thoi_gian_ket_thuc, INTERVAL ${gioThanhToan} HOUR)),
         d.han_nguoi_ban_gui_hang=IF(d.trang_thai='DA_HUY',NULL,DATE_ADD(a.thoi_gian_ket_thuc, INTERVAL 96 HOUR)),
         d.ngay_gui_hang=IF(d.ngay_gui_hang IS NULL,NULL,DATE_ADD(a.thoi_gian_ket_thuc, INTERVAL ${gioGuiHang} HOUR)),
         d.moc_khieu_nai_chua_nhan=IF(d.moc_khieu_nai_chua_nhan IS NULL,NULL,DATE_ADD(a.thoi_gian_ket_thuc, INTERVAL ${gioGuiHang + 168} HOUR)),
         d.ngay_giao_van_chuyen=IF(d.ngay_giao_van_chuyen IS NULL,NULL,DATE_ADD(a.thoi_gian_ket_thuc, INTERVAL ${gioNhanHang} HOUR)),
         d.ngay_giao_hang=IF(d.ngay_giao_hang IS NULL,NULL,DATE_ADD(a.thoi_gian_ket_thuc, INTERVAL ${gioNhanHang} HOUR)),
         d.han_kiem_tra=IF(d.han_kiem_tra IS NULL,NULL,DATE_ADD(a.thoi_gian_ket_thuc, INTERVAL ${gioNhanHang + 72} HOUR)),
         d.ngay_hoan_thanh=IF(d.ngay_hoan_thanh IS NULL,NULL,DATE_ADD(a.thoi_gian_ket_thuc, INTERVAL ${gioHoanTat} HOUR)),
         d.ngay_huy=IF(d.ngay_huy IS NULL,NULL,DATE_ADD(a.thoi_gian_ket_thuc, INTERVAL ${gioXuLy} HOUR)),
         d.ngay_giai_ngan=IF(d.ngay_giai_ngan IS NULL,NULL,DATE_ADD(a.thoi_gian_ket_thuc, INTERVAL ${gioHoanTat} HOUR)),
         d.ngay_hoan_tien=IF(d.ngay_hoan_tien IS NULL,NULL,DATE_ADD(a.thoi_gian_ket_thuc, INTERVAL ${gioXuLy} HOUR)),
         d.ngay_cap_nhat=DATE_ADD(a.thoi_gian_ket_thuc, INTERVAL ${gioHoanTat} HOUR)
     WHERE d.id=?`,
    [donHangId],
  );
  await coSoDuLieu.truyVan(
    `UPDATE thanh_toan t
     JOIN don_hang d ON d.id=t.don_hang_id
     JOIN phien_dau_gia a ON a.id=d.phien_dau_gia_id
     SET t.ngay_tao=DATE_ADD(a.thoi_gian_ket_thuc, INTERVAL ${gioThanhToan} HOUR),
         t.ngay_thanh_toan=IF(t.ngay_thanh_toan IS NULL,NULL,DATE_ADD(a.thoi_gian_ket_thuc, INTERVAL ${gioThanhToan} HOUR)),
         t.ngay_het_han=DATE_ADD(a.thoi_gian_ket_thuc, INTERVAL 49 HOUR)
     WHERE t.don_hang_id=?`,
    [donHangId],
  );
  await coSoDuLieu.truyVan(
    `UPDATE nhat_ky_hoat_dong
     SET ngay_tao=DATE_ADD((SELECT a.thoi_gian_ket_thuc FROM don_hang d JOIN phien_dau_gia a ON a.id=d.phien_dau_gia_id WHERE d.id=?), INTERVAL ${gioHoanTat} HOUR)
     WHERE loai_doi_tuong='don_hang' AND doi_tuong_id=?`,
    [donHangId, donHangId],
  );
}

async function layDonHangTheoPhien(phienId) {
  return coSoDuLieu.layMot(
    'SELECT * FROM don_hang WHERE phien_dau_gia_id=? ORDER BY id DESC LIMIT 1',
    [phienId],
  );
}

async function hoanTatGiaoDich(quanTri, nguoiMua, donHangId, maVanDon) {
  await donHangService.guiHang(quanTri, donHangId, {
    don_vi_van_chuyen: 'VietBid Logistics',
    ma_van_don: maVanDon,
  });
  await donHangService.xacNhanDaGiao(taoNguoiDungDangNhap(nguoiMua.id), donHangId);
  await donHangService.xacNhanHoanThanh(taoNguoiDungDangNhap(nguoiMua.id), donHangId);
}

async function taoPhienCoDatCoc(nguoiBan, sanPham, giaMuaNgay = null) {
  const phien = await taoPhien(nguoiBan, sanPham, -30, giaMuaNgay);

  return phien;
}

async function chayCacCauChuyen(quanTri, cacSanPham, cacNguoiMua, cacTaiKhoanNguoiBan) {
  const ketQua = {
    cacPhien: [],
    cacDonHang: [],
    cacTranhChap: [],
  };
  const taiKhoanNguoiBan = (chiSo) => taoNguoiDungDangNhap(cacTaiKhoanNguoiBan[chiSo].id);
  const sanPham = (tieuDe) => cacSanPham.find((hang) => hang.tieuDe === tieuDe);
  const nguoiMua = (chiSo) => cacNguoiMua[chiSo];

  const rolex = sanPham('Rolex Submariner – hồ sơ sưu tầm 14060M');
  const phienRolex = await taoPhienCoDatCoc(
    taiKhoanNguoiBan(rolex.nguoiBan),
    rolex,
    rolex.giaMuaNgay,
  );

  for (const chiSo of [1, 2, 0, 3]) {
    await dangKyVaDatCoc(phienRolex.id, nguoiMua(chiSo));
  }
  await datCocService.dangKy(taoNguoiDungDangNhap(nguoiMua(12).id), phienRolex.id);
  await dauGiaService.theoDoi(taoNguoiDungDangNhap(nguoiMua(12).id), phienRolex.id, true);
  await datCacMucGia(phienRolex.id, [
    { nguoiMua: nguoiMua(1), giaToiDa: 340000000 },
    { nguoiMua: nguoiMua(2), giaToiDa: 360000000 },
    { nguoiMua: nguoiMua(0), giaToiDa: 400000000 },
    { nguoiMua: nguoiMua(3), giaToiDa: 370000000 },
  ]);
  await ketThucPhien(phienRolex.id);

  const donRolex = await layDonHangTheoPhien(phienRolex.id);

  if (!donRolex || String(donRolex.nguoi_mua_id) !== nguoiMua(0).id) {
    throw new Error('Câu chuyện Rolex không chốt đúng người thắng Trần Đức Anh.');
  }
  await donHangService.thanhToan(taoNguoiDungDangNhap(nguoiMua(0).id), donRolex.id, {
    ket_qua_mo_phong: 'THANH_CONG',
    khoa_yeu_cau: 'DEMO_ROLE_XFER_001',
  });
  await hoanTatGiaoDich(quanTri, nguoiMua(0), donRolex.id, 'VB-ROLEX-2026-01');
  await tuongTacService.danhGiaDonHang(taoNguoiDungDangNhap(nguoiMua(0).id), donRolex.id, {
    so_sao: 5,
    nhan_xet: 'Đã nhận đúng lô hàng, chứng từ và lịch sử giao nhận được cập nhật đầy đủ.',
  });
  await datLaiThoiGianPhien(phienRolex.id, 34);
  await datLaiThoiGianDonHang(donRolex.id);
  ketQua.cacPhien.push({ ten: 'RolexSubmariner', id: phienRolex.id });
  ketQua.cacDonHang.push({ ten: 'RolexHoanTat', id: String(donRolex.id) });

  const omega = sanPham('Omega Speedmaster Schumacher Edition');
  const phienOmega = await taoPhienCoDatCoc(taiKhoanNguoiBan(omega.nguoiBan), omega);

  for (const chiSo of [1, 2, 4]) {
    await dangKyVaDatCoc(phienOmega.id, nguoiMua(chiSo));
  }
  await datCacMucGia(phienOmega.id, [
    { nguoiMua: nguoiMua(1), giaToiDa: 105000000 },
    { nguoiMua: nguoiMua(2), giaToiDa: 90000000 },
    { nguoiMua: nguoiMua(4), giaToiDa: 130000000 },
  ]);
  await ketThucPhien(phienOmega.id);

  const donOmegaGoc = await layDonHangTheoPhien(phienOmega.id);

  if (!donOmegaGoc || String(donOmegaGoc.nguoi_mua_id) !== nguoiMua(4).id) {
    throw new Error('Câu chuyện Omega không tạo đúng người thắng chưa thanh toán.');
  }

  await coSoDuLieu.truyVan(
    'UPDATE don_hang SET han_thanh_toan=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 SECOND) WHERE id=?',
    [donOmegaGoc.id],
  );
  await donHangService.xuLyDenHan(donOmegaGoc.id);
  await datLaiThoiGianPhien(phienOmega.id, 28);
  await datLaiThoiGianDonHang(donOmegaGoc.id, {
    gioTao: 1,
    gioThanhToan: 72,
    gioGuiHang: 72,
    gioNhanHang: 120,
    gioXuLy: 72,
    gioHoanTat: 72,
  });

  const deNghi = await deNghiService.tao(taiKhoanNguoiBan(omega.nguoiBan), donOmegaGoc.id);

  if (!deNghi || Number(deNghi.gia_de_nghi) !== 105000000) {
    throw new Error('Second Chance không lấy đúng mức giá trả công khai của bidder thứ hai.');
  }

  const phanHoiDeNghi = await deNghiService.phanHoiDeNghi(
    taoNguoiDungDangNhap(nguoiMua(1).id),
    deNghi.id,
    {
      chap_nhan: true,
      ket_qua_mo_phong: 'THANH_CONG',
      khoa_yeu_cau: 'DEMO_SC_OMEGA_001',
    },
  );
  const donOmegaTiepTheo = phanHoiDeNghi.don_hang;

  await hoanTatGiaoDich(quanTri, nguoiMua(1), donOmegaTiepTheo.id, 'VB-OMEGA-SECOND-01');
  await datLaiThoiGianDonHang(donOmegaTiepTheo.id, {
    gioTao: 96,
    gioThanhToan: 97,
    gioGuiHang: 120,
    gioNhanHang: 168,
    gioXuLy: 216,
    gioHoanTat: 240,
  });
  await coSoDuLieu.truyVan(
    `UPDATE de_nghi_mua_tiep_theo
     SET ngay_tao=DATE_ADD((SELECT thoi_gian_ket_thuc FROM phien_dau_gia WHERE id=?), INTERVAL 72 HOUR),
         ngay_phan_hoi=DATE_ADD((SELECT thoi_gian_ket_thuc FROM phien_dau_gia WHERE id=?), INTERVAL 96 HOUR),
         het_han_luc=DATE_ADD((SELECT thoi_gian_ket_thuc FROM phien_dau_gia WHERE id=?), INTERVAL 120 HOUR)
     WHERE id=?`,
    [phienOmega.id, phienOmega.id, phienOmega.id, deNghi.id],
  );
  await tuongTacService.danhGiaDonHang(taoNguoiDungDangNhap(nguoiMua(1).id), donOmegaTiepTheo.id, {
    so_sao: 5,
    nhan_xet: 'Đề nghị nêu đúng giá công khai, quy trình thanh toán và giao hàng liền mạch.',
  });
  ketQua.cacPhien.push({ ten: 'OmegaSecondChance', id: phienOmega.id });
  ketQua.cacDonHang.push(
    { ten: 'OmegaKhongThanhToan', id: String(donOmegaGoc.id) },
    { ten: 'OmegaSecondChanceHoanTat', id: String(donOmegaTiepTheo.id) },
  );

  const limoges = sanPham('Bộ bình sứ Limoges – bộ sưu tập tư nhân');
  const phienLimoges = await taoPhienCoDatCoc(taiKhoanNguoiBan(limoges.nguoiBan), limoges);

  for (const chiSo of [9, 11, 10]) {
    await dangKyVaDatCoc(phienLimoges.id, nguoiMua(chiSo));
  }
  await datCacMucGia(phienLimoges.id, [
    { nguoiMua: nguoiMua(9), giaToiDa: 70000000 },
    { nguoiMua: nguoiMua(11), giaToiDa: 80000000 },
    { nguoiMua: nguoiMua(10), giaToiDa: 76000000 },
  ]);
  await ketThucPhien(phienLimoges.id);

  const donLimoges = await layDonHangTheoPhien(phienLimoges.id);

  await donHangService.thanhToan(taoNguoiDungDangNhap(nguoiMua(11).id), donLimoges.id, {
    ket_qua_mo_phong: 'THANH_CONG',
    khoa_yeu_cau: 'DEMO_LIMOGES_PAY_01',
  });
  await donHangService.guiHang(quanTri, donLimoges.id, {
    don_vi_van_chuyen: 'VietBid Logistics',
    ma_van_don: 'VB-LIMOGES-DISPUTE-01',
  });
  await donHangService.xacNhanDaGiao(taoNguoiDungDangNhap(nguoiMua(11).id), donLimoges.id);

  const tranhChapHoanTien = await tranhChapService.mo(
    taoNguoiDungDangNhap(nguoiMua(11).id),
    donLimoges.id,
    {
      ly_do: 'HONG_HOC',
      mo_ta:
        'Tình huống minh họa hàng dễ vỡ bị va đập trong vận chuyển; ảnh đính kèm là tư liệu tham khảo, không phải ảnh đơn hàng thực tế.',
    },
  );
  const anhBangChung = await luuTepTaiLen(
    'evidence',
    nguoiMua(11).id,
    duongDan.join(THU_MUC_ANH, 'anh-minh-hoa-buu-kien-hu-hong.jpg'),
    'jpg',
  );

  await tranhChapService.themBangChung(
    taoNguoiDungDangNhap(nguoiMua(11).id),
    tranhChapHoanTien.id,
    {
      duong_dan_tep: anhBangChung,
      mo_ta:
        'Ảnh minh họa của Meanwell Packaging từ Wikimedia Commons; không phải bằng chứng của một đơn hàng có thật.',
    },
  );
  await tranhChapService.tiepNhan(quanTri, tranhChapHoanTien.id);
  await tranhChapService.giaiQuyet(quanTri, tranhChapHoanTien.id, {
    ket_qua: 'NGUOI_MUA',
    ket_qua_xu_ly:
      'Tình huống demo: Admin chấp nhận khiếu nại và hoàn toàn bộ số tiền đang giữ, gồm phí vận chuyển.',
  });
  await datLaiThoiGianPhien(phienLimoges.id, 21);
  await datLaiThoiGianDonHang(donLimoges.id, {
    gioTao: 1,
    gioThanhToan: 2,
    gioGuiHang: 24,
    gioNhanHang: 72,
    gioXuLy: 120,
    gioHoanTat: 120,
  });
  await coSoDuLieu.truyVan(
    `UPDATE tranh_chap
     SET ngay_mo=DATE_ADD((SELECT thoi_gian_ket_thuc FROM phien_dau_gia WHERE id=?), INTERVAL 73 HOUR),
         ngay_giai_quyet=DATE_ADD((SELECT thoi_gian_ket_thuc FROM phien_dau_gia WHERE id=?), INTERVAL 120 HOUR),
         ngay_tao=DATE_ADD((SELECT thoi_gian_ket_thuc FROM phien_dau_gia WHERE id=?), INTERVAL 73 HOUR)
     WHERE id=?`,
    [phienLimoges.id, phienLimoges.id, phienLimoges.id, tranhChapHoanTien.id],
  );
  await coSoDuLieu.truyVan(
    `UPDATE tep_dinh_kem
     SET ngay_tao=DATE_ADD((SELECT ngay_mo FROM tranh_chap WHERE id=?), INTERVAL 5 MINUTE)
     WHERE tranh_chap_id=?`,
    [tranhChapHoanTien.id, tranhChapHoanTien.id],
  );
  ketQua.cacPhien.push({ ten: 'LimogesTranhChapHoanTien', id: phienLimoges.id });
  ketQua.cacDonHang.push({ ten: 'LimogesHoanTien', id: String(donLimoges.id) });
  ketQua.cacTranhChap.push({ ten: 'LimogesHoanTien', id: String(tranhChapHoanTien.id) });

  const binhPhong = sanPham('Bình phong sơn mài “Thiếu nữ và phong cảnh”');
  const phienBinhPhong = await taoPhienCoDatCoc(taiKhoanNguoiBan(binhPhong.nguoiBan), binhPhong);

  for (const chiSo of [6, 2, 8]) {
    await dangKyVaDatCoc(phienBinhPhong.id, nguoiMua(chiSo));
  }
  await datCacMucGia(phienBinhPhong.id, [
    { nguoiMua: nguoiMua(6), giaToiDa: 1300000000 },
    { nguoiMua: nguoiMua(2), giaToiDa: 1450000000 },
    { nguoiMua: nguoiMua(8), giaToiDa: 1380000000 },
  ]);
  await ketThucPhien(phienBinhPhong.id);

  const donBinhPhong = await layDonHangTheoPhien(phienBinhPhong.id);

  await donHangService.thanhToan(taoNguoiDungDangNhap(nguoiMua(2).id), donBinhPhong.id, {
    ket_qua_mo_phong: 'THANH_CONG',
    khoa_yeu_cau: 'DEMO_ART_PAY_001',
  });
  await donHangService.guiHang(quanTri, donBinhPhong.id, {
    don_vi_van_chuyen: 'VietBid Logistics',
    ma_van_don: 'VB-ART-DISPUTE-01',
  });
  await donHangService.xacNhanDaGiao(taoNguoiDungDangNhap(nguoiMua(2).id), donBinhPhong.id);

  const tranhChapNguoiBan = await tranhChapService.mo(
    taoNguoiDungDangNhap(nguoiMua(2).id),
    donBinhPhong.id,
    {
      ly_do: 'KHONG_DUNG_MO_TA',
      mo_ta:
        'Người mua đề nghị Admin đối chiếu tình trạng lô hàng và hồ sơ kiểm định trong case demo.',
    },
  );

  await tranhChapService.phanHoiNguoiBan(
    taiKhoanNguoiBan(binhPhong.nguoiBan),
    tranhChapNguoiBan.id,
    {
      phan_hoi_nguoi_ban:
        'Người bán gửi phản hồi; đề nghị đối chiếu mô tả, ảnh tham khảo và biên bản kiểm định demo.',
    },
  );
  await tranhChapService.tiepNhan(quanTri, tranhChapNguoiBan.id);
  await tranhChapService.giaiQuyet(quanTri, tranhChapNguoiBan.id, {
    ket_qua: 'NGUOI_BAN',
    ket_qua_xu_ly:
      'Tình huống demo: hồ sơ mô tả phù hợp, Admin giải ngân toàn bộ tiền đang giữ cho người bán.',
  });
  await tuongTacService.danhGiaDonHang(taoNguoiDungDangNhap(nguoiMua(2).id), donBinhPhong.id, {
    so_sao: 5,
    nhan_xet: 'Thông tin hồ sơ và quyết định xử lý được trình bày rõ ràng.',
  });
  await datLaiThoiGianPhien(phienBinhPhong.id, 14);
  await datLaiThoiGianDonHang(donBinhPhong.id, {
    gioTao: 1,
    gioThanhToan: 2,
    gioGuiHang: 24,
    gioNhanHang: 72,
    gioXuLy: 120,
    gioHoanTat: 120,
  });
  await coSoDuLieu.truyVan(
    `UPDATE tranh_chap
     SET ngay_mo=DATE_ADD((SELECT thoi_gian_ket_thuc FROM phien_dau_gia WHERE id=?), INTERVAL 73 HOUR),
         ngay_giai_quyet=DATE_ADD((SELECT thoi_gian_ket_thuc FROM phien_dau_gia WHERE id=?), INTERVAL 120 HOUR),
         ngay_tao=DATE_ADD((SELECT thoi_gian_ket_thuc FROM phien_dau_gia WHERE id=?), INTERVAL 73 HOUR)
     WHERE id=?`,
    [phienBinhPhong.id, phienBinhPhong.id, phienBinhPhong.id, tranhChapNguoiBan.id],
  );
  ketQua.cacPhien.push({ ten: 'BinhPhongTranhChapGiaiNgan', id: phienBinhPhong.id });
  ketQua.cacDonHang.push({ ten: 'BinhPhongGiaiNgan', id: String(donBinhPhong.id) });
  ketQua.cacTranhChap.push({ ten: 'BinhPhongGiaiNgan', id: String(tranhChapNguoiBan.id) });

  const mercedes = sanPham('Mercedes-Benz 280 SL “Pagoda”');
  const phienMercedes = await taoPhienCoDatCoc(
    taiKhoanNguoiBan(mercedes.nguoiBan),
    mercedes,
    mercedes.giaMuaNgay,
  );
  const ketQuaMuaNgay = await dauGiaService.muaNgay(
    taoNguoiDungDangNhap(nguoiMua(7).id),
    phienMercedes.id,
    { ket_qua_mo_phong: 'THANH_CONG', khoa_yeu_cau: 'DEMO_MERCEDES_BUY_01' },
  );

  await donHangService.guiHang(quanTri, ketQuaMuaNgay.don_hang_id, {
    don_vi_van_chuyen: 'VietBid Logistics – vận chuyển xe chuyên dụng',
    ma_van_don: 'VB-MERCEDES-BUYNOW-01',
  });
  await donHangService.xacNhanDaGiao(
    taoNguoiDungDangNhap(nguoiMua(7).id),
    ketQuaMuaNgay.don_hang_id,
  );
  await donHangService.xacNhanHoanThanh(
    taoNguoiDungDangNhap(nguoiMua(7).id),
    ketQuaMuaNgay.don_hang_id,
  );
  await tuongTacService.danhGiaDonHang(
    taoNguoiDungDangNhap(nguoiMua(7).id),
    ketQuaMuaNgay.don_hang_id,
    {
      so_sao: 5,
      nhan_xet: 'Mua ngay, thanh toán và bàn giao được nối thành một hồ sơ hoàn chỉnh.',
    },
  );
  await datLaiThoiGianPhien(phienMercedes.id, 8);
  await datLaiThoiGianDonHang(ketQuaMuaNgay.don_hang_id, {
    gioTao: 1,
    gioThanhToan: 2,
    gioGuiHang: 24,
    gioNhanHang: 72,
    gioXuLy: 96,
    gioHoanTat: 96,
  });
  ketQua.cacPhien.push({ ten: 'MercedesMuaNgay', id: phienMercedes.id });
  ketQua.cacDonHang.push({ ten: 'MercedesMuaNgayHoanTat', id: String(ketQuaMuaNgay.don_hang_id) });

  return ketQua;
}

async function taoCacPhienConLai(quanTri, cacSanPham, cacNguoiMua, cacTaiKhoanNguoiBan) {
  const phienTao = [];
  const sanPham = (tieuDe) => cacSanPham.find((hang) => hang.tieuDe === tieuDe);
  const nguoiBan = (chiSo) => taoNguoiDungDangNhap(cacTaiKhoanNguoiBan[chiSo].id);
  const nguoiMua = (chiSo) => cacNguoiMua[chiSo];

  const cacPhienDangChay = [
    {
      ten: 'PatekNautilus',
      tieuDe: 'Patek Philippe Nautilus 5711/1A',
      gia: [900000000, 930000000],
      giaMuaNgay: 1050000000,
    },
    {
      ten: 'RoyalOak',
      tieuDe: 'Audemars Piguet Royal Oak Offshore',
      gia: [570000000, 620000000],
    },
    {
      ten: 'Sapphire',
      tieuDe: 'Nhẫn sapphire cổ khoảng năm 1940',
      gia: [125000000, 135000000],
    },
    {
      ten: 'Ruby',
      tieuDe: 'Tinh thể ruby thô – mẫu sưu tầm khoáng vật',
      gia: [70000000, 78000000],
    },
    {
      ten: 'Emerald',
      tieuDe: 'Tinh thể emerald trên nền đá mẹ Muzo',
      gia: [110000000, 125000000],
    },
    {
      ten: 'JadePagoda',
      tieuDe: 'Bình phong chạm ngọc – tư liệu Jordan Schnitzer Museum',
      gia: [1200000000, 1350000000],
    },
    {
      ten: 'Birkin',
      tieuDe: 'Túi Hermès Birkin màu hồng – ảnh bộ sưu tập',
      gia: [550000000, 600000000],
      giaMuaNgay: 590000000,
    },
    {
      ten: 'Fender',
      tieuDe: 'Fender Stratocaster – cây đàn vintage sưu tầm',
      gia: [145000000, 165000000],
    },
    {
      ten: 'Leica',
      tieuDe: 'Leica M3 – máy ảnh rangefinder sưu tầm',
      gia: [72000000, 82000000],
    },
  ];

  for (const [chiSo, phienMau] of cacPhienDangChay.entries()) {
    const hang = sanPham(phienMau.tieuDe);
    const phien = await taoPhien(nguoiBan(hang.nguoiBan), hang, -30, phienMau.giaMuaNgay || null);
    const cacNguoiDatGia = [
      nguoiMua((chiSo + 8) % cacNguoiMua.length),
      nguoiMua((chiSo + 9) % cacNguoiMua.length),
    ];

    for (const nguoi of cacNguoiDatGia) {
      await dangKyVaDatCoc(phien.id, nguoi);
    }
    await datCacMucGia(phien.id, [
      { nguoiMua: cacNguoiDatGia[0], giaToiDa: phienMau.gia[0] },
      { nguoiMua: cacNguoiDatGia[1], giaToiDa: phienMau.gia[1] },
    ]);
    phienTao.push({
      ten: phienMau.ten,
      id: phien.id,
      trangThai: 'HOAT_DONG',
    });
  }

  const cacPhienLenLich = [
    {
      ten: 'Violin',
      tieuDe: 'Đàn violin cổ điển – bộ sưu tập nhạc cụ',
      gia: 150000000,
      giaSan: 190000000,
    },
    {
      ten: 'Piastre',
      tieuDe: 'Đồng bạc 1 Piastre Đông Dương năm 1928',
      gia: 8000000,
      giaSan: 12000000,
    },
    {
      ten: 'ViennaClock',
      tieuDe: 'Đồng hồ để bàn Vienna – vỏ gỗ chạm',
      gia: 65000000,
      giaSan: 85000000,
    },
  ];

  for (const phienMau of cacPhienLenLich) {
    const hang = sanPham(phienMau.tieuDe);
    const phien = await taoPhien(nguoiBan(hang.nguoiBan), hang, 86400, null);

    phienTao.push({
      ten: phienMau.ten,
      id: phien.id,
      trangThai: 'DA_LEN_LICH',
    });
  }

  const tem = sanPham('Tem Đông Dương 5 cent năm 1889');
  const phienKhongDatSan = await taoPhien(nguoiBan(tem.nguoiBan), tem, -30);

  await dangKyVaDatCoc(phienKhongDatSan.id, nguoiMua(13));
  await datCacMucGia(phienKhongDatSan.id, [{ nguoiMua: nguoiMua(13), giaToiDa: 2500000 }]);
  await ketThucPhien(phienKhongDatSan.id);
  await datLaiThoiGianPhien(phienKhongDatSan.id, 5);
  phienTao.push({
    ten: 'TemKhongDatGiaSan',
    id: phienKhongDatSan.id,
    trangThai: 'THAT_BAI',
  });

  return phienTao;
}

async function taoDuLieuDemo(quanTri) {
  const danhMucCocKhoiPhuc = await batChinhSachCocTamThoi(quanTri);
  const danhMucId = await taoDanhMuc();

  cacTaiKhoanNguoiBan = await taoTaiKhoanMau(nguoiBanMau, true, quanTri);

  const cacTaiKhoanNguoiMua = await taoTaiKhoanMau(nguoiMuaMau, false, quanTri);
  const cacSanPham = await taoSanPhamDemo(cacTaiKhoanNguoiBan, quanTri, danhMucId);
  const cacCauChuyen = await chayCacCauChuyen(
    quanTri,
    cacSanPham,
    cacTaiKhoanNguoiMua,
    cacTaiKhoanNguoiBan,
  );
  const cacPhienConLai = await taoCacPhienConLai(
    quanTri,
    cacSanPham,
    cacTaiKhoanNguoiMua,
    cacTaiKhoanNguoiBan,
  );

  await danhMucCocKhoiPhuc();
  await coSoDuLieu.truyVan(
    `INSERT INTO nhat_ky_hoat_dong
       (nguoi_thuc_hien_id,hanh_dong,loai_doi_tuong,du_lieu_moi,ma_yeu_cau)
     VALUES (?,'TAO_DU_LIEU_DEMO_VIETBID','du_lieu_demo',?,?)`,
    [
      quanTri.id,
      JSON.stringify({
        phienBan: 1,
        soNguoiBan: cacTaiKhoanNguoiBan.length,
        soNguoiMua: cacTaiKhoanNguoiMua.length,
        soSanPham: cacSanPham.length,
        soPhien: cacCauChuyen.cacPhien.length + cacPhienConLai.length,
      }),
      MA_DAU_HIEU,
    ],
  );

  return {
    nguoiBan: cacTaiKhoanNguoiBan,
    nguoiMua: cacTaiKhoanNguoiMua,
    sanPham: cacSanPham,
    cauChuyen: cacCauChuyen,
    phienConLai: cacPhienConLai,
  };
}

async function layDuLieuDemoDaNap() {
  const cacEmail = [...nguoiBanMau, ...nguoiMuaMau].map((nguoi) => nguoi.email);
  const nguoiDung = await coSoDuLieu.truyVan(
    `SELECT id,email FROM nguoi_dung
     WHERE email IN (${cacEmail.map(() => '?').join(',')})`,
    cacEmail,
  );
  const nguoiBan = nguoiDung.filter((nguoi) => nguoi.email.startsWith('seller.'));
  const nguoiMua = nguoiDung.filter((nguoi) => nguoi.email.startsWith('buyer.'));
  const cacIdNguoiBan = nguoiBan.map((nguoi) => String(nguoi.id));

  if (!cacIdNguoiBan.length) {
    return {
      nguoiBan,
      nguoiMua,
      sanPham: [],
    };
  }

  const sanPham = await coSoDuLieu.truyVan(
    `SELECT id,tieu_de FROM san_pham
     WHERE nguoi_ban_id IN (${cacIdNguoiBan.map(() => '?').join(',')})`,
    cacIdNguoiBan,
  );

  return {
    nguoiBan,
    nguoiMua,
    sanPham,
  };
}

async function kiemTraKetQua(duLieu) {
  const cacIdSanPham = duLieu.sanPham.map((sanPham) => sanPham.id);
  const cacIdNguoiBan = duLieu.nguoiBan.map((nguoi) => nguoi.id);
  const hinhAnhChinh = await coSoDuLieu.layMot(
    `SELECT COUNT(*) AS so_luong FROM tep_dinh_kem
     WHERE loai_tep='ANH_SAN_PHAM' AND la_anh_chinh=1
       AND san_pham_id IN (${cacIdSanPham.map(() => '?').join(',')})`,
    cacIdSanPham,
  );
  const sanPhamDaDuyet = await coSoDuLieu.layMot(
    `SELECT COUNT(*) AS so_luong FROM san_pham
     WHERE trang_thai_duyet='DA_DUYET' AND id IN (${cacIdSanPham.map(() => '?').join(',')})`,
    cacIdSanPham,
  );
  const soPhienThucTe = await coSoDuLieu.layMot(
    `SELECT COUNT(*) AS so_luong FROM phien_dau_gia
     WHERE san_pham_id IN (${cacIdSanPham.map(() => '?').join(',')})`,
    cacIdSanPham,
  );
  const nguoiBanDaXacMinh = await coSoDuLieu.layMot(
    `SELECT COUNT(DISTINCT u.id) AS so_luong
     FROM nguoi_dung u JOIN xac_minh_nguoi_ban x ON x.nguoi_dung_id=u.id
     WHERE u.id IN (${cacIdNguoiBan.map(() => '?').join(',')})
       AND u.trang_thai_nguoi_ban='DA_XAC_MINH' AND x.trang_thai='DA_XAC_MINH'`,
    cacIdNguoiBan,
  );
  const moTaCoGhiChuAnh = await coSoDuLieu.layMot(
    `SELECT COUNT(*) AS so_luong FROM san_pham
     WHERE id IN (${cacIdSanPham.map(() => '?').join(',')})
       AND mo_ta LIKE ?`,
    [...cacIdSanPham, '%ảnh Wikimedia Commons chỉ để tham khảo%'],
  );
  const cacTep = await coSoDuLieu.truyVan(
    `SELECT DISTINCT t.duong_dan_tep FROM tep_dinh_kem t
     WHERE t.san_pham_id IN (${cacIdSanPham.map(() => '?').join(',')})
        OR t.kiem_dinh_san_pham_id IN (
          SELECT k.id FROM kiem_dinh_san_pham k
          WHERE k.san_pham_id IN (${cacIdSanPham.map(() => '?').join(',')})
        )
        OR t.tranh_chap_id IN (
          SELECT q.id FROM tranh_chap q
          JOIN don_hang d ON d.id=q.don_hang_id
          JOIN phien_dau_gia a ON a.id=d.phien_dau_gia_id
          WHERE a.san_pham_id IN (${cacIdSanPham.map(() => '?').join(',')})
        )`,
    [...cacIdSanPham, ...cacIdSanPham, ...cacIdSanPham],
  );
  let soTepCoTrenDia = 0;

  for (const tep of cacTep) {
    const duongDanTep = tep.duong_dan_tep.match(
      /^\/api\/uploads\/files\/(product|inspection|evidence)\/(\d+)\/([^/]+)$/,
    );

    if (!duongDanTep) {
      continue;
    }

    try {
      await tepTin.access(
        duongDan.join(cauHinh.uploadRoot, duongDanTep[1], duongDanTep[2], duongDanTep[3]),
      );
      soTepCoTrenDia += 1;
    } catch {
      // Báo cáo bên dưới sẽ dừng seed nếu tệp gắn với sản phẩm bị thiếu.
    }
  }

  const rolex = await coSoDuLieu.layMot(
    `SELECT d.trang_thai,d.so_tien_da_thu,d.tong_tien,d.trang_thai_giu_tien,g.so_sao,
            (SELECT COUNT(*) FROM thanh_toan t
             WHERE t.don_hang_id=d.id AND t.trang_thai='DA_THANH_TOAN') AS so_lan_thanh_toan
     FROM don_hang d JOIN phien_dau_gia a ON a.id=d.phien_dau_gia_id
     JOIN san_pham p ON p.id=a.san_pham_id
     LEFT JOIN danh_gia g ON g.don_hang_id=d.id
     WHERE p.tieu_de='Rolex Submariner – hồ sơ sưu tầm 14060M'
     ORDER BY d.id DESC LIMIT 1`,
  );
  const thamGiaRolex = await coSoDuLieu.layMot(
    `SELECT COUNT(DISTINCT x.nguoi_dung_id) AS so_nguoi_tham_gia,
            COUNT(DISTINCT CASE WHEN c.trang_thai IN
              ('DA_CHUYEN_VAO_DON','DA_HOAN_COC','KHONG_HOAN_COC')
              THEN c.nguoi_dung_id END) AS so_coc_da_thu,
            COUNT(DISTINCT b.id) AS so_luot_tra_gia
     FROM phien_dau_gia a JOIN san_pham p ON p.id=a.san_pham_id
     JOIN tham_gia_phien x ON x.phien_dau_gia_id=a.id
     LEFT JOIN dat_coc_dau_gia c
       ON c.phien_dau_gia_id=a.id AND c.nguoi_dung_id=x.nguoi_dung_id
     LEFT JOIN luot_tra_gia b ON b.phien_dau_gia_id=a.id
     WHERE p.tieu_de='Rolex Submariner – hồ sơ sưu tầm 14060M'`,
  );
  const omega = await coSoDuLieu.layMot(
    `SELECT d.trang_thai,d.ly_do_huy,d.can_admin_xu_ly,
            c.trang_thai AS trang_thai_coc,
            v.loai_vi_pham,n.trang_thai AS trang_thai_de_nghi,
            n.gia_de_nghi,b.so_tien AS gia_cong_khai,
            (SELECT d2.trang_thai FROM don_hang d2
             WHERE d2.id=n.don_hang_moi_id) AS trang_thai_don_tiep_theo,
            (SELECT d2.trang_thai_giu_tien FROM don_hang d2
             WHERE d2.id=n.don_hang_moi_id) AS giu_tien_don_tiep_theo,
            (SELECT COUNT(*) FROM danh_gia g2
             WHERE g2.don_hang_id=n.don_hang_moi_id AND g2.so_sao=5) AS so_danh_gia_tiep_theo,
            (SELECT COUNT(*) FROM vi_pham v2
             WHERE v2.don_hang_id=d.id AND v2.loai_vi_pham='KHONG_THANH_TOAN') AS so_vi_pham
     FROM san_pham p JOIN phien_dau_gia a ON a.san_pham_id=p.id
     JOIN don_hang d ON d.phien_dau_gia_id=a.id
     JOIN dat_coc_dau_gia c ON c.don_hang_id=d.id
     JOIN vi_pham v ON v.don_hang_id=d.id
     JOIN de_nghi_mua_tiep_theo n ON n.don_hang_goc_id=d.id
     JOIN luot_tra_gia b ON b.id=n.luot_tra_gia_nguon_id
     WHERE p.tieu_de='Omega Speedmaster Schumacher Edition'`,
  );
  const tranhChap = await coSoDuLieu.truyVan(
    `SELECT p.tieu_de,t.trang_thai AS trang_thai_tranh_chap,
            d.trang_thai AS trang_thai_don,d.trang_thai_giu_tien,
            d.so_tien_da_hoan,d.so_tien_da_giai_ngan,d.tong_tien,
            COUNT(e.id) AS so_bang_chung
     FROM tranh_chap t JOIN don_hang d ON d.id=t.don_hang_id
     JOIN phien_dau_gia a ON a.id=d.phien_dau_gia_id
     JOIN san_pham p ON p.id=a.san_pham_id
     LEFT JOIN tep_dinh_kem e ON e.tranh_chap_id=t.id
     WHERE p.tieu_de IN ('Bộ bình sứ Limoges – bộ sưu tập tư nhân',
                         'Bình phong sơn mài “Thiếu nữ và phong cảnh”')
     GROUP BY t.id,d.id,p.id`,
  );
  const soPhienDemo = await coSoDuLieu.layMot(
    "SELECT JSON_UNQUOTE(JSON_EXTRACT(du_lieu_moi,'$.soPhien')) AS so_luong FROM nhat_ky_hoat_dong WHERE ma_yeu_cau=?",
    [MA_DAU_HIEU],
  );

  if (
    duLieu.nguoiBan.length !== nguoiBanMau.length ||
    duLieu.nguoiMua.length !== nguoiMuaMau.length ||
    Number(hinhAnhChinh.so_luong) !== sanPhamMau.length ||
    Number(sanPhamDaDuyet.so_luong) !== sanPhamMau.length ||
    Number(soPhienThucTe.so_luong) !== 18 ||
    Number(nguoiBanDaXacMinh.so_luong) !== nguoiBanMau.length ||
    Number(moTaCoGhiChuAnh.so_luong) !== sanPhamMau.length ||
    cacTep.length !== sanPhamMau.length * 2 + 1 ||
    soTepCoTrenDia !== sanPhamMau.length * 2 + 1 ||
    Number(thamGiaRolex.so_nguoi_tham_gia) !== 5 ||
    Number(thamGiaRolex.so_coc_da_thu) !== 4 ||
    Number(thamGiaRolex.so_luot_tra_gia) < 4 ||
    rolex?.trang_thai !== 'HOAN_THANH' ||
    rolex?.trang_thai_giu_tien !== 'DA_GIAI_NGAN' ||
    Number(rolex?.so_tien_da_thu) !== Number(rolex?.tong_tien) ||
    Number(rolex?.so_lan_thanh_toan) !== 1 ||
    Number(rolex?.so_sao) !== 5 ||
    omega?.trang_thai !== 'DA_HUY' ||
    omega?.ly_do_huy !== 'KHONG_THANH_TOAN' ||
    Number(omega?.can_admin_xu_ly) !== 1 ||
    Number(omega?.so_vi_pham) !== 1 ||
    omega?.trang_thai_coc !== 'KHONG_HOAN_COC' ||
    omega?.trang_thai_de_nghi !== 'DA_CHAP_NHAN' ||
    Number(omega?.gia_de_nghi) !== Number(omega?.gia_cong_khai) ||
    omega?.trang_thai_don_tiep_theo !== 'HOAN_THANH' ||
    omega?.giu_tien_don_tiep_theo !== 'DA_GIAI_NGAN' ||
    Number(omega?.so_danh_gia_tiep_theo) !== 1 ||
    tranhChap.length !== 2 ||
    !tranhChap.some(
      (hang) =>
        hang.trang_thai_giu_tien === 'DA_HOAN_TIEN' &&
        Number(hang.so_tien_da_hoan) === Number(hang.tong_tien) &&
        Number(hang.so_bang_chung) > 0,
    ) ||
    !tranhChap.some(
      (hang) =>
        hang.trang_thai_giu_tien === 'DA_GIAI_NGAN' &&
        Number(hang.so_tien_da_giai_ngan) === Number(hang.tong_tien),
    )
  ) {
    throw new Error('Dữ liệu sau seed chưa khớp đủ các mối liên hệ nghiệp vụ đã yêu cầu.');
  }

  return {
    soNguoiBan: duLieu.nguoiBan.length,
    soNguoiMua: duLieu.nguoiMua.length,
    soNguoiBanDaXacMinh: Number(nguoiBanDaXacMinh.so_luong),
    soSanPham: Number(sanPhamDaDuyet.so_luong),
    soAnhChinh: Number(hinhAnhChinh.so_luong),
    soTep: cacTep.length,
    soTepCoTrenDia: soTepCoTrenDia,
    soPhien: Number(soPhienThucTe.so_luong),
    soPhienTrongNhatKy: Number(soPhienDemo.so_luong),
    rolex: {
      soNguoiThamGia: Number(thamGiaRolex.so_nguoi_tham_gia),
      soNguoiDatCoc: Number(thamGiaRolex.so_coc_da_thu),
      soLuotTraGia: Number(thamGiaRolex.so_luot_tra_gia),
      trangThaiDon: rolex.trang_thai,
      giuTien: rolex.trang_thai_giu_tien,
      soSao: Number(rolex.so_sao),
    },
    omega: {
      donGoc: omega.trang_thai,
      coc: omega.trang_thai_coc,
      secondChance: omega.trang_thai_de_nghi,
      giaCongKhai: Number(omega.gia_cong_khai),
      trangThaiDonTiepTheo: omega.trang_thai_don_tiep_theo,
    },
    tranhChap: tranhChap.map((hang) => ({
      sanPham: hang.tieu_de,
      trangThaiDon: hang.trang_thai_don,
      trangThaiGiuTien: hang.trang_thai_giu_tien,
      soBangChung: Number(hang.so_bang_chung),
    })),
  };
}

async function xoaTepDaTaoKhiLoi() {
  await Promise.all(
    cacTepDaTao.map(async (tep) => {
      try {
        await tepTin.unlink(tep);
      } catch (loi) {
        if (loi.code !== 'ENOENT') {
          throw loi;
        }
      }
    }),
  );
}

async function chay() {
  const apDung = process.argv.includes('--apply');
  const cheDoKhongThayDoi = process.argv.includes('--dry-run');
  const chiKiemTra = process.argv.includes('--verify');

  if ([apDung, cheDoKhongThayDoi, chiKiemTra].filter(Boolean).length > 1) {
    throw new Error('Chỉ chọn một trong --apply, --dry-run hoặc --verify.');
  }
  if (
    process.argv.some(
      (thamSo) => !['--apply', '--dry-run', '--verify'].includes(thamSo) && thamSo.startsWith('--'),
    )
  ) {
    throw new Error('Tham số không được hỗ trợ.');
  }

  const trangThai = await kiemTraMoiTruong();

  if (trangThai.daTungChay) {
    if (chiKiemTra) {
      const duLieu = await layDuLieuDemoDaNap();
      const baoCao = await kiemTraKetQua(duLieu);

      console.log(
        JSON.stringify(
          {
            ketQua: 'Du lieu demo VietBid hop le',
            csdl: TEN_CSDL,
            kiemTra: baoCao,
          },
          null,
          2,
        ),
      );

      return;
    }

    console.log('Bộ dữ liệu demo VietBid đã được nạp trước đó; không ghi lặp.');

    return;
  }
  if (chiKiemTra) {
    throw new Error('Chưa tìm thấy dấu hoàn tất của bộ dữ liệu demo để kiểm tra.');
  }

  const keHoach = {
    nguoiBan: nguoiBanMau.length,
    nguoiMua: nguoiMuaMau.length,
    sanPham: sanPhamMau.length,
    anhSanPham: sanPhamMau.length,
    phienMoi: 18,
    soBang: cacBangCanCo.length,
  };

  if (!apDung) {
    console.log(
      JSON.stringify(
        {
          cheDo: 'dry-run',
          csdl: TEN_CSDL,
          keHoach,
        },
        null,
        2,
      ),
    );

    return;
  }

  try {
    const quanTriRow = await coSoDuLieu.layMot(
      "SELECT id FROM nguoi_dung WHERE vai_tro='QUAN_TRI' ORDER BY id LIMIT 1",
    );
    const quanTri = taoNguoiDungDangNhap(quanTriRow.id, 'QUAN_TRI');
    const { duLieu, baoCao } = await coSoDuLieu.giaoDich(async () => {
      const duLieuMoi = await taoDuLieuDemo(quanTri);
      const baoCaoMoi = await kiemTraKetQua(duLieuMoi);

      return { duLieu: duLieuMoi, baoCao: baoCaoMoi };
    });

    console.log(
      JSON.stringify(
        {
          ketQua: 'Da nap bo du lieu demo VietBid',
          csdl: TEN_CSDL,
          dangNhapDemo: {
            matKhauChung: MAT_KHAU_DEMO,
            taiKhoanNguoiBan: duLieu.nguoiBan.map(({ ten, email }) => ({ ten, email })),
            taiKhoanNguoiMua: duLieu.nguoiMua.map(({ ten, email }) => ({ ten, email })),
          },
          kiemTra: baoCao,
        },
        null,
        2,
      ),
    );
  } catch (loi) {
    await xoaTepDaTaoKhiLoi();
    throw loi;
  }
}

chay()
  .catch((loi) => {
    const thongBaoLoi = loi.sqlMessage || loi.message || 'Lỗi không xác định';

    console.error(`Seed VietBid không hoàn tất${loi.code ? ` (${loi.code})` : ''}: ${thongBaoLoi}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await coSoDuLieu.nhomKetNoi.end();
  });
