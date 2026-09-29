-- KHỞI TẠO MỚI: 21 bảng, nghiệp vụ 3.0. Chỉ chạy khi doan4_daugia chưa tồn tại.
-- Máy đã nâng cấp không chạy lại tệp này. Không bỏ qua lỗi, không dùng --force.
-- Không chứa tài khoản, mật khẩu hay dữ liệu người dùng mẫu.
CREATE DATABASE doan4_daugia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE doan4_daugia;
SET NAMES utf8mb4;
SET time_zone = '+07:00';

-- TÀI KHOẢN (3 bảng)

CREATE TABLE `nguoi_dung` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ho_ten` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `mat_khau_bam` varchar(255) NOT NULL,
  `so_dien_thoai` varchar(20) DEFAULT NULL,
  `anh_dai_dien` varchar(255) DEFAULT NULL,
  `vai_tro` enum('NGUOI_DUNG','QUAN_TRI') NOT NULL DEFAULT 'NGUOI_DUNG',
  `trang_thai_nguoi_ban` enum('CHUA_DANG_KY',
    'CHO_XU_LY',
    'DA_XAC_MINH',
    'TU_CHOI') NOT NULL DEFAULT 'CHUA_DANG_KY',
  `trang_thai_tai_khoan` enum('HOAT_DONG','BI_KHOA','TAM_NGUNG') NOT NULL DEFAULT 'HOAT_DONG',
  `ngay_xac_minh_email` datetime DEFAULT NULL,
  `lan_dang_nhap_cuoi` datetime DEFAULT NULL,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `so_dien_thoai` (`so_dien_thoai`),
  KEY `idx_users_role` (`vai_tro`),
  KEY `idx_users_seller_status` (`trang_thai_nguoi_ban`),
  KEY `idx_users_account_status` (`trang_thai_tai_khoan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `xac_minh_nguoi_ban` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nguoi_dung_id` bigint unsigned NOT NULL,
  `loai_giay_to` enum('CCCD','HO_CHIEU','KHAC') NOT NULL DEFAULT 'CCCD',
  `so_giay_to` varchar(50) NOT NULL,
  `anh_mat_truoc` varchar(255) DEFAULT NULL,
  `anh_mat_sau` varchar(255) DEFAULT NULL,
  `anh_selfie` varchar(255) DEFAULT NULL,
  `ten_ngan_hang` varchar(100) DEFAULT NULL,
  `so_tai_khoan` varchar(50) DEFAULT NULL,
  `chu_tai_khoan` varchar(100) DEFAULT NULL,
  `trang_thai` enum('CHO_XU_LY','DA_XAC_MINH','TU_CHOI') NOT NULL DEFAULT 'CHO_XU_LY',
  `ly_do_tu_choi` varchar(500) DEFAULT NULL,
  `ngay_gui_ho_so` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_duyet` datetime DEFAULT NULL,
  `nguoi_duyet_id` bigint unsigned DEFAULT NULL,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_seller_verification_admin` (`nguoi_duyet_id`),
  KEY `idx_seller_verification_user` (`nguoi_dung_id`),
  KEY `idx_seller_verification_status` (`trang_thai`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `dia_chi_nguoi_dung` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nguoi_dung_id` bigint unsigned NOT NULL,
  `ten_nguoi_nhan` varchar(100) NOT NULL,
  `sdt_nguoi_nhan` varchar(20) NOT NULL,
  `tinh_thanh` varchar(100) NOT NULL,
  `quan_huyen` varchar(100) NOT NULL,
  `phuong_xa` varchar(100) NOT NULL,
  `dia_chi_chi_tiet` varchar(255) NOT NULL,
  `la_mac_dinh` tinyint(1) NOT NULL DEFAULT '0',
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_address_user` (`nguoi_dung_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- DANH MỤC VÀ SẢN PHẨM (3 bảng)

CREATE TABLE `danh_muc` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `danh_muc_cha_id` bigint unsigned DEFAULT NULL,
  `ten` varchar(120) NOT NULL,
  `duong_dan` varchar(150) NOT NULL,
  `mo_ta` varchar(500) DEFAULT NULL,
  `duong_dan_anh` varchar(255) DEFAULT NULL,
  `dang_hoat_dong` tinyint(1) NOT NULL DEFAULT '1',
  `thu_tu` int NOT NULL DEFAULT '0',
  `cau_hinh_thuoc_tinh` json DEFAULT NULL,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `yeu_cau_kiem_dinh` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `duong_dan` (`duong_dan`),
  KEY `idx_category_parent` (`danh_muc_cha_id`),
  KEY `idx_category_active` (`dang_hoat_dong`),
  CONSTRAINT `ck_danh_muc_kiem_dinh` CHECK ((`yeu_cau_kiem_dinh` in (0,1))),
  CONSTRAINT `ck_danh_muc_thuoc_tinh` CHECK (((`cau_hinh_thuoc_tinh` is null)
    or (json_type(`cau_hinh_thuoc_tinh`) = _utf8mb4'ARRAY')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `san_pham` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nguoi_ban_id` bigint unsigned NOT NULL,
  `danh_muc_id` bigint unsigned NOT NULL,
  `tieu_de` varchar(200) NOT NULL,
  `duong_dan` varchar(220) NOT NULL,
  `mo_ta` text NOT NULL,
  `tinh_trang_san_pham` enum('MOI',
    'NHU_MOI',
    'DA_QUA_SU_DUNG_TOT',
    'DA_QUA_SU_DUNG',
    'LAY_LINH_KIEN') NOT NULL,
  `thuong_hieu` varchar(100) DEFAULT NULL,
  `trang_thai_duyet` enum('BAN_NHAP',
    'CHO_XU_LY',
    'DA_DUYET',
    'TU_CHOI',
    'LUU_TRU') NOT NULL DEFAULT 'BAN_NHAP',
  `ly_do_tu_choi` varchar(500) DEFAULT NULL,
  `nguoi_duyet_id` bigint unsigned DEFAULT NULL,
  `ngay_duyet` datetime DEFAULT NULL,
  `thuoc_tinh_json` json DEFAULT NULL,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `bat_buoc_kiem_dinh` tinyint(1) NOT NULL DEFAULT '0',
  `ngay_chup_chinh_sach_kiem_dinh` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `duong_dan` (`duong_dan`),
  KEY `fk_product_reviewer` (`nguoi_duyet_id`),
  KEY `idx_product_seller` (`nguoi_ban_id`),
  KEY `idx_product_category` (`danh_muc_id`),
  KEY `idx_product_approval` (`trang_thai_duyet`),
  CONSTRAINT `ck_san_pham_kiem_dinh` CHECK ((`bat_buoc_kiem_dinh` in (0,1))),
  CONSTRAINT `ck_san_pham_thuoc_tinh` CHECK (((`thuoc_tinh_json` is null)
    or (json_type(`thuoc_tinh_json`) = _utf8mb4'OBJECT')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `kiem_dinh_san_pham` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_kiem_dinh` varchar(60) NOT NULL,
  `san_pham_id` bigint unsigned NOT NULL,
  `lan_kiem_dinh` int NOT NULL DEFAULT '1',
  `trang_thai` enum('CHO_GUI_TRUNG_TAM',
    'DANG_VAN_CHUYEN_DEN_TRUNG_TAM',
    'DA_NHAN_TAI_TRUNG_TAM',
    'DANG_KIEM_DINH',
    'CAN_BO_SUNG',
    'DA_KIEM_DINH_DAT',
    'KIEM_DINH_KHONG_DAT',
    'DANG_LUU_GIU',
    'DA_TRA_NGUOI_BAN') NOT NULL DEFAULT 'CHO_GUI_TRUNG_TAM',
  `ngay_gui_trung_tam` datetime DEFAULT NULL,
  `don_vi_gui_trung_tam` varchar(100) DEFAULT NULL,
  `ma_van_don_den_trung_tam` varchar(100) DEFAULT NULL,
  `ngay_nhan_trung_tam` datetime DEFAULT NULL,
  `tinh_trang_khi_nhan` text,
  `serial_khi_nhan` varchar(150) DEFAULT NULL,
  `so_kien` int DEFAULT NULL,
  `ghi_chu_tiep_nhan` text,
  `ten_chuyen_gia` varchar(150) DEFAULT NULL,
  `don_vi_kiem_dinh` varchar(200) DEFAULT NULL,
  `ngay_kiem_dinh` datetime DEFAULT NULL,
  `ket_qua` enum('CHO_KET_QUA','DAT','KHONG_DAT','CAN_BO_SUNG') NOT NULL DEFAULT 'CHO_KET_QUA',
  `nhan_xet` text,
  `ma_chung_nhan` varchar(150) DEFAULT NULL,
  `ngay_tra_nguoi_ban` datetime DEFAULT NULL,
  `ly_do_tra` varchar(1000) DEFAULT NULL,
  `ngay_roi_trung_tam` datetime DEFAULT NULL,
  `nguoi_cap_nhat_id` bigint unsigned DEFAULT NULL,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_kiem_dinh` (`ma_kiem_dinh`),
  UNIQUE KEY `uq_kiem_dinh_lan` (`san_pham_id`,`lan_kiem_dinh`),
  KEY `fk_kiem_dinh_nguoi_cap_nhat` (`nguoi_cap_nhat_id`),
  KEY `idx_kiem_dinh_hang_doi` (`trang_thai`,`ngay_tao`),
  CONSTRAINT `ck_kiem_dinh_dat` CHECK (((`trang_thai` not in (_utf8mb4'DA_KIEM_DINH_DAT',
    _utf8mb4'DANG_LUU_GIU'))
    or ((`ket_qua` = _utf8mb4'DAT')
    and (`ngay_nhan_trung_tam` is not null)
    and (`ngay_kiem_dinh` is not null)
    and (`ten_chuyen_gia` is not null)
    and (`don_vi_kiem_dinh` is not null)))),
  CONSTRAINT `ck_kiem_dinh_lan` CHECK ((`lan_kiem_dinh` > 0)),
  CONSTRAINT `ck_kiem_dinh_so_kien` CHECK (((`so_kien` is null) or (`so_kien` > 0)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ĐẤU GIÁ (4 bảng)

CREATE TABLE `phien_dau_gia` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `san_pham_id` bigint unsigned NOT NULL,
  `gia_khoi_diem` decimal(15,2) NOT NULL,
  `gia_san` decimal(15,2) DEFAULT NULL,
  `gia_mua_ngay` decimal(15,2) DEFAULT NULL,
  `cho_phep_mua_ngay` tinyint(1) NOT NULL DEFAULT '0',
  `gia_hien_tai` decimal(15,2) NOT NULL,
  `nguoi_dan_dau_id` bigint unsigned DEFAULT NULL,
  `thoi_gian_bat_dau` datetime NOT NULL,
  `thoi_gian_ket_thuc_goc` datetime NOT NULL,
  `thoi_gian_ket_thuc` datetime NOT NULL,
  `trang_thai` enum('DA_LEN_LICH',
    'HOAT_DONG',
    'DA_KET_THUC',
    'THAT_BAI',
    'DA_HUY') NOT NULL DEFAULT 'DA_LEN_LICH',
  `ly_do_ket_thuc` enum('CO_NGUOI_THANG',
    'KHONG_CO_TRA_GIA',
    'KHONG_DAT_GIA_SAN',
    'MUA_NGAY',
    'QUAN_TRI_HUY',
    'HUY_THEO_YEU_CAU_NGUOI_BAN') DEFAULT NULL,
  `dat_gia_san` tinyint(1) NOT NULL DEFAULT '0',
  `bat_chong_phut_chot` tinyint(1) NOT NULL DEFAULT '1',
  `nguong_phut_chot_giay` int NOT NULL DEFAULT '60',
  `so_giay_gia_han` int NOT NULL DEFAULT '90',
  `so_lan_gia_han` int NOT NULL DEFAULT '0',
  `tong_luot_tra_gia` int NOT NULL DEFAULT '0',
  `phi_van_chuyen` decimal(15,2) NOT NULL DEFAULT '0.00',
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `yeu_cau_dat_coc` tinyint(1) NOT NULL DEFAULT '0',
  `so_tien_dat_coc` decimal(15,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_auction_current_winner` (`nguoi_dan_dau_id`),
  KEY `idx_auction_product` (`san_pham_id`),
  KEY `idx_auction_status` (`trang_thai`),
  KEY `idx_auction_start` (`thoi_gian_bat_dau`),
  KEY `idx_auction_end` (`thoi_gian_ket_thuc`),
  KEY `idx_phien_mo` (`trang_thai`,`thoi_gian_bat_dau`),
  KEY `idx_phien_chot` (`trang_thai`,`thoi_gian_ket_thuc`),
  CONSTRAINT `ck_phien_dat_coc` CHECK ((((`yeu_cau_dat_coc` = 0)
    and (`so_tien_dat_coc` is null))
    or ((`yeu_cau_dat_coc` = 1)
    and (`so_tien_dat_coc` is not null)
    and (`so_tien_dat_coc` > 0)
    and (`so_tien_dat_coc` <= `gia_khoi_diem`)))),
  CONSTRAINT `ck_phien_mua_ngay_san` CHECK (((`gia_mua_ngay` is null)
    or (`gia_san` is null)
    or (`gia_mua_ngay` >= `gia_san`))),
  CONSTRAINT `ck_phien_phi` CHECK ((`phi_van_chuyen` >= 0)),
  CONSTRAINT `phien_dau_gia_chk_1` CHECK ((`gia_khoi_diem` >= 0)),
  CONSTRAINT `phien_dau_gia_chk_2` CHECK ((`gia_hien_tai` >= 0)),
  CONSTRAINT `phien_dau_gia_chk_3` CHECK (((`gia_san` is null) or (`gia_san` >= `gia_khoi_diem`))),
  CONSTRAINT `phien_dau_gia_chk_4` CHECK (((`gia_mua_ngay` is null)
    or (`gia_mua_ngay` >= `gia_khoi_diem`))),
  CONSTRAINT `phien_dau_gia_chk_5` CHECK ((`thoi_gian_ket_thuc` >= `thoi_gian_bat_dau`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tham_gia_phien` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `phien_dau_gia_id` bigint unsigned NOT NULL,
  `nguoi_dung_id` bigint unsigned NOT NULL,
  `dang_theo_doi` tinyint(1) NOT NULL DEFAULT '0',
  `gia_toi_da` decimal(15,2) DEFAULT NULL,
  `thoi_gian_dat_gia_toi_da` datetime DEFAULT NULL,
  `ngay_theo_doi` datetime DEFAULT NULL,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tham_gia` (`phien_dau_gia_id`,`nguoi_dung_id`),
  KEY `idx_tham_gia_theo_doi` (`nguoi_dung_id`,`dang_theo_doi`),
  CONSTRAINT `ck_tham_gia_cam_ket` CHECK ((((`gia_toi_da` is null)
    and (`thoi_gian_dat_gia_toi_da` is null))
    or ((`gia_toi_da` is not null)
    and (`gia_toi_da` > 0)
    and (`thoi_gian_dat_gia_toi_da` is not null)))),
  CONSTRAINT `ck_tham_gia_theo_doi` CHECK ((`dang_theo_doi` in (0,1)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `luot_tra_gia` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `phien_dau_gia_id` bigint unsigned NOT NULL,
  `nguoi_tra_gia_id` bigint unsigned NOT NULL,
  `so_tien` decimal(15,2) NOT NULL,
  `loai_tra_gia` enum('TRUC_TIEP','TU_DONG') NOT NULL DEFAULT 'TRUC_TIEP',
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bid_auction_time` (`phien_dau_gia_id`,`ngay_tao`),
  KEY `idx_bid_bidder` (`nguoi_tra_gia_id`),
  KEY `idx_luot_ung_vien` (`phien_dau_gia_id`,`nguoi_tra_gia_id`,`ngay_tao`,`id`),
  CONSTRAINT `luot_tra_gia_chk_1` CHECK ((`so_tien` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `dat_coc_dau_gia` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `phien_dau_gia_id` bigint unsigned NOT NULL,
  `nguoi_dung_id` bigint unsigned NOT NULL,
  `don_hang_id` bigint unsigned DEFAULT NULL,
  `so_tien` decimal(15,2) NOT NULL,
  `phuong_thuc` enum('MO_PHONG') NOT NULL DEFAULT 'MO_PHONG',
  `trang_thai` enum('CHO_THANH_TOAN',
    'DA_DAT_COC',
    'THAT_BAI',
    'DA_HOAN_COC',
    'DA_CHUYEN_VAO_DON',
    'KHONG_HOAN_COC',
    'HET_HAN') NOT NULL DEFAULT 'CHO_THANH_TOAN',
  `ma_giao_dich` varchar(100) DEFAULT NULL,
  `khoa_yeu_cau` varchar(100) DEFAULT NULL,
  `ngay_dat_coc` datetime DEFAULT NULL,
  `ngay_hoan` datetime DEFAULT NULL,
  `ngay_chuyen_vao_don` datetime DEFAULT NULL,
  `ngay_khong_hoan` datetime DEFAULT NULL,
  `ly_do_xu_ly` varchar(1000) DEFAULT NULL,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_coc_nguoi_phien` (`phien_dau_gia_id`,`nguoi_dung_id`),
  UNIQUE KEY `ma_giao_dich` (`ma_giao_dich`),
  UNIQUE KEY `khoa_yeu_cau` (`khoa_yeu_cau`),
  UNIQUE KEY `uq_coc_don` (`don_hang_id`),
  KEY `fk_coc_nguoi` (`nguoi_dung_id`),
  KEY `idx_coc_phien_trang_thai` (`phien_dau_gia_id`,`trang_thai`),
  CONSTRAINT `ck_coc_da_thu` CHECK (((`trang_thai` in (_utf8mb4'CHO_THANH_TOAN',
    _utf8mb4'THAT_BAI',
    _utf8mb4'HET_HAN'))
    or (`ngay_dat_coc` is not null))),
  CONSTRAINT `ck_coc_gan_don` CHECK ((((`trang_thai` in (_utf8mb4'DA_CHUYEN_VAO_DON',
    _utf8mb4'KHONG_HOAN_COC'))
    and (`don_hang_id` is not null)
    and (`ngay_chuyen_vao_don` is not null))
    or ((`trang_thai` not in (_utf8mb4'DA_CHUYEN_VAO_DON',
    _utf8mb4'KHONG_HOAN_COC'))
    and (`don_hang_id` is null)))),
  CONSTRAINT `ck_coc_hoan` CHECK (((`trang_thai` <> _utf8mb4'DA_HOAN_COC')
    or (`ngay_hoan` is not null))),
  CONSTRAINT `ck_coc_khong_hoan` CHECK (((`trang_thai` <> _utf8mb4'KHONG_HOAN_COC')
    or (`ngay_khong_hoan` is not null))),
  CONSTRAINT `ck_coc_so_tien` CHECK ((`so_tien` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ĐƠN HÀNG VÀ THANH TOÁN (3 bảng)

CREATE TABLE `don_hang` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_don_hang` varchar(30) NOT NULL,
  `phien_dau_gia_id` bigint unsigned NOT NULL,
  `nguoi_mua_id` bigint unsigned NOT NULL,
  `nguoi_ban_id` bigint unsigned NOT NULL,
  `nguon_don` enum('THANG_DAU_GIA','DE_NGHI_TIEP_THEO') NOT NULL DEFAULT 'THANG_DAU_GIA',
  `gia_san_pham` decimal(15,2) NOT NULL,
  `phi_van_chuyen` decimal(15,2) NOT NULL DEFAULT '0.00',
  `tong_tien` decimal(15,2) NOT NULL,
  `trang_thai` enum('CHO_THANH_TOAN',
    'DA_THANH_TOAN',
    'CHO_GUI_HANG',
    'DA_GUI_HANG',
    'DA_GIAO',
    'DANG_KIEM_TRA',
    'DANG_TRANH_CHAP',
    'HOAN_THANH',
    'DA_HUY') NOT NULL DEFAULT 'CHO_THANH_TOAN',
  `han_thanh_toan` datetime DEFAULT NULL,
  `han_nguoi_ban_gui_hang` datetime DEFAULT NULL,
  `ngay_giao_hang` datetime DEFAULT NULL,
  `han_kiem_tra` datetime DEFAULT NULL,
  `ngay_hoan_thanh` datetime DEFAULT NULL,
  `ngay_huy` datetime DEFAULT NULL,
  `ly_do_huy` varchar(500) DEFAULT NULL,
  `ten_nguoi_nhan` varchar(100) NOT NULL,
  `sdt_nguoi_nhan` varchar(20) NOT NULL,
  `dia_chi_giao_hang` varchar(500) NOT NULL,
  `trang_thai_giu_tien` enum('CHO_GIU_TIEN',
    'DANG_GIU',
    'DA_GIAI_NGAN',
    'DA_HOAN_TIEN',
    'HOAN_TIEN_MOT_PHAN') NOT NULL DEFAULT 'CHO_GIU_TIEN',
  `so_tien_da_thu` decimal(15,2) NOT NULL DEFAULT '0.00',
  `so_tien_da_hoan` decimal(15,2) NOT NULL DEFAULT '0.00',
  `so_tien_da_giai_ngan` decimal(15,2) NOT NULL DEFAULT '0.00',
  `so_tien_dang_giu` decimal(15,
    2) GENERATED ALWAYS AS (((`so_tien_da_thu` - `so_tien_da_hoan`) - `so_tien_da_giai_ngan`)) STORED,
  `ngay_bat_dau_giu` datetime DEFAULT NULL,
  `ngay_giai_ngan` datetime DEFAULT NULL,
  `ngay_hoan_tien` datetime DEFAULT NULL,
  `ghi_chu_giu_tien` varchar(500) DEFAULT NULL,
  `du_lieu_lich_su` tinyint(1) NOT NULL DEFAULT '0',
  `don_vi_van_chuyen` varchar(100) DEFAULT NULL,
  `ma_van_don` varchar(100) DEFAULT NULL,
  `trang_thai_van_chuyen` enum('CHO_XU_LY',
    'DA_LAY_HANG',
    'DANG_VAN_CHUYEN',
    'DA_GIAO',
    'THAT_BAI',
    'DA_HOAN_TRA') DEFAULT NULL,
  `ngay_gui_hang` datetime DEFAULT NULL,
  `ngay_giao_van_chuyen` datetime DEFAULT NULL,
  `moc_khieu_nai_chua_nhan` datetime DEFAULT NULL,
  `can_admin_xu_ly` tinyint(1) NOT NULL DEFAULT '0',
  `ly_do_can_xu_ly` varchar(500) DEFAULT NULL,
  `giu_tien_id_cu` bigint unsigned DEFAULT NULL,
  `giu_tien_ngay_tao` timestamp NULL DEFAULT NULL,
  `giu_tien_ngay_cap_nhat` timestamp NULL DEFAULT NULL,
  `van_chuyen_id_cu` bigint unsigned DEFAULT NULL,
  `van_chuyen_ngay_tao` timestamp NULL DEFAULT NULL,
  `van_chuyen_ngay_cap_nhat` timestamp NULL DEFAULT NULL,
  `phien_con_nghia_vu` bigint unsigned GENERATED ALWAYS AS ((case when (`trang_thai` <> _utf8mb4'DA_HUY') then `phien_dau_gia_id` else NULL end)) STORED,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `tien_coc_da_chuyen` decimal(15,2) NOT NULL DEFAULT '0.00',
  `so_tien_con_phai_thanh_toan` decimal(15,
    2) GENERATED ALWAYS AS ((`tong_tien` - `so_tien_da_thu`)) STORED,
  `nguon_gui_hang` enum('NGUOI_BAN','TRUNG_TAM') NOT NULL DEFAULT 'NGUOI_BAN',
  `kiem_dinh_san_pham_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_don_hang` (`ma_don_hang`),
  UNIQUE KEY `giu_tien_id_cu` (`giu_tien_id_cu`),
  UNIQUE KEY `van_chuyen_id_cu` (`van_chuyen_id_cu`),
  UNIQUE KEY `uq_phien_con_nghia_vu` (`phien_con_nghia_vu`),
  KEY `idx_order_auction` (`phien_dau_gia_id`),
  KEY `idx_order_buyer_status` (`nguoi_mua_id`,`trang_thai`),
  KEY `idx_order_seller_status` (`nguoi_ban_id`,`trang_thai`),
  KEY `idx_don_thanh_toan_han` (`trang_thai`,`han_thanh_toan`),
  KEY `idx_don_gui_han` (`trang_thai`,`han_nguoi_ban_gui_hang`),
  KEY `idx_don_kiem_tra_han` (`trang_thai`,`han_kiem_tra`),
  KEY `idx_don_van_don` (`ma_van_don`),
  KEY `idx_don_can_xu_ly` (`can_admin_xu_ly`,`trang_thai`),
  KEY `fk_don_kiem_dinh` (`kiem_dinh_san_pham_id`),
  CONSTRAINT `ck_don_can_xu_ly` CHECK ((`can_admin_xu_ly` in (0,1))),
  CONSTRAINT `ck_don_co_lich_su` CHECK ((`du_lieu_lich_su` in (0,1))),
  CONSTRAINT `ck_don_coc` CHECK (((`tien_coc_da_chuyen` >= 0)
    and (`tien_coc_da_chuyen` <= `gia_san_pham`)
    and (`so_tien_da_thu` >= `tien_coc_da_chuyen`)
    and (`so_tien_da_thu` <= `tong_tien`))),
  CONSTRAINT `ck_don_nguon_gui` CHECK ((((`nguon_gui_hang` = _utf8mb4'NGUOI_BAN')
    and (`kiem_dinh_san_pham_id` is null))
    or ((`nguon_gui_hang` = _utf8mb4'TRUNG_TAM')
    and (`kiem_dinh_san_pham_id` is not null)))),
  CONSTRAINT `ck_don_quyet_toan` CHECK ((((`trang_thai_giu_tien` = _utf8mb4'CHO_GIU_TIEN')
    and (`so_tien_da_thu` = 0))
    or ((`trang_thai_giu_tien` = _utf8mb4'DANG_GIU')
    and (`so_tien_da_thu` > 0)
    and (`so_tien_dang_giu` = `so_tien_da_thu`))
    or ((`trang_thai_giu_tien` = _utf8mb4'DA_GIAI_NGAN')
    and (`so_tien_da_thu` > 0)
    and (`so_tien_da_giai_ngan` = `so_tien_da_thu`))
    or ((`trang_thai_giu_tien` = _utf8mb4'DA_HOAN_TIEN')
    and (`so_tien_da_thu` > 0)
    and (`so_tien_da_hoan` = `so_tien_da_thu`))
    or ((`trang_thai_giu_tien` = _utf8mb4'HOAN_TIEN_MOT_PHAN')
    and (`du_lieu_lich_su` = 1)
    and (`so_tien_da_hoan` > 0)
    and (`so_tien_da_hoan` < `so_tien_da_thu`)
    and (`so_tien_dang_giu` = 0)))),
  CONSTRAINT `ck_don_tien` CHECK (((`so_tien_da_thu` >= 0)
    and (`so_tien_da_hoan` >= 0)
    and (`so_tien_da_giai_ngan` >= 0)
    and (`so_tien_dang_giu` >= 0))),
  CONSTRAINT `ck_don_tien_thu` CHECK (((`so_tien_da_thu` = 0)
    or (`so_tien_da_thu` = `tien_coc_da_chuyen`)
    or (`so_tien_da_thu` = `tong_tien`))),
  CONSTRAINT `ck_don_tong` CHECK ((`tong_tien` = (`gia_san_pham` + `phi_van_chuyen`))),
  CONSTRAINT `don_hang_chk_1` CHECK ((`gia_san_pham` >= 0)),
  CONSTRAINT `don_hang_chk_2` CHECK ((`phi_van_chuyen` >= 0)),
  CONSTRAINT `don_hang_chk_3` CHECK ((`tong_tien` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `thanh_toan` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `don_hang_id` bigint unsigned NOT NULL,
  `phuong_thuc_thanh_toan` enum('MO_PHONG',
    'CHUYEN_KHOAN',
    'VI_DIEN_TU',
    'THE') NOT NULL DEFAULT 'MO_PHONG',
  `so_tien` decimal(15,2) NOT NULL,
  `trang_thai` enum('CHO_XU_LY',
    'DA_THANH_TOAN',
    'THAT_BAI',
    'HET_HAN',
    'DA_HOAN_TIEN') NOT NULL DEFAULT 'CHO_XU_LY',
  `ma_giao_dich` varchar(100) DEFAULT NULL,
  `ngay_thanh_toan` datetime DEFAULT NULL,
  `ngay_het_han` datetime DEFAULT NULL,
  `khoa_yeu_cau` varchar(64) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  `don_da_thu_tien` bigint unsigned GENERATED ALWAYS AS ((case when (`trang_thai` in (_utf8mb4'DA_THANH_TOAN',
    _utf8mb4'DA_HOAN_TIEN')) then `don_hang_id` else NULL end)) STORED,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_giao_dich` (`ma_giao_dich`),
  UNIQUE KEY `khoa_yeu_cau` (`khoa_yeu_cau`),
  UNIQUE KEY `uq_don_da_thu_tien` (`don_da_thu_tien`),
  KEY `idx_payment_order` (`don_hang_id`),
  KEY `idx_payment_status` (`trang_thai`),
  CONSTRAINT `thanh_toan_chk_1` CHECK ((`so_tien` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `de_nghi_mua_tiep_theo` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `phien_dau_gia_id` bigint unsigned NOT NULL,
  `don_hang_goc_id` bigint unsigned NOT NULL,
  `nguoi_tra_gia_id` bigint unsigned NOT NULL,
  `gia_de_nghi` decimal(15,2) NOT NULL,
  `trang_thai` enum('CHO_XU_LY','DA_CHAP_NHAN','TU_CHOI','HET_HAN') NOT NULL DEFAULT 'CHO_XU_LY',
  `het_han_luc` datetime NOT NULL,
  `ngay_phan_hoi` datetime DEFAULT NULL,
  `don_hang_moi_id` bigint unsigned DEFAULT NULL,
  `phien_dang_de_nghi` bigint unsigned GENERATED ALWAYS AS ((case when (`trang_thai` = _utf8mb4'CHO_XU_LY') then `phien_dau_gia_id` else NULL end)) STORED,
  `luot_tra_gia_nguon_id` bigint unsigned NOT NULL,
  `nguoi_yeu_cau_id` bigint unsigned DEFAULT NULL,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_second_chance_auction_bidder` (`phien_dau_gia_id`,`nguoi_tra_gia_id`),
  UNIQUE KEY `uq_phien_dang_de_nghi` (`phien_dang_de_nghi`),
  KEY `fk_second_chance_original_order` (`don_hang_goc_id`),
  KEY `fk_second_chance_bidder` (`nguoi_tra_gia_id`),
  KEY `fk_second_chance_result_order` (`don_hang_moi_id`),
  KEY `idx_second_chance_status` (`trang_thai`),
  KEY `fk_de_nghi_luot_cong_khai` (`luot_tra_gia_nguon_id`),
  KEY `fk_de_nghi_nguoi_yeu_cau` (`nguoi_yeu_cau_id`),
  KEY `idx_de_nghi_han` (`trang_thai`,`het_han_luc`),
  CONSTRAINT `de_nghi_mua_tiep_theo_chk_1` CHECK ((`gia_de_nghi` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- TRANH CHẤP VÀ TỆP (3 bảng)

CREATE TABLE `tranh_chap` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `don_hang_id` bigint unsigned NOT NULL,
  `nguoi_mo_id` bigint unsigned NOT NULL,
  `ly_do` enum('CHUA_NHAN_HANG',
    'KHONG_DUNG_MO_TA',
    'HONG_HOC',
    'HANG_GIA',
    'KHAC',
    'KHONG_KHOP_HO_SO_KIEM_DINH',
    'NGHI_NGO_TINH_XAC_THUC',
    'THIEU_PHU_KIEN') NOT NULL,
  `mo_ta` text NOT NULL,
  `trang_thai` enum('DANG_MO',
    'NGUOI_BAN_DA_PHAN_HOI',
    'QUAN_TRI_DANG_XU_LY',
    'GIAI_QUYET_CHO_NGUOI_MUA',
    'GIAI_QUYET_CHO_NGUOI_BAN',
    'DA_HUY') NOT NULL DEFAULT 'DANG_MO',
  `phan_hoi_nguoi_ban` text,
  `ket_qua_xu_ly` text,
  `so_tien_hoan` decimal(15,2) NOT NULL DEFAULT '0.00',
  `nguoi_xu_ly_id` bigint unsigned DEFAULT NULL,
  `ngay_mo` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_giai_quyet` datetime DEFAULT NULL,
  `don_dang_tranh_chap` bigint unsigned GENERATED ALWAYS AS ((case when (`trang_thai` in (_utf8mb4'DANG_MO',
    _utf8mb4'NGUOI_BAN_DA_PHAN_HOI',
    _utf8mb4'QUAN_TRI_DANG_XU_LY')) then `don_hang_id` else NULL end)) STORED,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_don_dang_tranh_chap` (`don_dang_tranh_chap`),
  KEY `fk_dispute_opened_by` (`nguoi_mo_id`),
  KEY `fk_dispute_admin` (`nguoi_xu_ly_id`),
  KEY `idx_dispute_order` (`don_hang_id`),
  KEY `idx_dispute_status` (`trang_thai`),
  CONSTRAINT `tranh_chap_chk_1` CHECK ((`so_tien_hoan` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tep_dinh_kem` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `loai_tep` enum('ANH_SAN_PHAM',
    'BANG_CHUNG_TRANH_CHAP',
    'BIEN_BAN_TIEP_NHAN',
    'BAO_CAO_KIEM_DINH',
    'CHUNG_NHAN_KIEM_DINH') NOT NULL,
  `san_pham_id` bigint unsigned DEFAULT NULL,
  `tranh_chap_id` bigint unsigned DEFAULT NULL,
  `nguoi_tai_len_id` bigint unsigned DEFAULT NULL,
  `duong_dan_tep` varchar(255) NOT NULL,
  `loai_noi_dung` enum('HINH_ANH','VIDEO','TAI_LIEU','KHAC') NOT NULL DEFAULT 'HINH_ANH',
  `la_anh_chinh` tinyint(1) NOT NULL DEFAULT '0',
  `thu_tu` int NOT NULL DEFAULT '0',
  `mo_ta` varchar(500) DEFAULT NULL,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `san_pham_anh_chinh` bigint unsigned GENERATED ALWAYS AS ((case when ((`loai_tep` = _utf8mb4'ANH_SAN_PHAM')
    and (`la_anh_chinh` = 1)) then `san_pham_id` else NULL end)) STORED,
  `kiem_dinh_san_pham_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_anh_chinh` (`san_pham_anh_chinh`),
  KEY `fk_tep_nguoi_tai` (`nguoi_tai_len_id`),
  KEY `idx_tep_san_pham` (`san_pham_id`,`thu_tu`),
  KEY `idx_tep_tranh_chap` (`tranh_chap_id`,`ngay_tao`),
  KEY `fk_tep_kiem_dinh` (`kiem_dinh_san_pham_id`),
  CONSTRAINT `ck_tep_anh_chinh` CHECK ((`la_anh_chinh` in (0,1))),
  CONSTRAINT `ck_tep_doi_tuong` CHECK ((((`loai_tep` = _utf8mb4'ANH_SAN_PHAM')
    and (`san_pham_id` is not null)
    and (`tranh_chap_id` is null)
    and (`kiem_dinh_san_pham_id` is null)
    and (`loai_noi_dung` = _utf8mb4'HINH_ANH'))
    or ((`loai_tep` = _utf8mb4'BANG_CHUNG_TRANH_CHAP')
    and (`tranh_chap_id` is not null)
    and (`san_pham_id` is null)
    and (`kiem_dinh_san_pham_id` is null)
    and (`la_anh_chinh` = 0))
    or ((`loai_tep` in (_utf8mb4'BIEN_BAN_TIEP_NHAN',
    _utf8mb4'BAO_CAO_KIEM_DINH',
    _utf8mb4'CHUNG_NHAN_KIEM_DINH'))
    and (`kiem_dinh_san_pham_id` is not null)
    and (`san_pham_id` is null)
    and (`tranh_chap_id` is null)
    and (`la_anh_chinh` = 0))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `danh_gia` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `don_hang_id` bigint unsigned NOT NULL,
  `nguoi_danh_gia_id` bigint unsigned NOT NULL,
  `nguoi_duoc_danh_gia_id` bigint unsigned NOT NULL,
  `so_sao` tinyint unsigned NOT NULL,
  `nhan_xet` varchar(1000) DEFAULT NULL,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_review_per_order_user` (`don_hang_id`,`nguoi_danh_gia_id`),
  KEY `fk_review_reviewer` (`nguoi_danh_gia_id`),
  KEY `idx_review_reviewee` (`nguoi_duoc_danh_gia_id`),
  CONSTRAINT `danh_gia_chk_1` CHECK ((`so_sao` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- QUẢN TRỊ VÀ THÔNG BÁO (5 bảng)

CREATE TABLE `yeu_cau_xu_ly` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `loai_yeu_cau` enum('HUY_PHIEN','BAO_CAO_SAN_PHAM') NOT NULL,
  `phien_dau_gia_id` bigint unsigned DEFAULT NULL,
  `san_pham_id` bigint unsigned DEFAULT NULL,
  `nguoi_yeu_cau_id` bigint unsigned NOT NULL,
  `ma_ly_do` varchar(50) DEFAULT NULL,
  `ly_do` varchar(1000) NOT NULL,
  `trang_thai` enum('CHO_XU_LY',
    'DANG_XU_LY',
    'DA_DUYET',
    'TU_CHOI',
    'CO_CO_SO',
    'KHONG_CO_CO_SO') NOT NULL DEFAULT 'CHO_XU_LY',
  `nguoi_duyet_id` bigint unsigned DEFAULT NULL,
  `ghi_chu_duyet` varchar(1000) DEFAULT NULL,
  `ngay_duyet` datetime DEFAULT NULL,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `phien_huy_dang_mo` bigint unsigned GENERATED ALWAYS AS ((case when ((`loai_yeu_cau` = _utf8mb4'HUY_PHIEN')
    and (`trang_thai` in (_utf8mb4'CHO_XU_LY',
    _utf8mb4'DANG_XU_LY'))) then `phien_dau_gia_id` else NULL end)) STORED,
  `san_pham_bao_cao_dang_mo` bigint unsigned GENERATED ALWAYS AS ((case when ((`loai_yeu_cau` = _utf8mb4'BAO_CAO_SAN_PHAM')
    and (`trang_thai` in (_utf8mb4'CHO_XU_LY',
    _utf8mb4'DANG_XU_LY'))) then `san_pham_id` else NULL end)) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_huy_dang_mo` (`phien_huy_dang_mo`),
  UNIQUE KEY `uq_bao_cao_dang_mo` (`nguoi_yeu_cau_id`,`san_pham_bao_cao_dang_mo`),
  KEY `fk_yeu_cau_phien` (`phien_dau_gia_id`),
  KEY `fk_yeu_cau_san_pham` (`san_pham_id`),
  KEY `fk_yeu_cau_nguoi_duyet` (`nguoi_duyet_id`),
  KEY `idx_yeu_cau_hang_doi` (`loai_yeu_cau`,`trang_thai`,`ngay_tao`),
  CONSTRAINT `ck_yeu_cau_doi_tuong` CHECK ((((`loai_yeu_cau` = _utf8mb4'HUY_PHIEN')
    and (`phien_dau_gia_id` is not null)
    and (`san_pham_id` is null))
    or ((`loai_yeu_cau` = _utf8mb4'BAO_CAO_SAN_PHAM')
    and (`san_pham_id` is not null)
    and (`phien_dau_gia_id` is null)))),
  CONSTRAINT `ck_yeu_cau_trang_thai` CHECK (((`trang_thai` in (_utf8mb4'CHO_XU_LY',
    _utf8mb4'DANG_XU_LY'))
    or ((`loai_yeu_cau` = _utf8mb4'HUY_PHIEN')
    and (`trang_thai` in (_utf8mb4'DA_DUYET',
    _utf8mb4'TU_CHOI')))
    or ((`loai_yeu_cau` = _utf8mb4'BAO_CAO_SAN_PHAM')
    and (`trang_thai` in (_utf8mb4'CO_CO_SO',
    _utf8mb4'KHONG_CO_CO_SO')))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `vi_pham` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nguoi_dung_id` bigint unsigned NOT NULL,
  `phien_dau_gia_id` bigint unsigned DEFAULT NULL,
  `don_hang_id` bigint unsigned DEFAULT NULL,
  `loai_vi_pham` enum('KHONG_THANH_TOAN',
    'GIAO_HANG_MUON',
    'TU_DAU_GIA',
    'GIAN_LAN',
    'LAM_DUNG',
    'KHAC') NOT NULL,
  `mo_ta` varchar(1000) NOT NULL,
  `diem_vi_pham` int NOT NULL DEFAULT '1',
  `trang_thai` enum('DANG_MO','DA_XAC_NHAN','DA_HUY') NOT NULL DEFAULT 'DANG_MO',
  `nguoi_tao_id` bigint unsigned DEFAULT NULL,
  `ngay_xac_nhan` datetime DEFAULT NULL,
  `hinh_thuc_xu_ly` enum('CHUA_XU_LY',
    'CANH_CAO',
    'TAM_NGUNG',
    'KHOA_TAI_KHOAN',
    'KHONG_VI_PHAM') NOT NULL DEFAULT 'CHUA_XU_LY',
  `ly_do_xu_ly` varchar(1000) DEFAULT NULL,
  `nguoi_xu_ly_id` bigint unsigned DEFAULT NULL,
  `ngay_xu_ly` datetime DEFAULT NULL,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_violation_auction` (`phien_dau_gia_id`),
  KEY `fk_violation_order` (`don_hang_id`),
  KEY `fk_violation_created_by` (`nguoi_tao_id`),
  KEY `idx_violation_user` (`nguoi_dung_id`),
  KEY `idx_violation_status` (`trang_thai`),
  KEY `fk_vi_pham_nguoi_xu_ly` (`nguoi_xu_ly_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `thong_bao` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nguoi_dung_id` bigint unsigned NOT NULL,
  `loai` varchar(50) NOT NULL,
  `tieu_de` varchar(200) NOT NULL,
  `noi_dung` varchar(1000) NOT NULL,
  `duong_dan_lien_ket` varchar(255) DEFAULT NULL,
  `da_doc` tinyint(1) NOT NULL DEFAULT '0',
  `ngay_doc` datetime DEFAULT NULL,
  `khoa_su_kien` varchar(160) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_thong_bao_su_kien` (`nguoi_dung_id`,`khoa_su_kien`),
  KEY `idx_notification_user_read` (`nguoi_dung_id`,`da_doc`),
  KEY `idx_notification_created` (`ngay_tao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cau_hinh_he_thong` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `khoa_cau_hinh` varchar(100) NOT NULL,
  `gia_tri_cau_hinh` text NOT NULL,
  `kieu_du_lieu` enum('CHUOI','SO','DUNG_SAI','JSON') NOT NULL DEFAULT 'CHUOI',
  `mo_ta` varchar(500) DEFAULT NULL,
  `nguoi_cap_nhat_id` bigint unsigned DEFAULT NULL,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `khoa_cau_hinh` (`khoa_cau_hinh`),
  KEY `fk_system_config_admin` (`nguoi_cap_nhat_id`),
  CONSTRAINT `ck_cau_hinh_json` CHECK (((`kieu_du_lieu` <> _utf8mb4'JSON')
    or json_valid(`gia_tri_cau_hinh`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `nhat_ky_hoat_dong` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nguoi_thuc_hien_id` bigint unsigned DEFAULT NULL,
  `hanh_dong` varchar(100) NOT NULL,
  `loai_doi_tuong` varchar(100) NOT NULL,
  `doi_tuong_id` bigint unsigned DEFAULT NULL,
  `du_lieu_cu` json DEFAULT NULL,
  `du_lieu_moi` json DEFAULT NULL,
  `dia_chi_ip` varchar(45) DEFAULT NULL,
  `trinh_duyet_thiet_bi` varchar(500) DEFAULT NULL,
  `phien_dau_gia_id` bigint unsigned DEFAULT NULL,
  `luot_tra_gia_id` bigint unsigned DEFAULT NULL,
  `ngay_tao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ma_yeu_cau` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_nhat_ky_yeu_cau` (`ma_yeu_cau`),
  KEY `idx_audit_actor` (`nguoi_thuc_hien_id`),
  KEY `idx_audit_entity` (`loai_doi_tuong`,`doi_tuong_id`),
  KEY `idx_audit_created` (`ngay_tao`),
  KEY `fk_nhat_ky_luot` (`luot_tra_gia_id`),
  KEY `idx_nhat_ky_phien` (`phien_dau_gia_id`,`hanh_dong`,`ngay_tao`),
  CONSTRAINT `ck_nhat_ky_gia_han` CHECK (((`hanh_dong` <> _utf8mb4'GIA_HAN_PHIEN')
    or ((`phien_dau_gia_id` is not null)
    and (`du_lieu_moi` is not null)
    and (json_type(`du_lieu_moi`) = _utf8mb4'OBJECT')
    and (json_contains_path(`du_lieu_moi`,
    _utf8mb4'all',
    _utf8mb4'$.thoi_gian_ket_thuc_cu',
    _utf8mb4'$.thoi_gian_ket_thuc_moi',
    _utf8mb4'$.so_giay_them') = 1))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Khai báo quan hệ sau khi đã tạo đủ các bảng. Không tắt kiểm tra khóa ngoại.

ALTER TABLE `xac_minh_nguoi_ban`
  ADD CONSTRAINT `fk_seller_verification_admin` FOREIGN KEY (`nguoi_duyet_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_seller_verification_user` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `dia_chi_nguoi_dung`
  ADD CONSTRAINT `fk_address_user` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `danh_muc`
  ADD CONSTRAINT `fk_category_parent` FOREIGN KEY (`danh_muc_cha_id`) REFERENCES `danh_muc` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `san_pham`
  ADD CONSTRAINT `fk_product_category` FOREIGN KEY (`danh_muc_id`) REFERENCES `danh_muc` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_product_reviewer` FOREIGN KEY (`nguoi_duyet_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_product_seller` FOREIGN KEY (`nguoi_ban_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `kiem_dinh_san_pham`
  ADD CONSTRAINT `fk_kiem_dinh_nguoi_cap_nhat` FOREIGN KEY (`nguoi_cap_nhat_id`) REFERENCES `nguoi_dung` (`id`),
  ADD CONSTRAINT `fk_kiem_dinh_san_pham` FOREIGN KEY (`san_pham_id`) REFERENCES `san_pham` (`id`);

ALTER TABLE `phien_dau_gia`
  ADD CONSTRAINT `fk_auction_current_winner` FOREIGN KEY (`nguoi_dan_dau_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_auction_product` FOREIGN KEY (`san_pham_id`) REFERENCES `san_pham` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `tham_gia_phien`
  ADD CONSTRAINT `fk_tham_gia_nguoi` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tham_gia_phien` FOREIGN KEY (`phien_dau_gia_id`) REFERENCES `phien_dau_gia` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `luot_tra_gia`
  ADD CONSTRAINT `fk_bid_auction` FOREIGN KEY (`phien_dau_gia_id`) REFERENCES `phien_dau_gia` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_bid_bidder` FOREIGN KEY (`nguoi_tra_gia_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `dat_coc_dau_gia`
  ADD CONSTRAINT `fk_coc_don` FOREIGN KEY (`don_hang_id`) REFERENCES `don_hang` (`id`),
  ADD CONSTRAINT `fk_coc_nguoi` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung` (`id`),
  ADD CONSTRAINT `fk_coc_phien` FOREIGN KEY (`phien_dau_gia_id`) REFERENCES `phien_dau_gia` (`id`);

ALTER TABLE `don_hang`
  ADD CONSTRAINT `fk_don_kiem_dinh` FOREIGN KEY (`kiem_dinh_san_pham_id`) REFERENCES `kiem_dinh_san_pham` (`id`),
  ADD CONSTRAINT `fk_order_auction` FOREIGN KEY (`phien_dau_gia_id`) REFERENCES `phien_dau_gia` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_order_buyer` FOREIGN KEY (`nguoi_mua_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_order_seller` FOREIGN KEY (`nguoi_ban_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `thanh_toan`
  ADD CONSTRAINT `fk_payment_order` FOREIGN KEY (`don_hang_id`) REFERENCES `don_hang` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `de_nghi_mua_tiep_theo`
  ADD CONSTRAINT `fk_de_nghi_luot_cong_khai` FOREIGN KEY (`luot_tra_gia_nguon_id`) REFERENCES `luot_tra_gia` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_de_nghi_nguoi_yeu_cau` FOREIGN KEY (`nguoi_yeu_cau_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_second_chance_auction` FOREIGN KEY (`phien_dau_gia_id`) REFERENCES `phien_dau_gia` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_second_chance_bidder` FOREIGN KEY (`nguoi_tra_gia_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_second_chance_original_order` FOREIGN KEY (`don_hang_goc_id`) REFERENCES `don_hang` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_second_chance_result_order` FOREIGN KEY (`don_hang_moi_id`) REFERENCES `don_hang` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `tranh_chap`
  ADD CONSTRAINT `fk_dispute_admin` FOREIGN KEY (`nguoi_xu_ly_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dispute_opened_by` FOREIGN KEY (`nguoi_mo_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dispute_order` FOREIGN KEY (`don_hang_id`) REFERENCES `don_hang` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `tep_dinh_kem`
  ADD CONSTRAINT `fk_tep_kiem_dinh` FOREIGN KEY (`kiem_dinh_san_pham_id`) REFERENCES `kiem_dinh_san_pham` (`id`),
  ADD CONSTRAINT `fk_tep_nguoi_tai` FOREIGN KEY (`nguoi_tai_len_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tep_san_pham` FOREIGN KEY (`san_pham_id`) REFERENCES `san_pham` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_tep_tranh_chap` FOREIGN KEY (`tranh_chap_id`) REFERENCES `tranh_chap` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `danh_gia`
  ADD CONSTRAINT `fk_review_order` FOREIGN KEY (`don_hang_id`) REFERENCES `don_hang` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_review_reviewee` FOREIGN KEY (`nguoi_duoc_danh_gia_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_review_reviewer` FOREIGN KEY (`nguoi_danh_gia_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `yeu_cau_xu_ly`
  ADD CONSTRAINT `fk_yeu_cau_nguoi_duyet` FOREIGN KEY (`nguoi_duyet_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_yeu_cau_nguoi_gui` FOREIGN KEY (`nguoi_yeu_cau_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_yeu_cau_phien` FOREIGN KEY (`phien_dau_gia_id`) REFERENCES `phien_dau_gia` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_yeu_cau_san_pham` FOREIGN KEY (`san_pham_id`) REFERENCES `san_pham` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `vi_pham`
  ADD CONSTRAINT `fk_vi_pham_nguoi_xu_ly` FOREIGN KEY (`nguoi_xu_ly_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_violation_auction` FOREIGN KEY (`phien_dau_gia_id`) REFERENCES `phien_dau_gia` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_violation_created_by` FOREIGN KEY (`nguoi_tao_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_violation_order` FOREIGN KEY (`don_hang_id`) REFERENCES `don_hang` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_violation_user` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `thong_bao`
  ADD CONSTRAINT `fk_notification_user` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `cau_hinh_he_thong`
  ADD CONSTRAINT `fk_system_config_admin` FOREIGN KEY (`nguoi_cap_nhat_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `nhat_ky_hoat_dong`
  ADD CONSTRAINT `fk_audit_actor` FOREIGN KEY (`nguoi_thuc_hien_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_nhat_ky_luot` FOREIGN KEY (`luot_tra_gia_id`) REFERENCES `luot_tra_gia` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_nhat_ky_phien` FOREIGN KEY (`phien_dau_gia_id`) REFERENCES `phien_dau_gia` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

DELIMITER $$

CREATE TRIGGER `trg_cam_ket_co_coc_sua` BEFORE UPDATE ON `tham_gia_phien` FOR EACH ROW BEGIN
  IF NEW.gia_toi_da IS NOT NULL AND (NOT (NEW.gia_toi_da <=> OLD.gia_toi_da) OR NEW.nguoi_dung_id <> OLD.nguoi_dung_id OR NEW.phien_dau_gia_id <> OLD.phien_dau_gia_id) AND EXISTS (
    SELECT 1 FROM phien_dau_gia a WHERE a.id = NEW.phien_dau_gia_id AND a.yeu_cau_dat_coc = 1
  ) AND NOT EXISTS (
    SELECT 1 FROM dat_coc_dau_gia c WHERE c.phien_dau_gia_id = NEW.phien_dau_gia_id
      AND c.nguoi_dung_id = NEW.nguoi_dung_id AND c.trang_thai = 'DA_DAT_COC'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Can coc hop le truoc khi thay doi cam ket';
  END IF;
END$$

CREATE TRIGGER `trg_cam_ket_co_coc_them` BEFORE INSERT ON `tham_gia_phien` FOR EACH ROW BEGIN
  IF NEW.gia_toi_da IS NOT NULL  AND EXISTS (
    SELECT 1 FROM phien_dau_gia a WHERE a.id = NEW.phien_dau_gia_id AND a.yeu_cau_dat_coc = 1
  ) AND NOT EXISTS (
    SELECT 1 FROM dat_coc_dau_gia c WHERE c.phien_dau_gia_id = NEW.phien_dau_gia_id
      AND c.nguoi_dung_id = NEW.nguoi_dung_id AND c.trang_thai = 'DA_DAT_COC'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Can coc hop le truoc khi thay doi cam ket';
  END IF;
END$$

CREATE TRIGGER `trg_cam_tu_dat_gia_toi_da` BEFORE INSERT ON `tham_gia_phien` FOR EACH ROW BEGIN
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

CREATE TRIGGER `trg_cam_tu_dat_gia_toi_da_sua` BEFORE UPDATE ON `tham_gia_phien` FOR EACH ROW BEGIN
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

CREATE TRIGGER `trg_cam_tu_tra_gia` BEFORE INSERT ON `luot_tra_gia` FOR EACH ROW BEGIN
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

CREATE TRIGGER `trg_cam_tu_tra_gia_sua` BEFORE UPDATE ON `luot_tra_gia` FOR EACH ROW BEGIN
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

CREATE TRIGGER `trg_coc_hop_le_sua` BEFORE UPDATE ON `dat_coc_dau_gia` FOR EACH ROW BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM phien_dau_gia a JOIN san_pham s ON s.id = a.san_pham_id
    WHERE a.id = NEW.phien_dau_gia_id AND a.yeu_cau_dat_coc = 1
      AND a.so_tien_dat_coc = NEW.so_tien AND s.nguoi_ban_id <> NEW.nguoi_dung_id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Coc khong khop phien hoac la nguoi ban';
  END IF;
  IF NEW.don_hang_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM don_hang d WHERE d.id = NEW.don_hang_id
      AND d.phien_dau_gia_id = NEW.phien_dau_gia_id AND d.nguoi_mua_id = NEW.nguoi_dung_id
      AND d.gia_san_pham >= NEW.so_tien
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Coc phai gan dung don va nguoi mua';
  END IF;
END$$

CREATE TRIGGER `trg_coc_hop_le_them` BEFORE INSERT ON `dat_coc_dau_gia` FOR EACH ROW BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM phien_dau_gia a JOIN san_pham s ON s.id = a.san_pham_id
    WHERE a.id = NEW.phien_dau_gia_id AND a.yeu_cau_dat_coc = 1
      AND a.so_tien_dat_coc = NEW.so_tien AND s.nguoi_ban_id <> NEW.nguoi_dung_id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Coc khong khop phien hoac la nguoi ban';
  END IF;
  IF NEW.don_hang_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM don_hang d WHERE d.id = NEW.don_hang_id
      AND d.phien_dau_gia_id = NEW.phien_dau_gia_id AND d.nguoi_mua_id = NEW.nguoi_dung_id
      AND d.gia_san_pham >= NEW.so_tien
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Coc phai gan dung don va nguoi mua';
  END IF;
END$$

CREATE TRIGGER `trg_de_nghi_gia_cong_khai` BEFORE INSERT ON `de_nghi_mua_tiep_theo` FOR EACH ROW BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM luot_tra_gia l JOIN phien_dau_gia p ON p.id=l.phien_dau_gia_id
        WHERE l.id=NEW.luot_tra_gia_nguon_id AND l.phien_dau_gia_id=NEW.phien_dau_gia_id
          AND l.nguoi_tra_gia_id=NEW.nguoi_tra_gia_id AND l.so_tien=NEW.gia_de_nghi
          AND l.ngay_tao>=p.thoi_gian_bat_dau AND l.ngay_tao<=p.thoi_gian_ket_thuc
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Giá đề nghị phải khớp lượt công khai hợp lệ';
    END IF;
END$$

CREATE TRIGGER `trg_de_nghi_gia_cong_khai_sua` BEFORE UPDATE ON `de_nghi_mua_tiep_theo` FOR EACH ROW BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM luot_tra_gia l JOIN phien_dau_gia p ON p.id=l.phien_dau_gia_id
        WHERE l.id=NEW.luot_tra_gia_nguon_id AND l.phien_dau_gia_id=NEW.phien_dau_gia_id
          AND l.nguoi_tra_gia_id=NEW.nguoi_tra_gia_id AND l.so_tien=NEW.gia_de_nghi
          AND l.ngay_tao>=p.thoi_gian_bat_dau AND l.ngay_tao<=p.thoi_gian_ket_thuc
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Giá đề nghị phải khớp lượt công khai hợp lệ';
    END IF;
END$$

CREATE TRIGGER `trg_phien_kiem_dinh_sua` BEFORE UPDATE ON `phien_dau_gia` FOR EACH ROW BEGIN
  IF NEW.trang_thai IN ('DA_LEN_LICH', 'HOAT_DONG') AND EXISTS (
    SELECT 1 FROM san_pham s WHERE s.id = NEW.san_pham_id AND s.bat_buoc_kiem_dinh = 1
  ) AND NOT EXISTS (
    SELECT 1 FROM kiem_dinh_san_pham k WHERE k.san_pham_id = NEW.san_pham_id
      AND k.ket_qua = 'DAT' AND k.trang_thai = 'DANG_LUU_GIU' AND k.ngay_roi_trung_tam IS NULL
      AND k.lan_kiem_dinh = (SELECT MAX(m.lan_kiem_dinh) FROM kiem_dinh_san_pham m WHERE m.san_pham_id = NEW.san_pham_id)
      AND EXISTS (SELECT 1 FROM tep_dinh_kem t WHERE t.kiem_dinh_san_pham_id = k.id AND t.loai_tep = 'BAO_CAO_KIEM_DINH')
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'San pham chua kiem dinh dat hoac trung tam khong giu hang';
  END IF;
END$$

CREATE TRIGGER `trg_phien_kiem_dinh_them` BEFORE INSERT ON `phien_dau_gia` FOR EACH ROW BEGIN
  IF NEW.trang_thai IN ('DA_LEN_LICH', 'HOAT_DONG') AND EXISTS (
    SELECT 1 FROM san_pham s WHERE s.id = NEW.san_pham_id AND s.bat_buoc_kiem_dinh = 1
  ) AND NOT EXISTS (
    SELECT 1 FROM kiem_dinh_san_pham k WHERE k.san_pham_id = NEW.san_pham_id
      AND k.ket_qua = 'DAT' AND k.trang_thai = 'DANG_LUU_GIU' AND k.ngay_roi_trung_tam IS NULL
      AND k.lan_kiem_dinh = (SELECT MAX(m.lan_kiem_dinh) FROM kiem_dinh_san_pham m WHERE m.san_pham_id = NEW.san_pham_id)
      AND EXISTS (SELECT 1 FROM tep_dinh_kem t WHERE t.kiem_dinh_san_pham_id = k.id AND t.loai_tep = 'BAO_CAO_KIEM_DINH')
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'San pham chua kiem dinh dat hoac trung tam khong giu hang';
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

-- Chỉ dữ liệu cấu hình công khai, không tạo tài khoản/mật khẩu mẫu.
-- Cấu hình cho database mới, không chèn lại vào database đang sử dụng.
USE doan4_daugia;

INSERT INTO cau_hinh_he_thong (khoa_cau_hinh, gia_tri_cau_hinh, kieu_du_lieu, mo_ta) VALUES
('PAYMENT_DEADLINE_HOURS', '48', 'SO', 'Hạn thanh toán mô phỏng, tính bằng giờ'),
('SELLER_SHIP_DEADLINE_DAYS', '3', 'SO', 'Hạn khai báo gửi hàng, tính bằng ngày 24 giờ'),
('BUYER_INSPECTION_DAYS', '3', 'SO', 'Thời gian kiểm tra kể từ xác nhận nhận hàng'),
('ANTI_SNIPE_THRESHOLD_SECONDS', '60', 'SO', 'Cửa sổ nhận giá kích hoạt gia hạn'),
('ANTI_SNIPE_EXTENSION_SECONDS', '90', 'SO', 'Cộng thêm vào giờ kết thúc hiện tại'),
('SECOND_CHANCE_EXPIRE_HOURS', '24', 'SO', 'Hạn phản hồi đề nghị do người bán yêu cầu'),
('BUYER_NON_RECEIPT_DAYS', '7', 'SO', 'Mốc khiếu nại chưa nhận tính từ khai báo gửi'),
('BUOC_GIA', '[{"gia_tu":"0.00","gia_den":"999999.99","muc_tang_gia":"10000.00"},{"gia_tu":"1000000.00","gia_den":"9999999.99","muc_tang_gia":"100000.00"},{"gia_tu":"10000000.00","gia_den":"99999999.99","muc_tang_gia":"500000.00"},{"gia_tu":"100000000.00","gia_den":null,"muc_tang_gia":"1000000.00"}]', 'JSON', 'Bộ bước giá minh họa. Backend kiểm tra khoảng liên tục và khóa khi có phiên chờ/hoạt động');

INSERT INTO danh_muc (ten, duong_dan, cau_hinh_thuoc_tinh, thu_tu) VALUES
('Điện tử', 'dien-tu', '[{"khoa":"thuong_hieu","ten":"Thương hiệu","kieu":"VAN_BAN","bat_buoc":true},{"khoa":"dung_luong","ten":"Dung lượng","kieu":"SO","don_vi":"GB","bat_buoc":false}]', 1),
('Đồng hồ', 'dong-ho', '[{"khoa":"loai_may","ten":"Loại máy","kieu":"LUA_CHON","lua_chon":["Cơ","Quartz","Thông minh"],"bat_buoc":true}]', 2),
('Thời trang', 'thoi-trang', NULL, 3),
('Đồ sưu tầm', 'do-suu-tam', NULL, 4),
('Gia dụng', 'gia-dung', NULL, 5);

INSERT INTO cau_hinh_he_thong (khoa_cau_hinh, gia_tri_cau_hinh, kieu_du_lieu, mo_ta) VALUES
  ('DEPOSIT_POLICY', '{"bat":false,"kieu":"TY_LE","gia_tri":10}', 'JSON', 'Admin cấu hình rồi bật; chỉ áp dụng phiên mới');
