-- Nâng cấp tại chỗ từ 19 bảng; công cụ áp dụng chọn đúng schema và sao lưu trước.
-- Không chạy lại sau khi đã hoàn thành. DDL MySQL tự commit từng lệnh.

ALTER TABLE danh_muc
  ADD COLUMN yeu_cau_kiem_dinh TINYINT(1) NOT NULL DEFAULT 0,
  ADD CONSTRAINT ck_danh_muc_kiem_dinh CHECK (yeu_cau_kiem_dinh IN (0, 1));

ALTER TABLE san_pham
  ADD COLUMN bat_buoc_kiem_dinh TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN ngay_chup_chinh_sach_kiem_dinh DATETIME NULL,
  ADD CONSTRAINT ck_san_pham_kiem_dinh CHECK (bat_buoc_kiem_dinh IN (0, 1));

ALTER TABLE phien_dau_gia
  ADD COLUMN yeu_cau_dat_coc TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN so_tien_dat_coc DECIMAL(15,2) NULL,
  ADD CONSTRAINT ck_phien_dat_coc CHECK (
    (yeu_cau_dat_coc = 0 AND so_tien_dat_coc IS NULL) OR
    (yeu_cau_dat_coc = 1 AND so_tien_dat_coc IS NOT NULL
      AND so_tien_dat_coc > 0 AND so_tien_dat_coc <= gia_khoi_diem)
  );

CREATE TABLE kiem_dinh_san_pham (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ma_kiem_dinh VARCHAR(60) NOT NULL UNIQUE,
  san_pham_id BIGINT UNSIGNED NOT NULL,
  lan_kiem_dinh INT NOT NULL DEFAULT 1,
  trang_thai ENUM(
    'CHO_GUI_TRUNG_TAM', 'DANG_VAN_CHUYEN_DEN_TRUNG_TAM', 'DA_NHAN_TAI_TRUNG_TAM',
    'DANG_KIEM_DINH', 'CAN_BO_SUNG', 'DA_KIEM_DINH_DAT', 'KIEM_DINH_KHONG_DAT',
    'DANG_LUU_GIU', 'DA_TRA_NGUOI_BAN'
  ) NOT NULL DEFAULT 'CHO_GUI_TRUNG_TAM',
  ngay_gui_trung_tam DATETIME NULL,
  don_vi_gui_trung_tam VARCHAR(100) NULL,
  ma_van_don_den_trung_tam VARCHAR(100) NULL,
  ngay_nhan_trung_tam DATETIME NULL,
  tinh_trang_khi_nhan TEXT NULL,
  serial_khi_nhan VARCHAR(150) NULL,
  so_kien INT NULL,
  ghi_chu_tiep_nhan TEXT NULL,
  ten_chuyen_gia VARCHAR(150) NULL,
  don_vi_kiem_dinh VARCHAR(200) NULL,
  ngay_kiem_dinh DATETIME NULL,
  ket_qua ENUM('CHO_KET_QUA', 'DAT', 'KHONG_DAT', 'CAN_BO_SUNG') NOT NULL DEFAULT 'CHO_KET_QUA',
  nhan_xet TEXT NULL,
  ma_chung_nhan VARCHAR(150) NULL,
  ngay_tra_nguoi_ban DATETIME NULL,
  ly_do_tra VARCHAR(1000) NULL,
  ngay_roi_trung_tam DATETIME NULL,
  nguoi_cap_nhat_id BIGINT UNSIGNED NULL,
  ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_kiem_dinh_lan (san_pham_id, lan_kiem_dinh),
  CONSTRAINT fk_kiem_dinh_san_pham FOREIGN KEY (san_pham_id) REFERENCES san_pham(id),
  CONSTRAINT fk_kiem_dinh_nguoi_cap_nhat FOREIGN KEY (nguoi_cap_nhat_id) REFERENCES nguoi_dung(id),
  CONSTRAINT ck_kiem_dinh_lan CHECK (lan_kiem_dinh > 0),
  CONSTRAINT ck_kiem_dinh_so_kien CHECK (so_kien IS NULL OR so_kien > 0),
  CONSTRAINT ck_kiem_dinh_dat CHECK (
    trang_thai NOT IN ('DA_KIEM_DINH_DAT', 'DANG_LUU_GIU') OR
    (ket_qua = 'DAT' AND ngay_nhan_trung_tam IS NOT NULL AND ngay_kiem_dinh IS NOT NULL
      AND ten_chuyen_gia IS NOT NULL AND don_vi_kiem_dinh IS NOT NULL)
  ),
  INDEX idx_kiem_dinh_hang_doi (trang_thai, ngay_tao)
) ENGINE=InnoDB;

ALTER TABLE don_hang
  ADD COLUMN tien_coc_da_chuyen DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN so_tien_con_phai_thanh_toan DECIMAL(15,2)
    GENERATED ALWAYS AS (tong_tien - so_tien_da_thu) STORED,
  ADD COLUMN nguon_gui_hang ENUM('NGUOI_BAN', 'TRUNG_TAM') NOT NULL DEFAULT 'NGUOI_BAN',
  ADD COLUMN kiem_dinh_san_pham_id BIGINT UNSIGNED NULL,
  ADD CONSTRAINT fk_don_kiem_dinh FOREIGN KEY (kiem_dinh_san_pham_id) REFERENCES kiem_dinh_san_pham(id),
  ADD CONSTRAINT ck_don_nguon_gui CHECK (
    (nguon_gui_hang = 'NGUOI_BAN' AND kiem_dinh_san_pham_id IS NULL) OR
    (nguon_gui_hang = 'TRUNG_TAM' AND kiem_dinh_san_pham_id IS NOT NULL)
  ),
  ADD CONSTRAINT ck_don_coc CHECK (
    tien_coc_da_chuyen >= 0 AND tien_coc_da_chuyen <= gia_san_pham
    AND so_tien_da_thu >= tien_coc_da_chuyen AND so_tien_da_thu <= tong_tien
  ),
  DROP CHECK ck_don_tien_thu,
  ADD CONSTRAINT ck_don_tien_thu CHECK (
    so_tien_da_thu = 0 OR so_tien_da_thu = tien_coc_da_chuyen OR so_tien_da_thu = tong_tien
  );

CREATE TABLE dat_coc_dau_gia (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  phien_dau_gia_id BIGINT UNSIGNED NOT NULL,
  nguoi_dung_id BIGINT UNSIGNED NOT NULL,
  don_hang_id BIGINT UNSIGNED NULL,
  so_tien DECIMAL(15,2) NOT NULL,
  phuong_thuc ENUM('MO_PHONG') NOT NULL DEFAULT 'MO_PHONG',
  trang_thai ENUM(
    'CHO_THANH_TOAN', 'DA_DAT_COC', 'THAT_BAI', 'DA_HOAN_COC',
    'DA_CHUYEN_VAO_DON', 'KHONG_HOAN_COC', 'HET_HAN'
  ) NOT NULL DEFAULT 'CHO_THANH_TOAN',
  ma_giao_dich VARCHAR(100) NULL UNIQUE,
  khoa_yeu_cau VARCHAR(100) NULL UNIQUE,
  ngay_dat_coc DATETIME NULL,
  ngay_hoan DATETIME NULL,
  ngay_chuyen_vao_don DATETIME NULL,
  ngay_khong_hoan DATETIME NULL,
  ly_do_xu_ly VARCHAR(1000) NULL,
  ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_coc_nguoi_phien (phien_dau_gia_id, nguoi_dung_id),
  UNIQUE KEY uq_coc_don (don_hang_id),
  CONSTRAINT fk_coc_phien FOREIGN KEY (phien_dau_gia_id) REFERENCES phien_dau_gia(id),
  CONSTRAINT fk_coc_nguoi FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id),
  CONSTRAINT fk_coc_don FOREIGN KEY (don_hang_id) REFERENCES don_hang(id),
  CONSTRAINT ck_coc_so_tien CHECK (so_tien > 0),
  CONSTRAINT ck_coc_da_thu CHECK (
    trang_thai IN ('CHO_THANH_TOAN', 'THAT_BAI', 'HET_HAN') OR ngay_dat_coc IS NOT NULL
  ),
  CONSTRAINT ck_coc_gan_don CHECK (
    (trang_thai IN ('DA_CHUYEN_VAO_DON', 'KHONG_HOAN_COC') AND don_hang_id IS NOT NULL
      AND ngay_chuyen_vao_don IS NOT NULL) OR
    (trang_thai NOT IN ('DA_CHUYEN_VAO_DON', 'KHONG_HOAN_COC') AND don_hang_id IS NULL)
  ),
  CONSTRAINT ck_coc_hoan CHECK (trang_thai <> 'DA_HOAN_COC' OR ngay_hoan IS NOT NULL),
  CONSTRAINT ck_coc_khong_hoan CHECK (trang_thai <> 'KHONG_HOAN_COC' OR ngay_khong_hoan IS NOT NULL),
  INDEX idx_coc_phien_trang_thai (phien_dau_gia_id, trang_thai)
) ENGINE=InnoDB;

ALTER TABLE tep_dinh_kem
  ADD COLUMN kiem_dinh_san_pham_id BIGINT UNSIGNED NULL,
  MODIFY COLUMN loai_tep ENUM(
    'ANH_SAN_PHAM', 'BANG_CHUNG_TRANH_CHAP', 'BIEN_BAN_TIEP_NHAN',
    'BAO_CAO_KIEM_DINH', 'CHUNG_NHAN_KIEM_DINH'
  ) NOT NULL,
  ADD CONSTRAINT fk_tep_kiem_dinh FOREIGN KEY (kiem_dinh_san_pham_id) REFERENCES kiem_dinh_san_pham(id),
  DROP CHECK ck_tep_doi_tuong,
  ADD CONSTRAINT ck_tep_doi_tuong CHECK (
    (loai_tep = 'ANH_SAN_PHAM' AND san_pham_id IS NOT NULL AND tranh_chap_id IS NULL
      AND kiem_dinh_san_pham_id IS NULL AND loai_noi_dung = 'HINH_ANH') OR
    (loai_tep = 'BANG_CHUNG_TRANH_CHAP' AND tranh_chap_id IS NOT NULL AND san_pham_id IS NULL
      AND kiem_dinh_san_pham_id IS NULL AND la_anh_chinh = 0) OR
    (loai_tep IN ('BIEN_BAN_TIEP_NHAN', 'BAO_CAO_KIEM_DINH', 'CHUNG_NHAN_KIEM_DINH')
      AND kiem_dinh_san_pham_id IS NOT NULL AND san_pham_id IS NULL
      AND tranh_chap_id IS NULL AND la_anh_chinh = 0)
  );

ALTER TABLE tranh_chap
  MODIFY COLUMN ly_do ENUM(
    'CHUA_NHAN_HANG', 'KHONG_DUNG_MO_TA', 'HONG_HOC', 'HANG_GIA', 'KHAC',
    'KHONG_KHOP_HO_SO_KIEM_DINH', 'NGHI_NGO_TINH_XAC_THUC', 'THIEU_PHU_KIEN'
  ) NOT NULL;

ALTER TABLE nhat_ky_hoat_dong
  ADD COLUMN ma_yeu_cau VARCHAR(150) NULL,
  ADD UNIQUE KEY uq_nhat_ky_yeu_cau (ma_yeu_cau);

INSERT INTO cau_hinh_he_thong (khoa_cau_hinh, gia_tri_cau_hinh, kieu_du_lieu, mo_ta)
VALUES ('DEPOSIT_POLICY', '{"bat":false,"kieu":"TY_LE","gia_tri":10}', 'JSON',
  'Admin bật chính sách cọc cho phiên mới, snapshot số tiền theo giá khởi điểm');
