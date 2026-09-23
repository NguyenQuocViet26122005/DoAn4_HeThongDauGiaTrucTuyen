# Cơ sở dữ liệu đấu giá — 19 bảng

Ngày 23/09/2026, database chính `doan4_daugia` đã chuyển từ 27 xuống **19 bảng InnoDB**, có **46 khóa ngoại, 6 trigger và 2 view**. Backend đã được đồng bộ. Các ID và cột lịch sử còn sử dụng được giữ nguyên; 11 nhóm dữ liệu gộp đã được đối chiếu với bản sao cũ.

## Các phép gộp

- `don_hang` lưu luôn giữ tiền và một lượt vận chuyển: tiền thu/hoàn/giải ngân, thời hạn, đơn vị, mã vận đơn và các ngày xử lý.
- `tham_gia_phien` lưu theo dõi và cam kết tối đa. Chỉ bản ghi có `gia_toi_da` mới là người tham gia đấu giá. Bỏ theo dõi không xóa cam kết. API không trả cam kết bí mật.
- `tep_dinh_kem` lưu ảnh sản phẩm hoặc bằng chứng tranh chấp, có loại tệp và khóa ngoại riêng. Bằng chứng vẫn cần quyền truy cập.
- `yeu_cau_xu_ly` lưu yêu cầu hủy và hỗ trợ loại báo cáo sản phẩm. API báo cáo sản phẩm chưa triển khai trong đợt chuyển schema này.
- `danh_muc.cau_hinh_thuoc_tinh` và `san_pham.thuoc_tinh_json` chứa cấu hình/giá trị thuộc tính; backend kiểm tra kiểu, danh mục và trường bắt buộc.
- `cau_hinh_he_thong`, khóa `BUOC_GIA`, lưu bộ khoảng bước giá. Không đổi bộ bước khi còn phiên chờ hoặc đang chạy.
- `nhat_ky_hoat_dong`, hành động `GIA_HAN_PHIEN`, lưu từng lần gia hạn với khóa ngoại phiên/lượt giá và thời gian cũ/mới.

Giảm bảng không đồng nghĩa bỏ quan hệ nghiệp vụ hoặc bảo đảm truy vấn nhanh hơn. Sơ đồ dễ đọc chủ yếu nhờ chia theo nhóm, thay vì đưa mọi cột và đường nối vào một trang.

## Tệp sử dụng

- `../doan4_daugia_tieng_viet.sql`: khởi tạo **mới** `doan4_daugia` với 19 bảng và cấu hình công khai, không tài khoản/mật khẩu mẫu, không lệnh xóa database. Máy hiện tại đã chuyển xong, không cần chạy lại.
- `01-tao-csdl-19-bang.sql`: cùng cấu trúc, dùng tên database thiết kế để thử riêng.
- `02-du-lieu-cau-hinh.sql`: cấu hình và danh mục minh họa của bản thiết kế.
- `trang-thai-chuyen-doi.json`: thời điểm, tên bản sao và dấu vân tay đối chiếu; không chứa dữ liệu tài khoản hoặc mức cam kết.
- `lich-su/cau-truc-27-bang.sql`: chỉ DDL cũ để sinh lại thiết kế; không phải bản sao dữ liệu.
- `cong-cu/chuyen-du-lieu.cjs`: chuyển một lần, kiểm tra bản sao/nguồn/đích trước khi thay bảng. Trạng thái đã áp dụng ngăn chạy lại.
- `so-do-19-bang.drawio`: sơ đồ có 7 trang; `so-do-csdl.html` là bản xem trong trình duyệt.

## Xem diagram trong MySQL Workbench

1. Refresh mục **Schemas**, chọn `doan4_daugia` và mở **Tables**: có 19 bảng.
2. Chọn **Database → Reverse Engineer**, chọn kết nối hiện tại và schema `doan4_daugia`.
3. Hoàn tất wizard để tạo model. Lưu model thành tệp `.mwb` trên máy.
4. Trong model, dùng **Add Diagram** tạo các trang nhỏ. Kéo các bảng cần thiết từ **Catalog** vào từng trang; thêm bảng tham chiếu trên trang khác không tạo thêm bảng trong MySQL.
5. Chia theo tài khoản, sản phẩm, đấu giá, giao dịch, hậu mãi, yêu cầu và hỗ trợ; tham khảo 7 trang trong tệp draw.io. Thu gọn phần cột không cần trình bày và bố trí bảng cha quanh bảng nghiệp vụ.

Sơ đồ cũ không tự đổi sau migration; tạo model mới hoặc reverse engineer lại để tránh nhìn nhầm 27 bảng cũ.

## Kiểm thử và vận hành

`npm run check:schema` trong `backend` chỉ đọc CSDL được cấu hình, kiểm tra đủ 19 bảng, cột và InnoDB. `npm run test:integration` và `npm run test:api` luôn dùng database riêng `doan4_daugia_kiem_thu_19`, không sửa `.env`.

Database kiểm thử có thể được dọn sau kiểm tra. Khi cần chạy lại, tạo bằng công cụ tạo CSDL kiểm thử; không đổi `.env` sang database kiểm thử. Backend thường chạy bằng `npm run dev` trong `backend`, cổng mặc định 5000.

Phạm vi chưa hoàn thiện trong đợt này: giao diện đầy đủ, API báo cáo sản phẩm và quy trình đăng lại sau khi hết Second Chance. Không coi việc có cột/bảng hỗ trợ là các màn hình hoặc API này đã làm xong.
