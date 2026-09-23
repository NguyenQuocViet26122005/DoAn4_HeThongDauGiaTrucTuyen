-- Chỉ cấu trúc cũ để công cụ sinh thiết kế/đối chiếu. Không phải file khởi tạo hiện hành.
-- Không chứa dữ liệu tài khoản hoặc lệnh xóa database.
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
