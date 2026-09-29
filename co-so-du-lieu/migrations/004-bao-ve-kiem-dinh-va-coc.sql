-- Bao ve o CSDL, bo sung cho transaction va phan quyen backend.
DELIMITER $$

CREATE TRIGGER trg_coc_hop_le_them BEFORE INSERT ON dat_coc_dau_gia
FOR EACH ROW
BEGIN
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

CREATE TRIGGER trg_phien_kiem_dinh_them BEFORE INSERT ON phien_dau_gia
FOR EACH ROW
BEGIN
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

CREATE TRIGGER trg_cam_ket_co_coc_them BEFORE INSERT ON tham_gia_phien
FOR EACH ROW
BEGIN
  IF NEW.gia_toi_da IS NOT NULL  AND EXISTS (
    SELECT 1 FROM phien_dau_gia a WHERE a.id = NEW.phien_dau_gia_id AND a.yeu_cau_dat_coc = 1
  ) AND NOT EXISTS (
    SELECT 1 FROM dat_coc_dau_gia c WHERE c.phien_dau_gia_id = NEW.phien_dau_gia_id
      AND c.nguoi_dung_id = NEW.nguoi_dung_id AND c.trang_thai = 'DA_DAT_COC'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Can coc hop le truoc khi thay doi cam ket';
  END IF;
END$$

CREATE TRIGGER trg_coc_hop_le_sua BEFORE UPDATE ON dat_coc_dau_gia
FOR EACH ROW
BEGIN
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

CREATE TRIGGER trg_phien_kiem_dinh_sua BEFORE UPDATE ON phien_dau_gia
FOR EACH ROW
BEGIN
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

CREATE TRIGGER trg_cam_ket_co_coc_sua BEFORE UPDATE ON tham_gia_phien
FOR EACH ROW
BEGIN
  IF NEW.gia_toi_da IS NOT NULL AND (NOT (NEW.gia_toi_da <=> OLD.gia_toi_da) OR NEW.nguoi_dung_id <> OLD.nguoi_dung_id OR NEW.phien_dau_gia_id <> OLD.phien_dau_gia_id) AND EXISTS (
    SELECT 1 FROM phien_dau_gia a WHERE a.id = NEW.phien_dau_gia_id AND a.yeu_cau_dat_coc = 1
  ) AND NOT EXISTS (
    SELECT 1 FROM dat_coc_dau_gia c WHERE c.phien_dau_gia_id = NEW.phien_dau_gia_id
      AND c.nguoi_dung_id = NEW.nguoi_dung_id AND c.trang_thai = 'DA_DAT_COC'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Can coc hop le truoc khi thay doi cam ket';
  END IF;
END$$

DELIMITER ;
