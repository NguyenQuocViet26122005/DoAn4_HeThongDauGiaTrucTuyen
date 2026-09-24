// Chỉ sinh tệp thiết kế; không kết nối hoặc sửa MySQL.
const fs = require('node:fs');
const path = require('node:path');
const goc = path.resolve(__dirname, '../..');
const thuMuc = path.resolve(__dirname, '..');
const sqlCu = fs.readFileSync(path.join(thuMuc, 'lich-su/cau-truc-27-bang.sql'), 'utf8');
const cacBang = new Map(
  [...sqlCu.matchAll(/CREATE TABLE (\w+) \(([\s\S]*?)\) ENGINE=InnoDB;/g)].map((k) => [
    k[1],
    k[0].replace(/\r\n/g, '\n'),
  ]),
);
if (cacBang.size !== 27) {
  throw new Error('Schema nguồn không còn là 27 bảng đã đối chiếu.');
}

function thay(bang, cu, moi) {
  const sql = cacBang.get(bang);

  if (!sql?.includes(cu)) {
    throw new Error(`Không tìm thấy vị trí sửa trong ${bang}`);
  }
  cacBang.set(bang, sql.replace(cu, moi));
}

function them(bang, noiDung) {
  thay(bang, '    ngay_tao TIMESTAMP', noiDung.trimEnd() + '\n\n    ngay_tao TIMESTAMP');
}

function rangBuoc(bang, noiDung) {
  thay(bang, '\n) ENGINE=InnoDB;', ',\n\n' + noiDung.trimEnd() + '\n) ENGINE=InnoDB;');
}

cacBang.delete('giu_tien_trung_gian');
cacBang.delete('van_chuyen');
cacBang.delete('yeu_cau_huy_phien');

them(
  'phien_dau_gia',
  `    -- Phí cố định; 0 nghĩa là miễn phí. Chụp nguyên số tiền sang đơn.
    phi_van_chuyen DECIMAL(15,2) NOT NULL DEFAULT 0,`,
);
rangBuoc(
  'phien_dau_gia',
  `    CONSTRAINT ck_phien_phi CHECK (phi_van_chuyen >= 0),
    CONSTRAINT ck_phien_mua_ngay_san CHECK (gia_mua_ngay IS NULL OR gia_san IS NULL OR gia_mua_ngay >= gia_san),
    INDEX idx_phien_mo (trang_thai, thoi_gian_bat_dau),
    INDEX idx_phien_chot (trang_thai, thoi_gian_ket_thuc)`,
);
// Giữ độ chính xác tiền cũ; API giao dịch mới kiểm tra VND nguyên.
them(
  'don_hang',
  `    -- Giữ tiền mô phỏng, mỗi đơn chỉ quyết toán cuối một lần.
    trang_thai_giu_tien ENUM('CHO_GIU_TIEN','DANG_GIU','DA_GIAI_NGAN','DA_HOAN_TIEN','HOAN_TIEN_MOT_PHAN')
        NOT NULL DEFAULT 'CHO_GIU_TIEN',
    so_tien_da_thu DECIMAL(15,2) NOT NULL DEFAULT 0,
    so_tien_da_hoan DECIMAL(15,2) NOT NULL DEFAULT 0,
    so_tien_da_giai_ngan DECIMAL(15,2) NOT NULL DEFAULT 0,
    so_tien_dang_giu DECIMAL(15,2) GENERATED ALWAYS AS
        (so_tien_da_thu - so_tien_da_hoan - so_tien_da_giai_ngan) STORED,
    ngay_bat_dau_giu DATETIME NULL,
    ngay_giai_ngan DATETIME NULL,
    ngay_hoan_tien DATETIME NULL,
    ghi_chu_giu_tien VARCHAR(500),
    -- Chỉ lưu lịch sử cũ có hoàn một phần, không cho thao tác mới dùng trạng thái này.
    du_lieu_lich_su TINYINT(1) NOT NULL DEFAULT 0,

    -- Một lượt giao đi: giữ riêng ngày giao khai báo và ngày xác nhận nhận.
    don_vi_van_chuyen VARCHAR(100),
    ma_van_don VARCHAR(100),
    trang_thai_van_chuyen ENUM('CHO_XU_LY','DA_LAY_HANG','DANG_VAN_CHUYEN','DA_GIAO','THAT_BAI','DA_HOAN_TRA') NULL,
    ngay_gui_hang DATETIME NULL,
    ngay_giao_van_chuyen DATETIME NULL,
    moc_khieu_nai_chua_nhan DATETIME NULL,
    can_admin_xu_ly TINYINT(1) NOT NULL DEFAULT 0,
    ly_do_can_xu_ly VARCHAR(500),

    -- Siêu dữ liệu nguồn để đối chiếu khi chuyển đổi; tiền nằm ở cột DECIMAL phía trên.
    giu_tien_id_cu BIGINT UNSIGNED NULL UNIQUE,
    giu_tien_ngay_tao TIMESTAMP NULL,
    giu_tien_ngay_cap_nhat TIMESTAMP NULL,
    van_chuyen_id_cu BIGINT UNSIGNED NULL UNIQUE,
    van_chuyen_ngay_tao TIMESTAMP NULL,
    van_chuyen_ngay_cap_nhat TIMESTAMP NULL,`,
);
rangBuoc(
  'don_hang',
  `    CONSTRAINT ck_don_tong CHECK (tong_tien = gia_san_pham + phi_van_chuyen),
    CONSTRAINT ck_don_tien CHECK (so_tien_da_thu >= 0 AND so_tien_da_hoan >= 0
        AND so_tien_da_giai_ngan >= 0 AND so_tien_dang_giu >= 0),
    CONSTRAINT ck_don_tien_thu CHECK (so_tien_da_thu = 0 OR so_tien_da_thu = tong_tien),
    CONSTRAINT ck_don_co_lich_su CHECK (du_lieu_lich_su IN (0,1)),
    CONSTRAINT ck_don_can_xu_ly CHECK (can_admin_xu_ly IN (0,1)),
    CONSTRAINT ck_don_quyet_toan CHECK (
        (trang_thai_giu_tien='CHO_GIU_TIEN' AND so_tien_da_thu=0) OR
        (trang_thai_giu_tien='DANG_GIU' AND so_tien_da_thu>0 AND so_tien_dang_giu=so_tien_da_thu) OR
        (trang_thai_giu_tien='DA_GIAI_NGAN' AND so_tien_da_thu>0 AND so_tien_da_giai_ngan=so_tien_da_thu) OR
        (trang_thai_giu_tien='DA_HOAN_TIEN' AND so_tien_da_thu>0 AND so_tien_da_hoan=so_tien_da_thu) OR
        (trang_thai_giu_tien='HOAN_TIEN_MOT_PHAN' AND du_lieu_lich_su=1
          AND so_tien_da_hoan>0 AND so_tien_da_hoan<so_tien_da_thu AND so_tien_dang_giu=0)
    ),
    INDEX idx_don_thanh_toan_han (trang_thai, han_thanh_toan),
    INDEX idx_don_gui_han (trang_thai, han_nguoi_ban_gui_hang),
    INDEX idx_don_kiem_tra_han (trang_thai, han_kiem_tra),
    INDEX idx_don_van_don (ma_van_don),
    INDEX idx_don_can_xu_ly (can_admin_xu_ly, trang_thai)`,
);

them(
  'thanh_toan',
  `    -- Một thao tác gửi lại dùng cùng khóa; lần thử mới dùng khóa mới.
    khoa_yeu_cau VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL UNIQUE,`,
);
// Chỉ số duy nhất có điều kiện: giữ lịch sử nhưng chặn hai giao dịch cùng hiệu lực.
for (const [bang, cot, tenCot, dieuKien] of [
  ['don_hang', 'phien_dau_gia_id', 'phien_con_nghia_vu', "trang_thai <> 'DA_HUY'"],
  [
    'thanh_toan',
    'don_hang_id',
    'don_da_thu_tien',
    "trang_thai IN ('DA_THANH_TOAN','DA_HOAN_TIEN')",
  ],
  [
    'tranh_chap',
    'don_hang_id',
    'don_dang_tranh_chap',
    "trang_thai IN ('DANG_MO','NGUOI_BAN_DA_PHAN_HOI','QUAN_TRI_DANG_XU_LY')",
  ],
  ['de_nghi_mua_tiep_theo', 'phien_dau_gia_id', 'phien_dang_de_nghi', "trang_thai = 'CHO_XU_LY'"],
]) {
  them(
    bang,
    `    ${tenCot} BIGINT UNSIGNED GENERATED ALWAYS AS
        (CASE WHEN ${dieuKien} THEN ${cot} ELSE NULL END) STORED,`,
  );
  rangBuoc(bang, `    UNIQUE KEY uq_${tenCot} (${tenCot})`);

  const b = cacBang.get(bang);
  const re = new RegExp(
    '(FOREIGN KEY \\(' + cot + '\\) REFERENCES [\\s\\S]*?ON DELETE RESTRICT ON UPDATE )CASCADE',
  );

  if (!re.test(b)) {
    throw new Error('Không tìm thấy FK dùng cho cột sinh: ' + bang);
  }
  cacBang.set(bang, b.replace(re, '$1RESTRICT'));
}
them(
  'thong_bao',
  `    -- NULL dành cho dữ liệu cũ; nghiệp vụ mới đặt khóa theo sự kiện và đối tượng.
    khoa_su_kien VARCHAR(160) CHARACTER SET ascii COLLATE ascii_bin NULL,`,
);
rangBuoc('thong_bao', '    UNIQUE KEY uq_thong_bao_su_kien (nguoi_dung_id, khoa_su_kien)');
them(
  'vi_pham',
  `    -- Điểm cũ chỉ để đối chiếu, không dùng để tự phạt.
    hinh_thuc_xu_ly ENUM('CHUA_XU_LY','CANH_CAO','TAM_NGUNG','KHOA_TAI_KHOAN','KHONG_VI_PHAM') NOT NULL DEFAULT 'CHUA_XU_LY',
    ly_do_xu_ly VARCHAR(1000),
    nguoi_xu_ly_id BIGINT UNSIGNED NULL,
    ngay_xu_ly DATETIME NULL,`,
);
rangBuoc(
  'vi_pham',
  `    CONSTRAINT fk_vi_pham_nguoi_xu_ly FOREIGN KEY (nguoi_xu_ly_id) REFERENCES nguoi_dung(id)
        ON DELETE RESTRICT ON UPDATE CASCADE`,
);
them(
  'de_nghi_mua_tiep_theo',
  `    -- Giá có nguồn là một lượt công khai; không liên kết với bảng mức tối đa.
    luot_tra_gia_nguon_id BIGINT UNSIGNED NOT NULL,
    -- NULL chỉ để tiếp nhận đề nghị lịch sử vốn do job tạo; API mới yêu cầu người bán.
    nguoi_yeu_cau_id BIGINT UNSIGNED NULL,`,
);
rangBuoc(
  'de_nghi_mua_tiep_theo',
  `    CONSTRAINT fk_de_nghi_luot_cong_khai FOREIGN KEY (luot_tra_gia_nguon_id) REFERENCES luot_tra_gia(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_de_nghi_nguoi_yeu_cau FOREIGN KEY (nguoi_yeu_cau_id) REFERENCES nguoi_dung(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_de_nghi_han (trang_thai, het_han_luc)`,
);
rangBuoc(
  'luot_tra_gia',
  '    INDEX idx_luot_ung_vien (phien_dau_gia_id, nguoi_tra_gia_id, ngay_tao, id)',
);
rangBuoc('buoc_gia', '    CONSTRAINT ck_buoc_khoang CHECK (gia_den IS NULL OR gia_den >= gia_tu)');

const yeuCau = `CREATE TABLE yeu_cau_xu_ly (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    loai_yeu_cau ENUM('HUY_PHIEN','BAO_CAO_SAN_PHAM') NOT NULL,
    phien_dau_gia_id BIGINT UNSIGNED NULL,
    san_pham_id BIGINT UNSIGNED NULL,
    nguoi_yeu_cau_id BIGINT UNSIGNED NOT NULL,
    ma_ly_do VARCHAR(50),
    ly_do VARCHAR(1000) NOT NULL,
    trang_thai ENUM('CHO_XU_LY','DANG_XU_LY','DA_DUYET','TU_CHOI','CO_CO_SO','KHONG_CO_CO_SO')
        NOT NULL DEFAULT 'CHO_XU_LY',
    nguoi_duyet_id BIGINT UNSIGNED NULL,
    ghi_chu_duyet VARCHAR(1000),
    ngay_duyet DATETIME NULL,
    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Khóa có điều kiện: nhiều lịch sử đã đóng, chỉ một yêu cầu mở tương ứng.
    phien_huy_dang_mo BIGINT UNSIGNED GENERATED ALWAYS AS
        (CASE WHEN loai_yeu_cau='HUY_PHIEN' AND trang_thai IN ('CHO_XU_LY','DANG_XU_LY')
            THEN phien_dau_gia_id ELSE NULL END) STORED,
    san_pham_bao_cao_dang_mo BIGINT UNSIGNED GENERATED ALWAYS AS
        (CASE WHEN loai_yeu_cau='BAO_CAO_SAN_PHAM' AND trang_thai IN ('CHO_XU_LY','DANG_XU_LY')
            THEN san_pham_id ELSE NULL END) STORED,
    UNIQUE KEY uq_huy_dang_mo (phien_huy_dang_mo),
    UNIQUE KEY uq_bao_cao_dang_mo (nguoi_yeu_cau_id, san_pham_bao_cao_dang_mo),
    CONSTRAINT fk_yeu_cau_phien FOREIGN KEY (phien_dau_gia_id) REFERENCES phien_dau_gia(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_yeu_cau_san_pham FOREIGN KEY (san_pham_id) REFERENCES san_pham(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_yeu_cau_nguoi_gui FOREIGN KEY (nguoi_yeu_cau_id) REFERENCES nguoi_dung(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_yeu_cau_nguoi_duyet FOREIGN KEY (nguoi_duyet_id) REFERENCES nguoi_dung(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT ck_yeu_cau_doi_tuong CHECK (
        (loai_yeu_cau='HUY_PHIEN' AND phien_dau_gia_id IS NOT NULL AND san_pham_id IS NULL) OR
        (loai_yeu_cau='BAO_CAO_SAN_PHAM' AND san_pham_id IS NOT NULL AND phien_dau_gia_id IS NULL)
    ),
    CONSTRAINT ck_yeu_cau_trang_thai CHECK (
        trang_thai IN ('CHO_XU_LY','DANG_XU_LY') OR
        (loai_yeu_cau='HUY_PHIEN' AND trang_thai IN ('DA_DUYET','TU_CHOI')) OR
        (loai_yeu_cau='BAO_CAO_SAN_PHAM' AND trang_thai IN ('CO_CO_SO','KHONG_CO_CO_SO'))
    ),
    INDEX idx_yeu_cau_hang_doi (loai_yeu_cau, trang_thai, ngay_tao)
) ENGINE=InnoDB;`;
cacBang.set('yeu_cau_xu_ly', yeuCau);

// Phương án 19 bảng: dữ liệu giao dịch vẫn quan hệ, metadata linh hoạt dùng JSON.
for (const ten of [
  'thuoc_tinh_danh_muc',
  'gia_tri_thuoc_tinh_san_pham',
  'hinh_anh_san_pham',
  'bang_chung_tranh_chap',
  'muc_gia_toi_da',
  'danh_sach_theo_doi',
  'buoc_gia',
  'gia_han_phien_dau_gia',
]) {
  cacBang.delete(ten);
}
them(
  'danh_muc',
  `    -- Mảng định nghĩa: khóa, tên, kiểu nhập, đơn vị, lựa chọn, bắt buộc.
    cau_hinh_thuoc_tinh JSON NULL,`,
);
rangBuoc(
  'danh_muc',
  `    CONSTRAINT ck_danh_muc_thuoc_tinh CHECK
        (cau_hinh_thuoc_tinh IS NULL OR JSON_TYPE(cau_hinh_thuoc_tinh)='ARRAY')`,
);
them(
  'san_pham',
  `    -- Object theo khóa; lưu cả giá trị và tên/kiểu/đơn vị đã chụp lúc duyệt.
    thuoc_tinh_json JSON NULL,`,
);
rangBuoc(
  'san_pham',
  `    CONSTRAINT ck_san_pham_thuoc_tinh CHECK
        (thuoc_tinh_json IS NULL OR JSON_TYPE(thuoc_tinh_json)='OBJECT')`,
);
thay('cau_hinh_he_thong', 'gia_tri_cau_hinh VARCHAR(500)', 'gia_tri_cau_hinh TEXT');
rangBuoc(
  'cau_hinh_he_thong',
  `    CONSTRAINT ck_cau_hinh_json CHECK (kieu_du_lieu<>'JSON' OR JSON_VALID(gia_tri_cau_hinh))`,
);
them(
  'nhat_ky_hoat_dong',
  `    -- FK tường minh để lịch sử gia hạn không chỉ là dòng log văn bản.
    phien_dau_gia_id BIGINT UNSIGNED NULL,
    luot_tra_gia_id BIGINT UNSIGNED NULL,`,
);
rangBuoc(
  'nhat_ky_hoat_dong',
  `    CONSTRAINT fk_nhat_ky_phien FOREIGN KEY (phien_dau_gia_id) REFERENCES phien_dau_gia(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_nhat_ky_luot FOREIGN KEY (luot_tra_gia_id) REFERENCES luot_tra_gia(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT ck_nhat_ky_gia_han CHECK (hanh_dong<>'GIA_HAN_PHIEN' OR
        (phien_dau_gia_id IS NOT NULL AND du_lieu_moi IS NOT NULL AND JSON_TYPE(du_lieu_moi)='OBJECT'
         AND JSON_CONTAINS_PATH(du_lieu_moi,'all','$.thoi_gian_ket_thuc_cu','$.thoi_gian_ket_thuc_moi','$.so_giay_them')=1)),
    INDEX idx_nhat_ky_phien (phien_dau_gia_id, hanh_dong, ngay_tao)`,
);
cacBang.set(
  'tham_gia_phien',
  `CREATE TABLE tham_gia_phien (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    phien_dau_gia_id BIGINT UNSIGNED NOT NULL,
    nguoi_dung_id BIGINT UNSIGNED NOT NULL,
    dang_theo_doi TINYINT(1) NOT NULL DEFAULT 0,
    -- Riêng tư: NULL nghĩa là chưa cam kết, không được đếm thành người trả giá.
    gia_toi_da DECIMAL(15,2) NULL,
    thoi_gian_dat_gia_toi_da DATETIME NULL,
    -- Thời gian theo dõi không quyết định thứ tự ưu tiên đấu giá.
    ngay_theo_doi DATETIME NULL,
    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tham_gia_phien FOREIGN KEY (phien_dau_gia_id) REFERENCES phien_dau_gia(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_tham_gia_nguoi FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY uq_tham_gia (phien_dau_gia_id, nguoi_dung_id),
    CONSTRAINT ck_tham_gia_theo_doi CHECK (dang_theo_doi IN (0,1)),
    CONSTRAINT ck_tham_gia_cam_ket CHECK (
        (gia_toi_da IS NULL AND thoi_gian_dat_gia_toi_da IS NULL) OR
        (gia_toi_da IS NOT NULL AND gia_toi_da>0 AND thoi_gian_dat_gia_toi_da IS NOT NULL)),
    INDEX idx_tham_gia_theo_doi (nguoi_dung_id, dang_theo_doi)
) ENGINE=InnoDB;`,
);
cacBang.set(
  'tep_dinh_kem',
  `CREATE TABLE tep_dinh_kem (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    loai_tep ENUM('ANH_SAN_PHAM','BANG_CHUNG_TRANH_CHAP') NOT NULL,
    san_pham_id BIGINT UNSIGNED NULL,
    tranh_chap_id BIGINT UNSIGNED NULL,
    -- Ảnh sản phẩm cũ không ghi người tải: để NULL, không giả tác giả.
    nguoi_tai_len_id BIGINT UNSIGNED NULL,
    duong_dan_tep VARCHAR(255) NOT NULL,
    loai_noi_dung ENUM('HINH_ANH','VIDEO','TAI_LIEU','KHAC') NOT NULL DEFAULT 'HINH_ANH',
    la_anh_chinh TINYINT(1) NOT NULL DEFAULT 0,
    thu_tu INT NOT NULL DEFAULT 0,
    mo_ta VARCHAR(500),
    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    san_pham_anh_chinh BIGINT UNSIGNED GENERATED ALWAYS AS
        (CASE WHEN loai_tep='ANH_SAN_PHAM' AND la_anh_chinh=1 THEN san_pham_id ELSE NULL END) STORED,
    UNIQUE KEY uq_anh_chinh (san_pham_anh_chinh),
    CONSTRAINT fk_tep_san_pham FOREIGN KEY (san_pham_id) REFERENCES san_pham(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_tep_tranh_chap FOREIGN KEY (tranh_chap_id) REFERENCES tranh_chap(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_tep_nguoi_tai FOREIGN KEY (nguoi_tai_len_id) REFERENCES nguoi_dung(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT ck_tep_doi_tuong CHECK (
        (loai_tep='ANH_SAN_PHAM' AND san_pham_id IS NOT NULL AND tranh_chap_id IS NULL AND loai_noi_dung='HINH_ANH') OR
        (loai_tep='BANG_CHUNG_TRANH_CHAP' AND tranh_chap_id IS NOT NULL AND san_pham_id IS NULL AND la_anh_chinh=0)),
    CONSTRAINT ck_tep_anh_chinh CHECK (la_anh_chinh IN (0,1)),
    INDEX idx_tep_san_pham (san_pham_id, thu_tu),
    INDEX idx_tep_tranh_chap (tranh_chap_id, ngay_tao)
) ENGINE=InnoDB;`,
);

const nhom = [
  {
    id: '01-tai-khoan',
    ten: 'Tài khoản',
    bang: ['nguoi_dung', 'xac_minh_nguoi_ban', 'dia_chi_nguoi_dung'],
  },
  {
    id: '02-san-pham',
    ten: 'Danh mục và sản phẩm',
    bang: ['danh_muc', 'san_pham'],
  },
  {
    id: '03-dau-gia',
    ten: 'Đấu giá',
    bang: ['phien_dau_gia', 'tham_gia_phien', 'luot_tra_gia'],
  },
  {
    id: '04-giao-dich',
    ten: 'Đơn hàng và thanh toán',
    bang: ['don_hang', 'thanh_toan', 'de_nghi_mua_tiep_theo'],
  },
  {
    id: '05-hau-mai',
    ten: 'Tranh chấp và tệp',
    bang: ['tranh_chap', 'tep_dinh_kem', 'danh_gia'],
  },
  {
    id: '06-quan-tri',
    ten: 'Quản trị và thông báo',
    bang: ['yeu_cau_xu_ly', 'vi_pham', 'thong_bao', 'cau_hinh_he_thong', 'nhat_ky_hoat_dong'],
  },
];
// Đưa yêu cầu sau phiên; các nhóm khác giữ thứ tự khóa ngoại gốc.
const thuTu = nhom.flatMap((n) => n.bang);
if (thuTu.length !== 19 || new Set(thuTu).size !== 19) {
  throw new Error('Sai số bảng.');
}
const dau = `-- ĐỒ ÁN 4: THIẾT KẾ 19 BẢNG, NGHIỆP VỤ 2.1
-- MySQL 8.0.16 trở lên; đã kiểm thử thực tế theo báo cáo kèm theo.
-- Database thiết kế riêng. KHÔNG thay DB_NAME của backend đang chạy.
-- Không xóa/ghi đè database cũ; chạy lại khi đã có database này sẽ báo lỗi.
-- Chạy nguyên tệp bằng Workbench. Không bỏ qua lỗi hoặc dùng tùy chọn --force.
-- Không chứa tài khoản, mật khẩu hoặc dữ liệu người dùng mẫu.
CREATE DATABASE doan4_daugia_thiet_ke_19 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE doan4_daugia_thiet_ke_19;
SET NAMES utf8mb4;
SET time_zone = '+07:00';

`;
let sql = dau;
for (const n of nhom) {
  sql +=
    `-- ===== ${n.ten.toUpperCase()} (${n.bang.length} bảng) =====\n\n` +
    n.bang.map((b) => cacBang.get(b)).join('\n\n') +
    '\n\n';
}
let triggers = [...sqlCu.matchAll(/CREATE TRIGGER (\w+)[\s\S]*?END\$\$/g)].map((m) =>
  m[0].replace(/\r\n/g, '\n'),
);
triggers = triggers.map((t) =>
  t.includes('ON muc_gia_toi_da')
    ? t
        .replace('ON muc_gia_toi_da', 'ON tham_gia_phien')
        .replace('IF EXISTS (', 'IF NEW.gia_toi_da IS NOT NULL AND EXISTS (')
        .replaceAll('NEW.nguoi_tra_gia_id', 'NEW.nguoi_dung_id')
    : t,
);
triggers = triggers.flatMap((t) => [
  t,
  t.replace(/(CREATE TRIGGER \w+)/, '$1_sua').replace('BEFORE INSERT', 'BEFORE UPDATE'),
]);
const baoVeDeNghi = `CREATE TRIGGER trg_de_nghi_gia_cong_khai
BEFORE INSERT ON de_nghi_mua_tiep_theo
FOR EACH ROW
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM luot_tra_gia l JOIN phien_dau_gia p ON p.id=l.phien_dau_gia_id
        WHERE l.id=NEW.luot_tra_gia_nguon_id AND l.phien_dau_gia_id=NEW.phien_dau_gia_id
          AND l.nguoi_tra_gia_id=NEW.nguoi_tra_gia_id AND l.so_tien=NEW.gia_de_nghi
          AND l.ngay_tao>=p.thoi_gian_bat_dau AND l.ngay_tao<=p.thoi_gian_ket_thuc
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Giá đề nghị phải khớp lượt công khai hợp lệ';
    END IF;
END$$`;
triggers.push(
  baoVeDeNghi,
  baoVeDeNghi
    .replace('trg_de_nghi_gia_cong_khai', 'trg_de_nghi_gia_cong_khai_sua')
    .replace('BEFORE INSERT', 'BEFORE UPDATE'),
);
sql +=
  '-- Bảo vệ cơ bản ở CSDL; không thay thế khóa/thuật toán/phân quyền ở service.\nDELIMITER $$\n\n' +
  triggers.join('\n\n') +
  '\n\nDELIMITER ;\n\n';
const views = [...sqlCu.matchAll(/CREATE VIEW (\w+) AS[\s\S]*?;/g)].map((m) =>
  m[0].replace(/\r\n/g, '\n'),
);
sql += views.join('\n\n') + '\n';
fs.writeFileSync(path.join(thuMuc, '01-tao-csdl-19-bang.sql'), sql);
const moHinh = nhom.map((n) => ({
  ...n,
  bang: n.bang.map((ten) => {
    const ddl = cacBang.get(ten);
    const cot = [
      ...ddl.matchAll(
        /^    (\w+) (BIGINT|VARCHAR|ENUM|DATETIME|TIMESTAMP|TINYINT|INT|DECIMAL|JSON|TEXT)\b([^\n]*)/gm,
      ),
    ].map((m) => ({
      ten: m[1],
      kieu: m[2],
      moTa: m[3].trim(),
    }));
    const lienKet = [...ddl.matchAll(/FOREIGN KEY \((\w+)\) REFERENCES (\w+)\((\w+)\)/g)].map(
      (m) => ({
        cot: m[1],
        bangCha: m[2],
        cotCha: m[3],
      }),
    );

    return {
      ten,
      cot,
      lienKet,
    };
  }),
}));
fs.writeFileSync(path.join(thuMuc, 'mo-hinh.json'), JSON.stringify(moHinh, null, 2) + '\n');
console.log(
  JSON.stringify({
    bang: thuTu.length,
    khoaNgoai: moHinh.flatMap((n) => n.bang).reduce((s, b) => s + b.lienKet.length, 0),
    trigger: triggers.length,
    view: views.length,
  }),
);
