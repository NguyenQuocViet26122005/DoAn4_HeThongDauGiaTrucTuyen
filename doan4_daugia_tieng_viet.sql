-- =========================================================
-- ĐỒ ÁN 4 - HỆ THỐNG ĐẤU GIÁ TRỰC TUYẾN
-- MySQL 8.x
-- PHIÊN BẢN TIẾNG VIỆT HOÀN CHỈNH
-- Tên bảng và tên cột dùng tiếng Việt KHÔNG DẤU để dễ viết code Node.js.
-- Dữ liệu hiển thị và chú thích dùng tiếng Việt.
-- Script đầy đủ: tạo database + bảng + ràng buộc + dữ liệu mẫu
-- LƯU Ý: Script này XÓA database doan4_daugia hiện tại rồi tạo lại từ đầu.
-- =========================================================

DROP DATABASE IF EXISTS doan4_daugia;

CREATE DATABASE doan4_daugia
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE doan4_daugia;

-- =========================================================
-- 1. NGƯỜI DÙNG / XÁC MINH NGƯỜI BÁN
-- =========================================================

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

-- =========================================================
-- 2. DANH MỤC / THUỘC TÍNH ĐỘNG / SẢN PHẨM
-- =========================================================

CREATE TABLE danh_muc (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    danh_muc_cha_id BIGINT UNSIGNED NULL,

    ten VARCHAR(120) NOT NULL,
    duong_dan VARCHAR(150) NOT NULL UNIQUE,
    mo_ta VARCHAR(500),
    duong_dan_anh VARCHAR(255),

    dang_hoat_dong TINYINT(1) NOT NULL DEFAULT 1,
    thu_tu INT NOT NULL DEFAULT 0,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_category_parent
        FOREIGN KEY (danh_muc_cha_id) REFERENCES danh_muc(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_category_parent (danh_muc_cha_id),
    INDEX idx_category_active (dang_hoat_dong)
) ENGINE=InnoDB;

CREATE TABLE thuoc_tinh_danh_muc (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    danh_muc_id BIGINT UNSIGNED NOT NULL,

    ten_thuoc_tinh VARCHAR(100) NOT NULL,
    khoa_thuoc_tinh VARCHAR(100) NOT NULL,
    kieu_nhap ENUM('VAN_BAN', 'SO', 'LUA_CHON', 'DUNG_SAI', 'NGAY') NOT NULL DEFAULT 'VAN_BAN',
    don_vi VARCHAR(30),
    lua_chon_json JSON NULL,

    bat_buoc TINYINT(1) NOT NULL DEFAULT 0,
    thu_tu INT NOT NULL DEFAULT 0,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_category_attribute_category
        FOREIGN KEY (danh_muc_id) REFERENCES danh_muc(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    UNIQUE KEY uq_category_attribute (danh_muc_id, khoa_thuoc_tinh),
    INDEX idx_category_attribute_category (danh_muc_id)
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
    INDEX idx_product_approval (trang_thai_duyet)
) ENGINE=InnoDB;

CREATE TABLE hinh_anh_san_pham (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    san_pham_id BIGINT UNSIGNED NOT NULL,

    duong_dan_anh VARCHAR(255) NOT NULL,
    la_anh_chinh TINYINT(1) NOT NULL DEFAULT 0,
    thu_tu INT NOT NULL DEFAULT 0,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_image_product
        FOREIGN KEY (san_pham_id) REFERENCES san_pham(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_product_image_product (san_pham_id)
) ENGINE=InnoDB;

CREATE TABLE gia_tri_thuoc_tinh_san_pham (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    san_pham_id BIGINT UNSIGNED NOT NULL,
    thuoc_tinh_id BIGINT UNSIGNED NOT NULL,

    gia_tri VARCHAR(500) NOT NULL,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_attr_value_product
        FOREIGN KEY (san_pham_id) REFERENCES san_pham(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_product_attr_value_attribute
        FOREIGN KEY (thuoc_tinh_id) REFERENCES thuoc_tinh_danh_muc(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    UNIQUE KEY uq_product_attribute_value (san_pham_id, thuoc_tinh_id)
) ENGINE=InnoDB;

-- =========================================================
-- 3. CẤU HÌNH BƯỚC GIÁ
-- =========================================================

CREATE TABLE buoc_gia (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    gia_tu DECIMAL(15,2) NOT NULL,
    gia_den DECIMAL(15,2) NULL,
    muc_tang_gia DECIMAL(15,2) NOT NULL,

    dang_hoat_dong TINYINT(1) NOT NULL DEFAULT 1,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CHECK (gia_tu >= 0),
    CHECK (muc_tang_gia > 0)
) ENGINE=InnoDB;

-- =========================================================
-- 4. PHIÊN ĐẤU GIÁ
-- =========================================================

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
    INDEX idx_auction_end (thoi_gian_ket_thuc)
) ENGINE=InnoDB;

-- Lưu mức giá tối đa bí mật của mỗi người tham gia.
-- Seller và người dùng khác không được API trả trường gia_toi_da.
CREATE TABLE muc_gia_toi_da (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    phien_dau_gia_id BIGINT UNSIGNED NOT NULL,
    nguoi_tra_gia_id BIGINT UNSIGNED NOT NULL,

    gia_toi_da DECIMAL(15,2) NOT NULL,
    thoi_gian_dat_gia_toi_da DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_bid_limit_auction
        FOREIGN KEY (phien_dau_gia_id) REFERENCES phien_dau_gia(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_bid_limit_bidder
        FOREIGN KEY (nguoi_tra_gia_id) REFERENCES nguoi_dung(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    UNIQUE KEY uq_auction_bidder_limit (phien_dau_gia_id, nguoi_tra_gia_id),
    INDEX idx_bid_limit_auction (phien_dau_gia_id),
    INDEX idx_bid_limit_bidder (nguoi_tra_gia_id),

    CHECK (gia_toi_da > 0)
) ENGINE=InnoDB;

-- Lịch sử mức giá HIỂN THỊ công khai của phiên đấu giá.
-- Không lưu gia_toi_da bí mật ở bảng này.
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

    CHECK (so_tien > 0)
) ENGINE=InnoDB;

CREATE TABLE gia_han_phien_dau_gia (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    phien_dau_gia_id BIGINT UNSIGNED NOT NULL,
    luot_tra_gia_kich_hoat_id BIGINT UNSIGNED NULL,

    thoi_gian_ket_thuc_cu DATETIME NOT NULL,
    thoi_gian_ket_thuc_moi DATETIME NOT NULL,
    so_giay_them INT NOT NULL,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_extension_auction
        FOREIGN KEY (phien_dau_gia_id) REFERENCES phien_dau_gia(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_extension_bid
        FOREIGN KEY (luot_tra_gia_kich_hoat_id) REFERENCES luot_tra_gia(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_extension_auction (phien_dau_gia_id)
) ENGINE=InnoDB;

CREATE TABLE yeu_cau_huy_phien (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    phien_dau_gia_id BIGINT UNSIGNED NOT NULL,
    nguoi_yeu_cau_id BIGINT UNSIGNED NOT NULL,

    ly_do VARCHAR(1000) NOT NULL,

    trang_thai ENUM('CHO_XU_LY', 'DA_DUYET', 'TU_CHOI') NOT NULL DEFAULT 'CHO_XU_LY',

    nguoi_duyet_id BIGINT UNSIGNED NULL,
    ghi_chu_duyet VARCHAR(1000),
    ngay_duyet DATETIME NULL,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cancel_request_auction
        FOREIGN KEY (phien_dau_gia_id) REFERENCES phien_dau_gia(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_cancel_request_user
        FOREIGN KEY (nguoi_yeu_cau_id) REFERENCES nguoi_dung(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_cancel_request_admin
        FOREIGN KEY (nguoi_duyet_id) REFERENCES nguoi_dung(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_cancel_request_status (trang_thai),
    INDEX idx_cancel_request_auction (phien_dau_gia_id)
) ENGINE=InnoDB;

-- =========================================================
-- 5. ĐƠN HÀNG / THANH TOÁN / GIỮ TIỀN / VẬN CHUYỂN
-- =========================================================

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

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_auction
        FOREIGN KEY (phien_dau_gia_id) REFERENCES phien_dau_gia(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

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
    INDEX idx_order_seller_status (nguoi_ban_id, trang_thai)
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

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_order
        FOREIGN KEY (don_hang_id) REFERENCES don_hang(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CHECK (so_tien >= 0),

    INDEX idx_payment_order (don_hang_id),
    INDEX idx_payment_status (trang_thai)
) ENGINE=InnoDB;

CREATE TABLE giu_tien_trung_gian (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    don_hang_id BIGINT UNSIGNED NOT NULL UNIQUE,

    so_tien DECIMAL(15,2) NOT NULL,

    trang_thai ENUM(
        'CHO_GIU_TIEN',
        'DANG_GIU',
        'DA_GIAI_NGAN',
        'DA_HOAN_TIEN',
        'HOAN_TIEN_MOT_PHAN'
    ) NOT NULL DEFAULT 'CHO_GIU_TIEN',

    ngay_bat_dau_giu DATETIME NULL,
    ngay_giai_ngan DATETIME NULL,
    ngay_hoan_tien DATETIME NULL,

    ghi_chu VARCHAR(500),

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_escrow_order
        FOREIGN KEY (don_hang_id) REFERENCES don_hang(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CHECK (so_tien >= 0)
) ENGINE=InnoDB;

CREATE TABLE van_chuyen (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    don_hang_id BIGINT UNSIGNED NOT NULL UNIQUE,

    don_vi_van_chuyen VARCHAR(100),
    ma_van_don VARCHAR(100),

    trang_thai ENUM(
        'CHO_XU_LY',
        'DA_LAY_HANG',
        'DANG_VAN_CHUYEN',
        'DA_GIAO',
        'THAT_BAI',
        'DA_HOAN_TRA'
    ) NOT NULL DEFAULT 'CHO_XU_LY',

    ngay_gui_hang DATETIME NULL,
    ngay_giao_hang DATETIME NULL,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_shipment_order
        FOREIGN KEY (don_hang_id) REFERENCES don_hang(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    INDEX idx_shipment_tracking (ma_van_don)
) ENGINE=InnoDB;

-- =========================================================
-- 6. KHIẾU NẠI / TRANH CHẤP
-- =========================================================

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

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_dispute_order
        FOREIGN KEY (don_hang_id) REFERENCES don_hang(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_dispute_opened_by
        FOREIGN KEY (nguoi_mo_id) REFERENCES nguoi_dung(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_dispute_admin
        FOREIGN KEY (nguoi_xu_ly_id) REFERENCES nguoi_dung(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    CHECK (so_tien_hoan >= 0),

    INDEX idx_dispute_order (don_hang_id),
    INDEX idx_dispute_status (trang_thai)
) ENGINE=InnoDB;

CREATE TABLE bang_chung_tranh_chap (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tranh_chap_id BIGINT UNSIGNED NOT NULL,
    nguoi_tai_len_id BIGINT UNSIGNED NOT NULL,

    duong_dan_tep VARCHAR(255) NOT NULL,
    loai_bang_chung ENUM('HINH_ANH', 'VIDEO', 'TAI_LIEU', 'KHAC') NOT NULL DEFAULT 'HINH_ANH',
    mo_ta VARCHAR(500),

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_dispute_evidence_dispute
        FOREIGN KEY (tranh_chap_id) REFERENCES tranh_chap(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_dispute_evidence_user
        FOREIGN KEY (nguoi_tai_len_id) REFERENCES nguoi_dung(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    INDEX idx_dispute_evidence_dispute (tranh_chap_id)
) ENGINE=InnoDB;

-- =========================================================
-- 7. ĐÁNH GIÁ
-- =========================================================

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

-- =========================================================
-- 8. DANH SÁCH THEO DÕI / THÔNG BÁO
-- =========================================================

CREATE TABLE danh_sach_theo_doi (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nguoi_dung_id BIGINT UNSIGNED NOT NULL,
    phien_dau_gia_id BIGINT UNSIGNED NOT NULL,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_watchlist_user
        FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_watchlist_auction
        FOREIGN KEY (phien_dau_gia_id) REFERENCES phien_dau_gia(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    UNIQUE KEY uq_watchlist (nguoi_dung_id, phien_dau_gia_id),
    INDEX idx_watchlist_auction (phien_dau_gia_id)
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

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_notification_user_read (nguoi_dung_id, da_doc),
    INDEX idx_notification_created (ngay_tao)
) ENGINE=InnoDB;

-- =========================================================
-- 9. VI PHẠM
-- =========================================================

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
    INDEX idx_violation_status (trang_thai)
) ENGINE=InnoDB;

-- =========================================================
-- 10. ĐỀ NGHỊ MUA CHO NGƯỜI TRẢ GIÁ CAO TIẾP THEO
-- =========================================================

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

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_second_chance_auction
        FOREIGN KEY (phien_dau_gia_id) REFERENCES phien_dau_gia(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

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

    CHECK (gia_de_nghi > 0)
) ENGINE=InnoDB;

-- =========================================================
-- 11. CẤU HÌNH HỆ THỐNG
-- =========================================================

CREATE TABLE cau_hinh_he_thong (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    khoa_cau_hinh VARCHAR(100) NOT NULL UNIQUE,
    gia_tri_cau_hinh VARCHAR(500) NOT NULL,
    kieu_du_lieu ENUM('CHUOI', 'SO', 'DUNG_SAI', 'JSON') NOT NULL DEFAULT 'CHUOI',
    mo_ta VARCHAR(500),

    nguoi_cap_nhat_id BIGINT UNSIGNED NULL,

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_system_config_admin
        FOREIGN KEY (nguoi_cap_nhat_id) REFERENCES nguoi_dung(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 12. NHẬT KÝ HOẠT ĐỘNG
-- =========================================================

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

    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_actor
        FOREIGN KEY (nguoi_thuc_hien_id) REFERENCES nguoi_dung(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_audit_actor (nguoi_thuc_hien_id),
    INDEX idx_audit_entity (loai_doi_tuong, doi_tuong_id),
    INDEX idx_audit_created (ngay_tao)
) ENGINE=InnoDB;

-- =========================================================
-- 13. TRIGGER BẢO VỆ: NGƯỜI BÁN KHÔNG ĐƯỢC TỰ ĐẤU GIÁ
-- =========================================================

DELIMITER $$

CREATE TRIGGER trg_cam_tu_dat_gia_toi_da
BEFORE INSERT ON muc_gia_toi_da
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

DELIMITER ;

-- =========================================================
-- 14. VIEW HỖ TRỢ HIỂN THỊ / THỐNG KÊ
-- =========================================================

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

-- =========================================================
-- DỮ LIỆU MẪU
-- Mật khẩu mẫu của các tài khoản: 123456
-- Hash bcrypt dùng chung để thuận tiện test.
-- =========================================================

SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO nguoi_dung
(id, ho_ten, email, mat_khau_bam, so_dien_thoai, anh_dai_dien, vai_tro, trang_thai_nguoi_ban, trang_thai_tai_khoan, ngay_xac_minh_email)
VALUES
(1, 'Quản trị viên', 'admin@daugia.local',
 '$2b$10$SDJAqmYQhZZrxwAHAv8Vwe3.0pfKAYDtclcnra.kP.V4lmepYUfSi',
 '0900000001', NULL, 'QUAN_TRI', 'CHUA_DANG_KY', 'HOAT_DONG', NOW()),

(2, 'Nguyễn Văn Minh', 'minh.nb@daugia.local',
 '$2b$10$SDJAqmYQhZZrxwAHAv8Vwe3.0pfKAYDtclcnra.kP.V4lmepYUfSi',
 '0900000002', '/uploads/avatars/minh.jpg', 'NGUOI_DUNG', 'DA_XAC_MINH', 'HOAT_DONG', NOW()),

(3, 'Trần Quốc Nam', 'nam.nm@daugia.local',
 '$2b$10$SDJAqmYQhZZrxwAHAv8Vwe3.0pfKAYDtclcnra.kP.V4lmepYUfSi',
 '0900000003', '/uploads/avatars/nam.jpg', 'NGUOI_DUNG', 'CHUA_DANG_KY', 'HOAT_DONG', NOW()),

(4, 'Lê Hoàng Anh', 'hoanganh@daugia.local',
 '$2b$10$SDJAqmYQhZZrxwAHAv8Vwe3.0pfKAYDtclcnra.kP.V4lmepYUfSi',
 '0900000004', NULL, 'NGUOI_DUNG', 'CHUA_DANG_KY', 'HOAT_DONG', NOW()),

(5, 'Phạm Đức Long', 'long.pending@daugia.local',
 '$2b$10$SDJAqmYQhZZrxwAHAv8Vwe3.0pfKAYDtclcnra.kP.V4lmepYUfSi',
 '0900000005', NULL, 'NGUOI_DUNG', 'CHO_XU_LY', 'HOAT_DONG', NOW()),

(6, 'Vũ Thu Hà', 'ha.nb@daugia.local',
 '$2b$10$SDJAqmYQhZZrxwAHAv8Vwe3.0pfKAYDtclcnra.kP.V4lmepYUfSi',
 '0900000006', '/uploads/avatars/ha.jpg', 'NGUOI_DUNG', 'DA_XAC_MINH', 'HOAT_DONG', NOW());

INSERT INTO xac_minh_nguoi_ban
(id, nguoi_dung_id, loai_giay_to, so_giay_to, anh_mat_truoc, anh_mat_sau,
 anh_selfie, ten_ngan_hang, so_tai_khoan, chu_tai_khoan,
 trang_thai, ly_do_tu_choi, ngay_gui_ho_so, ngay_duyet, nguoi_duyet_id)
VALUES
(1, 2, 'CCCD', '001000000002',
 '/uploads/verification/minh-front.jpg',
 '/uploads/verification/minh-back.jpg',
 '/uploads/verification/minh-selfie.jpg',
 'Vietcombank', '1000000002', 'NGUYEN VAN MINH',
 'DA_XAC_MINH', NULL, DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 29 DAY), 1),

(2, 5, 'CCCD', '001000000005',
 '/uploads/verification/long-front.jpg',
 '/uploads/verification/long-back.jpg',
 '/uploads/verification/long-selfie.jpg',
 'MB Bank', '1000000005', 'PHAM DUC LONG',
 'CHO_XU_LY', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, NULL),

(3, 6, 'CCCD', '001000000006',
 '/uploads/verification/ha-front.jpg',
 '/uploads/verification/ha-back.jpg',
 '/uploads/verification/ha-selfie.jpg',
 'Techcombank', '1000000006', 'VU THU HA',
 'DA_XAC_MINH', NULL, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 19 DAY), 1);

INSERT INTO dia_chi_nguoi_dung
(id, nguoi_dung_id, ten_nguoi_nhan, sdt_nguoi_nhan, tinh_thanh, quan_huyen, phuong_xa, dia_chi_chi_tiet, la_mac_dinh)
VALUES
(1, 3, 'Trần Quốc Nam', '0900000003', 'Hưng Yên', 'Hưng Yên', 'Phố Hiến', 'Số 12 đường mẫu', 1),
(2, 4, 'Lê Hoàng Anh', '0900000004', 'Hà Nội', 'Cầu Giấy', 'Dịch Vọng', 'Số 88 đường mẫu', 1);

-- Danh mục
INSERT INTO danh_muc
(id, danh_muc_cha_id, ten, duong_dan, mo_ta, dang_hoat_dong, thu_tu)
VALUES
(1, NULL, 'Điện tử', 'dien-tu', 'Thiết bị điện tử và công nghệ', 1, 1),
(2, 1, 'Điện thoại & máy tính bảng', 'dien-thoai-may-tinh-bang', NULL, 1, 1),
(3, 1, 'Laptop & máy tính', 'laptop-may-tinh', NULL, 1, 2),
(4, 1, 'Âm thanh', 'am-thanh', NULL, 1, 3),
(5, 1, 'Máy ảnh', 'may-anh', NULL, 1, 4),

(6, NULL, 'Xe cộ', 'xe-co', 'Ô tô, xe máy và phương tiện', 1, 2),
(7, 6, 'Xe máy', 'xe-may', NULL, 1, 1),
(8, 6, 'Ô tô', 'o-to', NULL, 1, 2),

(9, NULL, 'Đồng hồ', 'dong-ho', NULL, 1, 3),
(10, NULL, 'Thời trang', 'thoi-trang', NULL, 1, 4),
(11, NULL, 'Đồ sưu tầm', 'do-suu-tam', NULL, 1, 5),
(12, NULL, 'Nội thất & gia dụng', 'noi-that-gia-dung', NULL, 1, 6);

-- Thuộc tính động theo danh mục
INSERT INTO thuoc_tinh_danh_muc
(id, danh_muc_id, ten_thuoc_tinh, khoa_thuoc_tinh, kieu_nhap, don_vi, lua_chon_json, bat_buoc, thu_tu)
VALUES
(1, 2, 'Hãng', 'thuong_hieu', 'LUA_CHON', NULL,
 JSON_ARRAY('Apple','Samsung','Xiaomi','OPPO','Google','Khác'), 1, 1),
(2, 2, 'Dung lượng', 'storage', 'LUA_CHON', 'GB',
 JSON_ARRAY('64','128','256','512','1024'), 1, 2),
(3, 2, 'Màu sắc', 'color', 'VAN_BAN', NULL, NULL, 0, 3),

(4, 3, 'Hãng', 'thuong_hieu', 'VAN_BAN', NULL, NULL, 1, 1),
(5, 3, 'CPU', 'cpu', 'VAN_BAN', NULL, NULL, 1, 2),
(6, 3, 'RAM', 'ram', 'SO', 'GB', NULL, 1, 3),
(7, 3, 'SSD', 'ssd', 'SO', 'GB', NULL, 1, 4),

(8, 7, 'Hãng xe', 'vehicle_brand', 'VAN_BAN', NULL, NULL, 1, 1),
(9, 7, 'Năm sản xuất', 'vehicle_year', 'SO', 'năm', NULL, 1, 2),
(10, 7, 'Số km đã đi', 'odometer', 'SO', 'km', NULL, 1, 3),

(11, 9, 'Thương hiệu', 'watch_brand', 'VAN_BAN', NULL, NULL, 1, 1),
(12, 9, 'Loại máy', 'movement', 'LUA_CHON', NULL,
 JSON_ARRAY('Automatic','Quartz','Manual'), 1, 2),
(13, 9, 'Đường kính mặt', 'case_size', 'SO', 'mm', NULL, 0, 3),

(14, 11, 'Xuất xứ', 'origin', 'VAN_BAN', NULL, NULL, 0, 1),
(15, 11, 'Năm sản xuất', 'manufacture_year', 'SO', 'năm', NULL, 0, 2),
(16, 11, 'Chất liệu', 'material', 'VAN_BAN', NULL, NULL, 0, 3),

(17, 4, 'Hãng', 'audio_brand', 'VAN_BAN', NULL, NULL, 1, 1),
(18, 5, 'Hãng', 'camera_brand', 'VAN_BAN', NULL, NULL, 1, 1);

-- Sản phẩm
INSERT INTO san_pham
(id, nguoi_ban_id, danh_muc_id, tieu_de, duong_dan, mo_ta, tinh_trang_san_pham, thuong_hieu,
 trang_thai_duyet, ly_do_tu_choi, nguoi_duyet_id, ngay_duyet)
VALUES
(1, 2, 2,
 'iPhone 15 Pro Max 256GB Titan Tự Nhiên',
 'iphone-15-pro-max-256gb-titan-tu-nhien',
 'Máy chính chủ, ngoại hình đẹp, đầy đủ chức năng, dùng bình thường.',
 'NHU_MOI', 'Apple', 'DA_DUYET', NULL, 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),

(2, 2, 3,
 'MacBook Air M2 2022 16GB 512GB',
 'macbook-air-m2-2022-16gb-512gb',
 'MacBook Air M2, RAM 16GB, SSD 512GB, pin tốt, máy hoạt động ổn định.',
 'DA_QUA_SU_DUNG_TOT', 'Apple', 'DA_DUYET', NULL, 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),

(3, 6, 7,
 'Honda Air Blade 125 đời 2024',
 'honda-air-blade-125-2024',
 'Xe chính chủ, hồ sơ đầy đủ, máy móc nguyên bản.',
 'DA_QUA_SU_DUNG_TOT', 'Honda', 'DA_DUYET', NULL, 1, DATE_SUB(NOW(), INTERVAL 12 DAY)),

(4, 6, 9,
 'Seiko 5 Sports Automatic',
 'seiko-5-sports-automatic',
 'Đồng hồ cơ Seiko 5 Sports, hoạt động tốt, có hộp.',
 'DA_QUA_SU_DUNG_TOT', 'Seiko', 'DA_DUYET', NULL, 1, DATE_SUB(NOW(), INTERVAL 15 DAY)),

(5, 2, 11,
 'Máy ảnh film Canon AE-1 sưu tầm',
 'canon-ae1-film-collection',
 'Máy ảnh film Canon AE-1, phù hợp sưu tầm và sử dụng.',
 'DA_QUA_SU_DUNG_TOT', 'Canon', 'DA_DUYET', NULL, 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),

(6, 6, 4,
 'Tai nghe Sony WH-1000XM5',
 'sony-wh1000xm5',
 'Tai nghe chống ồn Sony WH-1000XM5, còn hoạt động tốt.',
 'DA_QUA_SU_DUNG_TOT', 'Sony', 'DA_DUYET', NULL, 1, DATE_SUB(NOW(), INTERVAL 8 DAY)),

(7, 2, 2,
 'iPhone 13 128GB',
 'iphone-13-128gb-pending',
 'Sản phẩm đang chờ quản trị viên duyệt.',
 'DA_QUA_SU_DUNG_TOT', 'Apple', 'CHO_XU_LY', NULL, NULL, NULL),

(8, 2, 2,
 'iPad Pro 11 inch M2 128GB',
 'ipad-pro-11-m2-128gb',
 'iPad Pro M2 11 inch, ngoại hình đẹp, màn hình và cảm ứng hoạt động tốt.',
 'DA_QUA_SU_DUNG_TOT', 'Apple', 'DA_DUYET', NULL, 1, DATE_SUB(NOW(), INTERVAL 5 DAY));

INSERT INTO hinh_anh_san_pham
(id, san_pham_id, duong_dan_anh, la_anh_chinh, thu_tu)
VALUES
(1, 1, '/uploads/san_pham/iphone15-1.jpg', 1, 1),
(2, 1, '/uploads/san_pham/iphone15-2.jpg', 0, 2),
(3, 2, '/uploads/san_pham/macbook-m2-1.jpg', 1, 1),
(4, 3, '/uploads/san_pham/airblade-1.jpg', 1, 1),
(5, 4, '/uploads/san_pham/seiko-1.jpg', 1, 1),
(6, 5, '/uploads/san_pham/canon-ae1-1.jpg', 1, 1),
(7, 6, '/uploads/san_pham/sony-xm5-1.jpg', 1, 1),
(8, 7, '/uploads/san_pham/iphone13-1.jpg', 1, 1),
(9, 8, '/uploads/san_pham/ipad-pro-1.jpg', 1, 1);

INSERT INTO gia_tri_thuoc_tinh_san_pham
(san_pham_id, thuoc_tinh_id, gia_tri)
VALUES
(1, 1, 'Apple'),
(1, 2, '256'),
(1, 3, 'Titan Tự Nhiên'),

(2, 4, 'Apple'),
(2, 5, 'Apple M2'),
(2, 6, '16'),
(2, 7, '512'),

(3, 8, 'Honda'),
(3, 9, '2024'),
(3, 10, '8500'),

(4, 11, 'Seiko'),
(4, 12, 'Automatic'),
(4, 13, '42.5'),

(5, 14, 'Nhật Bản'),
(5, 15, '1976'),
(5, 16, 'Kim loại'),

(6, 17, 'Sony'),

(8, 1, 'Apple'),
(8, 2, '128'),
(8, 3, 'Xám');

-- Bước giá theo khoảng giá
INSERT INTO buoc_gia
(id, gia_tu, gia_den, muc_tang_gia, dang_hoat_dong)
VALUES
(1, 0, 999999.99, 50000, 1),
(2, 1000000, 9999999.99, 100000, 1),
(3, 10000000, 49999999.99, 200000, 1),
(4, 50000000, NULL, 500000, 1);

-- Phiên đấu giá
INSERT INTO phien_dau_gia
(id, san_pham_id, gia_khoi_diem, gia_san, gia_mua_ngay, cho_phep_mua_ngay,
 gia_hien_tai, nguoi_dan_dau_id,
 thoi_gian_bat_dau, thoi_gian_ket_thuc_goc, thoi_gian_ket_thuc,
 trang_thai, ly_do_ket_thuc, dat_gia_san,
 bat_chong_phut_chot, nguong_phut_chot_giay, so_giay_gia_han,
 so_lan_gia_han, tong_luot_tra_gia)
VALUES
-- 1: đang hoạt động
(1, 1, 18000000, 20000000, 25500000, 1,
 20700000, 4,
 DATE_SUB(NOW(), INTERVAL 2 HOUR),
 DATE_ADD(NOW(), INTERVAL 2 DAY),
 DATE_ADD(NOW(), INTERVAL 2 DAY),
 'HOAT_DONG', NULL, 1, 1, 60, 90, 0, 2),

-- 2: đã lên lịch
(2, 2, 18000000, 22000000, 28000000, 1,
 18000000, NULL,
 DATE_ADD(NOW(), INTERVAL 1 DAY),
 DATE_ADD(NOW(), INTERVAL 4 DAY),
 DATE_ADD(NOW(), INTERVAL 4 DAY),
 'DA_LEN_LICH', NULL, 0, 1, 60, 90, 0, 0),

-- 3: kết thúc thành công, có chống phút chót
(3, 4, 3000000, 4000000, NULL, 0,
 4800000, 3,
 DATE_SUB(NOW(), INTERVAL 12 DAY),
 DATE_SUB(DATE_SUB(NOW(), INTERVAL 10 DAY), INTERVAL 90 SECOND),
 DATE_SUB(NOW(), INTERVAL 10 DAY),
 'DA_KET_THUC', 'CO_NGUOI_THANG', 1, 1, 60, 90, 1, 2),

-- 4: thất bại vì chưa đạt giá sàn
(4, 3, 35000000, 45000000, NULL, 0,
 35000000, 3,
 DATE_SUB(NOW(), INTERVAL 9 DAY),
 DATE_SUB(NOW(), INTERVAL 7 DAY),
 DATE_SUB(NOW(), INTERVAL 7 DAY),
 'THAT_BAI', 'KHONG_DAT_GIA_SAN', 0, 1, 60, 90, 0, 1),

-- 5: đang hoạt động
(5, 5, 4000000, 5000000, NULL, 0,
 5000000, 3,
 DATE_SUB(NOW(), INTERVAL 1 DAY),
 DATE_ADD(NOW(), INTERVAL 3 DAY),
 DATE_ADD(NOW(), INTERVAL 3 DAY),
 'HOAT_DONG', NULL, 1, 1, 60, 90, 0, 2),

-- 6: đã kết thúc nhưng người thắng không thanh toán
(6, 6, 5000000, 5500000, NULL, 0,
 6600000, 4,
 DATE_SUB(NOW(), INTERVAL 7 DAY),
 DATE_SUB(NOW(), INTERVAL 5 DAY),
 DATE_SUB(NOW(), INTERVAL 5 DAY),
 'DA_KET_THUC', 'CO_NGUOI_THANG', 1, 1, 60, 90, 0, 3),

-- 7: đơn hàng đang tranh chấp
(7, 8, 12000000, 14000000, NULL, 0,
 15000000, 3,
 DATE_SUB(NOW(), INTERVAL 4 DAY),
 DATE_SUB(NOW(), INTERVAL 2 DAY),
 DATE_SUB(NOW(), INTERVAL 2 DAY),
 'DA_KET_THUC', 'CO_NGUOI_THANG', 1, 1, 60, 90, 0, 2);

-- Mức giá tối đa bí mật
INSERT INTO muc_gia_toi_da
(id, phien_dau_gia_id, nguoi_tra_gia_id, gia_toi_da, thoi_gian_dat_gia_toi_da)
VALUES
(1, 1, 3, 20500000, DATE_SUB(NOW(), INTERVAL 90 MINUTE)),
(2, 1, 4, 22000000, DATE_SUB(NOW(), INTERVAL 60 MINUTE)),

(3, 3, 4, 4700000, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(4, 3, 3, 5000000, DATE_SUB(NOW(), INTERVAL 10 DAY)),

(5, 4, 3, 40000000, DATE_SUB(NOW(), INTERVAL 8 DAY)),

(6, 5, 3, 6200000, DATE_SUB(NOW(), INTERVAL 12 HOUR)),

(7, 6, 3, 6500000, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(8, 6, 4, 7000000, DATE_SUB(NOW(), INTERVAL 5 DAY)),

(9, 7, 4, 14800000, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(10, 7, 3, 15500000, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- Lịch sử giá hiển thị
INSERT INTO luot_tra_gia
(id, phien_dau_gia_id, nguoi_tra_gia_id, so_tien, loai_tra_gia, ngay_tao)
VALUES
(1, 1, 3, 18000000, 'TRUC_TIEP', DATE_SUB(NOW(), INTERVAL 90 MINUTE)),
(2, 1, 4, 20700000, 'TU_DONG', DATE_SUB(NOW(), INTERVAL 60 MINUTE)),

(3, 3, 4, 3000000, 'TRUC_TIEP', DATE_SUB(DATE_SUB(NOW(), INTERVAL 10 DAY), INTERVAL 10 MINUTE)),
(4, 3, 3, 4800000, 'TU_DONG', DATE_SUB(DATE_SUB(NOW(), INTERVAL 10 DAY), INTERVAL 120 SECOND)),

(5, 4, 3, 35000000, 'TRUC_TIEP', DATE_SUB(NOW(), INTERVAL 8 DAY)),

(6, 5, 3, 4000000, 'TRUC_TIEP', DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(12, 5, 3, 5000000, 'TU_DONG', DATE_SUB(NOW(), INTERVAL 12 HOUR)),

(7, 6, 3, 5000000, 'TRUC_TIEP', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(8, 6, 3, 6500000, 'TU_DONG', DATE_SUB(DATE_SUB(NOW(), INTERVAL 5 DAY), INTERVAL 5 MINUTE)),
(9, 6, 4, 6600000, 'TU_DONG', DATE_SUB(DATE_SUB(NOW(), INTERVAL 5 DAY), INTERVAL 4 MINUTE)),

(10, 7, 4, 12000000, 'TRUC_TIEP', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(11, 7, 3, 15000000, 'TU_DONG', DATE_SUB(DATE_SUB(NOW(), INTERVAL 2 DAY), INTERVAL 20 MINUTE));

INSERT INTO gia_han_phien_dau_gia
(id, phien_dau_gia_id, luot_tra_gia_kich_hoat_id, thoi_gian_ket_thuc_cu, thoi_gian_ket_thuc_moi, so_giay_them)
VALUES
(1, 3, 4,
 DATE_SUB(DATE_SUB(NOW(), INTERVAL 10 DAY), INTERVAL 90 SECOND),
 DATE_SUB(NOW(), INTERVAL 10 DAY),
 90);

-- Yêu cầu hủy phiên đang hoạt động - chờ admin xử lý
INSERT INTO yeu_cau_huy_phien
(id, phien_dau_gia_id, nguoi_yeu_cau_id, ly_do, trang_thai)
VALUES
(1, 5, 2,
 'Người bán phát hiện sản phẩm cần kiểm tra lại trước khi giao dịch.',
 'CHO_XU_LY');

-- Đơn hàng
INSERT INTO don_hang
(id, ma_don_hang, phien_dau_gia_id, nguoi_mua_id, nguoi_ban_id, nguon_don,
 gia_san_pham, phi_van_chuyen, tong_tien, trang_thai,
 han_thanh_toan, han_nguoi_ban_gui_hang, ngay_giao_hang, han_kiem_tra,
 ngay_hoan_thanh, ngay_huy, ly_do_huy,
 ten_nguoi_nhan, sdt_nguoi_nhan, dia_chi_giao_hang, ngay_tao)
VALUES
-- Đơn đã hoàn tất
(1, 'ORD-000001', 3, 3, 6, 'THANG_DAU_GIA',
 4800000, 50000, 4850000, 'HOAN_THANH',
 DATE_SUB(NOW(), INTERVAL 8 DAY),
 DATE_SUB(NOW(), INTERVAL 7 DAY),
 DATE_SUB(NOW(), INTERVAL 8 DAY),
 DATE_SUB(NOW(), INTERVAL 5 DAY),
 DATE_SUB(NOW(), INTERVAL 7 DAY),
 NULL, NULL,
 'Trần Quốc Nam', '0900000003',
 'Số 12 đường mẫu, Phố Hiến, Hưng Yên',
 DATE_SUB(NOW(), INTERVAL 10 DAY)),

-- Người thắng không thanh toán trong 48 giờ
(2, 'ORD-000002', 6, 4, 6, 'THANG_DAU_GIA',
 6600000, 50000, 6650000, 'DA_HUY',
 DATE_SUB(NOW(), INTERVAL 3 DAY),
 NULL, NULL, NULL,
 NULL, DATE_SUB(NOW(), INTERVAL 3 DAY),
 'Người mua không thanh toán trong thời hạn 48 giờ.',
 'Lê Hoàng Anh', '0900000004',
 'Số 88 đường mẫu, Dịch Vọng, Cầu Giấy, Hà Nội',
 DATE_SUB(NOW(), INTERVAL 5 DAY)),

-- Đơn đang tranh chấp, tiền vẫn giữ trung gian
(3, 'ORD-000003', 7, 3, 2, 'THANG_DAU_GIA',
 15000000, 50000, 15050000, 'DANG_TRANH_CHAP',
 DATE_SUB(NOW(), INTERVAL 1 DAY),
 DATE_ADD(DATE_SUB(NOW(), INTERVAL 2 DAY), INTERVAL 3 DAY),
 DATE_SUB(NOW(), INTERVAL 1 DAY),
 DATE_ADD(DATE_SUB(NOW(), INTERVAL 1 DAY), INTERVAL 3 DAY),
 NULL, NULL, NULL,
 'Trần Quốc Nam', '0900000003',
 'Số 12 đường mẫu, Phố Hiến, Hưng Yên',
 DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT INTO thanh_toan
(id, don_hang_id, phuong_thuc_thanh_toan, so_tien, trang_thai, ma_giao_dich, ngay_thanh_toan, ngay_het_han)
VALUES
(1, 1, 'MO_PHONG', 4850000, 'DA_THANH_TOAN', 'PAY-DEMO-0001',
 DATE_SUB(NOW(), INTERVAL 9 DAY), NULL),

(2, 2, 'MO_PHONG', 6650000, 'HET_HAN', NULL,
 NULL, DATE_SUB(NOW(), INTERVAL 3 DAY)),

(3, 3, 'MO_PHONG', 15050000, 'DA_THANH_TOAN', 'PAY-DEMO-0003',
 DATE_ADD(DATE_SUB(NOW(), INTERVAL 2 DAY), INTERVAL 2 HOUR), NULL);

INSERT INTO giu_tien_trung_gian
(id, don_hang_id, so_tien, trang_thai, ngay_bat_dau_giu, ngay_giai_ngan, ngay_hoan_tien, ghi_chu)
VALUES
(1, 1, 4850000, 'DA_GIAI_NGAN',
 DATE_SUB(NOW(), INTERVAL 9 DAY),
 DATE_SUB(NOW(), INTERVAL 7 DAY),
 NULL,
 'Người mua xác nhận hàng hợp lệ, hệ thống giải ngân cho người bán.'),

(2, 3, 15050000, 'DANG_GIU',
 DATE_SUB(NOW(), INTERVAL 2 DAY),
 NULL,
 NULL,
 'Đang giữ tiền do đơn hàng có tranh chấp.');

INSERT INTO van_chuyen
(id, don_hang_id, don_vi_van_chuyen, ma_van_don, trang_thai, ngay_gui_hang, ngay_giao_hang)
VALUES
(1, 1, 'Giao hàng mẫu', 'SHIP-DEMO-0001', 'DA_GIAO',
 DATE_SUB(NOW(), INTERVAL 9 DAY),
 DATE_SUB(NOW(), INTERVAL 8 DAY)),

(2, 3, 'Giao hàng mẫu', 'SHIP-DEMO-0003', 'DA_GIAO',
 DATE_SUB(NOW(), INTERVAL 36 HOUR),
 DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Tranh chấp
INSERT INTO tranh_chap
(id, don_hang_id, nguoi_mo_id, ly_do, mo_ta, trang_thai,
 phan_hoi_nguoi_ban, ket_qua_xu_ly, so_tien_hoan, nguoi_xu_ly_id, ngay_mo, ngay_giai_quyet)
VALUES
(1, 3, 3, 'KHONG_DUNG_MO_TA',
 'Người mua phản ánh tình trạng thực tế của sản phẩm không giống mô tả trong bài đăng.',
 'QUAN_TRI_DANG_XU_LY',
 'Người bán đã gửi ảnh trước khi đóng gói và đề nghị quản trị viên kiểm tra.',
 NULL, 0, 1,
 DATE_SUB(NOW(), INTERVAL 12 HOUR), NULL);

INSERT INTO bang_chung_tranh_chap
(id, tranh_chap_id, nguoi_tai_len_id, duong_dan_tep, loai_bang_chung, mo_ta)
VALUES
(1, 1, 3, '/uploads/tranh_chap/order3-nm-1.jpg', 'HINH_ANH',
 'Ảnh sản phẩm khi người mua nhận hàng.'),
(2, 1, 2, '/uploads/tranh_chap/order3-nb-1.jpg', 'HINH_ANH',
 'Ảnh sản phẩm do người bán chụp trước khi giao.');

-- Đánh giá chỉ sau đơn hoàn tất
INSERT INTO danh_gia
(id, don_hang_id, nguoi_danh_gia_id, nguoi_duoc_danh_gia_id, so_sao, nhan_xet)
VALUES
(1, 1, 3, 6, 5, 'Người bán đóng gói tốt, sản phẩm đúng mô tả.'),
(2, 1, 6, 3, 5, 'Người mua thanh toán nhanh và phối hợp tốt.');

-- Theo dõi phiên đấu giá
INSERT INTO danh_sach_theo_doi
(id, nguoi_dung_id, phien_dau_gia_id)
VALUES
(1, 3, 1),
(2, 3, 2),
(3, 4, 1),
(4, 4, 5);

-- Thông báo
INSERT INTO thong_bao
(id, nguoi_dung_id, loai, tieu_de, noi_dung, duong_dan_lien_ket, da_doc, ngay_doc, ngay_tao)
VALUES
(1, 4, 'DANG_DAN_DAU',
 'Bạn đang dẫn đầu phiên đấu giá',
 'Mức giá hiện tại của phiên iPhone 15 Pro Max là 20.700.000đ.',
 '/phien_dau_gia/1', 0, NULL, NOW()),

(2, 3, 'KET_THUC_DAU_GIA',
 'Bạn đã thắng phiên đấu giá',
 'Bạn đã thắng phiên đấu giá Seiko 5 Sports Automatic.',
 '/don_hang/1', 1, DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),

(3, 4, 'HET_HAN_THANH_TOAN',
 'Đơn hàng đã bị hủy',
 'Bạn không thanh toán đơn ORD-000002 trong thời hạn cho phép.',
 '/don_hang/2', 0, NULL, DATE_SUB(NOW(), INTERVAL 3 DAY)),

(4, 2, 'MO_TRANH_CHAP',
 'Đơn hàng có tranh chấp',
 'Người mua đã mở tranh chấp cho đơn ORD-000003.',
 '/tranh_chap/1', 0, NULL, DATE_SUB(NOW(), INTERVAL 12 HOUR));

-- Vi phạm không thanh toán
INSERT INTO vi_pham
(id, nguoi_dung_id, phien_dau_gia_id, don_hang_id, loai_vi_pham, mo_ta, diem_vi_pham,
 trang_thai, nguoi_tao_id, ngay_xac_nhan, ngay_tao)
VALUES
(1, 4, 6, 2, 'KHONG_THANH_TOAN',
 'Người thắng phiên đấu giá không thanh toán đơn hàng trong 48 giờ.',
 1, 'DA_XAC_NHAN', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY));

-- Đề nghị mua cho người trả giá cao tiếp theo
INSERT INTO de_nghi_mua_tiep_theo
(id, phien_dau_gia_id, don_hang_goc_id, nguoi_tra_gia_id, gia_de_nghi,
 trang_thai, het_han_luc, ngay_phan_hoi, don_hang_moi_id, ngay_tao)
VALUES
(1, 6, 2, 3, 6500000,
 'CHO_XU_LY', DATE_ADD(NOW(), INTERVAL 24 HOUR),
 NULL, NULL, NOW());

-- Cấu hình nghiệp vụ
INSERT INTO cau_hinh_he_thong
(id, khoa_cau_hinh, gia_tri_cau_hinh, kieu_du_lieu, mo_ta, nguoi_cap_nhat_id)
VALUES
(1, 'PAYMENT_DEADLINE_HOURS', '48', 'SO',
 'Số giờ người thắng phải hoàn tất thanh toán.', 1),

(2, 'SELLER_SHIP_DEADLINE_DAYS', '3', 'SO',
 'Số ngày người bán phải giao hàng sau khi thanh toán.', 1),

(3, 'BUYER_INSPECTION_DAYS', '3', 'SO',
 'Số ngày người mua được kiểm tra hàng sau khi nhận.', 1),

(4, 'ANTI_SNIPE_THRESHOLD_SECONDS', '60', 'SO',
 'Nếu có giá hợp lệ trong số giây cuối này thì gia hạn.', 1),

(5, 'ANTI_SNIPE_EXTENSION_SECONDS', '90', 'SO',
 'Số giây được gia hạn mỗi lần chống đặt giá phút chót.', 1),

(6, 'SECOND_CHANCE_EXPIRE_HOURS', '24', 'SO',
 'Thời gian hiệu lực của đề nghị mua cho người trả giá cao tiếp theo.', 1),

(7, 'MAX_CONFIRMED_VIOLATION_POINTS', '3', 'SO',
 'Ngưỡng điểm vi phạm để hệ thống xem xét khóa hoặc tạm ngưng tài khoản.', 1);

-- Nhật ký hoạt động mẫu
INSERT INTO nhat_ky_hoat_dong
(id, nguoi_thuc_hien_id, hanh_dong, loai_doi_tuong, doi_tuong_id, du_lieu_cu, du_lieu_moi, dia_chi_ip)
VALUES
(1, 1, 'DUYET_SAN_PHAM', 'SAN_PHAM', 1,
 NULL,
 JSON_OBJECT('trang_thai_duyet','DA_DUYET'),
 '127.0.0.1'),

(2, 1, 'XAC_MINH_NGUOI_BAN', 'NGUOI_DUNG', 2,
 JSON_OBJECT('trang_thai_nguoi_ban','CHO_XU_LY'),
 JSON_OBJECT('trang_thai_nguoi_ban','DA_XAC_MINH'),
 '127.0.0.1'),

(3, 1, 'XAC_NHAN_VI_PHAM', 'VI_PHAM', 1,
 NULL,
 JSON_OBJECT('trang_thai','DA_XAC_NHAN','diem_vi_pham',1),
 '127.0.0.1');

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================
-- KIỂM TRA NHANH SAU KHI CHẠY SCRIPT
-- =========================================================

SELECT DATABASE() AS current_database;
SHOW TABLES;

SELECT * FROM v_phien_dau_gia_dang_dien_ra;
SELECT * FROM v_chi_tiet_don_hang;
SELECT * FROM nguoi_dung;
SELECT * FROM danh_muc;
SELECT * FROM san_pham;
SELECT * FROM phien_dau_gia;
