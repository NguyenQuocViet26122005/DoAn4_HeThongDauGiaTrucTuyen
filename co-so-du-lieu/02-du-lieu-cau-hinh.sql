-- Chỉ dữ liệu cấu hình công khai, không tạo tài khoản/mật khẩu mẫu.
-- Chạy sau 01-tao-csdl-19-bang.sql trên database thiết kế mới.
USE doan4_daugia_thiet_ke_19;

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
