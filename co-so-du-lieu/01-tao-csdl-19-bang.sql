-- ĐỒ ÁN 4: THIẾT KẾ 19 BẢNG, NGHIỆP VỤ 2.1
-- MySQL 8.0.16 trở lên; đã kiểm thử thực tế theo báo cáo kèm theo.
-- Database thiết kế riêng. KHÔNG thay DB_NAME của backend đang chạy.
-- Không xóa/ghi đè database cũ; chạy lại khi đã có database này sẽ báo lỗi.
-- Chạy nguyên tệp bằng Workbench. Không bỏ qua lỗi hoặc dùng tùy chọn --force.
-- Không chứa tài khoản, mật khẩu hoặc dữ liệu người dùng mẫu.
CREATE DATABASE doan4_daugia_thiet_ke_19 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE doan4_daugia_thiet_ke_19;
SET NAMES utf8mb4;
SET time_zone = '+07:00';

-- ===== TÀI KHOẢN (3 bảng) =====

CREATE TABLE nguoi_dung (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ho_ten VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    mat_khau_bam VARCHAR(255) NOT NULL,
    so_dien_thoai VARCHAR(20) UNIQUE,
    anh_dai_dien VARCHAR(255),

    vai_tro ENUM('NGUOI_DUNG', 'QUAN_TRI') NOT NULL DEFAULT 'NGUOI_DUNG',

    trang_thai_nguoi_ban ENUM(
        'CHUA_DANG_KY',
        'CHO_XU_LY',
        'DA_XAC_MINH',
        'TU_CHOI'
    ) NOT NULL DEFAULT 'CHUA_DANG_KY',

    trang_thai_tai_khoan ENUM(
        'HOAT_DONG',
        'BI_KHOA',
        'TAM_NGUNG'
    ) NOT NULL DEFAULT 'HOAT_DONG',

    ngay_xac_minh_email DATETIME NULL,
    lan_dang_nhap_cuoi DATETIME NULL,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_role (vai_tro),
    INDEX idx_users_seller_status (trang_thai_nguoi_ban),
    INDEX idx_users_account_status (trang_thai_tai_khoan)
) ENGINE=InnoDB;

CREATE TABLE xac_minh_nguoi_ban (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nguoi_dung_id BIGINT UNSIGNED NOT NULL,

    loai_giay_to ENUM('CCCD', 'HO_CHIEU', 'KHAC') NOT NULL DEFAULT 'CCCD',
    so_giay_to VARCHAR(50) NOT NULL,
    anh_mat_truoc VARCHAR(255),
    anh_mat_sau VARCHAR(255),
    anh_selfie VARCHAR(255),

    ten_ngan_hang VARCHAR(100),
    so_tai_khoan VARCHAR(50),
    chu_tai_khoan VARCHAR(100),

    trang_thai ENUM('CHO_XU_LY', 'DA_XAC_MINH', 'TU_CHOI') NOT NULL DEFAULT 'CHO_XU_LY',
    ly_do_tu_choi VARCHAR(500),

    ngay_gui_ho_so DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_duyet DATETIME NULL,
    nguoi_duyet_id BIGINT UNSIGNED NULL,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_seller_verification_user
        FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_seller_verification_admin
        FOREIGN KEY (nguoi_duyet_id) REFERENCES nguoi_dung(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_seller_verification_user (nguoi_dung_id),
    INDEX idx_seller_verification_status (trang_thai)
) ENGINE=InnoDB;

CREATE TABLE dia_chi_nguoi_dung (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nguoi_dung_id BIGINT UNSIGNED NOT NULL,

    ten_nguoi_nhan VARCHAR(100) NOT NULL,
    sdt_nguoi_nhan VARCHAR(20) NOT NULL,
    tinh_thanh VARCHAR(100) NOT NULL,
    quan_huyen VARCHAR(100) NOT NULL,
    phuong_xa VARCHAR(100) NOT NULL,
    dia_chi_chi_tiet VARCHAR(255) NOT NULL,

    la_mac_dinh TINYINT(1) NOT NULL DEFAULT 0,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_address_user
        FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_address_user (nguoi_dung_id)
) ENGINE=InnoDB;

-- ===== DANH MỤC VÀ SẢN PHẨM (2 bảng) =====

CREATE TABLE danh_muc (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    danh_muc_cha_id BIGINT UNSIGNED NULL,

    ten VARCHAR(120) NOT NULL,
    duong_dan VARCHAR(150) NOT NULL UNIQUE,
    mo_ta VARCHAR(500),
    duong_dan_anh VARCHAR(255),

    dang_hoat_dong TINYINT(1) NOT NULL DEFAULT 1,
    thu_tu INT NOT NULL DEFAULT 0,

    -- Mảng định nghĩa: khóa, tên, kiểu nhập, đơn vị, lựa chọn, bắt buộc.
    cau_hinh_thuoc_tinh JSON NULL,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_category_parent
        FOREIGN KEY (danh_muc_cha_id) REFERENCES danh_muc(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_category_parent (danh_muc_cha_id),
    INDEX idx_category_active (dang_hoat_dong),

    CONSTRAINT ck_danh_muc_thuoc_tinh CHECK
        (cau_hinh_thuoc_tinh IS NULL OR JSON_TYPE(cau_hinh_thuoc_tinh)='ARRAY')
) ENGINE=InnoDB;

CREATE TABLE san_pham (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nguoi_ban_id BIGINT UNSIGNED NOT NULL,
    danh_muc_id BIGINT UNSIGNED NOT NULL,

    tieu_de VARCHAR(200) NOT NULL,
    duong_dan VARCHAR(220) NOT NULL UNIQUE,
    mo_ta TEXT NOT NULL,

    tinh_trang_san_pham ENUM(
        'MOI',
        'NHU_MOI',
        'DA_QUA_SU_DUNG_TOT',
        'DA_QUA_SU_DUNG',
        'LAY_LINH_KIEN'
    ) NOT NULL,

    thuong_hieu VARCHAR(100),

    trang_thai_duyet ENUM(
        'BAN_NHAP',
        'CHO_XU_LY',
        'DA_DUYET',
        'TU_CHOI',
        'LUU_TRU'
    ) NOT NULL DEFAULT 'BAN_NHAP',

    ly_do_tu_choi VARCHAR(500),

    nguoi_duyet_id BIGINT UNSIGNED NULL,
    ngay_duyet DATETIME NULL,

    -- Object theo khóa; lưu cả giá trị và tên/kiểu/đơn vị đã chụp lúc duyệt.
    thuoc_tinh_json JSON NULL,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_seller
        FOREIGN KEY (nguoi_ban_id) REFERENCES nguoi_dung(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_product_category
        FOREIGN KEY (danh_muc_id) REFERENCES danh_muc(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_product_reviewer
        FOREIGN KEY (nguoi_duyet_id) REFERENCES nguoi_dung(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_product_seller (nguoi_ban_id),
    INDEX idx_product_category (danh_muc_id),
    INDEX idx_product_approval (trang_thai_duyet),

    CONSTRAINT ck_san_pham_thuoc_tinh CHECK
        (thuoc_tinh_json IS NULL OR JSON_TYPE(thuoc_tinh_json)='OBJECT')
) ENGINE=InnoDB;

-- ===== ĐẤU GIÁ (3 bảng) =====

CREATE TABLE phien_dau_gia (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    san_pham_id BIGINT UNSIGNED NOT NULL,

    gia_khoi_diem DECIMAL(15,2) NOT NULL,
    gia_san DECIMAL(15,2) NULL,
    gia_mua_ngay DECIMAL(15,2) NULL,
    cho_phep_mua_ngay TINYINT(1) NOT NULL DEFAULT 0,

    gia_hien_tai DECIMAL(15,2) NOT NULL,
    nguoi_dan_dau_id BIGINT UNSIGNED NULL,

    thoi_gian_bat_dau DATETIME NOT NULL,
    thoi_gian_ket_thuc_goc DATETIME NOT NULL,
    thoi_gian_ket_thuc DATETIME NOT NULL,

    trang_thai ENUM(
        'DA_LEN_LICH',
        'HOAT_DONG',
        'DA_KET_THUC',
        'THAT_BAI',
        'DA_HUY'
    ) NOT NULL DEFAULT 'DA_LEN_LICH',

    ly_do_ket_thuc ENUM(
        'CO_NGUOI_THANG',
        'KHONG_CO_TRA_GIA',
        'KHONG_DAT_GIA_SAN',
        'MUA_NGAY',
        'QUAN_TRI_HUY',
        'HUY_THEO_YEU_CAU_NGUOI_BAN'
    ) NULL,

    dat_gia_san TINYINT(1) NOT NULL DEFAULT 0,

    bat_chong_phut_chot TINYINT(1) NOT NULL DEFAULT 1,
    nguong_phut_chot_giay INT NOT NULL DEFAULT 60,
    so_giay_gia_han INT NOT NULL DEFAULT 90,
    so_lan_gia_han INT NOT NULL DEFAULT 0,

    tong_luot_tra_gia INT NOT NULL DEFAULT 0,

    -- Phí cố định; 0 nghĩa là miễn phí. Chụp nguyên số tiền sang đơn.
    phi_van_chuyen DECIMAL(15,2) NOT NULL DEFAULT 0,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_auction_product
        FOREIGN KEY (san_pham_id) REFERENCES san_pham(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_auction_current_winner
        FOREIGN KEY (nguoi_dan_dau_id) REFERENCES nguoi_dung(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    CHECK (gia_khoi_diem >= 0),
    CHECK (gia_hien_tai >= 0),
    CHECK (gia_san IS NULL OR gia_san >= gia_khoi_diem),
    CHECK (gia_mua_ngay IS NULL OR gia_mua_ngay >= gia_khoi_diem),
    CHECK (thoi_gian_ket_thuc >= thoi_gian_bat_dau),

    INDEX idx_auction_product (san_pham_id),
    INDEX idx_auction_status (trang_thai),
    INDEX idx_auction_start (thoi_gian_bat_dau),
    INDEX idx_auction_end (thoi_gian_ket_thuc),

    CONSTRAINT ck_phien_phi CHECK (phi_van_chuyen >= 0),
    CONSTRAINT ck_phien_mua_ngay_san CHECK (gia_mua_ngay IS NULL OR gia_san IS NULL OR gia_mua_ngay >= gia_san),
    INDEX idx_phien_mo (trang_thai, thoi_gian_bat_dau),
    INDEX idx_phien_chot (trang_thai, thoi_gian_ket_thuc)
) ENGINE=InnoDB;

CREATE TABLE tham_gia_phien (
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
) ENGINE=InnoDB;

CREATE TABLE luot_tra_gia (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    phien_dau_gia_id BIGINT UNSIGNED NOT NULL,
    nguoi_tra_gia_id BIGINT UNSIGNED NOT NULL,

    so_tien DECIMAL(15,2) NOT NULL,
    loai_tra_gia ENUM('TRUC_TIEP', 'TU_DONG') NOT NULL DEFAULT 'TRUC_TIEP',

    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bid_auction
        FOREIGN KEY (phien_dau_gia_id) REFERENCES phien_dau_gia(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_bid_bidder
        FOREIGN KEY (nguoi_tra_gia_id) REFERENCES nguoi_dung(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    INDEX idx_bid_auction_time (phien_dau_gia_id, ngay_tao),
    INDEX idx_bid_bidder (nguoi_tra_gia_id),

    CHECK (so_tien > 0),

    INDEX idx_luot_ung_vien (phien_dau_gia_id, nguoi_tra_gia_id, ngay_tao, id)
) ENGINE=InnoDB;

-- ===== ĐƠN HÀNG VÀ THANH TOÁN (3 bảng) =====

CREATE TABLE don_hang (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ma_don_hang VARCHAR(30) NOT NULL UNIQUE,

    phien_dau_gia_id BIGINT UNSIGNED NOT NULL,
    nguoi_mua_id BIGINT UNSIGNED NOT NULL,
    nguoi_ban_id BIGINT UNSIGNED NOT NULL,

    nguon_don ENUM('THANG_DAU_GIA', 'DE_NGHI_TIEP_THEO') NOT NULL DEFAULT 'THANG_DAU_GIA',

    gia_san_pham DECIMAL(15,2) NOT NULL,
    phi_van_chuyen DECIMAL(15,2) NOT NULL DEFAULT 0,
    tong_tien DECIMAL(15,2) NOT NULL,

    trang_thai ENUM(
        'CHO_THANH_TOAN',
        'DA_THANH_TOAN',
        'CHO_GUI_HANG',
        'DA_GUI_HANG',
        'DA_GIAO',
        'DANG_KIEM_TRA',
        'DANG_TRANH_CHAP',
        'HOAN_THANH',
        'DA_HUY'
    ) NOT NULL DEFAULT 'CHO_THANH_TOAN',

    han_thanh_toan DATETIME NULL,
    han_nguoi_ban_gui_hang DATETIME NULL,
    ngay_giao_hang DATETIME NULL,
    han_kiem_tra DATETIME NULL,
    ngay_hoan_thanh DATETIME NULL,
    ngay_huy DATETIME NULL,
    ly_do_huy VARCHAR(500),

    ten_nguoi_nhan VARCHAR(100) NOT NULL,
    sdt_nguoi_nhan VARCHAR(20) NOT NULL,
    dia_chi_giao_hang VARCHAR(500) NOT NULL,

    -- Giữ tiền mô phỏng, mỗi đơn chỉ quyết toán cuối một lần.
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
    van_chuyen_ngay_cap_nhat TIMESTAMP NULL,

    phien_con_nghia_vu BIGINT UNSIGNED GENERATED ALWAYS AS
        (CASE WHEN trang_thai <> 'DA_HUY' THEN phien_dau_gia_id ELSE NULL END) STORED,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_auction
        FOREIGN KEY (phien_dau_gia_id) REFERENCES phien_dau_gia(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,

    CONSTRAINT fk_order_buyer
        FOREIGN KEY (nguoi_mua_id) REFERENCES nguoi_dung(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_order_seller
        FOREIGN KEY (nguoi_ban_id) REFERENCES nguoi_dung(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CHECK (gia_san_pham >= 0),
    CHECK (phi_van_chuyen >= 0),
    CHECK (tong_tien >= 0),

    INDEX idx_order_auction (phien_dau_gia_id),
    INDEX idx_order_buyer_status (nguoi_mua_id, trang_thai),
    INDEX idx_order_seller_status (nguoi_ban_id, trang_thai),

    CONSTRAINT ck_don_tong CHECK (tong_tien = gia_san_pham + phi_van_chuyen),
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
    INDEX idx_don_can_xu_ly (can_admin_xu_ly, trang_thai),

    UNIQUE KEY uq_phien_con_nghia_vu (phien_con_nghia_vu)
) ENGINE=InnoDB;

CREATE TABLE thanh_toan (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    don_hang_id BIGINT UNSIGNED NOT NULL,

    phuong_thuc_thanh_toan ENUM(
        'MO_PHONG',
        'CHUYEN_KHOAN',
        'VI_DIEN_TU',
        'THE'
    ) NOT NULL DEFAULT 'MO_PHONG',

    so_tien DECIMAL(15,2) NOT NULL,

    trang_thai ENUM(
        'CHO_XU_LY',
        'DA_THANH_TOAN',
        'THAT_BAI',
        'HET_HAN',
        'DA_HOAN_TIEN'
    ) NOT NULL DEFAULT 'CHO_XU_LY',

    ma_giao_dich VARCHAR(100) UNIQUE,
    ngay_thanh_toan DATETIME NULL,
    ngay_het_han DATETIME NULL,

    -- Một thao tác gửi lại dùng cùng khóa; lần thử mới dùng khóa mới.
    khoa_yeu_cau VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL UNIQUE,

    don_da_thu_tien BIGINT UNSIGNED GENERATED ALWAYS AS
        (CASE WHEN trang_thai IN ('DA_THANH_TOAN','DA_HOAN_TIEN') THEN don_hang_id ELSE NULL END) STORED,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_order
        FOREIGN KEY (don_hang_id) REFERENCES don_hang(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,

    CHECK (so_tien >= 0),

    INDEX idx_payment_order (don_hang_id),
    INDEX idx_payment_status (trang_thai),

    UNIQUE KEY uq_don_da_thu_tien (don_da_thu_tien)
) ENGINE=InnoDB;

CREATE TABLE de_nghi_mua_tiep_theo (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    phien_dau_gia_id BIGINT UNSIGNED NOT NULL,
    don_hang_goc_id BIGINT UNSIGNED NOT NULL,
    nguoi_tra_gia_id BIGINT UNSIGNED NOT NULL,

    -- Giá đề nghị phải lấy từ giá trả hợp lệ công khai cuối cùng của người này,
    -- KHÔNG lấy mức giá tối đa bí mật.
    gia_de_nghi DECIMAL(15,2) NOT NULL,

    trang_thai ENUM(
        'CHO_XU_LY',
        'DA_CHAP_NHAN',
        'TU_CHOI',
        'HET_HAN'
    ) NOT NULL DEFAULT 'CHO_XU_LY',

    het_han_luc DATETIME NOT NULL,
    ngay_phan_hoi DATETIME NULL,

    don_hang_moi_id BIGINT UNSIGNED NULL,

    phien_dang_de_nghi BIGINT UNSIGNED GENERATED ALWAYS AS
        (CASE WHEN trang_thai = 'CHO_XU_LY' THEN phien_dau_gia_id ELSE NULL END) STORED,

    -- Giá có nguồn là một lượt công khai; không liên kết với bảng mức tối đa.
    luot_tra_gia_nguon_id BIGINT UNSIGNED NOT NULL,
    -- NULL chỉ để tiếp nhận đề nghị lịch sử vốn do job tạo; API mới yêu cầu người bán.
    nguoi_yeu_cau_id BIGINT UNSIGNED NULL,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_second_chance_auction
        FOREIGN KEY (phien_dau_gia_id) REFERENCES phien_dau_gia(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,

    CONSTRAINT fk_second_chance_original_order
        FOREIGN KEY (don_hang_goc_id) REFERENCES don_hang(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_second_chance_bidder
        FOREIGN KEY (nguoi_tra_gia_id) REFERENCES nguoi_dung(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_second_chance_result_order
        FOREIGN KEY (don_hang_moi_id) REFERENCES don_hang(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    UNIQUE KEY uq_second_chance_auction_bidder (phien_dau_gia_id, nguoi_tra_gia_id),
    INDEX idx_second_chance_status (trang_thai),

    CHECK (gia_de_nghi > 0),

    UNIQUE KEY uq_phien_dang_de_nghi (phien_dang_de_nghi),

    CONSTRAINT fk_de_nghi_luot_cong_khai FOREIGN KEY (luot_tra_gia_nguon_id) REFERENCES luot_tra_gia(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_de_nghi_nguoi_yeu_cau FOREIGN KEY (nguoi_yeu_cau_id) REFERENCES nguoi_dung(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_de_nghi_han (trang_thai, het_han_luc)
) ENGINE=InnoDB;

-- ===== TRANH CHẤP VÀ TỆP (3 bảng) =====

CREATE TABLE tranh_chap (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    don_hang_id BIGINT UNSIGNED NOT NULL,
    nguoi_mo_id BIGINT UNSIGNED NOT NULL,

    ly_do ENUM(
        'CHUA_NHAN_HANG',
        'KHONG_DUNG_MO_TA',
        'HONG_HOC',
        'HANG_GIA',
        'KHAC'
    ) NOT NULL,

    mo_ta TEXT NOT NULL,

    trang_thai ENUM(
        'DANG_MO',
        'NGUOI_BAN_DA_PHAN_HOI',
        'QUAN_TRI_DANG_XU_LY',
        'GIAI_QUYET_CHO_NGUOI_MUA',
        'GIAI_QUYET_CHO_NGUOI_BAN',
        'DA_HUY'
    ) NOT NULL DEFAULT 'DANG_MO',

    phan_hoi_nguoi_ban TEXT NULL,

    ket_qua_xu_ly TEXT NULL,
    so_tien_hoan DECIMAL(15,2) NOT NULL DEFAULT 0,

    nguoi_xu_ly_id BIGINT UNSIGNED NULL,

    ngay_mo DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_giai_quyet DATETIME NULL,

    don_dang_tranh_chap BIGINT UNSIGNED GENERATED ALWAYS AS
        (CASE WHEN trang_thai IN ('DANG_MO','NGUOI_BAN_DA_PHAN_HOI','QUAN_TRI_DANG_XU_LY') THEN don_hang_id ELSE NULL END) STORED,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_dispute_order
        FOREIGN KEY (don_hang_id) REFERENCES don_hang(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,

    CONSTRAINT fk_dispute_opened_by
        FOREIGN KEY (nguoi_mo_id) REFERENCES nguoi_dung(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_dispute_admin
        FOREIGN KEY (nguoi_xu_ly_id) REFERENCES nguoi_dung(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    CHECK (so_tien_hoan >= 0),

    INDEX idx_dispute_order (don_hang_id),
    INDEX idx_dispute_status (trang_thai),

    UNIQUE KEY uq_don_dang_tranh_chap (don_dang_tranh_chap)
) ENGINE=InnoDB;

CREATE TABLE tep_dinh_kem (
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
) ENGINE=InnoDB;

CREATE TABLE danh_gia (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    don_hang_id BIGINT UNSIGNED NOT NULL,
    nguoi_danh_gia_id BIGINT UNSIGNED NOT NULL,
    nguoi_duoc_danh_gia_id BIGINT UNSIGNED NOT NULL,

    so_sao TINYINT UNSIGNED NOT NULL,
    nhan_xet VARCHAR(1000),

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_review_order
        FOREIGN KEY (don_hang_id) REFERENCES don_hang(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_review_reviewer
        FOREIGN KEY (nguoi_danh_gia_id) REFERENCES nguoi_dung(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_review_reviewee
        FOREIGN KEY (nguoi_duoc_danh_gia_id) REFERENCES nguoi_dung(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    UNIQUE KEY uq_review_per_order_user (don_hang_id, nguoi_danh_gia_id),

    CHECK (so_sao BETWEEN 1 AND 5),

    INDEX idx_review_reviewee (nguoi_duoc_danh_gia_id)
) ENGINE=InnoDB;

-- ===== QUẢN TRỊ VÀ THÔNG BÁO (5 bảng) =====

CREATE TABLE yeu_cau_xu_ly (
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
) ENGINE=InnoDB;

CREATE TABLE vi_pham (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nguoi_dung_id BIGINT UNSIGNED NOT NULL,

    phien_dau_gia_id BIGINT UNSIGNED NULL,
    don_hang_id BIGINT UNSIGNED NULL,

    loai_vi_pham ENUM(
        'KHONG_THANH_TOAN',
        'GIAO_HANG_MUON',
        'TU_DAU_GIA',
        'GIAN_LAN',
        'LAM_DUNG',
        'KHAC'
    ) NOT NULL,

    mo_ta VARCHAR(1000) NOT NULL,
    diem_vi_pham INT NOT NULL DEFAULT 1,

    trang_thai ENUM('DANG_MO', 'DA_XAC_NHAN', 'DA_HUY') NOT NULL DEFAULT 'DANG_MO',

    nguoi_tao_id BIGINT UNSIGNED NULL,
    ngay_xac_nhan DATETIME NULL,

    -- Điểm cũ chỉ để đối chiếu, không dùng để tự phạt.
    hinh_thuc_xu_ly ENUM('CHUA_XU_LY','CANH_CAO','TAM_NGUNG','KHOA_TAI_KHOAN','KHONG_VI_PHAM') NOT NULL DEFAULT 'CHUA_XU_LY',
    ly_do_xu_ly VARCHAR(1000),
    nguoi_xu_ly_id BIGINT UNSIGNED NULL,
    ngay_xu_ly DATETIME NULL,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_violation_user
        FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_violation_auction
        FOREIGN KEY (phien_dau_gia_id) REFERENCES phien_dau_gia(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT fk_violation_order
        FOREIGN KEY (don_hang_id) REFERENCES don_hang(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT fk_violation_created_by
        FOREIGN KEY (nguoi_tao_id) REFERENCES nguoi_dung(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_violation_user (nguoi_dung_id),
    INDEX idx_violation_status (trang_thai),

    CONSTRAINT fk_vi_pham_nguoi_xu_ly FOREIGN KEY (nguoi_xu_ly_id) REFERENCES nguoi_dung(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE thong_bao (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nguoi_dung_id BIGINT UNSIGNED NOT NULL,

    loai VARCHAR(50) NOT NULL,
    tieu_de VARCHAR(200) NOT NULL,
    noi_dung VARCHAR(1000) NOT NULL,
    duong_dan_lien_ket VARCHAR(255),

    da_doc TINYINT(1) NOT NULL DEFAULT 0,
    ngay_doc DATETIME NULL,

    -- NULL dành cho dữ liệu cũ; nghiệp vụ mới đặt khóa theo sự kiện và đối tượng.
    khoa_su_kien VARCHAR(160) CHARACTER SET ascii COLLATE ascii_bin NULL,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_notification_user_read (nguoi_dung_id, da_doc),
    INDEX idx_notification_created (ngay_tao),

    UNIQUE KEY uq_thong_bao_su_kien (nguoi_dung_id, khoa_su_kien)
) ENGINE=InnoDB;

CREATE TABLE cau_hinh_he_thong (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    khoa_cau_hinh VARCHAR(100) NOT NULL UNIQUE,
    gia_tri_cau_hinh TEXT NOT NULL,
    kieu_du_lieu ENUM('CHUOI', 'SO', 'DUNG_SAI', 'JSON') NOT NULL DEFAULT 'CHUOI',
    mo_ta VARCHAR(500),

    nguoi_cap_nhat_id BIGINT UNSIGNED NULL,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_system_config_admin
        FOREIGN KEY (nguoi_cap_nhat_id) REFERENCES nguoi_dung(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT ck_cau_hinh_json CHECK (kieu_du_lieu<>'JSON' OR JSON_VALID(gia_tri_cau_hinh))
) ENGINE=InnoDB;

CREATE TABLE nhat_ky_hoat_dong (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    nguoi_thuc_hien_id BIGINT UNSIGNED NULL,

    hanh_dong VARCHAR(100) NOT NULL,
    loai_doi_tuong VARCHAR(100) NOT NULL,
    doi_tuong_id BIGINT UNSIGNED NULL,

    du_lieu_cu JSON NULL,
    du_lieu_moi JSON NULL,

    dia_chi_ip VARCHAR(45),
    trinh_duyet_thiet_bi VARCHAR(500),

    -- FK tường minh để lịch sử gia hạn không chỉ là dòng log văn bản.
    phien_dau_gia_id BIGINT UNSIGNED NULL,
    luot_tra_gia_id BIGINT UNSIGNED NULL,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_actor
        FOREIGN KEY (nguoi_thuc_hien_id) REFERENCES nguoi_dung(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_audit_actor (nguoi_thuc_hien_id),
    INDEX idx_audit_entity (loai_doi_tuong, doi_tuong_id),
    INDEX idx_audit_created (ngay_tao),

    CONSTRAINT fk_nhat_ky_phien FOREIGN KEY (phien_dau_gia_id) REFERENCES phien_dau_gia(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_nhat_ky_luot FOREIGN KEY (luot_tra_gia_id) REFERENCES luot_tra_gia(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT ck_nhat_ky_gia_han CHECK (hanh_dong<>'GIA_HAN_PHIEN' OR
        (phien_dau_gia_id IS NOT NULL AND du_lieu_moi IS NOT NULL AND JSON_TYPE(du_lieu_moi)='OBJECT'
         AND JSON_CONTAINS_PATH(du_lieu_moi,'all','$.thoi_gian_ket_thuc_cu','$.thoi_gian_ket_thuc_moi','$.so_giay_them')=1)),
    INDEX idx_nhat_ky_phien (phien_dau_gia_id, hanh_dong, ngay_tao)
) ENGINE=InnoDB;

-- Bảo vệ cơ bản ở CSDL; không thay thế khóa/thuật toán/phân quyền ở service.
DELIMITER $$

CREATE TRIGGER trg_cam_tu_dat_gia_toi_da
BEFORE INSERT ON tham_gia_phien
FOR EACH ROW
BEGIN
    IF NEW.gia_toi_da IS NOT NULL AND EXISTS (
        SELECT 1
        FROM phien_dau_gia a
        JOIN san_pham p ON p.id = a.san_pham_id
        WHERE a.id = NEW.phien_dau_gia_id
          AND p.nguoi_ban_id = NEW.nguoi_dung_id
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Người bán không được tự đấu giá sản phẩm của mình';
    END IF;
END$$

CREATE TRIGGER trg_cam_tu_dat_gia_toi_da_sua
BEFORE UPDATE ON tham_gia_phien
FOR EACH ROW
BEGIN
    IF NEW.gia_toi_da IS NOT NULL AND EXISTS (
        SELECT 1
        FROM phien_dau_gia a
        JOIN san_pham p ON p.id = a.san_pham_id
        WHERE a.id = NEW.phien_dau_gia_id
          AND p.nguoi_ban_id = NEW.nguoi_dung_id
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Người bán không được tự đấu giá sản phẩm của mình';
    END IF;
END$$

CREATE TRIGGER trg_cam_tu_tra_gia
BEFORE INSERT ON luot_tra_gia
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1
        FROM phien_dau_gia a
        JOIN san_pham p ON p.id = a.san_pham_id
        WHERE a.id = NEW.phien_dau_gia_id
          AND p.nguoi_ban_id = NEW.nguoi_tra_gia_id
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Người bán không được tự đấu giá sản phẩm của mình';
    END IF;
END$$

CREATE TRIGGER trg_cam_tu_tra_gia_sua
BEFORE UPDATE ON luot_tra_gia
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1
        FROM phien_dau_gia a
        JOIN san_pham p ON p.id = a.san_pham_id
        WHERE a.id = NEW.phien_dau_gia_id
          AND p.nguoi_ban_id = NEW.nguoi_tra_gia_id
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Người bán không được tự đấu giá sản phẩm của mình';
    END IF;
END$$

CREATE TRIGGER trg_de_nghi_gia_cong_khai
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
END$$

CREATE TRIGGER trg_de_nghi_gia_cong_khai_sua
BEFORE UPDATE ON de_nghi_mua_tiep_theo
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
END$$

DELIMITER ;

CREATE VIEW v_phien_dau_gia_dang_dien_ra AS
SELECT
    a.id AS phien_dau_gia_id,
    p.id AS san_pham_id,
    p.tieu_de,
    p.duong_dan,
    c.ten AS ten_danh_muc,
    nb.id AS nguoi_ban_id,
    nb.ho_ten AS ten_nguoi_ban,
    a.gia_khoi_diem,
    a.gia_hien_tai,
    a.gia_mua_ngay,
    a.cho_phep_mua_ngay,
    a.thoi_gian_bat_dau,
    a.thoi_gian_ket_thuc,
    a.tong_luot_tra_gia,
    a.dat_gia_san
FROM phien_dau_gia a
JOIN san_pham p ON p.id = a.san_pham_id
JOIN danh_muc c ON c.id = p.danh_muc_id
JOIN nguoi_dung nb ON nb.id = p.nguoi_ban_id
WHERE a.trang_thai = 'HOAT_DONG';

CREATE VIEW v_chi_tiet_don_hang AS
SELECT
    o.id AS don_hang_id,
    o.ma_don_hang,
    o.trang_thai,
    o.gia_san_pham,
    o.phi_van_chuyen,
    o.tong_tien,
    nm.ho_ten AS ten_nguoi_mua,
    nb.ho_ten AS ten_nguoi_ban,
    p.tieu_de AS ten_san_pham,
    a.id AS phien_dau_gia_id,
    o.ngay_tao
FROM don_hang o
JOIN nguoi_dung nm ON nm.id = o.nguoi_mua_id
JOIN nguoi_dung nb ON nb.id = o.nguoi_ban_id
JOIN phien_dau_gia a ON a.id = o.phien_dau_gia_id
JOIN san_pham p ON p.id = a.san_pham_id;
