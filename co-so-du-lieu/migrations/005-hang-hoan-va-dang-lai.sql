-- Bo sung tai cho, khong xoa bang hoac du lieu cu.
ALTER TABLE don_hang ADD COLUMN xu_ly_hang JSON NULL;
ALTER TABLE san_pham
  ADD COLUMN san_pham_goc_id BIGINT UNSIGNED NULL,
  ADD CONSTRAINT fk_san_pham_dang_lai FOREIGN KEY (san_pham_goc_id) REFERENCES san_pham(id);
