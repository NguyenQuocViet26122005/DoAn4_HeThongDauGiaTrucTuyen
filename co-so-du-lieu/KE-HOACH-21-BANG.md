# Nâng cấp 19 → 21 bảng: kiểm định và đặt cọc

## Đối chiếu trước thay đổi — 25/09/2026

Tại thời điểm đối chiếu ban đầu, `doan4_daugia` có 19 bảng, 46 khóa ngoại, 6 trigger và 2 view. Bản sao 27 bảng trước đây đã được lưu riêng và thử phục hồi. Bốn CSDL phụ cũ đã được dọn; chỉ tạo CSDL kiểm thử tạm trong quá trình nâng cấp rồi dọn khi hoàn tất.

Code nguồn là TypeScript/Express/Zod. Nghiệp vụ nằm trong `backend/src/services`, truy vấn trong `repositories`, schema đầu vào trong `validations`; SQL khởi tạo chính là `doan4_daugia_tieng_viet.sql`.

Các khác biệt cần sửa:

- Mua ngay chốt phiên và tạo đơn chưa trả tiền. Yêu cầu mới cần thanh toán thành công trong cùng giao dịch trước khi chốt; thất bại giữ phiên còn hiệu lực.
- Second Chance đang tạo đơn chờ thanh toán khi chấp nhận. Yêu cầu mới cần thanh toán đủ ngay, không đặt cọc lại.
- Chưa có kiểm định vật lý, biên bản nhận hàng hoặc trung tâm lưu giữ. Xác minh seller chỉ xác nhận danh tính.
- Đơn chỉ cho thu 0 hoặc toàn bộ tiền; ràng buộc này cần cho phép khoản cọc đã chuyển vào đơn, vẫn giữ đúng đối soát tiền.
- Vận chuyển chỉ cho seller khai báo. Hàng đang ở trung tâm cần Admin ghi nhận gửi, không mặc định quy lỗi cho seller khi trung tâm gửi muộn.
- Tranh chấp còn nhận `HANG_GIA`. Giữ giá trị cũ trong MySQL nhưng API mới chỉ nhận các lý do mới.
- Tác vụ hoàn tất cần kiểm tra cả cờ cần Admin xử lý trước khi giải ngân.

## Phạm vi tệp

- SQL migration trong `migrations`; bản sao riêng và công cụ áp dụng/đối chiếu trong `cong-cu`.
- Thêm `services`, `repositories`, `validations`, `controllers`, `routes` cho kiểm định và đặt cọc.
- Sửa dịch vụ danh mục/sản phẩm, đấu giá, đơn hàng, đề nghị mua tiếp, tranh chấp, tải tệp, cấu hình; đồng bộ kiểu, đầu ra công khai, kiểm tra schema và jobs.
- Cập nhật kiểm thử tích hợp, hợp đồng API, SQL khởi tạo, mô hình/sơ đồ và tài liệu nghiệp vụ chính.
- Không triển khai giao diện đầy đủ trong đợt backend này; ghi rõ hợp đồng để frontend làm tiếp.

## Migration và bảo toàn dữ liệu

1. Xuất bản sao riêng của **19 bảng hiện tại**, gồm DDL, dữ liệu, view, trigger và SHA-256; không đọc `.env` ra màn hình.
2. Thử migration trên CSDL kiểm thử trước. So sánh toàn bộ cột cũ bằng dấu vân tay, không chỉ đếm dòng.
3. Thêm `kiem_dinh_san_pham`, `dat_coc_dau_gia`; thêm cột với giá trị mặc định tương thích, không reset và không xóa bảng lịch sử.
4. Mở rộng enum tranh chấp/tệp, thay ràng buộc tiền bằng ràng buộc có khoản cọc; giữ `HANG_GIA` và hoàn một phần ở lịch sử cũ.
5. Giữ tên `han_nguoi_ban_gui_hang` để tránh phá tham chiếu; tài liệu giải thích đây là hạn gửi hàng theo `nguon_gui_hang`.
6. Bật backend mới sau khi schema/test đạt. MySQL DDL tự commit: công cụ lưu tiến độ để tiếp tục khi bị gián đoạn; không tuyên bố có thể rollback DDL bằng `ROLLBACK`.
7. Phục hồi an toàn bằng cách nhập bản sao vào CSDL mới và đối chiếu, không ghi đè dữ liệu chính. Sau khi có giao dịch mới, không tự hạ schema/xóa các bảng mới.

## Quy tắc tương thích

- Sản phẩm cũ có `bat_buoc_kiem_dinh = 0`; phiên cũ không yêu cầu cọc; đơn cũ có cọc 0, nguồn gửi `NGUOI_BAN`.
- Chính sách kiểm định được chụp khi gửi duyệt; thay danh mục không sửa ngược hồ sơ cũ. Không cho seller tự thay snapshot hoặc kết quả kiểm định.
- Chính sách cọc do Admin quản lý; số tiền được chụp vào phiên lúc tạo. Không lấy giá seller tự khai để quyết định có cần kiểm định.
- Cọc người thua/hủy/phiên thất bại được hoàn; cọc người thắng chuyển vào đơn. Khi đã trả đủ, hoàn tiền tranh chấp bao gồm cả cọc.
- Hết hạn trả phần còn lại: ghi cọc không hoàn và vi phạm chờ xét, không tự chuyển cọc cho seller.
- Không có ví hoặc tích hợp tiền thật. Không có actor chuyên gia trên website.

## Kiểm chứng

Giữ các kiểm thử quyền, trần giá bí mật, ưu tiên bằng trần và cạnh tranh nhiều kết nối. Bổ sung các ca kiểm định, cọc, hoàn/chuyển/không hoàn cọc, thanh toán Mua ngay/Second Chance, nguồn gửi trung tâm, cờ Admin và đối chiếu dữ liệu sau migration.

Trạng thái: đang triển khai; chưa dùng tài liệu này như bằng chứng đã nghiệm thu 21 bảng.

## Kết quả thực hiện — 25/09/2026

Đã áp dụng 21 bảng, 53 khóa ngoại, 12 trigger và 2 view trên doan4_daugia. Bản sao 19 bảng đã phục hồi thử và mọi cột/dòng cũ sau migration khớp dấu vân tay. DEPOSIT_POLICY mới mặc định tắt theo lựa chọn người dùng.

SQL khởi tạo mới đã dựng thành công CSDL kiểm thử riêng. Đối chiếu 322 cột khớp SQL; 29 ca ràng buộc MySQL, 17 kiểm thử đơn vị/HTTP và 54 kiểm thử tích hợp đạt. Hai bộ HTTP đối chiếu đủ 102 route. Sơ đồ chia 9 trang, đủ 53 khóa ngoại. Giao diện đầy đủ vẫn là công việc tiếp theo.
